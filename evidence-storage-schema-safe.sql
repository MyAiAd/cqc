-- EVIDENCE STORAGE SCHEMA FOR HARMONY360 (SAFE VERSION)
-- This version handles existing tables and policies gracefully

BEGIN;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "evidence_categories_tenant_isolation" ON evidence_categories;
  DROP POLICY IF EXISTS "evidence_requirements_tenant_isolation" ON evidence_requirements;
  DROP POLICY IF EXISTS "evidence_items_tenant_isolation" ON evidence_items;
  DROP POLICY IF EXISTS "evidence_files_tenant_isolation" ON evidence_files;
  DROP POLICY IF EXISTS "evidence_comments_tenant_isolation" ON evidence_comments;
  DROP POLICY IF EXISTS "evidence_audit_log_tenant_isolation" ON evidence_audit_log;
  DROP POLICY IF EXISTS "evidence_workflows_tenant_isolation" ON evidence_workflows;
  DROP POLICY IF EXISTS "evidence_workflow_instances_tenant_isolation" ON evidence_workflow_instances;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Ignore if tables don't exist yet
END $$;

-- Evidence categories
CREATE TABLE IF NOT EXISTS evidence_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, name)
);

-- Evidence requirements
CREATE TABLE IF NOT EXISTS evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  regulation_id TEXT NOT NULL,
  regulation_type TEXT NOT NULL CHECK (regulation_type IN ('fundamental_standard', 'quality_statement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_needed TEXT[] NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  review_frequency TEXT CHECK (review_frequency IN ('monthly', 'quarterly', 'annually', 'as_needed')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, regulation_id)
);

-- Main evidence items table
CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES evidence_requirements(id) ON DELETE SET NULL,
  category_id UUID REFERENCES evidence_categories(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('document', 'policy', 'procedure', 'training_record', 'audit_report', 'certificate', 'photo', 'video', 'other')),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired', 'under_review')),
  compliance_status TEXT DEFAULT 'not_compliant' CHECK (compliance_status IN ('compliant', 'partially_compliant', 'not_compliant', 'not_applicable')),
  
  evidence_date DATE,
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  expiry_date DATE,
  next_review_date DATE,
  
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  tags TEXT[],
  notes TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  retention_period INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence files/attachments table
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  
  checksum TEXT,
  is_primary BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  
  is_public BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'practice' CHECK (access_level IN ('practice', 'admin_only', 'public')),
  
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence comments table
CREATE TABLE IF NOT EXISTS evidence_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'approval', 'rejection', 'request_changes', 'internal_note')),
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence audit trail
CREATE TABLE IF NOT EXISTS evidence_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  
  performed_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence workflows
CREATE TABLE IF NOT EXISTS evidence_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  evidence_types TEXT[],
  
  steps JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, name)
);

-- Evidence workflow instances
CREATE TABLE IF NOT EXISTS evidence_workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES evidence_workflows(id) ON DELETE CASCADE,
  
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected', 'cancelled')),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(evidence_item_id)
);

