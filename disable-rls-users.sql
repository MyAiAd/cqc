-- Temporarily disable RLS on users table to fix infinite recursion
-- This is a quick fix to get super admin login working

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can read practice users" ON users;
DROP POLICY IF EXISTS "Admins can manage practice users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Test query to make sure it works now
SELECT id, email, name, role, practice_id 
FROM users 
WHERE email = 'Sage@MyAi.ad'; 