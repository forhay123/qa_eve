import { useEffect, useState } from "react";
import {
  fetchStudentsInMyClass,
  markAttendance,
  fetchAttendanceSummaryByDate,
  fetchTeacherAttendanceSummary, // ✅ Corrected import
  fetchStudentAttendanceSummary,
  getMyStudentProfile,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { FaCalendarAlt, FaCheck } from "react-icons/fa";
import { format } from "date-fns";

const MarkAttendancePage = () => {
  const { auth, loading: authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [summary, setSummary] = useState(null);
  const [totalSummary, setTotalSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await fetchStudentsInMyClass();
      setStudents(data);
      const initialStatus = {};
      data.forEach((s) => {
        initialStatus[s.id] = "present";
      });
      setAttendance(initialStatus);
    } catch (error) {
      console.error("❌ Failed to fetch students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadSummary = async () => {
    try {
      const dateStr = format(attendanceDate, "yyyy-MM-dd");
      const summaryData = await fetchAttendanceSummaryByDate(dateStr);
      setSummary(summaryData);
    } catch (error) {
      console.error("❌ Failed to fetch summary:", error);
    }
  };

  const loadTotalSummary = async (studentId = null) => {
    try {
      if (auth.role === "teacher") {
        const data = await fetchTeacherAttendanceSummary(); // ✅ Updated usage
        setTotalSummary(data);
      } else if (auth.role === "student" && studentId) {
        const data = await fetchStudentAttendanceSummary(studentId);
        setTotalSummary([data]); // wrap in array to reuse same table
      }
    } catch (error) {
      console.error("❌ Failed to fetch total summary:", error);
    }
  };

  const loadMyStudentProfile = async () => {
    try {
      const data = await getMyStudentProfile();
      setStudentProfile(data);
      await loadTotalSummary(data.id); // fetch personal summary
    } catch (error) {
      console.error("❌ Failed to fetch student profile:", error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formatted = Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        status,
        date: format(attendanceDate, "yyyy-MM-dd"),
      }));
      await markAttendance(formatted);
      alert("✅ Attendance submitted successfully.");
      await loadSummary();
      await loadTotalSummary();
    } catch (error) {
      console.error("❌ Error submitting attendance:", error);
      alert("Failed to submit attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && auth?.username) {
      if (auth.role === "student") {
        loadMyStudentProfile();
      }
      if (auth.role === "teacher") {
        loadStudents();
        loadSummary();
        loadTotalSummary();
      }
    }
  }, [authLoading, auth?.username, attendanceDate]);

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaCheck /> Mark Attendance
      </h2>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200 mb-2">
          <FaCalendarAlt />
          Attendance Date:
        </label>
        <input
          type="date"
          value={format(attendanceDate, "yyyy-MM-dd")}
          onChange={(e) => setAttendanceDate(new Date(e.target.value))}
          className="border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* ✅ Daily Summary */}
      {summary && auth.role === "teacher" && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded">Present: {summary.present || 0}</div>
          <div className="p-3 bg-red-100 dark:bg-red-900 rounded">Absent: {summary.absent || 0}</div>
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded">Late: {summary.late || 0}</div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">Excused: {summary.excused || 0}</div>
        </div>
      )}

      {/* ✅ Total Summary Table (Student or Teacher) */}
      {totalSummary.length > 0 && (
        <div className="mb-8 overflow-x-auto border rounded dark:border-gray-700">
          <h3 className="text-lg font-semibold px-3 py-2 bg-gray-100 dark:bg-gray-800">
            Total Attendance Summary
          </h3>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-left">
              <tr>
                <th className="py-2 px-3 border dark:border-gray-600">#</th>
                <th className="py-2 px-3 border dark:border-gray-600">Full Name</th>
                <th className="py-2 px-3 border dark:border-gray-600">Present</th>
                <th className="py-2 px-3 border dark:border-gray-600">Absent</th>
                <th className="py-2 px-3 border dark:border-gray-600">Late</th>
                <th className="py-2 px-3 border dark:border-gray-600">Excused</th>
              </tr>
            </thead>
            <tbody>
              {totalSummary.map((item, idx) => (
                <tr
                  key={item.student_id}
                  className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                >
                  <td className="py-2 px-3 border dark:border-gray-700">{idx + 1}</td>
                  <td className="py-2 px-3 border dark:border-gray-700">{item.full_name}</td>
                  <td className="py-2 px-3 border dark:border-gray-700">{item.present || 0}</td>
                  <td className="py-2 px-3 border dark:border-gray-700">{item.absent || 0}</td>
                  <td className="py-2 px-3 border dark:border-gray-700">{item.late || 0}</td>
                  <td className="py-2 px-3 border dark:border-gray-700">{item.excused || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Attendance Marking Table */}
      {auth.role === "teacher" && (
        <>
          <div className="overflow-x-auto border rounded dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-left">
                <tr>
                  <th className="py-2 px-3 border dark:border-gray-600">#</th>
                  <th className="py-2 px-3 border dark:border-gray-600">Full Name</th>
                  <th className="py-2 px-3 border dark:border-gray-600">Username</th>
                  <th className="py-2 px-3 border dark:border-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading students...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500 dark:text-gray-400">
                      No students found in your class.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr
                      key={student.id}
                      className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                    >
                      <td className="py-2 px-3 border dark:border-gray-700">{idx + 1}</td>
                      <td className="py-2 px-3 border dark:border-gray-700">{student.full_name}</td>
                      <td className="py-2 px-3 border dark:border-gray-700">{student.username}</td>
                      <td className="py-2 px-3 border dark:border-gray-700">
                        <select
                          value={attendance[student.id]}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || students.length === 0}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {loading ? "Submitting..." : "✅ Submit Attendance"}
          </button>
        </>
      )}
    </div>
  );
};

export default MarkAttendancePage;
