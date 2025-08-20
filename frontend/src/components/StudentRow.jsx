
import React from 'react';

const StudentRow = ({ student, onEdit, onDelete }) => (
  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
    <td className="px-4 py-2 text-sm text-foreground">{student.full_name}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground">{student.username}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground">{student.student_class}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground">{student.state_of_origin}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground">{student.level}</td>
    <td className="px-4 py-2 flex gap-2">
      <button
        onClick={() => onEdit(student)}
        className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(student.id)}
        className="px-3 py-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm rounded transition-colors"
      >
        Delete
      </button>
    </td>
  </tr>
);

export default StudentRow;
