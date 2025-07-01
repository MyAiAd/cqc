import React from 'react';
import { Card, CardContent } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  description,
  colorClass = 'bg-primary-500',
}) => {
  return (
    <Card className="h-full">
      <CardContent className="pt-5">
        <div className="flex items-start">
          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
              {change && (
                <span className={`ml-2 text-xs font-medium ${change.isPositive ? 'text-success-600' : 'text-error-600'}`}>
                  {change.isPositive ? '+' : ''}{change.value}%
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-neutral-900">{value}</p>
              {description && (
                <p className="ml-2 text-sm text-neutral-500">{description}</p>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};