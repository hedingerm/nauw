# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an appointment booking platform (B2C) for Swiss service businesses (hairstylists, therapists, tutors, etc.). The project is currently in Phase 2 implementation.

## Tech Stack

- **Frontend**: Next.js (App Router), React Hook Form, Shadcn UI, TailwindCSS
- **Backend**: Direct Supabase client integration with service layer pattern
- **Database**: Supabase (Database, Auth, Functions, Row-Level Security)
- **Validation**: Zod (single source of truth for all schemas)
- **Forms**: react-hook-form + Zod integration
- **Notifications**: SMS via Twilio/similar (planned)
- **Language**: German-first (next-intl for i18n planned)

## Dependencies

Install all dependencies with: `npm install [package names]`

### Core Dependencies
- next react react-dom
- typescript @types/react @types/react-dom @types/node
- tailwindcss postcss autoprefixer
- eslint eslint-config-next

### UI/UX
- @shadcn/ui (components installed individually)
- class-variance-authority clsx tailwind-merge
- lucide-react
- react-hook-form @hookform/resolvers

### Backend/API
- zod

### Supabase
- @supabase/supabase-js
- @supabase/ssr

### Internationalization (Phase 5)
- next-intl

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

Create a `.env` file with the following variables:

```env
# App URL for Stripe redirects
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## WSL Development Note

If using WSL and localhost:3000 doesn't work, use the network IP address instead (e.g., 192.168.0.15:3000). The project includes a `dev:host` script to help with this:

```bash
npm run dev:host    # Runs Next.js with -H 0.0.0.0 flag
```

## Development Commands

```bash
# Development
npm run dev          # Start Next.js development server
npm run dev:host     # Start Next.js dev server with host binding (for WSL)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking

# Testing (planned)
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
```

## Architecture Guidelines

### Database Operations Workflow (MANDATORY)
Before implementing ANY database operation, follow this strict workflow:

1. **ALWAYS Verify Schema First**:
   ```sql
   -- MANDATORY: Run this before any implementation
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'YourTable'
   ORDER BY ordinal_position;
   
   -- For JSON columns, also check actual data format:
   SELECT DISTINCT jsonb_pretty(your_json_column) 
   FROM "YourTable" LIMIT 1;
   
   -- Verify RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'YourTable';
   ```

2. **Test Operations**:
   - Test with both authenticated and anonymous roles
   - Log full error objects for debugging
   - Check for empty error responses (often indicates schema mismatch)

3. **After Schema Changes**:
   - Always run `mcp__MCP_SUPABASE__generate_typescript_types`
   - Update database.types.ts immediately
   - Run `npm run typecheck` to catch type mismatches

### Single Source of Truth Principle
**Critical**: Each piece of data should exist in exactly ONE place in the database.

1. **Subscription Data**:
   - ALL subscription details belong in the Subscription table
   - Business table should only have `stripe_customer_id` for customer identification
   - Never duplicate fields like billing_cycle, period_end, status across tables

2. **When Designing Schema**:
   - Ask: "Where does this data logically belong?"
   - If data describes a subscription, it goes in Subscription
   - If data describes a business entity, it goes in Business
   - Use foreign keys to connect related data

3. **Red Flags**:
   - Same field names across different tables (except IDs)
   - Updating same information in multiple places
   - Fields that could become out of sync

4. **Refactoring Redundancy**:
   - Identify all duplicated fields
   - Determine the authoritative source
   - Migrate data to single location
   - Update all code references
   - Remove redundant fields via migration

### Security-First Development
- Always implement Row Level Security (RLS) when working with databases
- Start with the most restrictive policies and only add permissions as needed
- Distinguish between authenticated user access and public access requirements
- When implementing public features (like booking pages):
  - Clearly separate public read-only policies from authenticated write policies
  - Document which tables need public access and why
  - Test policies with both authenticated and anonymous roles

### Public Access Implementation
When implementing public-facing features (e.g., booking pages):
1. **Identify Required Public Access**:
   - List all tables that need public read access
   - Determine if public users need to create records (e.g., customers, appointments)
   - Document the business logic for status fields (e.g., appointment status based on business settings)

2. **Implement Layered Policies**:
   - Public SELECT policies for viewing data
   - Public INSERT policies for creating records (with appropriate restrictions)
   - Authenticated policies for management operations
   - Test each layer independently

3. **Handle Mixed Access in Services**:
   - Be aware that `.select()` after `.insert()` requires both INSERT and SELECT policies
   - Consider whether anonymous users need to see the data they just created
   - Add time-limited SELECT policies if needed (e.g., view appointments created in last 5 minutes)

### Supabase Authentication Flows
When implementing auth flows (login, register, password reset):
1. **Password Reset Flow**:
   - Forgot password page sends reset email with `resetPasswordForEmail`
   - Reset password page must handle hash parameters from email links
   - Check for `#access_token` and `type=recovery` in URL hash
   - Use `getUser(accessToken)` instead of `exchangeCodeForSession` for recovery flows
