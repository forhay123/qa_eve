import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchSubjects } from '../services/api';
import { Menu, X, ChevronDown, BookOpen, Sun, Moon } from 'lucide-react';
import { toggleDarkMode } from '../utils/theme';
import { NavbarChatNotification } from './NavbarChatNotification';
import { NotificationContext } from '../contexts/NotificationContext';

const ResponsiveNavbar = () => {
  const { auth, logout, loading } = useContext(AuthContext);
  const { hasAnyNotifications } = useContext(NotificationContext);

  const [subjects, setSubjects] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const navigate = useNavigate();
  const location = useLocation();
  const role = auth?.role;

  const filterUnwanted = (items) =>
    items.filter(item => {
      const lower = item.name.toLowerCase();
      return lower !== 'opening prayer' && lower !== 'closing prayer';
    });

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { level, department } = auth || {};
        if (role === 'student' && level) {
          const lvl = level.trim().toLowerCase();
          const senior = ['ss1', 'ss2', 'ss3'].includes(lvl);
          const junior = ['jss1', 'jss2', 'jss3'].includes(lvl);
          const data = senior && department
            ? await fetchSubjects(lvl, department)
            : junior
              ? await fetchSubjects(lvl)
              : [];
          setSubjects(data);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      }
    };
    if (auth?.token) loadSubjects();
  }, [auth, role]);

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

  const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-');

  if (loading) return null;

  const renderThemeToggle = (mobile = false) => (
    <button
      onClick={toggleDarkMode}
      className={`mt-4 flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
        mobile
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:hover:bg-rose-800 w-full'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700'
      }`}
    >
      <Sun className="w-4 h-4 dark:hidden" />
      <Moon className="w-4 h-4 hidden dark:block" />
      Toggle Theme
    </button>
  );

  const renderNavLink = (link, mobileView = false) => (
    <NavLink
      key={link.path}
      to={link.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all 
        ${isActive
          ? 'bg-rose-100 text-rose-700 border-l-4 border-rose-600 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-400'
          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
        } ${mobileView ? 'text-base' : 'text-sm'}`
      }
      onClick={() => mobileView && setIsMobileMenuOpen(false)}
    >
      {link.label}
    </NavLink>
  );

  const renderDropdown = (title, items, key, mobileView = false) => {
    const isOpen = openDropdown === key;
    return (
      <div key={key} className="space-y-1">
        <button
          onClick={() => toggleDropdown(key)}
          aria-expanded={isOpen}
          className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors 
          ${isOpen
            ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-100 font-bold'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200'
          } ${mobileView ? 'text-base' : 'text-sm'} font-semibold`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {title}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 border-l border-stone-300 dark:border-stone-700 pl-3 space-y-1">
            {items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-rose-50 dark:bg-rose-800 text-rose-600 dark:text-rose-200'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                  } ${mobileView ? 'text-sm' : 'text-xs'}`
                }
                onClick={() => mobileView && setIsMobileMenuOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  const allLinks = {
    student: [
      { path: '/student-dashboard', label: '🏠 Dashboard' },
      { path: '/assignments', label: '📝 Assignments' },
      { path: '/class-chat', label: '💬 Class Chat' },
      { path: '/profile', label: '👤 Profile' },
      { path: '/timetable', label: '📅 Timetable' },
      { path: '/results', label: '📈 Results' },
      { path: '/report-cards', label: '📄 Report Cards' },
      { path: '/attendance/me', label: '🕒 Attendance' },
      { path: '/quizzes', label: '❓ Quizzes' },
      { path: '/ask-anything', label: '🤔 Ask Anything' },
      { path: '/achievements', label: '🏅 Achievements' },
      { path: '/resources/student', label: '📚 Resources' },
      { path: '/chatbot', label: '🧠 AI Chatbot' }
    ],
    admin: [
      { path: '/admin-dashboard', label: '🏠 Dashboard' },
      { path: '/students', label: '🧑‍🎓 Users' },
      { path: '/admin-activity/dashboard', label: '📝 Activity' },
      { path: '/admin-dashboard/parent-approval', label: '📝 Parent Approval' },
      { path: '/class-chat', label: '💬 Class Chat' },
      { path: '/admin-dashboard/create-chat-group', label: '👥 Create Chat Group' },
      { path: '/admin-dashboard/monitor-chat', label: '🛡️ Monitor Chat' },
      { path: '/admin/student-profiles', label: '👨‍👩‍👧 Student Profiles' },
      { path: '/admin-topics', label: '📘 All Topics' },
      { path: '/admin-subjects', label: '📕 Class Scehdule' },
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
    ],
    teacher: [
      { path: '/teacher-dashboard', label: '🏠 Dashboard' },
      { path: '/teacher/assignments', label: '📝 Assignments' },
      { path: '/class-chat', label: '💬 Class Chat' },
      { path: '/teacher/group-manager', label: '👥 Manage Groups' },
      { path: '/teacher/assignment-submissions', label: '📂 Submissions' },
      { path: '/teacher/attendance', label: '🕒 Mark Attendance' },
      { path: '/teacher/lesson-plans', label: '📘 Lesson Plans' },
      { path: '/teacher/performance', label: '📈 Performance' },
      { path: '/teacher/upload-resource', label: '📤 Upload Resources' },
      { path: '/teacher/resources', label: '📚 View Resources' },
      { path: '/teacher/timetable', label: '📅 Timetable' },
      { path: '/teacher/students/assigned', label: '👨‍🏫 Students progress' },
      { path: '/teacher/report-comments', label: '📝 Report Comments' },
      { path: '/teacher/report-preview', label: '🖨️ Report Preview' }
    ],
    parent: [
      { path: '/parent-dashboard', label: '🏠 Dashboard' },
      { path: '/parent/attendance-summary', label: '🕒 Attendance Summary' },
      { path: '/parent/notifications', label: '🔔 Notifications' },
      { path: '/parent/report', label: '📄 Student Report' }
    ]
  };

  const getLinksForRole = () => allLinks[role] || [];

  const levelSlug = auth?.level ? slugify(auth.level.toLowerCase()) : '';

  const subjectDropdownItems = subjects.map(s => ({
    path: `/subjects/${s.level}/${slugify(s.name)}`,
    name: s.name
  }));

  const testDropdownItems = filterUnwanted(subjects || []).flatMap(s => {
    const slug = slugify(s.name.toLowerCase());
    return [
      { path: `/tests/${slug}/first`, name: `First Test - ${s.name}` },
      { path: `/tests/${slug}/second`, name: `Second Test - ${s.name}` },
      { path: `/exams/${levelSlug}/${slug}`, name: `Exam - ${s.name}` }
    ];
  });

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-950 shadow-md z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && auth?.token && (
            <button onClick={toggleMobileMenu} className="p-2 text-rose-700 dark:text-rose-300">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {!isMobile && (
            <NavLink to="/" className="text-xl font-bold text-rose-700 hover:text-rose-800 dark:text-rose-500">
              ABapp
            </NavLink>
          )}
        </div>

        {!isMobile && auth?.token && role && (
          <div className="text-center flex-1">
            <span className="text-lg font-bold uppercase text-rose-800 dark:text-rose-400 tracking-wider">
              {role} Portal
            </span>
          </div>
        )}

        <div className={`flex items-center gap-4 ${isMobile ? 'ml-auto' : 'min-w-[200px] justify-end'}`}>
          {isMobile && (
            <NavLink to="/" className="text-xl font-bold text-rose-700 hover:text-rose-800 dark:text-rose-500">
              ABapp
            </NavLink>
          )}
          {!isMobile && auth?.token && (
            <>
              <span className="font-medium text-stone-700 dark:text-stone-200">
                {auth.fullName || auth.username}
              </span>
              {role === 'admin' && (
                <NavLink to="/register" className="text-rose-600 text-sm font-medium hover:text-rose-700 dark:text-rose-400">
                  ➕ Register
                </NavLink>
              )}
              <button onClick={handleLogout} className="text-rose-600 text-sm font-medium hover:text-rose-700 dark:text-rose-400">
                🚪 Logout
              </button>
            </>
          )}
          {!auth?.token && (
            <NavLink to="/login" className="text-rose-600 text-sm font-medium hover:text-rose-700 dark:text-rose-400">
              Login
            </NavLink>
          )}
        </div>
      </nav>

      {!isMobile && auth?.token && (
        <aside className="fixed top-16 left-0 bottom-0 w-64 bg-stone-50 dark:bg-stone-900 shadow-lg overflow-y-auto z-40 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {getLinksForRole().map(link => renderNavLink(link))}
            {role === 'student' && subjects.length > 0 && (
              <>
                {renderDropdown(`Classes`, filterUnwanted(subjectDropdownItems), 'subjects')}
                {renderDropdown('Tests & Exams', filterUnwanted(testDropdownItems), 'tests')}
              </>
            )}
          </div>
          {renderThemeToggle(false)}
        </aside>
      )}

      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu} />
      )}

      {isMobile && auth?.token && (
        <aside className={`fixed top-16 left-0 bottom-0 w-80 bg-white dark:bg-stone-900 shadow-xl transform transition-transform z-50 overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{role} Menu</h2>
            <button onClick={toggleMobileMenu} className="p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {getLinksForRole().map(link => renderNavLink(link, true))}
            {role === 'student' && subjects.length > 0 && (
              <>
                {renderDropdown(`Classes`, filterUnwanted(subjectDropdownItems), 'subjects', true)}
                {renderDropdown('Tests & Exams', filterUnwanted(testDropdownItems), 'tests', true)}
              </>
            )}
            {renderThemeToggle(true)}
            <button onClick={handleLogout} className="w-full mt-4 text-left px-3 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600">
              🚪 Logout
            </button>
          </div>
        </aside>
      )}
    </>
  );
};

export default ResponsiveNavbar;