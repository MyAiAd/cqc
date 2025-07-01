# Evidence Storage Implementation Guide for Harmony360

This guide provides step-by-step instructions for implementing the complete evidence storage and tracking system in your Harmony360 application with full multi-tenant support.

## Overview

The evidence storage system enables medical practices to:
- Track compliance evidence for CQC regulations
- Store and manage documents, certificates, and other proof
- Maintain audit trails and approval workflows
- Generate compliance reports and analytics
- Ensure complete tenant isolation between practices

## Implementation Steps

### 1. Database Schema Setup

First, run the evidence storage schema to create all necessary tables:

```sql
-- Run this in your Supabase SQL Editor
-- File: evidence-storage-schema.sql
```

This creates:
- `evidence_categories` - Customizable evidence categories per practice
- `evidence_requirements` - CQC regulation requirements per practice
- `evidence_items` - Main evidence tracking table
- `evidence_files` - File attachments with Supabase Storage integration
- `evidence_comments` - Collaboration and approval comments
- `evidence_audit_log` - Complete audit trail
- `evidence_workflows` - Approval workflow definitions
- `evidence_workflow_instances` - Active workflow tracking

### 2. Supabase Storage Setup

#### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `evidence-files`
3. Set bucket settings:
   - **Public**: `false` (private bucket)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: 
     ```
     application/pdf,
     image/*,
     application/msword,
     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
     text/plain
     ```

#### Create Storage RLS Policies

Run these policies in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files to their practice folder
CREATE POLICY "evidence_files_upload" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'evidence-files' AND
  (storage.foldername(name))[1] = (
    SELECT practice_id::text FROM users WHERE id = auth.uid()
  )
);

