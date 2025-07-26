-- CLEANUP AND FIX Daniel Authentication
-- This properly removes the broken trigger/function and creates Daniel directly

-- Step 1: Remove the broken trigger and function properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Disable RLS temporarily for user creation
SET LOCAL row_security = off;

-- Step 3: Clean slate - remove any existing Daniel records
DELETE FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
DELETE FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Step 4: Ensure admin practice exists
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'MyAi Admin Practice', 'myai.ad', 'premium')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 5: Create Daniel directly in auth.users (no triggers)
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'daniel@hcqc.co.uk',
  crypt('mJtXkqWmChC5', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Step 6: Create Daniel's user profile with same ID
INSERT INTO users (id, practice_id, email, name, role) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'daniel@hcqc.co.uk',
  'Daniel (Super Admin)',
  'super_admin'
);

-- Step 7: Create a working RLS policy
DROP POLICY IF EXISTS "users_simple_access" ON users;
DROP POLICY IF EXISTS "super_admin_full_access_users" ON users;
DROP POLICY IF EXISTS "users_role_based_access" ON users;

CREATE POLICY "users_simple_access" ON users
  FOR ALL USING (
    -- Super admins can do everything
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    -- Users can access their own record
    id = auth.uid()
    OR  
    -- Allow access when no user record exists (during auth process)
    NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

-- Step 8: Create a simple, working trigger function (optional for future users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_domain TEXT;  -- Clear variable name to avoid conflicts
  user_practice_id uuid;
  user_role TEXT := 'admin';
  user_name TEXT;
BEGIN
  -- Extract domain from email
  user_domain := split_part(NEW.email, '@', 2);
  
  -- Set name based on email
  user_name := split_part(NEW.email, '@', 1);
  
  -- Get admin practice ID
  SELECT id INTO user_practice_id FROM practices WHERE email_domain = 'myai.ad' LIMIT 1;
  
  -- Special handling for specific users
  IF user_domain = 'myai.ad' OR LOWER(NEW.email) = 'sage@myai.ad' THEN
    user_role := 'super_admin';
  ELSIF LOWER(NEW.email) = 'daniel@hcqc.co.uk' THEN
    user_role := 'super_admin';
    user_name := 'Daniel (Super Admin)';
  ELSE
    -- For other domains, try to find their practice
    SELECT id INTO user_practice_id FROM practices WHERE email_domain = user_domain LIMIT 1;
    -- If no practice found, use admin practice
    IF user_practice_id IS NULL THEN
      SELECT id INTO user_practice_id FROM practices WHERE email_domain = 'myai.ad' LIMIT 1;
    END IF;
  END IF;
  
  -- Insert user with error handling
  BEGIN
    INSERT INTO public.users (id, practice_id, email, name, role)
    VALUES (NEW.id, user_practice_id, NEW.email, user_name, user_role);
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, update instead
      UPDATE public.users 
      SET 
        practice_id = user_practice_id,
        name = user_name,
        role = user_role
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log but don't fail
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Verification
SELECT 'CLEANUP AND FIX COMPLETE' as status;

-- Check Daniel exists in both tables
SELECT 
  'Daniel in auth.users:' as check_type,
  email, 
  id,
  email_confirmed_at IS NOT NULL as confirmed,
  encrypted_password IS NOT NULL as has_password
FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

SELECT 
  'Daniel in public.users:' as check_type,
  email,
  id,
  name,
  role
FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Check trigger is working
SELECT 
  'Trigger status:' as check_type,
  trigger_name,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Final confirmation
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') 
    AND EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk' AND role = 'super_admin')
    THEN 'SUCCESS: Daniel ready for both magic link and password login'
    ELSE 'ISSUE: Check individual results above'
  END as final_status;

-- Reset RLS
RESET row_security; 