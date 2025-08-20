import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireParent = ({ children }) => {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Optional: replace with spinner
  if (!auth?.token || auth.role !== 'parent') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireParent;
