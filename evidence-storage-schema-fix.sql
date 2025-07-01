-- QUICK FIX FOR EVIDENCE STORAGE SCHEMA
-- This fixes the function conflict issue

BEGIN;

-- Drop the existing function that's causing the conflict
DROP FUNCTION IF EXISTS seed_evidence_data_for_practice(uuid);

-- Recreate the function with the correct signature
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

  RAISE NOTICE 'Evidence data seeded successfully for practice %', target_practice_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Now you can run these queries:
-- 1. Find your practice ID
SELECT 'Your practice ID:' as info, id, name FROM practices;

-- 2. Seed evidence data (you'll need to replace the UUID below with your actual practice ID)
-- SELECT seed_evidence_data_for_practice('your-practice-id-from-above-query'); 