import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const { userProfile, practice, signOut } = useAuth();
  
  const getHeaderText = (pathname: string) => {
    const routes: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/tasks': 'Task Management',
      '/compliance': 'Compliance Overview',
      '/reports': 'Analytics & Reports',
      '/staff': 'Staff Manager',
      '/settings': 'Settings',
      '/admin': 'Admin Panel',
    };

    if (pathname.startsWith('/task/')) return 'Task Details';
    if (pathname.startsWith('/staff/')) return 'Staff Details';
    if (pathname.startsWith('/admin/')) return 'Admin Details';

    return routes[pathname] || 'Harmony360';
  };

  const pageName = getHeaderText(location.pathname);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button 
            className="text-neutral-500 focus:outline-none lg:hidden"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          <h1 className="ml-3 text-xl font-semibold text-neutral-900 lg:ml-0">
            {pageName}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userProfile ? getInitials(userProfile.name) : 'UN'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm text-neutral-700 block">
                  {userProfile?.name || 'Unknown User'}
                </span>
                <span className="text-xs text-neutral-500 block">
                  {practice?.name || 'Unknown Practice'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-900">{userProfile?.name}</p>
                  <p className="text-xs text-neutral-500">{userProfile?.email}</p>
                  <p className="text-xs text-neutral-500 mt-1">{practice?.name}</p>
                </div>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;