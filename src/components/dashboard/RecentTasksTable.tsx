import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHeaderCell 
} from '../ui/Table';
import { RiskBadge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Task } from '../../types';

interface RecentTasksTableProps {
  tasks: Task[];
}

export const RecentTasksTable: React.FC<RecentTasksTableProps> = ({ tasks }) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recently Updated Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Task Name</TableHeaderCell>
              <TableHeaderCell>Risk</TableHeaderCell>
              <TableHeaderCell>Last Updated</TableHeaderCell>
              <TableHeaderCell>Training Needed</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map(task => {
              const trainingNeeded = task.competencies.some(
                comp => comp.status === 'Training Required' || comp.status === 'Re-Training Required'
              );
              
              return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>
                    <RiskBadge risk={task.riskRating} />
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                      {formatDate(task.updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trainingNeeded ? (
                      <div className="flex items-center text-error-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>Yes</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500">No</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};