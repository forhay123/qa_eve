
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Users, BookOpen, GraduationCap, ClipboardList, TrendingUp, Calendar } from 'lucide-react';
import {
  fetchAllUsers,
  fetchAllReportCards,
  getTotalSubjectsCount,
  fetchAttendanceSummary,
  fetchUniqueReportCardStudentsCount,
} from '../services/api';

const AdminDashboardPage = () => {
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
  const [userCounts, setUserCounts] = useState({
    students: 0,
    admins: 0,
    teachers: 0,
    parents: 0,
  });

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
        ] = await Promise.all([
          fetchAllUsers(),
          fetchAllReportCards(),
          getTotalSubjectsCount(),
          fetchAttendanceSummary(),
          fetchUniqueReportCardStudentsCount(),
        ]);

        setUsers(usersData);
        setReportCards(reportCardsData);
        setTotalSubjects(totalSubjectsData.total_subjects ?? 0);
        setAttendanceSummary(attendanceSummaryData);
        setUniqueReportCardStudents(uniqueReportCardStudentsData.unique_student_report_cards ?? 0);

        const counts = usersData.reduce(
          (acc, user) => {
            if (user.role === 'student') acc.students += 1;
            else if (user.role === 'admin') acc.admins += 1;
            else if (user.role === 'teacher') acc.teachers += 1;
            else if (user.role === 'parent') acc.parents += 1;
            return acc;
          },
          { students: 0, admins: 0, teachers: 0, parents: 0 }
        );
        setUserCounts(counts);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const userStats = [
    { label: 'Total Students', value: userCounts.students, icon: GraduationCap, color: 'text-blue-600' },
    { label: 'Total Teachers', value: userCounts.teachers, icon: Users, color: 'text-green-600' },
    { label: 'Total Parents', value: userCounts.parents, icon: Users, color: 'text-purple-600' },
    { label: 'Total Admins', value: userCounts.admins, icon: Users, color: 'text-red-600' },
  ];

  const attendanceStats = [
    {
      label: 'Present',
      value: attendanceSummary.present,
      color: 'bg-green-500',
      variant: 'default'
    },
    {
      label: 'Absent',
      value: attendanceSummary.absent,
      color: 'bg-red-500',
      variant: 'destructive'
    },
    {
      label: 'Late',
      value: attendanceSummary.late,
      color: 'bg-yellow-500',
      variant: 'secondary'
    },
    {
      label: 'Excused',
      value: attendanceSummary.excused,
      color: 'bg-blue-500',
      variant: 'outline'
    }
  ];

  const totalAttendanceRecords = attendanceSummary.total_records || 1;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 text-lg">
          Comprehensive overview of your educational institution
        </p>
      </div>

      {/* User Statistics */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">User Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userStats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <Badge variant="secondary" className="mt-2">
                  Active Users
                </Badge>
              </CardContent>
            </Card>
          ))}
          
          {/* Total Users Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{users.length}</div>
              <Badge variant="default" className="mt-2">
                All Roles
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Academic Statistics */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Academic Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Total Subjects
              </CardTitle>
              <CardDescription>Available subjects across all levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-2">{totalSubjects}</div>
              <Badge variant="outline">Active Curriculum</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                Students with Report Cards
              </CardTitle>
              <CardDescription>Students who have received evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-2">{uniqueReportCardStudents}</div>
              <Badge variant="secondary">Evaluated Students</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Attendance Analytics */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Attendance Analytics</h2>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Total Attendance Records</CardTitle>
              <CardDescription>All recorded attendance entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{attendanceSummary.total_records}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Total Attendance Days</CardTitle>
              <CardDescription>Unique days with attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{attendanceSummary.total_days}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Attendance Breakdown */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
            <CardDescription>Distribution of attendance statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attendanceStats.map(({ label, value, variant }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
                  <Badge variant={variant} className="text-xs">
                    {label}
                  </Badge>
                </div>
              ))}
            </div>
            
            {/* Progress Bars */}
            <div className="space-y-4">
              {attendanceStats.map(({ label, value, color }) => {
                const percentage = ((value / totalAttendanceRecords) * 100).toFixed(1);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{label}</span>
                      <span className="text-gray-600">{percentage}%</span>
                    </div>
                    <Progress 
                      value={parseFloat(percentage)} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
