import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SkillsMatrixTable } from '../components/skillsMatrix/SkillsMatrixTable';
import { CategoryFilter } from '../components/skillsMatrix/CategoryFilter';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TaskForm } from '../components/tasks/TaskForm';
import { sampleTasks, sampleStaff } from '../data/sampleData';
import { Task, TaskFrequency } from '../types';

export const SkillsMatrix: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Extract unique frequencies
  const categories = Array.from(
    new Set(tasks.map(task => task.category))
  ) as TaskFrequency[];
  
  // Extract staff IDs
  const staffIds = sampleStaff.map(staff => staff.id);
  
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
  
  const handleTaskSubmit = (taskData: Partial<Task>) => {
    if (selectedTask) {
      // Update existing task
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, ...taskData, updatedAt: new Date() } 
          : task
      );
      setTasks(updatedTasks);
    } else {
      // Create new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        name: taskData.name || '',
        description: taskData.description || '',
        category: taskData.category as TaskFrequency || 'Daily',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-bold text-neutral-900">Skills Matrix</h1>
        <Button onClick={handleNewTask} leftIcon={<Plus className="h-4 w-4" />}>
          Add New Task
        </Button>
      </div>
      
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      {showTaskForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTask ? 'Edit Task' : 'Add New Task'}
            </CardTitle>
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
        <SkillsMatrixTable
          tasks={tasks}
          selectedCategory={selectedCategory}
          staffIds={staffIds}
          onTaskClick={handleTaskClick}
        />
      )}
    </div>
  );
};