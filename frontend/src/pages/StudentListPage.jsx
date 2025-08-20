import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  User, GraduationCap, UserCheck, Users, Loader2
} from "lucide-react";

import {
  fetchAllUsers,
  deleteStudent,
  updateStudent,
} from '../services/api';

const StudentListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({
    students: 0,
    admins: 0,
    teachers: 0,
    parents: 0,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // mapping
  const classLabels = {
    jss1: "LFC",
    jss2: "LDC",
    // Add other class mappings here if needed, e.g.:
    // jss3: "LSC",
    // ss1: "UFC",
    // ss2: "UDC",
    // ss3: "USC",
  };

  const reverseMap = {
    LFC: "jss1",
    LDC: "jss2",
    // Add other reverse mappings here if needed
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllUsers();
      setUsers(data);

      const counts = data.reduce(
        (acc, user) => {
          acc[user.role + "s"] += 1;
          return acc;
        },
        { students: 0, admins: 0, teachers: 0, parents: 0 }
      );
      setCounts(counts);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        setActionLoadingId(id);
        await deleteStudent(id);
        await fetchUsers();
      } catch (error) {
        console.error("Delete failed:", error.message);
        setError("Failed to delete student. Please try again.");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    // When starting edit, display the mapped label if it exists, otherwise the original value
    setEditForm({ ...user,
      student_class: classLabels[user.student_class] || user.student_class || ""
    });
  };

  const handleEditChange = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setActionLoadingId(editingId);
      // Before saving, reverse map the student_class back to its original value if it was a mapped label
      const dataToSave = {
        ...editForm,
        student_class: reverseMap[editForm.student_class] || editForm.student_class
      };
      await updateStudent(editingId, dataToSave);
      setEditingId(null);
      await fetchUsers();
    } catch (error) {
      console.error("Update failed:", error.message);
      setError("Failed to update student. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDashboard = (userId) => {
    navigate(`/admin/students/${userId}/dashboard`);
  };

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const nameMatch = !search || (user.full_name || "").toLowerCase().includes(search.toLowerCase());
    const roleMatch = !roleFilter || roleFilter === "all" || user.role === roleFilter;
    const departmentMatch = !departmentFilter || departmentFilter === "all" || (user.department || "").toLowerCase().includes(departmentFilter.toLowerCase());
    // For class filter, check against both original and mapped values
    const classMatch = !classFilter || classFilter === "all" ||
                       (user.student_class || "").toLowerCase().includes(classFilter.toLowerCase()) ||
                       (classLabels[user.student_class] || "").toLowerCase().includes(classFilter.toLowerCase());

    return nameMatch && roleMatch && departmentMatch && classMatch;
  });

  // Role badge styles
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "secondary";
      case "student":
        return "default";
      case "parent":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Role icons
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <UserCheck className="h-4 w-4" />;
      case "teacher":
        return <GraduationCap className="h-4 w-4" />;
      case "student":
        return <User className="h-4 w-4" />;
      case "parent":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all registered users in the system</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["students", "teachers", "admins", "parents"].map((role, i) => {
          const icons = [<User />, <GraduationCap />, <UserCheck />, <Users />];
          const titles = ["Students", "Teachers", "Admins", "Parents"];
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{titles[i]}</CardTitle>
                {React.cloneElement(icons[i], { className: "h-4 w-4 text-muted-foreground" })}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts?.[role] ?? 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="jss1">JSS1</SelectItem>
                <SelectItem value="jss2">JSS2</SelectItem>
                <SelectItem value="jss3">JSS3</SelectItem>
                <SelectItem value="ss1">SS1</SelectItem>
                <SelectItem value="ss2">SS2</SelectItem>
                <SelectItem value="ss3">SS3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>A list of all registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="hidden">Level</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isEditing = editingId === user.id;
                  const isStudent = user.role === "student";
                  const isActionLoading = actionLoadingId === user.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editForm.full_name || ""}
                            onChange={(e) => handleEditChange("full_name", e.target.value)}
                          />
                        ) : (
                          user.full_name || "-"
                        )}
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {isEditing && isStudent ? (
                          <Input
                            value={editForm.student_class} // Use the mapped value for display
                            onChange={(e) => {
                              // On change, reverse map the input value before storing in editForm
                              const originalValue = reverseMap[e.target.value] || e.target.value;
                              handleEditChange("student_class", originalValue);
                            }}
                          />
                        ) : (
                          // Display the mapped label or the original value if no mapping exists
                          classLabels[user.student_class] || user.student_class || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm.state_of_origin || ""}
                            onChange={(e) => handleEditChange("state_of_origin", e.target.value)}
                          />
                        ) : (
                          user.state_of_origin || "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden">
                        {isEditing && isStudent ? (
                          <Select
                            value={editForm.level || ""}
                            onValueChange={(value) => handleEditChange("level", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="junior">Junior</SelectItem>
                              <SelectItem value="senior">Senior</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          user.level || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing && isStudent ? (
                          <Select
                            value={editForm.department || ""}
                            onValueChange={(value) => handleEditChange("department", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="arts">Arts</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          user.department || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={handleSave} disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={isActionLoading}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            isStudent && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEditClick(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleViewDashboard(user.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)} disabled={isActionLoading}>
                                  {isActionLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentListPage;