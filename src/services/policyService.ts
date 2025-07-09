// POLICY SERVICE
// Extends evidence service for policy-specific functionality

import { evidenceService } from './evidenceService';
import {
  PolicyItem,
  PolicyStats,
  PolicySearchFilters,
  PolicySearchResult,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicyComment,
  PolicyType,
  PolicyCategory,
  ReviewFrequency
} from '../types/policy';
import {
  EvidenceItem,
  EvidenceSearchFilters,
  CreateEvidenceItemRequest,
  UpdateEvidenceItemRequest
} from '../types/evidence';

class PolicyService {
  // ============================================================================
  // POLICY CRUD OPERATIONS
  // ============================================================================

  async getPolicies(filters?: PolicySearchFilters): Promise<PolicySearchResult> {
    // Convert policy filters to evidence filters
    const evidenceFilters: EvidenceSearchFilters = {
      evidence_type: ['policy', 'procedure'],
      status: filters?.status,
      compliance_status: filters?.compliance_status,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
      expiring_soon: filters?.due_for_review,
      overdue: filters?.overdue
    };

    const result = await evidenceService.getEvidenceItems(evidenceFilters);
    
    console.log('=== POLICY SERVICE DEBUG ===');
    console.log('All evidence items from service:', result.items.length);
    console.log('Evidence types found:', result.items.map(item => item.evidence_type));
    
    // Filter and transform results for policy-specific data
    let policies = result.items
      .filter(item => 
        item.evidence_type === 'policy' || item.evidence_type === 'procedure'
      )
      .map(item => {
        // Transform evidence item to policy item by adding missing fields
        const policyItem: PolicyItem = {
          ...item,
          // Override evidence_type to match PolicyItem requirements
          evidence_type: item.evidence_type === 'procedure' ? 'procedure' : 'policy',
          // Map evidence_type to policy_type
          policy_type: item.evidence_type === 'procedure' ? 'procedure' : 'policy',
          // Add default values for missing required fields
          policy_category: (item as any).policy_category || 'other' as PolicyCategory,
          version: (item as any).version || '1.0',
          effective_date: item.evidence_date || item.created_at,
          review_frequency: (item as any).review_frequency || 'annually' as ReviewFrequency,
          next_review_date: item.next_review_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          // Optional fields
          approved_by: (item as any).approved_by,
          approval_date: (item as any).approval_date,
          supersedes: (item as any).supersedes,
          related_policies: (item as any).related_policies || [],
          training_required: (item as any).training_required || false,
          mandatory_reading: (item as any).mandatory_reading || false,
          distribution_list: (item as any).distribution_list || []
        };
        
        return policyItem;
      });
    
    console.log('Filtered policies count:', policies.length);
    console.log('Policy evidence types:', policies.map(p => p.evidence_type));
    console.log('Policy types mapped:', policies.map(p => p.policy_type));

    // Apply policy-specific filters
    if (filters?.policy_type?.length) {
      policies = policies.filter(p => 
        filters.policy_type!.includes(p.policy_type)
      );
    }

    if (filters?.policy_category?.length) {
      policies = policies.filter(p => 
        filters.policy_category!.includes(p.policy_category)
      );
    }

    if (filters?.search_term) {
      const searchTerm = filters.search_term.toLowerCase();
      policies = policies.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return {
      policies,
      total_count: policies.length,
      page: 1,
      page_size: 50,
      filters_applied: filters || {}
    };
  }

  async getPolicy(id: string): Promise<PolicyItem> {
    const evidence = await evidenceService.getEvidenceItem(id);
    
    if (evidence.evidence_type !== 'policy' && evidence.evidence_type !== 'procedure') {
      throw new Error('Item is not a policy or procedure');
    }

    return evidence as PolicyItem;
  }

  async createPolicy(data: CreatePolicyRequest): Promise<PolicyItem> {
    // Convert policy request to evidence request
    const evidenceRequest: CreateEvidenceItemRequest = {
      title: data.title,
      description: data.description,
      evidence_type: data.policy_type === 'procedure' ? 'procedure' : 'policy',
      evidence_date: data.effective_date,
      next_review_date: data.next_review_date,
      tags: data.tags,
      notes: data.notes,
      is_sensitive: data.is_sensitive
    };

    const evidence = await evidenceService.createEvidenceItem(evidenceRequest);
    return evidence as PolicyItem;
  }

  async updatePolicy(id: string, data: UpdatePolicyRequest): Promise<PolicyItem> {
    // Convert policy update to evidence update
    const evidenceUpdate: UpdateEvidenceItemRequest = {
      title: data.title,
      description: data.description,
      evidence_date: data.effective_date,
      next_review_date: data.next_review_date,
      status: data.status,
      compliance_status: data.compliance_status,
      tags: data.tags,
      notes: data.notes,
      is_sensitive: data.is_sensitive
    };

    const evidence = await evidenceService.updateEvidenceItem(id, evidenceUpdate);
    return evidence as PolicyItem;
  }

  async deletePolicy(id: string): Promise<void> {
    return evidenceService.deleteEvidenceItem(id);
  }

  // ============================================================================
  // POLICY-SPECIFIC OPERATIONS
  // ============================================================================

  async approvePolicy(id: string, approverComments?: string): Promise<PolicyItem> {
    const policy = await this.updatePolicy(id, {
      status: 'approved',
      compliance_status: 'compliant',
      approval_date: new Date().toISOString()
    });

    if (approverComments) {
      await this.addComment(id, approverComments, 'approval');
    }

    return policy;
  }

  async rejectPolicy(id: string, rejectionReason: string): Promise<PolicyItem> {
    const policy = await this.updatePolicy(id, {
      status: 'rejected',
      compliance_status: 'not_compliant'
    });

    await this.addComment(id, rejectionReason, 'rejection');
    return policy;
  }

  async addComment(id: string, comment: string, type: 'general' | 'review' | 'approval' | 'rejection' = 'general'): Promise<void> {
    // Use evidence service comment functionality
    await evidenceService.addComment(id, comment);
  }

  async downloadPolicy(id: string): Promise<Blob> {
    const policy = await this.getPolicy(id);
    
    if (!policy.files || policy.files.length === 0) {
      throw new Error('No files available for download');
    }

    // Download the first file (primary document)
    return evidenceService.downloadFile(policy.files[0].id);
  }

  // ============================================================================
  // ANALYTICS AND STATS
  // ============================================================================

  async getPolicyStats(): Promise<PolicyStats> {
    const evidenceStats = await evidenceService.getEvidenceStats();
    
    // Get all policies for detailed analysis
    const { policies } = await this.getPolicies();
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const stats: PolicyStats = {
      total_policies: policies.length,
      by_status: {
        pending: policies.filter(p => p.status === 'pending').length,
        submitted: policies.filter(p => p.status === 'submitted').length,
        approved: policies.filter(p => p.status === 'approved').length,
        rejected: policies.filter(p => p.status === 'rejected').length,
        expired: policies.filter(p => p.status === 'expired').length,
        under_review: policies.filter(p => p.status === 'under_review').length
      },
      by_compliance: {
        compliant: policies.filter(p => p.compliance_status === 'compliant').length,
        partially_compliant: policies.filter(p => p.compliance_status === 'partially_compliant').length,
        not_compliant: policies.filter(p => p.compliance_status === 'not_compliant').length,
        not_applicable: policies.filter(p => p.compliance_status === 'not_applicable').length
      },
      by_type: {
        policy: policies.filter(p => p.policy_type === 'policy').length,
        procedure: policies.filter(p => p.policy_type === 'procedure').length,
        sop: policies.filter(p => p.policy_type === 'sop').length,
        guideline: policies.filter(p => p.policy_type === 'guideline').length,
        protocol: policies.filter(p => p.policy_type === 'protocol').length,
        standard: policies.filter(p => p.policy_type === 'standard').length
      },
      by_category: {
        clinical_governance: policies.filter(p => p.policy_category === 'clinical_governance').length,
        safeguarding: policies.filter(p => p.policy_category === 'safeguarding').length,
        infection_control: policies.filter(p => p.policy_category === 'infection_control').length,
        health_safety: policies.filter(p => p.policy_category === 'health_safety').length,
        data_protection: policies.filter(p => p.policy_category === 'data_protection').length,
        hr_policies: policies.filter(p => p.policy_category === 'hr_policies').length,
        quality_assurance: policies.filter(p => p.policy_category === 'quality_assurance').length,
        emergency_procedures: policies.filter(p => p.policy_category === 'emergency_procedures').length,
        medication_management: policies.filter(p => p.policy_category === 'medication_management').length,
        patient_care: policies.filter(p => p.policy_category === 'patient_care').length,
        staff_training: policies.filter(p => p.policy_category === 'staff_training').length,
        other: policies.filter(p => p.policy_category === 'other').length
      },
      due_for_review: policies.filter(p => 
        p.next_review_date && 
        new Date(p.next_review_date) <= thirtyDaysFromNow &&
        new Date(p.next_review_date) >= today
      ).length,
      overdue_reviews: policies.filter(p => 
        p.next_review_date && 
        new Date(p.next_review_date) < today
      ).length,
      pending_approvals: policies.filter(p => 
        p.status === 'submitted' || p.status === 'under_review'
      ).length,
      recently_updated: policies.filter(p => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return new Date(p.updated_at) >= thirtyDaysAgo;
      }).length
    };

    return stats;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  getPolicyTypeLabel(type: PolicyType): string {
    const labels: Record<PolicyType, string> = {
      policy: 'Policy',
      procedure: 'Procedure',
      sop: 'Standard Operating Procedure',
      guideline: 'Guideline',
      protocol: 'Protocol',
      standard: 'Standard'
    };
    return labels[type];
  }

  getPolicyCategoryLabel(category: PolicyCategory): string {
    const labels: Record<PolicyCategory, string> = {
      clinical_governance: 'Clinical Governance',
      safeguarding: 'Safeguarding',
      infection_control: 'Infection Control',
      health_safety: 'Health & Safety',
      data_protection: 'Data Protection',
      hr_policies: 'HR Policies',
      quality_assurance: 'Quality Assurance',
      emergency_procedures: 'Emergency Procedures',
      medication_management: 'Medication Management',
      patient_care: 'Patient Care',
      staff_training: 'Staff Training',
      other: 'Other'
    };
    return labels[category];
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getComplianceColor(status: string): string {
    const colors: Record<string, string> = {
      compliant: 'bg-green-100 text-green-800',
      partially_compliant: 'bg-yellow-100 text-yellow-800',
      not_compliant: 'bg-red-100 text-red-800',
      not_applicable: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}

export const policyService = new PolicyService(); 