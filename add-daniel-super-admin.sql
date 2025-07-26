-- Add Daniel@hcqc.co.uk as Super Admin User
-- This script sets up Daniel with full Super Admin permissions and proper RLS access
-- 
-- PREREQUISITES:
-- 1. User must first be created in Supabase Auth with email: daniel@hcqc.co.uk and password: mJtXkqWmChC5
--    This can be done via:
--    - Supabase Dashboard > Authentication > Users > "Add user"
--    - Supabase Admin API
--    - Normal signup flow (then change password via dashboard)
--
-- INSTRUCTIONS:
-- 1. Create the user in Supabase Auth first (see prerequisites above)
-- 2. Run this script in Supabase SQL Editor
-- 3. User will have full Super Admin access to all practices and data

-- Step 1: Ensure the Super Admin practice exists
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 2: Ensure HCQC practice exists (in case Daniel needs access to their own practice data)
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000010', 'HCQC Healthcare', 'hcqc.co.uk', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 3: Function to promote Daniel to Super Admin (handles both new and existing users)
CREATE OR REPLACE FUNCTION setup_daniel_super_admin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daniel_auth_id uuid;
  admin_practice_id uuid;
  daniel_user_record users%ROWTYPE;
BEGIN
  -- Find Daniel in auth.users (case insensitive)
  SELECT au.id INTO daniel_auth_id 
  FROM auth.users au 
  WHERE LOWER(au.email) = 'daniel@hcqc.co.uk';
  
  IF daniel_auth_id IS NULL THEN
    RETURN 'ERROR: Daniel not found in auth.users. Please create the user in Supabase Auth first with email: daniel@hcqc.co.uk and password: mJtXkqWmChC5';
  END IF;
  
  -- Get admin practice ID
  SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
  
  -- Check if Daniel already exists in users table
  SELECT * INTO daniel_user_record FROM users WHERE id = daniel_auth_id;
  
  IF daniel_user_record IS NULL THEN
    -- Create new user record with super_admin role
    INSERT INTO users (id, practice_id, email, name, role)
    VALUES (
      daniel_auth_id, 
      admin_practice_id, 
      'daniel@hcqc.co.uk', 
      'Daniel (Super Admin)', 
      'super_admin'
    );
    RETURN 'SUCCESS: Daniel created as Super Admin with full system access';
  ELSE
    -- Update existing user to super_admin
    UPDATE users 
    SET 
      role = 'super_admin', 
      practice_id = admin_practice_id,
      name = CASE 
        WHEN name LIKE '%(Super Admin)%' THEN name
        ELSE name || ' (Super Admin)'
      END
    WHERE id = daniel_auth_id;
    RETURN 'SUCCESS: Daniel promoted to Super Admin with full system access';
  END IF;
END;
$$;

-- Step 4: Verify all required RLS policies exist for Super Admin access
-- These should already exist from previous admin setup, but ensuring they're current

