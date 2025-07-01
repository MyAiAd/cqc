// Evidence Storage Types for Harmony360
// Multi-tenant evidence tracking and storage system

export type EvidenceType = 
  | 'document' 
  | 'policy' 
  | 'procedure' 
  | 'training_record' 
  | 'audit_report' 
  | 'certificate' 
  | 'photo' 
  | 'video' 
  | 'other';

export type EvidenceStatus = 
  | 'pending' 
  | 'submitted' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'under_review';

export type ComplianceStatus = 
  | 'compliant' 
  | 'partially_compliant' 
  | 'not_compliant' 
  | 'not_applicable';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ReviewFrequency = 'monthly' | 'quarterly' | 'annually' | 'as_needed';

export type CommentType = 
  | 'general' 
  | 'approval' 
  | 'rejection' 
  | 'request_changes' 
  | 'internal_note';

export type AccessLevel = 'practice' | 'admin_only' | 'public';

export type WorkflowStatus = 'in_progress' | 'completed' | 'rejected' | 'cancelled';

// Evidence Categories
export interface EvidenceCategory {
  id: string;
  practice_id: string;
  name: string;
  description?: string;
  color: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// Evidence Requirements (what evidence is needed for each regulation)
export interface EvidenceRequirement {
  id: string;
  practice_id: string;
  regulation_id: string; // e.g., 'reg-9', 'safe-1'
  regulation_type: 'fundamental_standard' | 'quality_statement';
  title: string;
  description: string;
  evidence_needed: string[]; // Array of evidence descriptions
  priority: Priority;
  due_date?: string;
  review_frequency?: ReviewFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Main Evidence Items
export interface EvidenceItem {
  id: string;
  practice_id: string;
  requirement_id?: string;
  category_id?: string;
  
  // Evidence details
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  
  // Status tracking
  status: EvidenceStatus;
  compliance_status: ComplianceStatus;
  
  // Dates
  evidence_date?: string;
  submission_date?: string;
  approval_date?: string;
  expiry_date?: string;
  next_review_date?: string;
  
  // People
  submitted_by?: string;
  approved_by?: string;
  assigned_to?: string;
  
  // Additional metadata
  tags: string[];
  notes?: string;
  is_sensitive: boolean;
  retention_period?: number; // Days
  
  created_at: string;
  updated_at: string;
  
  // Related data (populated by joins)
  requirement?: EvidenceRequirement;
  category?: EvidenceCategory;
  files?: EvidenceFile[];
  comments?: EvidenceComment[];
}

// Evidence Files/Attachments
export interface EvidenceFile {
  id: string;
  practice_id: string;
  evidence_item_id: string;
  
  // File details
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_path: string; // Path in Supabase Storage
  
  // File metadata
  checksum?: string;
  is_primary: boolean;
  version: number;
  
  // Access control
  is_public: boolean;
  access_level: AccessLevel;
  
  uploaded_by?: string;
  created_at: string;
}

// Evidence Comments
export interface EvidenceComment {
  id: string;
  practice_id: string;
  evidence_item_id: string;
  
  comment: string;
  comment_type: CommentType;
  
  created_by: string;
  created_at: string;
  
  // Populated by joins
  created_by_user?: {
    name: string;
    email: string;
  };
}

// Evidence Audit Log
export interface EvidenceAuditLog {
  id: string;
  practice_id: string;
  evidence_item_id?: string;
  
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  
  performed_by?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  
  // Populated by joins
  performed_by_user?: {
    name: string;
    email: string;
  };
}

// Evidence Workflows
export interface EvidenceWorkflow {
  id: string;
  practice_id: string;
  
  name: string;
  description?: string;
  evidence_types: EvidenceType[];
  
  steps: WorkflowStep[];
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step: number;
  role: string; // 'admin', 'manager', 'staff', etc.
  action: string; // 'review', 'approve', 'reject', etc.
  description?: string;
}

// Evidence Workflow Instances
export interface EvidenceWorkflowInstance {
  id: string;
  practice_id: string;
  evidence_item_id: string;
  workflow_id: string;
  
  current_step: number;
  status: WorkflowStatus;
  
  started_at: string;
  completed_at?: string;
  
