import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchTeacherClasses,
  fetchStudentsByClassInTeacher,
  fetchTeacherReportCards,
  updateReportCardComment,
} from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const TeacherReportComments = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState('term_1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchTeacherClasses();
        setClasses(res);
      } catch (err) {
        console.error('Failed to load classes:', err.message);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return setStudents([]);
      const [level, department = ''] = selectedClass.split('-');
      try {
        const res = await fetchStudentsByClassInTeacher(level, department);
        setStudents(res || []);
      } catch (err) {
        console.error('Failed to load students:', err.message);
        setStudents([]);
      }
    };

    setStudents([]);
    setSelectedStudentId('');
    setResults([]);
    loadStudents();
  }, [selectedClass]);

  const handleSearch = async () => {
    if (!selectedStudentId || !term || !year) {
      toast.error('Fill all fields');
      return;
    }

    const parsedId = parseInt(selectedStudentId);
    if (isNaN(parsedId)) {
      toast.error('Invalid student selected');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchTeacherReportCards({
        student_id: parsedId,
        term,
        year,
      });

      if (data.length === 0) {
        toast.info('No report cards found for your subjects');
      }

      setResults(data);
    } catch (err) {
      toast.error(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, newComment) => {
    setSavingId(id);
    try {
      await updateReportCardComment(id, newComment);
      toast.success('Comment updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="max-w-6xl mx-auto mt-6 p-6 bg-background text-foreground rounded shadow">
      <CardHeader>
        <CardTitle>✏️ Teacher: Comment on Student Performance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="-- Choose Class --" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls, idx) => {
                  const value = `${cls.level}-${cls.department || ''}`;
                  const display = `${cls.level.toUpperCase()} ${cls.department?.toUpperCase() || ''}`;
                  return (
                    <SelectItem key={idx} value={value}>
                      {display}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select
              value={selectedStudentId}
              onValueChange={(value) => setSelectedStudentId(value)}
              disabled={students.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={students.length === 0 ? 'No students found' : '-- Choose Student --'}
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term_1">Term 1</SelectItem>
                <SelectItem value="term_2">Term 2</SelectItem>
                <SelectItem value="term_3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
            />
          </div>
        </div>

        <Button
          className="w-full sm:w-auto mt-4"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Report Cards'}
        </Button>

        {results.length > 0 && (
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>1st Test</TableHead>
                <TableHead>2nd Test</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.subject}</TableCell>
                  <TableCell>{r.first_test_score ?? '-'}</TableCell>
                  <TableCell>{r.second_test_score ?? '-'}</TableCell>
                  <TableCell>{r.exam_score ?? '-'}</TableCell>
                  <TableCell>
                    <Input
                      value={r.comment || ''}
                      onChange={(e) =>
                        setResults(results.map(item =>
                          item.id === r.id ? { ...item, comment: e.target.value } : item
                        ))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(r.id, r.comment)}
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id ? 'Saving...' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherReportComments;
