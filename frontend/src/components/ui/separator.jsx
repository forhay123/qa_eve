import React from 'react';
import clsx from 'clsx';

/**
 * Simple horizontal or vertical separator line
 * Usage: <Separator />
 * Props: orientation = 'horizontal' | 'vertical'
 */
const Separator = ({ orientation = 'horizontal', className = '' }) => {
  return (
    <div
      className={clsx(
        'bg-gray-300 dark:bg-gray-700',
        orientation === 'horizontal' ? 'w-full h-px my-4' : 'h-full w-px mx-4',
        className
      )}
    />
  );
};

export { Separator };
