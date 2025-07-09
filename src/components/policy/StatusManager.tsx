import React, { useState } from 'react';
import { ChevronDown, Check, X, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { EvidenceStatus } from '../../types/evidence';

interface StatusOption {
  value: EvidenceStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface StatusManagerProps {
  currentStatus: EvidenceStatus;
  onStatusChange: (newStatus: EvidenceStatus) => Promise<void>;
  isAdmin: boolean;
  className?: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'pending',
    label: 'Pending',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: 'Awaiting initial review'
  },
  {
    value: 'submitted',
    label: 'Submitted',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Submitted for approval'
  },
  {
    value: 'under_review',
    label: 'Under Review',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Currently being reviewed'
  },
  {
    value: 'approved',
    label: 'Approved',
    icon: <Check className="h-4 w-4" />,
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Approved and active'
  },
  {
    value: 'rejected',
    label: 'Rejected',
    icon: <X className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50 border-red-200',
    description: 'Rejected - needs revision'
  },
  {
    value: 'expired',
    label: 'Expired',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Expired - needs renewal'
  }
];

export const StatusManager: React.FC<StatusManagerProps> = ({ 
  currentStatus, 
  onStatusChange, 
  isAdmin, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<EvidenceStatus | null>(null);

  const currentOption = STATUS_OPTIONS.find(option => option.value === currentStatus);

  const handleStatusChange = async (newStatus: EvidenceStatus) => {
    // Show confirmation for certain status changes
    if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'expired') {
      setShowConfirmation(newStatus);
      setIsOpen(false);
      return;
    }

    await processStatusChange(newStatus);
  };

  const processStatusChange = async (newStatus: EvidenceStatus) => {
    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
      setShowConfirmation(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChangeMessage = (newStatus: EvidenceStatus) => {
    switch (newStatus) {
      case 'approved':
        return 'This will mark the item as approved and compliant. Are you sure?';
      case 'rejected':
        return 'This will reject the item and mark it as non-compliant. Are you sure?';
      case 'expired':
        return 'This will mark the item as expired. Are you sure?';
      default:
        return 'Are you sure you want to change the status?';
    }
  };

  if (!isAdmin) {
    return (
      <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border ${currentOption?.color} ${className}`}>
        {currentOption?.icon}
        <span className="ml-1">{currentOption?.label}</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            currentOption?.color
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
        >
          {currentOption?.icon}
          <span className="ml-1">{currentOption?.label}</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Change Status</div>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={option.value === currentStatus}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    option.value === currentStatus 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-1 rounded ${option.color.split(' ')[1]} ${option.color.split(' ')[0]}`}>
                      {option.icon}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
            <p className="text-gray-600 mb-6">
              {getStatusChangeMessage(showConfirmation)}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => processStatusChange(showConfirmation)}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}; 