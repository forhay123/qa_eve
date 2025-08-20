import React, { useEffect, useState } from "react";
import {
  getTeacherSubjects,
  fetchTeacherTopics,
  uploadTopicPdf,
  regenerateQuestions,
  deleteTopic,
} from "../../services/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";

/* ---------------------------------------------
 * LessonPlanPage – teacher view
 * ------------------------------------------- */
const LessonPlanPage = () => {
  /* ──────────────────── state ──────────────────── */
  const [subjects, setSubjects] = useState([]);
  const [lessonPlans, setLessonPlans] = useState({}); // { "<name>_<level>": [topics] }
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  /* ──────────────────── effects ─────────────────── */
  useEffect(() => {
    fetchLessonPlans();
  }, []);

  /* ──────────────────── helpers ─────────────────── */
  const getFullPdfUrl = (url) =>
    url?.startsWith("http") ? url : `http://localhost:8000${url}`;

  /* ──────────────────── data loaders ─────────────── */
  async function fetchLessonPlans() {
    setLoading(true);
    try {
      // 1️⃣ subjects assigned to this teacher
      const assigned = await getTeacherSubjects();
      setSubjects(assigned);

      // 2️⃣ every topic this teacher may touch
      const allTopics = await fetchTeacherTopics();

      // 3️⃣ bucket by subject name + level  (fix: use nested field)
      const grouped = {};
      for (const subj of assigned) {
        const key = `${subj.name.toLowerCase()}_${subj.level.toLowerCase()}`;
        grouped[key] = allTopics.filter(
          (t) =>
            t.subject?.name?.toLowerCase() === subj.name.toLowerCase() &&
            t.level?.toLowerCase() === subj.level.toLowerCase()
        );
      }
      setLessonPlans(grouped);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load lesson plans");
    } finally {
      setLoading(false);
    }
  }

  /* ──────────────────── actions ─────────────────── */
  const handleUpload = (topicId) => {
    const chooser = document.createElement("input");
    chooser.type = "file";
    chooser.accept = ".pdf";
    chooser.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploadingId(topicId);
        await uploadTopicPdf(topicId, file);
        await fetchLessonPlans();
      } catch (err) {
        alert(err.message);
      } finally {
        setUploadingId(null);
      }
    };
    chooser.click();
  };

  const handleRegenerate = async (topicId, type) => {
    if (!window.confirm(`Regenerate ${type} questions?`)) return;
    try {
      await regenerateQuestions(topicId, type);
      alert(`${type} questions regenerated`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm("Delete this topic and all questions?")) return;
    try {
      setDeletingId(topicId);
      await deleteTopic(topicId);
      await fetchLessonPlans();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* ──────────────────── render ──────────────────── */
  if (loading)
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading lesson plans…
      </div>
    );

  if (error) return <p className="text-red-600 p-4">{error}</p>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-semibold text-primary">📚 Lesson Plans</h2>

      {subjects.length === 0 && (
        <p className="text-muted-foreground">
          You don’t have any subjects assigned.
        </p>
      )}

      {subjects.map((subj) => {
        const key = `${subj.name.toLowerCase()}_${subj.level.toLowerCase()}`;
        const topics = lessonPlans[key] || [];

        return (
          <Card key={key} className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {subj.name}
                <Badge variant="secondary">{subj.level.toUpperCase()}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="min-w-[280px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>{topic.week_number}</TableCell>
                      <TableCell>{topic.title}</TableCell>

                      <TableCell>
                        {topic.pdf_url ? (
                          <a
                            href={getFullPdfUrl(topic.pdf_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            📄 View PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">No PDF</span>
                        )}
                      </TableCell>

                      <TableCell className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRegenerate(topic.id, "objective")
                          }
                        >
                          Objective
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegenerate(topic.id, "theory")}
                        >
                          Theory
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpload(topic.id)}
                          disabled={uploadingId === topic.id}
                        >
                          {uploadingId === topic.id ? "Uploading…" : "Upload"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(topic.id)}
                          disabled={deletingId === topic.id}
                        >
                          {deletingId === topic.id ? "Deleting…" : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {topics.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No topics available yet.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LessonPlanPage;
