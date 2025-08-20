import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  ClipboardList, 
  TrendingUp, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  School,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  User
} from 'lucide-react';
import {
  fetchAllUsers,
  fetchAllReportCards,
  getTotalSubjectsCount,
  fetchAttendanceSummary,
  fetchUniqueReportCardStudentsCount,
  fetchAllClasses,
  fetchStudentsByClass,
  adminFetchStudentDashboard,
  adminFetchStudentSubjects,
  adminFetchStudentProgress,
  adminFetchStudentAssignments,
  adminFetchStudentSubmissions,
  autoGradeLateAssignments
} from '../services/api';
import AdminAssignmentMonitor from "../components/AdminAssignmentMonitor";
import AdminStudentDashboardPage from '../components/AdminStudentDashboardPage';
import { toast } from '../hooks/use-toast';

// Helper functions
const getCurrentWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / (1000 * 60 * 60 * 24 * 7)));
};

const ResponsiveAdminDashboardPage = () => {
  // Admin dashboard states
  const [users, setUsers] = useState([]);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [reportCards, setReportCards] = useState([]);
  const [uniqueReportCardStudents, setUniqueReportCardStudents] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_records: 0,
    total_days: 0,
    present: 0,
    absent: 0,
    excused: 0,
    late: 0,
  });
  const [loading, setLoading] = useState(true);

  // Student selection states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showStudentView, setShowStudentView] = useState(false);

  // Student dashboard states
  const [studentDashboardData, setStudentDashboardData] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [studentProgressData, setStudentProgressData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const userCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        if (user.role === 'student') acc.students += 1;
        else if (user.role === 'admin') acc.admins += 1;
        else if (user.role === 'teacher') acc.teachers += 1;
        else if (user.role === 'parent') acc.parents += 1;
        return acc;
      },
      { students: 0, admins: 0, teachers: 0, parents: 0 }
    );
  }, [users]);

  const attendanceMetrics = useMemo(() => {
    const total = attendanceSummary.total_records || 1;
    return {
      presentRate: ((attendanceSummary.present / total) * 100).toFixed(1),
      absentRate: ((attendanceSummary.absent / total) * 100).toFixed(1),
      lateRate: ((attendanceSummary.late / total) * 100).toFixed(1),
      excusedRate: ((attendanceSummary.excused / total) * 100).toFixed(1),
    };
  }, [attendanceSummary]);

  // Load initial admin dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          usersData,
          reportCardsData,
          totalSubjectsData,
          attendanceSummaryData,
          uniqueReportCardStudentsData,
          classesData
        ] = await Promise.all([
          fetchAllUsers(),
          fetchAllReportCards(),
          getTotalSubjectsCount(),
          fetchAttendanceSummary(),
          fetchUniqueReportCardStudentsCount(),
          fetchAllClasses()
        ]);

        setUsers(usersData);
        setReportCards(reportCardsData);
        setTotalSubjects(totalSubjectsData.total_subjects ?? 0);
        setAttendanceSummary(attendanceSummaryData);
        setUniqueReportCardStudents(uniqueReportCardStudentsData.unique_student_report_cards ?? 0);
        
        // Format classes for dropdown
        const formatted = classesData.map((c) => ({
          label: `${c.level.toUpperCase()} ${c.department ? `(${c.department})` : ''}`,
          value: `${c.level}|${c.department || ''}`,
        }));
        setClasses(formatted);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    setShowStudentView(false);
    loadStudents();
  }, [selectedClass]);

  // Load student dashboard when student is selected
  const handleStudentSelection = async (studentId) => {
    if (!studentId) return;

    const student = students.find((s) => s.user_id === parseInt(studentId));
    if (!student) return;

    setSelectedStudent(student);
    setLoading(true);

    try {
      const [
        dashboardData,
        subjectsData,
        progressData,
      ] = await Promise.all([
        adminFetchStudentDashboard(student.user_id).then(res => res.data),

        student.level && student.department
          ? adminFetchStudentSubjects(student.level, student.department).then(res => res.data)
          : Promise.resolve([]),

        adminFetchStudentProgress(student.user_id).then(res => res.data),
        adminFetchStudentAssignments(student.user_id).then(res => res.data),
        adminFetchStudentSubmissions(student.user_id).then(res => res.data),
      ]);

      // Safe fallback data
      const safeDashboardData = dashboardData || {};
      const todayTopics = safeDashboardData.today_topics || [];
      const assignments = safeDashboardData.assignments || [];
      const progress = safeDashboardData.progress || {
        total_topics_assigned: 0,
        topics_completed: 0,
        topics_remaining: 0
      };
      const upcomingEvents = safeDashboardData.upcoming_events || [];

      setStudentDashboardData({
        today_topics: todayTopics,
        progress: progress,
        assignments: assignments,
        upcoming_events: upcomingEvents,
        date: safeDashboardData.date || new Date().toLocaleDateString(),
        current_week: safeDashboardData.current_week || getCurrentWeekNumber()
      });

      setStudentSubjects(subjectsData || []);
      setStudentProgressData(progressData || []);

      setConnectionError(null);
      setShowStudentView(true);

      // Handle UX feedback based on data availability
      const isCompletelyEmpty =
        todayTopics.length === 0 &&
        assignments.length === 0 &&
        upcomingEvents.length === 0 &&
        progress.total_topics_assigned === 0;

      if (isCompletelyEmpty) {
        toast.warn(`${student.full_name} has no data for week ${safeDashboardData.current_week}.`);
      } else {
        toast.success(`Viewing dashboard for ${student.full_name}`);
      }

    } catch (err) {
      console.error("Error loading student dashboard", err);
      setConnectionError(err.message);
      toast.error("Failed to load student dashboard");
    } finally {
      setLoading(false);
    }
  };

  const userStats = [
    { 
      label: 'Total Students', 
      value: userCounts.students, 
      icon: GraduationCap, 
      description: 'Active learners'
    },
    { 
      label: 'Total Teachers', 
      value: userCounts.teachers, 
      icon: Users, 
      description: 'Teaching staff'
    },
    { 
      label: 'Total Parents', 
      value: userCounts.parents, 
      icon: UserCheck, 
      description: 'Guardian accounts'
    },
    { 
      label: 'Total Admins', 
      value: userCounts.admins, 
      icon: Activity, 
      description: 'System administrators'
    },
  ];

  const attendanceStats = [
    {
      label: 'Present',
      value: attendanceSummary.present,
      percentage: attendanceMetrics.presentRate,
      icon: CheckCircle2,
    },
    {
      label: 'Absent',
      value: attendanceSummary.absent,
      percentage: attendanceMetrics.absentRate,
      icon: XCircle,
    },
    {
      label: 'Late',
      value: attendanceSummary.late,
      percentage: attendanceMetrics.lateRate,
      icon: Clock,
    },
    {
      label: 'Excused',
      value: attendanceSummary.excused,
      percentage: attendanceMetrics.excusedRate,
      icon: AlertTriangle,
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <School className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Dashboard</h3>
            <p className="text-muted-foreground">Gathering institutional insights...</p>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard View
  if (showStudentView && selectedStudent) {
    return (
      <AdminStudentDashboardPage 
        selectedStudent={selectedStudent}
        studentDashboardData={studentDashboardData}
        studentSubjects={studentSubjects}
        studentProgressData={studentProgressData}
        connectionError={connectionError}
        onBackToAdmin={() => setShowStudentView(false)}
      />
    );
  }

  // Main Admin Dashboard View
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="space-y-8 p-6 w-full max-w-none">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-full">
              <School className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Comprehensive institutional oversight & analytics
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Student Selection Filters */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Student Dashboard View</h2>
              <p className="text-muted-foreground">Select a student to view their individual dashboard</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls, idx) => (
                      <option key={idx} value={cls.value}>
                        {cls.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={!students.length}
                    className="w-full p-3 rounded-md border border-input bg-background text-foreground disabled:opacity-50"
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
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => handleStudentSelection(selectedStudentId)}
                    disabled={!selectedStudentId}
                    className="w-full"
                  >
                    View Student Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced User Statistics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">User Demographics</h2>
              <p className="text-muted-foreground">Active platform participants across all roles</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userStats.map(({ label, value, icon: Icon, description }) => (
              <Card key={label} className="group hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-foreground">{label}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                  </div>
                  <div className="p-3 bg-primary rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Active
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Total Platform Users</h3>
                  <p className="text-muted-foreground">All registered accounts across the system</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-4xl font-bold text-primary">{users.length.toLocaleString()}</div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    All Roles
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Assignment Monitor Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Assignment Management</h2>
              <p className="text-muted-foreground">Real-time assignment tracking and monitoring</p>
            </div>
          </div>
          <AdminAssignmentMonitor />
        </section>

        {/* Enhanced Academic Statistics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Academic Overview</h2>
              <p className="text-muted-foreground">Curriculum and assessment statistics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary rounded-lg">
                      <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Subject Catalog
                  </CardTitle>
                  <Badge variant="outline">
                    Active
                  </Badge>
                </div>
                <CardDescription>
                  Complete curriculum across all academic levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold text-foreground">{totalSubjects}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  <span>Total Available Subjects</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary rounded-lg">
                      <ClipboardList className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Academic Records
                  </CardTitle>
                  <Badge variant="outline">
                    Evaluated
                  </Badge>
                </div>
                <CardDescription>
                  Students with comprehensive assessment records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold text-foreground">{uniqueReportCardStudents}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PieChart className="w-4 h-4" />
                  <span>Students with Report Cards</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enhanced Attendance Analytics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Attendance Analytics</h2>
              <p className="text-muted-foreground">Comprehensive attendance tracking and insights</p>
            </div>
          </div>
          
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <div className="p-2 bg-primary rounded-lg">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Total Records
                </CardTitle>
                <CardDescription>
                  Complete attendance database entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{attendanceSummary.total_records.toLocaleString()}</div>
                <Badge variant="secondary" className="mt-2">
                  All Entries
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <div className="p-2 bg-primary rounded-lg">
                    <Calendar className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Tracking Days
                </CardTitle>
                <CardDescription>
                  Unique days with recorded attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{attendanceSummary.total_days.toLocaleString()}</div>
                <Badge variant="secondary" className="mt-2">
                  Active Days
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <PieChart className="h-6 w-6 text-foreground" />
                Attendance Distribution Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive breakdown of all attendance statuses with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {attendanceStats.map(({ label, value, percentage, icon: Icon }) => (
                  <div key={label} className="text-center space-y-3">
                    <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
                      <div className="text-sm font-medium text-muted-foreground">{label}</div>
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Progress Indicators */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-foreground">Performance Breakdown</h4>
                <div className="space-y-4">
                  {attendanceStats.map(({ label, value, percentage }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{label}</span>
                          <Badge variant="outline" className="text-xs">
                            {value.toLocaleString()} records
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{percentage}%</span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={parseFloat(percentage)} 
                          className="h-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ResponsiveAdminDashboardPage;
