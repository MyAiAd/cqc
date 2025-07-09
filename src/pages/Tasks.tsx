import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { RiskBadge } from '../components/ui/Badge';
import { sampleTasks, sampleStaff } from '../data/sampleData';
import { Task, TaskFrequency, RiskRating } from '../types';

type SortField = 'name' | 'frequency' | 'risk' | 'owner' | 'lastUpdated';
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

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>(sampleTasks);
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | undefined>(undefined);
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
    setShowTaskForm(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = (taskData: Partial<Task>) => {
    if (selectedTask) {
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, ...taskData, updatedAt: new Date() } 
          : task
      );
      setTasks(updatedTasks);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        name: taskData.name || '',
        description: taskData.description || '',
        category: taskData.category || 'Daily',
        sopLink: taskData.sopLink,
        policyLink: taskData.policyLink,
        riskRating: taskData.riskRating || 'Medium',
        competencies: taskData.competencies || [],
        owner: taskData.owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks([...tasks, newTask]);
    }
    setShowTaskForm(false);
    setSelectedTask(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Task Management</h1>
        <Button onClick={handleNewTask} leftIcon={<Plus className="h-4 w-4" />}>
          Add New Task
        </Button>
      </div>

      {showTaskForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTask ? 'Edit Task' : 'Add New Task'}</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              task={selectedTask}
              staffList={sampleStaff}
              onSubmit={handleTaskSubmit}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask(undefined);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};