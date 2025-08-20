// src/components/AdminRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { auth, loading } = useContext(AuthContext);
  const location = useLocation();

  // Wait for auth state to resolve
  if (loading) return null; // Or a loading spinner

  // Not logged in → redirect to login
  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not an admin → redirect to their dashboard
  if (auth?.role !== 'admin') {
    return <Navigate to={`/${auth.role}-dashboard`} replace />;
  }

  // Admin authenticated → allow access
  return children;
};

export default AdminRoute;
