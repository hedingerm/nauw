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

### Critical: Database Schema Verification First
Before implementing any database operations:
1. **Always verify actual schema first** using Supabase MCP tools:
   - Use `mcp__MCP_SUPABASE__execute_sql` to check table structure
   - Use `mcp__MCP_SUPABASE__list_tables` to verify columns
   - Check RLS policies with: `SELECT * FROM pg_policies WHERE tablename = 'YourTable'`
   - Never assume types - numeric fields might be `number` not `string`
2. **When encountering database errors**:
   - Empty error objects often indicate schema mismatches
   - Log full error details: `console.error('Database error:', error)`
   - Check nullable constraints match between database and types
   - For RLS errors, verify policies for the current auth context
3. **After any schema changes**:
   - Run `mcp__MCP_SUPABASE__generate_typescript_types`
   - Update database.types.ts immediately
   - Test with both authenticated and anonymous access if applicable

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

### Database Schema Verification
- Before implementing database operations, verify the actual database schema matches database.types.ts
- Use Supabase MCP tools to check table structures when encountering database errors
- When adding new columns or modifying tables:
  1. Apply migrations using mcp__MCP_SUPABASE__apply_migration
  2. Regenerate types using mcp__MCP_SUPABASE__generate_typescript_types
  3. Update database.types.ts accordingly
- Common schema issues to check:
  - Nullable vs non-nullable fields
  - Data types (especially numeric vs text for prices)
  - Missing columns (e.g., isActive, timestamps)
  - Enum types existence

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
- Use descriptive names: `add_user_id_to_business`, `fix_public_appointment_creation_policy`
- Include the action and target: `[action]_[target]_[specifics]`
- For fixes, start with `fix_`: `fix_appointment_policies_for_public`

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
     throw new Error(error.message || 'Datenbankfehler')
   }
   ```

2. **Common database error patterns**:
   - Foreign key violations: "Verknüpfung nicht gefunden"
   - Unique constraints: "Eintrag existiert bereits"
   - Null violations: "Pflichtfeld fehlt"
   - Type mismatches: "Ungültiger Datentyp"

3. **Schema mismatch indicators**:
   - Empty error objects often indicate schema issues
   - Check nullable fields and data types
   - Verify all required columns exist

4. **Recovery strategies**:
   - For schema issues: Check and fix database schema first
   - For data issues: Validate input data matches schema
   - For constraint issues: Check related records exist

### Code Organization Standards
- File naming: use kebab-case for files (e.g., `booking-form.tsx`)
- Component naming: use PascalCase for components
- One component per file
- Group related components in feature folders
- Prefer editing existing files over creating new ones
- Only create new files when adding distinct features or components

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

## Doing tasks
The user will primarily request you perform software engineering tasks. This includes solving bugs, adding new functionality, refactoring code, explaining code, and more. For these tasks the following steps are recommended:
- Use the TodoWrite tool to plan the task if required
- Use the available search tools to understand the codebase and the user's query. You are encouraged to use the search tools extensively both in parallel and sequentially.
- Implement the solution using all tools available to you
- Verify the solution if possible with tests. NEVER assume specific test framework or test script. Check the README or search codebase to determine the testing approach.
- **MANDATORY**: After completing any code changes, you MUST run:
  1. `npm run typecheck` - catches type errors before runtime
  2. `npm run lint` - ensures code quality
  3. `npm run dev` briefly to verify no runtime errors
  - If any command fails, fix the issues before considering the task complete
  - These commands have caught critical issues in this project including import errors and type mismatches
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

### Debugging Guidelines
When functionality isn't working as expected:
1. First check the browser console for errors
2. Add targeted console.logs at key points: function entry, data validation, API calls
3. Verify data flow: input → validation → service call → response
4. Check network tab for API failures
5. Remove debug logs after fixing the issue
6. If issue persists, check for common patterns: async/await usage, state updates, event handler binding
### Sequential Thinking MCP Usage
When working with complex problems or multi-step analysis, use the `mcp__sequential-thinking__sequentialthinking` tool to:
- Break down complex problems into manageable steps
- Plan and design solutions with room for revision
- Analyze problems where the full scope isn't clear initially
- Generate and verify solution hypotheses iteratively

The tool allows dynamic thinking that can branch, revise previous thoughts, and adjust the total number of thoughts needed as understanding deepens. Use it for:
- Complex debugging scenarios
- Architecture design decisions
- Multi-step refactoring plans
- Problems requiring hypothesis generation and verification

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.