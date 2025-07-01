-- AUTH DIAGNOSTIC AND FIX SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix authentication issues

-- 1. Check what users exist in auth.users
SELECT 
  'Auth Users:' as section,
  id, 
  email, 
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check what users exist in public.users table
SELECT 
  'Public Users:' as section,
  id,
  email,
  name,
  role,
  practice_id,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check practices table
SELECT 
  'Practices:' as section,
  id,
  name,
  email_domain,
  subscription_tier
FROM public.practices
ORDER BY created_at DESC;

-- 4. Check current RLS policies
SELECT 
  'Current RLS Policies:' as section,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 5. IMMEDIATE FIXES:

-- First, let's disable RLS temporarily to diagnose the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices DISABLE ROW LEVEL SECURITY;

-- Check if sage@myai.ad has a user record
DO $$
DECLARE
  sage_auth_id uuid;
  admin_practice_id uuid;
BEGIN
  -- Check if sage@myai.ad exists in auth.users
  SELECT id INTO sage_auth_id FROM auth.users WHERE email = 'sage@myai.ad';
  
  IF sage_auth_id IS NOT NULL THEN
    RAISE NOTICE 'Found sage@myai.ad in auth.users with ID: %', sage_auth_id;
    
    -- Ensure admin practice exists
    INSERT INTO public.practices (id, name, email_domain, subscription_tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium')
    ON CONFLICT (email_domain) DO UPDATE SET 
      name = 'Harmony Admin',
      subscription_tier = 'premium'
    RETURNING id INTO admin_practice_id;
    
    -- Ensure user record exists
    INSERT INTO public.users (id, practice_id, email, name, role)
    VALUES (sage_auth_id, admin_practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      name = 'Sage (Super Admin)',
      practice_id = admin_practice_id;
      
    RAISE NOTICE 'Created/updated user record for sage@myai.ad';
  ELSE
    RAISE NOTICE 'sage@myai.ad NOT found in auth.users - user needs to sign in first';
  END IF;
END $$;

-- Check if RiseWith practice exists for sage@risewith.us
DO $$
DECLARE
  risewith_practice_id uuid;
BEGIN
  -- Create RiseWith practice if it doesn't exist
  INSERT INTO public.practices (name, email_domain, subscription_tier)
  VALUES ('RiseWith Admin', 'risewith.us', 'premium')
  ON CONFLICT (email_domain) DO UPDATE SET 
    name = 'RiseWith Admin',
    subscription_tier = 'premium'
  RETURNING id INTO risewith_practice_id;
  
  RAISE NOTICE 'Created/updated RiseWith practice with ID: %', risewith_practice_id;
END $$;

-- Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "users_basic_access" ON public.users;
DROP POLICY IF EXISTS "practices_basic_access" ON public.practices;

-- Create very simple RLS policies
CREATE POLICY "users_simple_access" ON public.users
  FOR ALL USING (
    id = auth.uid() OR 
    auth.email() = 'sage@myai.ad'
  );

CREATE POLICY "practices_simple_access" ON public.practices
  FOR ALL USING (
    auth.email() = 'sage@myai.ad' OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.practice_id = practices.id
    )
  );

-- Final verification
SELECT 
  'Final Check:' as section,
  u.email,
  u.role,
  p.name as practice_name,
  u.created_at
FROM public.users u
LEFT JOIN public.practices p ON u.practice_id = p.id
ORDER BY u.created_at DESC;

SELECT 'Diagnostic and fix complete!' as status; 