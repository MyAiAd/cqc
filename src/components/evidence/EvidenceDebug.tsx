import React, { useState } from 'react';
import { evidenceService } from '../../services/evidenceService';
import { Button } from '../ui/Button';

export const EvidenceDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testInitialization = async () => {
    setLoading(true);
    setError(null);
    try {
      await evidenceService.initializePracticeEvidence();
      setResult('Evidence system initialized successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = await evidenceService.getCategories();
      setResult(categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetRequirements = async () => {
    setLoading(true);
    setError(null);
    try {
      const requirements = await evidenceService.getRequirements();
      setResult(requirements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await evidenceService.getEvidenceStats();
      setResult(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Evidence Service Debug</h3>
      
      <div className="space-x-2 mb-4">
        <Button 
          onClick={testInitialization} 
          disabled={loading}
          size="sm"
        >
          Initialize Evidence System
        </Button>
        <Button 
          onClick={testGetCategories} 
          disabled={loading}
          size="sm"
        >
          Get Categories
        </Button>
        <Button 
          onClick={testGetRequirements} 
          disabled={loading}
          size="sm"
        >
          Get Requirements
        </Button>
        <Button 
          onClick={testGetStats} 
          disabled={loading}
          size="sm"
        >
          Get Stats
        </Button>
      </div>

      {loading && (
        <div className="text-blue-600">Loading...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <h4 className="font-medium text-red-800">Error:</h4>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h4 className="font-medium text-green-800 mb-2">Result:</h4>
          <pre className="text-sm text-green-700 overflow-auto max-h-64">
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}; 