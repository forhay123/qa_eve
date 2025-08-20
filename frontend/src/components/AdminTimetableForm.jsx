import React, { useState, useEffect } from 'react';
import { fetchSubjectsByLevel } from '../services/api';
import { toast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';

// Include Saturday and Sunday in the days array
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const levels = ['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'];
const departments = ['Science', 'Commercial', 'Art'];

const periodOptions = [
  { value: 1, label: 'Period 1 (08:00 - 08:40)' },
  { value: 2, label: 'Period 2 (08:40 - 09:20)' },
  { value: 3, label: 'Period 3 (09:20 - 10:00)' },
  { value: 4, label: 'Period 4 (10:15 - 10:55)' },
  { value: 5, label: 'Period 5 (10:55 - 11:35)' },
  { value: 6, label: 'Period 6 (12:10 - 12:50)' },
  { value: 7, label: 'Period 7 (12:50 - 13:30)' },
  { value: 8, label: 'Period 8 (13:30 - 14:10)' },
  { value: 9, label: 'Period 9 (14:10 - 14:50)' },
];

const periodTimeMap = {
  1: ['08:00', '08:40'],
  2: ['08:40', '09:20'],
  3: ['09:20', '10:00'],
  4: ['10:15', '10:55'],
  5: ['10:55', '11:35'],
  6: ['12:10', '12:50'],
  7: ['12:50', '13:30'],
  8: ['13:30', '14:10'],
  9: ['14:10', '14:50'],
};

const AdminTimetableForm = ({ onSubmit, onCancel, initialData }) => {
  const [form, setForm] = useState({
    day: '',
    period: '',
    level: '',
    department: '',
    subject: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSeniorLevel = ['ss1', 'ss2', 'ss3'].includes(form.level?.toLowerCase());

  useEffect(() => {
    if (initialData && typeof initialData === 'object') {
      setForm({
        day: initialData.day || '',
        period: initialData.period || '',
        level: initialData.level || '',
        department: initialData.department || '',
        subject: initialData.subject || '',
      });
    } else {
      setForm({
        day: '',
        period: '',
        level: '',
        department: '',
        subject: '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!form.level) return setSubjects([]);
      try {
        const subs = await fetchSubjectsByLevel(form.level, isSeniorLevel ? form.department : '');
        setSubjects(subs);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch subjects",
          variant: "destructive",
        });
        setSubjects([]);
      }
    };
    loadSubjects();
  }, [form.level, form.department]);

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'level' ? { subject: '', department: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const periodNum = Number(form.period);
    const [start_time, end_time] = periodTimeMap[periodNum] || [];

    if (!start_time || !end_time) {
      toast({
        title: "Error",
        description: "Invalid period selection.",
        variant: "destructive",
      });
      return;
    }

    if (!form.day || !form.level || !form.subject || (isSeniorLevel && !form.department)) {
      toast({
        title: "Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    const dto = {
      day: form.day,
      level: form.level,
      subject: form.subject,
      period: periodNum,
      start_time,
      end_time,
      ...(isSeniorLevel ? { department: form.department } : {}),
    };

    setLoading(true);
    try {
      await onSubmit?.(dto);
      setForm({ day: '', period: '', level: '', department: '', subject: '' });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save timetable.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Select value={form.day} onValueChange={(value) => handleSelectChange('day', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Day" />
                </SelectTrigger>
                <SelectContent>
                  {/* The map function will now iterate over 'Monday' through 'Sunday' */}
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={form.period} onValueChange={(value) => handleSelectChange('period', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value.toString()}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={form.level} onValueChange={(value) => handleSelectChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSeniorLevel && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={form.department} onValueChange={(value) => handleSelectChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={form.subject} onValueChange={(value) => handleSelectChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Timetable"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminTimetableForm;