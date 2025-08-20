import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireTeacher = ({ children }) => {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Optional: replace with spinner
  if (!auth?.token || auth.role !== 'teacher') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireTeacher;
