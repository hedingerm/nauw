# Product Requirements Document: Appointment Booking Platform (v1.1)

## 1. Overview

This document outlines the requirements for a web-based appointment booking application designed for B2C service businesses (e.g., hairstylists, therapists, tutors). The platform allows businesses to manage their services, employees, schedules, and appointments, while providing their customers with a simple online booking experience via a dedicated link. The primary goal is to simplify appointment management for businesses, reduce time spent on manual booking, and offer a convenient booking method for customers. The initial version will focus on core booking functionality and support German language first.

## 2. Goals and Objectives

*   **Simplify Appointment Management:** Reduce the time and effort required for businesses to manage appointments and schedules.
*   **Improve Customer Experience:** Provide a simple, fast, and accessible online booking process for end customers.
*   **Reduce Scheduling Errors:** Minimize conflicts and maximize resource utilization through automated availability checks.
*   **Provide Business Insights:** Offer basic visibility into booking volume and popular services.
*   **Gain Initial Traction:** Onboard a target number of businesses and achieve a target number of bookings within the first 6 months.

## 3. Scope

**In Scope (MVP - All items are MUST HAVE unless noted):**

*   **Business Portal:**
    *   Secure login for businesses (single user/role per business initially).
    *   Service Management: Create/edit services with name, description, duration, price, assigned employees, and buffer times (before/after).
    *   Employee Management: Add/edit employees.
    *   Scheduling:
        *   Define business-wide opening hours and workdays.
        *   Define complex employee schedules (recurring hours, varying work percentages, holidays, time off, sick days).
    *   Calendar View: Daily, Weekly, Monthly views for the whole business and individual employees.
    *   Manual Booking: Ability for the business to create appointments manually via the calendar interface (capturing service, date/time, customer info).
    *   Mini-CRM: Basic customer lookup (by name/contact) to pre-fill info for returning customers during manual booking. Store Name, Phone, Email.
    *   Booking Link Generation: Generate a unique URL for customers to book appointments online.
    *   Basic Reporting: View total number of bookings this month/last month (See FR-13).
*   **Customer Booking Page (via Link):**
    *   Service Selection.
    *   Available Date Selection (based on business/employee schedules & existing bookings).
    *   Available Time Slot Selection (respecting service duration, buffer times, schedules).
    *   Customer Information Input (Name, Phone, Email) using forms managed by `react-hook-form`.
    *   Booking Confirmation Screen.
*   **Notifications (SMS via Twilio/Similar Provider):**
    *   Customer: Booking Confirmation.
    *   Customer: Booking Reminder (e.g., 24 hours before).
*   **Language:** Full German language support for both business portal and customer booking page.
*   **Technology:** Next.js (App Router), tRPC, Prisma, Supabase (DB, Auth, potentially Functions for SMS), **Zod (for schema definition and validation throughout)**, **`react-hook-form` (for frontend form handling and validation integration)**, TailwindCSS, Shadcn UI.

