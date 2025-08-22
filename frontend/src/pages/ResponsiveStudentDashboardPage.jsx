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
    fetchMyAssignments, fetchMySubmissions,
    submitAssignment, getTodayTimetable
} from '../services/api';
import { testBackendConnection } from '../utils/networkUtils';
import { useToast } from '@/hooks/use-toast';
import QuickActionCard from '../components/QuickActionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import ProgressPanel from '@/components/ProgressPanel';
import TodayTimetableCard from '../components/TodayTimetableCard';
import PersonalizationCard from '../components/PersonalizationCard';
import { Skeleton } from "@/components/ui/skeleton";
import StudentTopicsView from '../components/StudentTopicsView';

// Helper function to get current week number
const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / (1000 * 60 * 60 * 24 * 7)));
};

// Empty state component
const EmptyState = ({ icon: Icon, title, subtitle, emoji }) => (
    <Card className="border-0 shadow-lg bg-card-elegant">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            {emoji && <div className="text-6xl mb-4 opacity-80">{emoji}</div>}
            <div className="p-4 rounded-xl bg-muted/30 mb-4">
                <Icon className="h-16 w-16 mx-auto text-muted-foreground opacity-60" />
            </div>
            <p className="text-foreground text-xl font-semibold mb-2">{title}</p>
            <p className="text-muted-foreground text-md max-w-sm">{subtitle}</p>
        </CardContent>
    </Card>
);

