// Re-export everything from the new modular structure
export * from './auth';
export * from './config';
export * from './utils';
export * from './quizzes';
export * from './subjects';
export * from './progress';

// Keep the remaining functions that weren't moved to modules yet
import { BASE_URL, getToken } from './config';
import { fetchWithAuth } from './utils';

export const getTodayTimetable = async () => {
  return await fetchWithAuth('/timetable/today');
};


export async function fetchStudentDashboard() {
  return await fetchWithAuth('/students/dashboard');
}

export const fetchAdminDashboardData = async () => {
  return await fetchWithAuth('/admin-activity/dashboard');
};



// ---------- PDF Upload & Question Generation ----------
export const uploadPDF = async (formData) => {
  const res = await fetch(`${BASE_URL}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }

  return await res.json();
};

export const generateQuestions = async (pdfId, maxPerChunk = 35, maxTotal = 100) => {
  const url = new URL(`${BASE_URL}/generate-questions/${pdfId}`);
  url.searchParams.append('max_per_chunk', maxPerChunk);
  url.searchParams.append('max_total', maxTotal);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to generate questions');
  }

  return await res.json();
};

export const getQuestionsByPdfId = async (pdfId) => {
  return await fetchWithAuth(`/questions/by-pdf/${pdfId}`);
};

export const submitAnswer = async (payload) => {
  return await fetchWithAuth('/answer/', 'POST', payload);
};

// ---------- Topics ----------
export const fetchTopicsForSubject = async (level, subjectName) => {
  return await fetchWithAuth(`/subjects/${level}/${subjectName}/topics`);
};

export const createTopic = async (level, subject, formData) => {
  return await fetchWithAuth(`/topics/subjects/${level}/${subject}/topics`, 'POST', formData, true);
};


export const updateTopic = async (id, formValues) => {
  const token = getToken();
  const formData = new FormData();

  if (!formValues.title?.trim()) {
    throw new Error("Title is required");
  }

  if (
    formValues.week_number === undefined ||
    formValues.week_number === null ||
    isNaN(Number(formValues.week_number))
  ) {
    throw new Error("Week number is required and must be a number");
  }

  formData.append("title", formValues.title.trim());
  formData.append("week_number", formValues.week_number.toString());

  if (formValues.file instanceof File) {
    formData.append("file", formValues.file);
  }

  const res = await fetch(`${BASE_URL}/topics/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let error = {};
    try {
      error = JSON.parse(text);
    } catch {}
    throw new Error(error.detail || "Failed to update topic");
  }

  return await res.json();
};

export const deleteTopic = async (topicId) => {
  return await fetchWithAuth(`/topics/${topicId}`, 'DELETE');
};

export const getTopicById = async (topicId) => {
  return await fetchWithAuth(`/topics/${topicId}`);
};



// ---------- Students ----------
export const getStudents = async () => {
  return await fetchWithAuth('/students/');
};

export const deleteStudent = async (id) => {
  return await fetchWithAuth(`/students/${id}`, 'DELETE');
};

export const updateStudent = async (id, data) => {
  return await fetchWithAuth(`/students/${id}`, 'PUT', data);
};

export const fetchStudentsByClass = async (level, department = '') => {
  const query = new URLSearchParams({ level, department }).toString();
  const endpoint = `/admin/progress/get-students-by-class?${query}`;

  console.log("📡 Calling fetchStudentsByClass with endpoint:", endpoint); // 👈 Add this line

  return await fetchWithAuth(endpoint);
};



export const fetchAllClasses = async () => {
  return await fetchWithAuth('/admin/progress/get-classes');
};

export const fetchUserById = async (id) => { 
  return await fetchWithAuth(`/admin/progress/user/${id}`);
};


