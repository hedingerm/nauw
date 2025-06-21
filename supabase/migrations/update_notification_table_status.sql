-- Add status and error columns to Notification table for email tracking
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
ADD COLUMN IF NOT EXISTS error TEXT;

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_notification_status ON "Notification"(status);

-- Update existing records to have 'sent' status (assuming they were sent)
UPDATE "Notification" 
SET status = 'sent' 
WHERE status IS NULL;