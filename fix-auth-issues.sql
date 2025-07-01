-- COMPREHENSIVE AUTH FIX
-- Addresses both magic link issues and profile loading issues
-- This creates a hybrid approach: role-based + special handling for sage@myai.ad

-- 1. Drop all existing policies and functions to start clean
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Drop the trigger first, then the functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS can_manage_role();
DROP FUNCTION IF EXISTS promote_to_super_admin();
DROP FUNCTION IF EXISTS is_super_admin_direct();

-- 2. Create a robust user role function that handles the bootstrap case
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    -- Special case for sage@myai.ad - always super_admin regardless of db state
    WHEN auth.email() = 'sage@myai.ad' THEN 'super_admin'
    -- For all other users, check the users table
    ELSE (SELECT role FROM users WHERE id = auth.uid())
  END;
$$;

-- 3. Create a simple super admin check function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_user_role() = 'super_admin';
$$;

-- 4. Enhanced new user creation trigger that handles all cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  practice_record practices%ROWTYPE;
  user_role TEXT := 'admin';
  user_name TEXT;
BEGIN
  -- Extract domain from email (case insensitive)
  email_domain := LOWER(split_part(NEW.email, '@', 2));
  
  -- Special handling for sage@myai.ad
  IF LOWER(NEW.email) = 'sage@myai.ad' THEN
    -- Ensure admin practice exists
    INSERT INTO practices (id, name, email_domain, subscription_tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
    ON CONFLICT (email_domain) DO UPDATE SET 
      name = EXCLUDED.name,
      subscription_tier = EXCLUDED.subscription_tier;
    
    SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    user_role := 'super_admin';
    user_name := 'Sage (Super Admin)';
  ELSE
    -- Find or create practice for this domain
    SELECT * INTO practice_record FROM practices WHERE LOWER(practices.email_domain) = email_domain;
    
    IF practice_record IS NULL THEN
      -- Create a new practice for this domain
      INSERT INTO practices (name, email_domain, subscription_tier)
      VALUES (initcap(replace(email_domain, '.', ' ')), email_domain, 'basic')
      RETURNING * INTO practice_record;
    END IF;
    
    user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create user record
  INSERT INTO public.users (id, practice_id, email, name, role)
  VALUES (NEW.id, practice_record.id, NEW.email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    practice_id = EXCLUDED.practice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create balanced RLS policies that allow access but prevent issues

-- USERS table: Allow access with proper checks
CREATE POLICY "users_balanced_access" ON users
  FOR ALL USING (
    -- Users can always see their own record
    id = auth.uid() 
    OR 
    -- Super admins can see everything
    is_super_admin()
    OR
    -- Admins and managers can see users in their practice
    (get_user_role() IN ('admin', 'manager') AND practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()))
  );

-- PRACTICES table: Balanced access
CREATE POLICY "practices_balanced_access" ON practices
  FOR ALL USING (
    -- Super admins can see all practices
    is_super_admin()
    OR
    -- Users can see their own practice
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- STAFF table: Practice-based access
CREATE POLICY "staff_balanced_access" ON staff
  FOR ALL USING (
    is_super_admin()
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- TASKS table: Practice-based access
CREATE POLICY "tasks_balanced_access" ON tasks
  FOR ALL USING (
    is_super_admin()
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- COMPETENCIES table: Practice-based access
CREATE POLICY "competencies_balanced_access" ON competencies
  FOR ALL USING (
    is_super_admin()
    OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
  );

-- 6. Ensure required practices exist
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('11111111-1111-1111-1111-111111111111', 'RiseWith Healthcare', 'risewith.us', 'basic')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- 7. Fix any existing sage@myai.ad user record if it exists
DO $$
DECLARE
  sage_user_id uuid;
  admin_practice_id uuid;
BEGIN
  -- Get sage's user ID from auth.users if they exist
  SELECT id INTO sage_user_id FROM auth.users WHERE LOWER(email) = 'sage@myai.ad';
  
  IF sage_user_id IS NOT NULL THEN
    SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
    
    -- Ensure user record exists with correct role
    INSERT INTO users (id, practice_id, email, name, role)
    VALUES (sage_user_id, admin_practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      name = 'Sage (Super Admin)',
      practice_id = admin_practice_id;
      
    RAISE NOTICE 'Fixed sage@myai.ad user record';
  ELSE
    RAISE NOTICE 'sage@myai.ad not found in auth.users - will be created when they sign in';
  END IF;
END $$;

-- 8. Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_id_practice_role ON users(id, practice_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_practices_email_domain_lower ON practices(LOWER(email_domain));

-- 9. Test the functions
SELECT 'AUTH FIX COMPLETE!' as status;
SELECT 'Testing functions:' as test_section;
SELECT 'get_user_role()' as test_name, get_user_role() as result;
SELECT 'is_super_admin()' as test_name, is_super_admin() as result;

SELECT 'Practices created:' as info;
SELECT name, email_domain, subscription_tier FROM practices ORDER BY name; 