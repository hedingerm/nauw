-- Create Notification table to store notification history
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('usage_warning', 'usage_critical', 'subscription_expired', 'payment_failed')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create NotificationLog table to track when alerts were sent (prevent spam)
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  key TEXT PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_notification_business_id ON "Notification"(business_id);
CREATE INDEX idx_notification_type ON "Notification"(type);
CREATE INDEX idx_notification_sent_at ON "Notification"(sent_at);
CREATE INDEX idx_notification_read_at ON "Notification"(read_at);

-- RLS Policies for Notification
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Businesses can read their own notifications
CREATE POLICY "Businesses can view own notifications" ON "Notification"
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  );

-- Businesses can mark their own notifications as read
CREATE POLICY "Businesses can update own notifications" ON "Notification"
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM "Business" 
      WHERE "userId" = auth.uid()
    )
  );

-- RLS Policies for NotificationLog (internal use only)
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;

-- Only service role can access NotificationLog
CREATE POLICY "Service role only" ON "NotificationLog"
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');