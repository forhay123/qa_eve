import React, { useEffect, useState } from "react";
import { fetchTeacherAssignments, fetchAssignmentSubmissions } from "../../services/api";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const TeacherAssignmentsWithSubmissions = () => {
  const [assignments, setAssignments] = useState([]);
  const [expandedAssignments, setExpandedAssignments] = useState({}); // { assignmentId: submissions[] }
  const [loadingSubmissions, setLoadingSubmissions] = useState({}); // { assignmentId: boolean }

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await fetchTeacherAssignments();
      setAssignments(data);
    } catch {
      alert("Failed to load assignments");
    }
  };

  // Helper: get total questions count for an assignment
  const getTotalQuestions = (assignment) =>
    (assignment.theory_questions?.length || 0) + (assignment.objective_questions?.length || 0);

  const toggleSubmissions = async (assignmentId) => {
    if (expandedAssignments[assignmentId]) {
      // Collapse if already loaded
      setExpandedAssignments((prev) => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });
    } else {
      try {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: true }));
        const submissions = await fetchAssignmentSubmissions(assignmentId);
        setExpandedAssignments((prev) => ({
          ...prev,
          [assignmentId]: submissions,
        }));
      } catch {
        alert("Failed to load submissions");
      } finally {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: false }));
      }
    }
  };

  return (
    <>
      <h2>Your Assignments</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Total Questions</TableHead>
            <TableHead>Submissions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <React.Fragment key={assignment.id}>
              <TableRow>
                <TableCell>{assignment.title}</TableCell>
                <TableCell>{assignment.subject?.name || "—"}</TableCell>
                <TableCell>{assignment.class_level}</TableCell>
                <TableCell>{new Date(assignment.due_date).toLocaleDateString()}</TableCell>
                <TableCell>{getTotalQuestions(assignment)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => toggleSubmissions(assignment.id)}
                    disabled={loadingSubmissions[assignment.id]}
                  >
                    {loadingSubmissions[assignment.id]
                      ? "Loading..."
                      : expandedAssignments[assignment.id]
                      ? "Hide"
                      : "View"}{" "}
                    Submissions
                  </Button>
                </TableCell>
              </TableRow>
              {expandedAssignments[assignment.id] && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>File</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expandedAssignments[assignment.id].length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} style={{ textAlign: "center" }}>
                              No submissions yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedAssignments[assignment.id].map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>
                              {submission.student?.full_name || submission.student?.username}
                            </TableCell>
                            <TableCell>
                              {submission.score ?? "Not graded"} / {getTotalQuestions(assignment)}
                            </TableCell>
                            <TableCell>
                              {new Date(submission.submitted_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {submission.file_url ? (
                                <a href={submission.file_url} target="_blank" rel="noreferrer">
                                  View File
                                </a>
                              ) : (
                                "No file"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default TeacherAssignmentsWithSubmissions;
