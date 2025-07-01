import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Task } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TasksByRiskChartProps {
  tasks: Task[];
}

export const TasksByRiskChart: React.FC<TasksByRiskChartProps> = ({ tasks }) => {
  // Count tasks by risk level
  const riskCounts = tasks.reduce(
    (acc, task) => {
      acc[task.riskRating]++;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0 }
  );
  
  const data: ChartData<'doughnut'> = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [riskCounts.Low, riskCounts.Medium, riskCounts.High],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',  // Success/Green for Low
          'rgba(245, 158, 11, 0.7)',  // Warning/Amber for Medium
          'rgba(220, 38, 38, 0.7)',   // Error/Red for High
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(220, 38, 38, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
    cutout: '70%',
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tasks by Risk Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <Doughnut data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};