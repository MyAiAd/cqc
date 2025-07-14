-- Add document reference fields to tasks table
-- This allows tasks to reference both internal documents and external URLs

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN sop_document_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL,
ADD COLUMN policy_document_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_sop_document_id ON tasks(sop_document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_policy_document_id ON tasks(policy_document_id);

-- Add comments to clarify the purpose
COMMENT ON COLUMN tasks.sop_document_id IS 'Reference to internal SOP document in evidence_items table';
COMMENT ON COLUMN tasks.policy_document_id IS 'Reference to internal policy document in evidence_items table';
COMMENT ON COLUMN tasks.sop_link IS 'External URL for SOP (used when sop_document_id is null)';
COMMENT ON COLUMN tasks.policy_link IS 'External URL for policy (used when policy_document_id is null)'; 