export const uploadTopicPdf = async (topicId, file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/topics/${topicId}/upload-pdf`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to upload PDF and generate questions");
  }

  return res.json();
};

// ---------- New function to fetch all topics for a student's subjects ----------
export const fetchAllTopicsForStudent = async () => {
    return await fetchWithAuth('/topics/my-subjects');
};

// PDF Approval API call
export const togglePdfApproval = async (topicId, isApproved) => {
  const formData = new FormData();
  formData.append('is_pdf_approved', isApproved);
  
  const token = getToken();
  const response = await fetch(`${BASE_URL}/topics/${topicId}/toggle-approval`, {
    method: 'PATCH',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};



export const getUserTimetable = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.level) throw new Error("User level not found in localStorage");

  const url = `${BASE_URL}/timetable/${user.level}`;

  const res = await fetch(url, {
    headers: { 
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json'
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch timetable: ${errorText}`);
  }

  return res.json();
};

export const createTimetable = async (data) => {
  const url = `${BASE_URL}/timetable/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create timetable: ${errorText}`);
  }

  return res.json();
};

export const getAllTimetables = async () => {
  const res = await fetch(`${BASE_URL}/timetable`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error("Failed to fetch timetable");
  return res.json();
};

export const deleteTimetable = async (id) => {
  return await fetchWithAuth(`/timetable/${id}`, 'DELETE');
};

export const updateTimetable = async (id, data) => {
  const res = await fetch(`${BASE_URL}/timetable/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update timetable: ${errorText}`);
  }

  return await res.json();
};



export const fetchTeacherTimetable = async () => {
  return await fetchWithAuth('/timetable/teacher');
};

// 🔄 Get the current student's profile
export const getMyStudentProfile = async () => {
  return await fetchWithAuth(`/student_profiles/me`);
};

// 🔍 Get a student profile by user ID (admin use)
export const getStudentProfileByUserId = async (userId) => {
  return await fetchWithAuth(`/student_profiles/${userId}`);
};

export const getAllStudentProfiles = async () => {
  return await fetchWithAuth(`/student_profiles`);
};

// ➕ Admin: Create a new student profile
export const createStudentProfile = async (data) => {
  return await fetchWithAuth(`/student_profiles`, 'POST', data);
};

// 🛠️ Admin: Update a student profile by user ID
export const updateStudentProfile = async (userId, data) => {
  return await fetchWithAuth(`/student_profiles/${userId}`, 'PUT', data);
};

export const updateMyStudentProfile = async (data) => {
  return await fetchWithAuth('/student_profiles/me', 'PUT', data);
};

export const uploadProfileImage = async (formData) => {
  return await fetchWithAuth('/student_profiles/me/image', 'PUT', formData);
};



export const submitTestAnswers = ({ subject, test_type, answers }) =>
  fetchWithAuth('/answers/submit-test/', 'POST', { subject, test_type, answers });


export const submitExamAnswers = ({ subject, level, test_type, total_score, total_questions, answers }) =>
  fetchWithAuth('/answers/submit-test/', 'POST', { subject, level, test_type, total_score, total_questions, answers });


export const checkTestSubmission = async ({ subject, test_type }) => {
  return fetchWithAuth(`/answers/check-submission/?subject=${subject}&test_type=${test_type}`);
};


export const fetchTeacherClasses = async () => {
  return await fetchWithAuth('/teacher/get-classes');
};


export const fetchStudentsByClassInTeacher = async (level, department) => {
  return await fetchWithAuth(`/teacher/get-students-by-class?level=${level}&department=${department}`);
};



export const getReportCard = async (studentId, term, year) => {
  return await fetchWithAuth(`/report-cards/${studentId}/${term}/${year}`);
};

export const getMyReportCards = async (term, year) => {
  return await fetchWithAuth(`/report-cards/me?term=${term}&year=${year}`);
};

export const uploadReportCardsBulk = async (data) => {
  return await fetchWithAuth(`/report-cards/bulk`, 'POST', data);
};

// 🔎 Admin: Search report cards by name and class
export const searchReportCards = async (studentId, term, year) => {
  const url = `/report-cards/search/?student_id=${studentId}&term=${term}&year=${year}`;
  return await fetchWithAuth(url);
};



// 📝 Admin: Update a report card (e.g., add or edit comment)
export const updateReportCard = async (id, data) => {
  return await fetchWithAuth(`/report-cards/${id}`, 'PUT', data);
};

