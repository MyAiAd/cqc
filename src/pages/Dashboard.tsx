import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  ListChecks, 
  AlertTriangle, 
  Briefcase, 
  UserX,
  Building,
  Users,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDebugMode } from '../hooks/useDebugMode';
import { StatCard } from '../components/dashboard/StatCard';
import { TasksByRiskChart } from '../components/dashboard/TasksByRiskChart';
import { CompetencyStatusChart } from '../components/dashboard/CompetencyStatusChart';
import { RecentTasksTable } from '../components/dashboard/RecentTasksTable';
import { UsageDashboard } from '../components/subscription/UsageDashboard';
import { sampleTasks, getDashboardSummary } from '../data/sampleData';
import { getAllPractices, getGlobalStats } from '../services/dataService';

interface GlobalStats {
  totalPractices: number;
  totalUsers: number;
  totalTasks: number;
  totalStaff: number;
}

interface Practice {
  id: string;
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
}

export const Dashboard: React.FC = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const { debugMode } = useDebugMode();
  
  // Add focus event listener to detect when tab is switched
  useEffect(() => {
    const handleFocus = () => {
      console.log('🏠 DASHBOARD - Window focused at:', new Date().toISOString());
    };
    
    const handleBlur = () => {
      console.log('🏠 DASHBOARD - Window blurred at:', new Date().toISOString());
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adminDataLoadedRef = useRef(false); // Track if admin data has been loaded
  
  const [dashboardData] = useState(() => getDashboardSummary()); // Calculate once on mount
  
  // Memoize the super admin check to prevent unnecessary re-renders
  const isSuperAdmin = useMemo(() => {
    return userProfile?.role === 'super_admin';
  }, [userProfile?.role]);

  // Debug logging - Re-enabled to track what's causing re-renders during tab switching
  console.log('🎯 DASHBOARD RENDER - User:', userProfile?.email, 'Role:', userProfile?.role);
  console.log('🎯 DASHBOARD RENDER - Auth Loading:', authLoading, 'Admin Loading:', adminDataLoading);
  console.log('🎯 DASHBOARD RENDER - Super Admin Status:', isSuperAdmin);

  useEffect(() => {
    // Load admin data only once when the component mounts and user is available
    const loadInitialData = async () => {
      // Wait for auth to be done loading and user profile to be available
      if (authLoading || !userProfile) return;
      
      // Only load admin data if user is super admin and hasn't been loaded yet
      if (userProfile.role === 'super_admin' && !adminDataLoading && !adminDataLoadedRef.current) {
        adminDataLoadedRef.current = true; // Mark as loading to prevent duplicate calls
        await loadAdminData();
      }
    };

    loadInitialData();
  }, []); // Empty dependency - run only once on mount

  // Memoize loadAdminData to prevent unnecessary re-creations
  const loadAdminData = useCallback(async () => {
    setAdminDataLoading(true);
    setError(null);
    
    try {
      console.log('Loading admin data...');
      
      // Add timeout to prevent hanging
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Admin data fetch timeout')), 10000);
      });

      const statsPromise = getGlobalStats();
      const practicesPromise = getAllPractices();

      const [statsData, practicesData] = await Promise.race([
        Promise.all([statsPromise, practicesPromise]),
        timeout
      ]);

      console.log('Admin data loaded:', { statsData, practicesData });
      setGlobalStats(statsData);
      setPractices(practicesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
      // Set fallback data to prevent white screen
      setGlobalStats({
        totalPractices: 0,
        totalUsers: 0,
        totalTasks: 0,
        totalStaff: 0,
      });
      setPractices([]);
    } finally {
      setAdminDataLoading(false);
    }
  }, []); // No dependencies - this function should not change

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user profile
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load user profile. Please try signing in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Only show if debug mode is enabled and user is super admin */}
      {debugMode && isSuperAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Information</h3>
          <pre className="text-xs text-yellow-700">
            {JSON.stringify({
              email: userProfile.email,
              role: userProfile.role,
              isSuperAdmin: isSuperAdmin,
              practice_id: userProfile.practice_id,
              practice_name: userProfile.practice?.name,
              authLoading: authLoading,
              adminDataLoading: adminDataLoading,
              error: error
            }, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={() => loadAdminData()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {isSuperAdmin ? (
        // Super Admin Dashboard
        <>
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center space-x-3">
              <Globe className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-primary-100">Welcome back, {userProfile?.name}</p>
                <p className="text-sm text-primary-200">Cross-practice overview and management</p>
              </div>
            </div>
          </div>

          {adminDataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading admin data...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Practices"
                  value={globalStats?.totalPractices || 0}
                  icon={<Building className="h-6 w-6 text-white" />}
                  colorClass="bg-blue-500"
                  description="across all regions"
                />
                <StatCard
                  title="Total Users"
                  value={globalStats?.totalUsers || 0}
                  icon={<Users className="h-6 w-6 text-white" />}
                  colorClass="bg-green-500"
                  description="platform-wide"
                />
                <StatCard
                  title="Total Tasks"
                  value={globalStats?.totalTasks || 0}
                  icon={<ListChecks className="h-6 w-6 text-white" />}
                  colorClass="bg-primary-500"
                  description="across all practices"
                />
                <StatCard
                  title="Total Staff"
                  value={globalStats?.totalStaff || 0}
                  icon={<Briefcase className="h-6 w-6 text-white" />}
                  colorClass="bg-purple-500"
                  description="managed users"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Overview</h3>
                  <div className="space-y-3">
                    {practices.slice(0, 5).map((practice) => (
                      <div key={practice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h4 className="font-medium text-gray-900">{practice.name}</h4>
                          <p className="text-sm text-gray-500">{practice.email_domain}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          practice.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                          practice.subscription_tier === 'basic' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {practice.subscription_tier.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {practices.length > 5 && (
                    <p className="text-sm text-gray-500 mt-3">
                      And {practices.length - 5} more practices...
                    </p>
                  )}
                  {practices.length === 0 && (
                    <p className="text-sm text-gray-500">No practices found</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database Status</span>
                      <span className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        Healthy
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Sessions</span>
                      <span className="text-gray-900">{globalStats?.totalUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">System Load</span>
                      <span className="text-green-600">Normal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Storage Usage</span>
                      <span className="text-gray-900">23% of 100GB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-sm text-gray-600">
                  <p>• New practice "Oakfield Medical Centre" registered</p>
                  <p>• 5 new staff members added across 3 practices</p>
                  <p>• 12 competency assessments completed today</p>
                  <p>• 3 high-risk tasks identified requiring attention</p>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        // Regular user dashboard
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
                <p className="text-sm text-gray-500">{userProfile?.practice?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Subscription</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  userProfile?.practice?.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                  userProfile?.practice?.subscription_tier === 'basic' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userProfile?.practice?.subscription_tier?.toUpperCase() || 'FREE'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Usage Dashboard */}
          <UsageDashboard />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tasks"
              value={dashboardData.totalTasks}
              icon={<ListChecks className="h-6 w-6 text-white" />}
              colorClass="bg-primary-500"
            />
            <StatCard
              title="High Risk Tasks"
              value={dashboardData.highRiskTasks}
              icon={<AlertTriangle className="h-6 w-6 text-white" />}
              colorClass="bg-error-500"
            />
            <StatCard
              title="Training Required"
              value={dashboardData.trainingRequired}
              icon={<UserX className="h-6 w-6 text-white" />}
              colorClass="bg-warning-500"
            />
            <StatCard
              title="Competent Staff"
              value={12}
              icon={<Briefcase className="h-6 w-6 text-white" />}
              colorClass="bg-success-500"
              description="of 15 skills"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TasksByRiskChart tasks={sampleTasks} />
            <CompetencyStatusChart tasks={sampleTasks} />
          </div>
          
          <RecentTasksTable tasks={dashboardData.recentlyUpdated} />
        </div>
      )}
    </div>
  );
};