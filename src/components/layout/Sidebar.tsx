import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListChecks, 
  FileSpreadsheet, 
  Import, 
  Settings,
  Users,
  CheckSquare,
  FileText,
  Shield,
  Database,
  Building,
  CreditCard,
  FolderOpen,
  Map,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calculateCQCCompliance } from '../../data/cqcCompliance';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-primary-100 text-primary-800 border-r-2 border-primary-600' 
          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
        }
      `}
    >
      <span className="mr-3 h-5 w-5">{icon}</span>
      {label}
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const complianceReport = calculateCQCCompliance();
  
  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-20 bg-white shadow-lg transition-transform transform lg:translate-x-0 lg:static lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full w-64">
        <div className="flex items-center justify-center h-16 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-primary-800">
            Harmony360
            {isSuperAdmin && <span className="text-xs block text-primary-600">ADMIN</span>}
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavItem
            to="/"
            icon={<LayoutDashboard />}
            label={isSuperAdmin ? "Admin Dashboard" : "Dashboard"}
            isActive={location.pathname === '/'}
          />

          {isSuperAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-neutral-200">
                <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  System Admin
                </h3>
                <NavItem
                  to="/admin/practices"
                  icon={<Building />}
                  label="Manage Practices"
                  isActive={location.pathname === '/admin/practices'}
                />
                <NavItem
                  to="/admin/users"
                  icon={<Shield />}
                  label="User Management"
                  isActive={location.pathname === '/admin/users'}
                />
                <NavItem
                  to="/admin/system"
                  icon={<Database />}
                  label="System Status"
                  isActive={location.pathname === '/admin/system'}
                />
              </div>
            </>
          )}
          
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {isSuperAdmin ? "Practice Tools" : "Main"}
            </h3>
            <NavItem
              to="/skills-matrix"
              icon={<FileSpreadsheet />}
              label="Skills Matrix"
              isActive={location.pathname === '/skills-matrix'}
            />
            <NavItem
              to="/tasks"
              icon={<ListChecks />}
              label="Task Management"
              isActive={location.pathname === '/tasks'}
            />
            <NavItem
              to="/staff"
              icon={<Users />}
              label="Staff Management"
              isActive={location.pathname === '/staff'}
            />
          </div>
          
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Compliance
            </h3>
            <NavItem
              to="/compliance-check"
              icon={<CheckSquare />}
              label="CQC Compliance"
              isActive={location.pathname === '/compliance-check'}
            />
            <NavItem
              to="/journey"
              icon={<Map />}
              label="Compliance Journey"
              isActive={location.pathname === '/journey'}
            />
            <NavItem
              to="/evidence"
              icon={<FolderOpen />}
              label="Evidence Management"
              isActive={location.pathname === '/evidence'}
            />
            <NavItem
              to="/policies"
              icon={<FileText />}
              label="Policies & SOPs"
              isActive={location.pathname === '/policies'}
            />
          </div>
          
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              System
            </h3>
            <NavItem
              to="/documentation"
              icon={<BookOpen />}
              label="Documentation"
              isActive={location.pathname === '/documentation'}
            />
            <NavItem
              to="/import-export"
              icon={<Import />}
              label="Import / Export"
              isActive={location.pathname === '/import-export'}
            />
            <NavItem
              to="/settings"
              icon={<Settings />}
              label="Settings"
              isActive={location.pathname === '/settings'}
            />
            <NavItem
              to="/pricing"
              icon={<CreditCard />}
              label="Pricing & Plans"
              isActive={location.pathname === '/pricing'}
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="rounded-md bg-primary-50 p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">
                  {isSuperAdmin ? "System Status" : "CQC Ready"}
                </h3>
                <p className="text-xs text-primary-600 mt-1">
                  {isSuperAdmin 
                    ? "All systems operational" 
                    : `Your practice is compliant with ${complianceReport.overallScore}% of CQC requirements`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};