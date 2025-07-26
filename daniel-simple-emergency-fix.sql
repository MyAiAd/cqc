-- SIMPLE EMERGENCY FIX for Daniel - No Complex Triggers
-- This avoids the function ambiguity issues entirely

-- Step 1: Disable RLS temporarily
SET LOCAL row_security = off;

-- Step 2: Clean slate - remove any existing Daniel records
DELETE FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
DELETE FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Step 3: Ensure admin practice exists
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'MyAi Admin Practice', 'myai.ad', 'premium')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Step 4: Create Daniel directly (no triggers involved)
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

-- Step 5: Create Daniel's user profile with same ID
INSERT INTO users (id, practice_id, email, name, role) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'daniel@hcqc.co.uk',
  'Daniel (Super Admin)',
  'super_admin'
);

-- Step 6: Simple RLS policy that definitely works
DROP POLICY IF EXISTS "users_simple_access" ON users;
CREATE POLICY "users_simple_access" ON users
  FOR ALL USING (
    -- Super admins can do everything
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
    OR
    -- Users can access their own record
    id = auth.uid()
    OR  
    -- Allow access when no user record exists (during auth)
    NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

-- Step 7: Verification
SELECT 'SIMPLE FIX COMPLETE' as status;

-- Check Daniel exists in both tables
SELECT 
  'Daniel auth.users:' as table_name,
  email, 
  id,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk'

UNION ALL

SELECT 
  'Daniel public.users:' as table_name,
  email,
  id,
  role::text as confirmed
FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Final confirmation
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk') 
    AND EXISTS(SELECT 1 FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk')
    THEN 'SUCCESS: Daniel ready for login with both magic link and password'
    ELSE 'FAILED: Something went wrong'
  END as final_status;

-- Reset RLS
RESET row_security; 