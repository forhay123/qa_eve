import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Toaster as ToastifyToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Route Guards
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import RequireAdmin from './components/RequireAdmin';
import RequireTeacher from './components/RequireTeacher';
import RequireParent from './components/RequireParent';

// Public Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import SubmitQuiz from './components/SubmitQuiz';

// Responsive Layout & Pages
import ResponsiveLayout from './layouts/ResponsiveLayout';
import ResponsiveDashboardPage from './pages/ResponsiveDashboardPage';
import ResponsiveStudentDashboardPage from './pages/ResponsiveStudentDashboardPage';
import { ClassChatPage } from './pages/ClassChatPage';
import AdminStudentDashboardPageWrapper from "./pages/AdminStudentDashboardPageWrapper";

// Student Pages
import UploadPage from './pages/UploadPage';
import QuestionsPage from './pages/QuestionsPage';
import AnswerPage from './pages/AnswerPage';
import SubjectPage from './pages/SubjectPage';
import LessonDetail from './pages/LessonDetail';
import StudentProgressPage from './pages/StudentProgressPage';
import ResultsPage from './pages/ResultsPage';
import LessonPlanPage from './pages/LessonPlanPage';
import StudentTimetablePage from './pages/StudentTimetablePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentReportCardPage from './pages/StudentReportCardPage';
import QuizzesPage from './pages/QuizzesPage';
import AchievementsPage from './pages/AchievementsPage';
import ResourcesListPage from './pages/ResourcesListPage';
import ChatbotPage from './pages/ChatbotPage';
import StudentSubmissionPage from './pages/StudentSubmissionPage';
import AskMeAnythingPage from './pages/AskMeAnythingPage'; // ✅ New Page

// Admin Pages
import ResponsiveAdminDashboard from './pages/ResponsiveAdminDashboard';
import StudentListPage from './pages/StudentListPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminGenerateReportCards from './pages/AdminGenerateReportCards';
import AdminSubjectsPage from './pages/AdminSubjectsPage';
import AdminTimetablePage from './pages/AdminTimetablePage';
import AdminDashboardLayout from './pages/AdminDashboard/AdminDashboardLayout';
import AdminTopicsPage from './pages/AdminTopicsPage';
import AdminTopicManager from './pages/AdminTopicManager';
import EditTopicPage from './pages/EditTopicPage';
import AdminStudentProfiles from './pages/AdminDashboard/AdminStudentProfiles';
import StudentsList from './pages/AdminDashboard/StudentsList';
import StudentProgress from './pages/AdminDashboard/StudentProgress';
import ProgressSummary from './pages/AdminDashboard/ProgressSummary';
import ExportReports from './pages/AdminDashboard/ExportReports';
import ViewAttendanceByClass from './pages/ViewAttendanceByClass';
import ReportCardPreview from './pages/ReportCardPreview';
import AdminUploadPage from './pages/AdminDashboard/AdminUploadPage';
import AssignSubjectPage from './pages/AdminDashboard/AssignSubjectPage';
import AdminTeachersWithSubjects from './pages/AdminDashboard/AdminTeachersWithSubjects';
import AdminViewResourcesPage from './pages/AdminDashboard/AdminViewResourcesPage';
import AssignClassPage from './pages/AdminDashboard/AssignClassPage';
import AdminCreateGroupPage from './pages/AdminDashboard/AdminCreateGroupPage';
import AdminMonitorChatPage from "./pages/AdminDashboard/AdminMonitorChatPage";
import ParentApprovalManagement from "./pages/AdminDashboard/ParentApprovalManagement";
import AdminActivityDashboard from './pages/AdminDashboard/AdminActivityDashboard';

// Teacher Pages
import ResponsiveTeacherDashboard from './pages/TeacherDashboard/ResponsiveTeacherDashboard';
import MarkAttendancePage from './pages/TeacherDashboard/MarkAttendancePage';
import TeacherLessonPlanPage from './pages/TeacherDashboard/LessonPlanPage';
import ViewPerformancePage from './pages/TeacherDashboard/ViewPerformancePage';
import TeacherUploadPage from './pages/TeacherDashboard/TeacherUploadPage';
import TeacherViewResourcesPage from './pages/TeacherDashboard/TeacherViewResourcesPage';
import TeacherTimetablePage from './pages/TeacherDashboard/TeacherTimetablePage';
import TeacherStudentsPage from './pages/TeacherDashboard/TeacherStudentsPage';
import TeacherSubjectsPage from './pages/TeacherDashboard/TeacherSubjectsPage';
import TeacherReportComments from './pages/TeacherDashboard/TeacherReportComments';
import TeacherReportPreviewPage from './pages/TeacherDashboard/TeacherReportPreviewPage';
import TeacherAssignmentPage from './pages/TeacherDashboard/TeacherAssignmentPage';
import TeacherAssignmentWithSubmissions from "./pages/TeacherDashboard/TeacherAssignmentWithSubmissions";

