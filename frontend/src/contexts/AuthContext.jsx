// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchWithAuth } from '../services/api';

export const AuthContext = createContext();

const defaultAuthState = {
  token: null,
  username: null,
  role: null,
  isAdmin: false,
  isStudent: false,
  isTeacher: false,
  isParent: false,
  level: null,
  department: null,
  fullName: null,
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(defaultAuthState);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.clear();
    setAuth(defaultAuthState);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchWithAuth('/me/')
        .then((user) => {
          const role = user.role || null;

          const updatedAuth = {
            token,
            username: user.username,
            role,
            isAdmin: role === 'admin',
            isStudent: role === 'student',
            isTeacher: role === 'teacher',
            isParent: role === 'parent',
            level: user.level || null,
            department: user.department || null,
            fullName: user.full_name || null,
          };

          setAuth(updatedAuth);

          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('username', user.username);
          localStorage.setItem('role', role);
          localStorage.setItem('isAdmin', role === 'admin');
          localStorage.setItem('isStudent', role === 'student');
          localStorage.setItem('isTeacher', role === 'teacher');
          localStorage.setItem('isParent', role === 'parent');
          localStorage.setItem('level', user.level || '');
          localStorage.setItem('department', user.department || '');
          localStorage.setItem('fullName', user.full_name || '');
        })
        .catch(() => {
          localStorage.clear();
          setAuth(defaultAuthState);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
