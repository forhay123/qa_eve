// src/pages/DashboardLayout.jsx
import React from 'react';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ children }) => (
  <div>
    <Navbar />
    <main className="p-6">
      {children}
    </main>
  </div>
);

export default DashboardLayout;