// Parent Page
import ResponsiveParentDashboard from './pages/ParentDashboard/ResponsiveParentDashboard';

// Test/Exam Pages
import TestQuizPage from './pages/TestQuizPage';
import ExamPage from './pages/ExamPage';

const queryClient = new QueryClient();

const LogoutPage = () => {
  const { setAuth } = useAuth();
  useEffect(() => {
    localStorage.clear();
    setAuth({
      token: null,
      username: null,
      role: null,
      fullName: null,
      level: null,
      department: null,
      isAdmin: false,
    });
    window.location.href = '/';
  }, [setAuth]);
  return <p className="p-6 text-foreground bg-background">Logging out...</p>;
};

const App = () => {
  const { loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDarkMode = darkModeMediaQuery.matches;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 👇 Add install prompt logic
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      console.log('User accepted install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (loading) return <div className="p-6 bg-background text-foreground">Loading...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <ToastifyToaster />
          <SonnerToaster />
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RequireAdmin><RegisterPage /></RequireAdmin>} />
              <Route path="/logout" element={<LogoutPage />} />

              {/* Main Layout */}
              <Route element={<ResponsiveLayout />}>
                <Route path="/" element={<ResponsiveDashboardPage />} />

                {/* Student */}
                <Route path="/student-dashboard" element={<PrivateRoute><ResponsiveStudentDashboardPage /></PrivateRoute>} />
                <Route path="/class-chat" element={<PrivateRoute><ClassChatPage /></PrivateRoute>} />
                <Route path="/student/progress" element={<PrivateRoute><StudentProgressPage /></PrivateRoute>} />
                <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
                <Route path="/questions/:pdfId" element={<PrivateRoute><QuestionsPage /></PrivateRoute>} />
                <Route path="/answer/:pdfId" element={<PrivateRoute><AnswerPage /></PrivateRoute>} />
                <Route path="/subjects/:level/:subject" element={<PrivateRoute><SubjectPage /></PrivateRoute>} />
                <Route path="/lesson/:topicId" element={<PrivateRoute><LessonDetail /></PrivateRoute>} />
                <Route path="/lesson-plan/:level/:subject" element={<PrivateRoute><LessonPlanPage /></PrivateRoute>} />
                <Route path="/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
                <Route path="/timetable" element={<PrivateRoute><StudentTimetablePage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><StudentProfilePage /></PrivateRoute>} />
                <Route path="/topics/:topicId/quiz" element={<PrivateRoute><SubmitQuiz /></PrivateRoute>} />
                <Route path="/attendance/me" element={<PrivateRoute><StudentAttendancePage /></PrivateRoute>} />
                <Route path="/report-cards" element={<PrivateRoute><StudentReportCardPage /></PrivateRoute>} />
                <Route path="/quizzes" element={<PrivateRoute><QuizzesPage /></PrivateRoute>} />
                <Route path="/achievements" element={<PrivateRoute><AchievementsPage /></PrivateRoute>} />
                <Route path="/resources/student" element={<PrivateRoute><ResourcesListPage /></PrivateRoute>} />
                <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
                <Route path="/ask-anything" element={<PrivateRoute><AskMeAnythingPage /></PrivateRoute>} /> {/* ✅ Added */}
                <Route path="/tests/:subject/:testType" element={<PrivateRoute><TestQuizPage /></PrivateRoute>} />
                <Route path="/exams/:level/:subject" element={<PrivateRoute><ExamPage /></PrivateRoute>} />
                <Route path="/assignments" element={<PrivateRoute><StudentSubmissionPage /></PrivateRoute>} />

                {/* Admin */}
                <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboardLayout /></AdminRoute>}>
                  <Route index element={<ResponsiveAdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="students" element={<StudentsList />} />
                  <Route path="students/:id" element={<StudentProgress />} />
                  <Route path="summary" element={<ProgressSummary />} />
                  <Route path="export" element={<ExportReports />} />
                  <Route path="attendance" element={<ViewAttendanceByClass />} />
                  <Route path="assign-subjects" element={<AssignSubjectPage />} />
                  <Route path="assign-class" element={<AssignClassPage />} />
                  <Route path="teachers-with-subjects" element={<RequireAdmin><AdminTeachersWithSubjects /></RequireAdmin>} />
                  <Route path="view-resources" element={<RequireAdmin><AdminViewResourcesPage /></RequireAdmin>} />
                  <Route path="upload-resource" element={<RequireAdmin><AdminUploadPage /></RequireAdmin>} />
                  <Route path="create-chat-group" element={<RequireAdmin><AdminCreateGroupPage /></RequireAdmin>} />
                  <Route path="monitor-chat" element={<RequireAdmin><AdminMonitorChatPage /></RequireAdmin>} />
                  <Route path="parent-approval" element={<RequireAdmin><ParentApprovalManagement /></RequireAdmin>} />
                </Route>
                <Route path="/students" element={<RequireAdmin><StudentListPage /></RequireAdmin>} />
                <Route path="/admin-timetable" element={<RequireAdmin><AdminTimetablePage /></RequireAdmin>} />
                <Route path="/admin/attendance" element={<RequireAdmin><AdminAttendancePage /></RequireAdmin>} />
                <Route path="/admin/report-cards" element={<RequireAdmin><AdminGenerateReportCards /></RequireAdmin>} />
                <Route path="/admin-subjects" element={<RequireAdmin><AdminSubjectsPage /></RequireAdmin>} />
                <Route path="/admin-topics" element={<RequireAdmin><AdminTopicsPage /></RequireAdmin>} />
                <Route path="/admin/topics" element={<RequireAdmin><AdminTopicManager /></RequireAdmin>} />
                <Route path="/admin/topics/:topicId/edit" element={<RequireAdmin><EditTopicPage /></RequireAdmin>} />
                <Route path="/admin/student-profiles" element={<RequireAdmin><AdminStudentProfiles /></RequireAdmin>} />
                <Route path="/admin/students/:studentId/dashboard" element={<RequireAdmin><AdminStudentDashboardPageWrapper /></RequireAdmin>} />
                <Route path="/admin-activity/dashboard" element={<RequireAdmin><AdminActivityDashboard /></RequireAdmin>} />
                <Route path="/admin/report-preview" element={<RequireAdmin><ReportCardPreview /></RequireAdmin>} />

                {/* Teacher */}
                <Route path="/teacher-dashboard" element={<RequireTeacher><ResponsiveTeacherDashboard /></RequireTeacher>} />
                <Route path="/teacher/attendance" element={<RequireTeacher><MarkAttendancePage /></RequireTeacher>} />
                <Route path="/teacher/lesson-plans" element={<RequireTeacher><TeacherLessonPlanPage /></RequireTeacher>} />
                <Route path="/teacher/performance" element={<RequireTeacher><ViewPerformancePage /></RequireTeacher>} />
                <Route path="/teacher/upload-resource" element={<RequireTeacher><TeacherUploadPage /></RequireTeacher>} />
                <Route path="/teacher/resources" element={<RequireTeacher><TeacherViewResourcesPage /></RequireTeacher>} />
                <Route path="/teacher/timetable" element={<RequireTeacher><TeacherTimetablePage /></RequireTeacher>} />
                <Route path="/teacher/students/assigned" element={<RequireTeacher><TeacherStudentsPage /></RequireTeacher>} />
                <Route path="/teacher/subjects" element={<RequireTeacher><TeacherSubjectsPage /></RequireTeacher>} />
                <Route path="/teacher/report-comments" element={<RequireTeacher><TeacherReportComments /></RequireTeacher>} />
                <Route path="/teacher/report-preview" element={<RequireTeacher><TeacherReportPreviewPage /></RequireTeacher>} />
                <Route path="/teacher/assignments" element={<RequireTeacher><TeacherAssignmentPage /></RequireTeacher>} />
                <Route path="/teacher/assignment-submissions" element={<RequireTeacher><TeacherAssignmentWithSubmissions /></RequireTeacher>} />
                <Route path="/teacher/group-manager" element={<RequireTeacher><TeacherAssignmentPage /></RequireTeacher>} />

                {/* Parent */}
                <Route path="/parent-dashboard" element={<RequireParent><ResponsiveParentDashboard /></RequireParent>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* ✅ Install App Button */}
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                style={{
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2c3e50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  zIndex: 9999,
                }}
              >
                Install App
              </button>
            )}

            <ToastContainer />
          </Router>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;