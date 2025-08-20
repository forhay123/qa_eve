import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  fetchAllClasses,
  fetchStudentsByClass,
  fetchAdminReportCardPreview,
} from '../services/api';

const ReportCardPreviewPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState('First');
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef();

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchAllClasses();
        const formatted = data.map((c) => ({
          label: `${c.level.toUpperCase()} ${c.department ? `(${c.department})` : ''}`,
          value: `${c.level}|${c.department || ''}`,
        }));
        setClasses(formatted);
      } catch (err) {
        console.error('Failed to fetch classes', err);
        toast.error('Could not load classes');
      }
    };
    loadClasses();
  }, []);

  // Load students when selectedClass changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return setStudents([]);

      const [level, department] = selectedClass.split('|');
      try {
        const data = await fetchStudentsByClass(level, department || '');
        setStudents(data || []);
      } catch (err) {
        console.error('Failed to fetch students', err);
        toast.error('Could not load students');
        setStudents([]);
      }
    };

    setStudents([]);
    setSelectedStudentId('');
    setReportCards([]);
    loadStudents();
  }, [selectedClass]);

  // Fetch report card preview
  const handlePreview = async () => {
    if (!selectedStudentId || !term || !year) {
      toast.error('Fill all fields');
      return;
    }
    setLoading(true);
    try {
      const results = await fetchAdminReportCardPreview({
        student_id: selectedStudentId,
        term,
        year,
      });
      setReportCards([results]);
    } catch (err) {
      toast.error(err.message || 'Could not fetch report card');
    } finally {
      setLoading(false);
    }
  };

  // Letter grade based on percentage
  const getLetterGrade = (pct) => {
    if (pct === null || pct === undefined || isNaN(pct)) return '—';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  // Print handler
  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h2 className="text-3xl font-bold mb-6 text-center">🧑‍💼 Admin Report Card Preview</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls, idx) => {
            // Extract just the level from the value
            const [level] = cls.value.split('|');

            // If `cls.value` is something like "jss1" or "jss2", apply the custom labels
            let displayLabel = cls.label;
            if (level.toLowerCase() === "jss1") displayLabel = "LFC";
            if (level.toLowerCase() === "jss2") displayLabel = "LDC";

            return (
              <option key={idx} value={cls.value}>
                {displayLabel}
              </option>
            );
          })}
        </select>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(Number(e.target.value))}
          disabled={!students.length}
          className="p-3 rounded shadow-sm border dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">
            {students.length === 0 ? 'No students found' : '-- Select Student --'}
          </option>
          {students.map((s) => (
            <option key={s.user_id} value={s.user_id}>
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
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded w-full md:w-auto dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {loading ? 'Loading...' : 'Preview'}
      </button>

      {/* Print & Download buttons */}
      {reportCards.length > 0 && (
        <div className="flex gap-4 justify-center mt-4 mb-6">
          <button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => alert('PDF download not implemented')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded"
          >
            📄 Download PDF
          </button>
        </div>
      )}

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
            <div
              key={index}
              ref={printRef}
              className="bg-white dark:bg-gray-900 shadow-md rounded mb-10 p-6 print:p-0 print:shadow-none"
            >
              {/* Student Info */}
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
                <div className="flex justify-center md:justify-start shrink-0">
                  <img
                    src={profileImage}
                    alt="Student"
                    className="w-32 h-32 rounded-full object-cover shadow-md border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-avatar.png';
                    }}
                  />
                </div>
                <div className="flex-1 text-gray-800 dark:text-gray-300">
                  <h3 className="text-2xl font-semibold mb-2 dark:text-white">
                    {report.student.full_name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      const firstScore = subj.first_test_score ?? 0;
                      const firstTotal = subj.first_test_total_questions ?? 0;
                      const secondScore = subj.second_test_score ?? 0;
                      const secondTotal = subj.second_test_total_questions ?? 0;
                      const examScore = subj.exam_score ?? 0;
                      const examTotal = subj.exam_total_questions ?? 0;

                      const totalScore = firstScore + secondScore + examScore;
                      const totalPossible = firstTotal + secondTotal + examTotal;
                      const totalPct = totalPossible > 0 ? (totalScore / totalPossible) * 100 : null;
                      const grade = getLetterGrade(totalPct);

                      const pctString = (score, total) =>
                        total > 0 ? `${((score / total) * 100).toFixed(2)}%` : '—';

                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="border px-3 py-2">{subj.subject}</td>
                          <td className="border px-3 py-2 text-center">
                            {firstScore} / {firstTotal} <br />
                            <span className="text-xs text-muted-foreground">{pctString(firstScore, firstTotal)}</span>
                          </td>
                          <td className="border px-3 py-2 text-center">
                            {secondScore} / {secondTotal} <br />
                            <span className="text-xs text-muted-foreground">{pctString(secondScore, secondTotal)}</span>
                          </td>
                          <td className="border px-3 py-2 text-center">
                            {examScore} / {examTotal} <br />
                            <span className="text-xs text-muted-foreground">{pctString(examScore, examTotal)}</span>
                          </td>
                          <td className="border px-3 py-2 text-center font-semibold">
                            {totalScore} / {totalPossible} <br />
                            <span className="text-xs text-muted-foreground">
                              {totalPct !== null ? `${totalPct.toFixed(2)}%` : '—'}
                            </span>
                          </td>
                          <td className="border px-3 py-2 text-center">{grade}</td>
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
        <p className="text-gray-500 dark:text-gray-400 mt-6 text-center">No report card found.</p>
      )}
    </div>
  );
};

export default ReportCardPreviewPage;
