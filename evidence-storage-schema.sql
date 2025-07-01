-- EVIDENCE STORAGE SCHEMA FOR HARMONY360
-- This implements multi-tenant evidence tracking and storage
-- Ensures complete practice isolation for all evidence data

BEGIN;

-- ============================================================================
-- 1. EVIDENCE CATEGORIES AND REQUIREMENTS TABLES
-- ============================================================================

-- Evidence categories (practice-specific customization allowed)
CREATE TABLE IF NOT EXISTS evidence_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- For UI theming
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, name)
);

-- Evidence requirements (what evidence is needed for each regulation/standard)
CREATE TABLE IF NOT EXISTS evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  regulation_id TEXT NOT NULL, -- e.g., 'reg-9', 'safe-1', etc.
  regulation_type TEXT NOT NULL CHECK (regulation_type IN ('fundamental_standard', 'quality_statement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_needed TEXT[] NOT NULL, -- Array of evidence descriptions
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  review_frequency TEXT CHECK (review_frequency IN ('monthly', 'quarterly', 'annually', 'as_needed')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, regulation_id)
);

-- ============================================================================
-- 2. EVIDENCE STORAGE TABLES
-- ============================================================================

-- Main evidence items table
CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES evidence_requirements(id) ON DELETE SET NULL,
  category_id UUID REFERENCES evidence_categories(id) ON DELETE SET NULL,
  
  -- Evidence details
  title TEXT NOT NULL,
  description TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('document', 'policy', 'procedure', 'training_record', 'audit_report', 'certificate', 'photo', 'video', 'other')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired', 'under_review')),
  compliance_status TEXT DEFAULT 'not_compliant' CHECK (compliance_status IN ('compliant', 'partially_compliant', 'not_compliant', 'not_applicable')),
  
  -- Dates
  evidence_date DATE, -- When the evidence was created/obtained
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  expiry_date DATE,
  next_review_date DATE,
  
  -- People
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Additional metadata
  tags TEXT[], -- For searching and categorization
  notes TEXT,
  is_sensitive BOOLEAN DEFAULT false, -- For GDPR/sensitive data handling
  retention_period INTEGER, -- Days to retain this evidence
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence files/attachments table
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  
  -- File details
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  
  -- File metadata
  checksum TEXT, -- For integrity verification
  is_primary BOOLEAN DEFAULT false, -- Main file for this evidence
  version INTEGER DEFAULT 1,
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'practice' CHECK (access_level IN ('practice', 'admin_only', 'public')),
  
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence comments/notes table (for collaboration)
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
  
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'deleted', etc.
  old_values JSONB,
  new_values JSONB,
  
  performed_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. EVIDENCE WORKFLOWS AND APPROVALS
-- ============================================================================

-- Evidence approval workflows
CREATE TABLE IF NOT EXISTS evidence_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  evidence_types TEXT[], -- Which evidence types this workflow applies to
  
  -- Workflow steps (JSON array of steps)
  steps JSONB NOT NULL DEFAULT '[]', -- [{"step": 1, "role": "admin", "action": "review"}, ...]
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, name)
);

-- Evidence workflow instances (tracking specific evidence through workflow)
CREATE TABLE IF NOT EXISTS evidence_workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES evidence_workflows(id) ON DELETE CASCADE,
  
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected', 'cancelled')),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(evidence_item_id) -- One workflow instance per evidence item
);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY FOR ALL EVIDENCE TABLES
-- ============================================================================

ALTER TABLE evidence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_workflow_instances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR MULTI-TENANT ISOLATION
-- ============================================================================

-- Helper function to get current user's practice_id (reuse existing if available)
CREATE OR REPLACE FUNCTION get_current_practice_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT practice_id FROM users WHERE id = auth.uid();
$$;

-- Helper function to check if user is super admin (reuse existing if available)
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

