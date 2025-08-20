import React, { useEffect, useState } from 'react';
import { getStudentQuizzes, checkAnswer } from '../services/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [visibleTypes, setVisibleTypes] = useState({});
  const [feedback, setFeedback] = useState({});
  const [theoryInputs, setTheoryInputs] = useState({});
  const [submittingAnswers, setSubmittingAnswers] = useState({});

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getStudentQuizzes();
        setQuizzes(data || {});
      } catch (error) {
        console.error('❌ Failed to load quizzes:', error);
        setQuizzes({});
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const toggleView = (subject, type) => {
    setVisibleTypes(prev => ({
      ...prev,
      [subject]: prev[subject] === type ? null : type,
    }));
  };

  const handleObjectiveAnswer = async (questionId, selectedOption) => {
    if (feedback[questionId] || submittingAnswers[questionId]) return;
    setSubmittingAnswers(prev => ({ ...prev, [questionId]: true }));

    try {
      const res = await checkAnswer({ question_id: questionId, answer: selectedOption });
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          status: res.is_correct ? 'correct' : 'wrong',
          selected: selectedOption,
          correct: res.correct_answer,
        },
      }));
    } catch (err) {
      console.error('❌ Error checking answer:', err);
    } finally {
      setSubmittingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleTheoryInputChange = (questionId, text) => {
    setTheoryInputs(prev => ({ ...prev, [questionId]: text }));
  };

  const handleTheorySubmit = async questionId => {
    const answer = theoryInputs[questionId] || '';
    if (!answer.trim()) return;
    setSubmittingAnswers(prev => ({ ...prev, [questionId]: true }));

    try {
      const res = await checkAnswer({ question_id: questionId, answer });
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          status: res.is_correct ? 'correct' : 'wrong',
          correct: res.correct_answer,
        },
      }));
    } catch (err) {
      console.error('❌ Error checking theory answer:', err);
    } finally {
      setSubmittingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) return <div className="p-6 text-foreground">⏳ Loading quizzes...</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-background text-foreground">
      <h2 className="text-3xl font-bold mb-6 text-primary">🧠 Instant Quiz</h2>

      {Object.keys(quizzes).length === 0 ? (
        <div className="bg-card text-card-foreground shadow rounded-md p-6 text-center border border-border">
          No quizzes available for your subjects yet.
        </div>
      ) : (
        Object.entries(quizzes)
          .filter(([subject]) => !["opening prayer", "closing prayer"].includes(subject))
          .map(([subject, { theory = [], objective = [] }]) => (
            <div
              key={subject}
              className="mb-10 bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden border border-border"
            >
              <div className="bg-muted/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold text-primary">{subject}</h3>
                <div className="flex gap-2">
                  {theory.length > 0 && (
                    <Button
                      variant={visibleTypes[subject] === 'theory' ? 'default' : 'outline'}
                      onClick={() => toggleView(subject, 'theory')}
                    >
                      ✍️ Theory ({theory.length})
                    </Button>
                  )}
                  {objective.length > 0 && (
                    <Button
                      variant={visibleTypes[subject] === 'objective' ? 'default' : 'outline'}
                      onClick={() => toggleView(subject, 'objective')}
                    >
                      🧪 Objective ({objective.length})
                    </Button>
                  )}
                </div>
              </div>

            <div className="p-6 space-y-6">
              {(visibleTypes[subject] ? (visibleTypes[subject] === 'theory' ? theory : objective) : []).map((q) => (
                <div key={q.id} className="border-l-4 border-primary bg-muted/30 p-5 rounded-md shadow border border-border">
                  <p className="font-semibold mb-3">{q.question}</p>

                  {visibleTypes[subject] === 'theory' ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your answer here..."
                        value={theoryInputs[q.id] || ''}
                        onChange={(e) => handleTheoryInputChange(q.id, e.target.value)}
                        disabled={!!feedback[q.id]?.status}
                        className="min-h-[120px]"
                      />
                      <Button
                        onClick={() => handleTheorySubmit(q.id)}
                        disabled={
                          !theoryInputs[q.id]?.trim() ||
                          feedback[q.id]?.status ||
                          submittingAnswers[q.id]
                        }
                        size="sm"
                      >
                        {submittingAnswers[q.id] ? 'Checking...' : 'Submit Answer'}
                      </Button>

                      {feedback[q.id]?.status === 'correct' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-green-800 font-medium">✅ Correct! Well done!</p>
                        </div>
                      )}

                      {feedback[q.id]?.status === 'wrong' && (
                        <>
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 font-medium">❌ Incorrect.</p>
                          </div>
                          {feedback[q.id].correct && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-yellow-800 font-medium">📘 Correct Answer:</p>
                              <p className="text-yellow-900">{feedback[q.id].correct}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(q.options || {}).map(([key, val]) => {
                        const fb = feedback[q.id];
                        const isAnswered = fb?.selected !== undefined;
                        const isSelected = isAnswered && fb?.selected === key;
                        const isCorrect = fb?.status === 'correct' && isSelected;
                        const isWrong = fb?.status === 'wrong' && isSelected;
                        const isCorrectAnswer = fb?.correct === key && fb?.status === 'wrong';

                        let baseClasses = 'w-full text-left px-4 py-3 rounded-md border border-border';
                        let feedbackClass = 'hover:bg-muted/50';
                        if (isCorrect) feedbackClass = 'bg-green-100 border-green-400 text-green-800';
                        else if (isWrong) feedbackClass = 'bg-red-100 border-red-400 text-red-800';
                        else if (isCorrectAnswer) feedbackClass = 'bg-green-50 border-green-300 text-green-800';

                        return (
                          <button
                            key={key}
                            onClick={() => handleObjectiveAnswer(q.id, key)}
                            disabled={isAnswered || submittingAnswers[q.id]}
                            className={`${baseClasses} ${feedbackClass}`}
                          >
                            <div className="flex justify-between items-center">
                              <span>
                                <strong>{key.toUpperCase()}:</strong> {val}
                              </span>
                              {isCorrect && <span>✅</span>}
                              {isWrong && <span>❌</span>}
                              {isCorrectAnswer && !isSelected && <span>✅ Correct</span>}
                            </div>
                          </button>
                        );
                      })}

                      {feedback[q.id]?.status === 'wrong' && feedback[q.id].correct && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-yellow-800 font-medium">📘 Correct Answer:</p>
                          <p className="text-yellow-900">
                            {`${feedback[q.id].correct.toUpperCase()}: ${
                              q.options[feedback[q.id].correct]
                            }`}
                          </p>
                        </div>
                      )}

                      {feedback[q.id]?.status === 'correct' && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-green-800 font-medium">✅ Correct! Well done!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default QuizzesPage;
