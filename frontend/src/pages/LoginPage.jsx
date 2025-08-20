import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const { token, user } = await loginUser(username, password);
      const normalizedRole = (user.role || 'student').trim().toLowerCase();
      const normalizedLevel = (user.level || '').trim().toLowerCase();
      const normalizedDepartment = (user.department || '').trim().toLowerCase();

      setAuth({
        token,
        username: user.username,
        fullName: user.full_name,
        role: normalizedRole,
        level: normalizedLevel,
        department: normalizedDepartment,
      });

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('username', user.username);
      localStorage.setItem('fullName', user.full_name);
      localStorage.setItem('isAdmin', normalizedRole === 'admin');
      localStorage.setItem('level', normalizedLevel);
      localStorage.setItem('department', normalizedDepartment);

      switch (normalizedRole) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'teacher':
          navigate('/teacher-dashboard');
          break;
        case 'parent':
          navigate('/parent-dashboard');
          break;
        case 'student':
        default:
          navigate('/student-dashboard');
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Login failed. Please check your username and password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300 dark:from-gray-900 dark:to-gray-800 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-red-700 dark:text-white mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Login to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-md transition"
          >
            Login
          </button>
          {errorMsg && (
            <p className="text-red-600 text-sm text-center mt-2">{errorMsg}</p>
          )}
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don’t have an account?{' '}
          <span className="text-red-700 hover:underline cursor-pointer">
            Contact your school admin
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
