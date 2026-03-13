-- ============================================================
-- ShiftPay — Phase 2: Anonymous Read Policies
-- Allow unauthenticated users to browse workers/restaurants/shifts
-- ============================================================

-- Workers (public browsing)
CREATE POLICY "Workers: anon can read all"
  ON workers FOR SELECT
  TO anon
  USING (TRUE);

-- Worker roles (needed for profile cards)
CREATE POLICY "Worker roles: anon can read all"
  ON worker_roles FOR SELECT
  TO anon
  USING (TRUE);

-- Worker availability (needed for filters)
CREATE POLICY "Worker availability: anon can read all"
  ON worker_availability FOR SELECT
  TO anon
  USING (TRUE);

-- Worker certifications (shown on profiles)
CREATE POLICY "Worker certs: anon can read all"
  ON worker_certifications FOR SELECT
  TO anon
  USING (TRUE);

-- Restaurants (public profiles)
CREATE POLICY "Restaurants: anon can read all"
  ON restaurants FOR SELECT
  TO anon
  USING (TRUE);

-- Restaurant hiring roles (shown on profiles)
CREATE POLICY "Restaurant hiring roles: anon can read all"
  ON restaurant_hiring_roles FOR SELECT
  TO anon
  USING (TRUE);

-- Openings (shown on restaurant profiles)
CREATE POLICY "Openings: anon can read all"
  ON openings FOR SELECT
  TO anon
  USING (TRUE);

-- Shifts (public shift board)
CREATE POLICY "Shifts: anon can read all"
  ON shifts FOR SELECT
  TO anon
  USING (TRUE);

-- Reviews (shown on worker profiles)
CREATE POLICY "Reviews: anon can read all"
  ON reviews FOR SELECT
  TO anon
  USING (TRUE);
