import React from 'react';
import Layout from '@components/Layout';

const ParentDashboardPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Welcome, Parent</h1>
        <p className="text-gray-700">
          This is your dashboard. From here you can:
        </p>
        <ul className="list-disc pl-6 mt-4 text-gray-600">
          <li>Monitor your child's academic progress</li>
          <li>View attendance and report cards</li>
          <li>Get personalized recommendations</li>
          <li>Receive announcements from the school</li>
        </ul>
      </div>
    </Layout>
  );
};

export default ParentDashboardPage;
