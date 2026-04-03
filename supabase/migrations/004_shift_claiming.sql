-- ============================================================
-- ShiftPay — Migration 004: Shift Claiming RPCs & Admin Guard
--
-- Purpose:
--   1. Harden handle_new_user() to reject admin role signups
--   2. Add helper RPCs: get_my_worker_id(), get_my_restaurant_id()
--   3. Add claim_shift() RPC with SELECT FOR UPDATE (race-safe)
--   4. Add create_shift() RPC with free-tier limit (3/month)
--   5. Extend shift_status enum with no_show and under_review
--   6. Remove direct worker claim RLS (all claiming via RPC now)
--   7. Add RLS policy for workers to read their assigned shifts
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. FIX handle_new_user() — reject admin role
--
-- Previously, anyone could sign up with role='admin' in their
-- metadata. Now we validate and reject anything other than
-- 'worker' or 'restaurant'.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data ->> 'role') NOT IN ('worker', 'restaurant') THEN
    RAISE EXCEPTION 'Invalid role: only worker and restaurant signups allowed';
  END IF;

  INSERT INTO profiles (id, role, email)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'worker'
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 2. HELPER RPCs — resolve caller's worker/restaurant ID
--
-- These are used by claim_shift() and create_shift() internally,
-- and can also be called directly from the frontend to get the
-- current user's entity ID without an extra query.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_worker_id()
RETURNS UUID AS $$
  SELECT id FROM workers WHERE profile_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_restaurant_id()
RETURNS UUID AS $$
  SELECT id FROM restaurants WHERE profile_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- 3. claim_shift() — race-safe shift claiming via RPC
--
-- Uses SELECT ... FOR UPDATE to lock the row, preventing two
-- workers from claiming the same shift simultaneously.
-- Returns the updated shift row on success.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_shift(p_shift_id UUID)
RETURNS shifts AS $$
DECLARE
  v_shift shifts;
  v_worker_id UUID;
BEGIN
  -- Get caller's worker ID
  v_worker_id := get_my_worker_id();
  IF v_worker_id IS NULL THEN
    RAISE EXCEPTION 'Not a registered worker';
  END IF;

  -- Lock and check shift
  SELECT * INTO v_shift FROM shifts WHERE id = p_shift_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;
  IF v_shift.status != 'open' THEN
    RAISE EXCEPTION 'Shift is no longer available';
  END IF;
  IF v_shift.worker_id IS NOT NULL THEN
    RAISE EXCEPTION 'Shift already claimed';
  END IF;

  -- Claim it
  UPDATE shifts SET
    worker_id = v_worker_id,
    status = 'claimed',
    updated_at = now()
  WHERE id = p_shift_id;

  -- Return the updated row
  SELECT * INTO v_shift FROM shifts WHERE id = p_shift_id;
  RETURN v_shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 4. create_shift() — post a shift with free-tier check
--
-- Free tier: 3 shift posts per calendar month per restaurant.
-- When a subscriptions table exists in a future migration,
-- the check can be extended to skip the limit for Pro users.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_shift(
  p_role TEXT,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_pay_rate NUMERIC,
  p_city TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT FALSE
)
RETURNS shifts AS $$
DECLARE
  v_restaurant_id UUID;
  v_shift shifts;
  v_post_count INT;
BEGIN
  v_restaurant_id := get_my_restaurant_id();
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Not a registered restaurant';
  END IF;

  -- Check free tier limit (3 posts per calendar month)
  -- TODO: skip if restaurant has active subscription (future migration)
  SELECT COUNT(*) INTO v_post_count
  FROM shifts
  WHERE restaurant_id = v_restaurant_id
    AND date_trunc('month', created_at) = date_trunc('month', now());

  IF v_post_count >= 3 THEN
    RAISE EXCEPTION 'Free tier limit reached: 3 shifts per month. Upgrade to Pro for unlimited posts.';
  END IF;

  INSERT INTO shifts (restaurant_id, role, date, start_time, end_time, pay_rate, city, description, is_urgent)
  VALUES (v_restaurant_id, p_role, p_date, p_start_time, p_end_time, p_pay_rate, p_city, p_description, p_is_urgent)
  RETURNING * INTO v_shift;

  RETURN v_shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 5. EXTEND shift_status enum
--
-- no_show:       worker did not show up for a claimed shift
-- under_review:  shift is being reviewed (dispute, quality check)
-- ────────────────────────────────────────────────────────────

ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'under_review';

-- ────────────────────────────────────────────────────────────
-- 6. DROP direct worker claim RLS policy
--
-- All shift claiming now goes through the claim_shift() RPC,
-- which runs as SECURITY DEFINER and handles its own auth.
-- The old RLS policy is no longer needed.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Shifts: worker can claim open shifts" ON shifts;

-- ────────────────────────────────────────────────────────────
-- 7. Worker can read assigned shifts
--
-- Workers need to see shifts they've been assigned to (claimed,
-- completed, no_show, etc.) even though they can't update them
-- directly. The existing "Shifts: authenticated can read all"
-- already covers this, but this explicit policy ensures workers
-- retain read access to their shifts even if the broad policy
-- is tightened later.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Shifts: worker can read assigned"
  ON shifts FOR SELECT
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );
