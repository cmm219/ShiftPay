-- ============================================================
-- ShiftPay -- Migration 009: Posting Lifecycle and In-App Reminders
--
-- Phase 2A scope only:
--   - durable posting expiration/close/renew state
--   - owner-only lifecycle RPCs
--   - in-app posting reminder records
--   - scheduler-ready reminder generation
--
-- This migration intentionally does not modify payment, invoice,
-- subscription, Stripe webhook, payout, or ledger behavior.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Lifecycle columns
-- ────────────────────────────────────────────────────────────

ALTER TABLE openings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reposted_from_id UUID REFERENCES openings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lifecycle_version INTEGER NOT NULL DEFAULT 1;

UPDATE openings
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

ALTER TABLE openings
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '30 days'),
  ADD CONSTRAINT openings_lifecycle_version_positive CHECK (lifecycle_version > 0);

ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reposted_from_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS timezone TEXT;

CREATE INDEX IF NOT EXISTS idx_openings_active_lifecycle
  ON openings (restaurant_id, expires_at)
  WHERE is_active = TRUE AND closed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_openings_reposted_from_id
  ON openings (reposted_from_id);

CREATE INDEX IF NOT EXISTS idx_shifts_closed_at
  ON shifts (closed_at);

CREATE INDEX IF NOT EXISTS idx_shifts_reposted_from_id
  ON shifts (reposted_from_id);

-- ────────────────────────────────────────────────────────────
-- 2. Reminder enums and table
-- ────────────────────────────────────────────────────────────

CREATE TYPE posting_type AS ENUM ('opening', 'shift');
CREATE TYPE posting_reminder_recipient_role AS ENUM ('hiring_team', 'worker');
CREATE TYPE posting_reminder_threshold AS ENUM ('7_day', '3_day', '24_hour', 'expired');
CREATE TYPE posting_reminder_channel AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE posting_reminder_status AS ENUM ('queued', 'sent', 'skipped', 'failed', 'dismissed');

CREATE TABLE posting_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_type posting_type NOT NULL,
  posting_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_role posting_reminder_recipient_role NOT NULL DEFAULT 'hiring_team',
  threshold posting_reminder_threshold NOT NULL,
  channel posting_reminder_channel NOT NULL DEFAULT 'in_app',
  status posting_reminder_status NOT NULL DEFAULT 'queued',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  error_message TEXT,
  lifecycle_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (posting_type, posting_id, recipient_profile_id, threshold, channel, lifecycle_version),
  CHECK (lifecycle_version > 0)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON posting_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_posting_reminders_restaurant
  ON posting_reminders (restaurant_id, status, scheduled_for DESC);

CREATE INDEX idx_posting_reminders_recipient
  ON posting_reminders (recipient_profile_id, status, scheduled_for DESC);

CREATE INDEX idx_posting_reminders_posting
  ON posting_reminders (posting_type, posting_id, lifecycle_version);

ALTER TABLE posting_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posting reminders: hiring owner can read"
  ON posting_reminders FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    OR recipient_profile_id = auth.uid()
  );

CREATE POLICY "Posting reminders: hiring owner can dismiss"
  ON posting_reminders FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    OR recipient_profile_id = auth.uid()
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    OR recipient_profile_id = auth.uid()
  );

CREATE POLICY "Posting reminders: clients cannot insert"
  ON posting_reminders FOR INSERT
  TO anon, authenticated
  WITH CHECK (FALSE);

CREATE POLICY "Posting reminders: clients cannot delete"
  ON posting_reminders FOR DELETE
  TO anon, authenticated
  USING (FALSE);

-- ────────────────────────────────────────────────────────────
-- 3. Lifecycle helper functions
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION renew_opening(p_opening_id UUID)
RETURNS openings AS $$
DECLARE
  v_opening openings;
BEGIN
  SELECT o.* INTO v_opening
  FROM openings o
  JOIN restaurants r ON r.id = o.restaurant_id
  WHERE o.id = p_opening_id
    AND r.profile_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opening not found or not owned by current user';
  END IF;

  IF v_opening.closed_at IS NOT NULL OR v_opening.is_active = FALSE THEN
    RAISE EXCEPTION 'Closed openings cannot be renewed';
  END IF;

  IF v_opening.expires_at <= now() THEN
    RAISE EXCEPTION 'Expired openings must be reposted';
  END IF;

  UPDATE openings
  SET
    expires_at = GREATEST(expires_at, now()) + INTERVAL '30 days',
    renewed_at = now(),
    lifecycle_version = lifecycle_version + 1,
    updated_at = now()
  WHERE id = p_opening_id
  RETURNING * INTO v_opening;

  RETURN v_opening;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION close_opening(p_opening_id UUID)