2. **Redirect URLs**:
   - Must be configured in Supabase Dashboard under Authentication > URL Configuration
   - Test locally with proper redirect URLs before deployment
3. **Session Handling**:
   - Always check session validity before allowing protected actions
   - Handle expired sessions gracefully with user-friendly messages

### Schema Validation and Consistency
- Always define Zod schemas for any data structure
- Use the same Zod schema for both client and server validation
- Integrate Zod with react-hook-form for form validation
- Place shared schemas in a central location (e.g., `src/lib/schemas/`)
- **Critical: Validate schema dependencies between related entities**:
  - When schemas reference each other (e.g., customerData in appointments), ensure field requirements match
  - If a customer requires phone but not email, the appointment's customerData must match
  - Run cross-schema validation checks when modifying any schema
  - Document schema relationships in comments

### Form Data Transformation
When handling form submissions with optional fields:
1. **Empty String Transformation**:
   ```typescript
   const emptyStringToUndefined = z.literal('').transform(() => undefined)
   
   // For optional fields in schemas:
   email: z.union([emailSchema, emptyStringToUndefined]).optional()
   ```
2. **Why This Matters**:
   - HTML forms submit empty strings for unfilled fields
   - Database and validation expect `undefined` for optional fields
   - Without transformation, empty strings fail validation or cause type errors
3. **Apply Consistently**:
   - All optional string fields should use union types with empty string transformation
   - Date fields may need similar handling for empty date inputs
   - Test forms with both filled and empty optional fields

### Type Safety and Database Synchronization
- Always ensure database.types.ts reflects the actual database schema
- When encountering type errors related to database fields:
  1. Check the actual database column type using MCP tools
  2. Verify nullable constraints match between database and types
  3. Update database.types.ts to match reality, not assumptions
- Common type mismatches:
  - Numeric fields (e.g., prices) may be `number` not `string`
  - Text fields may have different nullable constraints
  - Enums must exist in database before using in types
- After database migrations, always regenerate and update types
- Service layer methods must handle type conversions properly

### Theme and Color Contrast Requirements
When implementing themed UI elements:
1. **Never use theme colors without ensuring contrast**:
   - Checkboxes: Use `bg-primary/10` with `text-primary` instead of `bg-primary`
   - Selected states: Add borders or use opacity variants
   - Badges: Ensure text is always white or contrasting
2. **Common contrast patterns**:
   - Active navigation: `bg-primary/10 text-primary border-primary`
   - Selected dates: `bg-primary text-white border-2 border-primary`
   - Hover states: Use opacity changes or shade variants
3. **Always test with different theme colors** to ensure visibility

### Dependency Verification
- Before implementing new UI features, verify all required dependencies are installed
- Check that necessary Shadcn UI components exist in src/components/ui/
- When using new libraries, first verify they're in package.json
- Run `npm install` if adding new dependencies
- **Required verification steps**:
  1. Check component exists: `ls src/components/ui/[component-name].tsx`
  2. Verify imports resolve without errors
  3. Run `npm run typecheck` before assuming components work
- **Common missing components**: Calendar, DataTable, Sheet
- If a Shadcn component is missing, install it: `npx shadcn-ui@latest add [component]`

### Core Business Logic
The most critical part is the availability calculation (FR-11). When implementing:
1. Check business operating hours first
2. Then check employee schedules and exceptions
3. Check for appointment conflicts
4. Ensure appointments fit within working blocks

