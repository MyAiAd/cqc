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
          <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)}>
            <div 
              className="absolute w-72 bg-white rounded-lg shadow-2xl border border-gray-300 z-[10000]"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Change Status</div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      disabled={option.value === currentStatus}
                      className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 border ${
                        option.value === currentStatus 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                          : 'hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md ${option.color.split(' ')[1]} ${option.color.split(' ')[0]}`}>
                          {option.icon}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                        </div>
                        {option.value === currentStatus && (
                          <div className="ml-2">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
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


    </>
  );
}; 