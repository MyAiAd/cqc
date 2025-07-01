-- PERMANENT FIX FOR RECURRING RLS INFINITE RECURSION
-- This replaces the problematic policies in admin-setup.sql with safe, non-recursive ones

-- Step 1: Drop all the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Super admin can access all practices" ON practices;
DROP POLICY IF EXISTS "Users can access their own practice" ON practices;
DROP POLICY IF EXISTS "Users can access their own user data" ON users;
DROP POLICY IF EXISTS "Users can access their practice staff" ON staff;
DROP POLICY IF EXISTS "Users can access their practice tasks" ON tasks;
DROP POLICY IF EXISTS "Users can access their practice competencies" ON competencies;

-- Step 2: Create safe, non-recursive policies

-- USERS TABLE: Use auth.email() and auth.uid() directly (no table lookups)
CREATE POLICY "users_safe_access" ON users
FOR ALL
USING (
    -- Users can access their own record
    id = auth.uid() 
    OR 
    -- Super admin can access all records (using email from JWT, no table lookup)
    auth.email() = 'sage@myai.ad'
);

-- PRACTICES TABLE: Safe policy using direct auth functions
CREATE POLICY "practices_safe_access" ON practices
FOR ALL
USING (
    -- Super admin can access all practices
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access their practice (lookup their practice_id from users table)
    -- This is safe because it doesn't create recursion - we're not checking permissions on users table
    id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- STAFF TABLE: Safe policy
CREATE POLICY "staff_safe_access" ON staff
FOR ALL
USING (
    -- Super admin can access all staff
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access staff in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- TASKS TABLE: Safe policy
CREATE POLICY "tasks_safe_access" ON tasks
FOR ALL
USING (
    -- Super admin can access all tasks
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access tasks in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- COMPETENCIES TABLE: Safe policy
CREATE POLICY "competencies_safe_access" ON competencies
FOR ALL
USING (
    -- Super admin can access all competencies
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access competencies in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- Step 3: Verify the fix
SELECT 'VERIFICATION - Active policies on users table:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

SELECT 'VERIFICATION - RLS status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'practices', 'staff', 'tasks', 'competencies')
ORDER BY tablename;

-- Step 4: Test super admin access
SELECT 'VERIFICATION - Super admin user:' as info;
SELECT id, email, name, role, practice_id 
FROM users 
WHERE LOWER(email) = 'sage@myai.ad';

-- Success message
SELECT 'PERMANENT FIX APPLIED SUCCESSFULLY!' as result;
SELECT 'The problematic recursive policies have been replaced with safe ones.' as note;
SELECT 'This should prevent the infinite recursion issue from recurring.' as note2; 