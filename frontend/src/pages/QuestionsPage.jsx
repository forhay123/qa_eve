
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuestions, getQuestionsByPdfId } from '../services/api';
import Spinner from '../components/Spinner';

const QuestionsPage = () => {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const existing = await getQuestionsByPdfId(pdfId);
      setQuestions(Array.isArray(existing) ? existing : []);
    } catch (err) {
      setError('Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const generated = await generateQuestions(pdfId, 8);
      setQuestions(generated);
      setError("");
    } catch (err) {
      setError('Failed to generate questions.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [pdfId]);

  if (loading || generating) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner message={loading ? 'Loading questions...' : 'Generating questions...'} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">Generated Questions</h1>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {questions.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">No questions generated for this lesson yet.</p>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      ) : (
        <>
          <p className="mb-4">
            Total Questions: <strong>{questions.length}</strong>
          </p>

          <ul className="space-y-4">
            {questions.map((q, idx) => (
              <li key={q.id} className="p-4 bg-muted rounded shadow-sm">
                <span className="font-medium">Q{idx + 1}:</span> {q.question}
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <button
              onClick={() => navigate(`/answer/${pdfId}`)}
              className="px-5 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Answer Questions
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionsPage;
