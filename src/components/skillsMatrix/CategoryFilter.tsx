import React from 'react';
import { Button } from '../ui/Button';
import { TaskFrequency } from '../../types';

interface CategoryFilterProps {
  categories: TaskFrequency[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-neutral-500 mb-3">Filter by Frequency</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(null)}
        >
          All Frequencies
        </Button>
        
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};