-- Simple Daniel Password Reset
-- Quick fix for password authentication issues

-- Method 1: Reset password using UPDATE (most common fix)
UPDATE auth.users 
SET 
  encrypted_password = crypt('mJtXkqWmChC5', gen_salt('bf')),
  updated_at = now(),
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Method 2: If update doesn't work, try Supabase admin function
DO $$
BEGIN
  -- Try to update password via admin function
  PERFORM auth.admin_update_user_by_email(
    email := 'daniel@hcqc.co.uk',
    attributes := '{"password": "mJtXkqWmChC5"}'::jsonb
  );
  RAISE NOTICE 'Password updated via admin function';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin function failed: %', SQLERRM;
END $$;

-- Verification
SELECT 
  'PASSWORD RESET RESULT:' as section,
  email,
  id,
  email_confirmed_at IS NOT NULL as email_confirmed,
  CASE 
    WHEN encrypted_password IS NULL THEN 'NO PASSWORD'
    WHEN encrypted_password = '' THEN 'EMPTY PASSWORD'
    ELSE 'PASSWORD SET ✅'
  END as password_status,
  updated_at
FROM auth.users 
WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Final message
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND encrypted_password IS NOT NULL AND encrypted_password != '')
    THEN 'SUCCESS: Daniel password reset to mJtXkqWmChC5 - try logging in again'
    ELSE 'FAILED: Password reset did not work - run diagnose-daniel-auth.sql for more details'
  END as result; 