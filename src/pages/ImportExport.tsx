import React, { useState } from 'react';
import { ImportExportPanel } from '../components/importExport/ImportExportPanel';
import { sampleTasks } from '../data/sampleData';
import { Task } from '../types';

export const ImportExport: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  
  const handleImport = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Import / Export</h1>
        <p className="mt-2 text-neutral-600">
          Import your existing Excel data or export your current data for backup.
        </p>
      </div>
      
      <ImportExportPanel tasks={tasks} onImport={handleImport} />
    </div>
  );
};