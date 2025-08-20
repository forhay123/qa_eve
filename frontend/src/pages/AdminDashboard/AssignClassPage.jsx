import React, { useState, useEffect } from 'react';
import { fetchTeachers, assignClassToTeacher, fetchAssignedClasses } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from '../../hooks/use-toast';

const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const departments = ['General', 'Science', 'Commercial', 'Arts'];

export default function AssignClassPage() {
  const [teachers, setTeachers] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const t = await fetchTeachers();
        const a = await fetchAssignedClasses();
        setTeachers(t);
        setAssignedClasses(a);
      } catch {
        toast.error('❌ Failed to load data');
      }
    };
    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedTeacherId || !level) {
      toast.error('Please select both teacher and class level');
      return;
    }
    try {
      await assignClassToTeacher(selectedTeacherId, level, department);
      toast.success('✅ Class assigned successfully!');
      setLevel('');
      setDepartment('');
      const updated = await fetchAssignedClasses();
      setAssignedClasses(updated);
    } catch {
      toast.error('❌ Failed to assign class');
    }
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Class to Teacher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="teacher">Select Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="-- Select --" />
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
            <Label htmlFor="level">Class Level</Label>
            <Select
              value={level}
              onValueChange={(value) => {
                setLevel(value);
                setDepartment('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Select Level --" />
              </SelectTrigger>
              <SelectContent>
                {classLevels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl.toLowerCase()}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {level.startsWith('ss') && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Select Department --" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d.toLowerCase()}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={handleAssign}>
          ➕ Assign Class
        </Button>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">📋 Assigned Classes</h3>
          {assignedClasses.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedClasses.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.user.full_name || a.user.username}</TableCell>
                        <TableCell>{a.level.toUpperCase()}</TableCell>
                        <TableCell>{a.department || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No assigned classes yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
