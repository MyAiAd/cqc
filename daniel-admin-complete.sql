-- Complete Daniel Super Admin Setup
-- This script handles user creation AND admin setup with multiple fallback options

-- Step 1: Ensure required practices exist
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000010', 'HCQC Healthcare', 'hcqc.co.uk', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 2: Create user and setup admin permissions
CREATE OR REPLACE FUNCTION create_daniel_complete()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daniel_auth_id uuid;
  admin_practice_id uuid;
  result_message TEXT;
BEGIN
  -- Get admin practice ID
  SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
  
  -- Check if Daniel exists in auth.users
  SELECT id INTO daniel_auth_id FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
  
  IF daniel_auth_id IS NULL THEN
    -- Try to create user via admin function
    BEGIN
      SELECT auth.admin_create_user(
        email := 'daniel@hcqc.co.uk',
        password := 'mJtXkqWmChC5',
        email_confirm := true
      ) INTO daniel_auth_id;
      
      result_message := 'User created via admin function. ';
    EXCEPTION
      WHEN OTHERS THEN
        -- If admin function fails, generate UUID for manual creation instructions
        daniel_auth_id := gen_random_uuid();
        result_message := 'Admin function failed. Manual auth user creation needed with ID: ' || daniel_auth_id || '. ';
    END;
  ELSE
    result_message := 'User already exists in auth.users. ';
  END IF;
  
  -- Create or update user in public.users table
  INSERT INTO users (id, practice_id, email, name, role)
  VALUES (
    daniel_auth_id, 
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
      ELSE users.name || ' (Super Admin)'
    END;
  
  result_message := result_message || 'Super Admin permissions configured successfully.';
  
  RETURN result_message;
END;
$$;

-- Step 3: Setup RLS policies (simplified version focusing on core tables)
-- Users policy
DROP POLICY IF EXISTS "users_super_admin_access" ON users;
CREATE POLICY "users_super_admin_access" ON users
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

-- Practices policy
DROP POLICY IF EXISTS "practices_super_admin_access" ON practices;
CREATE POLICY "practices_super_admin_access" ON practices
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Staff policy
DROP POLICY IF EXISTS "staff_super_admin_access" ON staff;
CREATE POLICY "staff_super_admin_access" ON staff
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Tasks policy
DROP POLICY IF EXISTS "tasks_super_admin_access" ON tasks;
CREATE POLICY "tasks_super_admin_access" ON tasks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- Evidence items (safe approach - super admin only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "evidence_items_super_admin_access" ON evidence_items';
    EXECUTE 'CREATE POLICY "evidence_items_super_admin_access" ON evidence_items
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
        OR
        practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
      )';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'evidence_comments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "evidence_comments_super_admin_access" ON evidence_comments';
    EXECUTE 'CREATE POLICY "evidence_comments_super_admin_access" ON evidence_comments
      FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) = ''super_admin''
      )';
  END IF;
END $$;

-- Step 4: Run the setup
SELECT create_daniel_complete() as setup_result;

-- Step 5: Verification
SELECT 'VERIFICATION RESULTS:' as section;

SELECT 
  'Auth User:' as type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'EXISTS'
    ELSE 'MISSING - needs manual creation'
  END as status,
  (SELECT id::text FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') as user_id;

SELECT 
  'Public User:' as type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'CONFIGURED AS SUPER ADMIN'
    ELSE 'NOT CONFIGURED'
  END as status,
  '' as user_id;

-- Instructions
SELECT 'INSTRUCTIONS:' as section;
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') AND
         EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'SUCCESS: Daniel can now log in as Super Admin with email: daniel@hcqc.co.uk and password: mJtXkqWmChC5'
    WHEN NOT EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'MANUAL STEP NEEDED: Create auth user manually in Supabase Dashboard, then re-run this script'
    ELSE 'PARTIAL SUCCESS: Auth user exists but permissions need to be re-run'
  END as next_steps; 