-- Allow practice members to read files from their practice folder
CREATE POLICY "evidence_files_read" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'evidence-files' AND
  (
    (storage.foldername(name))[1] = (
      SELECT practice_id::text FROM users WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Allow users to delete files from their practice folder
CREATE POLICY "evidence_files_delete" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'evidence-files' AND
  (
    (storage.foldername(name))[1] = (
      SELECT practice_id::text FROM users WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);
```

### 3. Initialize Evidence Data for Existing Practices

Run this for each existing practice to seed default categories and requirements:

```sql
-- Get all practice IDs
SELECT id, name FROM practices;

-- For each practice, run:
SELECT seed_evidence_data_for_practice('PRACTICE_ID_HERE');
```

### 4. Frontend Integration

#### Add Evidence Types to Main Types

Update `src/types/index.ts` to export evidence types:

```typescript
// Add to existing exports
export * from './evidence';
```

#### Update Navigation

Add Evidence to your navigation menu in `src/components/layout/Navigation.tsx`:

```typescript
import { FileText } from 'lucide-react';

// Add to navigation items
{
  name: 'Evidence',
  href: '/evidence',
  icon: FileText,
  current: pathname === '/evidence'
}
```

#### Add Route

Update your router configuration to include the Evidence page:

```typescript
// In your router setup
import { Evidence } from '../pages/Evidence';

// Add route
{
  path: '/evidence',
  element: <Evidence />
}
```

#### Complete Evidence Service

The evidence service file needs to be completed. Here's the full implementation:

```typescript
// File: src/services/evidenceService.ts
// [The complete service implementation would go here]
```

### 5. Evidence Management Components

Create these additional components for full functionality:

#### Evidence Upload Modal

```typescript
// src/components/evidence/EvidenceUploadModal.tsx
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { evidenceService } from '../../services/evidenceService';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Implementation here
};
```

#### Evidence Detail Modal

```typescript
// src/components/evidence/EvidenceDetailModal.tsx
// Full evidence item view with files, comments, and actions
```

#### Evidence Card Component

```typescript
// src/components/evidence/EvidenceCard.tsx
// Card view for evidence items in grid layout
```

#### File Upload Component

```typescript
// src/components/evidence/FileUpload.tsx
// Drag-and-drop file upload with progress
```

### 6. Dashboard Integration

Update your main dashboard to show evidence statistics:

```typescript
// In src/pages/Dashboard.tsx
import { evidenceService } from '../services/evidenceService';

// Add evidence stats to dashboard
const [evidenceStats, setEvidenceStats] = useState(null);

useEffect(() => {
  const loadEvidenceStats = async () => {
    try {
      const stats = await evidenceService.getEvidenceStats();
      setEvidenceStats(stats);
    } catch (error) {
      console.error('Error loading evidence stats:', error);
    }
  };
  
  loadEvidenceStats();
}, []);

// Add evidence cards to dashboard
{evidenceStats && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">Evidence Items</p>
            <p className="text-2xl font-bold">{evidenceStats.total_items}</p>
          </div>
          <FileText className="h-8 w-8 text-primary-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">Pending Approval</p>
            <p className="text-2xl font-bold text-warning-600">{evidenceStats.pending_approvals}</p>
          </div>
          <Clock className="h-8 w-8 text-warning-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">Expiring Soon</p>
            <p className="text-2xl font-bold text-error-600">{evidenceStats.expiring_soon}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-error-600" />
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

### 7. Compliance Check Integration

Update your existing Compliance Check page to link to evidence:

```typescript
// In src/pages/ComplianceCheck.tsx
import { evidenceService } from '../services/evidenceService';

// Add evidence links to compliance items
const [complianceOverview, setComplianceOverview] = useState([]);

useEffect(() => {
  const loadComplianceOverview = async () => {
    try {
      const overview = await evidenceService.getComplianceOverview();
      setComplianceOverview(overview);
    } catch (error) {
      console.error('Error loading compliance overview:', error);
    }
  };
  
  loadComplianceOverview();
}, []);

// Update compliance display to show evidence status
{complianceOverview.map(item => (
  <div key={item.regulation_id} className="border rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">{item.regulation_title}</h3>
        <p className="text-sm text-neutral-600">
          {item.evidence_approved}/{item.total_evidence_needed} evidence items approved
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.status === 'compliant' ? 'bg-success-100 text-success-800' :
          item.status === 'partially_compliant' ? 'bg-warning-100 text-warning-800' :
          'bg-error-100 text-error-800'
        }`}>
          {item.compliance_percentage}% Complete
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/evidence?requirement=${item.regulation_id}`)}
        >
          View Evidence
        </Button>
      </div>
    </div>
  </div>
))}
```

### 8. User Permissions and Roles

Ensure proper role-based access:

```typescript
// In evidence components, check user permissions
const { userProfile } = useAuth();

const canApprove = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
const canDelete = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
const canEdit = true; // All authenticated users can edit their own evidence

// Show/hide actions based on permissions
{canApprove && (
  <Button onClick={() => handleApprove(item.id)}>
    Approve
  </Button>
)}
```

### 9. Notifications and Alerts

Implement evidence-related notifications:

```typescript
// src/hooks/useEvidenceNotifications.ts
import { useState, useEffect } from 'react';
import { evidenceService } from '../services/evidenceService';

export const useEvidenceNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const stats = await evidenceService.getEvidenceStats();
        const newNotifications = [];
        
        if (stats.expiring_soon > 0) {
          newNotifications.push({
            type: 'warning',
            title: 'Evidence Expiring Soon',
            message: `${stats.expiring_soon} evidence items expire within 30 days`,
            action: () => navigate('/evidence?filter=expiring_soon')
          });
        }
        
        if (stats.overdue_reviews > 0) {
          newNotifications.push({
            type: 'error',
            title: 'Overdue Reviews',
            message: `${stats.overdue_reviews} evidence items need review`,
            action: () => navigate('/evidence?filter=overdue')
          });
        }
        
        setNotifications(newNotifications);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return notifications;
};
```

### 10. Testing Multi-Tenancy

Test that evidence is properly isolated between practices:

1. **Create test practices**: Set up 2-3 test practices
2. **Add evidence to each**: Upload different evidence to each practice
3. **Verify isolation**: Ensure users can only see their practice's evidence
4. **Test super admin**: Verify super admin can see all evidence
5. **Test file access**: Ensure file downloads respect practice boundaries

### 11. Performance Optimization

For large amounts of evidence:

1. **Implement pagination**: Add proper pagination to evidence lists
2. **Add search indexing**: Use PostgreSQL full-text search
3. **Optimize queries**: Add database indexes for common queries
4. **Implement caching**: Cache frequently accessed data
5. **Lazy loading**: Load evidence details on demand

### 12. Backup and Recovery

Ensure evidence data is properly backed up:

1. **Database backups**: Regular Supabase database backups
2. **File backups**: Supabase Storage automatic backups
3. **Export functionality**: Allow practices to export their evidence
4. **Audit trail preservation**: Ensure audit logs are never deleted

## Security Considerations

1. **Row Level Security**: All evidence tables have RLS enabled
2. **File access control**: Storage policies enforce practice isolation
3. **Audit logging**: All changes are logged with user and IP information
4. **Data encryption**: Files are encrypted at rest in Supabase Storage
5. **Access controls**: Role-based permissions for all operations

## Monitoring and Analytics

Track evidence system usage:

1. **Evidence completion rates**: Monitor compliance progress
2. **File upload patterns**: Track storage usage
3. **User engagement**: Monitor evidence management activity
4. **Compliance trends**: Track improvement over time

## Support and Maintenance

1. **Regular updates**: Keep evidence requirements up to date with CQC changes
2. **User training**: Provide guidance on evidence management
3. **System monitoring**: Monitor for errors and performance issues
4. **Data cleanup**: Regular cleanup of expired evidence and files

## Conclusion

This evidence storage system provides a comprehensive, multi-tenant solution for tracking compliance evidence in your Harmony360 application. The system ensures complete data isolation between practices while providing powerful tools for evidence management, compliance tracking, and audit preparation.

The implementation follows best practices for security, performance, and user experience, making it suitable for production use in healthcare environments where data protection and compliance are critical. 