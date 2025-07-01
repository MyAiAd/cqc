-- DEBUG RLS POLICIES - Check current state and completely fix
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what policies currently exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 2. Check what functions exist
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%' OR routine_name LIKE '%user%'
ORDER BY routine_name;

-- 3. COMPLETE NUCLEAR OPTION - Drop everything and start fresh
-- This will completely eliminate any possibility of recursion

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Drop any existing functions that might cause issues
DROP FUNCTION IF EXISTS auth_user_is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Create the simplest possible super admin check (no table queries at all)
CREATE OR REPLACE FUNCTION is_super_admin_direct()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.email() = 'sage@myai.ad';
$$;

-- USERS table: Completely simple - no subqueries or complex logic
CREATE POLICY "users_basic_access" ON users
  FOR ALL USING (
    -- Users can see their own record
    id = auth.uid()
    OR 
    -- Super admin can see all (direct email check only)
    is_super_admin_direct()
  );

-- PRACTICES table: Simple access 
CREATE POLICY "practices_basic_access" ON practices
  FOR ALL USING (
    is_super_admin_direct()
    OR
    -- Direct lookup without complex joins
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.practice_id = practices.id
    )
  );

-- STAFF table: Simple practice-based access
CREATE POLICY "staff_basic_access" ON staff
  FOR ALL USING (
    is_super_admin_direct()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.practice_id = staff.practice_id
    )
  );

-- TASKS table: Simple practice-based access
CREATE POLICY "tasks_basic_access" ON tasks
  FOR ALL USING (
    is_super_admin_direct()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.practice_id = tasks.practice_id
    )
  );

-- COMPETENCIES table: Simple practice-based access
CREATE POLICY "competencies_basic_access" ON competencies
  FOR ALL USING (
    is_super_admin_direct()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.practice_id = competencies.practice_id
    )
  );

-- Add performance index (removed the invalid auth.uid() index)
CREATE INDEX IF NOT EXISTS idx_users_id_practice ON users(id, practice_id);

-- Fix Sage's user record to ensure it exists with correct role
DO $$
DECLARE
  sage_user_id uuid;
  admin_practice_id uuid;
BEGIN
  -- Get sage's user ID from auth.users
  SELECT id INTO sage_user_id FROM auth.users WHERE email = 'sage@myai.ad';
  
  IF sage_user_id IS NOT NULL THEN
    -- Ensure admin practice exists
    INSERT INTO practices (id, name, email_domain, subscription_tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium')
    ON CONFLICT (email_domain) DO UPDATE SET 
      name = 'Harmony Admin',
      subscription_tier = 'premium';
      
    SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
    
    -- Ensure user record exists with correct role
    INSERT INTO users (id, practice_id, email, name, role)
    VALUES (sage_user_id, admin_practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      name = 'Sage (Super Admin)',
      practice_id = admin_practice_id;
      
    RAISE NOTICE 'Fixed sage@myai.ad user record with super_admin role';
  ELSE
    RAISE NOTICE 'sage@myai.ad not found in auth.users - user needs to sign in first';
  END IF;
END $$;

-- Test the function to make sure it works
SELECT 
  'Super admin check:' as test,
  is_super_admin_direct() as result,
  auth.email() as current_email;

SELECT 'RLS policies completely rebuilt - recursion eliminated!' as status; 