-- COMPLETE MULTI-TENANCY SETUP (SAFE VERSION)
-- This script implements enterprise-grade multi-tenancy with proper isolation
-- Handles partial completion and includes proper cleanup

BEGIN;

-- ============================================================================
-- 0. CLEANUP FROM PREVIOUS PARTIAL RUNS
-- ============================================================================

-- Drop any existing policies that might conflict (including balanced_access policies)
DROP POLICY IF EXISTS "users_access" ON users;
DROP POLICY IF EXISTS "practices_access" ON practices;
DROP POLICY IF EXISTS "staff_access" ON staff;
DROP POLICY IF EXISTS "tasks_access" ON tasks;
DROP POLICY IF EXISTS "competencies_access" ON competencies;
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
DROP POLICY IF EXISTS "practices_tenant_isolation" ON practices;
DROP POLICY IF EXISTS "staff_tenant_isolation" ON staff;
DROP POLICY IF EXISTS "tasks_tenant_isolation" ON tasks;
DROP POLICY IF EXISTS "competencies_tenant_isolation" ON competencies;
DROP POLICY IF EXISTS "users_balanced_access" ON users;
DROP POLICY IF EXISTS "practices_balanced_access" ON practices;
DROP POLICY IF EXISTS "staff_balanced_access" ON staff;
DROP POLICY IF EXISTS "tasks_balanced_access" ON tasks;
DROP POLICY IF EXISTS "competencies_balanced_access" ON competencies;

-- Drop audit_log policy only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_log' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "audit_log_access" ON audit_log;
  END IF;
END $$;

