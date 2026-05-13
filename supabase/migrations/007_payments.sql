-- ============================================================
-- ShiftPay — Migration 007: Payments & Subscriptions
-- ============================================================

-- Subscriptions table (restaurant Pro tier)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table (per-fill charges)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts ON DELETE SET NULL UNIQUE, -- one invoice per shift
  amount INTEGER NOT NULL, -- cents (3000 = $30.00, 1500 = $15.00)
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_restaurant_id ON subscriptions(restaurant_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_invoices_restaurant_id ON invoices(restaurant_id);
CREATE INDEX idx_invoices_shift_id ON invoices(shift_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Subscriptions: restaurant owner can read own
CREATE POLICY "Subscriptions: owner can read" ON subscriptions
  FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid()));

-- Invoices: restaurant owner can read own
CREATE POLICY "Invoices: owner can read" ON invoices
  FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE profile_id = auth.uid()));

-- Service role can manage both (for webhook handler)
-- (Supabase service_role bypasses RLS by default)

-- Update create_shift to also factor in subscription status
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
  v_subscription subscriptions;
BEGIN
  v_restaurant_id := get_my_restaurant_id();
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Not a registered restaurant';
  END IF;

  -- Check subscription
  SELECT * INTO v_subscription FROM subscriptions
  WHERE restaurant_id = v_restaurant_id AND status = 'active';

  -- If no active pro subscription, enforce free tier limit
  IF NOT FOUND OR v_subscription.plan != 'pro' THEN
    SELECT COUNT(*) INTO v_post_count
    FROM shifts
    WHERE restaurant_id = v_restaurant_id
      AND date_trunc('month', created_at) = date_trunc('month', now());

    IF v_post_count >= 3 THEN
      RAISE EXCEPTION 'Free tier limit reached: 3 shifts per month. Upgrade to Pro for unlimited posts.';
    END IF;
  END IF;

  INSERT INTO shifts (restaurant_id, role, date, start_time, end_time, pay_rate, city, description, is_urgent)
  VALUES (v_restaurant_id, p_role, p_date, p_start_time, p_end_time, p_pay_rate, p_city, p_description, p_is_urgent)
  RETURNING * INTO v_shift;

  RETURN v_shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invoice after shift completion
CREATE OR REPLACE FUNCTION create_invoice_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription subscriptions;
  v_amount INTEGER;
BEGIN
  -- Only trigger on status change to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check subscription tier
    SELECT * INTO v_subscription FROM subscriptions
    WHERE restaurant_id = NEW.restaurant_id AND status = 'active';

    IF FOUND AND v_subscription.plan = 'pro' THEN
      v_amount := 1500; -- $15 for Pro
    ELSE
      v_amount := 3000; -- $30 for Free
    END IF;

    -- Create invoice (idempotent via UNIQUE on shift_id)
    INSERT INTO invoices (restaurant_id, shift_id, amount)
    VALUES (NEW.restaurant_id, NEW.id, v_amount)
    ON CONFLICT (shift_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_invoice_on_completion
  AFTER UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION create_invoice_on_completion();
