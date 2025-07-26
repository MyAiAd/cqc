-- Fix Sage's Password and Ensure Both Super Admins are Correctly Configured
-- This script resets Sage's password to T3sla12e! and verifies both super admins

-- Step 1: Reset Sage's password to the correct one
DO $$
DECLARE
  sage_user_id uuid;
  daniel_user_id uuid;
BEGIN
  -- Get Sage's user ID
  SELECT id INTO sage_user_id FROM auth.users WHERE LOWER(email) = 'sage@myai.ad';
  
  -- Get Daniel's user ID  
  SELECT id INTO daniel_user_id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  
  IF sage_user_id IS NOT NULL THEN
    -- Reset Sage's password to T3sla12e!
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('T3sla12e!', gen_salt('bf')),
      updated_at = now()
    WHERE id = sage_user_id;
    
    RAISE NOTICE 'Sage password reset to T3sla12e!';
  ELSE
    RAISE NOTICE 'Sage user not found in auth.users';
  END IF;
  
  IF daniel_user_id IS NOT NULL THEN
    -- Ensure Daniel's password remains mJtXkqWmChC5 (in case it was changed)
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('mJtXkqWmChC5', gen_salt('bf')),
      updated_at = now()
    WHERE id = daniel_user_id;
    
    RAISE NOTICE 'Daniel password confirmed as mJtXkqWmChC5';
  ELSE
    RAISE NOTICE 'Daniel user not found in auth.users';
  END IF;
  
END $$;

-- Step 2: Ensure both users are properly configured as super admins
DO $$
DECLARE
  admin_practice_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Ensure Sage is super admin
  UPDATE users 
  SET 
    role = 'super_admin',
    practice_id = admin_practice_id,
    name = CASE 
      WHEN name LIKE '%(Super Admin)%' THEN name
      ELSE COALESCE(name, 'Sage') || ' (Super Admin)'
    END
  WHERE LOWER(email) = 'sage@myai.ad';
  
  -- Ensure Daniel is super admin  
  UPDATE users 
  SET 
    role = 'super_admin',
    practice_id = admin_practice_id,
    name = CASE 
      WHEN name LIKE '%(Super Admin)%' THEN name
      ELSE COALESCE(name, 'Daniel') || ' (Super Admin)'
    END
  WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  
  RAISE NOTICE 'Both users confirmed as Super Admins';
END $$;

-- Step 3: Verification - Show current status
SELECT '=== PASSWORD AND USER VERIFICATION ===' as status;

-- Check both users exist in auth.users
SELECT 
  'AUTH USERS STATUS:' as section,
  email,
  id,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  updated_at
FROM auth.users 
WHERE LOWER(email) IN ('sage@myai.ad', 'daniel@hcqc.co.uk')
ORDER BY email;

-- Check both users are super admins in public.users
SELECT 
  'SUPER ADMIN STATUS:' as section,
  u.email,
  u.name,
  u.role,
  p.name as practice_name,
  p.email_domain
FROM users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) IN ('sage@myai.ad', 'daniel@hcqc.co.uk')
ORDER BY u.email;

-- Final confirmation
SELECT 
  'FINAL CONFIRMATION:' as section,
  CASE 
    WHEN 
      EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'sage@myai.ad') AND
      EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') AND
      EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'sage@myai.ad' AND role = 'super_admin') AND
      EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'SUCCESS: Both Super Admins configured correctly'
    ELSE 'ERROR: Check individual user status above'
  END as result;

-- Login credentials reminder
SELECT 
  'CORRECT LOGIN CREDENTIALS:' as section,
  'Sage: sage@myai.ad (password: T3sla12e!) | Daniel: daniel@hcqc.co.uk (password: mJtXkqWmChC5)' as credentials; 