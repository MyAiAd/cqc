-- COMPLIANCE JOURNEY TRACKING SCHEMA
-- This extends the evidence system to track actual compliance progress
-- Links evidence pieces to specific journey steps for comprehensive tracking

BEGIN;

-- ============================================================================
-- 1. COMPLIANCE JOURNEY FRAMEWORK TABLES
-- ============================================================================

-- Compliance frameworks (CQC, ISO, etc.)
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  version TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey templates (predefined compliance journeys)
CREATE TABLE IF NOT EXISTS journey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_duration_days INTEGER, -- How long this journey typically takes
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey steps/milestones (what needs to be done)
CREATE TABLE IF NOT EXISTS journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'policy', 'training', 'audit', 'documentation', etc.
  estimated_hours INTEGER, -- Time estimate for this step
  is_mandatory BOOLEAN DEFAULT true,
  prerequisites TEXT[], -- Array of step IDs that must be completed first
  
  -- Evidence requirements for this step
  evidence_types_required TEXT[], -- Types of evidence needed
  min_evidence_count INTEGER DEFAULT 1,
  
  -- Guidance and resources
  guidance_text TEXT,
  resources JSONB, -- Links, documents, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, step_number)
);

-- ============================================================================
-- 2. PRACTICE-SPECIFIC JOURNEY TRACKING
-- ============================================================================

-- Practice journeys (instances of templates for specific practices)
CREATE TABLE IF NOT EXISTS practice_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  
  -- Journey status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00, -- Calculated field
  
  -- Timeline
  started_at TIMESTAMPTZ,
  target_completion_date DATE,
  actual_completion_date DATE,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, template_id) -- One journey per template per practice
);

-- Practice journey step progress
CREATE TABLE IF NOT EXISTS practice_journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES practice_journeys(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  
  -- Step status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped', 'blocked')),
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Timeline
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  
  -- Assignment and notes
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  
  -- Quality assurance
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'needs_revision')),
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journey_id, step_id)
);

-- ============================================================================
-- 3. EVIDENCE LINKING TO JOURNEY STEPS
-- ============================================================================

-- Link evidence items to journey steps
CREATE TABLE IF NOT EXISTS journey_step_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  journey_step_id UUID NOT NULL REFERENCES practice_journey_steps(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  
  -- Relationship details
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5), -- How relevant is this evidence
  is_primary BOOLEAN DEFAULT false, -- Is this the main evidence for this step
  
  -- Metadata
  linked_by UUID REFERENCES users(id),
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(journey_step_id, evidence_item_id)
);

-- ============================================================================
-- 4. JOURNEY ANALYTICS AND TRACKING
-- ============================================================================

-- Journey milestones (key checkpoints)
CREATE TABLE IF NOT EXISTS journey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES practice_journeys(id) ON DELETE CASCADE,
  
  milestone_type TEXT NOT NULL, -- 'quarter_complete', 'half_complete', 'evidence_submitted', 'review_passed', etc.
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  target_date DATE,
  
  -- Celebration and recognition
  is_celebrated BOOLEAN DEFAULT false,
  celebration_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey progress snapshots (for historical tracking and graphs)
CREATE TABLE IF NOT EXISTS journey_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES practice_journeys(id) ON DELETE CASCADE,
  
  -- Progress metrics
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER NOT NULL,
  in_progress_steps INTEGER NOT NULL,
  evidence_items_linked INTEGER NOT NULL,
  
  -- Calculated metrics
  progress_percentage DECIMAL(5,2) NOT NULL,
  velocity DECIMAL(5,2), -- Steps completed per week
  estimated_completion_date DATE,
  
  -- Snapshot metadata
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(journey_id, snapshot_date)
);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_step_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Frameworks and templates are globally readable
CREATE POLICY "frameworks_global_read" ON compliance_frameworks
FOR SELECT USING (true);

CREATE POLICY "templates_global_read" ON journey_templates
FOR SELECT USING (true);

CREATE POLICY "steps_global_read" ON journey_steps
FOR SELECT USING (true);

-- Practice-specific data uses tenant isolation
CREATE POLICY "practice_journeys_tenant_isolation" ON practice_journeys
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "practice_journey_steps_tenant_isolation" ON practice_journey_steps
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "journey_step_evidence_tenant_isolation" ON journey_step_evidence
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "journey_milestones_tenant_isolation" ON journey_milestones
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

CREATE POLICY "journey_progress_snapshots_tenant_isolation" ON journey_progress_snapshots
FOR ALL USING (
  is_super_admin() OR practice_id = get_current_practice_id()
);

