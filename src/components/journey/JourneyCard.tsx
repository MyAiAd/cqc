// JOURNEY CARD COMPONENT
// Card component for displaying journey information with progress and actions

import React from 'react';
import {
  Map,
  Clock,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { PracticeJourney, JourneyStatus } from '../../types/journey';

interface JourneyCardProps {
  journey: PracticeJourney;
  onSelect?: (journey: PracticeJourney) => void;
  onUpdate?: (journey: PracticeJourney) => void;
}

const JourneyCard: React.FC<JourneyCardProps> = ({
  journey,
  onSelect,
  onUpdate
}) => {
  const getStatusColor = (status: JourneyStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: JourneyStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'paused': return Pause;
      case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StatusIcon = getStatusIcon(journey.status);
  const completedSteps = journey.steps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = journey.steps?.length || 0;
  const isOverdue = journey.target_completion_date && 
    new Date(journey.target_completion_date) < new Date() && 
    journey.status !== 'completed';

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Map className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {journey.template?.name || 'Unknown Journey'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {journey.template?.framework?.name || 'Unknown Framework'}
            </p>
            
            {/* Status Badge */}
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(journey.status)}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {journey.status.replace('_', ' ').toUpperCase()}
              </span>
              
              {isOverdue && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  OVERDUE
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => onSelect?.(journey)}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {journey.progress_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(journey.progress_percentage)}`}
              style={{ width: `${Math.min(journey.progress_percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>Steps: {completedSteps} / {totalSteps}</span>
          <span>
            {totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}% complete
          </span>
        </div>

        {/* Timeline Info */}
        <div className="space-y-2">
          {journey.started_at && (
            <div className="flex items-center text-sm text-gray-600">
              <Play className="h-4 w-4 mr-2" />
              Started: {formatDate(journey.started_at)}
            </div>
          )}
          
          {journey.target_completion_date && (
            <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
              <Calendar className="h-4 w-4 mr-2" />
              Target: {formatDate(journey.target_completion_date)}
            </div>
          )}
          
          {journey.assigned_to && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              Assigned to: {journey.assigned_to}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Updated {new Date(journey.updated_at).toLocaleDateString()}
          </div>
          
          <div className="flex space-x-2">
            {journey.status === 'not_started' && (
              <button
                onClick={() => onUpdate?.({ ...journey, status: 'in_progress', started_at: new Date().toISOString() })}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                Start Journey
              </button>
            )}
            
            {journey.status === 'in_progress' && (
              <button
                onClick={() => onUpdate?.({ ...journey, status: 'paused' })}
                className="px-3 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
              >
                Pause
              </button>
            )}
            
            {journey.status === 'paused' && (
              <button
                onClick={() => onUpdate?.({ ...journey, status: 'in_progress' })}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                Resume
              </button>
            )}
            
            <button
              onClick={() => onSelect?.(journey)}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyCard; 