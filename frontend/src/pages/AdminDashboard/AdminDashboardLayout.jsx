import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function AdminDashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '', label: 'Dashboard Home' },
    { path: 'students', label: 'Student List' },
    { path: 'summary', label: 'Progress Summary' },
    { path: 'export', label: 'Export Reports' },
    { path: 'analytics', label: 'Analytics' },
    { path: 'attendance', label: 'Attendance' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top nav */}
      <header className="bg-white shadow sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-gray-700 focus:outline-none"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ''}
                className={({ isActive }) =>
                  `transition duration-200 ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700 hover:text-blue-500'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t">
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ''}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `transition duration-200 ${
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-700 hover:text-blue-500'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="py-6 w-full">
        <Outlet />
      </main>
    </div>
  );
}
