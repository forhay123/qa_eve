// src/pages/TeacherDashboard/ResponsiveTeacherDashboard.jsx
import React from 'react';

const ResponsiveTeacherDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome, Teacher</h1>
      <p className="text-gray-700">
        This is your dashboard. Here, you'll be able to:
      </p>
      <ul className="list-disc pl-6 mt-4 text-gray-600">
        <li>View and manage class attendance</li>
        <li>Access lesson plans and subjects</li>
        <li>Track student performance</li>
        <li>Communicate with parents</li>
      </ul>
    </div>
  );
};

export default ResponsiveTeacherDashboard;
