import React, { useEffect, useState } from 'react';
import { uploadResource, getAllClasses, fetchSubjects } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast'; // ✅ fixed import

const AdminUploadPage = () => {
  const { auth } = useAuth();

  const [form, setForm] = useState({
    title: '',
    subject: '',
    student_class: '',
    level: '',
    description: '',
    file: null,
  });

  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const determineLevel = (className) => {
    const lower = className.toLowerCase();
    if (lower.startsWith('ss')) return 'senior';
    if (lower.startsWith('jss')) return 'junior';
    return '';
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classes = await getAllClasses(auth.role);
        setClassOptions(classes);
      } catch (err) {
        console.error('❌ Failed to load class list:', err);
      }
    };
    loadClasses();
  }, [auth.role]);

  useEffect(() => {
    const fetchRelevantSubjects = async () => {
      const level = determineLevel(form.student_class);
      if (!form.student_class || !level) {
        setSubjectOptions([]);
        setForm((prev) => ({ ...prev, level: '' }));
        return;
      }

      try {
        setLoadingSubjects(true);
        const subjects = await fetchSubjects(form.student_class, level);
        setSubjectOptions(subjects);
        setForm((prev) => ({ ...prev, level }));
      } catch (err) {
        console.error('❌ Failed to fetch subjects:', err);
        setSubjectOptions([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchRelevantSubjects();
  }, [form.student_class]);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }

    try {
      await uploadResource(formData);
      toast.success("Resource uploaded successfully!"); // ✅ updated toast
      setForm({
        title: '',
        subject: '',
        student_class: '',
        level: '',
        description: '',
        file: null,
      });
      setSubjectOptions([]);
      e.target.reset();
    } catch (err) {
      console.error('Upload failed', err);
      toast.error("Upload failed"); // ✅ updated toast
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">📤 Upload Educational Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter resource title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_class">Class</Label>
            <Select value={form.student_class} onValueChange={(value) => handleChange('student_class', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((cls, idx) => (
                  <SelectItem key={idx} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select 
              value={form.subject} 
              onValueChange={(value) => handleChange('subject', value)}
              disabled={subjectOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingSubjects
                    ? 'Loading subjects...'
                    : subjectOptions.length === 0
                    ? 'Select class to load subjects'
                    : 'Select Subject'
                } />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((subj) => (
                  <SelectItem key={subj.id} value={subj.name}>{subj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload PDF File</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
          </div>

          <div className="text-right">
            <Button type="submit">
              Upload Resource
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminUploadPage;
