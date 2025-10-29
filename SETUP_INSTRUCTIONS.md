# CivicApp Setup Instructions

## Overview
Your CivicApp now has a complete dual login system with separate interfaces for citizens and government staff, including OTP verification for citizen signup.

## 🗄️ Database Setup

### 1. Supabase Configuration
You've already configured your Supabase client with the correct URL and API key in `supabaseClient.js`.

### 2. Database Tables
Run the SQL script in `supabase-setup.sql` in your Supabase dashboard:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire content of `supabase-setup.sql`
4. Execute the script

This will create:
- `government_staff` table with hardcoded staff data
- `citizens` table for user registration
- `issues` table for complaint management
- `issue_updates` table for tracking status changes
- All necessary triggers and functions

## 🔐 Authentication System

### Citizen Login
- **Route**: `/login` (Citizen tab)
- **Credentials**: Email and Password
- **Features**: 
  - OTP verification during signup
  - Email-based authentication
  - Redirects to citizen interface (`/`)

### Government Staff Login
- **Route**: `/login` (Government Staff tab)
- **Credentials**: Staff ID and Password
- **Hardcoded Staff Accounts**:
  ```
  ELEC001 / KaRt#1981 (Electrical Department)
  ELEC002 / DiVy@1988 (Electrical Department)
  SANI001 / SeLv$1982 (Sanitation Department)
  SANI002 / MeEn%1990 (Sanitation Department)
  PWD001  / RaJe&1979 (Public Works Department)
  PWD002  / KaVi*1985 (Public Works Department)
  ```
- **Features**: Redirects to government dashboard (`/gov-dashboard`)

## 🏛️ Government Staff Interface

### Pages Created:
1. **Dashboard** (`/gov-dashboard`)
   - Overview statistics
   - Recent issues
   - Quick actions

2. **Reported Issues** (`/reported-issues`)
   - View all citizen complaints
   - Filter by status and type
   - Update issue status
   - Search functionality

3. **Staff Management** (`/staff-management`)
   - View all government staff
   - Filter by department
   - Staff information cards

4. **Analytics** (`/analytics`)
   - Issue statistics and trends
   - Department performance metrics
   - Time-based filtering
   - Visual charts and graphs

### Navigation:
- Separate `GovNavbar` component
- Different menu items (Dashboard, Reported Issues, Staff Management, Analytics)
- Orange "Staff" badge to distinguish from citizen interface

## 👥 Citizen Interface

### Signup Process:
1. **Registration Form**: Name, Email, Password, Confirm Password
2. **OTP Verification**: Email verification required
3. **Account Activation**: Must verify email before login

### Features:
- Original citizen pages remain unchanged
- Standard navbar for citizens
- Report issues, view map, check complaint status

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
- Execute `supabase-setup.sql` in Supabase SQL Editor

### 3. Run Application
```bash
npm run dev
```

### 4. Test the System

#### Test Citizen Flow:
1. Go to `/signup`
2. Create account with valid email
3. Check email for verification code
4. Verify account
5. Login with email/password

#### Test Government Staff Flow:
1. Go to `/login`
2. Switch to "Government Staff" tab
3. Use any staff credentials (e.g., ELEC001 / KaRt#1981)
4. Access government dashboard

## 📋 Key Features Implemented

✅ **Dual Authentication System**
- Role-based login (Citizen vs Government Staff)
- Separate user interfaces
- Secure authentication with Supabase

✅ **OTP Email Verification**
- Required for citizen signup
- Email-based verification system
- Account activation workflow

✅ **Government Staff Management**
- Hardcoded staff database
- Department-based organization
- Complete staff information

✅ **Issue Management System**
- Citizens can report issues
- Government staff can manage and update
- Status tracking and analytics

✅ **Responsive Design**
- Mobile-friendly interfaces
- Modern UI components
- Consistent styling across all pages

## 🔧 Technical Stack

- **Frontend**: React, React Router
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: CSS with responsive design
- **Icons**: Lucide React

## 📝 Notes

- Government staff passwords are stored in plain text for demo purposes
- In production, implement proper password hashing
- OTP verification uses Supabase's built-in email service
- All tables have Row Level Security (RLS) enabled
- Automatic issue ID generation based on department type

Your CivicApp is now ready with a complete dual-user system!
