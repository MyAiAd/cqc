# Complete Setup Instructions

## Database Setup

### Step 1: Run Main Schema
First, run the main database schema from `supabase-setup.md`:
1. Go to your Supabase SQL Editor
2. Copy and paste the entire SQL from `supabase-setup.md` (lines 17-225)
3. Run the SQL

### Step 2: Run Admin Setup
Next, run the admin setup and sample data:
1. Copy and paste the entire content from `admin-setup.sql`
2. Run this SQL in your Supabase SQL Editor

This will:
- ✅ Add `super_admin` role capability
- ✅ Update RLS policies to allow super admin cross-practice access
- ✅ Create 4 sample practices (including admin practice)
- ✅ Create realistic staff members for each practice
- ✅ Create sample tasks with Harmony360 mappings
- ✅ Create competency records showing various training statuses

## Sample Data Created

### Practices:
1. **Harmony Admin** (harmony360.com) - Premium - For admin users
2. **Greenwood Medical Centre** (greenwood-medical.nhs.uk) - Basic
3. **Riverside Health Practice** (riverside-health.co.uk) - Premium  
4. **City Centre GP Surgery** (citycentregp.nhs.uk) - Free

### Sample Staff (across all practices):
- GPs, Practice Nurses, Practice Managers, Receptionists
- Different departments: Clinical, Management, Administration, Quality Assurance

### Sample Tasks with Harmony360 mappings:
- Daily Equipment Safety Checks
- Patient Medicine Reviews
- Infection Control Audits
- Staff Training Records
- Patient Feedback Analysis
- Clinical Governance Meetings
- Data Security Backups
- Emergency Procedures Reviews

### Competency Statuses:
- ✅ Competent
- 🟡 Training Required
- 🔴 Re-Training Required
- 🟠 Trained awaiting sign off
- ⚪ Not Applicable

## Creating Admin User

To create an admin user that can see all practices:

1. **Sign up with magic link** using an email from the admin domain: `admin@harmony360.com`

2. **After authentication, manually update the user record** in Supabase:
   ```sql
   -- Find the new user ID from auth.users table
   SELECT id, email FROM auth.users WHERE email = 'admin@harmony360.com';
   
   -- Insert the user profile (replace YOUR_USER_ID with actual ID)
   INSERT INTO users (id, practice_id, email, name, role) VALUES 
   ('YOUR_USER_ID', '00000000-0000-0000-0000-000000000001', 'admin@harmony360.com', 'Admin User', 'super_admin');
   ```