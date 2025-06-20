#!/bin/bash

# Generate TypeScript types from Supabase
# Make sure to set SUPABASE_ACCESS_TOKEN environment variable

echo "Generating TypeScript types from Supabase..."

# Project ID from the Supabase URL
PROJECT_ID="eyjnojfuyelrdkfzgboj"

# Generate types
npx supabase gen types typescript \
  --project-id "$PROJECT_ID" \
  > src/lib/supabase/database.types.ts

echo "Types generated successfully!"