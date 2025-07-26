-- Diagnose Daniel's "Database Error Saving New User" Issue
-- This happens when magic link auth works but user profile creation fails

SELECT '=== DANIEL DATABASE ERROR DIAGNOSIS ===' as section;

-- Check 1: Does Daniel exist in auth.users?
SELECT 
  'AUTH.USERS CHECK:' as check_type,
  COUNT(*) as count_found,
  STRING_AGG(email, ', ') as emails_found,
  STRING_AGG(id::text, ', ') as ids_found
FROM auth.users 
WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Check 2: Does Daniel exist in public.users?
SELECT 
  'PUBLIC.USERS CHECK:' as check_type,
  COUNT(*) as count_found,
  STRING_AGG(email, ', ') as emails_found,
  STRING_AGG(id::text, ', ') as ids_found,
  STRING_AGG(role, ', ') as roles_found
FROM users 
WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Check 3: Do required practices exist?
SELECT 
  'PRACTICES CHECK:' as check_type,
  COUNT(*) as admin_practices_found,
  STRING_AGG(name, ', ') as practice_names,
  STRING_AGG(email_domain, ', ') as domains
FROM practices 
WHERE email_domain IN ('myai.ad', 'hcqc.co.uk');

-- Check 4: Is the user creation trigger working?
SELECT 
  'TRIGGER CHECK:' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created' 
      AND event_object_table = 'users'
    ) THEN 'TRIGGER EXISTS'
    ELSE 'TRIGGER MISSING'
  END as trigger_status;

-- Check 5: Does the handle_new_user function exist?
SELECT 
  'FUNCTION CHECK:' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
      AND routine_type = 'FUNCTION'
    ) THEN 'FUNCTION EXISTS'
    ELSE 'FUNCTION MISSING'
  END as function_status;

-- Check 6: RLS policies on users table
SELECT 
  'RLS POLICIES CHECK:' as check_type,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Check 7: Can we simulate user creation?
DO $$
DECLARE
  test_practice_id uuid;
  test_result TEXT;
BEGIN
  -- Get admin practice ID
  SELECT id INTO test_practice_id FROM practices WHERE email_domain = 'myai.ad' LIMIT 1;
  
  IF test_practice_id IS NULL THEN
    test_result := 'FAILED: No admin practice found';
  ELSE
    -- Try to simulate what the trigger would do
    BEGIN
      -- This is just a test, we'll rollback
      PERFORM 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111';
      test_result := 'SIMULATION: Would insert with practice_id ' || test_practice_id;
    EXCEPTION
      WHEN OTHERS THEN
        test_result := 'SIMULATION FAILED: ' || SQLERRM;
    END;
  END IF;
  
  RAISE NOTICE 'User creation simulation: %', test_result;
END $$;

-- Check 8: Look for any existing Daniel records that might conflict
SELECT 
  'CONFLICTING RECORDS:' as check_type,
  'auth.users' as table_name,
  email,
  id,
  created_at,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email ILIKE '%daniel%' OR email ILIKE '%hcqc%'

UNION ALL

SELECT 
  'CONFLICTING RECORDS:' as check_type,
  'public.users' as table_name,
  email,
  id,
  created_at,
  NULL as confirmed
FROM users 
WHERE email ILIKE '%daniel%' OR email ILIKE '%hcqc%'
ORDER BY table_name, email;

-- Check 9: Current RLS setting
SELECT 
  'RLS STATUS:' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'practices', 'staff')
AND schemaname = 'public';

-- Final diagnosis
SELECT 
  'LIKELY CAUSE:' as section,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM practices WHERE email_domain = 'myai.ad')
    THEN 'Missing admin practice - user creation trigger cannot determine practice_id'
    WHEN NOT EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    )
    THEN 'Missing trigger - no automatic user profile creation after auth'
    WHEN NOT EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
    )
    THEN 'Missing handle_new_user function - trigger cannot execute'
    WHEN EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    AND EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    AND (SELECT id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk') != 
        (SELECT id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'ID mismatch between auth.users and public.users - constraint violation'
    WHEN EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'Daniel already exists in public.users - duplicate key constraint'
    ELSE 'RLS policies or other database constraints blocking user creation'
  END as probable_issue; 