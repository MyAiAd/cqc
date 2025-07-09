import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHeaderCell 
} from '../ui/Table';
import { RiskBadge, CompetencyBadge } from '../ui/Badge';
import { Task, StaffCompetency } from '../../types';

interface SkillsMatrixTableProps {
  tasks: Task[];
  selectedCategory: string | null;
  staffIds: string[];
  onTaskClick?: (task: Task) => void;
}

export const SkillsMatrixTable: React.FC<SkillsMatrixTableProps> = ({
  tasks,
  selectedCategory,
  staffIds,
  onTaskClick,
}) => {
  // Filter tasks by category if selected
  const filteredTasks = selectedCategory
    ? tasks.filter(task => task.category === selectedCategory)
    : tasks;
  
  // Get staff names for the header
  const getStaffNames = (): string[] => {
    if (tasks.length === 0 || tasks[0].competencies.length === 0) return [];
    
    return staffIds.map(id => {
      const competency = tasks[0].competencies.find(c => c.staffId === id);
      return competency ? competency.staffName : `Staff ${id}`;
    });
  };
  
  const staffNames = getStaffNames();
  
  // Find a competency for a specific task and staff ID
  const findCompetency = (task: Task, staffId: string): StaffCompetency | undefined => {
    return task.competencies.find(comp => comp.staffId === staffId);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-1/6">Task Name</TableHeaderCell>
              <TableHeaderCell className="w-1/6">Frequency</TableHeaderCell>
              <TableHeaderCell className="w-1/12">Risk</TableHeaderCell>
              <TableHeaderCell className="w-1/12">Links</TableHeaderCell>
              {staffNames.map((name, index) => (
                <TableHeaderCell key={index} className="w-1/6">
                  {name}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map(task => (
              <TableRow 
                key={task.id}
                onClick={() => onTaskClick && onTaskClick(task)}
                className={onTaskClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
              >
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.category}</TableCell>
                <TableCell>
                  <RiskBadge risk={task.riskRating} />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {task.sopLink && (
                      <a 
                        href={task.sopLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">SOP</span>
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 text-primary-800 text-xs font-medium">
                          S
                        </span>
                      </a>
                    )}
                    
                    {task.policyLink && (
                      <a 
                        href={task.policyLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-secondary-600 hover:text-secondary-800 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Policy</span>
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                          P
                        </span>
                      </a>
                    )}
                  </div>
                </TableCell>
                
                {staffIds.map(staffId => {
                  const competency = findCompetency(task, staffId);
                  return (
                    <TableCell key={staffId}>
                      {competency ? (
                        <CompetencyBadge status={competency.status} />
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            
            {filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={4 + staffIds.length} className="text-center py-8 text-neutral-500">
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};