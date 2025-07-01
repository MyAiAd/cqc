import React, { useEffect, useState } from 'react';
import { Shield, Users, Plus, Edit, Eye, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAllUsers, getAllPractices, createUser } from '../../services/dataService';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'manager' | 'super_admin';
  practice_id: string;
  practice?: {
    name: string;
    email_domain: string;
  };
  created_at: string;
  updated_at: string;
}

interface Practice {
  id: string;
  name: string;
  email_domain: string;
}

// Role hierarchy definition
const ROLE_HIERARCHY = {
  'super_admin': ['super_admin', 'admin', 'manager', 'staff'],
  'admin': ['admin', 'manager', 'staff'],
  'manager': ['staff'],
  'staff': []
};

const UserManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { canAddUser, refreshSubscription } = useSubscription();
  const [users, setUsers] = useState<User[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'staff' as 'admin' | 'staff' | 'manager' | 'super_admin',
    practice_id: userProfile?.practice_id || ''
  });

  // Get roles that current user can create
  const getAvailableRoles = (): string[] => {
    if (!userProfile?.role) return [];
    return ROLE_HIERARCHY[userProfile.role as keyof typeof ROLE_HIERARCHY] || [];
  };

  // Check if user has permission to access user management
  const hasUserManagementAccess = (): boolean => {
    if (!userProfile?.role) return false;
    return ['super_admin', 'admin', 'manager'].includes(userProfile.role);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Only fetch data if user has proper permissions
        if (!hasUserManagementAccess()) {
          setLoading(false);
          return;
        }

        // Check if user can add more users (for non-super admins)
        if (userProfile?.role !== 'super_admin') {
          const canAdd = await canAddUser();
          setCanCreateUser(canAdd);
        }

        const [usersData, practicesData] = await Promise.all([
          getAllUsers(),
          getAllPractices()
        ]);

        if (usersData) {
          // Filter users based on current user's role and practice
          let filteredUsers = usersData;
          
          if (userProfile?.role === 'manager') {
            // Managers can only see staff in their practice
            filteredUsers = usersData.filter(user => 
              user.practice_id === userProfile.practice_id && user.role === 'staff'
            );
          } else if (userProfile?.role === 'admin') {
            // Admins can see all users in their practice
            filteredUsers = usersData.filter(user => 
              user.practice_id === userProfile.practice_id
            );
          }
          // Super admins see all users (no filtering)
          
          setUsers(filteredUsers);
        }

        if (practicesData) {
          // Filter practices based on role
          if (userProfile?.role === 'super_admin') {
            setPractices(practicesData);
          } else {
            // Non-super admins only see their own practice
            const userPractice = practicesData.find(p => p.id === userProfile?.practice_id);
            setPractices(userPractice ? [userPractice] : []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleCreateUser called');
    console.log('Current userProfile:', userProfile);
    console.log('Form data:', newUser);
    
    try {
      // Check subscription limits for non-super admins
      if (userProfile?.role !== 'super_admin') {
        const canAdd = await canAddUser();
        if (!canAdd) {
          alert('User limit reached for your subscription plan. Please upgrade to add more users.');
          return;
        }
      }

      // Validate that user can create this role
      const availableRoles = getAvailableRoles();
      console.log('Available roles:', availableRoles);
      
      if (!availableRoles.includes(newUser.role)) {
        console.error('Role validation failed:', { requestedRole: newUser.role, availableRoles });
        alert('You do not have permission to create users with this role.');
        return;
      }

      // For non-super admins, force practice_id to their own practice
      const finalUserData = {
        ...newUser,
        practice_id: userProfile?.role === 'super_admin' ? newUser.practice_id : userProfile?.practice_id || ''
      };
      
      console.log('Final user data to be sent:', finalUserData);

      // Validate required fields
      if (!finalUserData.email || !finalUserData.name || !finalUserData.practice_id) {
        console.error('Missing required fields:', finalUserData);
        alert('Please fill in all required fields.');
        return;
      }

      const createdUser = await createUser(finalUserData);
      
      if (createdUser) {
        console.log('User creation successful, refreshing user list');
        // Refresh the users list
        const updatedUsers = await getAllUsers();
        if (updatedUsers) {
          setUsers(updatedUsers);
        }
        
        // Refresh subscription data to update usage counts
        await refreshSubscription();
        
        // Check if user can still add more users
        if (userProfile?.role !== 'super_admin') {
          const canAdd = await canAddUser();
          setCanCreateUser(canAdd);
        }
        
        // Reset form and close modal
        setNewUser({
          email: '',
          name: '',
          role: 'staff',
          practice_id: userProfile?.practice_id || ''
        });
        setShowCreateModal(false);
        
        alert('User created successfully! The user can now sign up with this email address to activate their account.');
      }
    } catch (error) {
      console.error('Error in handleCreateUser:', error);
      
      // More detailed error message
      let errorMessage = 'Error creating user. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Error creating user: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Redirect if no access
  if (!hasUserManagementAccess()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. User management privileges required.</p>
          <p className="text-sm text-gray-500 mt-2">
            Available to: {ROLE_HIERARCHY[userProfile?.role as keyof typeof ROLE_HIERARCHY]?.length ? 'Admin, Manager, Super Admin' : 'Contact your administrator'}
          </p>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelText = () => {
    switch (userProfile?.role) {
      case 'super_admin': return 'System-wide access';
      case 'admin': return `Practice access: ${userProfile.practice?.name}`;
      case 'manager': return `Team management: ${userProfile.practice?.name}`;
      default: return 'Limited access';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.practice?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const availableRoles = getAvailableRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-primary-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">{getAccessLevelText()}</p>
          <p className="text-sm text-gray-500">
            You can create: {availableRoles.join(', ') || 'No creation permissions'}
          </p>
        </div>
        
        {availableRoles.length > 0 && (
          <div className="flex flex-col items-end space-y-2">
            {!canCreateUser && userProfile?.role !== 'super_admin' && (
              <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-1" />
                User limit reached
              </div>
            )}
            <Button 
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={!canCreateUser && userProfile?.role !== 'super_admin'}
              className={!canCreateUser && userProfile?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Create User
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {userProfile?.role === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Practice
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    {userProfile?.role === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.practice?.name}</div>
                        <div className="text-sm text-gray-500">{user.practice?.email_domain}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' | 'manager' | 'super_admin' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {userProfile?.role === 'super_admin' && (
                <div>
                  <label htmlFor="practice" className="block text-sm font-medium text-gray-700 mb-1">
                    Practice *
                  </label>
                  <select
                    id="practice"
                    value={newUser.practice_id}
                    onChange={(e) => setNewUser(prev => ({ ...prev, practice_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a practice</option>
                    {practices.map(practice => (
                      <option key={practice.id} value={practice.id}>
                        {practice.name} ({practice.email_domain})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The user will be able to sign up with this email address to activate their account and set their password.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { UserManagement }; 