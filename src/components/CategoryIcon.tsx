import React from 'react';
import { GradientIcon } from './GradientIcon';

interface CategoryIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  name, 
  className = 'w-5 h-5',
  strokeWidth = 2.2
}) => {
  return <GradientIcon name={name} className={className} strokeWidth={strokeWidth} />;
};