-- Enable RLS
ALTER TABLE evidence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_workflow_instances ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_current_practice_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT practice_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create RLS policies
CREATE POLICY "evidence_categories_tenant_isolation" ON evidence_categories
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_requirements_tenant_isolation" ON evidence_requirements
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_items_tenant_isolation" ON evidence_items
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_files_tenant_isolation" ON evidence_files
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_comments_tenant_isolation" ON evidence_comments
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_audit_log_tenant_isolation" ON evidence_audit_log
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_workflows_tenant_isolation" ON evidence_workflows
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "evidence_workflow_instances_tenant_isolation" ON evidence_workflow_instances
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evidence_categories_practice_id ON evidence_categories(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requirements_practice_id ON evidence_requirements(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_practice_id ON evidence_items(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_practice_id ON evidence_files(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_comments_practice_id ON evidence_comments(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_audit_log_practice_id ON evidence_audit_log(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_workflows_practice_id ON evidence_workflows(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_workflow_instances_practice_id ON evidence_workflow_instances(practice_id);

-- Seed data function
CREATE OR REPLACE FUNCTION seed_evidence_data_for_practice(target_practice_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert default evidence categories
  INSERT INTO evidence_categories (practice_id, name, description, color, is_required) VALUES
    (target_practice_id, 'Policies', 'Practice policies and procedures', '#3B82F6', true),
    (target_practice_id, 'Training Records', 'Staff training and competency records', '#10B981', true),
    (target_practice_id, 'Certificates', 'Professional certificates and qualifications', '#F59E0B', true),
    (target_practice_id, 'Audit Reports', 'Internal and external audit reports', '#EF4444', true),
    (target_practice_id, 'Risk Assessments', 'Risk assessments and management plans', '#8B5CF6', true),
    (target_practice_id, 'Meeting Minutes', 'Team meetings and governance records', '#6B7280', false),
    (target_practice_id, 'Patient Feedback', 'Patient surveys and feedback forms', '#EC4899', false),
    (target_practice_id, 'Incident Reports', 'Incident and near-miss reports', '#DC2626', true)
  ON CONFLICT (practice_id, name) DO NOTHING;

  -- Insert CQC fundamental standards as evidence requirements
  INSERT INTO evidence_requirements (practice_id, regulation_id, regulation_type, title, description, evidence_needed, priority) VALUES
    (target_practice_id, 'reg-9', 'fundamental_standard', 'Person-centred care', 'Care and treatment must be appropriate and reflect service users'' needs and preferences', ARRAY['Care plans', 'Patient feedback', 'Individual assessments'], 'high'),
    (target_practice_id, 'reg-10', 'fundamental_standard', 'Dignity and respect', 'Service users must be treated with dignity and respect', ARRAY['Staff training records', 'Policies on dignity', 'Patient feedback'], 'high'),
    (target_practice_id, 'reg-11', 'fundamental_standard', 'Need for consent', 'Care and treatment must only be provided with consent', ARRAY['Consent policies', 'Training records', 'Consent forms'], 'critical'),
    (target_practice_id, 'reg-12', 'fundamental_standard', 'Safe care and treatment', 'Care and treatment must be provided in a safe way', ARRAY['Risk assessments', 'Safety policies', 'Incident reports'], 'critical'),
    (target_practice_id, 'reg-13', 'fundamental_standard', 'Safeguarding', 'Service users must be protected from abuse and improper treatment', ARRAY['Safeguarding policies', 'Training records', 'DBS checks'], 'critical'),
    (target_practice_id, 'reg-14', 'fundamental_standard', 'Meeting nutritional needs', 'The nutritional and hydration needs of service users must be met', ARRAY['Nutrition policies', 'Care plans', 'Training records'], 'medium'),
    (target_practice_id, 'reg-15', 'fundamental_standard', 'Premises and equipment', 'Premises and equipment must be clean, secure, and suitable', ARRAY['Maintenance records', 'Cleaning schedules', 'Equipment certificates'], 'high'),
    (target_practice_id, 'reg-16', 'fundamental_standard', 'Receiving and acting on complaints', 'There must be an accessible system for identifying, receiving, and responding to complaints', ARRAY['Complaints policy', 'Complaints log', 'Response procedures'], 'medium'),
    (target_practice_id, 'reg-17', 'fundamental_standard', 'Good governance', 'Systems must be established to ensure compliance with requirements', ARRAY['Governance policies', 'Audit reports', 'Quality assurance'], 'critical'),
    (target_practice_id, 'reg-18', 'fundamental_standard', 'Staffing', 'Sufficient numbers of suitably qualified staff must be deployed', ARRAY['Staffing rotas', 'Qualifications', 'Training records'], 'high'),
    (target_practice_id, 'reg-19', 'fundamental_standard', 'Fit and proper persons', 'Only fit and proper persons must be employed', ARRAY['DBS checks', 'References', 'Interview records'], 'critical')
  ON CONFLICT (practice_id, regulation_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that tables were created
SELECT 'Tables created successfully' as status,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'evidence_%';

-- Check that policies were created
SELECT 'Policies created successfully' as status,
       COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'evidence_%'; 