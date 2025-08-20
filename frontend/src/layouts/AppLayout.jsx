// src/layouts/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = () => {
  const { auth } = useAuth();

  return (
    <>
      <Navbar />
      <div className={`${auth?.token ? 'lg:ml-64' : ''} pt-16 min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AppLayout;
