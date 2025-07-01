-- FINAL RLS FIX - Complete elimination of recursion
-- Run this in your Supabase SQL Editor

-- First, completely drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_access_policy" ON users;
DROP POLICY IF EXISTS "practices_access" ON practices;
DROP POLICY IF EXISTS "staff_practice_access" ON staff;
DROP POLICY IF EXISTS "tasks_practice_access" ON tasks;
DROP POLICY IF EXISTS "competencies_practice_access" ON competencies;

-- Drop the old function that might be causing issues
DROP FUNCTION IF EXISTS is_super_admin();

-- Create a completely simple function that checks email directly from auth.users
-- This avoids any circular reference to the users table
CREATE OR REPLACE FUNCTION auth_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.email() = 'sage@myai.ad' OR auth.email() = 'Sage@MyAi.ad';
$$;

-- USERS TABLE: Simplest possible policy - no recursion
-- Allow users to see their own record OR if they're super admin (via auth.email check)
CREATE POLICY "users_simple_access" ON users
  FOR ALL USING (
    id = auth.uid() 
    OR 
    auth_user_is_super_admin()
  );

-- PRACTICES TABLE: Allow access if super admin OR if user belongs to the practice
-- We'll use a subquery that doesn't cause recursion
CREATE POLICY "practices_simple_access" ON practices
  FOR ALL USING (
    auth_user_is_super_admin()
    OR
    id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

-- STAFF TABLE: Allow access if super admin OR practice matches
CREATE POLICY "staff_simple_access" ON staff
  FOR ALL USING (
    auth_user_is_super_admin()
    OR
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

-- TASKS TABLE: Allow access if super admin OR practice matches  
CREATE POLICY "tasks_simple_access" ON tasks
  FOR ALL USING (
    auth_user_is_super_admin()
    OR
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

-- COMPETENCIES TABLE: Allow access if super admin OR practice matches
CREATE POLICY "competencies_simple_access" ON competencies
  FOR ALL USING (
    auth_user_is_super_admin()
    OR
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

-- Update the trigger to handle both email cases (case insensitive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  practice_record practices%ROWTYPE;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Special handling for super admin (case insensitive)
  IF LOWER(NEW.email) = 'sage@myai.ad' THEN
    -- Find or create the admin practice
    SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    IF practice_record IS NULL THEN
      INSERT INTO practices (id, name, email_domain, subscription_tier)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium');
      SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    END IF;
    user_role := 'super_admin';
    user_name := 'Sage (Super Admin)';
  ELSE
    -- Find practice by email domain
    SELECT * INTO practice_record FROM practices WHERE email_domain = email_domain;
    IF practice_record IS NULL THEN
      -- Create a new practice for this domain
      INSERT INTO practices (name, email_domain, subscription_tier)
      VALUES (initcap(replace(email_domain, '.', ' ')), email_domain, 'free')
      RETURNING * INTO practice_record;
    END IF;
    user_role := 'admin'; -- First user in a practice becomes admin
    user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create user record
  INSERT INTO public.users (id, practice_id, email, name, role)
  VALUES (NEW.id, practice_record.id, NEW.email, user_name, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Check and fix existing user record for sage@myai.ad
DO $$
DECLARE
  sage_user_id uuid;
  admin_practice_id uuid;
BEGIN
  -- Get sage's user ID from auth.users
  SELECT id INTO sage_user_id FROM auth.users WHERE LOWER(email) = 'sage@myai.ad';
  
  IF sage_user_id IS NOT NULL THEN
    -- Get or create admin practice
    SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
    IF admin_practice_id IS NULL THEN
      INSERT INTO practices (id, name, email_domain, subscription_tier)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium')
      RETURNING id INTO admin_practice_id;
    END IF;
    
    -- Update or insert user record
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

SELECT 'RLS policies fixed and sage@myai.ad updated!' as result; 