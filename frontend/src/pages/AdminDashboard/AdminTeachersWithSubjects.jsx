import React, { useEffect, useState } from "react";
import { fetchTeachersWithSubjects } from "../../services/api";
import { Loader2 } from "lucide-react";

const AdminTeachersWithSubjects = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const data = await fetchTeachersWithSubjects();
        setTeachers(data);
      } catch (err) {
        setError(err.message || "Failed to load teachers with subjects");
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading teachers...
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 text-center py-4 font-medium">{error}</div>
    );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-blue-700">
        👨‍🏫 Teachers and Their Assigned Subjects
      </h2>

      {teachers.length === 0 ? (
        <p className="text-gray-600">No teachers found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="border rounded shadow-sm p-4 bg-white space-y-2"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {teacher.full_name || "N/A"}
                </h3>
                <p className="text-sm text-gray-500">@{teacher.username}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Subjects Assigned:</p>
                {teacher.subjects_taught.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {teacher.subjects_taught.map(({ subject }, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 border text-gray-700 text-sm px-2 py-1 rounded"
                      >
                        {subject?.name || "Unknown"}{" "}
                        <span className="text-xs text-gray-500">
                          ({subject?.level || "N/A"})
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mt-1">
                    No subjects assigned
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeachersWithSubjects;
