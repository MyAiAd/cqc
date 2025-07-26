-- Check if Daniel already exists in auth.users and users tables
-- Run this in Supabase SQL Editor to diagnose the current state

SELECT 'AUTH USERS CHECK:' as section;

-- Check if Daniel exists in auth.users table
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE LOWER(email) = 'daniel@hcqc.co.uk';

SELECT 'USERS TABLE CHECK:' as section;

-- Check if Daniel exists in public.users table
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  p.name as practice_name,
  p.email_domain
FROM users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) = 'daniel@hcqc.co.uk';

SELECT 'EMAIL VARIATIONS CHECK:' as section;

-- Check for any email variations that might conflict
SELECT 
  email,
  id,
  created_at
FROM auth.users 
WHERE email ILIKE '%daniel%' 
   OR email ILIKE '%hcqc%';

SELECT 'PRACTICE CHECK:' as section;

-- Check if the required practices exist
SELECT 
  id,
  name,
  email_domain,
  subscription_tier
FROM practices 
WHERE email_domain IN ('myai.ad', 'hcqc.co.uk')
ORDER BY email_domain; 