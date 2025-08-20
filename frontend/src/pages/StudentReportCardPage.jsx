
import React, { useState, useRef } from 'react';
import { getStudentReportPreview } from '../services/api';

const StudentReportCardPage = () => {
  const [term, setTerm] = useState('term_1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef();

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStudentReportPreview(term, year);
      setReport(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch report card');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) window.print();
  };

  const termDisplay = {
    term_1: 'First Term',
    term_2: 'Second Term',
    term_3: 'Third Term',
  }[term] || term;

  const safeNumber = (n) => (n == null || isNaN(n) ? 0 : Number(n));
  const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const formattedDOB = report?.student?.date_of_birth
    ? new Date(report.student.date_of_birth).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 bg-background min-h-screen">
      <h2 className="text-3xl font-bold mb-4 text-center text-foreground">My Report Card</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="border border-input bg-background text-foreground rounded px-3 py-2"
          disabled={loading}
        >
          <option value="term_1">Term 1</option>
          <option value="term_2">Term 2</option>
          <option value="term_3">Term 3</option>
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          min={2000}
          max={2100}
          disabled={loading}
          className="border border-input bg-background text-foreground rounded px-3 py-2 w-24"
        />

        <button
          onClick={fetchReport}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
          {loading ? 'Loading...' : 'Fetch'}
        </button>

        {report?.subjects?.length > 0 && (
          <>
            <button
              onClick={handlePrint}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={() => alert('PDF download not implemented')}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors"
            >
              📄 Download PDF
            </button>
          </>
        )}
      </div>

      {error && <p className="text-destructive font-medium">{error}</p>}

      {report ? (
        <div ref={printRef} className="bg-card shadow-md rounded p-6 mt-6 print:p-0 print:shadow-none">
          <h3 className="text-xl font-semibold mb-4 text-center text-foreground">
            {termDisplay} {year}
          </h3>

          {/* Student Info */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {report.student.profile_image && (
              <img
                src={report.student.profile_image}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="text-sm text-foreground">
              <h4 className="text-lg font-semibold mb-2">Student Info</h4>
              <p><strong>Name:</strong> {report.student.full_name}</p>
              <p><strong>Level:</strong> {report.level}</p>
              <p><strong>Guardian:</strong> {report.student.guardian_name || '-'}</p>
              <p><strong>Contact:</strong> {report.student.contact_number || '-'}</p>
              <p><strong>Address:</strong> {report.student.address || '-'}</p>
              <p><strong>Date of Birth:</strong> {formattedDOB}</p>
              <p><strong>State of Origin:</strong> {report.student.state_of_origin || '-'}</p>
              <p><strong>Gender:</strong> {report.student.gender || '-'}</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-foreground">Attendance Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-foreground">
              <p><strong>Total Days:</strong> {report.attendance?.total_days ?? '-'}</p>
              <p><strong>Present:</strong> {report.attendance?.present ?? '-'}</p>
              <p><strong>Absent:</strong> {report.attendance?.absent ?? '-'}</p>
              <p><strong>Late:</strong> {report.attendance?.late ?? '-'}</p>
              <p><strong>Excused:</strong> {report.attendance?.excused ?? '-'}</p>
            </div>
          </div>

          {/* Subjects */}
          {report.subjects?.length > 0 ? (
            <div className="overflow-x-auto">
              <h4 className="text-lg font-semibold mb-2 text-foreground">Subject Scores</h4>
              <table className="w-full text-sm border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-2 text-foreground">Subject</th>
                    <th className="border border-border p-2 text-foreground">First Test</th>
                    <th className="border border-border p-2 text-foreground">Second Test</th>
                    <th className="border border-border p-2 text-foreground">Exam</th>
                    <th className="border border-border p-2 text-foreground">Total</th>
                    <th className="border border-border p-2 text-foreground">Grade</th>
                    <th className="border border-border p-2 text-foreground">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjects.map((subject, idx) => {
                    const first = safeNumber(subject.first_test_score);
                    const second = safeNumber(subject.second_test_score);
                    const exam = safeNumber(subject.exam_score);
                    const firstTotalQ = safeNumber(subject.first_test_total_questions);
                    const secondTotalQ = safeNumber(subject.second_test_total_questions);
                    const examTotalQ = safeNumber(subject.exam_total_questions);

                    const total = first + second + exam;
                    const totalPossible = firstTotalQ + secondTotalQ + examTotalQ;

                    const firstPct = firstTotalQ ? ((first / firstTotalQ) * 100).toFixed(2) : '-';
                    const secondPct = secondTotalQ ? ((second / secondTotalQ) * 100).toFixed(2) : '-';
                    const examPct = examTotalQ ? ((exam / examTotalQ) * 100).toFixed(2) : '-';
                    const totalPct = totalPossible > 0 ? ((total / totalPossible) * 100).toFixed(2) : '-';
                    const grade = getLetterGrade(totalPct !== '-' ? parseFloat(totalPct) : 0);

                    return (
                      <tr key={idx} className="text-center">
                        <td className="border border-border p-2 text-foreground">{subject.subject}</td>
                        <td className="border border-border p-2 text-foreground">
                          {`${first.toFixed(2)} / ${firstTotalQ}`}<br />
                          <span className="text-xs text-muted-foreground">{firstPct !== '-' ? `${firstPct}%` : '-'}</span>
                        </td>
                        <td className="border border-border p-2 text-foreground">
                          {`${second.toFixed(2)} / ${secondTotalQ}`}<br />
                          <span className="text-xs text-muted-foreground">{secondPct !== '-' ? `${secondPct}%` : '-'}</span>
                        </td>
                        <td className="border border-border p-2 text-foreground">
                          {`${exam.toFixed(2)} / ${examTotalQ}`}<br />
                          <span className="text-xs text-muted-foreground">{examPct !== '-' ? `${examPct}%` : '-'}</span>
                        </td>
                        <td className="border border-border p-2 text-foreground">
                          {`${total.toFixed(2)} / ${totalPossible}`}<br />
                          <span className="text-xs text-muted-foreground">{totalPct !== '-' ? `${totalPct}%` : '-'}</span>
                        </td>
                        <td className="border border-border p-2 text-foreground">{grade}</td>
                        <td className="border border-border p-2 text-foreground">{subject.comment || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mt-4">No subject scores available for this term.</p>
          )}
        </div>
      ) : (
        !loading && <p className="text-muted-foreground mt-6">No report found for this term/year.</p>
      )}
    </div>
  );
};

export default StudentReportCardPage;