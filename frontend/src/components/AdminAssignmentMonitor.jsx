
import React, { useEffect, useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { 
  Download, 
  RefreshCcw, 
  Search, 
  Filter, 
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  MoreVertical,
  Eye,
  FileText
} from "lucide-react";
import { fetchAdminAssignments, fetchAdminAssignmentSubmissions } from "../services/api";
import { toast } from "../hooks/use-toast";

const AdminAssignmentMonitor = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filters, setFilters] = useState({
    class_level: "",
    department: "",
    student_name: "",
    date_given: "",
    status: "",
    search: ""
  });

  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState({ field: "due_date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const itemsPerPage = 10;

  // Statistics calculation
  const statistics = useMemo(() => {
    const total = assignments.length;
    const totalStudents = assignments.reduce((sum, a) => sum + a.total_students, 0);
    const completed = assignments.reduce((sum, a) => sum + a.completed_submissions, 0);
    const pending = assignments.reduce((sum, a) => sum + a.pending_submissions, 0);
    
    return {
      totalAssignments: total,
      totalStudents,
      completedSubmissions: completed,
      pendingSubmissions: pending,
      completionRate: totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0
    };
  }, [assignments]);

  const getAssignments = async () => {
    setLoading(true);
    try {
      const cleanedFilters = { ...filters };
      Object.keys(cleanedFilters).forEach(key => {
        if (cleanedFilters[key] === "all" || cleanedFilters[key] === "") {
          delete cleanedFilters[key];
        }
      });
      delete cleanedFilters.search; // Remove search from API call

      const response = await fetchAdminAssignments(cleanedFilters);
      setAssignments(response);
      
      toast.success(`Loaded ${response.length} assignments`);
    } catch (err) {
      console.error("❌ Failed to fetch assignments:", err);
      toast("Failed to fetch assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Advanced filtering and searching
  useEffect(() => {
    let filtered = [...assignments];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm) ||
        assignment.subject?.name.toLowerCase().includes(searchTerm) ||
        assignment.teacher?.full_name.toLowerCase().includes(searchTerm) ||
        assignment.class_level.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortBy;
      let aValue = a[field];
      let bValue = b[field];

      if (field === "due_date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (field === "completion_rate") {
        aValue = a.total_students > 0 ? (a.completed_submissions / a.total_students) * 100 : 0;
        bValue = b.total_students > 0 ? (b.completed_submissions / b.total_students) * 100 : 0;
      }

      if (direction === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredAssignments(filtered);
    setCurrentPage(1);
  }, [assignments, filters.search, sortBy]);

  useEffect(() => {
    getAssignments();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      "ID", "Title", "Subject", "Teacher", "Class Level", "Due Date",
      "Total Students", "Completed", "Pending", "Completion Rate (%)"
    ];

    const rows = filteredAssignments.map(a => [
      a.id,
      `"${a.title}"`,
      `"${a.subject?.name || "-"}"`,
      `"${a.teacher?.full_name || "-"}"`,
      a.class_level,
      new Date(a.due_date).toLocaleDateString(),
      a.total_students,
      a.completed_submissions,
      a.pending_submissions,
      a.total_students > 0 ? Math.round((a.completed_submissions / a.total_students) * 100) : 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assignments_overview_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Assignment data has been exported to CSV",
      variant: "default"
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getStatusBadge = (assignment) => {
    const completionRate = assignment.total_students > 0 
      ? (assignment.completed_submissions / assignment.total_students) * 100 
      : 0;
    
    if (completionRate === 100) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Complete
      </Badge>;
    } else if (completionRate >= 50) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
        <TrendingUp className="w-3 h-3 mr-1" />
        In Progress
      </Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <Clock className="w-3 h-3 mr-1" />
        Low Progress
      </Badge>;
    }
  };

  const getDueDateStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="outline" className="border-orange-200 text-orange-700">Due Soon</Badge>;
    }
    return <Badge variant="outline" className="border-green-200 text-green-700">Upcoming</Badge>;
  };

  const handleViewSubmissions = async (assignmentId) => {
    if (expandedAssignmentId === assignmentId) {
      // Collapse if already open
      setExpandedAssignmentId(null);
      setAssignmentSubmissions([]);
      return;
    }

    setLoadingSubmissions(true);
    try {
      const data = await fetchAdminAssignmentSubmissions(assignmentId);
      setAssignmentSubmissions(data);
      setExpandedAssignmentId(assignmentId);
    } catch(err) {
      console.error("❌ Failed to load submissions:", err);
      toast("Failed to load submissions. Please try again.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold text-blue-700">{statistics.totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-green-700">{statistics.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-700">{statistics.completedSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-700">{statistics.pendingSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-700">{statistics.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-primary" />
                Assignment Monitor
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Monitor and track assignment submissions across all classes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={getAssignments} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="default" onClick={handleExportCSV} disabled={filteredAssignments.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Advanced Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search assignments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>

              <Input 
                placeholder="Student Name"
                value={filters.student_name}
                onChange={(e) => handleFilterChange("student_name", e.target.value)}
              />

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="date"
                  value={filters.date_given}
                  onChange={(e) => handleFilterChange("date_given", e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select onValueChange={(val) => handleFilterChange("class_level", val)} value={filters.class_level}>
                <SelectTrigger>
                  <SelectValue placeholder="Class Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="SS1">SS1</SelectItem>
                  <SelectItem value="SS2">SS2</SelectItem>
                  <SelectItem value="SS3">SS3</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(val) => handleFilterChange("department", val)} value={filters.department}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(val) => handleFilterChange("status", val)} value={filters.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={getAssignments} variant="secondary" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Showing {currentAssignments.length} of {filteredAssignments.length} assignments
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span>Sort by:</span>
                <Select value={sortBy.field} onValueChange={(val) => handleSort(val)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due_date">Due Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="class_level">Class Level</SelectItem>
                    <SelectItem value="completion_rate">Completion Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Assignments Table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <LoadingSkeleton />
                </div>
              ) : currentAssignments.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or create a new assignment.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Assignment</th>
                      <th className="text-left p-4 font-semibold">Subject & Teacher</th>
                      <th className="text-left p-4 font-semibold">Class & Due Date</th>
                      <th className="text-left p-4 font-semibold">Progress</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssignments.map((assignment, index) => {
                      const completionRate = assignment.total_students > 0 
                        ? (assignment.completed_submissions / assignment.total_students) * 100 
                        : 0;

                      return (
                        <React.Fragment key={assignment.id}>
                          <tr className={`border-t hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                            <td className="p-4">
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">{assignment.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {assignment.description || "No description provided"}
                                </p>
                              </div>
                            </td>
                            
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-foreground">{assignment.subject?.name || "-"}</p>
                                <p className="text-sm text-muted-foreground">{assignment.teacher?.full_name || "-"}</p>
                              </div>
                            </td>
                            
                            <td className="p-4">
                              <div className="space-y-1">
                                <Badge variant="outline" className="text-xs">
                                  {assignment.class_level}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(assignment.due_date).toLocaleDateString()}
                                </p>
                                {getDueDateStatus(assignment.due_date)}
                              </div>
                            </td>
                            
                            <td className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{assignment.completed_submissions}/{assignment.total_students}</span>
                                  <span className="font-medium">{Math.round(completionRate)}%</span>
                                </div>
                                <Progress value={completionRate} className="h-2" />
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    {assignment.completed_submissions} completed
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-orange-600" />
                                    {assignment.pending_submissions} pending
                                  </span>
                                </div>
                              </div>
                            </td>
                            
                            <td className="p-4">
                              {getStatusBadge(assignment)}
                            </td>
                            
                            <td className="p-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewSubmissions(assignment.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {expandedAssignmentId === assignment.id ? "Hide" : "View"}
                              </Button>
                            </td>
                          </tr>

                          {/* Expanded Submission Details */}
                          {expandedAssignmentId === assignment.id && (
                            <tr>
                              <td colSpan={6}>
                                {loadingSubmissions ? (
                                  <div className="p-4 text-center">Loading submissions...</div>
                                ) : (
                                  <div className="p-4 border rounded-lg bg-muted/20">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-muted/50">
                                          <th className="p-2 text-left">Student</th>
                                          <th className="p-2 text-left">Score</th>
                                          <th className="p-2 text-left">Submitted At</th>
                                          <th className="p-2 text-left">File</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {assignmentSubmissions.length === 0 ? (
                                          <tr>
                                            <td colSpan={4} className="text-center text-muted-foreground p-4">
                                              No submissions yet.
                                            </td>
                                          </tr>
                                        ) : (
                                          assignmentSubmissions.map(submission => (
                                            <tr key={submission.id} className="hover:bg-muted/30">
                                              <td className="p-2">{submission.student?.full_name || submission.student?.username || "-"}</td>
                                              <td className="p-2">{submission.score != null ? submission.score : "Not graded"}</td>
                                              <td className="p-2">{new Date(submission.submitted_at).toLocaleString()}</td>
                                              <td className="p-2">
                                                {submission.file_url ? (
                                                  <a href={submission.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                                    View File
                                                  </a>
                                                ) : (
                                                  "No file"
                                                )}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && filteredAssignments.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssignmentMonitor;
