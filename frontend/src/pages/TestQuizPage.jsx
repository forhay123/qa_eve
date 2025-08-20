import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTestQuestions, submitTestAnswers, checkTestSubmission } from '../services/api';

const TestQuizPage = () => {
  const { subject, testType } = useParams();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [timerExpired, setTimerExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const isFirstTest = testType === 'first';

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const level = user?.level;
        if (!subject || !testType || !level) {
          console.error('Missing subject, testType, or user level');
          return;
        }

        // ✅ Check if already submitted
        const check = await checkTestSubmission({
          subject,
          test_type: testType,
        });

        if (check.already_taken) {
          alert(`You have already submitted this ${testType} test for ${subject.toUpperCase()}.`);
          setSubmitted(true);
          setLoading(false);
          return;
        }

        // ✅ Fetch test questions
        const data = await fetchTestQuestions({
          subject,
          level,
          test_type: testType,
        });

        setQuestions(data);
      } catch (error) {
        console.error('Failed to load test questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [subject, testType]);

  useEffect(() => {
    if (timerStarted && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerExpired(true);
            handleSubmit(); // Auto-submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerStarted, submitted]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
  };

  const handleChange = (id, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const level = user?.level;
      if (!level) {
        console.error('Missing user level for submission');
        return;
      }

      const transformedAnswers = questions.map((q) => {
        const answer = answers[q.id];
        return {
          question_id: q.id,
          selected_option: q.option_a ? (answer || '').trim() : undefined,
          user_answer: !q.option_a ? (answer || '').trim() : undefined,
        };
      });

      const filteredAnswers = transformedAnswers.filter(
        (ans) =>
          (ans.selected_option !== undefined && ans.selected_option !== '') ||
          (ans.user_answer !== undefined && ans.user_answer !== '')
      );

      if (filteredAnswers.length === 0) {
        alert('Please answer at least one question before submitting.');
        return;
      }

      const result = await submitTestAnswers({
        subject,
        level,
        test_type: testType,
        answers: filteredAnswers,
      });

      setScore(result.score);
      setPercentage(result.percentage);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit test answers:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-lg text-gray-600">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6">
        {isFirstTest ? 'First' : 'Second'} Test – {subject?.toUpperCase()}
      </h1>

      {submitted && (
        <div className="mt-10 text-center bg-green-50 border border-green-200 rounded-lg p-6 shadow">
          <h2 className="text-2xl font-semibold text-green-700 mb-2">✅ Test Already Submitted</h2>
          <p className="text-gray-800 text-lg">You’ve already completed this test.</p>
        </div>
      )}

      {!submitted && !timerStarted && (
        <div className="flex justify-center">
          <button
            onClick={() => setTimerStarted(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-lg transition duration-300"
          >
            🚀 Start Test
          </button>
        </div>
      )}

      {timerStarted && !submitted && (
        <>
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-center font-medium px-4 py-3 rounded mb-6">
            ⏳ Time Remaining: <span className="font-semibold">{formatTime(timeLeft)}</span>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="mb-8 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <p className="text-lg font-semibold text-gray-800 mb-4">
                {idx + 1}. {q.question}
              </p>

              {q.option_a ? (
                <div className="space-y-3">
                  {['a', 'b', 'c', 'd'].map((opt) =>
                    q[`option_${opt}`] ? (
                      <label key={opt} className="block text-gray-700">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleChange(q.id, opt)}
                          className="mr-2"
                        />
                        {opt.toUpperCase()}. {q[`option_${opt}`]}
                      </label>
                    ) : null
                  )}
                </div>
              ) : (
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring focus:ring-blue-200"
                  placeholder="Write your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="text-center mt-8">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-lg transition duration-300"
            >
              ✅ Submit Test
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TestQuizPage;
