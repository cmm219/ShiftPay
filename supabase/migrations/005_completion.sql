-- ============================================================
-- ShiftPay — Migration 005: Two-Party Shift Completion
--
-- Purpose:
--   After a shift is worked, both the worker and restaurant
--   must confirm completion independently. This prevents fraud
--   and ensures both parties agree on what happened.
--
--   Flow:
--     1. Either party calls confirm_completion() with 'completed'
--        or 'no_show'.
--     2. The first confirmation is recorded; shift stays as-is.
--     3. When the second party confirms:
--        - Both say 'completed' → shift.status = 'completed'
--        - Either says 'no_show' → shift.status = 'under_review'
--          (manual adjudication required)
--
-- Depends on: 001_initial_schema.sql, 004_shift_claiming.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLE: shift_confirmations
-- ────────────────────────────────────────────────────────────

CREATE TABLE shift_confirmations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id          UUID NOT NULL REFERENCES shifts ON DELETE CASCADE,
  confirmed_by      UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('completed', 'no_show')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, confirmed_by)
);

ALTER TABLE shift_confirmations ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 2. RLS POLICIES
--
-- SELECT: shift participants (worker or restaurant owner) can
--         read confirmations for their shifts.
-- INSERT: participants can insert their own confirmation only
--         (confirmed_by must equal auth.uid()).
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Shift confirmations: participants can read"
  ON shift_confirmations FOR SELECT
  TO authenticated
  USING (
    shift_id IN (
      SELECT s.id FROM shifts s
      WHERE s.worker_id IN (SELECT w.id FROM workers w WHERE w.profile_id = auth.uid())
         OR s.restaurant_id IN (SELECT r.id FROM restaurants r WHERE r.profile_id = auth.uid())
    )
  );

CREATE POLICY "Shift confirmations: participants can insert own"
  ON shift_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (
    confirmed_by = auth.uid()
    AND shift_id IN (
      SELECT s.id FROM shifts s
      WHERE s.worker_id IN (SELECT w.id FROM workers w WHERE w.profile_id = auth.uid())
         OR s.restaurant_id IN (SELECT r.id FROM restaurants r WHERE r.profile_id = auth.uid())
    )
  );

-- ────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_shift_confirmations_shift_id
  ON shift_confirmations (shift_id);

CREATE INDEX idx_shift_confirmations_confirmed_by
  ON shift_confirmations (confirmed_by);

-- ────────────────────────────────────────────────────────────
-- 4. RPC: confirm_completion(p_shift_id, p_confirmation_type)
--
-- Main entry point for both parties. Validates the caller is
-- a participant, inserts their confirmation, then checks if
-- the other party has also confirmed to resolve the shift.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION confirm_completion(p_shift_id UUID, p_confirmation_type TEXT)
RETURNS shift_confirmations AS $$
DECLARE
  v_shift shifts;
  v_confirmation shift_confirmations;
  v_other_confirmation shift_confirmations;
  v_caller_profile_id UUID;
BEGIN
  v_caller_profile_id := auth.uid();

  -- Validate confirmation type
  IF p_confirmation_type NOT IN ('completed', 'no_show') THEN
    RAISE EXCEPTION 'Invalid confirmation type. Must be completed or no_show.';
  END IF;

  -- Get and validate shift
  SELECT * INTO v_shift FROM shifts WHERE id = p_shift_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;
  IF v_shift.status NOT IN ('claimed', 'under_review') THEN
    RAISE EXCEPTION 'Shift cannot be confirmed in current status: %', v_shift.status;
  END IF;

  -- Verify caller is a participant (worker or restaurant owner)
  IF NOT (
    v_caller_profile_id IN (SELECT profile_id FROM workers WHERE id = v_shift.worker_id)
    OR v_caller_profile_id IN (SELECT profile_id FROM restaurants WHERE id = v_shift.restaurant_id)
  ) THEN
    RAISE EXCEPTION 'Only shift participants can confirm completion';
  END IF;

  -- Insert confirmation (unique constraint prevents duplicates)
  INSERT INTO shift_confirmations (shift_id, confirmed_by, confirmation_type)
  VALUES (p_shift_id, v_caller_profile_id, p_confirmation_type)
  RETURNING * INTO v_confirmation;

  -- Check if the other party has also confirmed
  SELECT * INTO v_other_confirmation
  FROM shift_confirmations
  WHERE shift_id = p_shift_id AND confirmed_by != v_caller_profile_id;

  IF FOUND THEN
    -- Both parties have confirmed — resolve the shift
    IF v_confirmation.confirmation_type = 'completed' AND v_other_confirmation.confirmation_type = 'completed' THEN
      -- Both say completed → mark shift as completed
      UPDATE shifts SET status = 'completed', updated_at = now() WHERE id = p_shift_id;
    ELSE
      -- At least one says no_show → under_review for manual adjudication
      UPDATE shifts SET status = 'under_review', updated_at = now() WHERE id = p_shift_id;
    END IF;
  END IF;

  RETURN v_confirmation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 5. RPC: my_shift_confirmation(p_shift_id)
--
-- Quick lookup: has the current user already confirmed this
-- shift? Returns the confirmation row or NULL.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION my_shift_confirmation(p_shift_id UUID)
RETURNS shift_confirmations AS $$
  SELECT * FROM shift_confirmations
  WHERE shift_id = p_shift_id AND confirmed_by = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;
