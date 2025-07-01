import React from 'react';
import { RiskRating, CompetencyStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  color,
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-primary-100 text-primary-800',
    outline: 'border border-current bg-transparent',
    secondary: 'bg-neutral-100 text-neutral-800',
  };
  
  const colorClass = color ? color : '';
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${colorClass} ${className}`}>
      {children}
    </span>
  );
};

interface RiskBadgeProps {
  risk: RiskRating;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, className = '' }) => {
  const riskColors = {
    Low: 'bg-success-100 text-success-800',
    Medium: 'bg-warning-100 text-warning-800',
    High: 'bg-error-100 text-error-800',
  };
  
  return (
    <Badge color={riskColors[risk]} className={className}>
      {risk}
    </Badge>
  );
};

interface CompetencyBadgeProps {
  status: CompetencyStatus;
  className?: string;
}

export const CompetencyBadge: React.FC<CompetencyBadgeProps> = ({ status, className = '' }) => {
  const statusColors = {
    'Competent': 'bg-success-100 text-success-800',
    'Training Required': 'bg-warning-100 text-warning-800',
    'Re-Training Required': 'bg-error-100 text-error-800',
    'Trained awaiting sign off': 'bg-primary-100 text-primary-800',
    'Not Applicable': 'bg-neutral-100 text-neutral-800',
  };
  
  return (
    <Badge color={statusColors[status]} className={className}>
      {status}
    </Badge>
  );
};