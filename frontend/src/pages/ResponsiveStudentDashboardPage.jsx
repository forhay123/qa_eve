import React, { useEffect, useState, useCallback } from 'react';
import {
    FileText, Brain, BookOpen, BarChart3, Calendar, User,
    Clock, TrendingUp, Target, Award, XCircle, CheckCircle, AlertCircle,
    Send, Loader2, GraduationCap, ChevronDown, ChevronUp, Zap,
    Wine, Sparkles, Trophy, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchStudentDashboard, fetchStudentSubjects, fetchStudentProgress,
    autoGradeLateAssignments, fetchMyAssignments, fetchMySubmissions,
    submitAssignment, getTodayTimetable, fetchAllTopicsForStudent
} from '../services/api';
import { testBackendConnection } from '../utils/networkUtils';
import { toast } from '../hooks/use-toast';
import QuickActionCard from '../components/QuickActionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import ProgressPanel from '../components/ProgressPanel';
import TodayTimetableCard from '../components/TodayTimetableCard';
import PersonalizationCard from '../components/PersonalizationCard';
import { Skeleton } from "@/components/ui/skeleton";
import { BASE_URL } from '../services/config';
import StudentTopicsView from '../components/StudentTopicsView';

// Helper function to get current week number
const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / (1000 * 60 * 60 * 24 * 7)));
};

// Backend base URL for PDF links
const backendBaseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Helper to get full PDF URL
export const getFullPdfUrl = (pdfUrl) =>
  pdfUrl?.startsWith('http') ? pdfUrl : `${BASE_URL}${pdfUrl}`;

// Empty state component
const EmptyState = ({ icon: Icon, title, subtitle, emoji }) => (
    <Card className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary border-dashed border-2 border-border/50">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            {emoji && <div className="text-6xl mb-4 opacity-80">{emoji}</div>}
            <div className="p-4 rounded-xl bg-academic-secondary/10 dark:bg-academic-secondary/20 mb-4">
                <Icon className="h-16 w-16 mx-auto text-academic-secondary dark:text-academic-accent opacity-60" />
            </div>
            <p className="text-foreground text-xl font-semibold mb-2">{title}</p>
            <p className="text-muted-foreground text-md max-w-sm">{subtitle}</p>
        </CardContent>
    </Card>
);