### Stripe Integration Patterns

#### Webhook Processing
1. **Metadata Flow**:
   - Always pass `business_id` in checkout session metadata
   - Pass metadata to both session AND subscription_data for redundancy
   - Use metadata as fallback when customer lookup fails

2. **Customer ID Synchronization**:
   - Set stripe_customer_id in Business table at multiple checkpoints:
     - During checkout creation (if new customer)
     - In checkout.session.completed webhook
     - In subscription webhooks as fallback
   - Always check if stripe_customer_id exists before creating new customer

3. **Error Handling in Webhooks**:
   - Return 200 even for business logic errors (to prevent Stripe retries)
   - Log full error context including metadata and IDs
   - Use `.maybeSingle()` instead of `.single()` to avoid 406 errors

4. **Common Webhook Patterns**:
   ```typescript
   // Find business with multiple fallbacks
   let business = await findByStripeCustomerId(customerId)
   if (!business && metadata?.business_id) {
     business = await findById(metadata.business_id)
     // Update stripe_customer_id if missing
   }
   ```

### Database Schema Considerations
- Business accounts start with single user/role
- Services need duration, price, buffer times
- Employees have complex scheduling (recurring + exceptions)
- Appointments must prevent double bookings
- Customer data supports mini-CRM functionality

### Timezone Handling
- Never hardcode timezone offsets (e.g., +01:00 or +02:00)
- Switzerland uses CET (UTC+1) in winter and CEST (UTC+2) in summer
- When storing timestamps without timezone info, document clearly that the database interprets them as Europe/Zurich time
- Use date-fns-tz for timezone conversions when needed
- Always test date/time functionality across DST boundaries

### Database Operations
- PostgreSQL column names are case-sensitive when quoted - use double quotes for mixed-case columns (e.g., "workingHours")
- Always verify column names match the exact casing in the database schema
- When using Supabase MCP, test queries incrementally to catch syntax errors early

### Database Schema and Type Synchronization
When making ANY database schema changes:

1. **Apply Migration**:
   ```typescript
   // Use mcp__MCP_SUPABASE__apply_migration with descriptive name
   ```

2. **Generate Types** (MANDATORY):
   ```typescript
   // ALWAYS run after any schema change
   mcp__MCP_SUPABASE__generate_typescript_types
   ```

3. **Update Local Types**:
   - Write the generated types to `src/lib/supabase/database.types.ts`
   - The types file MUST be updated before any code changes

4. **Verify Types**:
   ```bash
   npm run typecheck  # Must pass before proceeding
   ```

5. **Common Type Mismatches to Check**:
   - Numeric fields: database uses `number` not `string`
   - Nullable fields: ensure database and types match
   - Foreign key relationships: verify they exist in types
   - Removed fields: ensure they're gone from types

### Supabase MCP Tool Usage
When working with the database, prefer using Supabase MCP tools:
- `mcp__MCP_SUPABASE__list_projects` - Get project information
- `mcp__MCP_SUPABASE__execute_sql` - Run queries to verify schema or data
- `mcp__MCP_SUPABASE__apply_migration` - Apply database schema changes
- `mcp__MCP_SUPABASE__generate_typescript_types` - Generate accurate TypeScript types
- `mcp__MCP_SUPABASE__search_docs` - Search Supabase documentation for best practices

**Required usage scenarios**:
1. **Before any database implementation** - verify schema first
2. **When encountering type errors** - check actual column types
3. **After database errors** - use execute_sql to debug
4. **For all schema changes** - use apply_migration, never manual SQL
5. **For RLS policy changes** - always use apply_migration with descriptive names

**Migration Naming Convention**:
- Format: `[timestamp]_[action]_[target]_[specifics]`
- Examples:
  - `20240121_add_stripe_customer_id_to_business`
  - `20240121_remove_redundant_fields_from_business`
  - `20240121_fix_public_booking_policies`
  - `20240121_create_subscription_table`
- Actions: `add`, `remove`, `fix`, `create`, `update`, `rename`
- Always use descriptive names that explain the change clearly

