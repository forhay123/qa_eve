import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSubjects,
  deleteSubject,
  updateSubject,
} from "../services/api";

const SubjectRow = ({ subject, index, onDelete, onEdit, onViewTopics }) => {
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(subject.name);

  useEffect(() => {
    setEditedName(subject.name);
  }, [subject.name]);

  const handleEditConfirm = async () => {
    if (editedName.trim() && editedName !== subject.name) {
      try {
        await onEdit(subject.id, editedName.trim());
        setEditing(false);
      } catch (err) {
        alert("Failed to update subject: " + err.message);
      }
    } else {
      setEditing(false);
    }
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-2 text-sm text-muted-foreground">{index + 1}</td>
      <td className="px-4 py-2 text-sm">
        {editing ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEditConfirm();
              if (e.key === "Escape") {
                setEditedName(subject.name);
                setEditing(false);
              }
            }}
            onBlur={handleEditConfirm}
            autoFocus
            className="w-full border border-border px-2 py-1 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          `${subject.name}`
        )}
      </td>
      <td className="px-4 py-2 space-x-2">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          className="bg-destructive text-destructive-foreground px-3 py-1 rounded hover:bg-destructive/90 text-sm transition-colors"
          onClick={() => onDelete(subject.id)}
        >
          Delete
        </button>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition-colors"
          onClick={() =>
            onViewTopics({
              level: subject.level,
              name: encodeURIComponent(subject.name.toLowerCase()),
            })
          }
        >
          📘 View Topics
        </button>
      </td>
    </tr>
  );
};

const SubjectTable = ({ subjects, onDelete, onEdit, onViewTopics }) => (
  <div className="overflow-x-auto mt-6">
    <table className="min-w-full bg-card text-card-foreground shadow rounded-lg border border-border">
      <thead className="bg-muted text-muted-foreground">
        <tr>
          <th className="text-left px-4 py-2 text-sm font-semibold">#</th>
          <th className="text-left px-4 py-2 text-sm font-semibold">Subject</th>
          <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {subjects.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-4 text-muted-foreground">
              No subjects found
            </td>
          </tr>
        ) : (
          subjects.map((subject, index) => (
            <SubjectRow
              key={subject.id}
              subject={subject}
              index={index}
              onDelete={onDelete}
              onEdit={onEdit}
              onViewTopics={onViewTopics}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
);

const AdminSubjectsPage = () => {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("General");
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const levels = ["jss1", "jss2", "jss3", "ss1", "ss2", "ss3"];
  const departments = ["General", "Science", "Commercial", "Art"];

  useEffect(() => {
    const isSenior = ["ss1", "ss2", "ss3"].includes(selectedLevel.toLowerCase());
    if (!selectedLevel) {
      setSubjects([]);
      setSelectedDepartment("General");
      return;
    }
    if (!isSenior) {
      setSelectedDepartment("");
    } else if (!selectedDepartment) {
      setSelectedDepartment("General");
    }
  }, [selectedLevel]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedLevel) {
        setSubjects([]);
        return;
      }

      const isSenior = ["ss1", "ss2", "ss3"].includes(selectedLevel.toLowerCase());

      if (isSenior && !selectedDepartment) {
        setSubjects([]);
        return;
      }

      setLoading(true);
      try {
        const deptParam =
          isSenior && selectedDepartment !== "General" ? selectedDepartment : "";
        const data = await fetchSubjects(selectedLevel, deptParam);
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err.message);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [selectedLevel, selectedDepartment]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await deleteSubject(id);
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        alert("Failed to delete subject: " + err.message);
      }
    }
  };

  const handleEdit = async (id, newName) => {
    try {
      const updated = await updateSubject(id, { name: newName });
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      throw err;
    }
  };

  const handleViewTopics = ({ level, name }) => {
    navigate(`/lesson-plan/${level.toLowerCase()}/${name}`);
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-4">Manage Class Schedule</h2>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="level-select" className="block text-sm font-medium">
            Select Class
          </label>
          <select
            id="level-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="mt-1 border border-border rounded px-3 py-2 w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Select Class --</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {["ss1", "ss2", "ss3"].includes(selectedLevel.toLowerCase()) && (
          <div>
            <label htmlFor="department-select" className="block text-sm font-medium">
              Select Department
            </label>
            <select
              id="department-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="mt-1 border border-border rounded px-3 py-2 w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedLevel && (
        <>
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-6 block w-full max-w-md border border-border rounded px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {loading ? (
            <p className="mt-4 text-muted-foreground">Loading subjects...</p>
          ) : (
            <SubjectTable
              subjects={filteredSubjects}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onViewTopics={handleViewTopics}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminSubjectsPage;
