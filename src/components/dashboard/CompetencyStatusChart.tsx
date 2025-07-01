import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Task, CompetencyStatus } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CompetencyStatusChartProps {
  tasks: Task[];
}

export const CompetencyStatusChart: React.FC<CompetencyStatusChartProps> = ({ tasks }) => {
  // Count competency statuses for all staff across all tasks
  const statusCounts = tasks.reduce(
    (acc, task) => {
      task.competencies.forEach(comp => {
        acc[comp.status]++;
      });
      return acc;
    },
    {
      'Competent': 0,
      'Training Required': 0,
      'Re-Training Required': 0,
      'Trained awaiting sign off': 0,
      'Not Applicable': 0
    } as Record<CompetencyStatus, number>
  );
  
  const data: ChartData<'bar'> = {
    labels: ['Competent', 'Training Required', 'Re-Training Required', 'Awaiting Sign Off', 'N/A'],
    datasets: [
      {
        label: 'Number of Competencies',
        data: [
          statusCounts['Competent'],
          statusCounts['Training Required'],
          statusCounts['Re-Training Required'],
          statusCounts['Trained awaiting sign off'],
          statusCounts['Not Applicable']
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',  // Success/Green for Competent
          'rgba(245, 158, 11, 0.7)',  // Warning/Amber for Training Required
          'rgba(220, 38, 38, 0.7)',   // Error/Red for Re-Training Required
          'rgba(59, 130, 246, 0.7)',  // Primary/Blue for Awaiting Sign Off
          'rgba(107, 114, 128, 0.7)', // Neutral/Gray for N/A
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(220, 38, 38, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Only show whole numbers
        },
      },
    },
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Staff Competency Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};