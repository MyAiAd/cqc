import React from 'react';
import { X, FileText, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { EvidenceItem } from '../../types/evidence';

interface EvidenceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem;
}

export const EvidenceViewModal: React.FC<EvidenceViewModalProps> = ({
  isOpen,
  onClose,
  evidence
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (status: string): string => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partially_compliant': return 'text-yellow-600 bg-yellow-100';
      case 'not_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Evidence Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{evidence.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900 capitalize">{evidence.evidence_type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evidence.status)}`}>
                  {evidence.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceColor(evidence.compliance_status)}`}>
                  {evidence.compliance_status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {evidence.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{evidence.description}</p>
            </div>
          )}

          {/* Category and Requirement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">{evidence.category.name}</p>
              </div>
            )}
            {evidence.requirement && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CQC Requirement</label>
                <p className="text-gray-900">{evidence.requirement.regulation_id} - {evidence.requirement.title}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evidence.evidence_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Date</label>
                  <p className="text-gray-900">{new Date(evidence.evidence_date).toLocaleDateString()}</p>
                </div>
              )}
              {evidence.expiry_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <p className="text-gray-900">{new Date(evidence.expiry_date).toLocaleDateString()}</p>
                </div>
              )}
              {evidence.next_review_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Review</label>
                  <p className="text-gray-900">{new Date(evidence.next_review_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Files */}
          {evidence.files && evidence.files.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attached Files</h3>
              <div className="space-y-2">
                {evidence.files.map((file) => (
                  <div key={file.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                        {file.is_primary && <span className="ml-2 text-blue-600">(Primary)</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {evidence.tags && evidence.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {evidence.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {evidence.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{evidence.notes}</p>
            </div>
          )}

          {/* Sensitive Data Warning */}
          {evidence.is_sensitive && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 text-sm">This evidence contains sensitive information</span>
            </div>
          )}

          {/* Comments */}
          {evidence.comments && evidence.comments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
              <div className="space-y-3">
                {evidence.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.created_by_user?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800 mt-2">
                      {comment.comment_type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 