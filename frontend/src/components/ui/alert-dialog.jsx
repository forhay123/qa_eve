import React from "react";

// Wrapper dialog container
export function AlertDialog({ children }) {
  return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">{children}</div>;
}

// Trigger button (you can wire this to toggle modal state externally)
export function AlertDialogTrigger({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-blue-600 underline">
      {children}
    </button>
  );
}

// Modal content container
export function AlertDialogContent({ children }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
      {children}
    </div>
  );
}

// Header section
export function AlertDialogHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}

// Title text
export function AlertDialogTitle({ children }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

// Description below title
export function AlertDialogDescription({ children }) {
  return <p className="text-sm text-gray-600">{children}</p>;
}

// Footer (for buttons)
export function AlertDialogFooter({ children }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>;
}

// Cancel button
export function AlertDialogCancel({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
      {children}
    </button>
  );
}

// Confirm/Action button
export function AlertDialogAction({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
      {children}
    </button>
  );
}