RETURNS openings AS $$
DECLARE
  v_opening openings;
BEGIN
  SELECT o.* INTO v_opening
  FROM openings o
  JOIN restaurants r ON r.id = o.restaurant_id
  WHERE o.id = p_opening_id
    AND r.profile_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opening not found or not owned by current user';
  END IF;

  UPDATE openings
  SET
    closed_at = COALESCE(closed_at, now()),
    is_active = FALSE,
    updated_at = now()
  WHERE id = p_opening_id
  RETURNING * INTO v_opening;

  RETURN v_opening;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION close_shift(p_shift_id UUID)
RETURNS shifts AS $$
DECLARE
  v_shift shifts;
BEGIN
  SELECT s.* INTO v_shift
  FROM shifts s
  JOIN restaurants r ON r.id = s.restaurant_id
  WHERE s.id = p_shift_id
    AND r.profile_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found or not owned by current user';
  END IF;

  UPDATE shifts
  SET
    closed_at = COALESCE(closed_at, now()),
    updated_at = now()
  WHERE id = p_shift_id
  RETURNING * INTO v_shift;

  RETURN v_shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION dismiss_posting_reminder(p_reminder_id UUID)
RETURNS posting_reminders AS $$
DECLARE
  v_reminder posting_reminders;
BEGIN
  SELECT pr.* INTO v_reminder
  FROM posting_reminders pr
  WHERE pr.id = p_reminder_id
    AND (
      pr.recipient_profile_id = auth.uid()
      OR pr.restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reminder not found or not owned by current user';
  END IF;

  UPDATE posting_reminders
  SET
    status = 'dismissed',
    dismissed_at = now(),
    updated_at = now()
  WHERE id = p_reminder_id
  RETURNING * INTO v_reminder;

  RETURN v_reminder;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 4. Scheduler-ready in-app reminder generation
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION posting_reminder_threshold_for(p_expires_at TIMESTAMPTZ)
RETURNS posting_reminder_threshold AS $$
DECLARE
  v_remaining INTERVAL := p_expires_at - now();
BEGIN
  IF p_expires_at <= now() THEN
    RETURN 'expired';
  ELSIF v_remaining <= INTERVAL '24 hours' THEN
    RETURN '24_hour';
  ELSIF v_remaining <= INTERVAL '3 days' THEN
    RETURN '3_day';
  ELSIF v_remaining <= INTERVAL '7 days' THEN
    RETURN '7_day';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION generate_posting_lifecycle_reminders(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
  threshold posting_reminder_threshold,
  candidate_count INTEGER,
  inserted_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      o.id AS posting_id,
      o.restaurant_id,
      r.profile_id AS recipient_profile_id,
      o.lifecycle_version,
      posting_reminder_threshold_for(o.expires_at) AS threshold
    FROM openings o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.is_active = TRUE
      AND o.closed_at IS NULL
      AND posting_reminder_threshold_for(o.expires_at) IS NOT NULL
  ),
  grouped AS (
    SELECT c.threshold, COUNT(*)::INTEGER AS candidate_count
    FROM candidates c
    GROUP BY c.threshold
  ),
  inserted AS (
    INSERT INTO posting_reminders (
      posting_type,
      posting_id,
      restaurant_id,
      recipient_profile_id,
      recipient_role,
      threshold,
      channel,
      status,
      scheduled_for,
      lifecycle_version
    )
    SELECT
      'opening',
      c.posting_id,
      c.restaurant_id,
      c.recipient_profile_id,
      'hiring_team',
      c.threshold,
      'in_app',
      'queued',
      now(),
      c.lifecycle_version
    FROM candidates c
    WHERE p_dry_run = FALSE
    ON CONFLICT (posting_type, posting_id, recipient_profile_id, threshold, channel, lifecycle_version)
      DO NOTHING
    RETURNING threshold
  ),
  inserted_grouped AS (
    SELECT i.threshold, COUNT(*)::INTEGER AS inserted_count
    FROM inserted i
    GROUP BY i.threshold
  )
  SELECT
    g.threshold,
    g.candidate_count,
    COALESCE(ig.inserted_count, 0)::INTEGER AS inserted_count
  FROM grouped g
  LEFT JOIN inserted_grouped ig ON ig.threshold = g.threshold
  ORDER BY g.threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
