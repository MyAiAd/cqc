-- DIAGNOSTIC SCRIPT FOR AUTH ISSUES
-- Run this in Supabase SQL Editor to understand the current state

-- 1. Check what practices exist
SELECT 'PRACTICES:' as section, name, email_domain, subscription_tier, id FROM practices ORDER BY name;

-- 2. Check what users exist (if any)
SELECT 'USERS:' as section, email, name, role, practice_id, id FROM users ORDER BY email;

-- 3. Check what auth users exist
SELECT 'AUTH USERS:' as section, email, created_at, id FROM auth.users ORDER BY email;

-- 4. Check what RLS policies are currently active
SELECT 
  'RLS POLICIES:' as section,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 5. Check what functions exist for user management
SELECT 
  'FUNCTIONS:' as section,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%admin%' OR routine_name LIKE '%user%' OR routine_name LIKE '%role%')
ORDER BY routine_name;

-- 6. Test the get_user_role function if it exists
SELECT 'ROLE TEST:' as section, 'Current user role: ' || COALESCE(get_user_role(), 'NO ROLE FOUND') as result;

-- 7. Check triggers on auth.users
SELECT 
  'TRIGGERS:' as section,
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name; 