# Supabase Auth Setup

For the password reset flow to work properly, you need to configure the following in your Supabase project:

## 1. Redirect URLs

In your Supabase Dashboard:
1. Go to Authentication > URL Configuration
2. Add these URLs to the "Redirect URLs" list:
   - `http://localhost:3000/auth/reset-password` (for local development)
   - `https://yourdomain.com/auth/reset-password` (for production)

## 2. Email Templates (Optional)

You can customize the password reset email in:
1. Go to Authentication > Email Templates
2. Select "Reset Password" template
3. Make sure the confirmation URL uses the correct path

## 3. SMTP Configuration (Optional)

For production, configure custom SMTP settings:
1. Go to Authentication > SMTP Settings
2. Configure your email provider

## Testing the Flow

1. Go to `/login`
2. Click "Passwort vergessen?"
3. Enter your email
4. Check your email for the reset link
5. Click the link to be redirected to `/auth/reset-password`
6. Enter your new password