import React, { useState, useMemo, useEffect } from 'react';
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
import { Task, StaffCompetency, TaskFrequency, RiskRating } from '../../types';
import { getDocumentById, getDocumentDisplayText, hasDocumentLinks, DocumentReference } from '../../services/dataService';

interface SkillsMatrixTableProps {
  tasks: Task[];
  selectedCategory: string | null;
  staffIds: string[];
  onTaskClick?: (task: Task) => void;
}

type SortField = 'name' | 'frequency' | 'risk';
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

export const SkillsMatrixTable: React.FC<SkillsMatrixTableProps> = ({
  tasks,
  selectedCategory,
  staffIds,
  onTaskClick,
}) => {
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: 'asc' });
  const [documentTitles, setDocumentTitles] = useState<Record<string, string>>({});

  // Load document titles for internal document references
  useEffect(() => {
    const loadDocumentTitles = async () => {
      const titles: Record<string, string> = {};
      
      for (const task of tasks) {
        if (task.sopDocumentId) {
          const doc = await getDocumentById(task.sopDocumentId);
          if (doc) {
            titles[task.sopDocumentId] = doc.title;
          }
        }
        if (task.policyDocumentId) {
          const doc = await getDocumentById(task.policyDocumentId);
          if (doc) {
            titles[task.policyDocumentId] = doc.title;
          }
        }
      }
      
      setDocumentTitles(titles);
    };

    if (tasks.length > 0) {
      loadDocumentTitles();
    }
  }, [tasks]);

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

  // Filter and sort tasks
  const sortedTasks = useMemo(() => {
    let filtered = selectedCategory
      ? tasks.filter(task => task.category === selectedCategory)
      : tasks;

    if (!sortState.field) return filtered;

    return [...filtered].sort((a, b) => {
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
  }, [tasks, selectedCategory, sortState, frequencyOrder, riskOrder]);
  
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

  // Handle document link clicks
  const handleDocumentClick = (task: Task, type: 'sop' | 'policy', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (type === 'sop') {
      if (task.sopDocumentId) {
        // TODO: Open evidence view modal for internal document
        console.log('Open SOP document:', task.sopDocumentId);
      } else if (task.sopLink) {
        // Open external URL
        window.open(task.sopLink, '_blank', 'noopener,noreferrer');
      }
    } else {
      if (task.policyDocumentId) {
        // TODO: Open evidence view modal for internal document
        console.log('Open Policy document:', task.policyDocumentId);
      } else if (task.policyLink) {
        // Open external URL
        window.open(task.policyLink, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Get display text for a document link
  const getDocumentDisplayText = (task: Task, type: 'sop' | 'policy'): string => {
    if (type === 'sop') {
      if (task.sopDocumentId) {
        return documentTitles[task.sopDocumentId] || 'Loading...';
      } else if (task.sopLink) {
        try {
          const url = new URL(task.sopLink);
          return url.hostname;
        } catch {
          return 'External Link';
        }
      }
    } else {
      if (task.policyDocumentId) {
        return documentTitles[task.policyDocumentId] || 'Loading...';
      } else if (task.policyLink) {
        try {
          const url = new URL(task.policyLink);
          return url.hostname;
        } catch {
          return 'External Link';
        }
      }
    }
    return '';
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <SortableHeader
                field="name"
                currentSort={sortState}
                onSort={handleSort}
                className="w-1/6"
              >
                Task Name
              </SortableHeader>
              
              <SortableHeader
                field="frequency"
                currentSort={sortState}
                onSort={handleSort}
                className="w-1/6"
              >
                Frequency
              </SortableHeader>
              
              <SortableHeader
                field="risk"
                currentSort={sortState}
                onSort={handleSort}
                className="w-1/12"
              >
                Risk
              </SortableHeader>
              
              <TableHeaderCell className="w-1/12">Links</TableHeaderCell>
              
              {staffNames.map((name, index) => (
                <TableHeaderCell key={index} className="w-1/6">
                  {name}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTasks.map(task => (
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
                    {(task.sopDocumentId || task.sopLink) && (
                      <button
                        onClick={(e) => handleDocumentClick(task, 'sop', e)}
                        className="text-primary-600 hover:text-primary-800 inline-flex items-center group"
                        title={`SOP: ${getDocumentDisplayText(task, 'sop')}`}
                      >
                        <span className="sr-only">SOP</span>
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 text-primary-800 text-xs font-medium group-hover:bg-primary-200">
                          S
                        </span>
                      </button>
                    )}
                    
                    {(task.policyDocumentId || task.policyLink) && (
                      <button
                        onClick={(e) => handleDocumentClick(task, 'policy', e)}
                        className="text-secondary-600 hover:text-secondary-800 inline-flex items-center group"
                        title={`Policy: ${getDocumentDisplayText(task, 'policy')}`}
                      >
                        <span className="sr-only">Policy</span>
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium group-hover:bg-secondary-200">
                          P
                        </span>
                      </button>
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
            
            {sortedTasks.length === 0 && (
              <TableRow>
                <td colSpan={4 + staffIds.length} className="px-6 py-8 text-center text-neutral-500">
                  No tasks found
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};