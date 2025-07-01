// JOURNEY DETAIL MODAL COMPONENT
// Detailed modal for viewing and managing journey steps and evidence

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Link,
  Plus,
  Eye
} from 'lucide-react';
import { 
  PracticeJourney, 
  PracticeJourneyStep, 
  JourneyProgressData,
  StepStatus 
} from '../../types/journey';
import JourneyProgressChart from './JourneyProgressChart';

interface JourneyDetailModalProps {
  journey: PracticeJourney;
  progressData: JourneyProgressData | null;
  onClose: () => void;
  onUpdate: (journey: PracticeJourney) => void;
  onRefresh: () => void;
}

const JourneyDetailModal: React.FC<JourneyDetailModalProps> = ({
  journey,
  progressData,
  onClose,
  onUpdate,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'progress'>('overview');
  const [selectedStep, setSelectedStep] = useState<PracticeJourneyStep | null>(null);

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'blocked': return AlertTriangle;
      default: return Clock;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const completedSteps = journey.steps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = journey.steps?.length || 0;
  const inProgressSteps = journey.steps?.filter(s => s.status === 'in_progress').length || 0;
  const blockedSteps = journey.steps?.filter(s => s.status === 'blocked').length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {journey.template?.name || 'Journey Details'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {journey.template?.framework?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'steps', label: 'Steps' },
              { id: 'progress', label: 'Progress' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {journey.progress_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-700">Overall Progress</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
                  <div className="text-sm text-green-700">Steps Completed</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressSteps}</div>
                  <div className="text-sm text-yellow-700">In Progress</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{blockedSteps}</div>
                  <div className="text-sm text-red-700">Blocked</div>
                </div>
              </div>

              {/* Journey Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Journey Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        journey.status === 'completed' ? 'text-green-600 bg-green-100' :
                        journey.status === 'in_progress' ? 'text-blue-600 bg-blue-100' :
                        journey.status === 'paused' ? 'text-yellow-600 bg-yellow-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {journey.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Started</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(journey.started_at)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Target Completion</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(journey.target_completion_date)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assigned To</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {journey.assigned_to || 'Not assigned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Description */}
              {journey.template?.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About This Journey</h3>
                  <p className="text-gray-600">{journey.template.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {journey.steps?.map((step, index) => {
                const StatusIcon = getStatusIcon(step.status);
                return (
                  <div
                    key={step.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600 mr-3">
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {step.step?.title}
                          </h4>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {step.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        {step.step?.description && (
                          <p className="text-gray-600 mb-3">{step.step.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {step.step?.category && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {step.step.category}
                            </span>
                          )}
                          {step.step?.estimated_hours && (
                            <span>~{step.step.estimated_hours}h</span>
                          )}
                          {step.evidence && step.evidence.length > 0 && (
                            <span className="flex items-center">
                              <Link className="h-4 w-4 mr-1" />
                              {step.evidence.length} evidence item{step.evidence.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {step.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">{step.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedStep(step)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Link Evidence"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress bar for step */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs text-gray-600">
                          {step.completion_percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'in_progress' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(step.completion_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {progressData && progressData.dates.length > 0 ? (
                <JourneyProgressChart 
                  data={progressData} 
                  height={400} 
                  showVelocity={true}
                />
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Progress tracking will appear as you complete journey steps.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Last updated: {formatDate(journey.updated_at)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetailModal; 