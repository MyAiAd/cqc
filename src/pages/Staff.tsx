import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertTriangle, X, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getStaff, createStaff } from '../services/dataService';
import { Staff as StaffType } from '../types';

type SortField = 'name' | 'role' | 'department' | 'email';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

interface SortableHeaderProps {
  children: React.ReactNode;
  field: SortField;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  children, 
  field, 
  currentSort, 
  onSort, 
  className = '' 
}) => {
  const isActive = currentSort.field === field;
  
  return (
    <TableHeaderCell 
      className={className}
      isSortable={true}
      isSorted={isActive}
      isSortedDesc={isActive && currentSort.direction === 'desc'}
      onSort={() => onSort(field)}
    >
      {children}
    </TableHeaderCell>
  );
};

export const Staff: React.FC = () => {
  const { userProfile } = useAuth();
  const { canAddStaff, refreshSubscription } = useSubscription();
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreateStaff, setCanCreateStaff] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: 'asc' });
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  const handleSort = (field: SortField) => {
    setSortState(prevState => ({
      field,
      direction: prevState.field === field && prevState.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort staff based on current sort state
  const sortedStaff = useMemo(() => {
    if (!sortState.field) return staff;

    return [...staff].sort((a, b) => {
      let aValue, bValue;

      switch (sortState.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        
        case 'role':
          aValue = (a.role || '').toLowerCase();
          bValue = (b.role || '').toLowerCase();
          break;
        
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortState.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortState.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [staff, sortState]);

  useEffect(() => {
    loadStaff();
    checkStaffLimit();
  }, [userProfile]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const staffData = await getStaff();
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const checkStaffLimit = async () => {
    if (userProfile?.role !== 'super_admin') {
      const canAdd = await canAddStaff();
      setCanCreateStaff(canAdd);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      setError(null);

      // Check subscription limits for non-super admins
      if (userProfile?.role !== 'super_admin') {
        const canAdd = await canAddStaff();
        if (!canAdd) {
          setError('Staff limit reached for your subscription plan. Please upgrade to add more staff members.');
          return;
        }
      }

      // Validate required fields
      if (!newStaff.name.trim()) {
        setError('Please enter a staff member name.');
        return;
      }

      const createdStaff = await createStaff({
        name: newStaff.name.trim(),
        email: newStaff.email.trim() || undefined,
        role: newStaff.role.trim() || undefined,
        department: newStaff.department.trim() || undefined,
      });

      if (createdStaff) {
        // Refresh the staff list
        await loadStaff();
        
        // Refresh subscription data to update usage counts
        await refreshSubscription();
        
        // Check if user can still add more staff
        await checkStaffLimit();
        
        // Reset form and close modal
        setNewStaff({
          name: '',
          email: '',
          role: '',
          department: ''
        });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setError('Error creating staff member. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setNewStaff({
      name: '',
      email: '',
      role: '',
      department: ''
    });
    setError(null);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Staff Management</h1>
        <div className="flex flex-col items-end space-y-2">
          {!canCreateStaff && userProfile?.role !== 'super_admin' && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Staff limit reached
            </div>
          )}
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={!canCreateStaff && userProfile?.role !== 'super_admin'}
            className={!canCreateStaff && userProfile?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}
            onClick={() => setShowCreateModal(true)}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first staff member.
              </p>
              {(canCreateStaff || userProfile?.role === 'super_admin') && (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <SortableHeader
                    field="name"
                    currentSort={sortState}
                    onSort={handleSort}
                  >
                    Name
                  </SortableHeader>
                  
                  <SortableHeader
                    field="role"
                    currentSort={sortState}
                    onSort={handleSort}
                  >
                    Role
                  </SortableHeader>
                  
                  <SortableHeader
                    field="department"
                    currentSort={sortState}
                    onSort={handleSort}
                  >
                    Department
                  </SortableHeader>
                  
                  <SortableHeader
                    field="email"
                    currentSort={sortState}
                    onSort={handleSort}
                  >
                    Email
                  </SortableHeader>
                  
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedStaff.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role || '-'}</TableCell>
                    <TableCell>{member.department || '-'}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit Staff Member"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Staff Member</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Nurse, Doctor, Admin"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={newStaff.department}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Clinical, Administrative"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will add a staff member to your practice directory for task assignments and competency tracking.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};