Example debugging workflow:
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Employee';
```

### Service Layer Architecture
The project uses a service layer pattern instead of tRPC:
- Service classes in `src/lib/services/` handle all database operations
- Each service is a static class with methods for CRUD operations
- Services use the Supabase client directly
- Components use async/await with services instead of React Query hooks

### Service Layer Implementation
Example service structure:
```typescript
// src/lib/services/booking-service.ts
export class BookingService {
  static async checkAvailability(params: AvailabilityParams): Promise<TimeSlot[]> {
    // 1. Validate input with Zod schema
    // 2. Check business hours
    // 3. Check employee availability
    // 4. Return available slots
  }
  
  static async createBooking(data: BookingData): Promise<Booking> {
    // Always use transactions for multi-table operations
    // Validate against availability before inserting
  }
}
```
- Always handle Supabase errors explicitly
- Return typed responses using Zod schemas
- Use static methods for stateless operations

### Testing Database Operations

1. **Test with Different Roles**:
   ```sql
   -- Always test operations with relevant roles
   SET LOCAL role TO 'anon';      -- Test public access
   SELECT * FROM "YourTable";     -- Should this work?
   
   SET LOCAL role TO 'authenticated';  -- Test logged-in access
   SELECT * FROM "YourTable";          -- Should this work?
   
   RESET role;  -- Return to service role
   ```

2. **Public Access Testing**:
   - For booking pages: Test both authenticated and anonymous access
   - Verify public SELECT policies work correctly
   - Test public INSERT for customer/appointment creation
   - Ensure sensitive data isn't exposed publicly

3. **Common Testing Scenarios**:
   ```typescript
   // After adding public policies, test:
   // 1. Can anonymous users view required data?
   // 2. Can anonymous users create records?
   // 3. Are private fields properly hidden?
   // 4. Do authenticated users maintain full access?
   ```

4. **Policy Testing Checklist**:
   - [ ] Test each operation (SELECT, INSERT, UPDATE, DELETE) separately
   - [ ] Test with both roles (anon, authenticated)
   - [ ] Verify time-based policies (e.g., "created in last 5 minutes")
   - [ ] Check policy conditions match business logic

### Appointment and Buffer Time Handling
- Appointments are stored with buffer times included in the database
- startTime includes bufferBefore, endTime includes bufferAfter
- When displaying appointments in calendars, show the full duration including buffers for consistency
- Document clearly in the UI if showing actual service time vs total blocked time

### Service Error Handling
```typescript
// Example service with proper error handling
export class CustomerService {
  static async create(data: CreateCustomerInput): Promise<Customer> {
    try {
      // 1. Validate input
      const validated = createCustomerSchema.parse(data)
      
      // 2. Check for duplicates
      const existing = await this.findByEmail(validated.email)
      if (existing) {
        throw new Error('Ein Kunde mit dieser E-Mail existiert bereits')
      }
      
      // 3. Create with proper error handling
      const { data: customer, error } = await supabase
        .from('Customer')
        .insert(validated)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw new Error('Fehler beim Erstellen des Kunden')
      }
      
      return customer
    } catch (error) {
      // Re-throw with user-friendly message if not already handled
      if (error instanceof Error) throw error
      throw new Error('Unerwarteter Fehler')
    }
  }
}
```

### Error Handling Patterns
- Create a central error handler in `src/lib/errors/`
- All user-facing errors must be in German
- Error structure: `{ code: string, message: string, details?: any }`
- Common error messages:
  - "Dieser Termin ist nicht mehr verfügbar"
  - "Bitte alle Felder ausfüllen"
  - "Ungültige Eingabe"
  - "Fehler beim Speichern der Daten"
  - "Keine Berechtigung für diese Aktion"
- Always log technical errors to console while showing user-friendly messages
- Use toast notifications for user feedback on errors

### Database Error Handling
When encountering database errors:

1. **Always log the full error object** for debugging:
   ```typescript
   if (error) {
     console.error('Database error:', error)
     console.error('Failed data:', data)
     console.error('Query details:', { table, operation, filters })
     throw new Error(error.message || 'Datenbankfehler')
   }
   ```

2. **Empty Error Objects**:
   - Empty errors (`{}`) usually indicate schema mismatches
   - Check nullable constraints match between database and types
   - Verify all columns exist with correct names (case-sensitive)
   - Test the exact same query in Supabase SQL editor

3. **Common Database Error Patterns**:
   - Foreign key violations: Check related record exists
   - Unique constraints: Implement duplicate checking before insert
   - RLS policy failures: Test with correct auth context
   - Type mismatches: Verify numeric vs string fields

4. **Debugging Workflow**:
   ```typescript
   // When query fails mysteriously:
   // 1. Log the exact query being attempted
   // 2. Check schema with information_schema query
   // 3. Test query directly in Supabase dashboard
   // 4. Verify RLS policies aren't blocking
   ```

5. **406 Errors on Joins**:
   - Often caused by RLS policies blocking joined tables
   - Use `.maybeSingle()` instead of `.single()` when record might not exist
   - Check that joined table has SELECT policy for the role

### Code Organization Standards
- File naming: use kebab-case for files (e.g., `booking-form.tsx`)
- Component naming: use PascalCase for components
- One component per file
- Group related components in feature folders
- Prefer editing existing files over creating new ones
- Only create new files when adding distinct features or components

### Component Refactoring Patterns
When refactoring large components (>500 lines):
1. **Extract Custom Hooks First**: Move state logic and effects to `use*` hooks
2. **Component Extraction Order**:
   - Identify logical sections (form parts, display sections)
   - Extract the most reusable parts first
   - Keep related components in the same directory
   - Pass minimal props - use hooks for shared state
3. **Naming Conventions**:
   - Hooks: `use[Feature]` (e.g., `useBookingData`)
   - Sub-components: `[Parent][Section]` (e.g., `BookingDateTimePicker`)
4. **Always preserve functionality** - test after each extraction

### Implementation Phases
Follow this sequence from the PRD:
1. **Phase 1**: ✅ Project setup, database schema, auth, basic architecture
2. **Phase 2**: 🔄 Business data management (onboarding, services, employees)
3. **Phase 3**: Core booking logic and calendar views
4. **Phase 4**: Customer booking flow
5. **Phase 5**: Notifications, reporting, i18n, polish

## Important Notes

- **Language**: All UI text should be in German
- **Mobile-first**: Customer booking page must be fully responsive
- **Performance**: Customer booking page should load in < 3 seconds
- **Security**: Validate all inputs on both client and server
- **Testing**: Write unit tests for core logic, especially availability calculations
- **Code Style**: Follow Airbnb Style Guide

### Form and HTML Best Practices
- Never nest `<form>` elements - this is invalid HTML and causes hydration errors
- When creating reusable form components that will be used inside other forms, use div containers instead of form elements
- For form components that need validation without a form wrapper, use react-hook-form's `trigger()` and `getValues()` methods
- Always check parent component structure before adding form elements

### Plan Mode Handling
When users indicate they want to plan or review changes before implementation:
- Use the `exit_plan_mode` tool to present your plan
- In plan mode, you MUST NOT make any edits or run modifying commands
- Only use read-only tools (Read, Grep, Glob, LS)
- Present a clear, structured plan with specific files and changes
- Wait for user approval before implementing

### Git Operations and Conflict Resolution
- NEVER commit unless explicitly requested by the user
- When pushing encounters conflicts:
  1. Always pull with `--no-rebase` to preserve history
  2. Show the user what changes are being merged
  3. Never force push without explicit permission
- Before pushing, always check:
  - Current branch: `git branch --show-current`
  - Remote status: `git status`
  - Recent commits: `git log --oneline -5`

### UI/UX Consistency Verification
When working with preview/design components:
1. **Always compare preview with actual implementation**
2. **Check that all config options are applied**:
   - Theme colors and styles
   - Layout settings
   - Feature toggles
   - Content overrides
3. **Use side-by-side file comparison** when updating matching components
4. **Test visual changes** by describing what should appear

## Project Structure (once initialized)

This project uses the src directory pattern. All source code should be placed under `/src`, including the Next.js app directory.

```
src/
├── app/                    # Next.js App Router pages
│   ├── (business)/        # Business portal routes
│   └── (customer)/        # Customer booking routes
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── features/         # Feature-specific components
├── lib/                  # Shared utilities
│   ├── auth/            # Authentication utilities
│   ├── schemas/         # Zod schemas
│   ├── services/        # Service layer (business logic)
│   ├── supabase/        # Supabase client and types
│   └── utils/           # Helper functions
└── hooks/               # Custom React hooks
```

## Key Implementation Details

- Use service layer pattern for database operations
- Implement proper error handling with German error messages
- Use Supabase Row Level Security (RLS) for data access control
- Implement rate limiting for booking endpoints
- Add proper logging for debugging appointment conflicts
- All amounts are in CHF (Swiss Francs)
- Phone numbers use +41 format
- Postal codes are 4 digits

## Debugging Guidelines
When functionality isn't working as expected:

1. **Browser Console First**: Check for client-side errors
2. **Add Targeted Logging**:
   ```typescript
   console.log('[ComponentName] Function entry:', { params })
   console.log('[ComponentName] Data validation:', { validated })
   console.log('[ComponentName] API call:', { endpoint, payload })
   console.log('[ComponentName] Response:', { data, error })
   ```

3. **Verify Data Flow**:
   - Input → Validation → Service Call → Response → UI Update
   - Log at each step to identify where it breaks

4. **Check Network Tab**: 
   - Verify API calls are made
   - Check request payloads
   - Examine response status and data

5. **Database Debugging**:
   ```typescript
   // When database operations fail:
   console.log('Query attempt:', {
     table: 'TableName',
     operation: 'select/insert/update',
     filters: { ...filters },
     data: { ...data }
   })
   ```

6. **Remove Debug Logs**: Clean up console.logs after fixing

7. **Common Patterns to Check**:
   - async/await usage (missing await?)
   - State updates (React batching?)
   - Event handler binding
   - Undefined/null checks
   - Type mismatches

## Doing tasks
The user will primarily request you perform software engineering tasks. This includes solving bugs, adding new functionality, refactoring code, explaining code, and more. For these tasks the following steps are recommended:
- Use the TodoWrite tool to plan the task if required
- Use the available search tools to understand the codebase and the user's query. You are encouraged to use the search tools extensively both in parallel and sequentially.
- Implement the solution using all tools available to you
- Verify the solution if possible with tests. NEVER assume specific test framework or test script. Check the README or search codebase to determine the testing approach.

### Comprehensive Testing Workflow
After ANY code changes:
1. **Type Safety**: `npm run typecheck` (MANDATORY)
2. **Code Quality**: `npm run lint` (MANDATORY)
3. **Runtime Check**: `timeout 10s npm run dev` to verify no startup errors
4. **For UI Changes**:
   - Describe expected visual changes
   - Verify all interactive elements work
   - Check responsive behavior if applicable
5. **For Database Changes**:
   - Test with both authenticated and anonymous roles
   - Verify RLS policies work as expected
   - Check error handling for edge cases

- **Test Database Operations**:
  - For any RLS policy changes, test with relevant roles:
    ```sql
    SET LOCAL role TO 'anon';  -- Test as anonymous
    -- Run your query
    
    SET LOCAL role TO 'authenticated';  -- Test as authenticated
    -- Run your query
    ```
  - Verify foreign key constraints are satisfied
  - Check that error messages are properly localized
- VERY IMPORTANT: When you have completed a task, you MUST run the lint and typecheck commands (eg. npm run lint, npm run typecheck, ruff, etc.) with Bash if they were provided to you to ensure your code is correct. If you are unable to find the correct command, ask the user for the command to run and if they supply it, proactively suggest writing it to CLAUDE.md so that you will know to run it next time.
NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive.

### Sequential Thinking MCP Usage (REQUIRED for complex tasks)
Use the `mcp__sequential-thinking__sequentialthinking` tool for:
- Any refactoring involving 3+ files
- Planning database schema changes
- Debugging issues that span multiple components
- Architecture design decisions
- When the user mentions "plan", "think through", or "design"
- Before implementing any feature that affects multiple parts of the system
- Complex debugging scenarios
- Multi-step refactoring plans
- Problems requiring hypothesis generation and verification

The tool allows dynamic thinking that can branch, revise previous thoughts, and adjust the total number of thoughts needed as understanding deepens.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.