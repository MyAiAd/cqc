# Storage Setup Guide for File Uploads

## Issue: Policy/Evidence File Uploads Not Working

If you're experiencing issues with file uploads when adding policies or evidence, it's likely because the Supabase storage bucket hasn't been configured yet.

## Quick Setup Steps

### 1. Create Storage Bucket in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `evidence-files`
   - **Public**: `false` (keep it private)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: Leave empty (allow all)

### 2. Apply RLS Policies

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL script from `setup-evidence-storage.sql` file in this project
3. This will create the necessary Row Level Security policies for file access

### 3. Verify Setup

After running the setup, you can verify it worked by:

1. Going back to the app
2. Trying to upload a policy document
3. Check the browser console for detailed logs

## What This Enables

Once configured, users will be able to:
- ✅ Upload policy documents (PDF, DOC, etc.)
- ✅ Upload evidence files
- ✅ Download uploaded files
- ✅ View file attachments in policy/evidence details
- ✅ Secure file access (users only see their practice's files)

## Security Features

The storage setup includes:
- **Practice Isolation**: Users can only access files from their own practice
- **Super Admin Access**: Super admins can access all files
- **Secure File Paths**: Files are organized by practice and evidence item
- **RLS Protection**: Database-level security prevents unauthorized access

## File Organization

Files are stored in this structure:
```
evidence-files/
├── {practice-id-1}/
│   ├── {evidence-item-id-1}/
│   │   ├── policy-document.pdf
│   │   └── supporting-doc.docx
│   └── {evidence-item-id-2}/
│       └── certificate.jpg
└── {practice-id-2}/
    └── ...
```

## Troubleshooting

If uploads still don't work after setup:

1. **Check browser console** for detailed error messages
2. **Verify bucket name** is exactly `evidence-files`
3. **Check RLS policies** are applied correctly
4. **Ensure user has practice_id** in their profile

## Need Help?

The app now provides detailed error messages in the console to help diagnose storage issues. Check the browser developer tools console when attempting uploads. 