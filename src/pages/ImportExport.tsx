import React, { useState, useEffect } from 'react';
import { ImportExportPanel } from '../components/importExport/ImportExportPanel';
import { getTasks } from '../services/dataService';
import { Task } from '../types';

export const ImportExport: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImport = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Import / Export</h1>
        <p className="mt-2 text-neutral-600">
          Import your existing Excel data or export your current data for backup.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={loadTasks}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      
      <ImportExportPanel tasks={tasks} onImport={handleImport} />
    </div>
  );
};