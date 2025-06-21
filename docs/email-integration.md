# Email Integration with Resend

## Overview

The nauw platform uses Resend for transactional email delivery. The integration includes professional German email templates for:

- **Usage Warnings** (80% quota reached)
- **Usage Critical Alerts** (95% quota reached)
- **Payment Failed Notifications**

## Setup

### 1. Environment Variables

Add the following to your `.env.local` and `.env` files:

```env
# Resend
RESEND_API_KEY="your-resend-api-key"
RESEND_WEBHOOK_SECRET="your-webhook-secret"

# App URL (update for production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Resend Dashboard Configuration

1. Log into your Resend dashboard
2. Navigate to Webhooks
3. Add a new webhook with URL: `https://your-domain.com/api/webhooks/resend`
4. Select the events you want to track:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
5. Copy the webhook secret and add it to your environment variables

### 3. Database Migration

Apply the notification system migration:

```bash
# Using Supabase CLI
supabase migration up

# Or apply manually in Supabase dashboard
```

## Email Templates

All email templates are React components located in `/src/components/emails/`:

- `usage-warning-email.tsx` - 80% usage warning
- `usage-critical-email.tsx` - 95% usage critical alert
- `payment-failed-email.tsx` - Payment failure notification

Templates use inline styles for maximum email client compatibility.

## Testing

### Test Email Endpoint (Development Only)

Send test emails using the API endpoint:

```bash
# Usage warning email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{"email": "test@example.com", "type": "usage_warning"}'

# Usage critical email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{"email": "test@example.com", "type": "usage_critical"}'

# Payment failed email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{"email": "test@example.com", "type": "payment_failed"}'
```

## Automated Usage Alerts

The system includes a Supabase Edge Function that checks all businesses for usage alerts. To deploy:

```bash
# Deploy the Edge Function
supabase functions deploy check-usage-alerts

# Set up a cron job in Supabase dashboard to run every hour:
# Function: check-usage-alerts
# Schedule: 0 * * * * (every hour)
```

## Email Service Architecture

1. **EmailService** (`/src/lib/services/email-service.ts`)
   - Handles email composition and sending via Resend SDK
   - Supports all notification types with proper data validation

2. **NotificationService** (`/src/lib/services/notification-service.ts`)
   - Manages business logic for when to send notifications
   - Prevents duplicate alerts within 24 hours
   - Logs all notifications to database

3. **Webhook Handler** (`/src/app/api/webhooks/resend/route.ts`)
   - Processes Resend webhook events
   - Updates notification status in database
   - Handles bounces and spam complaints

## Notification Flow

1. **Usage Monitoring**:
   - Appointments trigger usage checks
   - 80% threshold → Warning email
   - 95% threshold → Critical email

2. **Payment Processing**:
   - Stripe webhook detects payment failure
   - Notification service sends failure email
   - Customer portal link for payment update

3. **Email Tracking**:
   - All emails logged in Notification table
   - Resend webhooks update delivery status
   - Spam complaints auto-unsubscribe users

## Troubleshooting

### Emails Not Sending

1. Verify RESEND_API_KEY is set correctly
2. Check Resend dashboard for API errors
3. Review server logs for error messages
4. Ensure "from" domain is verified in Resend

### Webhook Issues

1. Verify RESEND_WEBHOOK_SECRET matches dashboard
2. Check webhook URL is publicly accessible
3. Review webhook logs in Resend dashboard
4. Test webhook endpoint manually

### Database Errors

1. Ensure Notification table exists
2. Check RLS policies allow inserts
3. Verify status and error columns added
4. Review Supabase logs for details