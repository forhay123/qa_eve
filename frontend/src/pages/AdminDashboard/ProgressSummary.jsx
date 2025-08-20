
import React, { useEffect, useState } from 'react';
import {
  fetchAllClasses,
  fetchStudentsByClass,
  fetchSubjects,
  fetchProgressSummary,
  fetchUserById,
} from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const ProgressSummary = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchAllClasses();
        console.log("📚 Classes loaded:", res);
        setClasses(res);
      } catch (err) {
        console.error('❌ Failed to load classes:', err.message);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        console.log("🚫 No class selected, clearing students");
        setStudents([]);
        return;
      }
      
      console.log("🎯 Selected class:", selectedClass);
      const [level, department = ''] = selectedClass.split('-');
      console.log("📊 Parsed - Level:", level, "Department:", department);
      
      try {
        console.log("📡 Calling fetchStudentsByClass with:", { level, department });
        const res = await fetchStudentsByClass(level, department);
        console.log("👥 Students loaded:", res);
        console.log("👥 Students count:", res?.length || 0);
        setStudents(res || []);
      } catch (err) {
        console.error('❌ Failed to load students:', err.message);
        console.error('❌ Full error:', err);
        setStudents([]);
      }
    };

    // Reset dependent states when class changes
    setStudents([]);
    setSelectedStudentId('');
    setSummaryData([]);
    setSubjects([]);
    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudentId) {
        setSummaryData([]);
        setSubjects([]);
        return;
      }

      setLoading(true);
      try {
        const user = await fetchUserById(selectedStudentId);
        const level = user.level;
        const department = user.department || '';
        const subjectRes = await fetchSubjects(level, department, 'admin');
        const summaryRes = await fetchProgressSummary(selectedStudentId);
        setSubjects(subjectRes);
        setSummaryData(summaryRes.weekly || []);
      } catch (err) {
        console.error('❌ Error fetching student progress:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [selectedStudentId]);

  const handleClassChange = (value) => {
    console.log("🔄 Class selection changed to:", value);
    console.log("🔄 Value type:", typeof value);
    console.log("🔄 Value length:", value?.length);
    if (value && value.trim()) {
      setSelectedClass(value);
    }
  };

  const handleStudentChange = (value) => {
    console.log("🔄 Student selection changed to:", value);
    setSelectedStudentId(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-foreground mb-6">📈 Weekly Progress Summary</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="space-y-2">
          <Label htmlFor="class-select">Select Class</Label>
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="-- Choose Class --" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls, idx) => {
                const value = `${cls.level}-${cls.department || ''}`;

                // Custom display name for JSS1 and JSS2
                let levelDisplay = cls.level.toUpperCase();
                if (cls.level.toLowerCase() === "jss1") levelDisplay = "LFC";
                if (cls.level.toLowerCase() === "jss2") levelDisplay = "LDC";

                const displayText = `${levelDisplay} ${cls.department?.toUpperCase() || ''}`;

                console.log(`🏫 Class option ${idx}:`, { value, displayText });

                return (
                  <SelectItem key={`class-${idx}-${value}`} value={value}>
                    {displayText.trim()}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="student-select">Select Student</Label>
          <Select 
            value={selectedStudentId} 
            onValueChange={handleStudentChange}
            disabled={students.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={students.length === 0 ? "No students found" : "-- Choose Student --"} />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={`student-${s.user_id}`} value={String(s.user_id)}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {loading ? (
        <p className="text-center text-muted-foreground mt-6">Loading summary...</p>
      ) : summaryData.length > 0 ? (
        <>
          <Card className="mb-10">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Average Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{entry.week}</TableCell>
                      <TableCell>{entry.avg_score.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Weekly Progress Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_score" fill="hsl(var(--primary))" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        selectedStudentId && (
          <p className="text-center text-muted-foreground mt-10">
            No summary data available for this student.
          </p>
        )
      )}
    </div>
  );
};

export default ProgressSummary;
