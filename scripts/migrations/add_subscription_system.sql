-- Add subscription system tables and fields (fixed for text IDs and constraints)

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- Starter, Pro, Business, Elite
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2) NOT NULL,
  bookings_included INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  stripe_product_id TEXT UNIQUE,
  stripe_price_monthly_id TEXT,
  stripe_price_annual_id TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table (with text business_id)
CREATE TABLE IF NOT EXISTS "Subscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES "SubscriptionPlan"(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'paused')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage tracking table (with text business_id)
CREATE TABLE IF NOT EXISTS "UsageLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES "Appointment"(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('booking', 'credit', 'overage', 'booster_pack')),
  amount INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing/invoice history table (with text business_id)
CREATE TABLE IF NOT EXISTS "Invoice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES "Subscription"(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'CHF',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  payment_method_type TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Stripe-related fields to Business table
ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES "Subscription"(id),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_brand TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_business_id ON "Subscription"(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status);
CREATE INDEX IF NOT EXISTS idx_usage_log_business_id ON "UsageLog"(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_subscription_id ON "UsageLog"(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_billing_period ON "UsageLog"(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_invoice_business_id ON "Invoice"(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"(status);

-- Insert default subscription plans (use -1 for unlimited)
INSERT INTO "SubscriptionPlan" (name, price_monthly, price_annual, bookings_included, features, display_order)
VALUES 
  ('Starter', 15.00, 150.00, 30, '{"calendars": 1, "email_reminders": true, "booking_link": true}', 1),
  ('Pro', 29.00, 290.00, 100, '{"calendars": "unlimited", "email_reminders": true, "sms_reminders": true, "booking_link": true}', 2),
  ('Business', 49.00, 490.00, 300, '{"calendars": "unlimited", "email_reminders": true, "sms_reminders": true, "booking_link": true, "team_support": true, "analytics": true}', 3),
  ('Elite', 79.00, 790.00, -1, '{"calendars": "unlimited", "email_reminders": true, "sms_reminders": true, "booking_link": true, "team_support": true, "analytics": true, "priority_support": true}', 4)
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies for subscription tables
ALTER TABLE "SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

-- SubscriptionPlan policies (public read, admin write)
CREATE POLICY "Anyone can view subscription plans"
  ON "SubscriptionPlan" FOR SELECT
  USING (is_active = true);

-- Subscription policies (business owners can view their own)
CREATE POLICY "Business owners can view their subscription"
  ON "Subscription" FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  );

-- UsageLog policies (business owners can view their own)
CREATE POLICY "Business owners can view their usage logs"
  ON "UsageLog" FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  );

-- Invoice policies (business owners can view their own)
CREATE POLICY "Business owners can view their invoices"
  ON "Invoice" FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plan_updated_at BEFORE UPDATE ON "SubscriptionPlan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON "Invoice"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to calculate current usage for a subscription
CREATE OR REPLACE FUNCTION calculate_subscription_usage(sub_id UUID, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ)
RETURNS TABLE (
  total_bookings INTEGER,
  included_bookings INTEGER,
  overage_bookings INTEGER,
  booster_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN ul.usage_type = 'booking' THEN ul.amount ELSE 0 END), 0)::INTEGER as total_bookings,
    COALESCE(sp.bookings_included, 0)::INTEGER as included_bookings,
    GREATEST(0, COALESCE(SUM(CASE WHEN ul.usage_type = 'booking' THEN ul.amount ELSE 0 END), 0) - COALESCE(sp.bookings_included, 0))::INTEGER as overage_bookings,
    COALESCE(SUM(CASE WHEN ul.usage_type = 'booster_pack' THEN ul.amount ELSE 0 END), 0)::INTEGER as booster_bookings
  FROM "Subscription" s
  JOIN "SubscriptionPlan" sp ON s.plan_id = sp.id
  LEFT JOIN "UsageLog" ul ON ul.subscription_id = s.id 
    AND ul.billing_period_start >= period_start 
    AND ul.billing_period_end <= period_end
  WHERE s.id = sub_id
  GROUP BY sp.bookings_included;
END;
$$ LANGUAGE plpgsql;