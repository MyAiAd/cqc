// COMPLIANCE JOURNEY DASHBOARD
// Main page for tracking compliance journeys, progress, and evidence linking

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Map, 
  BarChart3, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Play,
  Pause,
  FileText,
  Link
} from 'lucide-react';
import { mockJourneyService } from '../services/mockJourneyService';
import {
  PracticeJourney,
  JourneyTemplate,
  JourneyAnalytics,
  JourneyProgressData,
  JourneyStatus
} from '../types/journey';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import JourneyProgressChart from '../components/journey/JourneyProgressChart';
import JourneyCard from '../components/journey/JourneyCard';
import CreateJourneyModal from '../components/journey/CreateJourneyModal';
import JourneyDetailModal from '../components/journey/JourneyDetailModal';

const Journey: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [journeys, setJourneys] = useState<PracticeJourney[]>([]);
  const [templates, setTemplates] = useState<JourneyTemplate[]>([]);
  const [analytics, setAnalytics] = useState<JourneyAnalytics | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<PracticeJourney | null>(null);
  const [progressData, setProgressData] = useState<JourneyProgressData | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<JourneyStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [journeysResult, templatesData, analyticsData] = await Promise.all([
        mockJourneyService.getPracticeJourneys(),
        mockJourneyService.getJourneyTemplates(),
        mockJourneyService.getJourneyAnalytics()
      ]);

      setJourneys(journeysResult.journeys);
      setTemplates(templatesData);
      setAnalytics(analyticsData);

      // Load progress data for the first active journey
      const activeJourney = journeysResult.journeys.find(j => j.status === 'in_progress');
      if (activeJourney) {
        const progressData = await mockJourneyService.getJourneyProgressData(activeJourney.id);
        setProgressData(progressData);
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [journeysResult, templatesData, analyticsData] = await Promise.all([
          mockJourneyService.getPracticeJourneys(),
          mockJourneyService.getJourneyTemplates(),
          mockJourneyService.getJourneyAnalytics()
        ]);

        setJourneys(journeysResult.journeys);
        setTemplates(templatesData);
        setAnalytics(analyticsData);

        // Load progress data for the first active journey
        const activeJourney = journeysResult.journeys.find(j => j.status === 'in_progress');
        if (activeJourney) {
          const progressData = await mockJourneyService.getJourneyProgressData(activeJourney.id);
          setProgressData(progressData);
        }
      } catch (error) {
        console.error('Error loading journey data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - runs only once on mount

  const handleCreateJourney = async (templateId: string, assignedTo?: string, targetDate?: string) => {
    try {
      await mockJourneyService.createPracticeJourney({
        template_id: templateId,
        assigned_to: assignedTo,
        target_completion_date: targetDate
      });
      
      setShowCreateModal(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating journey:', error);
    }
  };

  const handleJourneySelect = async (journey: PracticeJourney) => {
    setSelectedJourney(journey);
    setShowDetailModal(true);
    
    // Load progress data for selected journey
    try {
      const progressData = await mockJourneyService.getJourneyProgressData(journey.id);
      setProgressData(progressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const handleJourneyUpdate = async (journey: PracticeJourney) => {
    try {
      await mockJourneyService.updatePracticeJourney(journey.id, journey);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating journey:', error);
    }
  };

  // Filter journeys based on status and search
  const filteredJourneys = journeys.filter(journey => {
    const matchesStatus = statusFilter === 'all' || journey.status === statusFilter;
    const matchesSearch = !searchTerm || 
      journey.template?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.template?.framework?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Map className="h-8 w-8 text-blue-600 mr-3" />
            Compliance Journey
          </h1>
          <p className="text-gray-600 mt-1">
            Track your compliance progress and link evidence to journey steps
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Start New Journey
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Map className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Journeys</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_journeys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.average_progress.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Steps Completed</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_steps_completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Link className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Evidence Linked</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.evidence_items_linked}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      {progressData && progressData.dates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
          <JourneyProgressChart data={progressData} height={300} />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search journeys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JourneyStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Journeys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJourneys.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onSelect={handleJourneySelect}
            onUpdate={handleJourneyUpdate}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredJourneys.length === 0 && (
        <div className="text-center py-12">
          <Map className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No journeys found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {journeys.length === 0 
              ? "Get started by creating your first compliance journey."
              : "Try adjusting your filters or search terms."
            }
          </p>
          {journeys.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Your First Journey
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alerts for overdue items */}
      {analytics && analytics.overdue_steps > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Attention Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have {analytics.overdue_steps} overdue step{analytics.overdue_steps !== 1 ? 's' : ''} 
                  {analytics.upcoming_deadlines > 0 && (
                    <> and {analytics.upcoming_deadlines} upcoming deadline{analytics.upcoming_deadlines !== 1 ? 's' : ''}</>
                  )}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateJourneyModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateJourney}
        />
      )}

      {showDetailModal && selectedJourney && (
        <JourneyDetailModal
          journey={selectedJourney}
          progressData={progressData}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedJourney(null);
          }}
          onUpdate={handleJourneyUpdate}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default Journey; 