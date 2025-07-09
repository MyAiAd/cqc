import { supabase } from '../lib/supabase';
import { 
  EvidenceItem, 
  EvidenceFile, 
  EvidenceCategory, 
  EvidenceRequirement,
  EvidenceComment,
  EvidenceStats,
  ComplianceOverview,
  CreateEvidenceItemRequest,
  UpdateEvidenceItemRequest,
  EvidenceSearchFilters,
  EvidenceSearchResult,
  EvidenceUploadRequest,
  FileUploadResult,
  BulkEvidenceOperation,
  BulkOperationResult
} from '../types/evidence';

class EvidenceService {
  private async getCurrentPracticeId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userProfile } = await supabase
      .from('users')
      .select('practice_id, role')
      .eq('id', user.id)
      .single();

    // If user is super admin and doesn't have a practice_id, use Riverside Health Practice
    // This allows super admin to manage evidence globally while maintaining data isolation
    if (userProfile?.role === 'super_admin' && !userProfile?.practice_id) {
      console.log('Super admin detected, using Global Practice context');
      return '00000000-0000-0000-0000-000000000003';
    }

    if (!userProfile?.practice_id) {
      throw new Error('User practice not found');
    }

    return userProfile.practice_id;
  }

  // Helper method to get practice display name for UI
  async getPracticeDisplayName(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Unknown Practice';

    const { data: userProfile } = await supabase
      .from('users')
      .select('practice_id, role')
      .eq('id', user.id)
      .single();

    // If user is super admin, show "Global Practice"
    if (userProfile?.role === 'super_admin' && !userProfile?.practice_id) {
      return 'Global Practice';
    }

    if (!userProfile?.practice_id) {
      return 'Unknown Practice';
    }

    // Get practice name separately
    const { data: practice } = await supabase
      .from('practices')
      .select('name')
      .eq('id', userProfile.practice_id)
      .single();

    return practice?.name || 'Unknown Practice';
  }

  // ============================================================================
  // EVIDENCE ITEMS
  // ============================================================================

  async getEvidenceItems(filters?: EvidenceSearchFilters): Promise<EvidenceSearchResult> {
    try {
      // Get current user to check if they're super admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found for getEvidenceItems');
        return { items: [], total_count: 0, page: 1, page_size: 50, filters_applied: filters || {} };
      }

      console.log('Step 1: Checking user role for evidence...');
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('practice_id, role, email, name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile for evidence:', userError);
        return { items: [], total_count: 0, page: 1, page_size: 50, filters_applied: filters || {} };
      }

      const isSuperAdmin = userProfile?.role === 'super_admin';
      console.log('User profile for evidence:', userProfile);
      console.log('Is super admin for evidence?', isSuperAdmin);

      let query = supabase
        .from('evidence_items')
        .select(`
          *,
          requirement:evidence_requirements(*),
          category:evidence_categories(*),
          files:evidence_files(*),
          practice:practices(id, name, email_domain),
          comments:evidence_comments(
            *,
            created_by_user:users(name, email)
          )
        `);

      if (isSuperAdmin) {
        console.log('Super admin detected - fetching evidence from ALL practices');
        // Super admin sees all evidence from all practices
        query = query.order('created_at', { ascending: false });
      } else {
        console.log('Regular user - fetching evidence from their practice only');
        // Regular users only see evidence from their practice
        const practiceId = userProfile?.practice_id;
        if (!practiceId) {
          console.log('No practice ID found for regular user');
          return { items: [], total_count: 0, page: 1, page_size: 50, filters_applied: filters || {} };
        }
        query = query.eq('practice_id', practiceId);
      }

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters?.compliance_status?.length) {
        query = query.in('compliance_status', filters.compliance_status);
      }
      
      if (filters?.evidence_type?.length) {
        query = query.in('evidence_type', filters.evidence_type);
      }
      
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters?.requirement_id) {
        query = query.eq('requirement_id', filters.requirement_id);
      }
      
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      
      if (filters?.date_from) {
        query = query.gte('evidence_date', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('evidence_date', filters.date_to);
      }
      
      if (filters?.expiring_soon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        query = query.lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
      }
      
      if (filters?.overdue) {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('next_review_date', today);
      }



      const { data: items, error, count } = await query;

      if (error) {
        console.error('Error fetching evidence items:', error);
        return { items: [], total_count: 0, page: 1, page_size: 50, filters_applied: filters || {} };
      }

      console.log('Evidence items fetched:', items?.length || 0);

      // Transform items to include practice information for super admin
      const transformedItems = items?.map(item => ({
        ...item,
        // Add practice information for super admin
        ...(isSuperAdmin && item.practice ? {
          practiceName: item.practice.name,
          practiceId: item.practice.id
        } : {})
      })) || [];

      console.log('Processed evidence items count:', transformedItems.length);

      return {
        items: transformedItems,
        total_count: count || transformedItems.length,
        page: 1,
        page_size: 50,
        filters_applied: filters || {}
      };

    } catch (error) {
      console.error('Error in getEvidenceItems:', error);
      return { items: [], total_count: 0, page: 1, page_size: 50, filters_applied: filters || {} };
    }
  }

  async getEvidenceItem(id: string): Promise<EvidenceItem> {
    const practiceId = await this.getCurrentPracticeId();
    
    const { data, error } = await supabase
      .from('evidence_items')
      .select(`
        *,
        requirement:evidence_requirements(*),
        category:evidence_categories(*),
        files:evidence_files(*),
        comments:evidence_comments(
          *,
          created_by_user:users(name, email)
        )
      `)
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (error) {
      console.error('Error fetching evidence item:', error);
      throw new Error(`Failed to fetch evidence item: ${error.message}`);
    }

    if (!data) {
      throw new Error('Evidence item not found');
    }

    return data;
  }

  async createEvidenceItem(request: CreateEvidenceItemRequest): Promise<EvidenceItem> {
    const practiceId = await this.getCurrentPracticeId();
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('=== EVIDENCE CREATION DEBUG ===');
    console.log('Creating evidence item with request:', request);
    console.log('Evidence type being used:', request.evidence_type);
    
    const evidenceData = {
      ...request,
      practice_id: practiceId,
      submitted_by: user?.id,
      tags: request.tags || [],
      is_sensitive: request.is_sensitive || false
    };
    
    console.log('Final evidence data to be saved:', evidenceData);

    const { data, error } = await supabase
      .from('evidence_items')
      .insert(evidenceData)
      .select(`
        *,
        requirement:evidence_requirements(*),
        category:evidence_categories(*),
        files:evidence_files(*),
        comments:evidence_comments(
          *,
          created_by_user:users(name, email)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating evidence item:', error);
      throw new Error(`Failed to create evidence item: ${error.message}`);
    }

    return data;
  }

  async updateEvidenceItem(id: string, request: UpdateEvidenceItemRequest): Promise<EvidenceItem> {
    const practiceId = await this.getCurrentPracticeId();
    
    const { data, error } = await supabase
      .from('evidence_items')
      .update(request)
      .eq('id', id)
      .eq('practice_id', practiceId)
      .select(`
        *,
        requirement:evidence_requirements(*),
        category:evidence_categories(*),
        files:evidence_files(*),
        comments:evidence_comments(
          *,
          created_by_user:users(name, email)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating evidence item:', error);
      throw new Error(`Failed to update evidence item: ${error.message}`);
    }

    return data;
  }

  async deleteEvidenceItem(id: string): Promise<void> {
    const practiceId = await this.getCurrentPracticeId();
    
    try {
      // First, get all files associated with this evidence item
      const { data: files, error: filesError } = await supabase
        .from('evidence_files')
        .select('id, file_path')
        .eq('evidence_item_id', id)
        .eq('practice_id', practiceId);

      if (filesError) {
        console.error('Error fetching files for deletion:', filesError);
        throw new Error(`Failed to fetch files for deletion: ${filesError.message}`);
      }

      // Delete files from storage first
      if (files && files.length > 0) {
        const filePaths = files.map(file => file.file_path);
        const { error: storageError } = await supabase.storage
          .from('evidence-files')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
          // Continue with deletion even if storage cleanup fails
        }
      }

      // Delete the evidence item (CASCADE will handle related records)
      const { error } = await supabase
        .from('evidence_items')
        .delete()
        .eq('id', id)
        .eq('practice_id', practiceId);

      if (error) {
        console.error('Error deleting evidence item:', error);
        throw new Error(`Failed to delete evidence item: ${error.message}`);
      }

      console.log('Evidence item deleted successfully:', id);
    } catch (error) {
      console.error('Error in deleteEvidenceItem:', error);
      throw error;
    }
  }

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  async uploadFile(request: EvidenceUploadRequest): Promise<FileUploadResult> {
    try {
      const practiceId = await this.getCurrentPracticeId();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('=== FILE UPLOAD DEBUG ===');
      console.log('Upload file - Practice ID:', practiceId);
      console.log('Upload file - Evidence Item ID:', request.evidence_item_id);
      console.log('Upload file - File name:', request.file.name);
      console.log('Upload file - File size:', request.file.size);
      console.log('Upload file - File type:', request.file.type);
      console.log('Upload file - User ID:', user?.id);
      
      // Check if storage bucket exists by trying to list files (more reliable than listBuckets)
      console.log('Checking if evidence-files bucket exists...');
      const { data: testList, error: bucketError } = await supabase.storage
        .from('evidence-files')
        .list('', { limit: 1 });
      
      if (bucketError) {
        console.error('Error accessing evidence-files bucket:', bucketError);
        console.error('Bucket error details:', {
          message: bucketError.message,
          name: bucketError.name
        });
        
        // Provide more helpful error messages
        let errorMessage = bucketError.message;
        if (bucketError.message.includes('bucket_not_found') || bucketError.message.includes('not found')) {
          errorMessage = 'Storage bucket "evidence-files" not found. Please contact your administrator to create the bucket in Supabase Storage.';
        } else if (bucketError.message.includes('insufficient_scope') || bucketError.message.includes('permission')) {
          errorMessage = 'Insufficient permissions to access storage. Please contact your administrator to configure storage permissions.';
        }
        
        return {
          success: false,
          error_message: `Storage access error: ${errorMessage}`
        };
      }
      
      console.log('evidence-files bucket accessible, test list result:', testList);
      
      // Generate unique filename
      const fileExt = request.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${practiceId}/${request.evidence_item_id}/${fileName}`;

      console.log('Upload file - Generated file path:', filePath);

      // Upload file to Supabase Storage
      console.log('Starting file upload to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence-files')
        .upload(filePath, request.file);

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        });
        
        // Provide more helpful error messages
        let errorMessage = uploadError.message;
        if (uploadError.message.includes('bucket_not_found')) {
          errorMessage = 'Storage bucket not found. Please contact your administrator to set up the evidence-files storage bucket.';
        } else if (uploadError.message.includes('insufficient_scope')) {
          errorMessage = 'Insufficient permissions to upload files. Please contact your administrator.';
        } else if (uploadError.message.includes('payload_too_large')) {
          errorMessage = 'File is too large. Maximum file size is 50MB.';
        }
        
        return {
          success: false,
          error_message: `Failed to upload file: ${errorMessage}`
        };
      }

      console.log('File uploaded successfully to storage:', uploadData);

      // Create file record in database
      const fileRecord = {
        practice_id: practiceId,
        evidence_item_id: request.evidence_item_id,
        filename: fileName,
        original_filename: request.file.name,
        file_size: request.file.size,
        mime_type: request.file.type,
        file_path: filePath,
        is_primary: request.is_primary || false,
        access_level: request.access_level || 'practice',
        uploaded_by: user?.id
      };

      console.log('Creating file record in database:', fileRecord);

      const { data: fileData, error: dbError } = await supabase
        .from('evidence_files')
        .insert(fileRecord)
        .select()
        .single();

      if (dbError) {
        console.error('Error creating file record in database:', dbError);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint
        });
        // Clean up uploaded file
        console.log('Cleaning up uploaded file due to database error...');
        await supabase.storage.from('evidence-files').remove([filePath]);
        return {
          success: false,
          error_message: `Failed to create file record: ${dbError.message}`
        };
      }

      console.log('File record created successfully in database:', fileData);
      console.log('=== FILE UPLOAD SUCCESS ===');

      return {
        success: true,
        file_id: fileData.id,
        file_path: filePath
      };
    } catch (error) {
      console.error('Unexpected error uploading file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error_message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const practiceId = await this.getCurrentPracticeId();
    
    // Get file record
    const { data: fileRecord, error: dbError } = await supabase
      .from('evidence_files')
      .select('file_path')
      .eq('id', fileId)
      .eq('practice_id', practiceId)
      .single();

    if (dbError || !fileRecord) {
      throw new Error('File not found');
    }

    // Download file from storage
    const { data, error } = await supabase.storage
      .from('evidence-files')
      .download(fileRecord.file_path);

    if (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  async deleteFile(fileId: string): Promise<void> {
    const practiceId = await this.getCurrentPracticeId();
    
    // Get file record
    const { data: fileRecord, error: dbError } = await supabase
      .from('evidence_files')
      .select('file_path')
      .eq('id', fileId)
      .eq('practice_id', practiceId)
      .single();

    if (dbError || !fileRecord) {
      throw new Error('File not found');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('evidence-files')
      .remove([fileRecord.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('evidence_files')
      .delete()
      .eq('id', fileId)
      .eq('practice_id', practiceId);

    if (deleteError) {
      console.error('Error deleting file record:', deleteError);
      throw new Error(`Failed to delete file: ${deleteError.message}`);
    }
  }

  // ============================================================================
  // CATEGORIES AND REQUIREMENTS
  // ============================================================================

  async getCategories(): Promise<EvidenceCategory[]> {
    const practiceId = await this.getCurrentPracticeId();
    
    const { data, error } = await supabase
      .from('evidence_categories')
      .select('*')
      .eq('practice_id', practiceId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  async getRequirements(): Promise<EvidenceRequirement[]> {
    const practiceId = await this.getCurrentPracticeId();
    
    const { data, error } = await supabase
      .from('evidence_requirements')
      .select('*')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('title');

    if (error) {
      console.error('Error fetching requirements:', error);
      throw new Error(`Failed to fetch requirements: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // ANALYTICS AND STATS
  // ============================================================================

  async getEvidenceStats(): Promise<EvidenceStats> {
    const practiceId = await this.getCurrentPracticeId();
    
    // Get all evidence items for this practice
    const { data: items, error } = await supabase
      .from('evidence_items')
      .select('status, compliance_status, evidence_type, expiry_date, next_review_date')
      .eq('practice_id', practiceId);

    if (error) {
      console.error('Error fetching evidence stats:', error);
      throw new Error(`Failed to fetch evidence stats: ${error.message}`);
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const stats: EvidenceStats = {
      total_items: items?.length || 0,
      by_status: {
        pending: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        under_review: 0
      },
      by_compliance: {
        compliant: 0,
        partially_compliant: 0,
        not_compliant: 0,
        not_applicable: 0
      },
      by_type: {
        document: 0,
        policy: 0,
        procedure: 0,
        training_record: 0,
        audit_report: 0,
        certificate: 0,
        photo: 0,
        video: 0,
        other: 0
      },
      expiring_soon: 0,
      overdue_reviews: 0,
      pending_approvals: 0
    };

    items?.forEach((item: any) => {
      // Count by status
      if (item.status && stats.by_status[item.status as keyof typeof stats.by_status] !== undefined) {
        stats.by_status[item.status as keyof typeof stats.by_status]++;
      }
      
      // Count by compliance
      if (item.compliance_status && stats.by_compliance[item.compliance_status as keyof typeof stats.by_compliance] !== undefined) {
        stats.by_compliance[item.compliance_status as keyof typeof stats.by_compliance]++;
      }
      
      // Count by type
      if (item.evidence_type && stats.by_type[item.evidence_type as keyof typeof stats.by_type] !== undefined) {
        stats.by_type[item.evidence_type as keyof typeof stats.by_type]++;
      }
      
      // Count expiring soon
      if (item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow) {
        stats.expiring_soon++;
      }
      
      // Count overdue reviews
      if (item.next_review_date && new Date(item.next_review_date) < today) {
        stats.overdue_reviews++;
      }
      
      // Count pending approvals
      if (item.status === 'submitted' || item.status === 'under_review') {
        stats.pending_approvals++;
      }
    });

    return stats;
  }

  async getComplianceOverview(): Promise<ComplianceOverview[]> {
    const practiceId = await this.getCurrentPracticeId();
    
    // Get all requirements and their associated evidence
    const { data: requirements, error } = await supabase
      .from('evidence_requirements')
      .select(`
        *,
        evidence_items:evidence_items(status, compliance_status, next_review_date)
      `)
      .eq('practice_id', practiceId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching compliance overview:', error);
      throw new Error(`Failed to fetch compliance overview: ${error.message}`);
    }

    const today = new Date();

    return (requirements || []).map(req => {
      const evidenceItems = req.evidence_items || [];
      const totalNeeded = req.evidence_needed.length;
      const submitted = evidenceItems.filter((item: any) => 
        item.status === 'submitted' || item.status === 'approved'
      ).length;
      const approved = evidenceItems.filter((item: any) => 
        item.status === 'approved'
      ).length;
      const overdue = evidenceItems.filter((item: any) => 
        item.next_review_date && new Date(item.next_review_date) < today
      ).length;

      const compliancePercentage = totalNeeded > 0 ? (approved / totalNeeded) * 100 : 0;
      
      let status: 'compliant' | 'partially_compliant' | 'not_compliant';
      if (compliancePercentage >= 100) {
        status = 'compliant';
      } else if (compliancePercentage >= 50) {
        status = 'partially_compliant';
      } else {
        status = 'not_compliant';
      }

      return {
        regulation_id: req.regulation_id,
        regulation_title: req.title,
        regulation_type: req.regulation_type,
        priority: req.priority,
        total_evidence_needed: totalNeeded,
        evidence_submitted: submitted,
        evidence_approved: approved,
        compliance_percentage: Math.round(compliancePercentage),
        status,
        next_review_date: req.due_date,
        overdue_items: overdue
      };
    });
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  async addComment(evidenceItemId: string, comment: string, commentType: string = 'general'): Promise<EvidenceComment> {
    const practiceId = await this.getCurrentPracticeId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const commentData = {
      practice_id: practiceId,
      evidence_item_id: evidenceItemId,
      comment,
      comment_type: commentType,
      created_by: user?.id
    };

    const { data, error } = await supabase
      .from('evidence_comments')
      .insert(commentData)
      .select(`
        *,
        created_by_user:users(name, email)
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkOperation(operation: BulkEvidenceOperation): Promise<BulkOperationResult> {
    const practiceId = await this.getCurrentPracticeId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const result: BulkOperationResult = {
      success: true,
      processed_count: 0,
      failed_count: 0,
      errors: []
    };

    for (const itemId of operation.evidence_item_ids) {
      try {
        let updateData: any = {};
        
        switch (operation.operation) {
          case 'approve':
            updateData = { 
              status: 'approved', 
              approval_date: new Date().toISOString(),
              approved_by: user?.id 
            };
            break;
          case 'reject':
            updateData = { status: 'rejected' };
            break;
          case 'update_status':
            updateData = { status: operation.parameters?.status };
            break;
          case 'assign':
            updateData = { assigned_to: operation.parameters?.assigned_to };
            break;
          case 'delete':
            const { error: deleteError } = await supabase
              .from('evidence_items')
              .delete()
              .eq('id', itemId)
              .eq('practice_id', practiceId);
            
            if (deleteError) throw deleteError;
            result.processed_count++;
            continue;
        }

        const { error } = await supabase
          .from('evidence_items')
          .update(updateData)
          .eq('id', itemId)
          .eq('practice_id', practiceId);

        if (error) throw error;
        result.processed_count++;
      } catch (error) {
        result.failed_count++;
        result.errors.push({
          evidence_item_id: itemId,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    result.success = result.failed_count === 0;
    return result;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initializePracticeEvidence(): Promise<void> {
    const practiceId = await this.getCurrentPracticeId();
    
    // Check if evidence data already exists
    const { data: existingCategories } = await supabase
      .from('evidence_categories')
      .select('id')
      .eq('practice_id', practiceId)
      .limit(1);

    if (existingCategories && existingCategories.length > 0) {
      return; // Already initialized
    }

    // Call the seeding function
    const { error } = await supabase.rpc('seed_evidence_data_for_practice', {
      target_practice_id: practiceId
    });

    if (error) {
      console.error('Error initializing practice evidence:', error);
      throw new Error(`Failed to initialize evidence data: ${error.message}`);
    }
  }
}

export const evidenceService = new EvidenceService();