-- ============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Practice isolation indexes
CREATE INDEX IF NOT EXISTS idx_practice_journeys_practice_id ON practice_journeys(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_journey_steps_practice_id ON practice_journey_steps(practice_id);
CREATE INDEX IF NOT EXISTS idx_journey_step_evidence_practice_id ON journey_step_evidence(practice_id);
CREATE INDEX IF NOT EXISTS idx_journey_milestones_practice_id ON journey_milestones(practice_id);
CREATE INDEX IF NOT EXISTS idx_journey_progress_snapshots_practice_id ON journey_progress_snapshots(practice_id);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_journey_templates_framework_id ON journey_templates(framework_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_template_id ON journey_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_practice_journeys_template_id ON practice_journeys(template_id);
CREATE INDEX IF NOT EXISTS idx_practice_journey_steps_journey_id ON practice_journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_practice_journey_steps_step_id ON practice_journey_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_journey_step_evidence_journey_step_id ON journey_step_evidence(journey_step_id);
CREATE INDEX IF NOT EXISTS idx_journey_step_evidence_evidence_item_id ON journey_step_evidence(evidence_item_id);

-- Status and progress indexes
CREATE INDEX IF NOT EXISTS idx_practice_journeys_status ON practice_journeys(status);
CREATE INDEX IF NOT EXISTS idx_practice_journey_steps_status ON practice_journey_steps(status);
CREATE INDEX IF NOT EXISTS idx_journey_progress_snapshots_date ON journey_progress_snapshots(snapshot_date);

-- ============================================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC PROGRESS CALCULATION
-- ============================================================================

-- Function to update journey progress when steps change
CREATE OR REPLACE FUNCTION update_journey_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the practice journey progress percentage
  UPDATE practice_journeys 
  SET 
    progress_percentage = (
      SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        0
      )
      FROM practice_journey_steps 
      WHERE journey_id = COALESCE(NEW.journey_id, OLD.journey_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.journey_id, OLD.journey_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when journey steps change
CREATE TRIGGER update_journey_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON practice_journey_steps
  FOR EACH ROW EXECUTE FUNCTION update_journey_progress();

-- ============================================================================
-- 9. SEED DEFAULT CQC JOURNEY TEMPLATE
-- ============================================================================

-- Function to seed CQC compliance journey
CREATE OR REPLACE FUNCTION seed_cqc_journey_template()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  framework_id UUID;
  template_id UUID;
BEGIN
  -- Insert CQC framework
  INSERT INTO compliance_frameworks (name, description, version)
  VALUES ('CQC Fundamental Standards', 'Care Quality Commission Fundamental Standards for Healthcare Providers', '2024')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO framework_id;
  
  -- Insert CQC journey template
  INSERT INTO journey_templates (framework_id, name, description, estimated_duration_days, difficulty_level)
  VALUES (
    framework_id,
    'CQC Registration & Compliance Journey',
    'Complete journey from CQC registration preparation through ongoing compliance maintenance',
    180, -- 6 months
    'intermediate'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO template_id;
  
  -- If template already exists, get its ID
  IF template_id IS NULL THEN
    SELECT id INTO template_id FROM journey_templates 
    WHERE framework_id = framework_id AND name = 'CQC Registration & Compliance Journey';
  END IF;
  
  -- Insert journey steps
  INSERT INTO journey_steps (template_id, step_number, title, description, category, estimated_hours, evidence_types_required, min_evidence_count, guidance_text) VALUES
  (template_id, 1, 'Understand CQC Requirements', 'Review and understand all CQC fundamental standards and regulations', 'preparation', 8, ARRAY['document'], 1, 'Start by reviewing the CQC guidance documents and understanding what evidence you need to collect.'),
  
  (template_id, 2, 'Develop Policies & Procedures', 'Create comprehensive policies covering all CQC fundamental standards', 'policy', 40, ARRAY['policy', 'procedure'], 5, 'Develop policies for person-centred care, dignity & respect, consent, safe care, and safeguarding.'),
  
  (template_id, 3, 'Staff Training Program', 'Implement comprehensive staff training on CQC requirements and policies', 'training', 24, ARRAY['training_record', 'certificate'], 3, 'Ensure all staff are trained on CQC requirements, policies, and their roles in compliance.'),
  
  (template_id, 4, 'Risk Assessment & Management', 'Conduct comprehensive risk assessments and implement management plans', 'assessment', 16, ARRAY['document', 'audit_report'], 2, 'Identify and assess all risks to service users and implement appropriate management strategies.'),
  
  (template_id, 5, 'Quality Assurance Systems', 'Establish systems for monitoring and improving quality of care', 'system', 20, ARRAY['procedure', 'audit_report'], 2, 'Set up regular audits, feedback systems, and quality improvement processes.'),
  
  (template_id, 6, 'Documentation & Record Keeping', 'Ensure all required documentation is in place and properly maintained', 'documentation', 12, ARRAY['document', 'procedure'], 3, 'Implement robust systems for maintaining accurate and up-to-date records.'),
  
  (template_id, 7, 'Internal Audit & Review', 'Conduct internal audits to verify compliance readiness', 'audit', 16, ARRAY['audit_report'], 1, 'Perform comprehensive internal audits to identify any gaps before CQC inspection.'),
  
  (template_id, 8, 'CQC Registration Application', 'Submit CQC registration application with all required evidence', 'application', 8, ARRAY['document'], 1, 'Compile all evidence and submit your CQC registration application.'),
  
  (template_id, 9, 'Ongoing Compliance Monitoring', 'Maintain ongoing compliance through regular monitoring and updates', 'monitoring', 4, ARRAY['audit_report'], 1, 'Establish ongoing processes to maintain compliance and prepare for inspections.')
  
  ON CONFLICT (template_id, step_number) DO NOTHING;
  
  RETURN 'CQC journey template seeded successfully with ' || (SELECT COUNT(*) FROM journey_steps WHERE template_id = template_id) || ' steps';
END;
$$;

-- Seed the CQC template
SELECT seed_cqc_journey_template();

COMMIT; 