// src/components/ui/table.jsx
import React from 'react';
import clsx from 'clsx';

export const Table = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table
      className={clsx("min-w-full divide-y divide-gray-200 dark:divide-gray-700", className)}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className, children, ...props }) => (
  <thead
    className={clsx("bg-gray-50 dark:bg-gray-800", className)}
    {...props}
  >
    {children}
  </thead>
);

export const TableHead = ({ className, children, ...props }) => (
  <th
    className={clsx(
      "px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300",
      className
    )}
    {...props}
  >
    {children}
  </th>
);

export const TableBody = ({ className, children, ...props }) => (
  <tbody
    className={clsx("divide-y divide-gray-200 dark:divide-gray-700", className)}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={clsx("hover:bg-gray-50 dark:hover:bg-gray-800", className)} {...props}>
    {children}
  </tr>
);

export const TableCell = ({ className, children, ...props }) => (
  <td
    className={clsx("px-4 py-3 text-sm text-gray-600 dark:text-gray-200", className)}
    {...props}
  >
    {children}
  </td>
);
