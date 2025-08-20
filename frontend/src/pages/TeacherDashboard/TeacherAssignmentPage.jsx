import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../services/config";
import { toast } from "../../hooks/use-toast";
import {
  fetchTeacherAssignments,
  deleteAssignment,
  getTeacherSubjectsByLevel,
} from "../../services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { FaEdit, FaTrash } from "react-icons/fa";

const LEVEL_OPTIONS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

const TeacherAssignmentPage = () => {
  // State for assignments list
  const [assignments, setAssignments] = useState([]);

  // Subjects for selected class level
  const [subjects, setSubjects] = useState([]);

  // Form data state for creating/editing assignments
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    class_level: "",
    due_date: "",
    description: "",
  });

  // Questions for the form (new assignment or editing)
  const [theoryQuestions, setTheoryQuestions] = useState([]);
  const [objectiveQuestions, setObjectiveQuestions] = useState([]);

  // Loading and saving state
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  // Assignment ID currently being edited (null = new)
  const [editingId, setEditingId] = useState(null);

  // New: Track which assignments are expanded to show questions
  const [expandedAssignments, setExpandedAssignments] = useState(new Set());

  // Fetch assignments when component mounts
  useEffect(() => {
    fetchAllAssignments();
  }, []);

  const fetchAllAssignments = async () => {
    try {
      const data = await fetchTeacherAssignments();
      setAssignments(data);
    } catch {
      toast.error("Failed to load assignments");
    }
  };

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle change in class level: fetch subjects for that level
  const handleLevelChange = async (e) => {
    const class_level = e.target.value;
    setFormData((prev) => ({ ...prev, class_level, subject_id: "" }));
    try {
      const data = await getTeacherSubjectsByLevel(class_level);
      setSubjects(data);
    } catch {
      toast.error("Unable to fetch subjects for selected class");
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: "",
      subject_id: "",
      class_level: "",
      due_date: "",
      description: "",
    });
    setTheoryQuestions([]);
    setObjectiveQuestions([]);
    setEditingId(null);
    setSubjects([]);
  };

  // Submit handler for create/update assignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, class_level, subject_id, due_date } = formData;

    if (!title || !class_level || !subject_id || !due_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Format questions to match API schema
    const formattedTheory = theoryQuestions.map((q) => ({
      question_text: q.question_text,
      model_answer: q.model_answer,
    }));

    const formattedObjective = objectiveQuestions.map((q) => ({
      question_text: q.question_text,
      option1: q.options[0],
      option2: q.options[1],
      option3: q.options[2],
      option4: q.options[3],
      correct_option: q.correct_option,
    }));

    const payload = {
      ...formData,
      subject_id: parseInt(subject_id),
      due_date: new Date(due_date).toISOString(),
      theory_questions: formattedTheory,
      objective_questions: formattedObjective,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`${BASE_URL}/assignments/${editingId}`, payload, config);
        toast.success("Assignment updated");
      } else {
        await axios.post(`${BASE_URL}/assignments/`, payload, config);
        toast.success("Assignment created");
      }

      resetForm();
      fetchAllAssignments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Error saving assignment");
    } finally {
      setLoading(false);
    }
  };

  // === THEORY QUESTIONS form helpers ===
  const addTheoryQuestion = () =>
    setTheoryQuestions([...theoryQuestions, { question_text: "", model_answer: "" }]);

  const updateTheoryQuestion = (index, field, value) => {
    const updated = [...theoryQuestions];
    updated[index][field] = value;
    setTheoryQuestions(updated);
  };

  const removeTheoryQuestion = (index) =>
    setTheoryQuestions(theoryQuestions.filter((_, i) => i !== index));

  // === OBJECTIVE QUESTIONS form helpers ===
  const addObjectiveQuestion = () =>
    setObjectiveQuestions([
      ...objectiveQuestions,
      {
        question_text: "",
        options: ["", "", "", ""],
        correct_option: "",
      },
    ]);

  const updateObjectiveQuestion = (index, field, value) => {
    const updated = [...objectiveQuestions];
    updated[index][field] = value;
    setObjectiveQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...objectiveQuestions];
    updated[qIndex].options[optIndex] = value;
    setObjectiveQuestions(updated);
  };

  const removeObjectiveQuestion = (index) =>
    setObjectiveQuestions(objectiveQuestions.filter((_, i) => i !== index));

  // Edit an existing assignment - populate form and questions
  const handleEdit = (assignment) => {
    setFormData({
      title: assignment.title,
      subject_id: assignment.subject?.id?.toString() || "",
      class_level: assignment.class_level,
      due_date: assignment.due_date.slice(0, 10),
      description: assignment.description || "",
    });

    setTheoryQuestions(
      (assignment.theory_questions || []).map((q) => ({
        question_text: q.question_text || q.question, // fallback
        model_answer: q.model_answer,
      }))
    );

    setObjectiveQuestions(
      (assignment.objective_questions || []).map((q) => ({
        question_text: q.question_text || q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
        correct_option: q.correct_option,
      }))
    );

    setEditingId(assignment.id);
  };

  // Delete assignment handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      setSavingId(id);
      await deleteAssignment(id);
      toast.success("Assignment deleted");
      fetchAllAssignments();
    } catch {
      toast.error("Error deleting assignment");
    } finally {
      setSavingId(null);
    }
  };

  // Toggle show/hide questions for an assignment
  const toggleQuestions = (assignmentId) => {
    setExpandedAssignments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  return (
    <Card className="max-w-5xl mx-auto mt-6">
      {/* Form header */}
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {editingId ? "✏️ Edit Assignment" : "📝 Create Assignment"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create/Edit Assignment Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>

          {/* Class Level */}
          <div>
            <Label htmlFor="class_level">Class</Label>
            <select
              id="class_level"
              name="class_level"
              value={formData.class_level}
              onChange={handleLevelChange}
              className="w-full px-3 py-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="">Select Class</option>
              <option value="jss1">LFC</option>
              <option value="jss2">LDC</option>
              <option value="jss3">JSS3</option>
              <option value="ss1">SS1</option>
              <option value="ss2">SS2</option>
              <option value="ss3">SS3</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject_id">Subject</Label>
            <select
              id="subject_id"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-gray-300"
              disabled={!subjects.length}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>{subj.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due_date">Deadline</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <Label htmlFor="description">Instructions</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional instructions"
            />
          </div>

          {/* Theory Questions */}
          <div className="sm:col-span-2">
            <h3 className="font-bold text-md mb-2">Theory Questions</h3>
            {theoryQuestions.map((q, index) => (
              <div key={index} className="border p-3 mb-3 rounded space-y-2">
                <Textarea
                  placeholder="Question text"
                  value={q.question_text}
                  onChange={(e) => updateTheoryQuestion(index, "question_text", e.target.value)}
                />
                <Textarea
                  placeholder="Model answer"
                  value={q.model_answer}
                  onChange={(e) => updateTheoryQuestion(index, "model_answer", e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => removeTheoryQuestion(index)}>
                  Remove Theory Question
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addTheoryQuestion}>+ Add Theory Question</Button>
          </div>

          {/* Objective Questions */}
          <div className="sm:col-span-2">
            <h3 className="font-bold text-md mb-2">Objective Questions</h3>
            {objectiveQuestions.map((q, index) => (
              <div key={index} className="border p-3 mb-3 rounded space-y-2">
                <Input
                  placeholder="Question text"
                  value={q.question_text}
                  onChange={(e) => updateObjectiveQuestion(index, "question_text", e.target.value)}
                />
                {q.options.map((opt, i) => (
                  <Input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(index, i, e.target.value)}
                  />
                ))}
                <select
                  value={q.correct_option}
                  onChange={(e) => updateObjectiveQuestion(index, "correct_option", e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white text-black dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="">Select Correct Option</option>
                  {["option1", "option2", "option3", "option4"].map((key, i) => (
                    <option key={key} value={key}>{`Option ${i + 1}`}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" onClick={() => removeObjectiveQuestion(index)}>
                  Remove Objective Question
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addObjectiveQuestion}>+ Add Objective Question</Button>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancel Edit</Button>
            )}
          </div>
        </form>

        {/* Assignment List */}
        {assignments.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6">Your Assignments</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <React.Fragment key={assignment.id}>
                    {/* Assignment info row */}
                    <TableRow>
                      <TableCell>{assignment.title}</TableCell>
                      <TableCell>{assignment.subject?.name || "—"}</TableCell>
                      <TableCell>{assignment.class_level}</TableCell>
                      <TableCell>{new Date(assignment.due_date).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-3 items-center">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(assignment)}>
                          <FaEdit className="text-blue-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={savingId === assignment.id}
                        >
                          <FaTrash className="text-red-500" />
                        </Button>

                        {/* Show/Hide questions toggle */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleQuestions(assignment.id)}
                        >
                          {expandedAssignments.has(assignment.id) ? "Hide Questions" : "Show Questions"}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded questions display row */}
                    {expandedAssignments.has(assignment.id) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-800 p-4">
                          {/* Theory Questions */}
                          {assignment.theory_questions?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Theory Questions</h4>
                              <ul className="list-decimal list-inside space-y-1">
                                {assignment.theory_questions.map((q) => (
                                  <li key={q.id}>
                                    <p><strong>Q:</strong> {q.question_text}</p>
                                    <p><em>Model Answer:</em> {q.model_answer}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Objective Questions */}
                          {assignment.objective_questions?.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Objective Questions</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {assignment.objective_questions.map((q) => (
                                  <li key={q.id}>
                                    <p><strong>Q:</strong> {q.question_text}</p>
                                    <ul className="list-inside pl-4">
                                      <li>A. {q.option1}</li>
                                      <li>B. {q.option2}</li>
                                      <li>C. {q.option3}</li>
                                      <li>D. {q.option4}</li>
                                      <li><em>Correct Option:</em> {q.correct_option.replace("option", "Option ")}</li>
                                    </ul>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {!assignment.theory_questions?.length && !assignment.objective_questions?.length && (
                            <p>No questions available for this assignment.</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherAssignmentPage;