// ✅ Generate report card for a single student
export const generateStudentReportCard = async (student_id, term, year) => {
  return await fetchWithAuth(`/report-cards/generate-student/`, 'POST', {
    student_id,
    term,
    year,
  });
};

// 🔍 Admin: Search and preview full report for a student by name and class
export const previewReportCardByName = async (level, name, term, year) => {
  const url = `/report-cards/search/preview?level=${level}&name=${encodeURIComponent(name)}&term=${term}&year=${year}`;
  return await fetchWithAuth(url);
};

export const getStudentReportPreview = async (term, year) => {
  return await fetchWithAuth(`/report-cards/preview/me?term=${term}&year=${year}`);
};

// ✅ 1. Fetch report cards assigned to the teacher
export const fetchTeacherReportCards = async (filters = {}) => {
  // ✅ Filter out undefined or null query params
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
  );

  const params = new URLSearchParams(cleaned).toString();
  const url = `/teacher/report-cards${params ? `?${params}` : ""}`;
  return await fetchWithAuth(url);
};


// ✅ 2. Update comment for a specific report card (by ID)
export const updateReportCardComment = async (reportCardId, comment) => {
  return await fetchWithAuth(`/teacher/report-cards/${reportCardId}`, 'PATCH', {
    comment,
  });
};

export const fetchTeacherClassReportCards = async (term, year) => {
  const url = `/teacher/report-cards/by-class?term=${term}&year=${year}`;
  return await fetchWithAuth(url);
};


export const fetchTeacherReportCardPreviews = async ({ student_id, term, year }) => {
  const params = new URLSearchParams({
    student_id: String(student_id),
    term,
    year: year.toString(),
  });

  return await fetchWithAuth(`/teacher/report-cards/by-class-preview?${params}`);
};



// ✅ FIX: Make sure student_id is a number before putting in the query
export const fetchAdminReportCardPreview = async ({ student_id, term, year }) => {
  const query = new URLSearchParams({
    student_id: Number(student_id),  // <-- this ensures it's an int
    term,
    year,
  }).toString();

  return await fetchWithAuth(`/report-cards/preview?${query}`);
};

// 📚 Admin fetch all class levels (e.g., JSS1, SS2 Art, etc.)
export const fetchAllClassLevels = async () => {
  return await fetchWithAuth(`/admin/classes`);
};

// 👨‍🎓 Admin fetch students by level + department
export const fetchStudentsByLevelAndDept = async (level, department = '') => {
  const query = new URLSearchParams({ level, department }).toString();
  return await fetchWithAuth(`/admin/students?${query}`);
};



export const fetchPersonalizedRecommendations = async () => {
  return await fetchWithAuth('/personalization/recommendations');
};


// ---------- Teacher API routes ----------
export const getTeacherDashboard = async () => {
  return await fetchWithAuth('/teacher/dashboard');
};

export const getTeacherSubjects = async () => {
  return await fetchWithAuth('/teacher/subjects');
};

export const getStudentsInClass = async () => {
  return await fetchWithAuth('/teacher/students');
};

export const getStudentsBySubjects = async () => {
  return await fetchWithAuth('/teacher/students/assigned');
};

export const viewStudentAttendance = async (studentId) => {
  return await fetchWithAuth(`/teacher/attendance/${studentId}`);
};

export const getTeacherProfile = async () => {
  return await fetchWithAuth('/teacher/profile');
};

// ---------- Parent API routes ----------
export const getParentDashboard = async () => {
  return await fetchWithAuth('/parent/dashboard');
};

export const getParentProfile = async () => {
  return await fetchWithAuth('/parent/profile');
};

export const getChildren = async () => {
  return await fetchWithAuth('/parent/children');
};

export const getChildReportCards = async (studentId) => {
  return await fetchWithAuth(`/parent/report-cards/${studentId}`);
};

export const getChildAttendance = async (studentId) => {
  return await fetchWithAuth(`/parent/attendance/${studentId}`);
};

export const getStudentAchievements = async () => {
  return await fetchWithAuth(`/achievements`);
};

export const getResourceSubjects = async () => {
  return await fetchWithAuth(`/resources/subjects`);
};


// ✅ Fetch all (or filtered) resources
export const getFilteredResources = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return await fetchWithAuth(`/resources?${params}`);
};

export const getTeacherResources = async () => {
  return await fetchWithAuth('/teacher/resources');
};

export const uploadResource = async (formData) => {
  return await fetchWithAuth('/resources', 'POST', formData);
};


// ✅ Trigger resource file download
export const downloadResource = (id) => {
  window.open(`${BASE_URL}/resources/download/${id}`, "_blank");
};


export const getStudentResources = async () => {
  return await fetchWithAuth('/resources/student');
};






export const getAllClasses = async (role) => {
  const endpoint = role === 'admin' ? '/admin/classes' : '/classes/';
  return await fetchWithAuth(endpoint);
};

export const getAllTeachers = async () => {
  const res = await fetch(`${BASE_URL}/admin/teachers`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return await res.json();
};

export const assignSubjectToTeacher = async (teacherId, subjectId) => {
  const res = await fetch(`${BASE_URL}/admin/assign-subject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId })
  });
  if (!res.ok) throw new Error("Assignment failed");
};

export const fetchAssignedSubjects = async () => {
     return await fetchWithAuth('/teacher/subjects');
};

export const fetchTeachersWithSubjects = async () => {
  const res = await fetch(`${BASE_URL}/admin/teachers-with-subjects`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch teachers with subjects");
  }
  return await res.json();
};

// Fetch subjects assigned to a specific teacher for a given class and level
export const fetchTeacherSubjects = async (studentClass, level, teacherId) => {
  const params = new URLSearchParams({ studentClass, level, teacherId }).toString();
  const res = await fetchWithAuth(`/subjects/teacher?${params}`);
  if (!res.ok) throw new Error("Failed to load teacher subjects");
  return res.json();
};

// Fetch classes assigned to the teacher
export const getTeacherClasses = async () => {
  return await fetchWithAuth('/classes/');
};

// New safe version
export const fetchTopicsStrict = async (level, subjectName) => {
  if (!level || !subjectName) throw new Error("Level and subject are required");
  const normalizedLevel = level.trim().toLowerCase();
  const encodedSubject = encodeURIComponent(subjectName.trim());

  return await fetchWithAuth(`/subjects/${normalizedLevel}/${encodedSubject}/topics`);
};

export const fetchTeacherTopicsForSubject = async (subjectName, level) => {
  const encodedSubject = encodeURIComponent(subjectName.trim());
  const normalizedLevel = level.trim().toLowerCase();

  return await fetchWithAuth(`/teacher/subjects/${encodedSubject}/${normalizedLevel}/topics`);
};


export const fetchTeacherTopics = async () => {
  return await fetchWithAuth('/teacher/topics');
};





export const regenerateQuestions = async (topicId, qtype) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/topics/${topicId}/generate-questions?qtype=${qtype}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to regenerate ${qtype} questions`);
  }

  return await res.json();
};

// ➕ Assign class to teacher
export const assignClassToTeacher = async (teacherId, level, department) => {
  return await fetchWithAuth('/teacher/assign-class', 'POST', {
    teacher_id: teacherId,
    level,
    department,
  });
};

export const fetchTeachers = async () => {
  return await fetchWithAuth('/teacher/all');
};

export const fetchAssignedClasses = async () => {
  return await fetchWithAuth('/teacher/assigned-classes');
};

export const fetchStudentsInMyClass = async () => {
  return await fetchWithAuth('/teacher/students/my-class');
};

export const fetchAttendanceSummaryByDate = async (date) => {
  return await fetchWithAuth(`/teacher/summary-by-date/${date}`);
};

export const fetchAttendanceSummaryByClass = async (level) => {
  return await fetchWithAuth(`/attendance/summary/class/${level}`);
};

// ✅ For total class summary (teacher view)
export const fetchTeacherAttendanceSummary = async () => {
  return fetchWithAuth("/teacher/attendance/summary");
};

export const fetchStudentAttendanceSummary = async (studentId) => {
  return fetchWithAuth(`/attendance/summary/student/${studentId}`);
};


