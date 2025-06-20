# Authentication Setup Guide

## Email Templates Configuration

To enable proper email verification and password reset flows, you need to configure the email templates in Supabase Dashboard.

### 1. Navigate to Authentication Settings
Go to: https://supabase.com/dashboard/project/eyjnojfuyelrdkfzgboj/auth/templates

### 2. Update Email Templates

#### Confirm Signup Template
Update the template with German text:

**Subject**: `Bestätigen Sie Ihre E-Mail-Adresse für nauw`

**Body**:
```html
<h2>Willkommen bei nauw!</h2>
<p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail-Adresse bestätigen</a></p>
<p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Dieser Link ist 24 Stunden gültig.</p>
<p>Viele Grüße,<br>Ihr nauw Team</p>
```

#### Reset Password Template
**Subject**: `Passwort zurücksetzen - nauw`

**Body**:
```html
<h2>Passwort zurücksetzen</h2>
<p>Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link:</p>
<p><a href="{{ .ConfirmationURL }}">Passwort zurücksetzen</a></p>
<p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Dieser Link ist 1 Stunde gültig.</p>
<p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
<p>Viele Grüße,<br>Ihr nauw Team</p>
```

### 3. Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL**: `http://localhost:3000` (for development)
2. **Redirect URLs** (add all of these):
   - `http://localhost:3000/**`
   - `http://localhost:3000/verify-email`
   - `http://localhost:3000/reset-password`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/business/dashboard`

For production, replace localhost:3000 with your actual domain.

### 4. Email Settings

In Supabase Dashboard > Authentication > Email Auth:

1. **Enable Email Confirmations**: ✅ Enabled
2. **Enable Email Change Confirmations**: ✅ Enabled
3. **Secure Email Change**: ✅ Enabled

### 5. SMTP Configuration (Optional)

For production, configure custom SMTP settings:

1. Go to Project Settings > Auth
2. Enable "Custom SMTP"
3. Add your SMTP credentials

## Testing the Auth Flow

### Registration Flow:
1. User registers at `/business/register`
2. Redirected to `/check-email`
3. User receives verification email
4. Clicks link → redirected to `/verify-email`
5. Auto-redirect to `/business/dashboard`

### Password Reset Flow:
1. User clicks "Passwort vergessen?" on login page
2. Enters email at `/forgot-password`
3. Receives reset email
4. Clicks link → redirected to `/reset-password`
5. Sets new password
6. Redirected to `/login`

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eyjnojfuyelrdkfzgboj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Common Issues

### Email not sending
- Check spam folder
- Verify email templates are saved
- Check Supabase email logs

### Redirect not working
- Ensure redirect URLs are whitelisted
- Check browser console for errors
- Verify Site URL is correct

### WSL Issues
- Use network IP instead of localhost
- Run with `npm run dev:host`