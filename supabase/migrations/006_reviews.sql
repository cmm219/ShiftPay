-- ============================================================
-- ShiftPay — Migration 006: Two-way Reviews
-- Adds reviewer_type and shift_id to existing reviews table
-- ============================================================

-- Add reviewer_type and shift_id to existing reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_type TEXT CHECK (reviewer_type IN ('worker', 'restaurant'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts ON DELETE SET NULL;

-- Unique constraint: one review per reviewer per shift
ALTER TABLE reviews ADD CONSTRAINT unique_review_per_shift UNIQUE (shift_id, reviewer_type);

-- Index for shift-based review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_shift_id ON reviews (shift_id);

-- Update existing RLS to enforce shift completion
DROP POLICY IF EXISTS "Reviews: authenticated can insert" ON reviews;
CREATE POLICY "Reviews: can insert after completion" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Must reference a completed shift
    shift_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM shifts WHERE id = shift_id AND status = 'completed'
    )
    AND (
      -- Worker reviewing restaurant
      (reviewer_type = 'worker' AND worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()))
      OR
      -- Restaurant reviewing worker
      (reviewer_type = 'restaurant' AND restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid()))
    )
  );

-- Trigger to update rating_average on review insert
CREATE OR REPLACE FUNCTION update_rating_on_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reviewer_type = 'restaurant' THEN
    -- Restaurant reviewed worker, update worker rating
    UPDATE workers SET
      rating_average = (SELECT AVG(rating) FROM reviews WHERE worker_id = NEW.worker_id AND reviewer_type = 'restaurant'),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE worker_id = NEW.worker_id AND reviewer_type = 'restaurant')
    WHERE id = NEW.worker_id;
  ELSIF NEW.reviewer_type = 'worker' THEN
    -- Worker reviewed restaurant, update restaurant rating
    UPDATE restaurants SET
      rating_average = (SELECT AVG(rating) FROM reviews WHERE restaurant_id = NEW.restaurant_id AND reviewer_type = 'worker'),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = NEW.restaurant_id AND reviewer_type = 'worker')
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rating_on_review ON reviews;
CREATE TRIGGER trg_update_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_rating_on_review();
