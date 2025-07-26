-- Fix the ambiguous column reference error in handle_new_user function
-- This resolves the "email_domain" naming conflict

-- Step 1: Drop and recreate the function with fixed variable names
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email_domain TEXT;  -- Renamed to avoid conflict with practices.email_domain
  practice_record practices%ROWTYPE;
  user_role TEXT := 'admin';
  user_name TEXT;
BEGIN
  -- Extract domain from email
  user_email_domain := split_part(NEW.email, '@', 2);
  
  -- Get practice by email domain (now unambiguous)
  SELECT * INTO practice_record 
  FROM practices 
  WHERE practices.email_domain = user_email_domain 
  LIMIT 1;
  
  -- Set name based on email
  user_name := split_part(NEW.email, '@', 1);
  
  -- Special handling for admin domains and specific users
  IF user_email_domain = 'myai.ad' OR LOWER(NEW.email) = 'sage@myai.ad' THEN
    user_role := 'super_admin';
    -- Ensure admin practice exists
    IF practice_record.id IS NULL THEN
      INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
      ('00000000-0000-0000-0000-000000000001', 'MyAi Admin Practice', 'myai.ad', 'premium')
      ON CONFLICT (id) DO NOTHING;
      SELECT * INTO practice_record 
      FROM practices 
      WHERE practices.email_domain = 'myai.ad' 
      LIMIT 1;
    END IF;
  ELSIF LOWER(NEW.email) = 'daniel@hcqc.co.uk' THEN
    user_role := 'super_admin';
    user_name := 'Daniel (Super Admin)';
    -- Use admin practice for Daniel
    SELECT * INTO practice_record 
    FROM practices 
    WHERE practices.email_domain = 'myai.ad' 
    LIMIT 1;
  END IF;
  
  -- If no practice found, use admin practice as fallback
  IF practice_record.id IS NULL THEN
    -- For unknown domains, use admin practice and set as admin
    SELECT * INTO practice_record 
    FROM practices 
    WHERE practices.email_domain = 'myai.ad' 
    LIMIT 1;
    user_role := 'admin';
  END IF;
  
  -- Insert user with error handling
  BEGIN
    INSERT INTO public.users (id, practice_id, email, name, role)
    VALUES (NEW.id, practice_record.id, NEW.email, user_name, user_role);
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, update instead
      UPDATE public.users 
      SET 
        practice_id = practice_record.id,
        name = user_name,
        role = user_role
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Test the function fix
SELECT 'FUNCTION FIXED - Testing...' as status;

-- Test that the function exists and is properly defined
SELECT 
  'FUNCTION STATUS:' as check_type,
  routine_name,
  routine_type,
  routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Test that the trigger exists
SELECT 
  'TRIGGER STATUS:' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'Function ambiguity fixed - you can now run the emergency fix script again' as result; 