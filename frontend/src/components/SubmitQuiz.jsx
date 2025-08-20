import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

// This component displays a quiz for a given topic and handles submission of answers.
// It features a red/wine theme with full support for light and dark modes.
// Tailwind CSS is used for all styling.

const SubmitQuiz = ({ topicId: propTopicId }) => {
  // Use a fallback for topicId from either props or URL params
  const { topicId: paramTopicId } = useParams();
  const topicId = propTopicId || paramTopicId;

  const navigate = useNavigate();

  // State to manage quiz data, loading, errors, and user answers
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizType, setQuizType] = useState("theory");

  // Retrieve authentication token from localStorage
  const token = localStorage.getItem("token");

  // useEffect hook to fetch questions whenever the topicId or quizType changes
  useEffect(() => {
    // Validate that a topic ID and token are available
    if (!topicId) {
      setError("Invalid topic ID");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/topics/${topicId}/questions?qtype=${quizType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Sort questions by ID to ensure a consistent order
        const sorted = res.data.sort((a, b) => a.id - b.id);
        setQuestions(sorted);
        setAnswers({}); // Reset answers when a new quiz type is selected
        setError(null);
      } catch (err) {
        console.error("Failed to load questions:", err);
        setError("Failed to load questions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [topicId, quizType, token]);

  // Handler for updating user answers in state
  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handler for submitting the quiz answers to the backend
  const handleSubmit = async () => {
    if (!token) {
      // Use a modal or message box instead of alert() for a better user experience
      // This is a placeholder for now.
      console.log("You must be logged in to submit answers.");
      return;
    }

    // Construct the payload for the API call
    const payload = {
      topic_id: parseInt(topicId),
      is_objective: quizType === "objective",
      answers: Object.entries(answers).map(([qid, answer]) => ({
        question_id: parseInt(qid),
        answer,
      })),
    };

    // Prevent submission if no questions have been answered
    if (payload.answers.length === 0) {
      console.log("Please answer at least one question before submitting.");
      return;
    }

    try {
      // Send the answers to the backend
      const res = await axios.post("/answers/submit-answers/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Navigate to the results page with the submission data
      navigate("/results", {
        state: {
          results: res.data,
          questions,
          userAnswers: answers,
        },
      });
    } catch (err) {
      console.error("Submission failed:", err.response?.data || err.message);
      // Display a user-friendly error message
      console.log("There was an error submitting your answers. Please try again.");
    }
  };

  return (
    // Main container with a dark/light theme background and shadow
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-xl rounded-xl">
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">
          Select Quiz Type:
        </label>
        <select
          value={quizType}
          onChange={(e) => setQuizType(e.target.value)}
          // Styling for the select input, using the wine theme for focus rings
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="theory">📝 Theory Questions</option>
          <option value="objective">✔ Multiple Choice</option>
        </select>
      </div>

      <h2 className="text-3xl font-bold text-center mb-8 text-rose-700 dark:text-rose-500">
        {quizType === "theory" ? "Theory Quiz" : "Objective Quiz"}
      </h2>

      {loading ? (
        <div className="text-center text-stone-500 dark:text-stone-400 animate-pulse">
          Loading questions...
        </div>
      ) : error ? (
        <div className="text-center text-red-600 font-medium">{error}</div>
      ) : questions.length === 0 ? (
        <div className="text-center text-stone-500 italic">
          No questions available for this topic.
        </div>
      ) : (
        questions.map((q, idx) => (
          <div
            key={q.id}
            // Card styling for each question, with themed borders and backgrounds
            className="mb-6 p-5 border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-lg"
          >
            <p className="text-lg font-semibold mb-3">
              <span className="text-rose-700 dark:text-rose-500">{idx + 1}.</span> {q.question}
            </p>

            {quizType === "theory" ? (
              <textarea
                rows={3}
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Type your answer here..."
                // Styling for the textarea, with the wine-colored focus ring
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-stone-100 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            ) : (
              <div className="space-y-2">
                {["a", "b", "c", "d"].map((key) => {
                  const option = q[`option_${key}`];
                  if (!option?.trim()) return null;
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={key}
                        checked={answers[q.id] === key}
                        onChange={() => handleChange(q.id, key)}
                        // Radio button styling with the wine focus color
                        className="w-4 h-4 text-rose-600 focus:ring-rose-500 focus:ring-2"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}

      {!loading && questions.length > 0 && (
        <div className="text-center mt-10">
          <button
            onClick={handleSubmit}
            // Themed submit button with hover effect
            className="px-8 py-3 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmitQuiz;
