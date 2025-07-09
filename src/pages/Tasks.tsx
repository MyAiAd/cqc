import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { RiskBadge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, getStaff, createTask, updateTask, getAllPractices } from '../services/dataService';
import { Task, Staff, TaskFrequency, RiskRating } from '../types';

type SortField = 'name' | 'frequency' | 'risk' | 'owner' | 'lastUpdated' | 'practiceName';
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

interface Practice {
  id: string;
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
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

export const Tasks: React.FC = () => {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: 'asc' });

  // Custom sort orders
  const frequencyOrder: Record<TaskFrequency, number> = {
    'Continuous': 0,
    'Daily': 1,
    'Weekly': 2,
    'Monthly': 3,
    'Quarterly': 4
  };

  const riskOrder: Record<RiskRating, number> = {
    'Low': 0,
    'Medium-Low': 1,
    'Medium': 2,
    'Medium-High': 3,
    'High': 4
  };

  useEffect(() => {
    loadData();
    loadPractices();
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksData, staffData] = await Promise.all([
        getTasks(),
        getStaff()
      ]);
      
      setTasks(tasksData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load tasks and staff data. Please try again.');
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

  const handleSort = (field: SortField) => {
    setSortState(prevState => ({
      field,
      direction: prevState.field === field && prevState.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort tasks based on current sort state
  const sortedTasks = useMemo(() => {
    if (!sortState.field) return tasks;

    return [...tasks].sort((a, b) => {
      let aValue, bValue;

      switch (sortState.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        
        case 'frequency':
          aValue = frequencyOrder[a.category];
          bValue = frequencyOrder[b.category];
          break;
        
        case 'risk':
          aValue = riskOrder[a.riskRating];
          bValue = riskOrder[b.riskRating];
          break;
        
        case 'owner':
          aValue = (a.owner || '').toLowerCase();
          bValue = (b.owner || '').toLowerCase();
          break;
        
        case 'lastUpdated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
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
  }, [tasks, sortState, frequencyOrder, riskOrder]);

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setSelectedPracticeId(userProfile?.practice_id || '');
    setShowTaskForm(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedPracticeId(task.practiceId || userProfile?.practice_id || '');
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      setIsCreating(true);
      setError(null);

      // Validate practice selection for super admin creating new tasks
      if (!selectedTask && userProfile?.role === 'super_admin' && !selectedPracticeId) {
        setError('Please select a practice for the new task.');
        return;
      }

      if (selectedTask) {
        // Update existing task
        const success = await updateTask(selectedTask.id, {
          name: taskData.name,
          description: taskData.description,
          category: taskData.category,
          sopLink: taskData.sopLink,
          policyLink: taskData.policyLink,
          riskRating: taskData.riskRating,
          owner: taskData.owner,
        });

        if (success) {
          // Refresh tasks to get updated data
          await loadData();
        } else {
          setError('Failed to update task. Please try again.');
          return;
        }
      } else {
        // Create new task
        const targetPracticeId = userProfile?.role === 'super_admin' 
          ? selectedPracticeId 
          : userProfile?.practice_id || undefined;

        const newTask = await createTask({
          name: taskData.name || '',
          description: taskData.description || '',
          category: taskData.category || 'Daily',
          sopLink: taskData.sopLink,
          policyLink: taskData.policyLink,
          riskRating: taskData.riskRating || 'Medium',
          owner: taskData.owner,
        }, targetPracticeId);

        if (newTask) {
          // Refresh tasks to include the new one
          await loadData();
        } else {
          setError('Failed to create task. Please try again.');
          return;
        }
      }

      setShowTaskForm(false);
      setSelectedTask(undefined);
      setSelectedPracticeId('');
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setShowTaskForm(false);
    setSelectedTask(undefined);
    setSelectedPracticeId('');
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
        <h1 className="text-2xl font-bold text-neutral-900">Task Management</h1>
        <Button onClick={handleNewTask} leftIcon={<Plus className="h-4 w-4" />}>
          Add New Task
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {showTaskForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTask ? 'Edit Task' : 'Add New Task'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Practice Selection for Super Admin */}
            {userProfile?.role === 'super_admin' && !selectedTask && (
              <div className="mb-6">
                <label htmlFor="practice-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Practice *
                </label>
                <select
                  id="practice-select"
                  value={selectedPracticeId}
                  onChange={(e) => setSelectedPracticeId(e.target.value)}
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
                <p className="mt-1 text-sm text-gray-600">
                  This task will be created for the selected practice.
                </p>
              </div>
            )}
            
            {/* Show practice info for existing task edits */}
            {selectedTask && userProfile?.role === 'super_admin' && selectedTask.practiceName && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Practice:</strong> {selectedTask.practiceName}
                </p>
              </div>
            )}

            <TaskForm
              task={selectedTask}
              staffList={staff}
              onSubmit={handleTaskSubmit}
              onCancel={handleCancel}
            />
            {isCreating && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-sm text-gray-600">
                  {selectedTask ? 'Updating task...' : 'Creating task...'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first task.
                </p>
                <Button onClick={handleNewTask} leftIcon={<Plus className="h-4 w-4" />}>
                  Add New Task
                </Button>
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
                      Task Name
                    </SortableHeader>
                    
                    <SortableHeader
                      field="frequency"
                      currentSort={sortState}
                      onSort={handleSort}
                    >
                      Frequency
                    </SortableHeader>
                    
                    <SortableHeader
                      field="risk"
                      currentSort={sortState}
                      onSort={handleSort}
                    >
                      Risk
                    </SortableHeader>
                    
                    <SortableHeader
                      field="owner"
                      currentSort={sortState}
                      onSort={handleSort}
                    >
                      Owner
                    </SortableHeader>

                    {/* Practice column for super admin */}
                    {userProfile?.role === 'super_admin' && (
                      <SortableHeader
                        field="practiceName"
                        currentSort={sortState}
                        onSort={handleSort}
                      >
                        Practice
                      </SortableHeader>
                    )}
                    
                    <SortableHeader
                      field="lastUpdated"
                      currentSort={sortState}
                      onSort={handleSort}
                    >
                      Last Updated
                    </SortableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedTasks.map(task => (
                    <TableRow 
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="cursor-pointer hover:bg-neutral-50"
                    >
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{task.category}</TableCell>
                      <TableCell><RiskBadge risk={task.riskRating} /></TableCell>
                      <TableCell>{task.owner || '—'}</TableCell>
                      {/* Practice column for super admin */}
                      {userProfile?.role === 'super_admin' && (
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {task.practiceName || 'Unknown Practice'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        {task.updatedAt.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};