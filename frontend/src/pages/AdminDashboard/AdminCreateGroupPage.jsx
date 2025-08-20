import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchStudentsByClass, fetchAllStudents } from '@/services/messaging';
import { fetchTeachers } from '../../services/api';
import { fetchWithAuth } from '@/services/utils';
import { toast } from 'sonner';

// Fallback minimal Checkbox since "@/components/ui/checkbox" doesn't exist in your project
const Checkbox = ({ id, checked, onChange }) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="w-4 h-4 rounded border border-gray-300 text-primary focus:ring-2 focus:ring-primary"
  />
);

const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const departments = ['General', 'Science', 'Commercial', 'Arts'];

export default function AdminCreateGroupPage() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const [groupName, setGroupName] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [isClassGroup, setIsClassGroup] = useState(false);
  const [isCustomGroup, setIsCustomGroup] = useState(false);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const data = await fetchTeachers();
        setTeachers(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load teachers.");
      }
    };
    loadTeachers();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!level || isCustomGroup) return;

      try {
        const data = await fetchStudentsByClass(level, department === 'general' ? '' : department);
        setStudents(data);
        setSelectedStudentIds([]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load students.");
      }
    };

    if (isClassGroup && level) {
      loadStudents();
    }
  }, [level, department, isClassGroup, isCustomGroup]);

  useEffect(() => {
    const loadAllStudents = async () => {
      try {
        const data = await fetchAllStudents();
        setStudents(data);
        setSelectedStudentIds([]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load all students.");
      }
    };

    if (isCustomGroup) {
      loadAllStudents();
    }
  }, [isCustomGroup]);

  const handleToggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleToggleTeacher = (id) => {
    setSelectedTeacherIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      toast.error("Group name is required");
      return;
    }

    if (isClassGroup && !level) {
      toast.error("Select a class level");
      return;
    }

    if (isCustomGroup && selectedStudentIds.length === 0 && selectedTeacherIds.length === 0) {
      toast.error("Select at least one student or teacher for a custom group");
      return;
    }

    try {
      await fetchWithAuth('/chat/groups', 'POST', {
        name: groupName,
        level: isClassGroup ? level : null,
        department: (isClassGroup && department !== 'general') ? department : null,
        is_class_group: isClassGroup,
        is_custom_group: isCustomGroup,
        student_ids: isCustomGroup ? selectedStudentIds : [],
        teacher_ids: isCustomGroup ? selectedTeacherIds : [],
        selected_classes: isClassGroup ? selectedClasses : [],
      });

      toast.success("Group created successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create group");
    }
  };

  const resetForm = () => {
    setGroupName('');
    setLevel('');
    setDepartment('');
    setIsClassGroup(false);
    setIsCustomGroup(false);
    setSelectedStudentIds([]);
    setSelectedTeacherIds([]);
    setSelectedClasses([]);
    setStudents([]);
  };

  const groupStudentsByClass = (list) => {
    const grouped = {};
    list.forEach(student => {
      const key = `${student.level} - ${student.department || 'General'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(student);
    });
    return grouped;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Chat Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label>Group Name</Label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border rounded bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Group Type */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="class-group"
                checked={isClassGroup}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsClassGroup(checked);
                  if (checked) {
                    setIsCustomGroup(false);
                    setSelectedStudentIds([]);
                    setSelectedTeacherIds([]);
                  }
                }}
              />
              <Label htmlFor="class-group">Full Class Group</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-group"
                checked={isCustomGroup}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsCustomGroup(checked);
                  if (checked) {
                    setIsClassGroup(false);
                    setLevel('');
                    setDepartment('');
                    setSelectedClasses([]);
                  }
                }}
              />
              <Label htmlFor="custom-group">Custom Group</Label>
            </div>
          </div>

          {/* Class Selection */}
          {isClassGroup && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Level</Label>
                <Select
                  value={level}
                  onValueChange={(val) => {
                    setLevel(val);
                    setDepartment('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {classLevels.map(lvl => (
                      <SelectItem key={lvl} value={lvl.toLowerCase()}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {level.startsWith('ss') && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dep => (
                        <SelectItem key={dep} value={dep.toLowerCase()}>
                          {dep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Teachers & Students */}
          {isCustomGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Teachers</Label>
                <div className="max-h-48 overflow-y-auto border rounded p-3 bg-muted/30">
                  {teachers.length === 0 ? (
                    <p className="text-muted-foreground">No teachers available</p>
                  ) : (
                    teachers.map(teacher => (
                      <div key={teacher.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`teacher-${teacher.id}`}
                          checked={selectedTeacherIds.includes(teacher.id)}
                          onChange={() => handleToggleTeacher(teacher.id)}
                        />
                        <Label htmlFor={`teacher-${teacher.id}`} className="text-sm">
                          {teacher.full_name || teacher.username} ({teacher.level} - {teacher.department || 'General'})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Students</Label>
                <div className="max-h-64 overflow-y-auto border rounded p-3 bg-muted/30">
                  {students.length === 0 ? (
                    <p className="text-muted-foreground">No students available</p>
                  ) : (
                    Object.entries(groupStudentsByClass(students)).map(([className, group]) => (
                      <div key={className} className="mb-4">
                        <h4 className="font-medium text-sm mb-2 text-primary">{className}</h4>
                        <div className="space-y-1 ml-2">
                          {group.map(student => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleToggleStudent(student.id)}
                              />
                              <Label htmlFor={`student-${student.id}`} className="text-sm">
                                {student.full_name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button onClick={handleCreateGroup} className="px-8">
              Create Group
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
