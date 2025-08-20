
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateQuestions, submitAnswer } from '../services/api';
import Spinner from '../components/Spinner';
import ResponsiveLayout from '../layouts/ResponsiveLayout';

const AnswerPage = () => {
  const { pdfId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionDone, setSubmissionDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await generateQuestions(pdfId);
        if (Array.isArray(data)) setQuestions(data);
      } catch (err) {
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [pdfId]);

  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const resultsObj = {};

    for (const q of questions) {
      const userAnswer = answers[q.id] || '';
      try {
        const res = await submitAnswer({
          user_id: 'test-user',
          question_id: q.id,
          answer: userAnswer,
        });
        resultsObj[q.id] = {
          ...res,
          user_answer: userAnswer,
          correct_answer: res.is_correct ? userAnswer : q.answer,
        };
      } catch (err) {
        console.error(`Error submitting answer for question ${q.id}:`, err);
      }
    }

    setResults(resultsObj);
    setIsSubmitting(false);
    setSubmissionDone(true);
  };

  return (
    <ResponsiveLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-background text-foreground">
        <h1 className="text-2xl font-bold mb-6 text-center">📝 Answer the Questions</h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner message="Loading questions..." />
          </div>
        ) : (
          <>
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-card text-card-foreground shadow-md rounded-lg p-4 mb-6 border border-border"
              >
                <p className="mb-2 font-medium">Q: {q.question}</p>
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {results[q.id] && (
                  <div className="mt-3 bg-muted p-3 rounded text-sm">
                    <p><strong>Your Answer:</strong> {results[q.id].user_answer}</p>
                    <p><strong>Correct Answer:</strong> {results[q.id].correct_answer}</p>
                    <p className={results[q.id].is_correct ? 'text-green-600' : 'text-red-500'}>
                      <strong>Status:</strong> {results[q.id].is_correct ? '✅ Correct' : '❌ Incorrect'}
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || questions.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit All Answers'}
              </button>
            </div>

            {isSubmitting && (
              <div className="mt-4 flex justify-center">
                <Spinner message="Submitting answers..." />
              </div>
            )}

            {submissionDone && (
              <p className="mt-6 text-green-600 font-semibold text-center">
                ✅ All answers submitted successfully.
              </p>
            )}
          </>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default AnswerPage;