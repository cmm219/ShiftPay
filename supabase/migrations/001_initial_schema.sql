-- ============================================================
-- ShiftPay — Phase 1 Initial Schema
-- Supabase / PostgreSQL migration
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('worker', 'restaurant', 'admin');
CREATE TYPE demand_status AS ENUM ('in_the_weeds', 'double_sat', 'triple_sat', '86d');
CREATE TYPE cert_status AS ENUM ('pending', 'verified', 'expired');
CREATE TYPE shift_status AS ENUM ('open', 'claimed', 'completed', 'cancelled');

-- ────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Return the current user's role from profiles
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- 3. TABLES
-- ────────────────────────────────────────────────────────────

-- Profiles (1:1 with auth.users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role       user_role NOT NULL,
  email      TEXT,
  phone      TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workers
CREATE TABLE workers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         UUID NOT NULL REFERENCES profiles ON DELETE CASCADE UNIQUE,
  name               TEXT NOT NULL,
  city               TEXT,
  experience_years   INT DEFAULT 0,
  preferred_rate_min NUMERIC(6,2),
  preferred_rate_max NUMERIC(6,2),
  rating_average     NUMERIC(3,2) DEFAULT 0,
  rating_count       INT DEFAULT 0,
  demand_status      demand_status,
  bio                TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worker roles (many-to-many: worker <-> role tag)
CREATE TABLE worker_roles (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  role      TEXT NOT NULL,
  UNIQUE (worker_id, role)
);

-- Worker availability tags
CREATE TABLE worker_availability (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  tag       TEXT NOT NULL,
  UNIQUE (worker_id, tag)
);

-- Worker certifications
CREATE TABLE worker_certifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  cert_type   TEXT NOT NULL,
  status      cert_status NOT NULL DEFAULT 'pending',
  expiry_date DATE,
  file_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurants
CREATE TABLE restaurants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE UNIQUE,
  name           TEXT NOT NULL,
  type           TEXT,
  city           TEXT,
  photo_url      TEXT,
  about          TEXT,
  employee_count INT DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurant hiring roles
CREATE TABLE restaurant_hiring_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  role          TEXT NOT NULL,
  UNIQUE (restaurant_id, role)
);

-- Openings (active job listings for a restaurant)
CREATE TABLE openings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  role          TEXT NOT NULL,
  pay_range     TEXT,
  urgency       TEXT NOT NULL DEFAULT 'normal',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shifts
CREATE TABLE shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  worker_id     UUID REFERENCES workers ON DELETE SET NULL,
  role          TEXT NOT NULL,
  date          DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  pay_rate      NUMERIC(6,2) NOT NULL,
  status        shift_status NOT NULL DEFAULT 'open',
  is_urgent     BOOLEAN NOT NULL DEFAULT FALSE,
  city          TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  date          DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  shift_id      UUID REFERENCES shifts ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations ON DELETE CASCADE,
  sender_type     TEXT NOT NULL,         -- 'worker' | 'restaurant'
  body            TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favorites (restaurant bookmarks a worker)
CREATE TABLE favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  worker_id     UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, worker_id)
);

-- ────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON worker_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON openings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 6. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_workers_city ON workers (city);
CREATE INDEX idx_workers_demand_status ON workers (demand_status);
CREATE INDEX idx_workers_profile_id ON workers (profile_id);

CREATE INDEX idx_worker_roles_worker_id ON worker_roles (worker_id);
CREATE INDEX idx_worker_availability_worker_id ON worker_availability (worker_id);
CREATE INDEX idx_worker_certifications_worker_id ON worker_certifications (worker_id);

CREATE INDEX idx_restaurants_city ON restaurants (city);
CREATE INDEX idx_restaurants_profile_id ON restaurants (profile_id);

CREATE INDEX idx_restaurant_hiring_roles_restaurant_id ON restaurant_hiring_roles (restaurant_id);

CREATE INDEX idx_openings_restaurant_id ON openings (restaurant_id);
CREATE INDEX idx_openings_is_active ON openings (is_active) WHERE is_active = TRUE;

