// src/components/ui/label.jsx
import React from 'react';
import clsx from 'clsx';

export const Label = React.forwardRef(({ className, children, htmlFor, ...props }, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={clsx(
        "block text-sm font-medium text-gray-700 dark:text-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';
