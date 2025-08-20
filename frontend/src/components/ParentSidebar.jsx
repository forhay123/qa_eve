import React from 'react';
import { NavLink } from 'react-router-dom';

const ParentSidebar = () => {
  const links = [
    { to: '/parent', label: 'Dashboard' },
    { to: '/parent/report', label: 'Report Card' },
    { to: '/parent/attendance', label: 'Attendance Summary' },
    { to: '/parent/notifications', label: 'Notifications' },
  ];

  return (
    <aside className="w-64 h-screen fixed bg-white shadow-md p-4">
      <h2 className="text-xl font-bold mb-6">Parent Panel</h2>
      <nav className="space-y-2">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded hover:bg-green-100 ${
                isActive ? 'bg-green-200 font-semibold' : ''
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

export default ParentSidebar;
