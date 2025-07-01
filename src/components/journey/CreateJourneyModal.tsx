// CREATE JOURNEY MODAL COMPONENT
// Modal for creating new compliance journeys from templates

import React, { useState } from 'react';
import { X, Calendar, User, MapPin } from 'lucide-react';
import { JourneyTemplate } from '../../types/journey';

interface CreateJourneyModalProps {
  templates: JourneyTemplate[];
  onClose: () => void;
  onCreate: (templateId: string, assignedTo?: string, targetDate?: string) => void;
}

const CreateJourneyModal: React.FC<CreateJourneyModalProps> = ({
  templates,
  onClose,
  onCreate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      await onCreate(selectedTemplate, assignedTo || undefined, targetDate || undefined);
    } catch (error) {
      console.error('Error creating journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start New Compliance Journey</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Compliance Framework
            </label>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Framework: {template.framework?.name}</span>
                        {template.estimated_duration_days && (
                          <span>Duration: ~{template.estimated_duration_days} days</span>
                        )}
                        <span className="capitalize">Level: {template.difficulty_level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Details */}
          {selectedTemplateData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Journey Overview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Framework:</span>
                  <span className="ml-2 font-medium">{selectedTemplateData.framework?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Steps:</span>
                  <span className="ml-2 font-medium">{selectedTemplateData.steps?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Duration:</span>
                  <span className="ml-2 font-medium">
                    {selectedTemplateData.estimated_duration_days 
                      ? `${selectedTemplateData.estimated_duration_days} days`
                      : 'Not specified'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="ml-2 font-medium capitalize">{selectedTemplateData.difficulty_level}</span>
                </div>
              </div>
            </div>
          )}

          {/* Assignment */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assign To (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Enter user email or name"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Target Completion Date */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
              Target Completion Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="targetDate"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTemplate || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Start Journey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJourneyModal; 