**Out of Scope (MVP - WON'T HAVE):**

*   Online Payments.
*   Complex Reporting/Analytics (Revenue, performance metrics, etc.).
*   Customer Accounts/Logins.
*   Support for Multiple Business Locations.
*   Integration with External Calendars (Google Calendar, etc.).
*   English or other language support (beyond German).
*   Advanced Role-Based Access Control for businesses.
*   Group Bookings/Classes.
*   Waiting Lists.
*   Business notifications for new bookings/cancellations via SMS.
*   Customer ability to cancel/reschedule via link/SMS.

## 4. User Personas / Target Audience

*   **Business Owner/Manager (Primary User):**
    *   Small to medium-sized service business owner (e.g., Salon Owner, Clinic Manager).
    *   Currently manages bookings manually (phone, walk-ins, paper calendar).
    *   Needs to reduce administrative overhead, manage staff schedules efficiently, and provide a modern booking option.
    *   Values simplicity, reliability, and affordability.
    *   Tech-savviness varies, requires an intuitive interface.
*   **End Customer (Secondary User):**
    *   Client of the service business.
    *   Wants a quick and easy way to book appointments online at their convenience.
    *   Values seeing real-time availability and receiving confirmations/reminders.
    *   Expects a simple, mobile-friendly interface.

## 5. Functional Requirements

**FR-01: Business Account & Login**
*   Businesses can sign up/register. Input validation using `react-hook-form` and `Zod`.
*   Businesses can log in securely (using Supabase Auth).
*   Password reset functionality.

**FR-01.1: Guided Business Onboarding**
*   Upon first login after registration, the business user is guided through a multi-step setup process.
*   Forms within the wizard will use `react-hook-form` for state management and integrate `Zod` schemas for validation (FR-15).
*   This process collects essential initial data:
    *   Business Name & Basic Details (if not collected at signup).
    *   Default Business Opening Hours & Working Days.
    *   Details for at least one Employee (likely the owner/admin initially).
    *   Optionally, guidance to create the first Service.
*   The goal is to ensure the business has the minimum configuration needed to start accepting bookings immediately after completing the onboarding flow.

**FR-02: Service Management**
*   Businesses can create/edit services via forms managed by `react-hook-form` with `Zod` validation.
*   Required fields: Name, Duration (integer minutes > 0). Optional fields: Description, Price (numeric >= 0), Buffer Time Before (integer minutes >= 0), Buffer Time After (integer minutes >= 0).
*   Businesses can assign one or more **active** employees capable of performing the service.
*   Businesses can edit or delete existing services.

**FR-03: Employee Management**
*   Businesses can add/edit employees (Name required) via forms managed by `react-hook-form` with `Zod` validation.
*   Businesses can deactivate/archive employees (deactivated employees cannot be booked or assigned to new services).

**FR-04: Business Scheduling**
*   Businesses can define default opening hours and working days (e.g., Mon-Fri 9am-5pm) via the onboarding wizard and later settings, using validated forms (`react-hook-form`/`Zod`).
*   Define specific time intervals for each working day (e.g., Mon 09:00-12:00, 13:00-17:00).
*   These defaults apply to all employees unless overridden.

**FR-05: Employee Scheduling**
*   Businesses can define specific, recurring weekly schedules for each employee (overriding business defaults) using validated forms (`react-hook-form`/`Zod`). Define specific time intervals (e.g., Mon 09:00-13:00, Tue 10:00-18:00).
*   Businesses can define exceptions (date range or single day) to the schedule:
    *   Time Off / Holiday (Marked as unavailable).
    *   Sick Day (Marked as unavailable).
*   Schedules must respect business opening hours (cannot schedule employee outside business hours).

**FR-06: Calendar Views**
*   Businesses can view a calendar displaying appointments.
*   Available views: Daily, Weekly, Monthly.
*   Ability to filter the view by specific employee(s) or see all active employees.
*   Calendar should clearly show booked slots, available slots (potentially clickable), and employee time off/non-working hours.

**FR-07: Manual Appointment Creation**
*   Businesses can click on an available time slot in the calendar to initiate booking (likely opening a modal/form).
*   Must select a service (determines duration).
*   Must select an available employee assigned to the service for the chosen slot.
*   Must input customer details (Name, Phone, Email) via a form managed by `react-hook-form` with `Zod` validation (FR-15).
*   Ability to search for existing customers (Mini-CRM lookup) by Name/Phone/Email to auto-fill details.
*   Confirmation step before saving the booking.

**FR-08: Mini-CRM**
*   When manually creating a booking, typing a name/phone/email should suggest existing customers matching the input.
*   Selecting an existing customer auto-fills their details into the `react-hook-form` managed booking form.
*   If a new customer is entered (and validated via `Zod`), their details (Name, Phone, Email) are saved/updated for future lookup.
*   (MVP Scope: No dedicated interface to manage customers, only lookup/implicit creation during booking).

**FR-09: Booking Link**
*   The system provides a unique, stable, shareable URL for each business's public booking page (e.g., `/book/{business-slug}`).
*   This link leads to the customer-facing booking page.

**FR-10: Customer Online Booking**
*   Customer visits the booking link.
*   Step 1: Select Service from a list of active services.
*   Step 2: Select Date. Calendar displays only dates with *potential* availability for the selected service.
*   Step 3: Select Time Slot. Displays list of available start times for the selected date/service, calculated via FR-11.
*   Step 4: Enter Information (Name, Phone, Email) via a form managed by `react-hook-form` with `Zod` validation (FR-15).
*   Step 5: Confirmation Screen summarizing booking details (Service, Date, Time, Business Name).
*   Step 6: Submit Booking. Handle potential race condition if slot becomes unavailable just before submit - show error and prompt to re-select time.

**FR-11: Availability Logic**
*   System must accurately calculate and display **only** those dates and time slots that are genuinely available for a selected service.
*   The calculation logic must sequentially consider the following constraints in order:
    1.  **Business Operating Days/Hours:** Is the business open on the potential date and time interval (start + duration + buffers)?
    2.  **Employee Availability:** Is *at least one* active employee assigned to the service scheduled to work during the required time interval?
        *   Check standard recurring schedule for the specific day of the week.
        *   Check for any schedule exceptions (Time Off, Holiday, Sick Day) for that specific date range.
    3.  **Existing Appointments:** For each potentially available employee, check if the required time slot (start time to start time + duration + buffer before + buffer after) conflicts with any of their existing appointments.
    4.  **Fit within Working Block:** Ensure the required interval fits entirely within a contiguous block of scheduled working time for the employee.
*   Only time slots that satisfy ALL these conditions for at least one assigned employee should be presented as available.

**FR-12: Notifications (SMS)**
*   Upon successful booking submission (online or manual), queue sending an SMS confirmation to the customer (using validated phone number). Include Business Name, Service, Date, Time.
*   Queue sending an SMS reminder X hours (default 24, potentially configurable later) before the appointment start time.
*   SMS sending failures should be logged; no blocking action required for MVP.

**FR-13: Basic Reporting**
*   Business dashboard must display:
    *   Total count of appointments booked for the current month.
    *   Total count of appointments booked for the previous month.
*   (SHOULD HAVE) Display a simple list/chart of booking counts per service for the current/last month.

**FR-14: Language Support**
*   All user interface text (Business Portal & Customer Booking) must be in German. Use an i18n library (e.g., `next-intl`) to manage translations, facilitating future language additions. Store strings in resource files.

**FR-15: Data Validation**
*   **Crucially, all user inputs across the application (customer booking form, business setup/onboarding forms, service/employee/schedule details) must be rigorously validated on both the client and server-side.**
*   **Utilize `Zod` extensively to define strict data schemas.** These schemas serve as the single source of truth for data shapes and validation rules.
*   **Employ `react-hook-form` for managing all frontend forms.** This handles form state, submission, and seamlessly integrates with `Zod` schemas (`@hookform/resolvers/zod`) for efficient client-side validation, providing immediate feedback to users.
*   Server-side tRPC procedures **must** also use the same `Zod` schemas to validate incoming data before processing, ensuring data integrity even if client-side validation is bypassed.

## 6. Non-Functional Requirements

*   **NFR-01: Usability:** Both business portal and customer booking page must be intuitive and easy to use (KISS principle). Mobile-first responsive design for the customer booking page. Clear validation feedback provided via `react-hook-form`.
*   **NFR-02: Performance:** Customer booking page load time should be fast (< 3 seconds). Calendar views should load efficiently, even with many appointments/employees. Target ~500 bookings/month initially.
*   **NFR-03: Reliability:** The system must accurately reflect availability and prevent double bookings. High uptime target (>99.5%). Robust validation prevents data corruption.
*   **NFR-04: Security:** Secure authentication (Supabase Auth), protection against common web vulnerabilities (OWASP Top 10), strict input validation/sanitization (via `Zod` on server), appropriate headers. Data privacy compliance (GDPR - ensure clear consent/info, especially for contact details and SMS).
*   **NFR-05: Scalability:** Architecture should allow for future growth (more businesses, more bookings, potentially more features). Supabase handles DB scaling.
*   **NFR-06: Maintainability:** Code should follow best practices (Airbnb Style Guide, clear structure). Consistent use of `Zod` for schemas and `react-hook-form` for forms improves predictability. Include unit tests for core logic (availability calculation, scheduling rules, `Zod` schemas) and integration tests for API endpoints (tRPC procedures).

## 7. User Journeys

*   **Journey 1: Business Onboarding & Setup**
    1.  Business owner registers an account (form uses `react-hook-form`/`Zod`).
    2.  Logs in for the first time.
    3.  Is presented with a guided setup wizard (**FR-01.1**).
    4.  Wizard Step 1: Confirms/enters business name and details (validated form).
    5.  Wizard Step 2: Defines default business hours and workdays (with time intervals).
    6.  Wizard Step 3: Adds details for the primary employee (self) (validated form).
    7.  Wizard Step 4 (Optional): Creates a first service (validated form).
    8.  Completes wizard and lands on the main dashboard/calendar view.
    9.  (Later) Adds more employees and services as needed via standard validated forms.
    10. Retrieves the public booking link.
*   **Journey 2: Customer Books Online**
    1.  Customer clicks the booking link.
    2.  Selects desired service.
    3.  Chooses an available date from the calendar.
    4.  Picks an available time slot.
    5.  Enters their name, email, and phone number (form uses `react-hook-form`/`Zod`, providing inline validation feedback).
    6.  Reviews details and confirms the booking.
    7.  (If slot became unavailable) Sees error message, prompted to re-select time.
    8.  (If successful) Sees confirmation message.
    9.  Receives SMS confirmation (queued).
*   **Journey 3: Business Books Manually**
    1.  Business user logs in.
    2.  Navigates to the calendar view.
    3.  Identifies an available slot and clicks on it.
    4.  Selects the service.
    5.  Selects an available employee for the slot/service.
    6.  Starts typing customer name - selects existing customer from lookup OR enters new customer details in a validated form (`react-hook-form`/`Zod`).
    7.  Confirms booking details.
    8.  (System queues SMS confirmation to customer).
*   **Journey 4: Business Manages Schedule**
    1.  Business user logs in.
    2.  Navigates to employee schedule settings. Uses validated forms (`react-hook-form`/`Zod`) to:
    3.  Add a planned holiday for an employee.
    4.  Adjust the recurring weekly hours for another employee.
    5.  Calendar views immediately reflect updated availability.

## 8. Success Metrics (First 6 Months)

*   **SM-01: Active Businesses:** Number of unique businesses actively using the platform (e.g., logged in > 1 time and have > 5 appointments booked in the last month). **Target: 30**.
*   **SM-02: Total Bookings:** Total number of appointments successfully booked via the platform (both online and manual). **Target: 1500**.
*   **SM-03: Booking Completion Rate (Online):** Percentage of users who reach the final confirmation step after starting the booking process. **Target: > 70%**.
*   **(SHOULD HAVE) SM-04: Business Satisfaction:** Basic satisfaction survey score (e.g., CSAT) sent after 1 month of usage. **Target: > 3.5/5**.

## 9. Timeline / Implementation Sequence Suggestion

*   High-level estimate: TBD.
*   **Suggested Phased Implementation:**
    1.  **Phase 1 (Core Backend & Auth):** Setup Project (Next.js, TS, Prisma, Supabase, **Zod**, tRPC), DB Schema Design, Supabase Auth Integration, Basic tRPC setup with **Zod** validation.
    2.  **Phase 2 (Business Core Data):** Implement Business Onboarding (FR-01.1), Service Management (FR-02), Employee Management (FR-03), Business/Employee Scheduling (FR-04, FR-05 - including exceptions). Frontend forms using **`react-hook-form`**/**Zod**. Backend CRUD operations and tRPC procedures with **Zod** validation. Unit tests for scheduling logic.
    3.  **Phase 3 (Core Booking Logic & Calendar):** Implement Availability Logic (FR-11), Calendar Backend (fetching appointments/availability), Basic Calendar UI (FR-06), Manual Appointment Creation Backend (FR-07 - using validated forms). Integration tests for availability endpoint.
    4.  **Phase 4 (Customer Booking Flow):** Implement Customer Booking UI (FR-10 - using **`react-hook-form`**/**Zod**), Booking Link (FR-09), Frontend logic for fetching services/slots. E2E test for booking flow.
    5.  **Phase 5 (Final Touches & Polish):** Implement Notifications (FR-12 - including SMS integration), Mini-CRM lookup (FR-08), Basic Reporting (FR-13), German i18n (FR-14), Final UI polish, Deployment prep.

## 10. Open Questions/Assumptions

*   **Assumption:** Businesses are okay with a single login/role for the MVP.
*   **Assumption:** SMS notifications via a third-party provider (like Twilio) and associated costs are acceptable.
*   **Assumption:** Manual cancellation/rescheduling by the business is sufficient for MVP. Customer self-service is out of scope.
*   **Assumption:** Focus is purely on appointment booking, not general business management features.
*   **Assumption:** Business is responsible for obtaining customer consent for SMS notifications and adhering to GDPR regarding customer data storage/usage.
*   **Resolved:** Business notifications (SMS) for new bookings/cancellations are OUT of scope for MVP.
*   **Resolved:** Basic Reporting requirements defined in FR-13.

## 11. Monetization Strategy

*   Fee charged per booking made via the customer-facing booking link. Manual bookings made by the business are free. (Exact pricing TBD). 