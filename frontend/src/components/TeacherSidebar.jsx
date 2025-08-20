// src/components/TeacherSidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const TeacherSidebar = () => {
  const links = [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/attendance', label: 'Mark Attendance' },
    { to: '/teacher/lessons', label: 'Lesson Plans' },
    { to: '/teacher/performance', label: 'Student Performance' },
  ];

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-white shadow-lg p-6 flex flex-col">
      <h2 className="text-2xl font-bold text-blue-600 mb-8">👨‍🏫 Teacher Panel</h2>
      <nav className="flex flex-col gap-2">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition ${
                isActive
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'text-gray-700 hover:bg-blue-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default TeacherSidebar;
