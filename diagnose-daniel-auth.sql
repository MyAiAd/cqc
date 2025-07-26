-- Diagnose Daniel's Authentication Issues
-- Run this to see exactly what's wrong with Daniel's auth setup

SELECT '=== DANIEL AUTH DIAGNOSIS ===' as section;

-- Check if Daniel exists in auth.users
SELECT 
  'AUTH.USERS STATUS:' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  (SELECT id::text FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as user_id,
  (SELECT email FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as actual_email,
  (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as email_confirmed,
  (SELECT encrypted_password IS NOT NULL AND encrypted_password != '' FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as has_password;

-- Check if Daniel exists in public.users
SELECT 
  'PUBLIC.USERS STATUS:' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  (SELECT id::text FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as user_id,
  (SELECT role FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as role,
  (SELECT practice_id::text FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as practice_id;

-- Check if IDs match between auth.users and public.users
SELECT 
  'ID CONSISTENCY:' as check_type,
  CASE 
    WHEN (SELECT id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') = 
         (SELECT id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'MATCH'
    ELSE 'MISMATCH'
  END as status,
  (SELECT id::text FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as auth_id,
  (SELECT id::text FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as public_id;

-- Check detailed auth.users information
SELECT 
  'DETAILED AUTH INFO:' as section,
  au.id,
  au.email,
  au.created_at,
  au.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN au.encrypted_password IS NULL THEN 'NO PASSWORD'
    WHEN au.encrypted_password = '' THEN 'EMPTY PASSWORD'
    ELSE 'PASSWORD SET'
  END as password_status,
  au.aud,
  au.role as auth_role
FROM auth.users au
WHERE LOWER(au.email) = 'daniel@hcqc.co.uk';

-- Check if there are any similar emails that might be causing conflicts
SELECT 
  'SIMILAR EMAILS:' as section,
  email,
  id,
  created_at,
  CASE 
    WHEN encrypted_password IS NULL THEN 'NO PASSWORD'
    WHEN encrypted_password = '' THEN 'EMPTY PASSWORD'
    ELSE 'PASSWORD SET'
  END as password_status
FROM auth.users 
WHERE email ILIKE '%daniel%' 
   OR email ILIKE '%hcqc%'
ORDER BY email;

-- Final recommendation
SELECT 
  'RECOMMENDATION:' as section,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'Daniel does not exist in auth.users - need to create auth user first'
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND (encrypted_password IS NULL OR encrypted_password = ''))
    THEN 'Daniel exists but has no password - need to set password'
    WHEN NOT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'Daniel exists in auth but not in public users - need to create public user record'
    WHEN (SELECT id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') != 
         (SELECT id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'ID mismatch between auth and public users - need to fix consistency'
    ELSE 'Setup looks correct - password might need to be reset'
  END as action_needed; 