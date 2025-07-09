import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SkillsMatrixTable } from '../components/skillsMatrix/SkillsMatrixTable';
import { CategoryFilter } from '../components/skillsMatrix/CategoryFilter';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TaskForm } from '../components/tasks/TaskForm';
import { getTasks, getStaff } from '../services/dataService';
import { Task, Staff, TaskFrequency } from '../types';

export const SkillsMatrix: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, staffData] = await Promise.all([
        getTasks(),
        getStaff()
      ]);
      setTasks(tasksData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Extract unique frequencies
  const categories = Array.from(
    new Set(tasks.map(task => task.category))
  ) as TaskFrequency[];
  
  // Extract staff IDs
  const staffIds = staff.map(staff => staff.id);
  
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };
  
  const handleNewTask = () => {
    setSelectedTask(undefined);
    setShowTaskForm(true);
  };
  
  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    // Handle task submission logic here
    console.log('Task submitted:', taskData);
    setShowTaskForm(false);
    setSelectedTask(undefined);
    // Reload data to reflect changes
    await loadData();
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
        <h1 className="text-2xl font-bold text-neutral-900">Skills Matrix</h1>
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
              staffList={staff}
              onSubmit={handleTaskSubmit}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask(undefined);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
          
          <Card>
            <CardContent>
              <SkillsMatrixTable
                tasks={tasks}
                staffIds={staffIds}
                selectedCategory={selectedCategory}
                onTaskClick={handleTaskClick}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};