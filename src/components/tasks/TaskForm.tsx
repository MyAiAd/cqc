import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Task, TaskFrequency, RiskRating, StaffCompetency } from '../../types';
import { getDocumentsByType, DocumentReference } from '../../services/dataService';

interface TaskFormProps {
  task?: Task;
  staffList: { id: string; name: string }[];
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  staffList,
  onSubmit,
  onCancel,
}) => {
  const frequencies: TaskFrequency[] = ['Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly'];
  const riskRatings: RiskRating[] = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'];
  
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      name: '',
      description: '',
      category: 'Daily',
      sopLink: '',
      policyLink: '',
      sopDocumentId: '',
      policyDocumentId: '',
      riskRating: 'Medium',
      competencies: staffList.map(staff => ({
        staffId: staff.id,
        staffName: staff.name,
        status: 'Not Applicable',
      })),
      owner: '',
    }
  );

  // Document management state
  const [sopDocuments, setSopDocuments] = useState<DocumentReference[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<DocumentReference[]>([]);
  const [sopLinkType, setSopLinkType] = useState<'internal' | 'external'>('internal');
  const [policyLinkType, setPolicyLinkType] = useState<'internal' | 'external'>('internal');
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Load documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const [sops, policies] = await Promise.all([
          getDocumentsByType('sop'),
          getDocumentsByType('policy')
        ]);
        setSopDocuments(sops);
        setPolicyDocuments(policies);
        
        // Set initial link types based on existing data
        if (task?.sopDocumentId) {
          setSopLinkType('internal');
        } else if (task?.sopLink) {
          setSopLinkType('external');
        }
        
        if (task?.policyDocumentId) {
          setPolicyLinkType('internal');
        } else if (task?.policyLink) {
          setPolicyLinkType('external');
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [task]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle SOP link type changes
  const handleSopLinkTypeChange = (type: 'internal' | 'external') => {
    setSopLinkType(type);
    setFormData(prev => ({
      ...prev,
      sopDocumentId: type === 'internal' ? prev.sopDocumentId : '',
      sopLink: type === 'external' ? prev.sopLink : ''
    }));
  };

  // Handle Policy link type changes
  const handlePolicyLinkTypeChange = (type: 'internal' | 'external') => {
    setPolicyLinkType(type);
    setFormData(prev => ({
      ...prev,
      policyDocumentId: type === 'internal' ? prev.policyDocumentId : '',
      policyLink: type === 'external' ? prev.policyLink : ''
    }));
  };
  
  const handleCompetencyChange = (staffId: string, status: string) => {
    setFormData(prev => {
      const updatedCompetencies = prev.competencies ? [...prev.competencies] : [];
      const index = updatedCompetencies.findIndex(c => c.staffId === staffId);
      
      if (index >= 0) {
        updatedCompetencies[index] = {
          ...updatedCompetencies[index],
          status: status as any,
        };
      }
      
      return { ...prev, competencies: updatedCompetencies };
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Task Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
              Frequency *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || 'Daily'}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {frequencies.map(freq => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="riskRating" className="block text-sm font-medium text-neutral-700">
              Risk Rating *
            </label>
            <select
              id="riskRating"
              name="riskRating"
              value={formData.riskRating || 'Medium'}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {riskRatings.map(risk => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* SOP Reference Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              SOP Reference
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sopLinkType"
                  value="internal"
                  checked={sopLinkType === 'internal'}
                  onChange={() => handleSopLinkTypeChange('internal')}
                  className="mr-2"
                />
                Internal Document
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sopLinkType"
                  value="external"
                  checked={sopLinkType === 'external'}
                  onChange={() => handleSopLinkTypeChange('external')}
                  className="mr-2"
                />
                External URL
              </label>
            </div>
            
            {sopLinkType === 'internal' ? (
              <select
                name="sopDocumentId"
                value={formData.sopDocumentId || ''}
                onChange={handleInputChange}
                disabled={loadingDocuments}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-neutral-100"
              >
                <option value="">Select SOP document...</option>
                {sopDocuments.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="url"
                name="sopLink"
                value={formData.sopLink || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/sop"
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            )}
          </div>
        </div>

        {/* Policy Reference Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Policy Reference
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="policyLinkType"
                  value="internal"
                  checked={policyLinkType === 'internal'}
                  onChange={() => handlePolicyLinkTypeChange('internal')}
                  className="mr-2"
                />
                Internal Document
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="policyLinkType"
                  value="external"
                  checked={policyLinkType === 'external'}
                  onChange={() => handlePolicyLinkTypeChange('external')}
                  className="mr-2"
                />
                External URL
              </label>
            </div>
            
            {policyLinkType === 'internal' ? (
              <select
                name="policyDocumentId"
                value={formData.policyDocumentId || ''}
                onChange={handleInputChange}
                disabled={loadingDocuments}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-neutral-100"
              >
                <option value="">Select policy document...</option>
                {policyDocuments.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="url"
                name="policyLink"
                value={formData.policyLink || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/policy"
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="owner" className="block text-sm font-medium text-neutral-700">
            Task Owner
          </label>
          <select
            id="owner"
            name="owner"
            value={formData.owner || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">-- Select Owner --</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.name}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Staff Competencies</h3>
          <div className="space-y-4">
            {formData.competencies?.map(comp => (
              <div key={comp.staffId} className="flex items-center">
                <span className="w-1/3 text-sm">{comp.staffName}</span>
                <select
                  value={comp.status}
                  onChange={(e) => handleCompetencyChange(comp.staffId, e.target.value)}
                  className="ml-4 block w-2/3 rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="Not Applicable">Not Applicable</option>
                  <option value="Training Required">Training Required</option>
                  <option value="Re-Training Required">Re-Training Required</option>
                  <option value="Trained awaiting sign off">Trained awaiting sign off</option>
                  <option value="Competent">Competent</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};