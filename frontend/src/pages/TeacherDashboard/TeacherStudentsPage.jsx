
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
    <div className="p-6 max-w-6xl mx-auto bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-6">
        📘 My Subjects & Students' Progress
      </h2>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && subjectData.length === 0 && (
        <p className="text-muted-foreground">No assigned subjects or student progress found.</p>
      )}

      {subjectData.map((subject, index) => (
        <div
          key={`${subject.subject_name}-${subject.level}-${subject.department}-${index}`}
          className="mb-10"
        >
          <h3 className="text-xl font-semibold mb-3">
            📘 {(subject.subject_name || '').toUpperCase()} ({(subject.level || '').toUpperCase()} - {subject.department || 'General'})
          </h3>

          {subject.students.length === 0 ? (
            <p className="text-muted-foreground italic mb-4">No students found for this subject.</p>
          ) : (
            <div className="overflow-x-auto border border-border rounded shadow-sm bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="py-2 px-4 text-left border-b border-border">Student Name</th>
                    <th className="py-2 px-4 text-left border-b border-border">Username</th>
                    <th className="py-2 px-4 text-left border-b border-border">Topic-wise Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {subject.students.map((student) => (
                    <tr key={student.user_id} className="border-t border-border align-top hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{student.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{student.username || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {student.topics.length === 0 ? (
                          <p className="text-muted-foreground italic">No topic progress yet</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="text-xs border border-border w-full">
                              <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                  <th className="py-1 px-2 text-left border-b border-border">Topic</th>
                                  <th className="py-1 px-2 text-left border-b border-border">Score</th>
                                  <th className="py-1 px-2 text-left border-b border-border">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {student.topics.map((topic, idx) => (
                                  <tr key={idx} className="border-t border-border">
                                    <td className="py-1 px-2">{topic.topic_title}</td>
                                    <td className="py-1 px-2 text-primary font-semibold">{topic.total_score}</td>
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
