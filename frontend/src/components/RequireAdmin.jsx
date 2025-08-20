import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const RequireAdmin = ({ children }) => {
  const { auth } = useContext(AuthContext);

  // Not logged in
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not an admin
  if (auth?.role !== 'admin') {
    return <Navigate to={`/${auth.role}-dashboard`} replace />;
  }

  return children;
};

export default RequireAdmin;
