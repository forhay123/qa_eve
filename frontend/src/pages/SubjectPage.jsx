import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SubmitQuiz from '../components/SubmitQuiz';
import { fetchTopicsForSubject } from '../services/api';

// This component displays a list of topics for a specific subject and level,
// with a consistent red/wine theme for both light and dark modes.

const SubjectPage = () => {
  // Extract subject and level from URL parameters
  const { subject, level } = useParams();

  // State for topics, loading status, errors, and the active quiz
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTopicId, setActiveTopicId] = useState(null);

  // The base URL for the backend is needed to construct full PDF URLs
  const backendBaseURL = `${window.location.protocol}//${window.location.hostname}:8000`;

  // useEffect hook to fetch topics when subject or level changes
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        const data = await fetchTopicsForSubject(level.toLowerCase(), subject.toLowerCase());
        setTopics(data);
      } catch (err) {
        console.error("❌ Error fetching topics:", err);
        setError("Failed to load topics.");
      } finally {
        setLoading(false);
      }
    };
    loadTopics();
  }, [subject, level]);

  // Toggle the visibility of the quiz component
  const toggleQuiz = (id) => {
    setActiveTopicId(activeTopicId === id ? null : id);
  };

  // Open a PDF in a new window
  const openPdf = (pdfUrl) => {
    if (!pdfUrl) {
      console.log('PDF not available');
      return;
    }
    const fullUrl = pdfUrl.startsWith("http") ? pdfUrl : `${backendBaseURL}${pdfUrl}`;
    window.open(fullUrl, '_blank');
  };

  // Format subject and level for display
  let formattedSubject;
  if (subject.toLowerCase() === "lfc") {
    formattedSubject = "LOGIC Foundation Class";
  } else if (subject.toLowerCase() === "ldc") {
    formattedSubject = "LOGIC Disciple Class";
  } else {
    formattedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
  }

  const levelLabel = level === 'jss' ? 'Junior Secondary' : 'Senior Secondary';

  return (
    // Main container with themed background and text colors
    <div className="p-6 bg-stone-50 dark:bg-stone-950 min-h-screen text-stone-900 dark:text-stone-100">
      <h1 className="text-3xl font-bold mb-2 text-rose-700 dark:text-rose-500">
        {formattedSubject}
      </h1>
      <p className="mb-4 text-stone-700 dark:text-stone-300">
        Browse the compiled list of learning topics for <strong>{formattedSubject}</strong>.
      </p>


      <h2 className="text-xl font-semibold mb-4 text-rose-600 dark:text-rose-400">Lectures</h2>

      {loading ? (
        <p className="text-rose-600 dark:text-rose-400">Loading topics...</p>
      ) : error ? (
        <p className="text-rose-600 dark:text-rose-400">{error}</p>
      ) : topics.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">No topics available yet.</p>
      ) : (
        <ul className="space-y-6">
          {topics.map((topic) => (
            <li key={topic.id}
              // Themed card for each topic with subtle shadow
              className="p-4 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg shadow-xl"
            >
              <strong className="block text-lg font-semibold mb-2">
                Lecture {topic.week_number}: {topic.title}
              </strong>

              <div className="flex flex-wrap gap-3 mb-3">
                <button
                  onClick={() => openPdf(topic.pdf_url)}
                  // Themed button for viewing lesson
                  className="bg-rose-700 text-white px-4 py-2 rounded hover:bg-rose-800 transition"
                >
                  📖 View Lesson
                </button>
                <button
                  onClick={() => openPdf(topic.pdf_url)}
                  disabled={!topic.pdf_url}
                  // Themed button for downloading notes, using a complementary amber color
                  className={`px-4 py-2 rounded transition ${
                    topic.pdf_url
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-400 cursor-not-allowed'
                  }`}
                >
                  📄 Download Notes
                </button>
                <button
                  onClick={() => toggleQuiz(topic.id)}
                  // Themed button for the quiz, using a dark stone color for contrast
                  className="bg-stone-600 text-white px-4 py-2 rounded hover:bg-stone-700 transition"
                >
                  📝 {activeTopicId === topic.id ? 'Hide Quiz' : 'Take Quiz'}
                </button>
              </div>

              {activeTopicId === topic.id && (
                <div className="border-t border-stone-300 dark:border-stone-700 pt-4 mt-4">
                  <SubmitQuiz topicId={topic.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubjectPage;
