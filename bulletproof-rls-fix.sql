-- BULLETPROOF RLS FIX FOR TOKEN REFRESH SCENARIOS
-- This ensures super admin access is maintained even during token refreshes

-- Step 1: Drop all existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename IN ('users', 'practices', 'staff', 'tasks', 'competencies')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- Step 2: Create bulletproof policies that work during token refresh

-- USERS TABLE: Absolutely bulletproof policy
CREATE POLICY "users_bulletproof_access" ON users
FOR ALL
USING (
    -- Users can always access their own record
    id = auth.uid() 
    OR 
    -- Super admin can always access all records (using email from JWT)
    -- This works even during token refresh because auth.email() comes from the JWT directly
    LOWER(auth.email()) = 'sage@myai.ad'
    OR
    -- Fallback: if auth.email() is somehow null, check raw JWT
    (auth.jwt() ->> 'email')::text = 'sage@myai.ad'
);

-- PRACTICES TABLE: Bulletproof policy
CREATE POLICY "practices_bulletproof_access" ON practices
FOR ALL
USING (
    -- Super admin can always access all practices
    LOWER(auth.email()) = 'sage@myai.ad'
    OR
    (auth.jwt() ->> 'email')::text = 'sage@myai.ad'
    OR
    -- Regular users can access their practice
    -- Use a safe subquery that doesn't cause recursion
    id = (
        SELECT u.practice_id 
        FROM users u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    )
);

-- STAFF TABLE: Bulletproof policy
CREATE POLICY "staff_bulletproof_access" ON staff
FOR ALL
USING (
    -- Super admin can always access all staff
    LOWER(auth.email()) = 'sage@myai.ad'
    OR
    (auth.jwt() ->> 'email')::text = 'sage@myai.ad'
    OR
    -- Regular users can access staff in their practice
    practice_id = (
        SELECT u.practice_id 
        FROM users u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    )
);

-- TASKS TABLE: Bulletproof policy
CREATE POLICY "tasks_bulletproof_access" ON tasks
FOR ALL
USING (
    -- Super admin can always access all tasks
    LOWER(auth.email()) = 'sage@myai.ad'
    OR
    (auth.jwt() ->> 'email')::text = 'sage@myai.ad'
    OR
    -- Regular users can access tasks in their practice
    practice_id = (
        SELECT u.practice_id 
        FROM users u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    )
);

-- COMPETENCIES TABLE: Bulletproof policy
CREATE POLICY "competencies_bulletproof_access" ON competencies
FOR ALL
USING (
    -- Super admin can always access all competencies
    LOWER(auth.email()) = 'sage@myai.ad'
    OR
    (auth.jwt() ->> 'email')::text = 'sage@myai.ad'
    OR
    -- Regular users can access competencies in their practice
    practice_id = (
        SELECT u.practice_id 
        FROM users u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    )
);

-- Step 3: Ensure the super admin user profile is correct
DO $$
DECLARE
    auth_user_id UUID := '697af899-a5af-489e-9872-a6a11dc37a91';
    practice_id UUID;
BEGIN
    -- Ensure MyAi.ad practice exists
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
    
    -- Ensure super admin user profile exists and is correct
    INSERT INTO public.users (id, practice_id, email, name, role)
    VALUES (auth_user_id, practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        practice_id = EXCLUDED.practice_id,
        email = 'sage@myai.ad',
        name = 'Sage (Super Admin)';
        
    RAISE NOTICE 'Super admin user profile ensured with bulletproof access';
END $$;

-- Step 4: Test the bulletproof policies
SELECT 'BULLETPROOF POLICY TEST:' as test;

-- Test 1: Verify super admin user exists
SELECT 'Super admin user:' as test, id, email, name, role, practice_id 
FROM users 
WHERE id = '697af899-a5af-489e-9872-a6a11dc37a91';

-- Test 2: Verify policies exist
SELECT 'Active policies:' as test;
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('users', 'practices', 'staff', 'tasks', 'competencies')
ORDER BY tablename, policyname;

-- Test 3: Verify RLS is enabled
SELECT 'RLS status:' as test;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'practices', 'staff', 'tasks', 'competencies')
ORDER BY tablename;

-- Success message
SELECT 'BULLETPROOF RLS POLICIES APPLIED!' as result;
SELECT 'These policies should prevent super admin access from being lost during token refresh.' as note;
SELECT 'The policies use multiple fallback methods to identify the super admin.' as note2; 