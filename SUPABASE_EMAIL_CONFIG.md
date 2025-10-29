# Supabase Email Configuration for OTP Flow

## 🔧 Required Supabase Settings

### 1. Enable Email Confirmation
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. **Enable email confirmations**: Toggle ON
3. **Confirm email**: Toggle ON

### 2. Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Ensure the template includes both:
   - **Confirmation Link** (for email method)
   - **Confirmation Code** (for manual entry)

### 3. Site URL Configuration
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:5174` (or your domain)
3. Add **Redirect URLs**: 
   - `http://localhost:5174/verify-otp`
   - `http://localhost:5174/login`

## 📧 Email Template Customization

### Default Template Variables:
- `{{ .ConfirmationURL }}` - Full confirmation link
- `{{ .Token }}` - 6-digit confirmation code
- `{{ .Email }}` - User's email address

### Recommended Email Template:
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>

<p>Or enter this 6-digit code manually:</p>
<h3>{{ .Token }}</h3>

<p>This code expires in 24 hours.</p>
```

## 🎯 User Flow

1. **Signup** → Supabase sends email with both link and code
2. **OTP Page** → User can choose:
   - Click email link (automatic verification)
   - Enter 6-digit code manually
3. **Verification** → Page detects confirmation and redirects to login
4. **Login** → User can now log in with verified account

## 🔍 Testing

1. **Complete signup** with real email address
2. **Check email** for confirmation message
3. **Test both methods**:
   - Click link in email
   - Enter code manually on OTP page
4. **Verify redirect** to login page after confirmation

## 📝 Notes

- Supabase automatically generates 6-digit codes
- Email confirmation links work across devices
- OTP page listens for auth state changes
- Manual code entry provides backup option