-- Users table policy
DROP POLICY IF EXISTS "users_role_based_access" ON users;
CREATE POLICY "users_role_based_access" ON users
  FOR ALL USING (
    id = auth.uid() 
    OR 
    (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'super_admin'
    OR
    (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') 
      AND practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
    )
  );

-- Practices table policy  
DROP POLICY IF EXISTS "practices_role_based_access" ON practices;
CREATE POLICY "practices_role_based_access" ON practices
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Staff table policy
DROP POLICY IF EXISTS "staff_role_based_access" ON staff;
CREATE POLICY "staff_role_based_access" ON staff
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Tasks table policy
DROP POLICY IF EXISTS "tasks_role_based_access" ON tasks;
CREATE POLICY "tasks_role_based_access" ON tasks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Competencies table policy
DROP POLICY IF EXISTS "competencies_role_based_access" ON competencies;
CREATE POLICY "competencies_role_based_access" ON competencies
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Evidence storage tables (if they exist)
DO $$
DECLARE
  evidence_comments_practice_column TEXT;
  evidence_comments_reference_column TEXT;
BEGIN
  -- Handle evidence_items table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "evidence_items_role_based_access" ON evidence_items';
    EXECUTE 'CREATE POLICY "evidence_items_role_based_access" ON evidence_items
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
        OR
        practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
      )';
  END IF;
  
  -- Handle evidence_comments table with improved column detection and error handling
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_comments') THEN
    -- Check if evidence_comments has a practice_id column directly
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'evidence_comments' AND column_name = 'practice_id') THEN
      evidence_comments_practice_column := 'practice_id';
    ELSE
      evidence_comments_practice_column := NULL;
    END IF;
    
    -- Check for reference column to evidence_items with more thorough verification
    SELECT column_name INTO evidence_comments_reference_column
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'evidence_comments' 
      AND column_name IN ('evidence_id', 'evidence_item_id', 'item_id', 'task_id')
    ORDER BY 
      CASE column_name 
        WHEN 'evidence_id' THEN 1
        WHEN 'evidence_item_id' THEN 2 
        WHEN 'item_id' THEN 3
        WHEN 'task_id' THEN 4
        ELSE 5
      END
    LIMIT 1;
    
    EXECUTE 'DROP POLICY IF EXISTS "evidence_comments_role_based_access" ON evidence_comments';
    
    -- Create policy based on available columns with error handling
    BEGIN
      IF evidence_comments_practice_column IS NOT NULL THEN
        -- Direct practice_id reference
        EXECUTE 'CREATE POLICY "evidence_comments_role_based_access" ON evidence_comments
          FOR ALL USING (
            (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
            OR
            practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
          )';
      ELSIF evidence_comments_reference_column IS NOT NULL THEN
        -- Verify the reference column actually exists before using it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                    AND table_name = 'evidence_comments' 
                    AND column_name = evidence_comments_reference_column) THEN
          -- Reference through evidence_items table
          EXECUTE format('CREATE POLICY "evidence_comments_role_based_access" ON evidence_comments
            FOR ALL USING (
              (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
              OR
              %I IN (SELECT id FROM evidence_items WHERE practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()))
            )', evidence_comments_reference_column);
        ELSE
          -- Column doesn't actually exist, fallback to super_admin only
          EXECUTE 'CREATE POLICY "evidence_comments_role_based_access" ON evidence_comments
            FOR ALL USING (
              (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
            )';
        END IF;
      ELSE
        -- No suitable columns found, super_admin only access
        EXECUTE 'CREATE POLICY "evidence_comments_role_based_access" ON evidence_comments
          FOR ALL USING (
            (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
          )';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If any error occurs, create a safe super_admin only policy
        EXECUTE 'CREATE POLICY "evidence_comments_role_based_access" ON evidence_comments
          FOR ALL USING (
            (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
          )';
    END;
  END IF;
END $$;

-- Policies table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policies') THEN
    EXECUTE 'DROP POLICY IF EXISTS "policies_role_based_access" ON policies';
    EXECUTE 'CREATE POLICY "policies_role_based_access" ON policies
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
        OR
        practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
      )';
  END IF;
END $$;

-- Step 5: Run the setup function
SELECT setup_daniel_super_admin() as result;

-- Step 6: Verification queries
SELECT 'SETUP VERIFICATION:' as section;

-- Check if Daniel exists in auth.users
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'FOUND: Daniel exists in auth.users'
    ELSE 'NOT FOUND: Daniel needs to be created in Supabase Auth first'
  END as auth_status;

-- Check Daniel's user record and permissions
SELECT 
  'USER RECORD:' as section,
  u.email,
  u.name,
  u.role,
  p.name as practice_name,
  p.email_domain,
  p.subscription_tier
FROM users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) = 'daniel@hcqc.co.uk';

-- Check that RLS policies are in place
SELECT 
  'RLS POLICIES:' as section,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%role_based_access%'
ORDER BY tablename, policyname;

-- Final instructions
SELECT 'NEXT STEPS:' as instruction;
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'SUCCESS: Daniel is now a Super Admin! He can log in with daniel@hcqc.co.uk and access all system data.'
    ELSE 'PENDING: Complete the auth user creation first, then re-run: SELECT setup_daniel_super_admin();'
  END as status; 