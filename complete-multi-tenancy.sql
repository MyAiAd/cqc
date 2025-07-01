-- COMPLETE MULTI-TENANCY SETUP
-- This script implements enterprise-grade multi-tenancy with proper isolation

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

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_access" ON users;
DROP POLICY IF EXISTS "practices_access" ON practices;
DROP POLICY IF EXISTS "staff_access" ON staff;
DROP POLICY IF EXISTS "tasks_access" ON tasks;
DROP POLICY IF EXISTS "competencies_access" ON competencies;

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
-- 3. ADD SUBSCRIPTION LIMITS AND FEATURE FLAGS
-- ============================================================================

-- Add subscription limits to practices table
ALTER TABLE practices ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE practices ADD COLUMN IF NOT EXISTS max_staff INTEGER DEFAULT 50;
ALTER TABLE practices ADD COLUMN IF NOT EXISTS max_tasks INTEGER DEFAULT 100;
ALTER TABLE practices ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE practices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing practices with limits based on tier
UPDATE practices SET 
  max_users = CASE subscription_tier
    WHEN 'free' THEN 5
    WHEN 'basic' THEN 25
    WHEN 'premium' THEN 100
    ELSE 10
  END,
  max_staff = CASE subscription_tier
    WHEN 'free' THEN 25
    WHEN 'basic' THEN 100
    WHEN 'premium' THEN 500
    ELSE 50
  END,
  max_tasks = CASE subscription_tier
    WHEN 'free' THEN 50
    WHEN 'basic' THEN 250
    WHEN 'premium' THEN 1000
    ELSE 100
  END,
  features = CASE subscription_tier
    WHEN 'free' THEN '{"reports": false, "api_access": false, "custom_branding": false}'::jsonb
    WHEN 'basic' THEN '{"reports": true, "api_access": false, "custom_branding": false}'::jsonb
    WHEN 'premium' THEN '{"reports": true, "api_access": true, "custom_branding": true}'::jsonb
    ELSE '{}'::jsonb
  END;

-- ============================================================================
-- 4. CREATE AUDIT LOGGING FOR SECURITY
-- ============================================================================

-- Create audit log table
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

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

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
    max_users,
    is_active
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
    max_staff,
    is_active
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
  SELECT features INTO practice_features
  FROM practices 
  WHERE id = target_practice_id;
  
  RETURN COALESCE((practice_features ->> feature_name)::boolean, false);
END;
$$;

-- ============================================================================
-- 6. CREATE PERFORMANCE INDEXES FOR MULTI-TENANCY
-- ============================================================================

-- Indexes for efficient tenant isolation
CREATE INDEX IF NOT EXISTS idx_users_practice_id ON users(practice_id);
CREATE INDEX IF NOT EXISTS idx_staff_practice_id ON staff(practice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_practice_id ON tasks(practice_id);
CREATE INDEX IF NOT EXISTS idx_competencies_practice_id ON competencies(practice_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_practice_id ON audit_log(practice_id);

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
  
  RETURN 'Practice suspended successfully';
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
  
  RETURN 'Practice reactivated successfully';
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
WHERE schemaname = 'public';

SELECT 'Practices with Limits:' as check,
       COUNT(*) as practices_configured
FROM practices 
WHERE max_users IS NOT NULL;

-- Show practice limits
SELECT 
  name,
  subscription_tier,
  max_users,
  max_staff,
  max_tasks,
  is_active,
  features
FROM practices 
ORDER BY name; 