import React, { useEffect, useState } from 'react';
import {
  fetchAllClasses,
  fetchStudentsByClass,
  fetchSubjects,
  fetchProgressSummary,
  fetchUserById,
} from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const ProgressSummary = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchAllClasses();
        setClasses(res);
      } catch (err) {
        console.error('❌ Failed to load classes:', err.message);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return;
      const [level, department = ''] = selectedClass.split('-');
      try {
        const res = await fetchStudentsByClass(level, department);
        setStudents(res);
      } catch (err) {
        console.error('❌ Failed to load students:', err.message);
      }
    };

    setStudents([]);
    setSelectedStudentId('');
    setSummaryData([]);
    setSubjects([]);
    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudentId) {
        setSummaryData([]);
        setSubjects([]);
        return;
      }

      setLoading(true);
      try {
        const user = await fetchUserById(selectedStudentId);
        const level = user.level;
        const department = user.department || '';
        const subjectRes = await fetchSubjects(level, department, 'admin');
        const summaryRes = await fetchProgressSummary(selectedStudentId);
        setSubjects(subjectRes);
        setSummaryData(summaryRes.weekly || []);
      } catch (err) {
        console.error('❌ Error fetching student progress:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [selectedStudentId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">📈 Weekly Progress Summary</h2>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Class
          </label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose Class --</option>
            {classes.map((cls, idx) => (
              <option key={idx} value={`${cls.level}-${cls.department || ''}`}>
                {cls.level.toUpperCase()} {cls.department?.toUpperCase() || ''}
              </option>
            ))}
          </select>
        </div>

        {students.length > 0 && (
          <div>
            <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Student
            </label>
            <select
              id="student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500 mt-6">Loading summary...</p>
      ) : summaryData.length > 0 ? (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow bg-white mb-10">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Week</th>
                  <th className="text-left px-4 py-3">Average Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaryData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{entry.week}</td>
                    <td className="px-4 py-3">{entry.avg_score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Weekly Progress Graph</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaryData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_score" fill="#3B82F6" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        selectedStudentId && (
          <p className="text-center text-gray-500 mt-10">
            No summary data available for this student.
          </p>
        )
      )}
    </div>
  );
};

export default ProgressSummary;
