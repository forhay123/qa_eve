import React, { useEffect, useState } from 'react';
import {
  getAllTeachers,
  getAllSubjects,
  assignSubjectToTeacher,
} from '../../services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from '../../hooks/use-toast';

export default function AssignSubjectPage() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllTeachers()
      .then(setTeachers)
      .catch(() => setError('❌ Failed to load teachers'));
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!level) return;
      setLoadingSubjects(true);
      setSubjects([]);
      setError(null);

      try {
        const general = await getAllSubjects(level);
        let all = [...general];

        if (level.startsWith('ss') && department && department !== 'general') {
          const dept = await getAllSubjects(level, department);
          const map = new Map();
          [...general, ...dept].forEach((s) => map.set(s.id, s));
          all = Array.from(map.values());
        }

        setSubjects(all);
      } catch {
        setError('❌ Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, [level, department]);

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject) {
      toast.error('Please select both teacher and subject');
      return;
    }

    try {
      await assignSubjectToTeacher(selectedTeacher, selectedSubject);
      toast.success('Subject assigned successfully!');
      setSelectedSubject('');
      setSelectedTeacher('');
    } catch {
      toast.error('Failed to assign subject');
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Subject to Teacher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select
              value={level}
              onValueChange={(value) => {
                setLevel(value);
                setDepartment('');
                setSubjects([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {['jss1', 'jss2'].map((lvl) => {
                  let displayName = lvl.toUpperCase();

                  if (lvl === 'jss1') displayName = 'LFC';
                  if (lvl === 'jss2') displayName = 'LDC';

                  return (
                    <SelectItem key={lvl} value={lvl}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {level.startsWith('ss') && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {['general', 'science', 'commercial', 'arts'].map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name || t.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              disabled={loadingSubjects}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects
                  .filter(
                    (s) =>
                      s.name.toLowerCase() !== 'opening prayer' &&
                      s.name.toLowerCase() !== 'closing prayer'
                  )
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAssign} disabled={loadingSubjects}>
          ➕ Assign Subject
        </Button>
      </CardContent>
    </Card>
  );
}
