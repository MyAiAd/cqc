import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';
import { 
  EvidenceCategory, 
  EvidenceRequirement, 
  CreateEvidenceItemRequest,
  EvidenceType,
  EvidenceItem 
} from '../../types/evidence';

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: EvidenceItem;
  defaultEvidenceType?: EvidenceType;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultEvidenceType = 'document'
}) => {
  const [formData, setFormData] = useState<CreateEvidenceItemRequest>({
    title: '',
    description: '',
    evidence_type: defaultEvidenceType,
    tags: [],
    is_sensitive: false
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<EvidenceCategory[]>([]);
  const [requirements, setRequirements] = useState<EvidenceRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      
      // Populate form with initial data if editing
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          evidence_type: initialData.evidence_type,
          category_id: initialData.category_id || undefined,
          requirement_id: initialData.requirement_id || undefined,
          evidence_date: initialData.evidence_date || undefined,
          expiry_date: initialData.expiry_date || undefined,
          next_review_date: initialData.next_review_date || undefined,
          tags: initialData.tags || [],
          notes: initialData.notes || '',
          is_sensitive: initialData.is_sensitive || false
        });
      } else {
        // Reset form for new evidence
        setFormData({
          title: '',
          description: '',
          evidence_type: defaultEvidenceType,
          tags: [],
          is_sensitive: false
        });
        setFiles([]);
      }
    }
  }, [isOpen, initialData, defaultEvidenceType]);

  const loadData = async () => {
    try {
      const [categoriesData, requirementsData] = await Promise.all([
        evidenceService.getCategories(),
        evidenceService.getRequirements()
      ]);
      setCategories(categoriesData);
      setRequirements(requirementsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load categories and requirements');
    }
  };

  const handleInputChange = (field: keyof CreateEvidenceItemRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    console.log('=== UPLOAD MODAL SUBMIT ===');
    console.log('Form data being submitted:', formData);
    console.log('Evidence type in form:', formData.evidence_type);
    console.log('Default evidence type prop:', defaultEvidenceType);

    setLoading(true);
    setError(null);

    try {
      let evidenceItem;
      
      if (initialData) {
        // Update existing evidence item
        evidenceItem = await evidenceService.updateEvidenceItem(initialData.id, formData);
      } else {
        // Create new evidence item
        evidenceItem = await evidenceService.createEvidenceItem(formData);
      }
      
      // Upload files if any (only for new items or when adding files to existing)
      for (const file of files) {
        await evidenceService.uploadFile({
          evidence_item_id: evidenceItem.id,
          file,
          is_primary: files.indexOf(file) === 0, // First file is primary
          access_level: 'practice'
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        evidence_type: defaultEvidenceType,
        tags: [],
        is_sensitive: false
      });
      setFiles([]);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving evidence:', error);
      setError(error instanceof Error ? error.message : 'Failed to save evidence');
    } finally {
      setLoading(false);
    }
  };

  const evidenceTypes: { value: EvidenceType; label: string; description?: string }[] = [
    { value: 'document', label: 'General Document', description: 'Letters, reports, forms, or other general documents' },
    { value: 'policy', label: 'Policy Document', description: 'Organizational policies and governance documents' },
    { value: 'procedure', label: 'Procedure/SOP', description: 'Standard operating procedures and work instructions' },
    { value: 'training_record', label: 'Training Record', description: 'Training certificates, attendance records, competency assessments' },
    { value: 'audit_report', label: 'Audit Report', description: 'Internal audits, external inspections, compliance reviews' },
    { value: 'certificate', label: 'Certificate', description: 'Professional certifications, accreditations, licenses' },
    { value: 'photo', label: 'Photo', description: 'Visual evidence, facility photos, equipment images' },
    { value: 'video', label: 'Video', description: 'Video recordings, training videos, demonstrations' },
    { value: 'other', label: 'Other', description: 'Any other type of evidence not listed above' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Evidence' : 'Upload Evidence'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter evidence title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe this evidence..."
            />
          </div>

          {/* Evidence Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence Type *
            </label>
            <select
              value={formData.evidence_type}
              onChange={(e) => handleInputChange('evidence_type', e.target.value as EvidenceType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {evidenceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {/* Show description for selected type */}
            {formData.evidence_type && (
              <p className="mt-1 text-sm text-gray-600">
                {evidenceTypes.find(t => t.value === formData.evidence_type)?.description}
              </p>
            )}
            {/* Context-specific help */}
            {defaultEvidenceType === 'policy' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Uploading from Policies page:</strong> Select "Policy Document" for organizational policies, 
                  or "Procedure/SOP" for standard operating procedures. Use "General Document" only for supporting 
                  documents that aren't policies themselves.
                </p>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => handleInputChange('category_id', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requirement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CQC Requirement
            </label>
            <select
              value={formData.requirement_id || ''}
              onChange={(e) => handleInputChange('requirement_id', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a requirement...</option>
              {requirements.map(req => (
                <option key={req.id} value={req.id}>
                  {req.regulation_id} - {req.title}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-primary-600 hover:text-primary-700 cursor-pointer">
                  browse
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">
                Supports: PDF, DOC, DOCX, JPG, PNG, GIF, TXT, XLS, XLSX (max 50MB each)
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sensitive"
                checked={formData.is_sensitive}
                onChange={(e) => handleInputChange('is_sensitive', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sensitive" className="ml-2 text-sm text-gray-700">
                This evidence contains sensitive information
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 