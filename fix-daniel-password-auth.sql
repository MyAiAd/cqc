-- Fix Daniel's Password Authentication Issues
-- This script handles the most common authentication problems

-- Step 1: Ensure Daniel exists in auth.users with correct password
DO $$
DECLARE
  daniel_auth_id uuid;
  daniel_public_id uuid;
  admin_practice_id uuid := '00000000-0000-0000-0000-000000000001';
  fixed_user_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Get admin practice ID
  SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad' LIMIT 1;
  
  -- Check current state
  SELECT id INTO daniel_auth_id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  SELECT id INTO daniel_public_id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  
  RAISE NOTICE 'Current auth ID: %, public ID: %', daniel_auth_id, daniel_public_id;
  
  -- Fix 1: If Daniel doesn't exist in auth.users, create him
  IF daniel_auth_id IS NULL THEN
    RAISE NOTICE 'Creating Daniel in auth.users...';
    
    -- Try admin function first
    BEGIN
      PERFORM auth.admin_create_user(
        user_id := fixed_user_id,
        email := 'daniel@hcqc.co.uk',
        password := 'mJtXkqWmChC5',
        email_confirm := true
      );
      daniel_auth_id := fixed_user_id;
      RAISE NOTICE 'Created via admin function';
    EXCEPTION
      WHEN OTHERS THEN
        -- Direct insertion method
        BEGIN
          INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            aud,
            role
          ) VALUES (
            fixed_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'daniel@hcqc.co.uk',
            crypt('mJtXkqWmChC5', gen_salt('bf')),
            now(),
            now(),
            now(),
            'authenticated',
            'authenticated'
          );
          daniel_auth_id := fixed_user_id;
          RAISE NOTICE 'Created via direct insertion';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create auth user: %', SQLERRM;
        END;
    END;
  ELSE
    -- Fix 2: Daniel exists but password might be wrong - reset it
    RAISE NOTICE 'Resetting Daniel password in auth.users...';
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('mJtXkqWmChC5', gen_salt('bf')),
      updated_at = now(),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = daniel_auth_id;
  END IF;
  
  -- Fix 3: Ensure Daniel exists in public.users with correct ID
  IF daniel_public_id IS NULL THEN
    RAISE NOTICE 'Creating Daniel in public.users...';
    INSERT INTO users (id, practice_id, email, name, role)
    VALUES (
      daniel_auth_id,
      admin_practice_id,
      'daniel@hcqc.co.uk',
      'Daniel (Super Admin)',
      'super_admin'
    );
  ELSIF daniel_public_id != daniel_auth_id THEN
    -- Fix 4: ID mismatch - update public.users to match auth.users
    RAISE NOTICE 'Fixing ID mismatch between auth and public users...';
    UPDATE users 
    SET 
      id = daniel_auth_id,
      role = 'super_admin',
      practice_id = admin_practice_id,
      name = 'Daniel (Super Admin)'
    WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  ELSE
    -- Fix 5: Ensure correct role and practice
    RAISE NOTICE 'Updating Daniel role and practice...';
    UPDATE users 
    SET 
      role = 'super_admin',
      practice_id = admin_practice_id,
      name = CASE 
        WHEN name LIKE '%(Super Admin)%' THEN name
        ELSE COALESCE(name, 'Daniel') || ' (Super Admin)'
      END
    WHERE id = daniel_auth_id;
  END IF;
  
  RAISE NOTICE 'Daniel authentication fix completed';
END $$;

-- Step 2: Verify the fix worked
SELECT '=== VERIFICATION AFTER FIX ===' as section;

-- Check auth.users
SELECT 
  'AUTH USER STATUS:' as check_type,
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  CASE 
    WHEN au.encrypted_password IS NULL THEN 'NO PASSWORD'
    WHEN au.encrypted_password = '' THEN 'EMPTY PASSWORD'
    ELSE 'PASSWORD SET'
  END as password_status,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE LOWER(au.email) = 'daniel@hcqc.co.uk';

-- Check public.users
SELECT 
  'PUBLIC USER STATUS:' as check_type,
  u.id,
  u.email,
  u.name,
  u.role,
  p.name as practice_name
FROM users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) = 'daniel@hcqc.co.uk';

-- Check ID consistency
SELECT 
  'ID CONSISTENCY CHECK:' as check_type,
  CASE 
    WHEN (SELECT id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') = 
         (SELECT id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'MATCH ✅'
    ELSE 'MISMATCH ❌'
  END as id_match_status;

-- Final status
SELECT 
  'FINAL STATUS:' as section,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND encrypted_password IS NOT NULL AND encrypted_password != '') AND
         EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin') AND
         (SELECT id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') = 
         (SELECT id FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'SUCCESS: Daniel should now be able to log in with both magic link and password (mJtXkqWmChC5)'
    ELSE 'ISSUE: Daniel setup still has problems - run diagnose-daniel-auth.sql for details'
  END as login_status; 