-- Evidence Categories Policies
CREATE POLICY "evidence_categories_tenant_isolation" ON evidence_categories
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Requirements Policies
CREATE POLICY "evidence_requirements_tenant_isolation" ON evidence_requirements
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Items Policies
CREATE POLICY "evidence_items_tenant_isolation" ON evidence_items
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Files Policies
CREATE POLICY "evidence_files_tenant_isolation" ON evidence_files
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Comments Policies
CREATE POLICY "evidence_comments_tenant_isolation" ON evidence_comments
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Audit Log Policies
CREATE POLICY "evidence_audit_log_tenant_isolation" ON evidence_audit_log
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Workflows Policies
CREATE POLICY "evidence_workflows_tenant_isolation" ON evidence_workflows
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- Evidence Workflow Instances Policies
CREATE POLICY "evidence_workflow_instances_tenant_isolation" ON evidence_workflow_instances
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Practice isolation indexes
CREATE INDEX IF NOT EXISTS idx_evidence_categories_practice_id ON evidence_categories(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requirements_practice_id ON evidence_requirements(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_practice_id ON evidence_items(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_practice_id ON evidence_files(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_comments_practice_id ON evidence_comments(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_audit_log_practice_id ON evidence_audit_log(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_workflows_practice_id ON evidence_workflows(practice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_workflow_instances_practice_id ON evidence_workflow_instances(practice_id);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_evidence_items_requirement_id ON evidence_items(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_category_id ON evidence_items(category_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_evidence_item_id ON evidence_files(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_comments_evidence_item_id ON evidence_comments(evidence_item_id);

-- Status and date indexes for queries
CREATE INDEX IF NOT EXISTS idx_evidence_items_status ON evidence_items(status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_compliance_status ON evidence_items(compliance_status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_expiry_date ON evidence_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_evidence_items_next_review_date ON evidence_items(next_review_date);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_evidence_items_tags ON evidence_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_evidence_requirements_evidence_needed ON evidence_requirements USING GIN(evidence_needed);

-- ============================================================================
-- 7. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Reuse existing update function or create if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_evidence_categories_updated_at 
  BEFORE UPDATE ON evidence_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_requirements_updated_at 
  BEFORE UPDATE ON evidence_requirements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_items_updated_at 
  BEFORE UPDATE ON evidence_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_workflows_updated_at 
  BEFORE UPDATE ON evidence_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. CREATE AUDIT TRIGGER FOR EVIDENCE ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_evidence_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO evidence_audit_log (
    practice_id,
    evidence_item_id,
    action,
    old_values,
    new_values,
    performed_by,
    ip_address
  ) VALUES (
    COALESCE(NEW.practice_id, OLD.practice_id),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER evidence_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON evidence_items
  FOR EACH ROW EXECUTE FUNCTION log_evidence_audit();

-- ============================================================================
-- 9. SEED DEFAULT EVIDENCE CATEGORIES AND REQUIREMENTS
-- ============================================================================

-- Function to seed evidence data for a practice
CREATE OR REPLACE FUNCTION seed_evidence_data_for_practice(target_practice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default evidence categories
  INSERT INTO evidence_categories (practice_id, name, description, color, is_required) VALUES
  (target_practice_id, 'Policies & Procedures', 'Practice policies and standard operating procedures', '#3B82F6', true),
  (target_practice_id, 'Training Records', 'Staff training certificates and competency records', '#10B981', true),
  (target_practice_id, 'Audit Reports', 'Internal and external audit findings and reports', '#F59E0B', true),
  (target_practice_id, 'Certificates', 'Professional registrations and certifications', '#8B5CF6', true),
  (target_practice_id, 'Risk Assessments', 'Risk assessments and management plans', '#EF4444', true),
  (target_practice_id, 'Patient Feedback', 'Patient satisfaction surveys and feedback', '#06B6D4', false),
  (target_practice_id, 'Incident Reports', 'Incident reporting and investigation records', '#F97316', true),
  (target_practice_id, 'Equipment Records', 'Equipment maintenance and calibration records', '#84CC16', false)
  ON CONFLICT (practice_id, name) DO NOTHING;

  -- Insert default evidence requirements based on CQC regulations
  INSERT INTO evidence_requirements (practice_id, regulation_id, regulation_type, title, description, evidence_needed, priority) VALUES
  (target_practice_id, 'reg-9', 'fundamental_standard', 'Person-centred care', 'Care and treatment must be appropriate and reflect service users needs and preferences', 
   ARRAY['Care plans tailored to individual needs', 'Evidence of patient involvement in care decisions', 'Patient feedback and satisfaction surveys', 'Staff training records on person-centred care'], 'high'),
  
  (target_practice_id, 'reg-10', 'fundamental_standard', 'Dignity and respect', 'Service users must be treated with dignity and respect at all times',
   ARRAY['Privacy policies and procedures', 'Staff training on dignity and respect', 'Patient feedback on treatment', 'Equality and diversity policies'], 'high'),
   
  (target_practice_id, 'reg-11', 'fundamental_standard', 'Need for consent', 'Care and treatment must only be provided with the consent of the relevant person',
   ARRAY['Consent policies and procedures', 'Mental Capacity Act training records', 'Consent forms and documentation', 'Best interest decision records'], 'critical'),
   
  (target_practice_id, 'reg-12', 'fundamental_standard', 'Safe care and treatment', 'Care and treatment must be provided in a safe way',
   ARRAY['Risk assessments and management plans', 'Infection prevention and control policies', 'Medicine management procedures', 'Equipment maintenance records', 'Staff competency assessments'], 'critical'),
   
  (target_practice_id, 'reg-13', 'fundamental_standard', 'Safeguarding service users from abuse and improper treatment', 'Service users must be protected from abuse and improper treatment',
   ARRAY['Safeguarding policies and procedures', 'Staff safeguarding training records', 'Incident reporting systems', 'DBS checks for all staff'], 'critical')
  ON CONFLICT (practice_id, regulation_id) DO NOTHING;

  RETURN 'Evidence data seeded successfully for practice: ' || target_practice_id;
END;
$$;

-- ============================================================================
-- 10. CREATE STORAGE BUCKET SETUP FUNCTION
-- ============================================================================

-- Function to set up Supabase Storage bucket for evidence files
CREATE OR REPLACE FUNCTION setup_evidence_storage()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Note: This function provides the SQL commands that need to be run
  -- in Supabase Storage section manually, as we can't create buckets via SQL
  
  RETURN 'Please run these commands in Supabase Storage:
  
  1. Create bucket "evidence-files" with settings:
     - Public: false
     - File size limit: 50MB
     - Allowed MIME types: application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
  
  2. Create RLS policies for the bucket:
     - Allow authenticated users to upload files to their practice folder
     - Allow practice members to read files from their practice folder
     - Allow super admins to access all files
  
  3. Folder structure: evidence-files/{practice_id}/{evidence_item_id}/{filename}';
END;
$$;

-- ============================================================================
-- 11. VERIFICATION AND SUMMARY
-- ============================================================================

SELECT 'EVIDENCE STORAGE SCHEMA CREATED SUCCESSFULLY!' as status;

SELECT 'Tables Created:' as section,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'evidence_%';

SELECT 'RLS Policies Created:' as section,
       COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename LIKE 'evidence_%';

SELECT 'Indexes Created:' as section,
       COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename LIKE 'evidence_%';

-- Show storage setup instructions
SELECT setup_evidence_storage() as storage_setup_instructions;

COMMIT;
