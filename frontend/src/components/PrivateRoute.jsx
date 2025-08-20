// src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { auth, loading } = useContext(AuthContext);
  const location = useLocation();

  // Wait for auth context to finish loading
  if (loading) return null; // Or loading spinner

  // Not authenticated → redirect to login
  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated → show protected route
  return children;
};

export default PrivateRoute;