// ✅ For total class summary (admin view)
export const fetchTotalAttendanceSummary = async () => {
  return fetchWithAuth("/attendance/summary/total");
};

export const getAttendanceByDateRecords = async (date) => {
  return fetchWithAuth(`/attendance/by-date?date=${date}`);
};






// ---------- Attendance ----------

export const getAllStudents = async () => {
  return await fetchWithAuth('/students/');
};

// ✅ Admin: mark attendance for a single student
export const markSingleAttendance = async (record) => {
  return await fetchWithAuth('/attendance/mark', 'POST', record);
};

// ✅ Admin: bulk attendance
export const submitAttendance = async (attendanceRecords) => {
  return await fetchWithAuth('/attendance/bulk', 'POST', attendanceRecords);
};

// ✅ Teacher: bulk attendance (restricted to their class)
export const submitTeacherAttendance = async (attendanceRecords) => {
  return await fetchWithAuth('/attendance/mark-teacher', 'POST', attendanceRecords);
};

// ✅ Admin: get attendance for a specific date
export const getAttendanceByDate = async (date) => {
  return await fetchWithAuth(`/attendance/date/${date}`);
};

// ✅ Admin: get all attendance (optionally filtered by date via query param)
export const fetchAllAttendance = async (date = null) => {
  let url = '/attendance';
  if (date) {
    url += `?date_filter=${date}`;
  }
  return await fetchWithAuth(url);
};

// ✅ Admin: get full attendance (ordered by class and date)
export const getFullAttendance = async () => {
  return await fetchWithAuth('/attendance/all');
};

// ✅ Student: get own attendance history
export const getMyAttendance = async () => {
  return await fetchWithAuth('/attendance/me');
};

// (Redundant with fetchAllAttendance, but you may still keep if needed)
export const getAllAttendance = async () => {
  return await fetchWithAuth('/attendance/');
};

export const fetchAttendanceSummary = async () => {
  return await fetchWithAuth('/attendance/summary');
};

// Fetch all attendance records (for modal/history)
export const fetchStudentAttendance = async (studentId) => {
  return await fetchWithAuth(`/attendance/student/${studentId}`);
};



// Submit attendance (teacher)
export const markAttendance = async (records, date) => {
  return await fetchWithAuth('/attendance/mark-teacher', 'POST', {
    records,
    date_override: date,
  });
};




// USERS
export const fetchAllUsers = async () => {
  return await fetchWithAuth('/users');
};

export const fetchAllReportCards = async () => {
  return await fetchWithAuth('/report-cards');
};

export const fetchUniqueReportCardStudentsCount = async () => {
  return await fetchWithAuth('/report-cards/unique-students/count');
};

// ATTENDANCE
export const fetchTotalAttendanceDays = async () => {
  return await fetchWithAuth('/attendance/total-days');
};


export const fetchTestQuestions = async ({ subject, level, test_type }) => {
  const queryParams = new URLSearchParams({ subject, level, test_type });

  // ✅ No need to prefix with BASE_URL — fetchWithAuth already handles it
  return await fetchWithAuth(`/tests/test-questions/?${queryParams.toString()}`);
};




// -------- TEACHER-SIDE --------

/// POST /assignments
export const createAssignment = async (data) => {
  return await fetchWithAuth('/assignments', 'POST', data);
};

// GET /assignments/teacher/my
export const fetchTeacherAssignments = async () => {
  return await fetchWithAuth('/assignments/teacher/my');
};

// PUT /assignments/:id
export const updateAssignment = async (assignmentId, data) => {
  return await fetchWithAuth(`/assignments/${assignmentId}`, 'PUT', data);
};

// DELETE /assignments/:id
export const deleteAssignment = async (assignmentId) => {
  return await fetchWithAuth(`/assignments/${assignmentId}`, 'DELETE');
};

// GET /teacher/subjects-by-level?level={level}
export const getTeacherSubjectsByLevel = async (level) => {
  return await fetchWithAuth(`/teacher/subjects-by-level?level=${level}`);
};

export async function fetchTeacherAssignmentSubmissions() {
  return fetchWithAuth('/teacher/assignments/submissions');
}



// -------- STUDENT-SIDE --------

