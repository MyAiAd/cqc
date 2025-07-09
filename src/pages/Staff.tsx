import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertTriangle, X, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getStaff, createStaff, getAllPractices, updateStaff, deleteStaff, getStaffById } from '../services/dataService';
import { Staff as StaffType } from '../types';

type SortField = 'name' | 'role' | 'department' | 'email' | 'practiceName';

interface SortState {
  field: SortField | null;
  direction: 'asc' | 'desc';
}

interface Practice {
  id: string;
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
}

export const Staff: React.FC = () => {
  const { userProfile } = useAuth();
  const { canAddStaff, refreshSubscription } = useSubscription();
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreateStaff, setCanCreateStaff] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: 'asc' });
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    practice_id: userProfile?.practice_id || ''
  });
  const [editStaff, setEditStaff] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    practice_id: ''
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
        
        case 'practiceName':
          aValue = (a.practiceName || '').toLowerCase();
          bValue = (b.practiceName || '').toLowerCase();
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
    loadPractices();
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

  const loadPractices = async () => {
    // Only load practices if user is super admin
    if (userProfile?.role === 'super_admin') {
      try {
        const practicesData = await getAllPractices();
        setPractices(practicesData);
      } catch (error) {
        console.error('Error loading practices:', error);
      }
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
    
    console.log('=== STAFF CREATION DEBUG START ===');
    console.log('User Profile:', userProfile);
    console.log('Form Data:', newStaff);
    console.log('Practices Available:', practices);
    
    try {
      setIsCreating(true);
      setError(null);

      console.log('Step 1: Checking user role and subscription limits...');
      
      // Check subscription limits for non-super admins
      if (userProfile?.role !== 'super_admin') {
        console.log('Non-super admin user detected, checking subscription limits...');
        const canAdd = await canAddStaff();
        console.log('Can add staff:', canAdd);
        if (!canAdd) {
          console.log('Staff limit reached for subscription plan');
          setError('Staff limit reached for your subscription plan. Please upgrade to add more staff members.');
          return;
        }
      } else {
        console.log('Super admin user detected, bypassing subscription limits');
      }

      console.log('Step 2: Validating required fields...');
      
      // Validate required fields
      if (!newStaff.name.trim()) {
        console.log('Validation failed: Name is required');
        setError('Please enter a staff member name.');
        return;
      }
      console.log('Name validation passed:', newStaff.name.trim());

      // For super admin, validate practice selection
      if (userProfile?.role === 'super_admin' && !newStaff.practice_id) {
        console.log('Validation failed: Practice selection required for super admin');
        setError('Please select a practice.');
        return;
      }
      console.log('Practice validation passed');

      console.log('Step 3: Determining target practice ID...');
      
      // Determine target practice ID
      const targetPracticeId = userProfile?.role === 'super_admin' 
        ? newStaff.practice_id 
        : userProfile?.practice_id;

      console.log('Target Practice ID:', targetPracticeId);
      console.log('Selected by super admin:', userProfile?.role === 'super_admin' ? newStaff.practice_id : 'N/A');
      console.log('User practice ID:', userProfile?.practice_id);

      if (!targetPracticeId) {
        console.log('ERROR: Unable to determine target practice ID');
        setError('Unable to determine practice. Please try again.');
        return;
      }

      console.log('Step 4: Preparing staff data for creation...');
      
      const staffDataToCreate = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim() || undefined,
        role: newStaff.role.trim() || undefined,
        department: newStaff.department.trim() || undefined,
      };
      
      console.log('Staff data to create:', staffDataToCreate);
      console.log('Target practice ID for creation:', targetPracticeId);

      console.log('Step 5: Calling createStaff function...');
      
      const createdStaff = await createStaff(staffDataToCreate, targetPracticeId);
      
      console.log('Step 6: createStaff result:', createdStaff);

      if (createdStaff) {
        console.log('SUCCESS: Staff member created successfully!', createdStaff);
        
        console.log('Step 7: Refreshing staff list...');
        await loadStaff();
        
        console.log('Step 8: Refreshing subscription data...');
        await refreshSubscription();
        
        console.log('Step 9: Checking staff limits...');
        await checkStaffLimit();
        
        console.log('Step 10: Resetting form and closing modal...');
        setNewStaff({
          name: '',
          email: '',
          role: '',
          department: '',
          practice_id: userProfile?.practice_id || ''
        });
        setShowCreateModal(false);
        
        console.log('=== STAFF CREATION SUCCESS ===');
      } else {
        console.log('ERROR: createStaff returned null/undefined');
        setError('Failed to create staff member. The function returned no result.');
      }
    } catch (error) {
      console.error('=== STAFF CREATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Full error object:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setError(`Error creating staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('=== STAFF CREATION DEBUG END ===');
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setNewStaff({
      name: '',
      email: '',
      role: '',
      department: '',
      practice_id: userProfile?.practice_id || ''
    });
    setError(null);
  };

  // Handle View Staff
  const handleViewStaff = async (staffMember: StaffType) => {
    try {
      setSelectedStaff(staffMember);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error viewing staff:', error);
      setError('Failed to view staff member details');
    }
  };

  // Handle Edit Staff
  const handleEditStaff = async (staffMember: StaffType) => {
    try {
      // Get full staff details
      const fullStaffDetails = await getStaffById(staffMember.id);
      if (!fullStaffDetails) {
        setError('Failed to load staff member details');
        return;
      }

      setSelectedStaff(fullStaffDetails);
      setEditStaff({
        name: fullStaffDetails.name,
        email: fullStaffDetails.email || '',
        role: fullStaffDetails.role || '',
        department: fullStaffDetails.department || '',
        practice_id: fullStaffDetails.practiceId || userProfile?.practice_id || ''
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error preparing staff for edit:', error);
      setError('Failed to load staff member details for editing');
    }
  };

  // Handle Update Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Validate required fields
      if (!editStaff.name.trim()) {
        setError('Please enter a staff member name.');
        return;
      }

      // For super admin, validate practice selection
      if (userProfile?.role === 'super_admin' && !editStaff.practice_id) {
        setError('Please select a practice.');
        return;
      }

      const staffDataToUpdate = {
        name: editStaff.name.trim(),
        email: editStaff.email.trim() || undefined,
        role: editStaff.role.trim() || undefined,
        department: editStaff.department.trim() || undefined,
      };

      const targetPracticeId = userProfile?.role === 'super_admin' 
        ? editStaff.practice_id 
        : undefined;

      const updatedStaff = await updateStaff(selectedStaff.id, staffDataToUpdate, targetPracticeId);

      if (updatedStaff) {
        await loadStaff();
        setShowEditModal(false);
        setSelectedStaff(null);
        setError(null);
      } else {
        setError('Failed to update staff member.');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setError(`Error updating staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = (staffMember: StaffType) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    try {
      setIsDeleting(true);
      setError(null);

      const success = await deleteStaff(selectedStaff.id);

      if (success) {
        await loadStaff();
        setShowDeleteModal(false);
        setSelectedStaff(null);
        setError(null);
      } else {
        setError('Failed to delete staff member.');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError(`Error deleting staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all modals
  const resetAllModals = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedStaff(null);
    setNewStaff({
      name: '',
      email: '',
      role: '',
      department: '',
      practice_id: userProfile?.practice_id || ''
    });
    setEditStaff({
      name: '',
      email: '',
      role: '',
      department: '',
      practice_id: ''
    });
    setError(null);
  };

  // Get current practice name for display
  const getCurrentPracticeName = () => {
    if (userProfile?.role === 'super_admin') {
      return 'Select Practice';
    }
    return userProfile?.practice?.name || 'Current Practice';
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
                  <TableHeaderCell 
                    isSortable 
                    isSorted={sortState.field === 'name'}
                    isSortedDesc={sortState.field === 'name' && sortState.direction === 'desc'}
                    onSort={() => handleSort('name')}
                  >
                    Name
                  </TableHeaderCell>
                  <TableHeaderCell 
                    isSortable 
                    isSorted={sortState.field === 'role'}
                    isSortedDesc={sortState.field === 'role' && sortState.direction === 'desc'}
                    onSort={() => handleSort('role')}
                  >
                    Role
                  </TableHeaderCell>
                  <TableHeaderCell 
                    isSortable 
                    isSorted={sortState.field === 'department'}
                    isSortedDesc={sortState.field === 'department' && sortState.direction === 'desc'}
                    onSort={() => handleSort('department')}
                  >
                    Department
                  </TableHeaderCell>
                  <TableHeaderCell 
                    isSortable 
                    isSorted={sortState.field === 'email'}
                    isSortedDesc={sortState.field === 'email' && sortState.direction === 'desc'}
                    onSort={() => handleSort('email')}
                  >
                    Email
                  </TableHeaderCell>
                  {/* Practice column for super admin */}
                  {userProfile?.role === 'super_admin' && (
                    <TableHeaderCell 
                      isSortable 
                      isSorted={sortState.field === 'practiceName'}
                      isSortedDesc={sortState.field === 'practiceName' && sortState.direction === 'desc'}
                      onSort={() => handleSort('practiceName')}
                    >
                      Practice
                    </TableHeaderCell>
                  )}
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
                    {/* Practice column for super admin */}
                    {userProfile?.role === 'super_admin' && (
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.practiceName || 'Unknown Practice'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="View Details"
                          onClick={() => handleViewStaff(member)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit Staff Member"
                          onClick={() => handleEditStaff(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Staff Member"
                          onClick={() => handleDeleteStaff(member)}
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

              {/* Practice Name Field */}
              <div>
                <label htmlFor="practice" className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Name {userProfile?.role === 'super_admin' ? '*' : ''}
                </label>
                {userProfile?.role === 'super_admin' ? (
                  <select
                    id="practice"
                    value={newStaff.practice_id}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, practice_id: e.target.value }))}
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
                ) : (
                  <input
                    type="text"
                    id="practice"
                    value={getCurrentPracticeName()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will add a staff member to {userProfile?.role === 'super_admin' ? 'the selected practice' : 'your practice'} directory for task assignments and competency tracking.
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

      {/* View Staff Modal */}
      {showViewModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Member Details</h3>
              <button
                onClick={resetAllModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{selectedStaff.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-900">{selectedStaff.email || 'Not provided'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900">{selectedStaff.role || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900">{selectedStaff.department || 'Not specified'}</p>
              </div>

              {userProfile?.role === 'super_admin' && selectedStaff.practiceName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practice</label>
                  <p className="text-gray-900">{selectedStaff.practiceName}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAllModals}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditStaff(selectedStaff);
                  }}
                >
                  Edit Staff Member
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Staff Member</h3>
              <button
                onClick={resetAllModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editStaff.name}
                  onChange={(e) => setEditStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={editStaff.email}
                  onChange={(e) => setEditStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="edit-role"
                  value={editStaff.role}
                  onChange={(e) => setEditStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Nurse, Doctor, Admin"
                />
              </div>

              <div>
                <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="edit-department"
                  value={editStaff.department}
                  onChange={(e) => setEditStaff(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Clinical, Administrative"
                />
              </div>

              {/* Practice Name Field for Super Admin */}
              {userProfile?.role === 'super_admin' && (
                <div>
                  <label htmlFor="edit-practice" className="block text-sm font-medium text-gray-700 mb-1">
                    Practice Name *
                  </label>
                  <select
                    id="edit-practice"
                    value={editStaff.practice_id}
                    onChange={(e) => setEditStaff(prev => ({ ...prev, practice_id: e.target.value }))}
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAllModals}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <button
                onClick={resetAllModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedStaff.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. This will permanently delete the staff member and all associated competency records.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetAllModals}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};