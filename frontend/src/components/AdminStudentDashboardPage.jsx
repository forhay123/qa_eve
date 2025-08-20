import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  GraduationCap,
  Target,
  Award,
  BookOpen,
  BarChart3,
  TrendingUp,
  User,
  Brain,
  Calendar
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import ProgressPanel from "../components/ProgressPanel";
import TodayTimetableCard from "../components/TodayTimetableCard";
import PersonalizationCard from "../components/PersonalizationCard";
import { 
  adminFetchStudentDashboard, 
  fetchStudentProgress,
  adminFetchStudentDailyProgress,
  adminFetchStudentSummary,
  adminFetchStudentSubjectSummary 
} from "../services/api";

// Helper function for current week
const getCurrentWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / (1000 * 60 * 60 * 24 * 7)));
};

const backendBaseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Empty state component for reuse
const EmptyState = ({ icon: Icon, title, subtitle, emoji }) => (
  <Card className="border-dashed">
    <CardContent className="p-12 text-center">
      {emoji && <div className="text-6xl mb-4">{emoji}</div>}
      <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <p className="text-muted-foreground text-lg">{title}</p>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </CardContent>
  </Card>
);

const AdminStudentDashboardPage = ({ studentId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [dailyProgressData, setDailyProgressData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [subjectSummaryData, setSubjectSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all analytics data for the student
        const [
          data, 
          detailedProgress, 
          dailyProgress, 
          summary, 
          subjectSummary
        ] = await Promise.all([
          adminFetchStudentDashboard(studentId),
          fetchStudentProgress().catch(() => []), // Fallback to empty array if fails
          adminFetchStudentDailyProgress(studentId).catch(() => []),
          adminFetchStudentSummary(studentId).catch(() => null),
          adminFetchStudentSubjectSummary(studentId).catch(() => [])
        ]);
        
        console.log("Fetched dashboard data:", data);
        console.log("Fetched detailed progress:", detailedProgress);
        console.log("Fetched daily progress:", dailyProgress);
        console.log("Fetched summary:", summary);
        console.log("Fetched subject summary:", subjectSummary);
        
        setDashboardData(data);
        setProgressData(detailedProgress);
        setDailyProgressData(dailyProgress);
        setSummaryData(summary);
        setSubjectSummaryData(subjectSummary);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const getProgressStats = (pendingAssignments, overdueAssignments, submittedAssignments) => {
    const total = pendingAssignments.length + overdueAssignments.length + submittedAssignments.length;
    const completed = submittedAssignments.length;
    const pending = pendingAssignments.length;
    const overdue = overdueAssignments.length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  };

  const getFullPdfUrl = (pdfUrl) =>
    pdfUrl?.startsWith('http') ? pdfUrl : `${backendBaseURL}${pdfUrl}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <div className="space-y-4 w-full max-w-lg px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <Card className="border-destructive bg-destructive/10 max-w-md">
          <CardContent className="p-6 text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold mb-2">Failed to load student dashboard</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    today_topics = [],
    assignments = [],
    progress = {
      total_topics_assigned: 0,
      topics_completed: 0,
      topics_remaining: 0,
    },
    studentProgressData = [],
    student = {},
    date,
    current_week,
    student_name
  } = dashboardData;

  // Process assignments like ResponsiveStudentDashboardPage
  const now = new Date();
  const pendingAssignments = assignments.filter(a => {
    const dueDate = new Date(a.due_date);
    return a.status === "pending" && dueDate >= now;
  });
  const overdueAssignments = assignments.filter(a => {
    const dueDate = new Date(a.due_date);
    return a.status === "pending" && dueDate < now;
  });
  const submittedAssignments = assignments.filter(a => a.status === "submitted" || a.status === "completed");

  const stats = getProgressStats(pendingAssignments, overdueAssignments, submittedAssignments);

  const todayDate = date || new Date().toLocaleDateString();
  const weekNumber = current_week || getCurrentWeekNumber();

  // Use detailed progress data if available, fallback to studentProgressData
  const displayProgressData = progressData.length > 0 ? progressData : studentProgressData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Welcome & Header */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <User className="h-8 w-8" />
              <h1 className="text-4xl font-bold">
                Student Dashboard - {student_name || student.fullName || 'Student'}
              </h1>
            </div>
            <p className="text-blue-100">{todayDate}</p>
            <p className="text-blue-100">Week {weekNumber}</p>
            <p className="text-blue-100 text-sm">Administrative View</p>
          </CardContent>
        </Card>

        {/* Traditional Progress Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-[1.02] transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Topics Assigned</p>
                    <p className="text-3xl font-bold">{progress.total_topics_assigned}</p>
                  </div>
                  <Target className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:scale-[1.02] transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Topics Completed</p>
                    <p className="text-3xl font-bold">{progress.topics_completed}</p>
                  </div>
                  <Award className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:scale-[1.02] transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Topics Remaining</p>
                    <p className="text-3xl font-bold">{progress.topics_remaining}</p>
                  </div>
                  <Clock className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subject Performance Overview */}
        {subjectSummaryData.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Subject Performance Summary</h2>
              <Badge variant="outline">{subjectSummaryData.length} subjects</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectSummaryData.map((subject, idx) => (
                <Card key={idx} className="hover:scale-[1.02] transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{subject.subject_name}</h3>
                      <Badge 
                        variant={subject.average_score >= 80 ? "default" : subject.average_score >= 60 ? "secondary" : "destructive"}
                      >
                        {subject.average_score.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={subject.average_score} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Performance: {subject.average_score >= 80 ? "Excellent" : subject.average_score >= 60 ? "Good" : "Needs Improvement"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Enhanced Analytics Summary Cards */}
        {summaryData && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Learning Analytics Overview</h2>
              <Badge variant="outline">Analytics Data</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-[1.02] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Questions</p>
                      <p className="text-3xl font-bold">{summaryData.total_questions || 0}</p>
                    </div>
                    <BookOpen className="h-6 w-6 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:scale-[1.02] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Correct Answers</p>
                      <p className="text-3xl font-bold">
                        {summaryData.correct_answers || 
                         (summaryData.total_questions && summaryData.average_score 
                          ? Math.round((summaryData.average_score / 100) * summaryData.total_questions)
                          : 0)}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white hover:scale-[1.02] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rose-100 text-sm">Wrong Answers</p>
                      <p className="text-3xl font-bold">
                        {summaryData.wrong_answers || 
                         (summaryData.total_questions && summaryData.average_score 
                          ? summaryData.total_questions - Math.round((summaryData.average_score / 100) * summaryData.total_questions)
                          : 0)}
                      </p>
                    </div>
                    <XCircle className="h-6 w-6 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-sky-600 text-white hover:scale-[1.02] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Average Score</p>
                      <p className="text-3xl font-bold">{summaryData.average_score || 0}%</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </div>

          </section>
        )}

        {/* Today's Topics */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Today's Learning Topics</h2>
            <Badge variant="outline">{today_topics.length} topics</Badge>
          </div>

          {today_topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {today_topics.map((topic, idx) => (
                <Card key={idx} className="hover:scale-[1.02] transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{topic.subject}</Badge>
                      <span className="text-xs text-muted-foreground">{topic.start_time} - {topic.end_time}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg">{topic.topic_title}</h3>
                    {topic.pdf_url && (
                      <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                        <a href={getFullPdfUrl(topic.pdf_url)} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" /> View Materials
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={BookOpen} 
              title="No topics assigned for today" 
              subtitle="Student has free time or should review past topics" 
              emoji="📖" 
            />
          )}
        </section>

        {/* Assignment Statistics Overview */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Bar */}
        {stats.total > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Assignment Progress</span>
                  <span className="text-muted-foreground">{stats.completed} of {stats.total} completed</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Sections */}
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">No assignments at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Pending Assignments</h2>
                  <Badge variant="secondary">{pendingAssignments.length}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {pendingAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm truncate">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{assignment.subject?.name || "Unknown Subject"}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-2 py-1">
                            Pending
                          </Badge>
                        </div>

                        {assignment.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        )}

                        <div className="text-xs text-orange-600 font-medium">
                          Status: Not Started
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Assignments */}
            {overdueAssignments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h2 className="text-2xl font-semibold">Overdue Assignments</h2>
                  <Badge variant="destructive">{overdueAssignments.length}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {overdueAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm truncate">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{assignment.subject?.name || "Unknown Subject"}</p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] px-2 py-1">
                            Overdue
                          </Badge>
                        </div>

                        {assignment.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        )}

                        <div className="text-xs text-red-600 font-bold">
                          Score: 0 (Auto-graded)
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Assignments */}
            {submittedAssignments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h2 className="text-2xl font-semibold">Submitted Assignments</h2>
                  <Badge variant="secondary">{submittedAssignments.length}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {submittedAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm truncate">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{assignment.subject?.name || "Unknown Subject"}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-2 py-1">
                            Submitted
                          </Badge>
                        </div>

                        {assignment.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        )}

                        {assignment.submitted_at && (
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                          </p>
                        )}

                        <div className="text-xs text-green-600 font-medium">
                          {assignment.score !== null ? `Score: ${assignment.score}` : "Pending Review"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Detailed Analytics & Topic Mastery Progress */}
        {displayProgressData.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Detailed Analytics & Topic Mastery Progress</h2>
              <Badge variant="outline">{displayProgressData.length} records</Badge>
            </div>
            <ProgressPanel progress={displayProgressData} />
          </section>
        )}

        {/* Daily Progress Chart */}
        {dailyProgressData.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Daily Progress (Past Week)</h2>
              <Badge variant="outline">{dailyProgressData.length} days</Badge>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {dailyProgressData.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.total_score}/{day.total_questions} questions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {day.total_questions > 0 ? Math.round((day.total_score / day.total_questions) * 100) : 0}%
                        </p>
                        <Progress 
                          value={day.total_questions > 0 ? (day.total_score / day.total_questions) * 100 : 0} 
                          className="h-2 w-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Additional Analytics Cards */}
        {progress.total_topics_assigned > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Learning Progress Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {progress.total_topics_assigned > 0 
                          ? Math.round((progress.topics_completed / progress.total_topics_assigned) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Study Streak</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {dashboardData.study_streak || 0} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/50 border-cyan-200 dark:border-cyan-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Topics Today</p>
                      <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{today_topics.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 border-rose-200 dark:border-rose-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weekly Goal</p>
                      <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                        {dashboardData.weekly_goal_progress || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Progress Chart Overview */}
        {progress.total_topics_assigned > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Overall Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Topics Completed</span>
                  <span className="text-muted-foreground">
                    {progress.topics_completed} of {progress.total_topics_assigned}
                  </span>
                </div>
                <Progress 
                  value={progress.total_topics_assigned > 0 
                    ? (progress.topics_completed / progress.total_topics_assigned) * 100 
                    : 0} 
                  className="h-3" 
                />
              </div>
              
              {stats.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Assignment Completion</span>
                    <span className="text-muted-foreground">
                      {stats.completed} of {stats.total}
                    </span>
                  </div>
                  <Progress value={stats.completionRate} className="h-3" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TodayTimetableCard timetableData={dashboardData.today_schedule || []} />
          <PersonalizationCard />
        </div>

      </div>
    </div>
  );
};

export default AdminStudentDashboardPage;