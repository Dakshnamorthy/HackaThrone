# Supabase Authentication Setup Guide

## 🔧 Database Setup

1. **Run the SQL Script**:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the entire content of `supabase-auth-setup.sql`
   - Execute the script

## 📧 Enable Email Confirmation

1. **Go to Supabase Dashboard**:
   - Navigate to Authentication → Settings

2. **Enable Email Confirmation**:
   - Toggle ON "Enable email confirmations"
   - Set "Confirm email" to ON

3. **Configure Email Templates** (Optional):
   - Go to Authentication → Email Templates
   - Customize the "Confirm signup" template if needed

## 🔐 Authentication Flow

### For Citizens:
1. **Signup**: `/signup`
   - Uses Supabase Auth `signUp()` with email confirmation
   - Sends confirmation email automatically
   - Creates citizen record via database trigger

2. **Email Verification**:
   - User clicks link in email
   - Supabase automatically confirms the account
   - Database trigger updates `is_verified` status

3. **Login**: `/login`
   - Uses Supabase Auth `signInWithPassword()`
   - Checks `email_confirmed_at` field
   - Prevents login if email not confirmed

### For Government Staff:
- Uses custom authentication (unchanged)
- Direct database lookup with unique_id/password
- No email verification required

## 🎯 Key Features

✅ **Real Email Delivery**: Supabase sends actual emails
✅ **Automatic Triggers**: Database updates on email confirmation
✅ **Secure Authentication**: Uses Supabase Auth infrastructure
✅ **Dual System**: Citizens use Supabase Auth, Staff use custom auth
✅ **Session Management**: Proper auth state handling

## 🚀 Testing

1. **Citizen Signup**:
   - Fill signup form
   - Check email for confirmation link
   - Click link to verify
   - Login with verified credentials

2. **Government Login**:
   - Use staff credentials (e.g., ELEC001 / KaRt#1981)
   - Works independently of Supabase Auth

## 📝 Notes

- Email confirmation is required for citizen accounts
- Government staff accounts bypass email verification
- Database triggers handle citizen record creation automatically
- RLS policies ensure proper data access control
