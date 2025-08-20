import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ResponsiveNavbar from '../components/ResponsiveNavbar';
import { AuthContext } from '../contexts/AuthContext';

const ResponsiveLayout = ({ children }) => {
  const { auth, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = ['/', '/about', '/contact'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    if (!loading && !auth?.token && !isPublicRoute) {
      navigate('/login');
    }
  }, [auth, loading, navigate, isPublicRoute]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-wine-600 dark:text-red-400 text-lg">
        Loading...
      </div>
    );
  }

  if (!auth?.token && !isPublicRoute) {
    return null;
  }

  return (
    <div className="relative z-0 min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <ResponsiveNavbar />
      <main className={`relative z-10 pt-16 ${auth?.token && !isPublicRoute ? 'lg:ml-64' : ''}`}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default ResponsiveLayout;