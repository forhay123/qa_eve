// src/components/ui/alert.jsx
import React from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react'; // Optional icon, install via `lucide-react` if needed

export const Alert = ({ children, className, ...props }) => {
  return (
    <div
      role="alert"
      className={clsx(
        "relative w-full rounded-lg border border-red-400 bg-red-50 p-4 text-sm text-red-700 dark:border-red-600 dark:bg-red-900 dark:text-red-100",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 mt-0.5" />
        <div>{children}</div>
      </div>
    </div>
  );
};

export const AlertDescription = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx("text-sm text-red-700 dark:text-red-100", className)}
      {...props}
    >
      {children}
    </div>
  );
};
