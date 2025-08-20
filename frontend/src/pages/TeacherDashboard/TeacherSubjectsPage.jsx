import React, { useEffect, useState } from 'react';
import { getSubjectsWithStudentProgress } from '../../services/api';

const TeacherSubjectsPage = () => {
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSubjectsWithStudentProgress();
        setSubjectData(data);
      } catch (err) {
        setError(err.message || 'Failed to load subject data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          📘 My Subjects & Students' Progress
        </h2>

        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && subjectData.length === 0 && (
          <p className="text-gray-600">No assigned subjects or student progress found.</p>
        )}

        {subjectData.map((subject, index) => (
          <div
            key={`${subject.subject_name}-${subject.level}-${subject.department}-${index}`}
            className="mb-10"
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              📘 {(subject.subject_name || '').toUpperCase()} ({(subject.level || '').toUpperCase()} - {subject.department || 'General'})
            </h3>

            {subject.students.length === 0 ? (
              <p className="text-gray-500 italic mb-4">No students found for this subject.</p>
            ) : (
              <div className="overflow-x-auto border rounded shadow-sm bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="py-2 px-4 text-left">Student Name</th>
                      <th className="py-2 px-4 text-left">Username</th>
                      <th className="py-2 px-4 text-left">Topic-wise Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.students.map((student) => (
                      <tr key={student.user_id} className="border-t align-top">
                        <td className="py-3 px-4 font-medium">{student.full_name || 'N/A'}</td>
                        <td className="py-3 px-4">{student.username || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {student.topics.length === 0 ? (
                            <p className="text-gray-500 italic">No topic progress yet</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="text-xs border w-full">
                                <thead className="bg-gray-50 text-gray-700">
                                  <tr>
                                    <th className="py-1 px-2 text-left">Topic</th>
                                    <th className="py-1 px-2 text-left">Score</th>
                                    <th className="py-1 px-2 text-left">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {student.topics.map((topic, idx) => (
                                    <tr key={idx} className="border-t">
                                      <td className="py-1 px-2">{topic.topic_title}</td>
                                      <td className="py-1 px-2 text-blue-600 font-semibold">{topic.total_score}</td>
                                      <td className="py-1 px-2">{topic.total_questions}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
  );
};

export default TeacherSubjectsPage;