-- Drop any existing functions that might conflict (using CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS get_current_practice_id() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS can_add_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_add_staff(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_feature(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS suspend_practice(UUID) CASCADE;
DROP FUNCTION IF EXISTS reactivate_practice(UUID) CASCADE;

-- ============================================================================
-- 1. RE-ENABLE ROW LEVEL SECURITY (CRITICAL FOR TENANT ISOLATION)
-- ============================================================================

-- Re-enable RLS on all tables (currently disabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE SECURE RLS POLICIES (ZERO-TRUST TENANT ISOLATION)
-- ============================================================================

-- Helper function to get current user's practice_id (secure)
CREATE OR REPLACE FUNCTION get_current_practice_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT practice_id FROM users WHERE id = auth.uid();
$$;

-- Helper function to check if user is super admin (secure)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- USERS TABLE: Strict tenant isolation
CREATE POLICY "users_tenant_isolation" ON users
FOR ALL USING (
  -- Users can access their own record
  id = auth.uid()
  OR
  -- Super admins can access all users
  is_super_admin()
  OR
  -- Admins/managers can access users in their practice only
  (
    practice_id = get_current_practice_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
);

-- PRACTICES TABLE: Strict tenant isolation
CREATE POLICY "practices_tenant_isolation" ON practices
FOR ALL USING (
  -- Super admins can access all practices
  is_super_admin()
  OR
  -- Users can only access their own practice
  id = get_current_practice_id()
);

-- STAFF TABLE: Strict tenant isolation
CREATE POLICY "staff_tenant_isolation" ON staff
FOR ALL USING (
  -- Super admins can access all staff
  is_super_admin()
  OR
  -- Users can only access staff in their practice
  practice_id = get_current_practice_id()
);

-- TASKS TABLE: Strict tenant isolation
CREATE POLICY "tasks_tenant_isolation" ON tasks
FOR ALL USING (
  -- Super admins can access all tasks
  is_super_admin()
  OR
  -- Users can only access tasks in their practice
  practice_id = get_current_practice_id()
);

-- COMPETENCIES TABLE: Strict tenant isolation
CREATE POLICY "competencies_tenant_isolation" ON competencies
FOR ALL USING (
  -- Super admins can access all competencies
  is_super_admin()
  OR
  -- Users can only access competencies in their practice
  practice_id = get_current_practice_id()
);

-- ============================================================================
-- 3. ADD SUBSCRIPTION LIMITS AND FEATURE FLAGS (SAFE)
-- ============================================================================

-- Add subscription limits to practices table (only if they don't exist)
DO $$
BEGIN
  -- Add max_users column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'max_users') THEN
    ALTER TABLE practices ADD COLUMN max_users INTEGER DEFAULT 10;
  END IF;
  
  -- Add max_staff column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'max_staff') THEN
    ALTER TABLE practices ADD COLUMN max_staff INTEGER DEFAULT 50;
  END IF;
  
  -- Add max_tasks column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'max_tasks') THEN
    ALTER TABLE practices ADD COLUMN max_tasks INTEGER DEFAULT 100;
  END IF;
  
  -- Add features column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'features') THEN
    ALTER TABLE practices ADD COLUMN features JSONB DEFAULT '{}';
  END IF;
  
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practices' AND column_name = 'is_active') THEN
    ALTER TABLE practices ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing practices with limits based on tier (only update NULL values)
UPDATE practices SET 
  max_users = CASE subscription_tier
    WHEN 'free' THEN 5
    WHEN 'basic' THEN 25
    WHEN 'premium' THEN 100
    ELSE 10
  END
WHERE max_users IS NULL;

UPDATE practices SET 
  max_staff = CASE subscription_tier
    WHEN 'free' THEN 25
    WHEN 'basic' THEN 100
    WHEN 'premium' THEN 500
    ELSE 50
  END
WHERE max_staff IS NULL;

UPDATE practices SET 
  max_tasks = CASE subscription_tier
    WHEN 'free' THEN 50
    WHEN 'basic' THEN 250
    WHEN 'premium' THEN 1000
    ELSE 100
  END
WHERE max_tasks IS NULL;

UPDATE practices SET 
  features = CASE subscription_tier
    WHEN 'free' THEN '{"reports": false, "api_access": false, "custom_branding": false}'::jsonb
    WHEN 'basic' THEN '{"reports": true, "api_access": false, "custom_branding": false}'::jsonb
    WHEN 'premium' THEN '{"reports": true, "api_access": true, "custom_branding": true}'::jsonb
    ELSE '{}'::jsonb
  END
WHERE features IS NULL OR features = '{}'::jsonb;

UPDATE practices SET is_active = true WHERE is_active IS NULL;

-- ============================================================================
-- 4. CREATE AUDIT LOGGING FOR SECURITY (SAFE)
-- ============================================================================

-- Create audit log table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log (safe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_log' AND schemaname = 'public') THEN
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Audit log policy (super admins and practice admins can view their practice's logs)
CREATE POLICY "audit_log_access" ON audit_log
FOR SELECT USING (
  is_super_admin()
  OR
  (
    practice_id = get_current_practice_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

-- ============================================================================
-- 5. CREATE SUBSCRIPTION ENFORCEMENT FUNCTIONS
-- ============================================================================

-- Function to check if practice can add more users
CREATE OR REPLACE FUNCTION can_add_user(target_practice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_users INTEGER;
  max_allowed INTEGER;
  practice_active BOOLEAN;
BEGIN
  -- Get current user count and limits
  SELECT 
    (SELECT COUNT(*) FROM users WHERE practice_id = target_practice_id),
    COALESCE(max_users, 10),
    COALESCE(is_active, true)
  INTO current_users, max_allowed, practice_active
  FROM practices 
  WHERE id = target_practice_id;
  
  -- Check if practice is active and under limit
  RETURN practice_active AND (current_users < max_allowed);
END;
$$;

-- Function to check if practice can add more staff
CREATE OR REPLACE FUNCTION can_add_staff(target_practice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_staff INTEGER;
  max_allowed INTEGER;
  practice_active BOOLEAN;
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM staff WHERE practice_id = target_practice_id),
    COALESCE(max_staff, 50),
    COALESCE(is_active, true)
  INTO current_staff, max_allowed, practice_active
  FROM practices 
  WHERE id = target_practice_id;
  
  RETURN practice_active AND (current_staff < max_allowed);
END;
$$;

-- Function to check if practice has feature enabled
CREATE OR REPLACE FUNCTION has_feature(target_practice_id UUID, feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  practice_features JSONB;
BEGIN
  SELECT COALESCE(features, '{}'::jsonb) INTO practice_features
  FROM practices 
  WHERE id = target_practice_id;
  
  RETURN COALESCE((practice_features ->> feature_name)::boolean, false);
END;
$$;

-- ============================================================================
-- 6. CREATE PERFORMANCE INDEXES FOR MULTI-TENANCY (SAFE)
-- ============================================================================

-- Indexes for efficient tenant isolation
CREATE INDEX IF NOT EXISTS idx_users_practice_id ON users(practice_id);
CREATE INDEX IF NOT EXISTS idx_staff_practice_id ON staff(practice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_practice_id ON tasks(practice_id);
CREATE INDEX IF NOT EXISTS idx_competencies_practice_id ON competencies(practice_id);

-- Only create audit log index if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_log' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_log_practice_id ON audit_log(practice_id);
  END IF;
END $$;

-- Indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Indexes for practice management
CREATE INDEX IF NOT EXISTS idx_practices_email_domain ON practices(email_domain);
CREATE INDEX IF NOT EXISTS idx_practices_active ON practices(is_active);

-- ============================================================================
-- 7. CREATE PRACTICE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to suspend a practice
CREATE OR REPLACE FUNCTION suspend_practice(target_practice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only super admins can suspend practices
  IF NOT is_super_admin() THEN
    RETURN 'ERROR: Only super admins can suspend practices';
  END IF;
  
  UPDATE practices 
  SET is_active = false 
  WHERE id = target_practice_id;
  
  IF FOUND THEN
    RETURN 'Practice suspended successfully';
  ELSE
    RETURN 'ERROR: Practice not found';
  END IF;
END;
$$;

-- Function to reactivate a practice
CREATE OR REPLACE FUNCTION reactivate_practice(target_practice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only super admins can reactivate practices
  IF NOT is_super_admin() THEN
    RETURN 'ERROR: Only super admins can reactivate practices';
  END IF;
  
  UPDATE practices 
  SET is_active = true 
  WHERE id = target_practice_id;
  
  IF FOUND THEN
    RETURN 'Practice reactivated successfully';
  ELSE
    RETURN 'ERROR: Practice not found';
  END IF;
END;
$$;

-- ============================================================================
-- 8. VERIFY MULTI-TENANCY SETUP
-- ============================================================================

-- Test queries to verify isolation
SELECT 'MULTI-TENANCY SETUP COMPLETE!' as status;

SELECT 'Verification:' as section;
SELECT 'RLS Enabled:' as check, 
       COUNT(*) as tables_with_rls 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'practices', 'staff', 'tasks', 'competencies')
AND rowsecurity = true;

SELECT 'Policies Created:' as check,
       COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%tenant_isolation%';

SELECT 'Practices with Limits:' as check,
       COUNT(*) as practices_configured
FROM practices 
WHERE max_users IS NOT NULL;

-- Show practice limits
SELECT 
  name,
  subscription_tier,
  COALESCE(max_users, 0) as max_users,
  COALESCE(max_staff, 0) as max_staff,
  COALESCE(max_tasks, 0) as max_tasks,
  COALESCE(is_active, true) as is_active,
  COALESCE(features, '{}'::jsonb) as features
FROM practices 
ORDER BY name;

-- Show current usage vs limits
SELECT 
  p.name,
  p.subscription_tier,
  (SELECT COUNT(*) FROM users WHERE practice_id = p.id) as current_users,
  p.max_users,
  (SELECT COUNT(*) FROM staff WHERE practice_id = p.id) as current_staff,
  p.max_staff,
  (SELECT COUNT(*) FROM tasks WHERE practice_id = p.id) as current_tasks,
  p.max_tasks
FROM practices p
ORDER BY p.name;

COMMIT; 