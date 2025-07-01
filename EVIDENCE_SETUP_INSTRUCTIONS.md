# Evidence Storage Setup Instructions

## Step 1: Run Database Schema

1. Open your Supabase project dashboard
2. Go to the **SQL Editor** tab
3. Copy the entire contents of `evidence-storage-schema.sql` 
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

This will create all the evidence storage tables, RLS policies, indexes, and helper functions.

## Step 2: Initialize Evidence Data

After running the schema, run this SQL to set up default evidence categories and CQC requirements for your practice:

```sql
-- Replace 'your-practice-id-here' with your actual practice ID
-- You can find your practice ID by running: SELECT id FROM practices;
SELECT setup_evidence_storage();
SELECT seed_evidence_data_for_practice('your-practice-id-here');
```

## Step 3: Test the Upload Functionality

1. Start your development server: `npm run dev`
2. Navigate to the Evidence page
3. Click the "Upload Evidence" button
4. Try uploading a test document

## Step 4: Verify Storage Bucket

Make sure your Supabase Storage bucket "evidence-files" is set up with the correct RLS policies as we configured earlier.

## What This Sets Up

The evidence storage system includes:

- **8 new database tables** with complete multi-tenant isolation
- **Evidence categories** (Document types, Policies, Training records, etc.)
- **CQC requirements** (All fundamental standards and quality statements)
- **Evidence items** (The actual evidence with metadata)
- **File storage** (Secure file uploads with access control)
- **Comments system** (For collaboration and approval workflows)
- **Audit logging** (Complete trail of all evidence changes)
- **Workflow management** (Approval processes)

## Troubleshooting

If you encounter any errors:

1. **"relation does not exist"** - Make sure you ran the basic schema from `supabase-setup.md` first
2. **"permission denied"** - Check that RLS policies are correctly applied
3. **"practice_id not found"** - Make sure you have a practice record in the practices table

## Next Steps

Once the database is set up, you can:
- Upload evidence documents
- Categorize evidence by type and CQC requirement
- Track compliance status
- Set up approval workflows
- Generate compliance reports 