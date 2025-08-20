import React from 'react';
import { cn } from '@/lib/utils'; // Optional: ShadCN utility for merging class names

export const ScrollArea = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-y-auto max-h-64 rounded-md border p-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