CREATE INDEX idx_shifts_restaurant_id ON shifts (restaurant_id);
CREATE INDEX idx_shifts_worker_id ON shifts (worker_id);
CREATE INDEX idx_shifts_status ON shifts (status);
CREATE INDEX idx_shifts_date ON shifts (date);
CREATE INDEX idx_shifts_city ON shifts (city);

CREATE INDEX idx_reviews_worker_id ON reviews (worker_id);
CREATE INDEX idx_reviews_restaurant_id ON reviews (restaurant_id);

CREATE INDEX idx_conversations_worker_id ON conversations (worker_id);
CREATE INDEX idx_conversations_restaurant_id ON conversations (restaurant_id);
CREATE INDEX idx_conversations_shift_id ON conversations (shift_id);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sent_at ON messages (sent_at);

CREATE INDEX idx_favorites_restaurant_id ON favorites (restaurant_id);
CREATE INDEX idx_favorites_worker_id ON favorites (worker_id);

-- ────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_hiring_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──

CREATE POLICY "Profiles: authenticated can read all"
  ON profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Profiles: users can update own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── Workers ──

CREATE POLICY "Workers: authenticated can read all"
  ON workers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Workers: owner can insert own"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Workers: owner can update own"
  ON workers FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Workers: owner can delete own"
  ON workers FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ── Worker Roles ──

CREATE POLICY "Worker roles: authenticated can read all"
  ON worker_roles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Worker roles: owner can manage"
  ON worker_roles FOR ALL
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

-- ── Worker Availability ──

CREATE POLICY "Worker availability: authenticated can read all"
  ON worker_availability FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Worker availability: owner can manage"
  ON worker_availability FOR ALL
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

-- ── Worker Certifications ──

CREATE POLICY "Worker certs: authenticated can read all"
  ON worker_certifications FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Worker certs: owner can manage"
  ON worker_certifications FOR ALL
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

-- ── Restaurants ──

CREATE POLICY "Restaurants: authenticated can read all"
  ON restaurants FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Restaurants: owner can insert own"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Restaurants: owner can update own"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Restaurants: owner can delete own"
  ON restaurants FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ── Restaurant Hiring Roles ──

CREATE POLICY "Restaurant hiring roles: authenticated can read all"
  ON restaurant_hiring_roles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Restaurant hiring roles: owner can manage"
  ON restaurant_hiring_roles FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

-- ── Openings ──

CREATE POLICY "Openings: authenticated can read all"
  ON openings FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Openings: restaurant owner can manage"
  ON openings FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

-- ── Shifts ──

CREATE POLICY "Shifts: authenticated can read all"
  ON shifts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Shifts: restaurant owner can insert"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Shifts: restaurant owner can update"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Shifts: restaurant owner can delete"
  ON shifts FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Shifts: worker can claim open shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    status = 'open'
    AND worker_id IS NULL
    AND auth_role() = 'worker'
  )
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND status = 'claimed'
  );

-- ── Reviews ──

CREATE POLICY "Reviews: authenticated can read all"
  ON reviews FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Reviews: authenticated can insert"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Reviewer must be a participant: either the worker or the restaurant owner
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

-- ── Conversations ──

CREATE POLICY "Conversations: participants can read"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Conversations: participants can insert"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

-- ── Messages ──

CREATE POLICY "Messages: conversation participants can read"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
         OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Messages: conversation participants can insert"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
         OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Messages: conversation participants can update (mark read)"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
         OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
         OR restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
    )
  );

-- ── Favorites ──

CREATE POLICY "Favorites: owner can read own"
  ON favorites FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Favorites: owner can insert"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

CREATE POLICY "Favorites: owner can delete"
  ON favorites FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-photos', 'profile-photos', TRUE),
  ('certifications', 'certifications', FALSE);

-- Profile photos: anyone can read, authenticated users can upload/update their own
CREATE POLICY "Profile photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Profile photos: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Profile photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Certifications: only the owner can read/upload
CREATE POLICY "Certifications: owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Certifications: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Certifications: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
