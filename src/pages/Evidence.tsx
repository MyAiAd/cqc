import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
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
  MoreHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { EvidenceUploadModal } from '../components/evidence/EvidenceUploadModal';
import { EvidenceViewModal } from '../components/evidence/EvidenceViewModal';
import { EvidenceCommentModal } from '../components/evidence/EvidenceCommentModal';
import { useAuth } from '../contexts/AuthContext';
import { evidenceService } from '../services/evidenceService';
import { 
  EvidenceItem, 
  EvidenceStats, 
  EvidenceSearchFilters,
  EvidenceStatus,
  ComplianceStatus,
  EvidenceType,
  Priority
} from '../types/evidence';

export const Evidence: React.FC = () => {
  const { userProfile } = useAuth();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EvidenceSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  
  // New modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Starting to load evidence data...');
        setLoading(true);
        
        // Initialize evidence data for practice if needed
        // await evidenceService.initializePracticeEvidence();
        
        console.log('Loading evidence items and stats...');
        // Load evidence items and stats
        const [itemsResult, statsResult] = await Promise.all([
          evidenceService.getEvidenceItems({}),
          evidenceService.getEvidenceStats()
        ]);
        
        console.log('Evidence items loaded:', itemsResult.items.length);
        console.log('Stats loaded:', statsResult);
        
        setEvidenceItems(itemsResult.items);
        setStats(statsResult);
      } catch (error) {
        console.error('Error loading evidence data:', error);
        // Set empty data to prevent infinite loading
        setEvidenceItems([]);
        setStats({
          total_items: 0,
          by_status: { pending: 0, submitted: 0, approved: 0, rejected: 0, expired: 0, under_review: 0 },
          by_compliance: { compliant: 0, partially_compliant: 0, not_compliant: 0, not_applicable: 0 },
          by_type: { document: 0, policy: 0, procedure: 0, training_record: 0, audit_report: 0, certificate: 0, photo: 0, video: 0, other: 0 },
          expiring_soon: 0,
          overdue_reviews: 0,
          pending_approvals: 0
        });
      } finally {
        console.log('Finished loading evidence data');
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - runs only once on mount

  const loadData = useCallback(async () => {
    try {
      console.log('Starting to load evidence data...');
      setLoading(true);
      
      // Initialize evidence data for practice if needed
      // await evidenceService.initializePracticeEvidence();
      
      console.log('Loading evidence items and stats...');
      // Load evidence items and stats
      const [itemsResult, statsResult] = await Promise.all([
        evidenceService.getEvidenceItems(filters),
        evidenceService.getEvidenceStats()
      ]);
      
      console.log('Evidence items loaded:', itemsResult.items.length);
      console.log('Stats loaded:', statsResult);
      
      setEvidenceItems(itemsResult.items);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading evidence data:', error);
      // Set empty data to prevent infinite loading
      setEvidenceItems([]);
      setStats({
        total_items: 0,
        by_status: { pending: 0, submitted: 0, approved: 0, rejected: 0, expired: 0, under_review: 0 },
        by_compliance: { compliant: 0, partially_compliant: 0, not_compliant: 0, not_applicable: 0 },
        by_type: { document: 0, policy: 0, procedure: 0, training_record: 0, audit_report: 0, certificate: 0, photo: 0, video: 0, other: 0 },
        expiring_soon: 0,
        overdue_reviews: 0,
        pending_approvals: 0
      });
    } finally {
      console.log('Finished loading evidence data');
      setLoading(false);
    }
  }, []);

  // Create a separate refresh function for manual refreshes
  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing evidence data...');
      setLoading(true);
      
      const [itemsResult, statsResult] = await Promise.all([
        evidenceService.getEvidenceItems(filters),
        evidenceService.getEvidenceStats()
      ]);
      
      setEvidenceItems(itemsResult.items);
      setStats(statsResult);
    } catch (error) {
      console.error('Error refreshing evidence data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Move filter handling to a callback instead of useEffect to prevent tab-switching reloads
  const loadFilteredData = useCallback(async () => {
    try {
      console.log('Loading filtered data with filters:', filters);
      setLoading(true);
      
      const [itemsResult, statsResult] = await Promise.all([
        evidenceService.getEvidenceItems(filters),
        evidenceService.getEvidenceStats()
      ]);
      
      setEvidenceItems(itemsResult.items);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading filtered data:', error);
      setEvidenceItems([]);
      setStats({
        total_items: 0,
        by_status: { pending: 0, submitted: 0, approved: 0, rejected: 0, expired: 0, under_review: 0 },
        by_compliance: { compliant: 0, partially_compliant: 0, not_compliant: 0, not_applicable: 0 },
        by_type: { document: 0, policy: 0, procedure: 0, training_record: 0, audit_report: 0, certificate: 0, photo: 0, video: 0, other: 0 },
        expiring_soon: 0,
        overdue_reviews: 0,
        pending_approvals: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implement search logic here
  };

  const handleFilterChange = (newFilters: Partial<EvidenceSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleStatusUpdate = async (itemId: string, status: EvidenceStatus) => {
    try {
      await evidenceService.updateEvidenceItem(itemId, { status });
      refreshData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await evidenceService.bulkOperation({
        operation: 'approve',
        evidence_item_ids: selectedItems,
        parameters: {}
      });
      
      setSelectedItems([]);
      refreshData();
    } catch (error) {
      console.error('Error approving items:', error);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await evidenceService.bulkOperation({
        operation: 'reject',
        evidence_item_ids: selectedItems,
        parameters: {}
      });
      
      setSelectedItems([]);
      refreshData();
    } catch (error) {
      console.error('Error rejecting items:', error);
    }
  };

  // New action handlers
  const handleView = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setShowEditModal(true);
  };

  const handleDownload = async (item: EvidenceItem) => {
    if (!item.files || item.files.length === 0) return;
    
    try {
      // Download the primary file or first file
      const primaryFile = item.files.find(f => f.is_primary) || item.files[0];
      const blob = await evidenceService.downloadFile(primaryFile.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = primaryFile.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleComment = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setShowCommentModal(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      console.log('Attempting to delete evidence item:', itemToDelete);
      await evidenceService.deleteEvidenceItem(itemToDelete);
      console.log('Evidence item deleted successfully');
      setItemToDelete(null);
      setShowDeleteConfirm(false);
      refreshData();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Full error details:', errorMessage);
      alert(`Failed to delete evidence item: ${errorMessage}`);
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
      prev.length === evidenceItems.length 
        ? []
        : evidenceItems.map(item => item.id)
    );
  };

  const getStatusColor = (status: EvidenceStatus): string => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (status: ComplianceStatus): string => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partially_compliant': return 'text-yellow-600 bg-yellow-100';
      case 'not_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-error-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-primary-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-success-600" />;
      default: return <Clock className="h-4 w-4 text-neutral-600" />;
    }
  };

  if (loading && !evidenceItems.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-neutral-600">Loading evidence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-neutral-900">Evidence Management</h1>
            {userProfile?.role === 'super_admin' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Global Access
              </span>
            )}
          </div>
          <p className="text-neutral-600">
            {userProfile?.role === 'super_admin' 
              ? 'Manage evidence across all practices with global administrative access'
              : 'Track and manage compliance evidence for your practice'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {/* Implement export */}}
          >
            Export
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowUploadModal(true)}
          >
            Add Evidence
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Evidence</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.total_items}</p>
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
                  <p className="text-2xl font-bold text-warning-600">{stats.pending_approvals}</p>
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
                  <p className="text-2xl font-bold text-error-600">{stats.expiring_soon}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-error-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Overdue Reviews</p>
                  <p className="text-2xl font-bold text-error-600">{stats.overdue_reviews}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-error-600" />
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
                  placeholder="Search evidence..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select
                    multiple
                    className="w-full border border-neutral-300 rounded-md px-3 py-2"
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as EvidenceStatus[];
                      handleFilterChange({ status: values });
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Evidence Type</label>
                  <select
                    multiple
                    className="w-full border border-neutral-300 rounded-md px-3 py-2"
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as EvidenceType[];
                      handleFilterChange({ evidence_type: values });
                    }}
                  >
                    <option value="document">Document</option>
                    <option value="policy">Policy</option>
                    <option value="procedure">Procedure</option>
                    <option value="training_record">Training Record</option>
                    <option value="audit_report">Audit Report</option>
                    <option value="certificate">Certificate</option>
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Quick Filters</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={(e) => handleFilterChange({ expiring_soon: e.target.checked })}
                      />
                      <span className="text-sm">Expiring Soon</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={(e) => handleFilterChange({ overdue: e.target.checked })}
                      />
                      <span className="text-sm">Overdue Reviews</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkApprove}
                >
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkReject}
                >
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === evidenceItems.length && evidenceItems.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Compliance</TableHeaderCell>
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evidenceItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-neutral-900">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-neutral-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">
                      {item.evidence_type.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceColor(item.compliance_status)}`}>
                      {item.compliance_status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {item.requirement && getPriorityIcon(item.requirement.priority)}
                      <span className="ml-1 text-sm capitalize">
                        {item.requirement?.priority || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.next_review_date ? (
                      <span className={`text-sm ${
                        new Date(item.next_review_date) < new Date() 
                          ? 'text-error-600 font-medium' 
                          : 'text-neutral-600'
                      }`}>
                        {new Date(item.next_review_date).toLocaleDateString()}
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
                        onClick={() => handleView(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {item.files && item.files.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComment(item)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {evidenceItems.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No evidence found</h3>
              <p className="text-neutral-600 mb-4">
                Get started by adding your first piece of evidence.
              </p>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowUploadModal(true)}
              >
                Add Evidence
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
      />

      {/* View Modal */}
      {showViewModal && selectedEvidence && (
        <EvidenceViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          evidence={selectedEvidence}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvidence && (
        <EvidenceUploadModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            refreshData();
            setShowEditModal(false);
          }}
          initialData={selectedEvidence}
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedEvidence && (
        <EvidenceCommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          evidence={selectedEvidence}
          onSuccess={() => {
            refreshData();
            setShowCommentModal(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-neutral-600 mb-4">
              Are you sure you want to delete this evidence item?
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteConfirm}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setItemToDelete(null);
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 