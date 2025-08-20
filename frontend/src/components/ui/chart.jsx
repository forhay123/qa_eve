// src/components/ui/chart.jsx
import React from 'react';

export const ChartContainer = ({ title, children }) => (
  <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    {title && <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>}
    <div className="h-[300px] w-full">{children}</div>
  </div>
);

export const ChartTooltip = ({ active, payload, label, children }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
      {children ? children({ label, payload }) : <ChartTooltipContent label={label} payload={payload} />}
    </div>
  );
};

export const ChartTooltipContent = ({ label, payload }) => (
  <div>
    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
    {payload.map((entry, index) => (
      <p key={index} className="text-xs text-gray-700 dark:text-gray-300">
        {entry.name}: {entry.value}
      </p>
    ))}
  </div>
);
