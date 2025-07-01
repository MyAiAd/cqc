-- EVIDENCE STORAGE BUCKET SETUP
-- Run this script in Supabase SQL Editor after creating the bucket manually

-- Note: You must first create the bucket manually in the Supabase Dashboard
-- Bucket name: evidence-files
-- Public: false
-- File size limit: 50MB

-- ============================================================================
-- CREATE RLS POLICIES FOR EVIDENCE FILES STORAGE
-- ============================================================================

-- Policy 1: Allow practice members to upload evidence files
CREATE POLICY "Practice members can upload evidence files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'evidence-files' 
  AND 
  -- Check if the path starts with the user's practice_id
  (storage.foldername(name))[1] = (
    SELECT practice_id::text 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Policy 2: Allow practice members to read their evidence files
CREATE POLICY "Practice members can read their evidence files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'evidence-files' 
  AND 
  (
    -- Users can read files from their practice folder
    (storage.foldername(name))[1] = (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
    OR
    -- Super admins can read all files
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Policy 3: Allow practice members to update their evidence files
CREATE POLICY "Practice members can update their evidence files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'evidence-files' 
  AND 
  (
    -- Users can update files from their practice folder
    (storage.foldername(name))[1] = (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
    OR
    -- Super admins can update all files
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Policy 4: Allow practice members to delete their evidence files
CREATE POLICY "Practice members can delete their evidence files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'evidence-files' 
  AND 
  (
    -- Users can delete files from their practice folder
    (storage.foldername(name))[1] = (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
    OR
    -- Super admins can delete all files
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if bucket exists
SELECT 
  'evidence-files bucket status:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'evidence-files') 
    THEN 'EXISTS ✓' 
    ELSE 'NOT FOUND ✗ - Please create the bucket manually first' 
  END as status;

-- Check RLS policies
SELECT 
  'Storage RLS policies created:' as check_type,
  COUNT(*) || ' policies' as status
FROM storage.policies 
WHERE bucket_id = 'evidence-files';

-- Show all policies for evidence-files bucket
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM storage.policies 
WHERE bucket_id = 'evidence-files'
ORDER BY cmd;

-- Test folder structure function
SELECT 
  'Folder structure test:' as check_type,
  'evidence-files/practice-123/item-456/file.pdf' as example_path,
  (storage.foldername('evidence-files/practice-123/item-456/file.pdf'))[1] as extracted_practice_id;

SELECT 'EVIDENCE STORAGE SETUP COMPLETE!' as result; 