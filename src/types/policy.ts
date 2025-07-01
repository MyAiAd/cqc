// POLICY MANAGEMENT TYPES
// Extends evidence system for policy-specific functionality

import { EvidenceItem, EvidenceStatus, ComplianceStatus } from './evidence';

export type PolicyType = 
  | 'policy' 
  | 'procedure' 
  | 'sop' 
  | 'guideline' 
  | 'protocol' 
  | 'standard';

export type PolicyCategory = 
  | 'clinical_governance' 
  | 'safeguarding' 
  | 'infection_control' 
  | 'health_safety' 
  | 'data_protection' 
  | 'hr_policies' 
  | 'quality_assurance' 
  | 'emergency_procedures' 
  | 'medication_management' 
  | 'patient_care' 
  | 'staff_training' 
  | 'other';

export type ReviewFrequency = 
  | 'monthly' 
  | 'quarterly' 
  | 'biannually' 
  | 'annually' 
  | 'as_needed';

export interface PolicyItem extends EvidenceItem {
  evidence_type: 'policy' | 'procedure';
  policy_type: PolicyType;
  policy_category: PolicyCategory;
  version: string;
  effective_date: string;
  review_frequency: ReviewFrequency;
  next_review_date: string;
  approved_by?: string;
  approval_date?: string;
  supersedes?: string; // ID of previous version
  related_policies?: string[]; // IDs of related policies
  training_required?: boolean;
  mandatory_reading?: boolean;
  distribution_list?: string[]; // User IDs who need access
}

export interface PolicyStats {
  total_policies: number;
  by_status: Record<EvidenceStatus, number>;
  by_compliance: Record<ComplianceStatus, number>;
  by_type: Record<PolicyType, number>;
  by_category: Record<PolicyCategory, number>;
  due_for_review: number; // Next 30 days
  overdue_reviews: number;
  pending_approvals: number;
  recently_updated: number; // Last 30 days
}

export interface PolicySearchFilters {
  status?: EvidenceStatus[];
  compliance_status?: ComplianceStatus[];
  policy_type?: PolicyType[];
  policy_category?: PolicyCategory[];
  review_frequency?: ReviewFrequency[];
  due_for_review?: boolean;
  overdue?: boolean;
  approved_by?: string;
  date_from?: string;
  date_to?: string;
  search_term?: string;
}

export interface PolicySearchResult {
  policies: PolicyItem[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: PolicySearchFilters;
}

export interface CreatePolicyRequest {
  title: string;
  description?: string;
  policy_type: PolicyType;
  policy_category: PolicyCategory;
  version: string;
  effective_date: string;
  review_frequency: ReviewFrequency;
  next_review_date: string;
  training_required?: boolean;
  mandatory_reading?: boolean;
  tags?: string[];
  notes?: string;
  is_sensitive?: boolean;
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {
  status?: EvidenceStatus;
  compliance_status?: ComplianceStatus;
  approved_by?: string;
  approval_date?: string;
}

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version: string;
  effective_date: string;
  created_by: string;
  created_at: string;
  changes_summary?: string;
  superseded_at?: string;
}

export interface PolicyDistribution {
  id: string;
  policy_id: string;
  user_id: string;
  distributed_at: string;
  acknowledged_at?: string;
  training_completed_at?: string;
  is_mandatory: boolean;
}

export interface PolicyComment {
  id: string;
  policy_id: string;
  user_id: string;
  comment: string;
  comment_type: 'general' | 'review' | 'approval' | 'rejection';
  created_at: string;
  user_name?: string;
}

export interface PolicyApprovalWorkflow {
  id: string;
  policy_id: string;
  approver_id: string;
  approval_step: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  approver_name?: string;
} 