const ResponsiveStudentDashboardPage = () => {
    const { auth } = useAuth();
    const { toast } = useToast();
    const [dashboardData, setDashboardData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    // Assignment-related states
    const [assignments, setAssignments] = useState([]);
    const [submittedAssignments, setSubmittedAssignments] = useState([]);
    const [overdueAssignments, setOverdueAssignments] = useState([]);
    const [submittingId, setSubmittingId] = useState(null);

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
                const results = await Promise.allSettled([
                    fetchStudentDashboard(),
                    fetchStudentSubjects ? fetchStudentSubjects(level, department) : Promise.resolve([]),
                    fetchStudentProgress ? fetchStudentProgress() : Promise.resolve([]),
                    fetchMyAssignments ? fetchMyAssignments() : Promise.resolve([]),
                    fetchMySubmissions ? fetchMySubmissions() : Promise.resolve([]),
                    getTodayTimetable()
                ]);

                // Log results of each request
                const labels = ["dashboard", "subjects", "progress", "assignments", "submissions", "timetable"];
                results.forEach((r, i) => {
                    if (r.status === "fulfilled") {
                        console.log(`✅ ${labels[i]} loaded:`, r.value);
                    } else {
                        console.error(`❌ ${labels[i]} failed:`, r.reason);
                    }
                });

                // Extract fulfilled values safely
                const [dashboardRes, subjectsRes, progressRes, assignmentsRes, submissionsRes, timetableRes] =
                    results.map(r => (r.status === "fulfilled" ? r.value : null));

                if (!dashboardRes) {
                    throw new Error("Dashboard API failed — cannot render student dashboard.");
                }

                // Continue with only successful data
                dashboardRes.today_schedule = timetableRes || [];
                setDashboardData(dashboardRes);
                setSubjects(subjectsRes || []);
                setProgressData(progressRes || []);

                const now = new Date();
                const pending = [];
                const overdue = [];
                const submittedAssignmentIds = new Set((submissionsRes || []).map((s) => s.assignment_id));

                (assignmentsRes || []).forEach((a) => {
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
                setSubmittedAssignments(submissionsRes || []);

                console.log('Dashboard loaded successfully for:', auth.level, auth.department || 'no department');
            } catch (err) {
                console.error("❌ Failed to load dashboard data:", err);
                setConnectionError(err.message);

                if (testBackendConnection) {
                    const hostname = window.location.hostname;
                    const fallbackURL = hostname === 'localhost' ? 'http://127.0.0.1:8000' : `http://${hostname}:8000`;
                    const result = await testBackendConnection(fallbackURL);
                    if (!result.success) {
                        setConnectionError('Backend server is unreachable or there is a CORS issue. Please check the server status.');
                        toast({
                            title: "Network Error",
                            description: "Could not connect to the backend server.",
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error",
                            description: `Failed to load dashboard: ${err.message || 'Unknown error'}`,
                            variant: "destructive"
                        });
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [auth?.level, auth?.department, toast]);


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
            toast({
                title: "Warning",
                description: "Submission cannot be empty.",
                variant: "destructive"
            });
            return;
        }
        setSubmittingId(assignmentId);
        try {
            await submitAssignment(assignmentId, submissionContent);
            toast({
                title: "Success",
                description: "Assignment submitted successfully!"
            });

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
            toast({
                title: "Error",
                description: `Failed to submit assignment: ${error.message || 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setSubmittingId(null);
        }
    }, [toast]);

    const handleQuickAction = (action) => {
        toast({
            title: "Quick Action",
            description: `Executing: ${action}`
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="animate-pulse space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1,2,3,4].map(i => (
                                <Skeleton key={i} className="h-32 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const todayTopics = dashboardData?.today_topics || [];
    const progress = dashboardData?.progress || { total_topics_assigned: 0, topics_completed: 0, topics_remaining: 0 };
    const todayDate = dashboardData?.date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const stats = getProgressStats();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl space-y-8">

                {/* Welcome Header */}
                <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground">
                    <CardContent className="p-8 sm:p-12 text-center relative overflow-hidden rounded-xl">
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-2 mb-4 sm:flex-row sm:gap-4">
                                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                                    <User className="h-10 w-10 text-primary-foreground" />
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-foreground text-center sm:text-left">
                                    Welcome, {auth?.fullName || auth?.username}!
                                </h1>
                            </div>
                            <p className="text-primary-foreground/90 text-lg sm:text-xl font-medium mb-2">
                                {todayDate}
                            </p>
                            <p className="text-primary-foreground/80 text-md">
                                Week: {dashboardData?.current_week || getCurrentWeekNumber()}
                            </p>
                            <Badge className="mt-4 text-sm px-4 py-2 bg-white/20 text-primary-foreground backdrop-blur-sm border-white/30">
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
                    <Card className="border-0 shadow-lg bg-destructive/10">
                        <CardContent className="p-6 text-center text-destructive-foreground flex items-center justify-center gap-3">
                            <AlertCircle className="h-6 w-6" />
                            <div>
                                <p className="font-semibold text-lg">System Alert: Connection Issue</p>
                                <p className="text-sm">{connectionError}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Academic Snapshot Header */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted shadow-lg">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <GraduationCap className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Your Academic Snapshot
                        </h2>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Pending Assignments */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-secondary/20">
                                <GraduationCap className="h-6 w-6 text-secondary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Pending Assignments</h2>
                            <Badge className="px-3 py-1 text-sm bg-secondary/20 text-secondary border-secondary/30">
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
                                    <Card key={assignment.id} className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-lg truncate text-foreground">{assignment.title}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{assignment.subject?.name || "General"}</p>
                                                </div>
                                                <Badge className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 border-yellow-300">
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
                                                className="w-full mt-2"
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

                {/* Assignment Statistics Overview */}
                {stats.total > 0 && (
                    <section className="mb-8">
                        <div className="text-center space-y-4 mb-8">
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Track your academic progress with a comprehensive overview of your assignment performance
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Assignments */}
                            <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Total Assignments</p>
                                            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Learning activities</p>
                                        </div>
                                        <div className="p-3 bg-secondary/20 rounded-xl">
                                            <FileText className="w-6 h-6 text-secondary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Completed Assignments */}
                            <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Completed</p>
                                            <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Sparkles className="h-3 w-3 text-accent" />
                                                <p className="text-muted-foreground text-xs">Excellent work!</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-green-100 rounded-xl">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pending Assignments */}
                            <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Pending</p>
                                            <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Ready to tackle</p>
                                        </div>
                                        <div className="p-3 bg-yellow-100 rounded-xl">
                                            <Clock className="w-6 h-6 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Overdue Assignments */}
                            <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                                            <p className="text-3xl font-bold text-foreground">{stats.overdue}</p>
                                            <p className="text-muted-foreground text-xs mt-1">Needs attention</p>
                                        </div>
                                        <div className="p-3 bg-red-100 rounded-xl">
                                            <XCircle className="w-6 h-6 text-red-600" />
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
                        <Card className="border-0 shadow-lg bg-card">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-foreground">
                                            Assignment Progress Overview
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">Your completion journey</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border bg-background">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-semibold text-foreground">Overall Completion Rate</span>
                                        <span className="text-sm text-muted-foreground">
                                            {stats.completed} of {stats.total} completed
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <Progress
                                            value={stats.completionRate}
                                            className="h-3"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">0%</span>
                                            <Badge className="text-xs px-2 py-1">
                                                {stats.completionRate.toFixed(1)}% Complete
                                            </Badge>
                                            <span className="text-muted-foreground">100%</span>
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
                            <div className="p-2 rounded-lg bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Overdue Assignments</h2>
                            <Badge variant="destructive" className="px-3 py-1 text-sm">
                                {overdueAssignments.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {overdueAssignments.map((assignment) => (
                                <Card key={assignment.id} className="border-0 shadow-lg bg-red-50 border-l-4 border-red-500 hover:shadow-xl transition-all duration-200">
                                    <CardContent className="p-5 space-y-3 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="w-full">
                                                <p className="font-semibold text-lg break-words text-foreground">{assignment.title}</p>
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

                                        <div className="text-sm text-red-600 font-bold flex items-center gap-1 break-words">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> Score: 0 (Auto-graded)
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2 border-red-400 text-red-600 hover:bg-red-100"
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
                            <div className="p-2 rounded-lg bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Submitted Assignments</h2>
                            <Badge className="px-3 py-1 text-sm bg-green-100 text-green-600 border-green-300">
                                {submittedAssignments.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {submittedAssignments.map((submission) => (
                                <Card
                                    key={submission.id}
                                    className="border-0 shadow-lg bg-green-50 border-l-4 border-green-500 hover:shadow-xl transition-all duration-200"
                                >
                                    <CardContent className="p-5 space-y-3 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="w-full">
                                                <p className="font-semibold text-lg break-words text-foreground">
                                                    {submission.assignment?.title || "Untitled Assignment"}
                                                </p>
                                                <p className="text-sm text-muted-foreground break-words">
                                                    {submission.assignment?.subject?.name || "General"}
                                                </p>
                                            </div>
                                            <Badge
                                                className={`text-xs px-2 py-1 whitespace-nowrap ${
                                                    submission.score !== null
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-700"
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
                                            className="w-full mt-2 border-green-400 text-green-600 hover:bg-green-100"
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
                    <section className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-accent/20">
                                <Brain className="h-6 w-6 text-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Personalized Learning</h2>
                        </div>
                        <PersonalizationCard />
                        
                        {/* Quick Actions */}
                        <QuickActionCard onAction={handleQuickAction} />
                    </section>
                </div>

                {/* Detailed Analytics */}
                {progressData.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-accent/20">
                                <BarChart3 className="h-6 w-6 text-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Detailed Analytics</h2>
                        </div>
                        <ProgressPanel progress={progressData} />
                    </section>
                )}

            </div>
        </div>
    );
};

export default ResponsiveStudentDashboardPage;