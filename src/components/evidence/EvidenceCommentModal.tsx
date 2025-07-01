import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';
import { EvidenceItem } from '../../types/evidence';

interface EvidenceCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem;
  onSuccess: () => void;
}

export const EvidenceCommentModal: React.FC<EvidenceCommentModalProps> = ({
  isOpen,
  onClose,
  evidence,
  onSuccess
}) => {
  const [comment, setComment] = useState('');
  const [commentType, setCommentType] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Comment is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await evidenceService.addComment(evidence.id, comment.trim(), commentType);
      setComment('');
      setCommentType('general');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const commentTypes = [
    { value: 'general', label: 'General Comment' },
    { value: 'approval', label: 'Approval' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'request_changes', label: 'Request Changes' },
    { value: 'internal_note', label: 'Internal Note' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Add Comment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Evidence Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">{evidence.title}</h3>
          <p className="text-sm text-gray-600 capitalize">
            {evidence.evidence_type.replace('_', ' ')} • {evidence.status.replace('_', ' ')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Comment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment Type
            </label>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {commentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Comment Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your comment..."
              required
            />
          </div>

          {/* Existing Comments */}
          {evidence.comments && evidence.comments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Comments</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {evidence.comments.slice(-3).map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900">
                        {comment.created_by_user?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{comment.comment}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800 mt-1">
                      {comment.comment_type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {evidence.comments.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {evidence.comments.length - 3} more comments
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 