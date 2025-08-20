import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchTopicsForSubject,
  getCurrentUser,
  updateTopic,
  createTopic,
} from '../services/api';

const LessonPlanPage = () => {
  const { level, subject } = useParams();
  const [topics, setTopics] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editTopic, setEditTopic] = useState(null);
  const [form, setForm] = useState({ week_number: '', title: '', file: null });

  const normalizedLevel = level.toLowerCase();
  const normalizedSubject = subject.toLowerCase();

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        const allTopics = await fetchTopicsForSubject(normalizedLevel, normalizedSubject);
        const filtered = allTopics.filter(
          (topic) =>
            topic.subject.name.toLowerCase() === normalizedSubject &&
            topic.level.toLowerCase() === normalizedLevel
        );
        setTopics(filtered);
      } catch (err) {
        console.error('Error loading topics:', err);
      }
    };

    loadData();
  }, [normalizedLevel, normalizedSubject]);

  const getTopicForWeek = (week) =>
    topics.find((t) => parseInt(t.week_number) === week);

  const handleEditOrAdd = (weekOrTopic) => {
    if (typeof weekOrTopic === 'number') {
      setEditTopic(null);
      setForm({ week_number: String(weekOrTopic), title: '', file: null });
    } else {
      setEditTopic(weekOrTopic);
      setForm({
        week_number: String(weekOrTopic.week_number),
        title: weekOrTopic.title || '',
        file: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title?.trim()) return alert('Title is required');
    if (!form.week_number || isNaN(form.week_number)) return alert('Week number must be a number');

    try {
      const updatedTitle = form.title.trim();

      if (editTopic) {
        await updateTopic(editTopic.id, {
          title: updatedTitle,
          week_number: form.week_number,
        });

        if (form.file instanceof File) {
          const fileData = new FormData();
          fileData.append('file', form.file);

          const res = await fetch(`http://127.0.0.1:8000/topics/${editTopic.id}/upload-pdf`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: fileData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to upload PDF');
          }
        }
      } else {
        const formData = new FormData();
        formData.append('title', updatedTitle);
        formData.append('week_number', form.week_number);
        if (form.file) formData.append('file', form.file);

        await createTopic(normalizedLevel, normalizedSubject, formData);
      }

      const refreshedTopics = await fetchTopicsForSubject(normalizedLevel, normalizedSubject);
      const filtered = refreshedTopics.filter(
        (topic) =>
          topic.subject.name.toLowerCase() === normalizedSubject &&
          topic.level.toLowerCase() === normalizedLevel
      );

      setTopics(filtered);
      setEditTopic(null);
      setForm({ week_number: '', title: '', file: null });
    } catch (err) {
      console.error('Failed to save topic:', err);
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background text-foreground">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        📘 {level.toUpperCase()} - {subject.charAt(0).toUpperCase() + subject.slice(1)} Lesson Plan
      </h2>

      <div className="overflow-x-auto rounded-lg shadow border border-border">
        <table className="min-w-full bg-card text-card-foreground">
          <thead className="bg-muted text-muted-foreground text-sm">
            <tr>
              <th className="text-left px-4 py-3">Week</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Lesson Note</th>
              {currentUser?.is_admin && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {Array.from({ length: 13 }, (_, i) => {
              const week = i + 1;
              const topic = getTopicForWeek(week);

              return (
                <tr key={week} className="border-t border-border">
                  <td className="px-4 py-2">Week {week}</td>
                  <td className="px-4 py-2">{topic ? topic.title : '—'}</td>
                  <td className="px-4 py-2">
                    {topic?.pdf_url ? (
                      <div className="flex flex-col space-y-1">
                        <a
                          href={`http://localhost:8000/${topic.pdf_url.replace(/^\/?/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 hover:underline"
                        >
                          📖 View
                        </a>
                        <a
                          href={`http://localhost:8000/${topic.pdf_url.replace(/^\/?/, '')}`}
                          download
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline"
                        >
                          📄 Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No PDF</span>
                    )}
                  </td>
                  {currentUser?.is_admin && (
                    <td className="px-4 py-2">
                      {topic ? (
                        <button
                          onClick={() => handleEditOrAdd(topic)}
                          className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm px-3 py-1 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditOrAdd(week)}
                          className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded hover:bg-green-300 dark:hover:bg-green-700"
                        >
                          Add
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {currentUser?.is_admin && (editTopic || form.week_number) && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-card text-card-foreground p-6 rounded-xl shadow space-y-4 max-w-xl border border-border"
        >
          <h3 className="text-lg font-semibold">
            {editTopic ? 'Edit Topic' : 'Add Topic'}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1">Week Number</label>
            <input
              type="number"
              value={form.week_number}
              onChange={(e) => setForm({ ...form, week_number: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setEditTopic(null);
                setForm({ week_number: '', title: '', file: null });
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
            >
              {editTopic ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LessonPlanPage;
