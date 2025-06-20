-- Migration: Update project to Swiss norms
-- Date: 2025-06-18

-- Update existing businesses to Swiss country default
UPDATE "Business" 
SET "country" = 'Schweiz' 
WHERE "country" = 'Deutschland';

-- Update country default for new records
ALTER TABLE "Business" 
ALTER COLUMN "country" SET DEFAULT 'Schweiz';

-- Note: Phone numbers and postal codes should be validated in the application layer
-- Swiss phone numbers: +41 XX XXX XX XX format
-- Swiss postal codes: 4-digit format (e.g., 8000 for Zürich)