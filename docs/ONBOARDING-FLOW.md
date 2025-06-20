# Onboarding Flow Documentation

## Overview

The onboarding flow is a comprehensive 5-step wizard that collects all necessary information to get a business operational on CalBok immediately after signup, as per requirement FR-01.1 in the PRD.

## Onboarding Steps

### Step 1: Business Information
- **Purpose**: Collect basic business details
- **Fields**:
  - Business name (required)
  - Business type/category (dropdown)
  - Phone number
  - Email address
  - Full address (street, city, postal code, country)
  - Description (optional)
- **Validation**: All required fields must be filled, postal code must be 5 digits

### Step 2: Operating Hours
- **Purpose**: Define when the business is open
- **Features**:
  - Interactive week schedule
  - Toggle open/closed for each day
  - Set specific hours for each day
  - "Copy to all days" functionality
  - Visual feedback for closed days
- **Default**: Mon-Fri 9:00-18:00, Sat-Sun closed

### Step 3: Owner Information
- **Purpose**: Set up the business owner as the first employee
- **Fields**:
  - Full name
  - Email address
  - Phone number
  - Can perform services (checkbox)
- **Note**: Owner automatically has admin access

### Step 4: Additional Employee (Optional)
- **Purpose**: Add another employee if needed
- **Fields**:
  - Same as owner (name, email, phone)
  - Can perform services (checkbox)
- **Features**:
  - Can skip this step
  - Employee gets default working hours from business

### Step 5: First Service (Optional)
- **Purpose**: Create the first service offering
- **Fields**:
  - Service name
  - Duration (dropdown: 15, 30, 45, 60, 90, 120 minutes)
  - Price
  - Buffer time before/after
  - Description (optional)
- **Features**:
  - Can skip this step
  - Service automatically assigned to employees who can perform services
  - Helpful tooltips for buffer times

## Technical Implementation

### Components

1. **ProgressIndicator** (`/src/components/onboarding/progress-indicator.tsx`)
   - Visual step indicator with checkmarks for completed steps
   - Active step highlighted with ring
   - Step labels below icons

2. **BusinessHoursSelector** (`/src/components/onboarding/business-hours-selector.tsx`)
   - Custom component for managing weekly hours
   - Checkbox to toggle days open/closed
   - Time inputs for open/close times
   - Copy hours functionality

3. **FormTooltip** (`/src/components/onboarding/form-tooltip.tsx`)
   - Provides contextual help using Radix UI tooltip
   - Info icon that shows help text on hover

### Data Flow

1. **Form State Management**:
   - Each step uses react-hook-form with Zod validation
   - Form data stored in component state between steps
   - Validation occurs before proceeding to next step

2. **API Endpoint**: `completeOnboarding`
   - Single atomic transaction creates all records
   - Creates business, owner, optional employee, optional service
   - Handles employee-service associations
   - Rollback on any failure

3. **Data Schema** (`/src/lib/schemas/onboarding.ts`):
   - Separate schemas for each step
   - Combined schema for API submission
   - All validation in German

### User Experience Features

- **Progress Tracking**: Visual indicator shows current position
- **Back Navigation**: Can go back to previous steps
- **Data Persistence**: Form data maintained between steps
- **Skip Options**: Steps 4 and 5 can be skipped
- **Loading States**: Visual feedback during submission
- **Error Handling**: Toast notifications for errors
- **Success Feedback**: Welcome message and redirect to dashboard

### Database Updates

The following fields were added to support onboarding:
- Business: `type`, `description`
- Employee: `role`, `canPerformServices`

## Testing the Onboarding Flow

1. **Register a new account** at `/register`
2. **Verify email** (check email for verification link)
3. **Redirected to onboarding** automatically
4. **Complete all 5 steps** (or skip optional ones)
5. **Submit** creates all records in database
6. **Redirect to dashboard** with welcome message

## Next Steps

After completing onboarding, businesses can:
- Add more employees
- Create additional services
- Configure detailed schedules
- Start accepting bookings
- View analytics and reports

The onboarding ensures businesses have the minimum viable setup to start using CalBok immediately.