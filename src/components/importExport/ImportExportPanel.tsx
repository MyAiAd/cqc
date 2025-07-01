import React, { useState, useEffect } from 'react';
import { FileUp, FileDown, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { exportToExcel, importFromExcel } from '../../utils/exportUtils';
import { Task } from '../../types';

interface ImportExportPanelProps {
  tasks: Task[];
  onImport: (tasks: Task[]) => void;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ tasks, onImport }) => {
  const { userProfile } = useAuth();
  const { hasFeature } = useSubscription();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasAdvancedExport, setHasAdvancedExport] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkFeatures = async () => {
      if (userProfile?.role === 'super_admin') {
        setHasAdvancedExport(true);
      } else {
        const hasReports = await hasFeature('reports');
        setHasAdvancedExport(hasReports);
      }
    };

    checkFeatures();
  }, [userProfile, hasFeature]);
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = exportToExcel(tasks);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      const result = await importFromExcel(file);
      
      if (result.success && result.data) {
        onImport(result.data);
        setNotification({
          type: 'success',
          message: result.message,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };
  
  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-md ${
            notification.type === 'success' ? 'bg-success-50 text-success-800' : 'bg-error-50 text-error-800'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-success-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-error-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <p className="text-sm text-neutral-500">
            Import your existing Harmony360 compliance data from an Excel spreadsheet.
          </p>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            onClick={handleImportClick}
            isLoading={isImporting}
            leftIcon={<FileUp className="h-4 w-4" />}
          >
            {isImporting ? 'Importing...' : 'Import Excel File'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <p className="text-sm text-neutral-500">
            Export your Harmony360 compliance data for offline use or backup.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic CSV Export - Available to all */}
            <div>
              <Button
                onClick={() => {/* Basic CSV export logic */}}
                leftIcon={<FileDown className="h-4 w-4" />}
                variant="outline"
              >
                Export to CSV (Basic)
              </Button>
              <p className="text-xs text-gray-500 mt-1">Basic data export in CSV format</p>
            </div>

            {/* Advanced Excel Export - Requires reports feature */}
            <div>
              {hasAdvancedExport ? (
                <div>
                  <Button
                    onClick={handleExport}
                    isLoading={isExporting}
                    leftIcon={<FileDown className="h-4 w-4" />}
                  >
                    {isExporting ? 'Exporting...' : 'Export to Excel (Advanced)'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Advanced Excel export with formatting and charts</p>
                </div>
              ) : (
                <div>
                  <Button
                    disabled
                    leftIcon={<Lock className="h-4 w-4" />}
                    className="opacity-50 cursor-not-allowed"
                  >
                    Export to Excel (Advanced)
                  </Button>
                  <p className="text-xs text-amber-600 mt-1">
                    Upgrade to Basic or Premium plan to access advanced Excel exports
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};