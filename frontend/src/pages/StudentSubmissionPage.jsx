
import { useEffect, useState } from "react";
import {
  fetchMyAssignments,
  fetchMySubmissions,
  submitAssignment,
} from "../services/api";
import { toast } from "../hooks/use-toast";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { BookOpen, Calendar,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  GraduationCap
} from "lucide-react";

function StudentSubmissionPage() {
  const [assignments, setAssignments] = useState([]);
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [overdueAssignments, setOverdueAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [expandedCorrections, setExpandedCorrections] = useState({});

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await fetchMyAssignments();
      const submitted = await fetchMySubmissions();

      const enriched = data.map((a) => ({
        ...a,
        submissionText: "",
        theoryAnswers: {},
        objectiveAnswers: {},
      }));

      const now = new Date();

      // Create a quick lookup set for submitted assignment IDs
      const submittedAssignmentIds = new Set(submitted.map((s) => s.assignment_id));

      const pending = [];
      const overdue = [];

      enriched.forEach((a) => {
        const isSubmitted = submittedAssignmentIds.has(a.id);
        const dueDate = new Date(a.due_date);

        if (isSubmitted) {
          // Skip both pending and overdue if it's already submitted
          return;
        }

        if (dueDate < now) {
          overdue.push(a);
        } else {
          pending.push(a);
        }
      });

      setAssignments(pending);
      setOverdueAssignments(overdue);
      setSubmittedAssignments(submitted);
    } catch (err) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };


  const handleTheoryChange = (assignmentId, questionId, value) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              theoryAnswers: {
                ...a.theoryAnswers,
                [questionId]: value,
              },
            }
          : a
      )
    );
  };

  const handleObjectiveChange = (assignmentId, questionId, optionKey) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              objectiveAnswers: {
                ...a.objectiveAnswers,
                [questionId]: optionKey,
              },
            }
          : a
      )
    );
  };

  const handleSubmit = async (assignmentId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    // Check if overdue
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    if (dueDate < now) {
      toast.error("This assignment is overdue and cannot be submitted.");
      return;
    }

    const theory_answers = Object.entries(assignment.theoryAnswers || {}).map(
      ([question_id, answer]) => ({
        question_id: parseInt(question_id),
        answer,
      })
    );

    const objective_answers = Object.entries(
      assignment.objectiveAnswers || {}
    ).map(([question_id, selected_option]) => ({
      question_id: parseInt(question_id),
      selected_option,
    }));

    const payload = {
      assignment_id: assignmentId,
      student_id: 0,
      file_url: "",
      theory_answers,
      objective_answers,
    };

    if (theory_answers.length === 0 && objective_answers.length === 0) {
      toast.error("You must answer at least one question");
      return;
    }

    setSubmittingId(assignmentId);
    try {
      await submitAssignment(payload);
      toast.success("Assignment submitted successfully");

      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      const updated = await fetchMySubmissions();
      setSubmittedAssignments(updated);
    } catch (err) {
      const msg = err.response?.data?.detail || "Submission failed";
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleCorrectionView = (submissionId) => {
    setExpandedCorrections((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: "Overdue", variant: "destructive", icon: AlertCircle };
    } else if (diffDays <= 3) {
      return { label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, variant: "secondary", icon: Clock };
    }
    return { label: "Upcoming", variant: "outline", icon: Calendar };
  };

  const getProgressStats = () => {
    const total = assignments.length + submittedAssignments.length + overdueAssignments.length;
    const completed = submittedAssignments.length;
    const pending = assignments.length;
    const overdue = overdueAssignments.length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  };


  const stats = getProgressStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Complete your assignments and track your academic progress
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Not Submitted</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{Math.round(stats.completionRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{stats.completed} of {stats.total} completed</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Assignments */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">No pending assignments at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-semibold">Pending Assignments</h2>
            <Badge variant="secondary">{assignments.length}</Badge>
          </div>

          <div className="grid gap-6">
            {assignments.map((assignment) => {
              const dueDateStatus = getDueDateStatus(assignment.due_date);
              const totalQuestions = (assignment.objective_questions?.length || 0) + (assignment.theory_questions?.length || 0);
              const answeredQuestions = Object.keys(assignment.theoryAnswers || {}).length + Object.keys(assignment.objectiveAnswers || {}).length;
              const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span>{assignment.subject?.name || "Unknown Subject"}</span>
                          </div>
                          {assignment.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {dueDateStatus && (
                        <Badge variant={dueDateStatus.variant} className="flex items-center gap-1">
                          <dueDateStatus.icon className="h-3 w-3" />
                          {dueDateStatus.label}
                        </Badge>
                      )}
                    </div>
                    
                    {assignment.description && (
                      <CardDescription className="text-base mt-2">
                        {assignment.description}
                      </CardDescription>
                    )}

                    {/* Progress indicator */}
                    {totalQuestions > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Questions answered</span>
                          <span className="font-medium">{answeredQuestions}/{totalQuestions}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Objective Questions */}
                    {assignment.objective_questions?.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">Multiple Choice Questions</h4>
                          <Badge variant="outline">{assignment.objective_questions.length}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                          {assignment.objective_questions.map((question, index) => (
                            <div key={question.id} className="space-y-3">
                              <p className="font-medium leading-relaxed">
                                <span className="text-primary font-semibold">{index + 1}.</span> {question.question_text || "No question"}
                              </p>
                              <div className="grid gap-2 ml-6">
                                {["option1", "option2", "option3", "option4"].map((optKey) => (
                                  <label
                                    key={optKey}
                                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`obj-${assignment.id}-${question.id}`}
                                      value={optKey}
                                      checked={assignment.objectiveAnswers[question.id] === optKey}
                                      onChange={() => handleObjectiveChange(assignment.id, question.id, optKey)}
                                      className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm leading-relaxed">{question[optKey]}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Theory Questions */}
                    {assignment.theory_questions?.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">Essay Questions</h4>
                          <Badge variant="outline">{assignment.theory_questions.length}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                          {assignment.theory_questions.map((question, index) => (
                            <div key={question.id} className="space-y-3">
                              <p className="font-medium leading-relaxed">
                                <span className="text-primary font-semibold">{index + 1}.</span> {question.question_text || "No question"}
                              </p>
                              <Textarea
                                className="min-h-[120px] resize-none"
                                value={assignment.theoryAnswers[question.id] || ""}
                                onChange={(e) => handleTheoryChange(assignment.id, question.id, e.target.value)}
                                placeholder="Write your detailed answer here..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={submittingId === assignment.id || progress === 0}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {submittingId === assignment.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Assignment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {overdueAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-2xl font-semibold">Not Submitted (Overdue)</h2>
            <Badge variant="destructive">{overdueAssignments.length}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {overdueAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{assignment.subject?.name || "Unknown Subject"}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] px-2 py-1">
                      Overdue
                    </Badge>
                  </div>

                  {assignment.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                  )}

                  <div className="text-xs text-red-600 font-bold">
                    Score: 0
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Assignments */}
      {submittedAssignments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="text-2xl font-semibold">Submitted Assignments</h2>
            <Badge variant="secondary">{submittedAssignments.length}</Badge>
          </div>

          <div className="grid gap-6">
            {submittedAssignments.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">
                        {submission.assignment?.title || "Untitled Assignment"}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>{submission.assignment?.subject?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={submission.score !== null ? "default" : "secondary"}>
                        {submission.score !== null ? `Score: ${submission.score}` : "Pending Review"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => toggleCorrectionView(submission.id)}
                    className="w-full justify-between"
                  >
                    <span>View Detailed Results</span>
                    {expandedCorrections[submission.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {expandedCorrections[submission.id] && (
                    <div className="mt-6 space-y-6">
                      <Separator />
                      
                      {/* Objective Questions Results */}
                      {submission.objective_answers?.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            Multiple Choice Results
                            <Badge variant="outline">{submission.objective_answers.length}</Badge>
                          </h4>
                          <div className="space-y-4">
                            {submission.objective_answers.map((oa, index) => {
                              const question = oa.question;
                              const selected = oa.selected_option;
                              const correct = question?.correct_option;
                              const isCorrect = selected === correct;

                              return (
                                <div
                                  key={oa.id}
                                  className={`p-4 rounded-lg border-2 ${
                                    isCorrect
                                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                                  }`}
                                >
                                  <div className="flex items-start gap-2 mb-3">
                                    {isCorrect ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <p className="font-medium leading-relaxed">
                                      {index + 1}. {question?.question_text || "No question"}
                                    </p>
                                  </div>
                                  <div className="ml-7 space-y-2 text-sm">
                                    <p>
                                      <span className="font-medium">Your answer:</span>{" "}
                                      <span className={isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                                        {question?.[selected]}
                                      </span>
                                    </p>
                                    {!isCorrect && (
                                      <p>
                                        <span className="font-medium">Correct answer:</span>{" "}
                                        <span className="text-green-700 dark:text-green-300 font-semibold">
                                          {question?.[correct]}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Theory Questions Results */}
                      {submission.theory_answers?.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            Essay Results
                            <Badge variant="outline">{submission.theory_answers.length}</Badge>
                          </h4>
                          <div className="space-y-4">
                            {submission.theory_answers.map((ta, index) => (
                              <div
                                key={ta.id}
                                className="p-4 rounded-lg border bg-card"
                              >
                                <p className="font-medium mb-3 leading-relaxed">
                                  {index + 1}. {ta.question?.question_text || "Question not found"}
                                </p>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <span className="font-medium text-muted-foreground">Your answer:</span>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      <p className="text-foreground italic leading-relaxed">
                                        {ta.student_answer || "Not answered"}
                                      </p>
                                    </div>
                                  </div>
                                  {ta.score !== null && ta.score !== undefined ? (
                                    <Badge
                                      variant={ta.score > 0 ? "default" : "destructive"}
                                      className="flex items-center gap-1 w-fit"
                                    >
                                      {ta.score > 0 ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3" />
                                      )}
                                      {ta.score > 0 ? "Correct" : "Needs Improvement"}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Pending Review</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentSubmissionPage;
