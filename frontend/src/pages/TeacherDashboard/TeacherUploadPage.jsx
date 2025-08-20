import React, { useEffect, useState } from 'react';
import { uploadResource, getTeacherClasses, fetchAssignedSubjects } from '../../services/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

const TeacherUploadPage = () => {
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
  const [allAssignedSubjects, setAllAssignedSubjects] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const determineLevel = (studentClass) => {
    const lower = studentClass.trim().toLowerCase();
    if (lower.startsWith('ss')) return 'senior';
    if (lower.startsWith('jss')) return 'junior';
    return '';
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classes = await getTeacherClasses();
        setClassOptions(classes);
      } catch (err) {
        console.error('❌ Failed to load class options:', err.message);
      } finally {
        setLoadingClasses(false);
      }
    };

    const fetchSubjects = async () => {
      try {
        const subjects = await fetchAssignedSubjects(); // returns [{ id, name }]
        setAllAssignedSubjects(subjects);
      } catch (err) {
        console.error('❌ Failed to fetch assigned subjects:', err.message);
      }
    };

    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    const selectedClass = form.student_class;
    const level = determineLevel(selectedClass);

    if (!selectedClass || !level) {
      setSubjectOptions([]);
      setForm((prev) => ({ ...prev, level: '' }));
      return;
    }

    setLoadingSubjects(true);
    setForm((prev) => ({ ...prev, level }));

    // ✅ Deduplicate subjects by name
    const seen = new Set();
    const deduped = [];

    for (const subj of allAssignedSubjects) {
      const nameKey = subj.name.toLowerCase().trim();
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        deduped.push(subj);
      }
    }

    setSubjectOptions(deduped);
    setLoadingSubjects(false);
  }, [form.student_class, allAssignedSubjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.subject || !form.student_class || !form.file) {
      alert("Please complete all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('subject', form.subject);
    formData.append('student_class', form.student_class);
    formData.append('level', form.level);
    formData.append('description', form.description);
    formData.append('file', form.file);

    try {
      await uploadResource(formData);
      alert('✅ Resource uploaded successfully!');
      setForm({
        title: '',
        subject: '',
        student_class: '',
        level: '',
        description: '',
        file: null,
      });
      setSubjectOptions([]);
    } catch (err) {
      console.error('❌ Upload error:', err.message);
      alert('❌ Failed to upload resource. Please check your input.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">
          📤 Upload Teaching Resource
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Title *</label>
            <input
              name="title"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter resource title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Class *</label>
            <select
              name="student_class"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
              value={form.student_class}
              onChange={handleChange}
              required
            >
              <option value="">Select Class</option>
              {loadingClasses ? (
                <option disabled>Loading classes...</option>
              ) : (
                classOptions.map((cls, idx) => (
                  <option key={idx} value={cls}>
                    {cls}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Subject *</label>
            <select
              name="subject"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
              value={form.subject}
              onChange={handleChange}
              required
              disabled={subjectOptions.length === 0}
            >
              <option value="">
                {loadingSubjects
                  ? 'Loading subjects...'
                  : subjectOptions.length === 0
                  ? 'Select class to load subjects'
                  : 'Select Subject'}
              </option>
              {subjectOptions.map((subj) => (
                <option key={subj.id} value={subj.name}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Description</label>
            <textarea
              name="description"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
              placeholder="Brief description of the resource (optional)"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Upload PDF *</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition duration-200"
            >
              Upload Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherUploadPage;
