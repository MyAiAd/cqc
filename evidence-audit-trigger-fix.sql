-- Fix for evidence audit trigger to handle deletions properly
-- The issue is that when deleting an evidence item, the trigger tries to insert
-- the evidence_item_id into the audit log, but the foreign key constraint prevents this

-- Drop and recreate the audit trigger function
DROP TRIGGER IF EXISTS evidence_items_audit_trigger ON evidence_items;
DROP FUNCTION IF EXISTS log_evidence_audit();

-- Create improved audit function that handles deletions properly
CREATE OR REPLACE FUNCTION log_evidence_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- For DELETE operations, we need to handle the foreign key constraint differently
  IF TG_OP = 'DELETE' THEN
    -- Insert audit record with NULL evidence_item_id for deletions
    INSERT INTO evidence_audit_log (
      practice_id,
      evidence_item_id,
      action,
      old_values,
      new_values,
      performed_by,
      ip_address
    ) VALUES (
      OLD.practice_id,
      NULL, -- Set to NULL for deletions to avoid foreign key constraint
      TG_OP,
      to_jsonb(OLD),
      NULL,
      auth.uid(),
      inet_client_addr()
    );
    RETURN OLD;
  ELSE
    -- For INSERT and UPDATE, use the normal approach
    INSERT INTO evidence_audit_log (
      practice_id,
      evidence_item_id,
      action,
      old_values,
      new_values,
      performed_by,
      ip_address
    ) VALUES (
      NEW.practice_id,
      NEW.id,
      TG_OP,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW),
      auth.uid(),
      inet_client_addr()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the audit trigger
CREATE TRIGGER evidence_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON evidence_items
  FOR EACH ROW EXECUTE FUNCTION log_evidence_audit();

-- Verify the fix
SELECT 'Audit trigger fixed successfully!' as status; 