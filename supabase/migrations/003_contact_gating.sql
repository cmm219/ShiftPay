-- ============================================================
-- ShiftPay — Migration 003: Contact Info Gating
--
-- Purpose: Restrict phone/email visibility on the profiles table
-- to post-completion only. Before a completed shift is shared,
-- other users can only see the public view (photo_url, role, id).
--
-- Approach:
--   Since Supabase RLS is row-level (not column-level), we:
--   1. Lock down the base profiles table to self + completed-shift partners
--   2. Create a profiles_public view that excludes phone/email
--   3. Grant authenticated + anon SELECT on the view for browse pages
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DROP the existing permissive read-all policy
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Profiles: authenticated can read all" ON profiles;

-- ────────────────────────────────────────────────────────────
-- 2. Self-read policy: users can always read their own profile
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Profiles: users can read own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. Completed-shift partner policy
--
-- User A can read user B's full profile (including phone/email)
-- IF there exists a completed shift where:
--   - A is the worker and B is the restaurant owner (or vice versa)
--
-- This enables contact info exchange only after a shift is done.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Profiles: completed shift partners can read"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shifts s
      JOIN workers w ON w.id = s.worker_id
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE s.status = 'completed'
        AND (
          -- Caller is the worker, target profile is the restaurant owner
          (w.profile_id = auth.uid() AND r.profile_id = profiles.id)
          OR
          -- Caller is the restaurant owner, target profile is the worker
          (r.profile_id = auth.uid() AND w.profile_id = profiles.id)
        )
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. Public view: exposes only non-sensitive columns
--
-- Browse pages, profile cards, and swipe views use this view
-- instead of querying the profiles table directly.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW profiles_public AS
SELECT
  id,
  role,
  photo_url,
  created_at,
  updated_at
FROM profiles;

-- Grant access to both authenticated and anonymous users
GRANT SELECT ON profiles_public TO authenticated;
GRANT SELECT ON profiles_public TO anon;

-- Note: The "Profiles: users can update own" policy from migration 001
-- remains unchanged — users can still update their own profile freely.
