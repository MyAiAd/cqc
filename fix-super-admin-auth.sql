-- COMPREHENSIVE SUPER ADMIN AUTHENTICATION FIX
-- This script will diagnose and fix all issues preventing sage@myai.ad from logging in

-- Step 1: Check current state
\echo '=== CHECKING CURRENT STATE ==='

-- Check if user exists in auth.users
SELECT 'Auth user check:' as step, 
       CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'sage@myai.ad') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if user exists in public.users  
SELECT 'Public user check:' as step,
       CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE LOWER(email) = 'sage@myai.ad') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check RLS status
SELECT 'RLS status:' as step, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'users';

-- Step 2: Get or create the MyAi.ad practice
\echo '=== SETTING UP MYAI.AD PRACTICE ==='

INSERT INTO practices (name, email_domain, subscription_tier)
VALUES ('MyAi Admin Practice', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_tier = EXCLUDED.subscription_tier;

-- Step 3: Fix the user profile
\echo '=== FIXING USER PROFILE ==='

DO $$
DECLARE
    auth_user_id UUID;
    practice_id UUID;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE LOWER(email) = 'sage@myai.ad';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Auth user not found. User must sign up first at the application login page.';
        RAISE NOTICE 'Please go to the application and use the magic link login with sage@myai.ad';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found auth user with ID: %', auth_user_id;
    
    -- Get the MyAi.ad practice ID
    SELECT id INTO practice_id 
    FROM practices 
    WHERE email_domain = 'myai.ad';
    
    RAISE NOTICE 'Using practice ID: %', practice_id;
    
    -- Check if user exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create the user profile
        INSERT INTO public.users (id, practice_id, email, name, role)
        VALUES (auth_user_id, practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin');
        RAISE NOTICE 'Created new user profile for super admin';
    ELSE
        -- Update existing user to ensure correct data
        UPDATE public.users 
        SET role = 'super_admin', 
            practice_id = practice_id,
            email = 'sage@myai.ad',
            name = COALESCE(NULLIF(name, ''), 'Sage (Super Admin)')
        WHERE id = auth_user_id;
        RAISE NOTICE 'Updated existing user profile for super admin';
    END IF;
END $$;

-- Step 4: Fix RLS policies
\echo '=== FIXING RLS POLICIES ==='

-- Drop all existing policies on users table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Enable RLS if it's not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, simple policies that work
-- Policy 1: Users can read their own profile
CREATE POLICY "users_read_own" ON users
FOR SELECT
USING (id = auth.uid());

-- Policy 2: Users can update their own profile  
CREATE POLICY "users_update_own" ON users
FOR UPDATE
USING (id = auth.uid());

-- Policy 3: Super admin (sage@myai.ad) can access all users
CREATE POLICY "super_admin_full_access" ON users
FOR ALL
USING (
    id = auth.uid() OR 
    auth.email() = 'sage@myai.ad'
);

-- Step 5: Apply similar fixes to other tables
\echo '=== FIXING OTHER TABLE POLICIES ==='

-- Fix practices table policies
DROP POLICY IF EXISTS "practices_access" ON practices;
CREATE POLICY "practices_access" ON practices
FOR ALL
USING (
    auth.email() = 'sage@myai.ad' OR
    id = (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- Fix staff table policies  
DROP POLICY IF EXISTS "staff_access" ON staff;
CREATE POLICY "staff_access" ON staff
FOR ALL
USING (
    auth.email() = 'sage@myai.ad' OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- Fix tasks table policies
DROP POLICY IF EXISTS "tasks_access" ON tasks;
CREATE POLICY "tasks_access" ON tasks
FOR ALL
USING (
    auth.email() = 'sage@myai.ad' OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- Fix competencies table policies
DROP POLICY IF EXISTS "competencies_access" ON competencies;
CREATE POLICY "competencies_access" ON competencies
FOR ALL
USING (
    auth.email() = 'sage@myai.ad' OR
    practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- Step 6: Final verification
\echo '=== FINAL VERIFICATION ==='

-- Show the final state
SELECT 'FINAL USER STATE:' as info;
SELECT 
    u.id,
    u.email, 
    u.name, 
    u.role, 
    u.practice_id,
    p.name as practice_name,
    p.email_domain,
    p.subscription_tier
FROM public.users u
LEFT JOIN practices p ON u.practice_id = p.id
WHERE LOWER(u.email) = 'sage@myai.ad';

-- Verify policies exist
SELECT 'ACTIVE POLICIES ON USERS TABLE:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Test the auth function
SELECT 'AUTH EMAIL TEST:' as info;
SELECT auth.email() as current_auth_email;

\echo '=== FIX COMPLETE ==='
\echo 'If the user still cannot log in:'
\echo '1. Make sure they sign out completely from the application'
\echo '2. Clear browser cache and cookies'  
\echo '3. Try logging in again with sage@myai.ad'
\echo '4. Check the browser console for any error messages' 