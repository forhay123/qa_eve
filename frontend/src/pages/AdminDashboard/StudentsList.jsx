
import { useEffect, useState } from "react";
import { fetchAllStudentProgress, getAllSubjects } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';

const VALID_LEVELS = ["jss1", "jss2", "jss3", "ss1", "ss2", "ss3"];

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedLevel) {
      setSubjects([]);
      setSelectedSubject("");
      return;
    }

    const loadSubjects = async () => {
      try {
        const result = await getAllSubjects(selectedLevel);
        setSubjects(result);
        setError("");
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load subjects.");
        setSubjects([]);
      }
    };

    loadSubjects();
  }, [selectedLevel]);

  useEffect(() => {
    if (!selectedLevel || !selectedSubject) {
      setStudents([]);
      return;
    }

    const loadStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchAllStudentProgress(selectedSubject);
        setStudents(result);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load student progress.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedLevel, selectedSubject]);

  return (
    <Card className="mx-auto max-w-7xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Student Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Select Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="-- Select Level --" />
              </SelectTrigger>
              <SelectContent>
                {VALID_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLevel && (
            <div className="space-y-2">
              <Label htmlFor="subject">Filter by Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map((subj, idx) => (
                    <SelectItem key={idx} value={subj.name}>
                      {subj.name} ({subj.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading && (
          <p className="text-muted-foreground text-sm">Loading student progress...</p>
        )}

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        {!loading && !error && students.length === 0 && (
          <p className="text-muted-foreground text-sm">No student progress data available.</p>
        )}

        {students.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Topics Covered</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell className="uppercase">{student.level}</TableCell>
                      <TableCell>{student.topics_covered}</TableCell>
                      <TableCell>{student.avg_score.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 h-auto">
                          <a href={`/admin-dashboard/students/${student.user_id}`}>
                            View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}