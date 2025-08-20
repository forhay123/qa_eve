import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchTeacherClasses,
  fetchStudentsByClassInTeacher,
  fetchTeacherReportCardPreviews,
} from '../../services/api';
import Layout from '../../components/Layout';

const TeacherReportPreviewPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState('First');
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🏫 Load teacher-assigned classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchTeacherClasses();
        setClasses(data);
      } catch (err) {
        console.error('Failed to fetch classes', err);
        toast.error('Failed to load classes');
      }
    };
    loadClasses();
  }, []);

  // 👨‍🎓 Load students when class is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return setStudents([]);
      const [level, department = ''] = selectedClass.split('-');
      try {
        const data = await fetchStudentsByClassInTeacher(level, department);
        setStudents(data || []);
      } catch (err) {
        console.error('Failed to fetch students', err);
        toast.error('Failed to load students');
        setStudents([]);
      }
    };

    setStudents([]);
    setSelectedStudentId('');
    setReportCards([]);
    loadStudents();
  }, [selectedClass]);

  const handlePreview = async () => {
    if (!selectedStudentId || !term || !year || !selectedClass) {
      toast.error('Fill all fields');
      return;
    }

    const [level, department = ''] = selectedClass.split('-');

    setLoading(true);
    try {
      const results = await fetchTeacherReportCardPreviews({
        student_id: selectedStudentId,
        term,
        year,
      });
      setReportCards(results);
    } catch (err) {
      toast.error(err.message || 'Could not fetch report cards');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (score) => {
    if (score === null || score === undefined) return '—';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h2 className="text-3xl font-bold mb-6 text-center">📄 Preview Class Report Cards</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls, idx) => {
            const value = `${cls.level}-${cls.department || ''}`;
            const label = `${cls.level.toUpperCase()} ${cls.department?.toUpperCase() || ''}`;
            return (
              <option key={idx} value={value}>
                {label}
              </option>
            );
          })}
        </select>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={!students.length}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">
            {students.length === 0 ? 'No students found' : '-- Select Student --'}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>

        <select
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="First">First Term</option>
          <option value="Second">Second Term</option>
          <option value="Third">Third Term</option>
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
          min="2000"
          max="2100"
        />
      </div>

      <button
        onClick={handlePreview}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold
                 px-6 py-3 rounded w-full md:w-auto
                 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {loading ? 'Loading...' : 'Preview'}
      </button>

      {/* Report Cards */}
      {reportCards.length > 0 ? (
        reportCards.map((report, index) => {
          const formattedDOB = report.student.date_of_birth
            ? new Date(report.student.date_of_birth).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—';

          const profileImage = report.student.profile_image || '/placeholder-avatar.png';

          return (
            <div key={index} className="bg-white dark:bg-gray-900 shadow-md rounded mb-10 p-6">
              {/* Student Info */}
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
                <div className="flex justify-center md:justify-start shrink-0">
                  <img
                    src={profileImage}
                    alt="Student"
                    className="w-32 h-32 max-w-[8rem] max-h-[8rem] rounded-full object-cover shadow-md border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-avatar.png';
                    }}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2 dark:text-white">{report.student.full_name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-800 dark:text-gray-300">
                    <p><strong>Level:</strong> {report.level}</p>
                    <p><strong>Guardian:</strong> {report.student.guardian_name || '—'}</p>
                    <p><strong>Contact:</strong> {report.student.contact_number || '—'}</p>
                    <p><strong>Address:</strong> {report.student.address || '—'}</p>
                    <p><strong>Date of Birth:</strong> {formattedDOB}</p>
                    <p><strong>State:</strong> {report.student.state_of_origin || '—'}</p>
                    <p><strong>Gender:</strong> {report.student.gender || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              <h4 className="text-xl font-semibold mb-2 dark:text-white">📅 Attendance Summary</h4>
              <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 text-lg text-gray-800 dark:text-gray-300">
                <li><strong>Total Days:</strong> {report.attendance?.total_days ?? '—'}</li>
                <li><strong>Present:</strong> {report.attendance?.present ?? '—'}</li>
                <li><strong>Absent:</strong> {report.attendance?.absent ?? '—'}</li>
                <li><strong>Late:</strong> {report.attendance?.late ?? '—'}</li>
                <li><strong>Excused:</strong> {report.attendance?.excused ?? '—'}</li>
              </ul>

              {/* Subject Scores */}
              <h4 className="text-xl font-semibold mb-2 dark:text-white">📚 Subject Scores</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 dark:border-gray-600 rounded text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="border px-3 py-2 text-left">Subject</th>
                      <th className="border px-3 py-2 text-center">1st Test</th>
                      <th className="border px-3 py-2 text-center">2nd Test</th>
                      <th className="border px-3 py-2 text-center">Exam</th>
                      <th className="border px-3 py-2 text-center">Total</th>
                      <th className="border px-3 py-2 text-center">Grade</th>
                      <th className="border px-3 py-2 text-left">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 dark:text-gray-100">
                    {report.subjects.map((subj, idx) => {
                      const total = subj.total ?? null;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="border px-3 py-2">{subj.subject}</td>
                          <td className="border px-3 py-2 text-center">{subj.first_test_score ?? '—'}</td>
                          <td className="border px-3 py-2 text-center">{subj.second_test_score ?? '—'}</td>
                          <td className="border px-3 py-2 text-center">{subj.exam_score ?? '—'}</td>
                          <td className="border px-3 py-2 text-center font-semibold">{total ?? '—'}</td>
                          <td className="border px-3 py-2 text-center">{getGrade(total)}</td>
                          <td className="border px-3 py-2">{subj.comment || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mt-6 text-center">No report cards found.</p>
      )}
    </div>
  );
};

export default TeacherReportPreviewPage;
