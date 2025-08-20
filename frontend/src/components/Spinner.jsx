
import React from 'react';
import { cn } from '@/lib/utils';

const Spinner = ({ message = 'Loading...', className }) => {
  return (
    <div className={cn("flex items-center space-x-3 text-primary text-sm font-medium", className)}>
      <div className="w-5 h-5 rounded-full border-4 border-t-transparent border-primary animate-spin" />
      <span>{message}</span>
    </div>
  );
};

export default Spinner;