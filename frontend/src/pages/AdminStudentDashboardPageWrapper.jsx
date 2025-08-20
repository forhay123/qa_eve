// AdminStudentDashboardPageWrapper.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import AdminStudentDashboardPage from '../components/AdminStudentDashboardPage';
import ResponsiveLayout from '../layouts/ResponsiveLayout';

const AdminStudentDashboardPageWrapper = () => {
  const { studentId } = useParams();
  console.log("✅ Rendering AdminStudentDashboardPageWrapper for ID:", studentId);

  return <AdminStudentDashboardPage studentId={studentId} />
};

export default AdminStudentDashboardPageWrapper;
