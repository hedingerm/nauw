-- Remove the legacy subscriptionTier column from Business table
-- This field was never used in the application logic and has been replaced
-- by the new subscription system with separate tables

ALTER TABLE "Business" DROP COLUMN IF EXISTS "subscriptionTier";