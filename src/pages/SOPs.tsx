import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  XCircle,
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { EvidenceUploadModal } from '../components/evidence/EvidenceUploadModal';
import { EvidenceViewModal } from '../components/evidence/EvidenceViewModal';
import { EvidenceCommentModal } from '../components/evidence/EvidenceCommentModal';
import { useAuth } from '../contexts/AuthContext';
import { policyService } from '../services/policyService';
import { evidenceService } from '../services/evidenceService';
import { 
  PolicyItem, 
  PolicyStats, 
  PolicySearchFilters,
  PolicyType,
  PolicyCategory
} from '../types/policy';
import {
  EvidenceStatus,
  ComplianceStatus
} from '../types/evidence';

export const SOPs: React.FC = () => {
  const { userProfile } = useAuth();
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PolicySearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [unsortedPolicies, setUnsortedPolicies] = useState<PolicyItem[]>([]);

  // Sorting function
  const sortPolicies = useCallback((policiesToSort: PolicyItem[], column: string, direction: 'asc' | 'desc') => {
    return [...policiesToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'policy_category':
          aValue = a.policy_category;
          bValue = b.policy_category;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'compliance_status':
          aValue = a.compliance_status;
          bValue = b.compliance_status;
          break;
        case 'version':
          aValue = a.version || 'v1.0';
          bValue = b.version || 'v1.0';
          break;
        case 'next_review_date':
          aValue = a.next_review_date ? new Date(a.next_review_date) : new Date(0);
          bValue = b.next_review_date ? new Date(b.next_review_date) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Handle sort
  const handleSort = (column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sortColumn === column) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortColumn(column);
    setSortDirection(newDirection);
  };

  // Apply sorting whenever data or sort criteria changes
  useEffect(() => {
    if (sortColumn) {
      const sortedPolicies = sortPolicies(unsortedPolicies, sortColumn, sortDirection);
      setPolicies(sortedPolicies);
    } else {
      setPolicies(unsortedPolicies);
    }
  }, [unsortedPolicies, sortColumn, sortDirection, sortPolicies]);

  // Sort indicator component
  const SortIndicator: React.FC<{ column: string }> = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <div className="flex flex-col ml-1">
          <ChevronUp className="h-3 w-3 text-gray-400" />
          <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    
    return (
      <div className="ml-1">
        {sortDirection === 'asc' ? (
          <ChevronUp className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronDown className="h-3 w-3 text-gray-600" />
        )}
      </div>
    );
  };

  // Sortable header component
  const SortableHeader: React.FC<{ column: string; children: React.ReactNode }> = ({ column, children }) => {
    return (
      <TableHeaderCell>
        <button
          onClick={() => handleSort(column)}
          className="flex items-center justify-between w-full text-left hover:bg-gray-50 px-2 py-1 rounded transition-colors"
        >
          <span>{children}</span>
          <SortIndicator column={column} />
        </button>
      </TableHeaderCell>
    );
  };

  // Calculate stats from filtered SOP items
  const calculateSOPStats = useCallback((sopItems: PolicyItem[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Debug: Log actual status values
    console.log('=== SOP STATS DEBUG ===');
    console.log('Total SOP items:', sopItems.length);
    console.log('SOP statuses:', sopItems.map(p => ({ id: p.id, title: p.title, status: p.status })));
    console.log('SOP compliance statuses:', sopItems.map(p => ({ id: p.id, title: p.title, compliance_status: p.compliance_status })));

    const stats = {
      total_policies: sopItems.length,
      by_status: {
        pending: sopItems.filter(p => p.status === 'pending').length,
        submitted: sopItems.filter(p => p.status === 'submitted').length,
        approved: sopItems.filter(p => p.status === 'approved').length,
        rejected: sopItems.filter(p => p.status === 'rejected').length,
        expired: sopItems.filter(p => p.status === 'expired').length,
        under_review: sopItems.filter(p => p.status === 'under_review').length
      },
      by_compliance: {
        compliant: sopItems.filter(p => p.compliance_status === 'compliant').length,
        partially_compliant: sopItems.filter(p => p.compliance_status === 'partially_compliant').length,
        not_compliant: sopItems.filter(p => p.compliance_status === 'not_compliant').length,
        not_applicable: sopItems.filter(p => p.compliance_status === 'not_applicable').length
      },
      by_type: {
        policy: 0,
        procedure: 0,
        sop: sopItems.length, // All items are SOPs
        guideline: 0,
        protocol: 0,
        standard: 0
      },
      by_category: {
        clinical_governance: sopItems.filter(p => p.policy_category === 'clinical_governance').length,
        safeguarding: sopItems.filter(p => p.policy_category === 'safeguarding').length,
        infection_control: sopItems.filter(p => p.policy_category === 'infection_control').length,
        health_safety: sopItems.filter(p => p.policy_category === 'health_safety').length,
        data_protection: sopItems.filter(p => p.policy_category === 'data_protection').length,
        hr_policies: sopItems.filter(p => p.policy_category === 'hr_policies').length,
        quality_assurance: sopItems.filter(p => p.policy_category === 'quality_assurance').length,
        emergency_procedures: sopItems.filter(p => p.policy_category === 'emergency_procedures').length,
        medication_management: sopItems.filter(p => p.policy_category === 'medication_management').length,
        patient_care: sopItems.filter(p => p.policy_category === 'patient_care').length,
        staff_training: sopItems.filter(p => p.policy_category === 'staff_training').length,
        other: sopItems.filter(p => p.policy_category === 'other').length
      },
      due_for_review: sopItems.filter(p => 
        p.next_review_date && 
        new Date(p.next_review_date) <= thirtyDaysFromNow &&
        new Date(p.next_review_date) >= today
      ).length,
      overdue_reviews: sopItems.filter(p => 
        p.next_review_date && 
        new Date(p.next_review_date) < today
      ).length,
      pending_approvals: sopItems.filter(p => 
        p.status === 'pending' || p.status === 'submitted' || p.status === 'under_review'
      ).length,
      recently_updated: sopItems.filter(p => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return new Date(p.updated_at) >= thirtyDaysAgo;
      }).length
    };

    console.log('=== SOP STATS CALCULATED ===');
    console.log('Pending approvals calculation:', {
      pending: sopItems.filter(p => p.status === 'pending').length,
      submitted: sopItems.filter(p => p.status === 'submitted').length,
      under_review: sopItems.filter(p => p.status === 'under_review').length,
      total_pending_approvals: stats.pending_approvals
    });

    return stats;
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Filter to get evidence with SOP-related evidence types or specific policy types
        const sopFilters = {
          // Use evidence_type filtering instead of policy_type since there's no 'sop' evidence type
          evidence_type: ['document', 'procedure'] as any[]
        };
        
        const evidenceResult = await evidenceService.getEvidenceItems(sopFilters);
        
        // Filter for items that are tagged as SOPs or have SOP in title/description
        const sopItems = evidenceResult.items.filter(item => 
          item.title.toLowerCase().includes('sop') || 
          item.title.toLowerCase().includes('standard operating') ||
          item.description?.toLowerCase().includes('sop') ||
          item.description?.toLowerCase().includes('standard operating') ||
          item.tags?.some(tag => tag.toLowerCase().includes('sop'))
        ).map(item => ({
          ...item,
          // Map to policy item format
          evidence_type: (item.evidence_type === 'procedure' ? 'procedure' : 'policy') as 'policy' | 'procedure',
          policy_type: 'sop' as PolicyType,
          policy_category: ((item as any).policy_category || 'other') as PolicyCategory,
          version: (item as any).version || '1.0',
          effective_date: item.evidence_date || item.created_at,
          review_frequency: ((item as any).review_frequency || 'annually') as any,
          next_review_date: item.next_review_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          approved_by: (item as any).approved_by,
          approval_date: (item as any).approval_date,
          supersedes: (item as any).supersedes,
          related_policies: (item as any).related_policies || [],
          training_required: (item as any).training_required || false,
          mandatory_reading: (item as any).mandatory_reading || false,
          distribution_list: (item as any).distribution_list || []
        }));
        
        setUnsortedPolicies(sopItems as PolicyItem[]);
        setStats(calculateSOPStats(sopItems as PolicyItem[]));
      } catch (error) {
        console.error('Error loading SOP data:', error);
        setUnsortedPolicies([]);
        setStats({
          total_policies: 0,
          by_status: { pending: 0, submitted: 0, approved: 0, rejected: 0, expired: 0, under_review: 0 },
          by_compliance: { compliant: 0, partially_compliant: 0, not_compliant: 0, not_applicable: 0 },
          by_type: { policy: 0, procedure: 0, sop: 0, guideline: 0, protocol: 0, standard: 0 },
          by_category: { 
            clinical_governance: 0, safeguarding: 0, infection_control: 0, health_safety: 0,
            data_protection: 0, hr_policies: 0, quality_assurance: 0, emergency_procedures: 0,
            medication_management: 0, patient_care: 0, staff_training: 0, other: 0
          },
          due_for_review: 0,
          overdue_reviews: 0,
          pending_approvals: 0,
          recently_updated: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use evidence_type filtering for SOPs
      const combinedFilters = {
        ...filters,
        evidence_type: ['document', 'procedure'] as any[]
      };
      
      const evidenceResult = await evidenceService.getEvidenceItems(combinedFilters);
      
      // Filter for items that are tagged as SOPs or have SOP in title/description
      const sopItems = evidenceResult.items.filter(item => 
        item.title.toLowerCase().includes('sop') || 
        item.title.toLowerCase().includes('standard operating') ||
        item.description?.toLowerCase().includes('sop') ||
        item.description?.toLowerCase().includes('standard operating') ||
        item.tags?.some(tag => tag.toLowerCase().includes('sop'))
      ).map(item => ({
        ...item,
        // Map to policy item format
        evidence_type: (item.evidence_type === 'procedure' ? 'procedure' : 'policy') as 'policy' | 'procedure',
        policy_type: 'sop' as PolicyType,
        policy_category: ((item as any).policy_category || 'other') as PolicyCategory,
        version: (item as any).version || '1.0',
        effective_date: item.evidence_date || item.created_at,
        review_frequency: ((item as any).review_frequency || 'annually') as any,
        next_review_date: item.next_review_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        approved_by: (item as any).approved_by,
        approval_date: (item as any).approval_date,
        supersedes: (item as any).supersedes,
        related_policies: (item as any).related_policies || [],
        training_required: (item as any).training_required || false,
        mandatory_reading: (item as any).mandatory_reading || false,
        distribution_list: (item as any).distribution_list || []
      }));
      
      setUnsortedPolicies(sopItems as PolicyItem[]);
      setStats(calculateSOPStats(sopItems as PolicyItem[]));
    } catch (error) {
      console.error('Error loading SOP data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, calculateSOPStats]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use evidence_type filtering for SOPs
      const combinedFilters = {
        ...filters,
        evidence_type: ['document', 'procedure'] as any[]
      };
      
      const evidenceResult = await evidenceService.getEvidenceItems(combinedFilters);
      
      // Filter for items that are tagged as SOPs or have SOP in title/description
      const sopItems = evidenceResult.items.filter(item => 
        item.title.toLowerCase().includes('sop') || 
        item.title.toLowerCase().includes('standard operating') ||
        item.description?.toLowerCase().includes('sop') ||
        item.description?.toLowerCase().includes('standard operating') ||
        item.tags?.some(tag => tag.toLowerCase().includes('sop'))
      ).map(item => ({
        ...item,
        // Map to policy item format
        evidence_type: (item.evidence_type === 'procedure' ? 'procedure' : 'policy') as 'policy' | 'procedure',
        policy_type: 'sop' as PolicyType,
        policy_category: ((item as any).policy_category || 'other') as PolicyCategory,
        version: (item as any).version || '1.0',
        effective_date: item.evidence_date || item.created_at,
        review_frequency: ((item as any).review_frequency || 'annually') as any,
        next_review_date: item.next_review_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        approved_by: (item as any).approved_by,
        approval_date: (item as any).approval_date,
        supersedes: (item as any).supersedes,
        related_policies: (item as any).related_policies || [],
        training_required: (item as any).training_required || false,
        mandatory_reading: (item as any).mandatory_reading || false,
        distribution_list: (item as any).distribution_list || []
      }));
      
      setUnsortedPolicies(sopItems as PolicyItem[]);
      setStats(calculateSOPStats(sopItems as PolicyItem[]));
    } catch (error) {
      console.error('Error refreshing SOP data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, calculateSOPStats]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      refreshData();
    }
  }, [filters, refreshData]);

  const handleView = (item: PolicyItem) => {
    setSelectedPolicy(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: PolicyItem) => {
    setSelectedPolicy(item);
    setShowEditModal(true);
  };

  const handleDownload = async (item: PolicyItem) => {
    try {
      const blob = await policyService.downloadPolicy(item.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SOP:', error);
      alert('Error downloading SOP. Please try again.');
    }
  };

  const handleComment = (item: PolicyItem) => {
    setSelectedPolicy(item);
    setShowCommentModal(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      await policyService.deletePolicy(itemToDelete);
      refreshData();
    } catch (error) {
      console.error('Error deleting SOP:', error);
      alert('Error deleting SOP. Please try again.');
    } finally {
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === policies.length ? [] : policies.map(p => p.id)
    );
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search_term: term }));
  };

  const handleFilterChange = (newFilters: Partial<PolicySearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getStatusIcon = (status: EvidenceStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Standard Operating Procedures</h1>
          <p className="text-neutral-600 mt-1">
            Manage standard operating procedures (SOPs) and operational guidelines
          </p>
        </div>
        <Button 
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowUploadModal(true)}
        >
          Add New SOP
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total SOPs</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.by_type.sop || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.pending_approvals}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Due for Review</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.due_for_review}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Overdue Reviews</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.overdue_reviews}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search SOPs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                    onChange={(e) => handleFilterChange({ 
                      status: e.target.value ? [e.target.value as EvidenceStatus] : undefined 
                    })}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                    onChange={(e) => handleFilterChange({ 
                      policy_category: e.target.value ? [e.target.value as PolicyCategory] : undefined 
                    })}
                  >
                    <option value="">All Categories</option>
                    <option value="clinical_governance">Clinical Governance</option>
                    <option value="safeguarding">Safeguarding</option>
                    <option value="infection_control">Infection Control</option>
                    <option value="health_safety">Health & Safety</option>
                    <option value="data_protection">Data Protection</option>
                    <option value="hr_policies">HR Policies</option>
                    <option value="quality_assurance">Quality Assurance</option>
                    <option value="emergency_procedures">Emergency Procedures</option>
                    <option value="medication_management">Medication Management</option>
                    <option value="patient_care">Patient Care</option>
                    <option value="staff_training">Staff Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOPs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === policies.length && policies.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-neutral-300"
                  />
                </TableHeaderCell>
                <SortableHeader column="title">SOP</SortableHeader>
                <SortableHeader column="policy_category">Category</SortableHeader>
                <SortableHeader column="status">Status</SortableHeader>
                <SortableHeader column="compliance_status">Compliance</SortableHeader>
                <SortableHeader column="version">Version</SortableHeader>
                <SortableHeader column="next_review_date">Next Review</SortableHeader>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(policy.id)}
                      onChange={() => toggleItemSelection(policy.id)}
                      className="rounded border-neutral-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <div className="ml-3">
                        <div className="font-medium text-neutral-900">{policy.title}</div>
                        {policy.description && (
                          <div className="text-sm text-neutral-500 truncate max-w-xs">
                            {policy.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {policyService.getPolicyCategoryLabel(policy.policy_category)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(policy.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policyService.getStatusColor(policy.status)}`}>
                        {policy.status.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policyService.getComplianceColor(policy.compliance_status)}`}>
                      {policy.compliance_status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {policy.version || 'v1.0'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {policy.next_review_date ? (
                      <span className={`text-sm ${
                        new Date(policy.next_review_date) < new Date() 
                          ? 'text-error-600 font-medium' 
                          : 'text-neutral-600'
                      }`}>
                        {new Date(policy.next_review_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(policy)}
                        title="View SOP"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(policy)}
                        title="Edit SOP"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {policy.files && policy.files.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(policy)}
                          title="Download SOP"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComment(policy)}
                        title="Add Comment"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(policy.id)}
                        title="Delete SOP"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {policies.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No SOPs found</h3>
              <p className="text-neutral-600 mb-4">
                Get started by adding your first standard operating procedure.
              </p>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowUploadModal(true)}
              >
                Add SOP
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <EvidenceUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          refreshData();
          setShowUploadModal(false);
        }}
        defaultEvidenceType="document"
      />

      {/* View Modal */}
      {showViewModal && selectedPolicy && (
        <EvidenceViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          evidence={selectedPolicy}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPolicy && (
        <EvidenceUploadModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            refreshData();
            setShowEditModal(false);
          }}
          initialData={selectedPolicy}
          defaultEvidenceType="document"
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedPolicy && (
        <EvidenceCommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          evidence={selectedPolicy}
          onSuccess={() => {
            refreshData();
            setShowCommentModal(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete this SOP? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setItemToDelete(null);
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 