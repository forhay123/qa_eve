
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchSubjects,
  fetchTopicsForSubject,
  updateTopic,
  deleteTopic,
} from '../services/api';
import Layout from '../components/Layout';

const AdminTopicManager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [level, setLevel] = useState('jss1');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({ week_number: '', title: '', file: null });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (location.state?.level) setLevel(location.state.level);
  }, [location.state]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await fetchSubjects(level);
        setSubjects(data);

        const subjectId = location.state?.subjectId;
        if (subjectId) {
          const subject = data.find((s) => s.id === subjectId);
          if (subject) {
            setSelectedSubjectId(subject.id);
            loadTopics(subject.id, subject.level, subject.name);
          }
        } else {
          setSelectedSubjectId(null);
          setTopics([]);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };

    loadSubjects();
  }, [level, location.state]);

  const loadTopics = async (subjectId, forcedLevel = null, forcedName = null) => {
    const subject = subjects.find((s) => s.id === parseInt(subjectId));
    const subjectLevel = forcedLevel || subject?.level;
    const subjectName = forcedName || subject?.name;

    if (!subjectLevel || !subjectName) return;

    try {
      const data = await fetchTopicsForSubject(subjectLevel, subjectName);
      setTopics(data);
      setSelectedSubjectId(subjectId);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  const resetForm = () => {
    setForm({ week_number: '', title: '', file: null });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSubjectId) {
      alert('Please select a subject.');
      return;
    }

    try {
      if (editId) {
        await updateTopic(editId, {
          week_number: form.week_number,
          title: form.title,
          pdf_url: null,
        });
      } else {
        const formData = new FormData();
        formData.append('week_number', form.week_number);
        formData.append('title', form.title);
        formData.append('file', form.file);

        const res = await fetch(`http://localhost:8000/subjects/${selectedSubjectId}/topics`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to create topic');
      }

      const subject = subjects.find((s) => s.id === selectedSubjectId);
      if (subject) {
        navigate(`/lesson-plan/${subject.level}/${subject.name}`);
      }

      resetForm();
      loadTopics(selectedSubjectId);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(err.message || 'Something went wrong.');
    }
  };

  const startEdit = (topic) => {
    setForm({
      week_number: topic.week_number,
      title: topic.title,
      file: null,
    });
    setEditId(topic.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      await deleteTopic(id);
      loadTopics(selectedSubjectId);
    } catch (err) {
      alert('Failed to delete topic.');
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-background text-foreground min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          🛠 Admin Topic Manager
        </h1>

        {/* Class & Subject Selectors */}
        <div className="flex gap-4 mb-4">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="p-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'].map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={selectedSubjectId || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setSelectedSubjectId(id);
              loadTopics(id);
            }}
            className="p-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground p-4 rounded shadow mb-6 border border-border"
        >
          <h3 className="text-xl font-semibold mb-4">
            {editId ? '✏️ Edit Topic' : '➕ Add New Topic'}
          </h3>
          <input
            type="number"
            placeholder="Week Number"
            value={form.week_number}
            onChange={(e) =>
              setForm({ ...form, week_number: parseInt(e.target.value) || '' })
            }
            required
            className="block mb-2 p-2 border border-border rounded w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Lesson Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="block mb-2 p-2 border border-border rounded w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {!editId && (
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, file: e.target.files[0] }))
              }
              required
              className="block mb-4 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
            />
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded transition-colors"
            >
              {editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-destructive hover:text-destructive/80 underline"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Topics List */}
        <h3 className="text-xl font-bold mb-2">🗂 Topics</h3>
        <ul>
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="border-b border-border py-2 flex justify-between items-center hover:bg-muted/50 transition-colors"
            >
              <div>
                <strong>Week {topic.week_number}:</strong> {topic.title}
                {topic.pdf_url && (
                  <a
                    href={topic.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 underline ml-2"
                  >
                    PDF
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(topic)}
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(topic.id)}
                  className="text-destructive hover:text-destructive/80 underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default AdminTopicManager;
