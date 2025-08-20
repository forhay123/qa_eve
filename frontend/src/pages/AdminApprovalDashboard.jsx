import React, { useEffect, useState } from "react";
import {
  fetchSubjects,
  fetchTopicsForSubject,
  createTopic,
  updateTopic,
  deleteTopic,
  togglePdfApproval as togglePdfApprovalApi,
} from "../services/api";
import { Check, X, FileText, Upload, Edit3, Trash2, Shield, Clock, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { toast } from "../hooks/use-toast";

const AdminApprovalDashboard = () => {
  const levels = ["jss1", "jss2", "jss3", "ss1", "ss2", "ss3"];
  const departments = ["General", "Science", "Commercial", "Art"];

  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("General");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState({
    title: "",
    week_number: "",
    file: null,
  });
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [processingApproval, setProcessingApproval] = useState(null);

  const backendBaseURL = `${window.location.protocol}//${window.location.hostname}:8000`;

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        if (!level) {
          setSubjects([]);
          setSelectedSubject("");
          return;
        }

        const isSenior = ["ss1", "ss2", "ss3"].includes(level.toLowerCase());
        const deptParam = isSenior && department !== "General" ? department : "";

        const data = await fetchSubjects(level, deptParam);
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].name);
        else setSelectedSubject("");
      } catch (err) {
        console.error("Failed to load subjects", err);
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive",
        });
      }
    };

    loadSubjects();
  }, [level, department]);

  useEffect(() => {
    const loadTopics = async () => {
      if (!selectedSubject || !level) return;
      try {
        const data = await fetchTopicsForSubject(level, selectedSubject);
        setTopics(data);
      } catch (err) {
        console.error("Failed to load topics", err);
        toast({
          title: "Error",
          description: "Failed to load topics",
          variant: "destructive",
        });
      }
    };

    loadTopics();
  }, [selectedSubject, level, refresh]);

  const handleCreateOrUpdate = async () => {
    if (!newTopic.title || !newTopic.week_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", newTopic.title);
    formData.append("week_number", newTopic.week_number);
    if (newTopic.file) formData.append("file", newTopic.file);

    try {
      const subjectObj = subjects.find((s) => s.name === selectedSubject);
      if (!subjectObj) throw new Error("Subject not found");

      if (editingTopicId) {
        await updateTopic(editingTopicId, formData);
        toast({
          title: "Success",
          description: "Topic updated successfully",
        });
      } else {
        await createTopic(subjectObj.level, subjectObj.name, formData);
        toast({
          title: "Success",
          description: "Topic created successfully",
        });
      }

      setNewTopic({ title: "", week_number: "", file: null });
      setEditingTopicId(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      console.error("Error saving topic:", err.message);
      toast({
        title: "Error",
        description: `Failed to save topic: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (topic) => {
    setNewTopic({
      title: topic.title,
      week_number: topic.week_number,
      file: null,
    });
    setEditingTopicId(topic.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this topic?")) {
      try {
        await deleteTopic(id);
        setRefresh((r) => r + 1);
        toast({
          title: "Success",
          description: "Topic deleted successfully",
        });
      } catch (err) {
        console.error("Delete failed:", err);
        toast({
          title: "Error",
          description: "Failed to delete topic",
          variant: "destructive",
        });
      }
    }
  };

  const togglePdfApproval = async (topic) => {
    setProcessingApproval(topic.id);
    try {
      await togglePdfApprovalApi(topic.id, !topic.is_pdf_approved);
      setRefresh((r) => r + 1);
      toast({
        title: "Success",
        description: `PDF ${!topic.is_pdf_approved ? "approved" : "disapproved"} successfully`,
      });
    } catch (err) {
      console.error("Approval toggle failed:", err);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    } finally {
      setProcessingApproval(null);
    }
  };

  const openPdf = (pdfUrl) => {
    const fullUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `${backendBaseURL}${pdfUrl}`;
    window.open(fullUrl, "_blank");
  };

  const getApprovalStats = () => {
    const total = topics.length;
    const approved = topics.filter(t => t.is_pdf_approved).length;
    const pending = total - approved;
    return { total, approved, pending };
  };

  const stats = getApprovalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <Card className="border-0 shadow-elegant bg-gradient-primary text-primary-foreground mb-8">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                Content Approval Dashboard
              </h1>
            </div>
            <p className="text-primary-foreground/90 text-lg">
              Manage topic approvals and lesson materials
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90">Total Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-glow">{stats.approved}</div>
                <div className="text-sm opacity-90">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-glow">{stats.pending}</div>
                <div className="text-sm opacity-90">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Select Class & Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Class Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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

              {["ss1", "ss2", "ss3"].includes(level.toLowerCase()) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects
                    .filter(
                      (s) =>
                        s.name.toLowerCase() !== "opening prayer" &&
                        s.name.toLowerCase() !== "closing prayer"
                    )
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Topic Form */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingTopicId ? <Edit3 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              {editingTopicId ? "Edit Topic" : "Add New Topic"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Lecture Number</label>
                <input
                  type="text"
                  placeholder="e.g., 1, 2, 3..."
                  value={newTopic.week_number}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, week_number: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Lesson Title</label>
                <input
                  type="text"
                  placeholder="Enter lesson title..."
                  value={newTopic.title}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, title: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">PDF File</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, file: e.target.files[0] })
                  }
                  className="w-full p-3 border border-border rounded-lg bg-background file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCreateOrUpdate} className="bg-gradient-primary shadow-elegant">
                {editingTopicId ? "Update Topic" : "Create Topic"}
              </Button>
              {editingTopicId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingTopicId(null);
                    setNewTopic({ title: "", week_number: "", file: null });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Topics List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Topics for {selectedSubject || "Selected Subject"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-xl bg-muted/50 w-fit mx-auto mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                </div>
                <p className="text-muted-foreground">No topics found for this subject</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="border border-border/50 hover:border-primary/20 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        
                        {/* Topic Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Lecture {topic.week_number}
                            </Badge>
                            <Badge 
                              className={topic.is_pdf_approved 
                                ? "bg-gradient-success text-success-foreground shadow-success" 
                                : "bg-gradient-warning text-warning-foreground shadow-warning"
                              }
                            >
                              {topic.is_pdf_approved ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending Approval
                                </>
                              )}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {topic.title}
                          </h3>
                          {topic.pdf_url && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              PDF available
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {topic.pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPdf(topic.pdf_url)}
                              className="text-primary hover:text-primary-foreground hover:bg-primary"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View PDF
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => togglePdfApproval(topic)}
                            disabled={processingApproval === topic.id}
                            className={
                              topic.is_pdf_approved
                                ? "bg-gradient-warning text-warning-foreground shadow-warning hover:opacity-90"
                                : "bg-gradient-success text-success-foreground shadow-success hover:opacity-90"
                            }
                            size="sm"
                          >
                            {processingApproval === topic.id ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : topic.is_pdf_approved ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Disapprove
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(topic)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(topic.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminApprovalDashboard;