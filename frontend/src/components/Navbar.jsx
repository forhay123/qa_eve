import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchSubjects } from '../services/api';
import {
  Menu, X, ChevronDown, ChevronRight, Home, User, Upload,
  Calendar, BarChart3, Award, BookOpen, MessageSquare, LogOut
} from 'lucide-react';

const ResponsiveNavbar = () => {
  const { auth, logout, loading } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = auth?.role;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { role, level, department } = auth || {};
        if (role === 'student' && level) {
          const normalizedLevel = level.trim().toLowerCase();
          const isSenior = ['ss1', 'ss2', 'ss3'].includes(normalizedLevel);
          const isJunior = ['jss1', 'jss2', 'jss3'].includes(normalizedLevel);
          const data = isSenior && department
            ? await fetchSubjects(normalizedLevel, department)
            : isJunior
              ? await fetchSubjects(normalizedLevel)
              : [];
          setSubjects(data);
        }
      } catch (err) {
        console.error('❌ Error loading subjects:', err);
      }
    };
    if (auth?.token) loadSubjects();
  }, [auth]);

  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => (prev === key ? null : key));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-');

  if (loading) return null;

  const renderNavLink = (link, isMobileView = false) => (
    <NavLink
      key={link.path}
      to={link.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${isActive ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-700'
        } ${isMobileView ? 'text-base' : 'text-sm'}`
      }
      onClick={() => isMobileView && setIsMobileMenuOpen(false)}
    >
      <span>{link.label}</span>
    </NavLink>
  );

  const renderDropdown = (title, items, key, isMobileView = false) => (
    <div key={key} className="space-y-1">
      <button
        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 ${isMobileView ? 'text-base' : 'text-sm'
          } font-medium text-gray-700`}
        onClick={() => toggleDropdown(key)}
        aria-expanded={openDropdown === key}
        aria-controls={`${key}-dropdown`}
      >
        <span className="flex items-center gap-3">
          <BookOpen className="w-4 h-4" />
          {title}
        </span>
        {openDropdown === key ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {openDropdown === key && (
        <div id={`${key}-dropdown`} className="ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-1 rounded hover:bg-gray-50 transition ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                } ${isMobileView ? 'text-sm' : 'text-xs'}`
              }
              onClick={() => isMobileView && setIsMobileMenuOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  const studentLinks = [
    { path: '/student-dashboard', label: '🏠 Dashboard' },
    { path: '/assignments', label: '📝 Assignments' },
    { path: '/student/progress', label: '📊 Progress' },
    { path: '/profile', label: '👤 Profile' },
    { path: '/upload', label: '📤 Upload PDF' },
    { path: '/timetable', label: '📅 Timetable' },
    { path: '/results', label: '📈 Results' },
    { path: '/report-cards', label: '📄 Report Cards' },
    { path: '/attendance/me', label: '🕒 Attendance' },
    { path: '/quizzes', label: '❓ Quizzes' },
    { path: '/achievements', label: '🏅 Achievements' },
    { path: '/resources/student', label: '📚 Resources' },
    { path: '/chatbot', label: '🧠 AI Chatbot' }
  ];

  const adminLinks = [
    { path: '/admin-dashboard', label: '🏠 Dashboard' },
    { path: '/students', label: '🧑‍🎓 Users' },
    { path: '/admin-dashboard/assignments', label: '📝 Assignments' },
    { path: '/admin-dashboard/students', label: '👥 Student List' },
    { path: '/admin/student-profiles', label: '👨‍👩‍👧 Student Profiles' },
    { path: '/admin-topics', label: '📘 All Topics' },
    { path: '/admin-subjects', label: '📕 Subjects' },
    { path: '/admin-dashboard/teachers-with-subjects', label: '👩‍🏫 Teachers & Subjects' },
    { path: '/admin-dashboard/assign-class', label: '🏷️ Assign Classes' },
    { path: '/admin-dashboard/assign-subjects', label: '🎯 Assign Subjects' },
    { path: '/admin-dashboard/attendance', label: '🕒 Attendance by Class' },
    { path: '/admin/attendance', label: '📝 Attendance Records' },
    { path: '/admin-dashboard/analytics', label: '📈 Analytics' },
    { path: '/admin-dashboard/summary', label: '📊 Progress Summary' },
    { path: '/admin-dashboard/export', label: '📤 Export Reports' },
    { path: '/admin-dashboard/view-resources', label: '📚 View Resources' },
    { path: '/admin-dashboard/upload-resource', label: '📤 Upload Resource' },
    { path: '/admin-timetable', label: '🗓️ Timetable' },
    { path: '/admin/report-cards', label: '📑 Generate Report Cards' },
    { path: '/admin/report-preview', label: '🖨️ Preview Report' }
  ];

  const teacherLinks = [
    { path: '/teacher-dashboard', label: '🏠 Dashboard' },
    { path: '/teacher/assignments', label: '📝 Assignments' },
    { path: '/teacher/attendance', label: '🕒 Mark Attendance' },
    { path: '/teacher/lesson-plans', label: '📘 Lesson Plans' },
    { path: '/teacher/performance', label: '📈 Performance' },
    { path: '/teacher/upload-resource', label: '📤 Upload Resources' },
    { path: '/teacher/resources', label: '📚 View Resources' },
    { path: '/teacher/timetable', label: '📅 Timetable' },
    { path: '/teacher/students/assigned', label: '👨‍🏫 My Students' },
    { path: '/teacher/subjects', label: '📚 Subjects' },
    { path: '/teacher/report-comments', label: '📝 Report Comments' },
    { path: '/teacher/report-preview', label: '🖨️ Report Preview' }
  ];

  const parentLinks = [
    { path: '/parent-dashboard', label: '🏠 Dashboard' },
    { path: '/parent/attendance-summary', label: '🕒 Attendance Summary' },
    { path: '/parent/notifications', label: '🔔 Notifications' },
    { path: '/parent/report', label: '📄 Student Report' }
  ];

  const getCurrentLinks = () => {
    switch (role) {
      case 'student': return studentLinks;
      case 'admin': return adminLinks;
      case 'teacher': return teacherLinks;
      case 'parent': return parentLinks;
      default: return [];
    }
  };

  const subjectDropdownItems = subjects.map(s => ({
    path: `/subjects/${s.level}/${slugify(s.name)}`,
    name: s.name
  }));

  const testDropdownItems = subjects.flatMap(s => {
    const slug = slugify(s.name);
    return [
      { path: `/tests/${slug}/first`, name: `First Test - ${s.name}` },
      { path: `/tests/${slug}/second`, name: `Second Test - ${s.name}` },
      { path: `/exam/${slug}`, name: `Exam - ${s.name}` }
    ];
  });

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && auth?.token && (
            <button onClick={toggleMobileMenu} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <NavLink to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">🧠 ABapp</NavLink>
        </div>

        <div className="flex items-center gap-4">
          {auth?.token ? (
            <>
              <span className="font-medium text-gray-700">{auth.fullName || auth.username}</span>
              {role === 'admin' && (
                <NavLink to="/register" className="text-blue-600 text-sm font-medium hover:text-blue-700">➕ Register</NavLink>
              )}
              {/* Desktop logout button */}
              {!isMobile && (
                <button onClick={handleLogout} className="text-red-600 text-sm font-medium hover:text-red-700">🚪 Logout</button>
              )}
            </>
          ) : (
            <NavLink to="/login" className="text-blue-600 text-sm font-medium hover:text-blue-700">Login</NavLink>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      {!isMobile && auth?.token && (
        <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg overflow-y-auto z-40 p-4">
          <div className="space-y-2">
            {getCurrentLinks().map(link => renderNavLink(link))}
            {role === 'student' && subjects.length > 0 && (
              <>
                {renderDropdown(`${auth.level?.toUpperCase()} Subjects`, subjectDropdownItems, 'subjects')}
                {renderDropdown('Tests & Exams', testDropdownItems, 'tests')}
              </>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu} />
      )}

      {/* Mobile Sidebar */}
      {isMobile && auth?.token && (
        <aside className={`fixed top-16 left-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform z-50 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {getCurrentLinks().map(link => renderNavLink(link, true))}
            {role === 'student' && subjects.length > 0 && (
              <>
                {renderDropdown(`${auth.level?.toUpperCase()} Subjects`, subjectDropdownItems, 'subjects', true)}
                {renderDropdown('Tests & Exams', testDropdownItems, 'tests', true)}
              </>
            )}
          </div>

          {/* Fixed logout button at bottom */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};

export default ResponsiveNavbar;
