import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  getAllStudents,
  getAttendanceByDate,
  submitAttendance,
} from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Calendar, Users, CheckCircle, Save, GraduationCap } from 'lucide-react';

const MarkAttendanceByDate = () => {
  // Use a controlled date state initialized to the current day
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [groupedStudents, setGroupedStudents] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Effect to fetch all students on initial component load
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getAllStudents();
        setStudents(res);
      } catch (err) {
        console.error('Error fetching students:', err);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Effect to group students whenever the students list changes
  useEffect(() => {
    const grouped = {};
    students.forEach((student) => {
      const level = (student.level || student.student_class || 'Unknown').toUpperCase();
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(student);
    });

    // Sort students within each level by name for consistent display
    Object.keys(grouped).forEach(level => {
      grouped[level].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    });

    setGroupedStudents(grouped);
  }, [students]);

  // Effect to fetch attendance data whenever the date or student list changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (students.length === 0 || !selectedDate) {
        // Clear attendance data if no students or date is selected
        setAttendanceData({});
        return;
      }

      console.log(`Fetching attendance for date: ${selectedDate}`);

      setLoading(true);
      // Reset attendanceData to an empty object to clear previous state
      setAttendanceData({});
      try {
        const res = await getAttendanceByDate(selectedDate);
        const mapped = {};
        res.forEach((entry) => {
          mapped[entry.student_id] = entry.status;
        });
        setAttendanceData(mapped);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate, students]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(attendanceData)
      .filter(([_, status]) => status) // Only include students with a status
      .map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        date: selectedDate,
        status,
      }));

    if (payload.length === 0) {
      toast({
        title: "No Data",
        description: "Please mark attendance for at least one student",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitAttendance({
        records: payload,
        date_override: selectedDate,
      });

      // This is the success toast notification. It's already in your code.
      toast({
        title: "Success",
        description: `Attendance submitted successfully for ${payload.length} students`,
      });
    } catch (err) {
      console.error('Submit failed:', err);
      toast({
        title: "Error",
        description: "Failed to submit attendance",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getClassProgress = (studentsInLevel) => {
    const totalStudents = studentsInLevel.length;
    const markedStudents = studentsInLevel.filter(
      student => attendanceData[student.id]
    ).length;
    return { marked: markedStudents, total: totalStudents };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      absent: { variant: "destructive", className: "" },
      late: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
      excused: { variant: "outline", className: "border-blue-500 text-blue-600" },
    };

    if (!status) return null;

    const config = statusConfig[status] || { variant: "secondary", className: "" };

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalMarked = Object.values(attendanceData).filter(Boolean).length;
  const totalStudents = students.length;

  if (loading && students.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Loading students...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6" />
            Mark Daily Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="space-y-2">
              <Label htmlFor="date-picker">Select Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="text-muted-foreground">
                    {totalMarked} / {totalStudents} students marked
                  </span>
                </div>
                <Progress value={(totalMarked / totalStudents) * 100} className="h-2" />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || totalMarked === 0}
              size="lg"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Submit Attendance
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedStudents).map(([level, studentsInLevel]) => {
          const progress = getClassProgress(studentsInLevel);
          const progressPercentage = (progress.marked / progress.total) * 100;

          return (
            <Card key={level}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {level}
                    <Badge variant="secondary">
                      {studentsInLevel.length} Students
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {progress.marked} / {progress.total} marked
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead className="w-48">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsInLevel.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {student.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.level || student.student_class}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(attendanceData[student.id]) || (
                            <span className="text-muted-foreground text-sm">Not marked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attendanceData[student.id] || ''}
                            onValueChange={(value) => handleStatusChange(student.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Present
                                </div>
                              </SelectItem>
                              <SelectItem value="absent">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  Absent
                                </div>
                              </SelectItem>
                              <SelectItem value="late">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  Late
                                </div>
                              </SelectItem>
                              <SelectItem value="excused">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Excused
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MarkAttendanceByDate;