const ResponsiveStudentDashboardPage = () => {
    const { auth } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    // Individual loading states
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [reportCardLoading, setReportCardLoading] = useState(false);

    // Assignment-related states
    const [assignments, setAssignments] = useState([]);
    const [submittedAssignments, setSubmittedAssignments] = useState([]);
    const [overdueAssignments, setOverdueAssignments] = useState([]);
    const [submittingId, setSubmittingId] = useState(null);

    // New: Topics-related states
    const [userTopics, setUserTopics] = useState([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(true);
    const [topicsError, setTopicsError] = useState(null);

    const level = auth?.level?.trim().toLowerCase() || '';
    const department = auth?.department?.trim() || '';

    // Fetch dashboard + subjects + assignments
    useEffect(() => {
        if (!auth?.level) return;

        const isJuniorStudent = level.startsWith('jss');
        if (!isJuniorStudent && !auth?.department) {
            console.warn("Senior student department is missing. Cannot load full dashboard.");
            setLoading(false);
            return;
        }

        const loadDashboardData = async () => {
            setLoading(true);
            setConnectionError(null);

            try {
                await autoGradeLateAssignments();

                const [data, subjectsData, progress, assignmentsData, submissionsData, todayTimetable] = await Promise.all([
                    fetchStudentDashboard(),
                    fetchStudentSubjects(level, department),
                    fetchStudentProgress(),
                    fetchMyAssignments(),
                    fetchMySubmissions(),
                    getTodayTimetable()
                ]);

                data.today_schedule = todayTimetable;

                setDashboardData(data);
                setSubjects(subjectsData);
                setProgressData(progress);

                const now = new Date();
                const pending = [];
                const overdue = [];
                const submittedAssignmentIds = new Set(submissionsData.map((s) => s.assignment_id));

                assignmentsData.forEach((a) => {
                    const isSubmitted = submittedAssignmentIds.has(a.id);
                    const dueDate = new Date(a.due_date);

                    if (isSubmitted) return;

                    if (dueDate < now) {
                        overdue.push(a);
                    } else {
                        pending.push(a);
                    }
                });

                setAssignments(pending);
                setOverdueAssignments(overdue);
                setSubmittedAssignments(submissionsData);

                console.log('Dashboard loaded successfully for:', auth.level, auth.department || 'no department');
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                setConnectionError(err.message);

                const hostname = window.location.hostname;
                const fallbackURL = hostname === 'localhost' ? 'http://127.0.0.1:8000' : `http://${hostname}:8000`;
                const result = await testBackendConnection(fallbackURL);
                if (!result.success) {
                    setConnectionError('Backend server is unreachable or there is a CORS issue. Please check the server status.');
                    toast.error("Network Error: Could not connect to the backend server.");
                } else {
                    toast.error(`Failed to load dashboard: ${err.message || 'Unknown error'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [auth?.level, auth?.department]);

    // Fetch topics separately
    useEffect(() => {
        const loadUserTopics = async () => {
            setIsLoadingTopics(true);
            setTopicsError(null);
            try {
                console.log('Fetching topics for student...');
                const data = await fetchAllTopicsForStudent();
                console.log('Topics fetched successfully:', data);
                setUserTopics(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching topics:', err);
                setTopicsError("Failed to load topics. Please try again.");
                setUserTopics([]);
            } finally {
                setIsLoadingTopics(false);
            }
        };

        if (auth?.level) {
            loadUserTopics();
        }
    }, [auth?.level, auth?.department]);

    const getProgressStats = useCallback(() => {
        const total = assignments.length + submittedAssignments.length + overdueAssignments.length;
        const completed = submittedAssignments.length;
        const pending = assignments.length;
        const overdue = overdueAssignments.length;

        return {
            total,
            completed,
            pending,
            overdue,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
        };
    }, [assignments, submittedAssignments, overdueAssignments]);

    const handleAssignmentSubmission = useCallback(async (assignmentId, submissionContent) => {
        if (!submissionContent.trim()) {
            toast.warn("Submission cannot be empty.");
            return;
        }
        setSubmittingId(assignmentId);
        try {
            await submitAssignment(assignmentId, submissionContent);
            toast.success("Assignment submitted successfully!");

            const [assignmentsData, submissionsData] = await Promise.all([
                fetchMyAssignments(),
                fetchMySubmissions()
            ]);

            const now = new Date();
            const pending = [];
            const overdue = [];
            const submittedAssignmentIds = new Set(submissionsData.map((s) => s.assignment_id));

            assignmentsData.forEach((a) => {
                const isSubmitted = submittedAssignmentIds.has(a.id);
                const dueDate = new Date(a.due_date);

                if (isSubmitted) return;

                if (dueDate < now) {
                    overdue.push(a);
                } else {
                    pending.push(a);
                }
            });

            setAssignments(pending);
            setOverdueAssignments(overdue);
            setSubmittedAssignments(submissionsData);

        } catch (error) {
            console.error("Error submitting assignment:", error);
            toast.error(`Failed to submit assignment: ${error.message || 'Unknown error'}`);
        } finally {
            setSubmittingId(null);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-gray-900 dark:bg-gradient-to-br dark:from-academic-primary dark:to-academic-secondary/30 dark:text-slate-100 p-8">
                {/* Skeletons */}
            </div>
        );
    }

    const todayTopics = dashboardData?.today_topics || [];
    const progress = dashboardData?.progress || { total_topics_assigned: 0, topics_completed: 0, topics_remaining: 0 };
    const todayDate = dashboardData?.date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const stats = getProgressStats();


    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gradient-to-br dark:from-academic-primary dark:to-academic-secondary/30 dark:text-slate-100">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">

                {/* Welcome Header with Academic Theme */}
                <Card className="border-0 shadow-2xl bg-gradient-to-r from-academic-primary via-academic-secondary to-academic-primary text-academic-primary-foreground transform transition-all duration-300 hover:scale-[1.005] hover:shadow-3xl mb-8">
                <CardContent className="p-8 sm:p-12 text-center relative overflow-hidden rounded-xl">
                    <div className="relative z-10 flex flex-col items-center justify-center">
                    {/* Icon + Name */}
                    <div className="flex flex-col items-center gap-2 mb-4 sm:flex-row sm:gap-4">
                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                        <User className="h-10 w-10 text-academic-primary-foreground" />
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-academic-primary-foreground text-center sm:text-left">
                        Welcome, {auth?.fullName || auth?.username}!
                        </h1>
                    </div>

                    {/* Date */}
                    <p className="text-academic-primary-foreground/90 text-lg sm:text-xl font-medium mb-2">
                        {todayDate}
                    </p>

                    {/* Week Info */}
                    <p className="text-academic-primary-foreground/80 text-md">
                        Week: {dashboardData?.current_week || getCurrentWeekNumber()}
                    </p>

                    {/* Badge */}
                    <Badge className="mt-4 text-sm px-4 py-2 bg-white/20 text-academic-primary-foreground backdrop-blur-sm border-white/30">
                        {auth?.level === "jss1"
                        ? "LOGIC Foundation Class"
                        : auth?.level === "jss2"
                        ? "LOGIC Disciple Class"
                        : auth?.level}{" "}
                        {auth?.department && `(${auth.department})`}
                    </Badge>
                    </div>
                </CardContent>
                </Card>

                {/* Connection Error Display */}
                {connectionError && (
                    <Card className="border-0 shadow-lg bg-destructive/10 dark:bg-destructive/20 mb-8">
                        <CardContent className="p-6 text-center text-destructive-foreground flex items-center justify-center gap-3">
                            <AlertCircle className="h-6 w-6" />
                            <div>
                                <p className="font-semibold text-lg">System Alert: Connection Issue</p>
                                <p className="text-sm">{connectionError}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}


                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/90 dark:bg-red-800/80 shadow-lg">
                        <div className="p-3 rounded-xl bg-red-700/80">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl sm:text-3xl font-bold tracking-tight text-white">
                            Your Academic Snapshot
                        </h2>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Pending Assignments */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-academic-secondary/20">
                                <GraduationCap className="h-6 w-6 text-academic-secondary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Pending Assignments</h2>
                            <Badge className="px-3 py-1 text-sm bg-academic-secondary/20 text-academic-secondary border-academic-secondary/30">
                                {assignments.length}
                            </Badge>
                        </div>

                        {assignments.length === 0 ? (
                            <EmptyState 
                                icon={CheckCircle} 
                                title="All Caught Up!" 
                                subtitle="No pending assignments at the moment. Great job!" 
                                emoji="✅" 
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assignments.map((assignment) => (
                                    <Card key={assignment.id} className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-lg truncate text-gray-900 dark:text-slate-100">{assignment.title}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{assignment.subject?.name || "General"}</p>
                                                </div>
                                                <Badge className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">
                                                    Pending
                                                </Badge>
                                            </div>

                                            {assignment.due_date && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                </p>
                                            )}

                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full mt-2 bg-gradient-to-r from-academic-secondary to-academic-primary hover:from-academic-primary hover:to-academic-secondary text-academic-primary-foreground shadow-md transition-all"
                                                onClick={() => window.location.href = "/assignments"}
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                View & Submit
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Today's Timetable Card */}
                    <section className="lg:col-span-1">
                        <TodayTimetableCard
                            timetableData={Array.isArray(dashboardData?.today_schedule) ? dashboardData.today_schedule : []}
                            loading={loading}
                        />
                    </section>
                </div>

                {/* Assignment Statistics Overview with Enhanced Styling */}
                {stats.total > 0 && (
                    <section className="mb-8">
                        <div className="text-center space-y-4 mb-8">
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Track your academic progress with a comprehensive overview of your assignment performance
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Assignments */}
                            <Card className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Total Assignments</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.total}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Learning activities</p>
                                        </div>
                                        <div className="p-3 bg-academic-secondary/20 rounded-xl">
                                            <FileText className="w-6 h-6 text-academic-secondary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Completed Assignments */}
                            <Card className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Completed</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.completed}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Sparkles className="h-3 w-3 text-academic-accent" />
                                                <p className="text-muted-foreground text-xs">Excellent work!</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-green-100 rounded-xl dark:bg-green-900/50">
                                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pending Assignments */}
                            <Card className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Pending</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.pending}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Ready to tackle</p>
                                        </div>
                                        <div className="p-3 bg-yellow-100 rounded-xl dark:bg-yellow-900/50">
                                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Overdue Assignments */}
                            <Card className="border-0 shadow-lg bg-card-elegant dark:bg-academic-primary hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.overdue}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Needs attention</p>
                                        </div>
                                        <div className="p-3 bg-red-100 rounded-xl dark:bg-red-900/50">
                                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Overall Assignment Progress Bar */}
                {stats.total > 0 && (
                    <section className="mb-8">
                        <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900 transition-all duration-300">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/50">
                                        <Target className="h-5 w-5 text-red-700 dark:text-red-300" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-red-900 dark:text-red-200">
                                            Assignment Progress Overview
                                        </CardTitle>
                                        <p className="text-sm text-gray-500 dark:text-red-300">Your completion journey</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border bg-white dark:bg-red-900/50 border-gray-200 dark:border-red-900">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-semibold text-gray-900 dark:text-red-100">Overall Completion Rate</span>
                                        <span className="text-sm text-gray-500 dark:text-red-300">
                                            {stats.completed} of {stats.total} completed
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <Progress
                                            value={stats.completionRate}
                                            className="h-3 bg-gray-200 dark:bg-red-800"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 dark:text-red-300">0%</span>
                                            <Badge className="bg-red-700 text-white dark:bg-red-800 dark:text-red-100 text-xs px-2 py-1">
                                                {stats.completionRate.toFixed(1)}% Complete
                                            </Badge>
                                            <span className="text-gray-500 dark:text-red-300">100%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}


                {/* Overdue Assignments */}
                {overdueAssignments.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Overdue Assignments</h2>
                            <Badge variant="destructive" className="px-3 py-1 text-sm">
                                {overdueAssignments.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {overdueAssignments.map((assignment) => (
                                <Card key={assignment.id} className="border-0 shadow-lg bg-red-50/50 dark:bg-red-950/20 border-l-4 border-red-500 hover:shadow-xl transition-all duration-200">
                                    <CardContent className="p-5 space-y-3 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="w-full">
                                                <p className="font-semibold text-lg break-words text-gray-900 dark:text-slate-100">{assignment.title}</p>
                                                <p className="text-sm text-muted-foreground break-words">{assignment.subject?.name || "General"}</p>
                                            </div>
                                            <Badge variant="destructive" className="text-xs px-2 py-1 whitespace-nowrap">
                                                Overdue
                                            </Badge>
                                        </div>

                                        {assignment.due_date && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 break-words">
                                                <Clock className="h-3 w-3 shrink-0" /> Was Due: {new Date(assignment.due_date).toLocaleDateString()}
                                            </p>
                                        )}

                                        <div className="text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-1 break-words">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> Score: 0 (Auto-graded)
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2 border-red-400 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-all"
                                            onClick={() => window.location.href = "/assignments"}
                                        >
                                            View Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Submitted Assignments */}
                {submittedAssignments.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Submitted Assignments</h2>
                            <Badge className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                                {submittedAssignments.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {submittedAssignments.map((submission) => (
                                <Card
                                    key={submission.id}
                                    className="border-0 shadow-lg bg-green-50/50 dark:bg-green-950/20 border-l-4 border-green-500 hover:shadow-xl transition-all duration-200"
                                >
                                    <CardContent className="p-5 space-y-3 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="w-full">
                                                <p className="font-semibold text-lg break-words text-gray-900 dark:text-slate-100">
                                                    {submission.assignment?.title || "Untitled Assignment"}
                                                </p>
                                                <p className="text-sm text-muted-foreground break-words">
                                                    {submission.assignment?.subject?.name || "General"}
                                                </p>
                                            </div>
                                            <Badge
                                                className={`text-xs px-2 py-1 whitespace-nowrap ${
                                                    submission.score !== null
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300"
                                                }`}
                                            >
                                                {submission.score !== null ? `Score: ${submission.score}%` : "Pending Review"}
                                            </Badge>
                                        </div>

                                        <p className="text-xs text-muted-foreground flex items-center gap-1 break-words">
                                            <Calendar className="h-3 w-3 shrink-0" /> Submitted:{" "}
                                            {new Date(submission.submitted_at).toLocaleDateString()}
                                        </p>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2 border-green-400 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 transition-all"
                                            onClick={() => window.location.href = "/assignments"}
                                        >
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            View Submission
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
                
                {/* Detailed Analytics & Personalization */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Your Learning Topics */}
                    <section className="lg:col-span-2">
                        <StudentTopicsView userAuth={auth} />
                    </section>

                    {/* Personalized Learning */}
                    <section className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-academic-accent/20">
                                <Brain className="h-6 w-6 text-academic-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Personalized Learning</h2>
                        </div>
                        <PersonalizationCard />
                    </section>
                </div>

                {/* Detailed Analytics */}
                {progressData.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-academic-accent/20">
                                <BarChart3 className="h-6 w-6 text-academic-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Detailed Analytics</h2>
                        </div>
                        <ProgressPanel progress={progressData} />
                    </section>
                )}

            </div>
        </div>
    );
};

export default ResponsiveStudentDashboardPage;