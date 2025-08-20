import React, { useEffect, useState } from "react";
import { askAnything, getStudentQuizzes } from "../services/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const AskMeAnythingPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getStudentQuizzes();
        const subjectList = Object.keys(data || {});
        setSubjects(subjectList);
        if (subjectList.length > 0) {
          setSelectedSubject(subjectList[0]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch subjects:", err);
        setError("Failed to load your subjects.");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleAsk = async () => {
    if (!selectedSubject || !question.trim()) return;
    setLoadingAnswer(true);
    setAnswer(null);
    setExplanation(null);
    setError(null);

    try {
      const res = await askAnything(selectedSubject, question.trim());
      if (typeof res.answer === "string") {
        const [ans, ...rest] = res.answer.split("Explanation:");
        setAnswer(ans.trim());
        if (rest.length > 0) {
          setExplanation(rest.join("Explanation:").trim());
        }
      } else {
        setAnswer("No answer found.");
      }
    } catch (err) {
      console.error("❌ Error asking question:", err);
      setError("Could not get an answer. Please try again.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  if (loadingSubjects) {
    return <div className="p-6 text-black dark:text-white">⏳ Loading your subjects...</div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="p-6 text-black dark:text-white">
        <p>No subjects found for your account.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-red-700 dark:text-red-500">❓ Ask Me Anything</h2>

      <Card className="border border-black/10 dark:border-white/10 shadow-lg bg-white dark:bg-[#1a1a1a] rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Choose a subject and ask your question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          
          {/* Subject Selector */}
          <div>
            <label className="block mb-2 font-medium text-black dark:text-white">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Question Input */}
          <div>
            <label className="block mb-2 font-medium text-black dark:text-white">Your Question</label>
            <Textarea
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Ask Button */}
          <Button
            onClick={handleAsk}
            disabled={loadingAnswer || !question.trim()}
            className="w-full rounded-lg bg-red-700 hover:bg-red-800 text-white dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
          >
            {loadingAnswer ? "Thinking..." : "Ask"}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Answer Display */}
          {answer && !loadingAnswer && (
            <div className="p-4 rounded-lg bg-white dark:bg-black border border-black/20 dark:border-white/20 space-y-4">
              <div>
                <h4 className="font-semibold mb-1 text-red-700 dark:text-red-500">Answer:</h4>
                <p>{answer}</p>
              </div>
              {explanation && (
                <div>
                  <h4 className="font-semibold mb-1 text-red-700 dark:text-red-500">Reason:</h4>
                  <p>{explanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AskMeAnythingPage;
