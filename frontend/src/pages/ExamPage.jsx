import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { fetchWithAuth, submitExamAnswers } from "../services/api";

const ExamPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const level = auth?.level;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [percentage, setPercentage] = useState(null);
  const [total, setTotal] = useState(null);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);

  // Load questions or block if already taken
  useEffect(() => {
    const loadExam = async () => {
      try {
        const status = await fetchWithAuth(`/answers/check-submission?subject=${subject}&test_type=exam`);
        if (status.already_taken) {
          setAlreadyTaken(true);
          return;
        }

        const data = await fetchWithAuth(`/tests/exams/${level}/${subject}`);
        setQuestions(data);
      } catch (err) {
        console.error("Failed to load exam questions:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (level && subject) {
      loadExam();
    }
  }, [level, subject]);

  // Timer countdown
  useEffect(() => {
    if (!timerStarted || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerExpired(true);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted, submitted]);

  // Auto-submit if user leaves page
  useEffect(() => {
    const handleUnload = (e) => {
      if (timerStarted && !submitted) {
        e.preventDefault();
        e.returnValue = "";
        handleSubmit();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [timerStarted, submitted]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    try {
      const preparedAnswers = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id],
        }));

      const payload = {
        subject,
        level,
        test_type: "exam",
        answers: preparedAnswers,
      };

      const result = await submitExamAnswers(payload);
      setScore(result.score);
      setPercentage(result.percentage);
      setTotal(result.total);
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed: " + (err.message || "An error occurred"));
    }
  };

  // -------------------- UI RENDER --------------------

  if (loading) {
    return <p className="text-center py-10 text-foreground">Loading exam...</p>;
  }

  if (alreadyTaken) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-2">Final Exam - {subject.toUpperCase()}</h2>
        <p className="text-destructive font-semibold">❌ You have already taken this exam. Retaking is not allowed.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return <p className="text-center py-10 text-foreground">No exam questions found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-background text-foreground">
      <h2 className="text-3xl font-bold mb-6">Final Exam - {subject.toUpperCase()}</h2>

      {!timerStarted && !submitted && (
        <div className="text-center">
          <button
            onClick={() => setTimerStarted(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            🚀 Start Exam
          </button>
        </div>
      )}

      {timerStarted && !submitted && (
        <>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-md mb-6 w-fit font-semibold">
            ⏳ Time Remaining: {formatTime(timeLeft)}
          </div>

          <form className="space-y-6">
            {questions.map((q) => (
              <div key={q.id} className="p-4 border border-border rounded-md shadow-sm bg-card text-card-foreground">
                <p className="font-medium mb-2">Q: {q.question}</p>

                {q.options
                  ? Object.entries(q.options).map(([key, text]) => (
                      <div key={key} className="flex items-center space-x-2 mb-1">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={key}
                          checked={answers[q.id] === key}
                          onChange={() => handleChange(q.id, key)}
                          className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                        />
                        <label className="text-sm">{`${key.toUpperCase()}. ${text}`}</label>
                      </div>
                    ))
                  : ["a", "b", "c", "d"].map((opt) => {
                      const text = q[`option_${opt}`];
                      return text ? (
                        <div key={opt} className="flex items-center space-x-2 mb-1">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => handleChange(q.id, opt)}
                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                          />
                          <label className="text-sm">{`${opt.toUpperCase()}. ${text}`}</label>
                        </div>
                      ) : null;
                    })}

                {!q.options && !q.option_a && (
                  <textarea
                    rows="3"
                    placeholder="Write your answer..."
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full mt-2 border border-border rounded px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>
            ))}
          </form>

          <div className="text-right mt-6">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </>
      )}

      {submitted && (
        <div className="mt-10 bg-card text-card-foreground border border-border rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">✅ Exam submitted</h3>
          <p>Your Score: {score} / {total}</p>
          <p>Percentage: {percentage}%</p>
          {timerExpired && <p className="text-destructive mt-2">⏰ Time expired — exam was auto-submitted.</p>}
        </div>
      )}
    </div>
  );
};

export default ExamPage;
