-- Migration: Add fields for onboarding flow
-- Date: 2025-06-18

-- Add type and description fields to Business table
ALTER TABLE "Business" 
ADD COLUMN IF NOT EXISTS "type" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Update existing businesses to have a default type
UPDATE "Business" 
SET "type" = 'other' 
WHERE "type" IS NULL;

-- Make type required for new records
ALTER TABLE "Business" 
ALTER COLUMN "type" SET NOT NULL;

-- Add role and canPerformServices fields to Employee table
ALTER TABLE "Employee" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'Mitarbeiter',
ADD COLUMN IF NOT EXISTS "canPerformServices" BOOLEAN DEFAULT true;

-- Update existing employees to have proper values
UPDATE "Employee" 
SET "role" = 'Mitarbeiter',
    "canPerformServices" = true 
WHERE "role" IS NULL;

-- Make role required for new records
ALTER TABLE "Employee" 
ALTER COLUMN "role" SET NOT NULL;

-- Make canPerformServices required for new records
ALTER TABLE "Employee" 
ALTER COLUMN "canPerformServices" SET NOT NULL;

-- Update country default to Swiss
ALTER TABLE "Business" 
ALTER COLUMN "country" SET DEFAULT 'Schweiz';

-- Make workingHours nullable for employees (they can inherit from business)
ALTER TABLE "Employee" 
ALTER COLUMN "workingHours" DROP NOT NULL;