// src/pages/StudentDashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchStudentSubjects,
  fetchStudentProgress,
} from '../services/api';
import ProgressPanel from '../components/ProgressPanel';
import PersonalizationCard from '../components/PersonalizationCard';
import { getNetworkInfo, testBackendConnection } from '../utils/networkUtils';
import './DashboardPage.css';

const StudentDashboardPage = () => {
  const { auth } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const level = auth?.level?.trim().toLowerCase() || '';
  const department = auth?.department?.trim() || '';

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found — skipping dashboard data load.');
        setLoading(false);
        return;
      }

      // Log basic network info
      console.log('📊 Network Info:', getNetworkInfo());

      try {
        console.log('📤 Fetching subjects for:', level, department);
        const subjectsData = await fetchStudentSubjects(level, department);
        console.log('📥 Subjects fetched:', subjectsData);

        console.log('📤 Fetching progress...');
        const progress = await fetchStudentProgress();
        console.log('📥 Progress fetched:', progress);

        setSubjects(subjectsData);
        setProgressData(progress);
        setConnectionError(null);
      } catch (err) {
        console.error('❌ Dashboard Load Error:', err.message);
        setConnectionError(err.message);

        // Ping backend for debugging
        const hostname = window.location.hostname;
        const baseUrl =
          hostname === 'localhost' || hostname === '127.0.0.1'
            ? 'http://127.0.0.1:8000'
            : `http://${hostname}:8000`;
        testBackendConnection(baseUrl);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.level) {
      loadDashboardData();
    }
  }, [auth?.level, auth?.department]);

  return (
    <div className="app-main-content">
      <div className="dashboard-container">
        <div className="dashboard">
          <h1>🎓 Welcome, {auth.fullName || auth.username}</h1>
          <p className="mb-6">
            This is your personalized student dashboard. Select a subject to begin learning:
          </p>

          {connectionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Connection Error:</strong> {connectionError}
              <br />
              <small>
                Please check your network or make sure the backend server is running.
              </small>
            </div>
          )}

          {loading ? (
            <p>Loading dashboard...</p>
          ) : (
            <>
              {subjects.length > 0 ? (
                <div className="cards mb-8">
                  {subjects.map((subject) => (
                    <Link
                      key={subject.id}
                      to={`/subjects/${level}/${subject.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="card"
                    >
                      📘 {subject.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No subjects found for your class. Please contact your teacher or admin.
                </p>
              )}

              <h2 className="mt-6 text-xl font-bold">📊 Your Learning Progress</h2>
              {progressData.length > 0 ? (
                <ProgressPanel progress={progressData} />
              ) : (
                <p className="text-gray-500">
                  No progress data yet. Start learning to track your progress!
                </p>
              )}

              <div className="mt-10">
                <h2 className="text-xl font-bold mb-2">🧠 AI Recommendations</h2>
                <PersonalizationCard />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
