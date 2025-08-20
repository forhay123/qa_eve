// src/pages/TeacherDashboard/TeacherViewResourcesPage.jsx
import React, { useEffect, useState } from 'react';
import { getTeacherResources, downloadResource } from '../../services/api';

const TeacherViewResourcesPage = () => {
  const [resources, setResources] = useState([]);

  const loadResources = async () => {
    try {
      const res = await getTeacherResources();
      setResources(res);
    } catch (err) {
      console.error('❌ Failed to load resources:', err.message);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  return (
    <div className="p-6 app-main-content">
      <h2 className="text-2xl font-bold mb-4 opacity-0">📚 My Subject Resources</h2>
      <h2 className="text-2xl font-bold mb-4">📚 My Subject Resources</h2>

      {resources.length === 0 ? (
        <p className="text-gray-500">No resources found for your subjects.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Title</th>
                <th className="border px-4 py-2 text-left">Subject</th>
                <th className="border px-4 py-2 text-left">Class</th>
                <th className="border px-4 py-2 text-left">Level</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{r.title}</td>
                  <td className="border px-4 py-2">{r.subject}</td>
                  <td className="border px-4 py-2">{r.student_class}</td>
                  <td className="border px-4 py-2 capitalize">{r.level}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => downloadResource(r.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherViewResourcesPage;
