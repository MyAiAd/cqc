-- Force Create Daniel as Super Admin - Bypass Dashboard Issues
-- This script uses direct SQL methods to create the user and bypass RLS restrictions

-- Step 1: Temporarily disable RLS for user creation (if needed)
SET LOCAL row_security = off;

-- Step 2: Ensure both admin practices exist
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'MyAi Admin Practice', 'myai.ad', 'premium')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000010', 'HCQC Healthcare', 'hcqc.co.uk', 'premium')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 3: Create Daniel directly in auth.users (bypassing dashboard)
DO $$
DECLARE
  daniel_user_id uuid := '11111111-1111-1111-1111-111111111111'; -- Fixed UUID for Daniel
  admin_practice_id uuid := '00000000-0000-0000-0000-000000000001';
  hcqc_practice_id uuid := '00000000-0000-0000-0000-000000000010';
  creation_result TEXT;
BEGIN
  -- Check if Daniel already exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = daniel_user_id OR LOWER(email) = 'daniel@hcqc.co.uk') THEN
    
    -- Method 1: Try admin_create_user function first
    BEGIN
      PERFORM auth.admin_create_user(
        user_id := daniel_user_id,
        email := 'daniel@hcqc.co.uk',
        password := 'mJtXkqWmChC5',
        email_confirm := true
      );
      creation_result := 'SUCCESS: Created via admin function';
    EXCEPTION
      WHEN OTHERS THEN
        -- Method 2: Direct insertion into auth.users
        BEGIN
          INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            last_sign_in_at,
            confirmation_sent_at,
            recovery_sent_at,
            email_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            deleted_at
          ) VALUES (
            daniel_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'daniel@hcqc.co.uk',
            crypt('mJtXkqWmChC5', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{}',
            '{}',
            false,
            'authenticated',
            'authenticated',
            '',
            '',
            '',
            '',
            null,
            now(),
            null,
            null,
            '',
            0,
            null,
            null
          );
          creation_result := 'SUCCESS: Created via direct insertion';
        EXCEPTION
          WHEN OTHERS THEN
            creation_result := 'FAILED: ' || SQLERRM;
        END;
    END;
  ELSE
    creation_result := 'ALREADY EXISTS: User found in auth.users';
  END IF;
  
  -- Step 4: Create/update Daniel in public.users as super_admin
  INSERT INTO users (id, practice_id, email, name, role)
  VALUES (
    daniel_user_id,
    admin_practice_id,
    'daniel@hcqc.co.uk',
    'Daniel (Super Admin)',
    'super_admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    practice_id = admin_practice_id,
    name = CASE 
      WHEN users.name LIKE '%(Super Admin)%' THEN users.name
      ELSE COALESCE(users.name, 'Daniel') || ' (Super Admin)'
    END,
    email = 'daniel@hcqc.co.uk';
  
  -- Also ensure Sage is properly configured as super admin
  UPDATE users 
  SET role = 'super_admin', practice_id = admin_practice_id
  WHERE LOWER(email) = 'sage@myai.ad';
  
  RAISE NOTICE 'Auth user creation: %', creation_result;
  RAISE NOTICE 'Daniel configured as Super Admin';
  RAISE NOTICE 'Sage confirmed as Super Admin';
  
END $$;

-- Step 5: Create comprehensive RLS policies for super admin access
-- Drop existing policies and create new ones with clear naming

-- Users table
DROP POLICY IF EXISTS "users_role_based_access" ON users;
DROP POLICY IF EXISTS "users_super_admin_access" ON users;
CREATE POLICY "super_admin_full_access_users" ON users
  FOR ALL USING (
    id = auth.uid() 
    OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') 
      AND practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
    )
  );

-- Practices table
DROP POLICY IF EXISTS "practices_role_based_access" ON practices;
DROP POLICY IF EXISTS "practices_super_admin_access" ON practices;
CREATE POLICY "super_admin_full_access_practices" ON practices
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Staff table
DROP POLICY IF EXISTS "staff_role_based_access" ON staff;
DROP POLICY IF EXISTS "staff_super_admin_access" ON staff;
CREATE POLICY "super_admin_full_access_staff" ON staff
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Tasks table
DROP POLICY IF EXISTS "tasks_role_based_access" ON tasks;
DROP POLICY IF EXISTS "tasks_super_admin_access" ON tasks;
CREATE POLICY "super_admin_full_access_tasks" ON tasks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Competencies table
DROP POLICY IF EXISTS "competencies_role_based_access" ON competencies;
DROP POLICY IF EXISTS "competencies_super_admin_access" ON competencies;
CREATE POLICY "super_admin_full_access_competencies" ON competencies
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Handle evidence tables safely
DO $$
BEGIN
  -- Evidence items
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "evidence_items_role_based_access" ON evidence_items';
    EXECUTE 'DROP POLICY IF EXISTS "evidence_items_super_admin_access" ON evidence_items';
    EXECUTE 'CREATE POLICY "super_admin_full_access_evidence_items" ON evidence_items
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
        OR
        practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
      )';
  END IF;
  
  -- Evidence comments - safe super admin only approach
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_comments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "evidence_comments_role_based_access" ON evidence_comments';
    EXECUTE 'DROP POLICY IF EXISTS "evidence_comments_super_admin_access" ON evidence_comments';
    EXECUTE 'CREATE POLICY "super_admin_full_access_evidence_comments" ON evidence_comments
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
      )';
  END IF;
  
  -- Policies table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policies') THEN
    EXECUTE 'DROP POLICY IF EXISTS "policies_role_based_access" ON policies';
    EXECUTE 'DROP POLICY IF EXISTS "policies_super_admin_access" ON policies';
    EXECUTE 'CREATE POLICY "super_admin_full_access_policies" ON policies
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
        OR
        practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
      )';
  END IF;
END $$;

-- Step 6: Final verification and results
SELECT '=== FINAL VERIFICATION ===' as status;

-- Check auth users
SELECT 
  'AUTH USERS:' as section,
  email,
  id,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users 
WHERE LOWER(email) IN ('sage@myai.ad', 'daniel@hcqc.co.uk')
ORDER BY email;

-- Check public users
SELECT 
  'PUBLIC USERS:' as section,
  u.email,
  u.name,
  u.role,
  p.name as practice_name,
  p.email_domain
FROM users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) IN ('sage@myai.ad', 'daniel@hcqc.co.uk')
ORDER BY u.email;

-- Check practices
SELECT 
  'PRACTICES:' as section,
  name,
  email_domain,
  subscription_tier,
  id
FROM practices 
WHERE email_domain IN ('myai.ad', 'hcqc.co.uk')
ORDER BY email_domain;

-- Final status
SELECT 
  'FINAL STATUS:' as section,
  CASE 
    WHEN 
      EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'sage@myai.ad') AND
      EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') AND
      EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'sage@myai.ad' AND role = 'super_admin') AND
      EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'SUCCESS: Both Sage and Daniel are configured as Super Admins'
    ELSE 'INCOMPLETE: Check individual results above'
  END as result;

-- Login instructions
SELECT 
  'LOGIN CREDENTIALS:' as section,
  'Sage: sage@myai.ad | Daniel: daniel@hcqc.co.uk (password: mJtXkqWmChC5)' as credentials; 