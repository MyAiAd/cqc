import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Task, TaskFrequency, RiskRating, StaffCompetency } from '../../types';

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
      riskRating: 'Medium',
      competencies: staffList.map(staff => ({
        staffId: staff.id,
        staffName: staff.name,
        status: 'Not Applicable',
      })),
      owner: '',
    }
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              Category *
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
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sopLink" className="block text-sm font-medium text-neutral-700">
              SOP Link
            </label>
            <input
              type="text"
              id="sopLink"
              name="sopLink"
              value={formData.sopLink || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="policyLink" className="block text-sm font-medium text-neutral-700">
              Policy Link
            </label>
            <input
              type="text"
              id="policyLink"
              name="policyLink"
              value={formData.policyLink || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
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