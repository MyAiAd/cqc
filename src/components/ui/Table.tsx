import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-neutral-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return <thead className={`bg-neutral-50 ${className}`}>{children}</thead>;
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-neutral-200 ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '', 
  onClick,
  isHighlighted = false,
}) => {
  const highlightClass = isHighlighted ? 'bg-primary-50' : '';
  const hoverClass = onClick ? 'hover:bg-neutral-50 cursor-pointer' : '';
  
  return (
    <tr 
      className={`${highlightClass} ${hoverClass} ${className}`} 
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-neutral-800 ${className}`}>
      {children}
    </td>
  );
};

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  isSortable?: boolean;
  isSorted?: boolean;
  isSortedDesc?: boolean;
  onSort?: () => void;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className = '',
  isSortable = false,
  isSorted = false,
  isSortedDesc = false,
  onSort,
}) => {
  const sortableClass = isSortable ? 'cursor-pointer hover:bg-neutral-100' : '';
  
  return (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider ${sortableClass} ${className}`}
      onClick={isSortable ? onSort : undefined}
    >
      <div className="flex items-center">
        {children}
        {isSortable && (
          <span className="ml-2">
            {isSorted ? (
              isSortedDesc ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )
            ) : (
              <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};