// components/ui/custom-scrollbar.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ 
  children,
  className
}) => {
  return (
    <div className={cn(
      'scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded',
      'transition-colors duration-200',
      className
    )}>
      {children}
    </div>
  );
};

export default CustomScrollbar;