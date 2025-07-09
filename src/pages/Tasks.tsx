import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { RiskBadge } from '../components/ui/Badge';
import { sampleTasks, sampleStaff } from '../data/sampleData';
import { Task } from '../types';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>(sampleTasks);
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | undefined>(undefined);

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
                  <TableHeaderCell>Task Name</TableHeaderCell>
                  <TableHeaderCell>Frequency</TableHeaderCell>
                  <TableHeaderCell>Risk</TableHeaderCell>
                  <TableHeaderCell>Owner</TableHeaderCell>
                  <TableHeaderCell>Last Updated</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(task => (
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