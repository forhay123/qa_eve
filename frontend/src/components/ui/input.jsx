import React from 'react';

const Input = ({ label, type = 'text', value, onChange, name, placeholder }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-md shadow-sm 
                   bg-white text-gray-900 border-gray-300 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                   dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
      />
    </div>
  );
};

export { Input };
