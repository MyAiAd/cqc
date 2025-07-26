import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { EnhancedLoginForm } from './components/auth/EnhancedLoginForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { SkillsMatrix } from './pages/SkillsMatrix';
import { Tasks } from './pages/Tasks';
import { Staff } from './pages/Staff';
import ComplianceCheck from './pages/ComplianceCheck';
import { Evidence } from './pages/Evidence';
import Journey from './pages/Journey';
import Documentation from './pages/Documentation';
import { Policies } from './pages/Policies';
import { SOPs } from './pages/SOPs';
import { ImportExport } from './pages/ImportExport';
import { Settings } from './pages/Settings';
import { Pricing } from './pages/Pricing';
// Admin pages
import { ManagePractices } from './pages/admin/ManagePractices';
import { UserManagement } from './pages/admin/UserManagement';
import { SystemStatus } from './pages/admin/SystemStatus';

const AppContent: React.FC = () => {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Configuration Required
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            {configError}
          </p>
          <div className="bg-gray-50 rounded-md p-4 text-sm">
            <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root</li>
              <li>Add your Supabase project URL and anon key</li>
              <li>Restart the development server</li>
            </ol>
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
              <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your_anon_key_here</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <EnhancedLoginForm />;
  }

  return (
    <SubscriptionProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/skills-matrix" element={<SkillsMatrix />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/compliance-check" element={<ComplianceCheck />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/sops" element={<SOPs />} />
            <Route path="/import-export" element={<ImportExport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/admin/practices" element={<ManagePractices />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/system" element={<SystemStatus />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </SubscriptionProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;