// GET /assignments/my
export const fetchMyAssignments = async () => {
  return await fetchWithAuth('/assignments/my');
};

export const submitAssignment = async (data) => {
  return await fetchWithAuth('/assignments/submit', 'POST', data);
};


// GET /assignments/my-submissions
export const fetchMySubmissions = async () => {
  return await fetchWithAuth('/assignments/student/my-submissions');
};


export const fetchAssignmentSubmissions = async (assignmentId) => {
  return await fetchWithAuth(`/assignments/${assignmentId}/submissions`);
};


export const fetchAdminAssignments = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await fetchWithAuth(`/assignments/admin/overview?${params.toString()}`);
  return response;
};


export const fetchAdminAssignmentSubmissions = async (assignmentId) => {
  return await fetchWithAuth(`/assignments/admin/assignments/${assignmentId}/submissions`);
};

export const autoGradeLateAssignments = async () => {
  return await fetchWithAuth('/assignments/auto-grade-late', 'POST');
};




export const adminFetchStudentDashboard = (studentId) => 
  fetchWithAuth(`/admin/student-dashboard/${studentId}`);

export const adminFetchStudentSubjects = (level, department) => 
  fetchWithAuth(`/admin/student-subjects?level=${level}&department=${department}`);

export const adminFetchStudentAssignments = (studentId) => 
  fetchWithAuth(`/admin/student-assignments/${studentId}`);

export const adminFetchStudentSubmissions = (studentId) => 
  fetchWithAuth(`/admin/student-submissions/${studentId}`);

export const adminFetchStudentProgress = (studentId) => 
  fetchWithAuth(`/admin/student-progress/${studentId}`);

export const adminFetchStudentDailyProgress = async (studentId) =>
  fetchWithAuth(`/admin/student-daily-progress/${studentId}`);

export const adminFetchStudentSummary = async (studentId) =>
  fetchWithAuth(`/admin/student-summary/${studentId}`);

export const adminFetchStudentSubjectSummary = async (studentId) =>
  fetchWithAuth(`/admin/student-subject-summary/${studentId}`);


export const fetchStudentProgress = async () =>
  fetchWithAuth('/progress/my-progress');


export const askAnything = async (subject, question) => {
  return await fetchWithAuth('/ask/', 'POST', { subject, question });
};



export const linkChildToParent = async (childId) => {
    return await fetchWithAuth('/parents/link-child', 'POST', { child_id: childId });
};

export const fetchMyChildren = async () => {
    return await fetchWithAuth('/parents/my-children');
};

export const searchStudents = async (query = '', studentClass = '') => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (studentClass) params.append('student_class', studentClass);
    return await fetchWithAuth(`/parents/search-students?${params.toString()}`);
};

export const fetchChildPerformance = async (childId) => {
    return await fetchWithAuth(`/parents/child-performance/${childId}`);
};

// Admin specific calls (if needed in admin dashboard for approvals)
export const fetchPendingParentApprovals = async () => {
    return await fetchWithAuth('/parents/admin/pending-approvals');
};

export const approveChildAssociation = async (associationId, approvedStatus) => {
    return await fetchWithAuth(`/parents/admin/approve-child/${associationId}`, 'PUT', { approved: approvedStatus });
};

export const fetchParentWithChildren = async () => {
    return await fetchWithAuth('/admin/parent-children');
};

// ✅ Fetch a child's attendance history
export const fetchChildAttendance = async (childId) => {
  try {
    const data = await fetchWithAuth(`/parents/child-attendance/${childId}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching attendance for child ${childId}:`, error.message || error);
    throw error;
  }
};


export const fetchChildReportCard = async (childId, term, year) => {
    try {
        const params = new URLSearchParams();
        params.append('term', term);
        params.append('year', year);
        // Removed .data here as fetchWithAuth already returns the parsed JSON
        const response = await fetchWithAuth(`/parents/child-report-card/${childId}?${params.toString()}`);
        return response; // Corrected line
    } catch (error) {
        console.error(`Error fetching report card for child ${childId}, term ${term}, year ${year}:`, error);
        throw error;
    }
};