-- QUICK FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL policies on users table to stop the infinite recursion
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "super_admin_full_access" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "super_admin_all_access" ON users;
DROP POLICY IF EXISTS "users_access_policy" ON users;

-- Step 2: Temporarily disable RLS to allow immediate access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Ensure the super admin user profile exists
DO $$
DECLARE
    auth_user_id UUID := '697af899-a5af-489e-9872-a6a11dc37a91';
    practice_id UUID;
BEGIN
    -- Get or create the MyAi.ad practice
    INSERT INTO practices (name, email_domain, subscription_tier)
    VALUES ('MyAi Admin Practice', 'myai.ad', 'premium')
    ON CONFLICT (email_domain) DO UPDATE SET
        name = EXCLUDED.name,
        subscription_tier = EXCLUDED.subscription_tier
    RETURNING id INTO practice_id;
    
    -- If no returning value, get existing practice
    IF practice_id IS NULL THEN
        SELECT id INTO practice_id FROM practices WHERE email_domain = 'myai.ad';
    END IF;
    
    -- Insert or update the user profile
    INSERT INTO public.users (id, practice_id, email, name, role)
    VALUES (auth_user_id, practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        practice_id = EXCLUDED.practice_id,
        email = 'sage@myai.ad',
        name = COALESCE(NULLIF(users.name, ''), 'Sage (Super Admin)');
        
    RAISE NOTICE 'Super admin user profile created/updated successfully';
END $$;

-- Step 4: Re-enable RLS with simple, non-recursive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple policy that uses auth.uid() and auth.email() directly (no table lookups)
CREATE POLICY "simple_user_access" ON users
FOR ALL
USING (
    -- Users can access their own record
    id = auth.uid() 
    OR 
    -- Super admin can access all records (using email directly from JWT)
    auth.email() = 'sage@myai.ad'
);

-- Verify the fix
SELECT 'User profile check:' as test;
SELECT id, email, name, role, practice_id 
FROM users 
WHERE id = '697af899-a5af-489e-9872-a6a11dc37a91';

SELECT 'RLS status:' as test;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

SELECT 'Active policies:' as test;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'; 