  // Populated by joins
  workflow?: EvidenceWorkflow;
  evidence_item?: EvidenceItem;
}

// API Request/Response Types
export interface CreateEvidenceItemRequest {
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  requirement_id?: string;
  category_id?: string;
  evidence_date?: string;
  expiry_date?: string;
  next_review_date?: string;
  assigned_to?: string;
  tags?: string[];
  notes?: string;
  is_sensitive?: boolean;
  retention_period?: number;
}

export interface UpdateEvidenceItemRequest extends Partial<CreateEvidenceItemRequest> {
  status?: EvidenceStatus;
  compliance_status?: ComplianceStatus;
}

export interface EvidenceUploadRequest {
  evidence_item_id: string;
  file: File;
  is_primary?: boolean;
  access_level?: AccessLevel;
}

export interface EvidenceSearchFilters {
  status?: EvidenceStatus[];
  compliance_status?: ComplianceStatus[];
  evidence_type?: EvidenceType[];
  category_id?: string;
  requirement_id?: string;
  assigned_to?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  expiring_soon?: boolean; // Items expiring in next 30 days
  overdue?: boolean; // Items past their review date
}

export interface EvidenceSearchResult {
  items: EvidenceItem[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: EvidenceSearchFilters;
}

// Dashboard/Analytics Types
export interface EvidenceStats {
  total_items: number;
  by_status: Record<EvidenceStatus, number>;
  by_compliance: Record<ComplianceStatus, number>;
  by_type: Record<EvidenceType, number>;
  expiring_soon: number; // Next 30 days
  overdue_reviews: number;
  pending_approvals: number;
}

export interface ComplianceOverview {
  regulation_id: string;
  regulation_title: string;
  regulation_type: 'fundamental_standard' | 'quality_statement';
  priority: Priority;
  total_evidence_needed: number;
  evidence_submitted: number;
  evidence_approved: number;
  compliance_percentage: number;
  status: 'compliant' | 'partially_compliant' | 'not_compliant';
  next_review_date?: string;
  overdue_items: number;
}

// File Upload Types
export interface FileUploadProgress {
  file_name: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error_message?: string;
}

export interface FileUploadResult {
  success: boolean;
  file_id?: string;
  file_path?: string;
  error_message?: string;
}

// Bulk Operations
export interface BulkEvidenceOperation {
  operation: 'approve' | 'reject' | 'delete' | 'update_status' | 'assign';
  evidence_item_ids: string[];
  parameters?: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  processed_count: number;
  failed_count: number;
  errors: Array<{
    evidence_item_id: string;
    error_message: string;
  }>;
}

// Export/Import Types
export interface EvidenceExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  include_files: boolean;
  filters?: EvidenceSearchFilters;
  date_range?: {
    from: string;
    to: string;
  };
}

export interface EvidenceImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// Notification Types
export interface EvidenceNotification {
  id: string;
  type: 'expiry_warning' | 'review_due' | 'approval_required' | 'rejected' | 'approved';
  evidence_item_id: string;
  title: string;
  message: string;
  created_at: string;
  read_at?: string;
  
  evidence_item?: EvidenceItem;
}

// Form Types for UI Components
export interface EvidenceFormData extends CreateEvidenceItemRequest {
  files?: File[];
}

export interface EvidenceFilterFormData {
  search_term?: string;
  status?: EvidenceStatus[];
  compliance_status?: ComplianceStatus[];
  evidence_type?: EvidenceType[];
  category_id?: string;
  requirement_id?: string;
  date_range?: {
    from: string;
    to: string;
  };
  show_expired?: boolean;
  show_overdue?: boolean;
}

// Component Props Types
export interface EvidenceListProps {
  items: EvidenceItem[];
  loading?: boolean;
  onItemSelect?: (item: EvidenceItem) => void;
  onItemUpdate?: (item: EvidenceItem) => void;
  onItemDelete?: (itemId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface EvidenceCardProps {
  item: EvidenceItem;
  onUpdate?: (item: EvidenceItem) => void;
  onDelete?: (itemId: string) => void;
  onFileUpload?: (itemId: string, files: File[]) => void;
  showActions?: boolean;
  expanded?: boolean;
}

export interface EvidenceUploadProps {
  evidence_item_id: string;
  onUploadComplete?: (file: EvidenceFile) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
}

// API Service Types
export interface EvidenceApiService {
  // Evidence Items
  getEvidenceItems(filters?: EvidenceSearchFilters): Promise<EvidenceSearchResult>;
  getEvidenceItem(id: string): Promise<EvidenceItem>;
  createEvidenceItem(data: CreateEvidenceItemRequest): Promise<EvidenceItem>;
  updateEvidenceItem(id: string, data: UpdateEvidenceItemRequest): Promise<EvidenceItem>;
  deleteEvidenceItem(id: string): Promise<void>;
  
  // Files
  uploadFile(data: EvidenceUploadRequest): Promise<EvidenceFile>;
  downloadFile(fileId: string): Promise<Blob>;
  deleteFile(fileId: string): Promise<void>;
  
  // Categories & Requirements
  getCategories(): Promise<EvidenceCategory[]>;
  getRequirements(): Promise<EvidenceRequirement[]>;
  
  // Analytics
  getEvidenceStats(): Promise<EvidenceStats>;
  getComplianceOverview(): Promise<ComplianceOverview[]>;
  
  // Bulk Operations
  bulkOperation(operation: BulkEvidenceOperation): Promise<BulkOperationResult>;
  
  // Export/Import
  exportEvidence(options: EvidenceExportOptions): Promise<Blob>;
  importEvidence(file: File): Promise<EvidenceImportResult>;
} 