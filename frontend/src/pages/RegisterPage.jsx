// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    student_class: '',
    state_of_origin: '',
    level: '',
    department: '',
    role: 'student',
  });

  const isAdmin = auth?.token && auth?.role === 'admin';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedData = {
      ...formData,
      role: formData.role.trim().toLowerCase(),
      level: formData.role === 'student' ? formData.level.trim().toLowerCase() : '',
      department:
        formData.role === 'student' &&
        ['ss1', 'ss2', 'ss3'].includes(formData.student_class.trim().toLowerCase())
          ? formData.department.trim().toLowerCase()
          : '',
      email: null, // ⬅️ Auto-generate email in backend
    };

    try {
      await registerUser(cleanedData);
      navigate('/students');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const showLevel = formData.role === 'student';
  const showDepartment =
    formData.role === 'student' &&
    ['ss1', 'ss2', 'ss3'].includes(formData.student_class.trim().toLowerCase());

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <p className="text-red-600 text-xl font-semibold">
          ⛔ Access Denied. Only admins can register users.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Register New User</h2>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div>
            <label className="block mb-1 font-medium text-gray-700">Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">Class:</label>
              <select
                name="student_class"
                value={formData.student_class}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                required
              >
                <option value="">Select Class</option>
                <option value="jss1">LFC</option>
                <option value="jss2">LDC</option>
              </select>
            </div>
          )}

          <input
            type="text"
            name="state_of_origin"
            placeholder="State of Origin"
            value={formData.state_of_origin}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {showLevel && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">Level:</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                required
              >
                <option value="">Select Class Interval</option>
                <option value="junior">Standard (4 - 8 weeks)</option>
                <option value="senior">Accelerated (7 to 10 days)</option>
              </select>
            </div>
          )}

          {showDepartment && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">Department:</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                required
              >
                <option value="">Select Department</option>
                <option value="science">Science</option>
                <option value="commercial">Commercial</option>
                <option value="arts">Arts</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
          >
            Register User
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
