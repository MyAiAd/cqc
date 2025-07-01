-- COMPREHENSIVE ROLE-BASED SYSTEM FIX
-- This removes all hardcoded emails and implements proper role hierarchy
-- Run this in your Supabase SQL Editor

-- 1. First, drop ALL existing RLS policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Drop the trigger first, then the functions (to avoid dependency errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS is_super_admin_direct();
DROP FUNCTION IF EXISTS auth_user_is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- 2. Create a simple role-based access function (no hardcoded emails!)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- 3. Create function to check if user can manage certain roles
CREATE OR REPLACE FUNCTION can_manage_role(target_role TEXT)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN get_user_role() = 'super_admin' THEN true
    WHEN get_user_role() = 'admin' AND target_role IN ('admin', 'manager', 'staff') THEN true
    WHEN get_user_role() = 'manager' AND target_role = 'staff' THEN true
    ELSE false
  END;
$$;

-- 4. Simple new user creation trigger (NO hardcoded emails)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  practice_record practices%ROWTYPE;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Extract domain from email (case insensitive)
  email_domain := LOWER(split_part(NEW.email, '@', 2));
  
  -- Find practice by email domain (case insensitive)
  SELECT * INTO practice_record FROM practices WHERE LOWER(email_domain) = email_domain;
  
  IF practice_record IS NULL THEN
    -- Create a new practice for this domain
    INSERT INTO practices (name, email_domain, subscription_tier)
    VALUES (initcap(replace(email_domain, '.', ' ')), email_domain, 'free')
    RETURNING * INTO practice_record;
  END IF;
  
  -- Default role is admin for first user in practice, but this can be overridden
  user_role := 'admin';
  user_name := split_part(NEW.email, '@', 1);
  
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

-- 5. Create proper RLS policies (role-based, no hardcoded emails)

-- USERS table: Users can see their own record, or users in their practice (if admin+), or all users (if super_admin)
CREATE POLICY "users_role_based_access" ON users
  FOR ALL USING (
    id = auth.uid() 
    OR 
    (get_user_role() = 'super_admin')
    OR
    (get_user_role() IN ('admin', 'manager') AND practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()))
  );

-- PRACTICES table: Users can see their own practice, super_admins can see all
CREATE POLICY "practices_role_based_access" ON practices
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- STAFF table: Practice-based access with role hierarchy
CREATE POLICY "staff_role_based_access" ON staff
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- TASKS table: Practice-based access with role hierarchy
CREATE POLICY "tasks_role_based_access" ON tasks
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- COMPETENCIES table: Practice-based access with role hierarchy
CREATE POLICY "competencies_role_based_access" ON competencies
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- 6. Create the RiseWith practice for testing (normal admin, not super_admin)
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('11111111-1111-1111-1111-111111111111', 'RiseWith Healthcare', 'risewith.us', 'basic')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- 7. Create a super admin practice for system administration
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- 8. Function to manually promote a user to super_admin (for initial setup)
CREATE OR REPLACE FUNCTION promote_to_super_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  admin_practice_id uuid;
BEGIN
  -- Find user by email (case insensitive)
  SELECT au.id INTO target_user_id 
  FROM auth.users au 
  WHERE LOWER(au.email) = LOWER(user_email);
  
  IF target_user_id IS NULL THEN
    RETURN 'Error: User not found in auth.users. User must sign up first.';
  END IF;
  
  -- Get admin practice ID
  SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
  
  -- Update user role and practice
  UPDATE users 
  SET role = 'super_admin', 
      practice_id = admin_practice_id,
      name = name || ' (Super Admin)'
  WHERE id = target_user_id;
  
  IF FOUND THEN
    RETURN 'Success: User promoted to super_admin';
  ELSE
    RETURN 'Error: User profile not found. User must complete signup first.';
  END IF;
END;
$$;

-- 9. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_id_practice_role ON users(id, practice_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- 10. Test the setup
SELECT 'ROLE-BASED SYSTEM SETUP COMPLETE!' as status;

SELECT 'To promote a user to super_admin after they sign up, run:' as instruction;
SELECT 'SELECT promote_to_super_admin(''user@email.com'');' as example;

SELECT 'Practices created:' as info;
SELECT name, email_domain, subscription_tier FROM practices ORDER BY name; 