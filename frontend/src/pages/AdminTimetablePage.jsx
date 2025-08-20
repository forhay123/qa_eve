import React, { useEffect, useState } from 'react';
import AdminTimetableForm from '../components/AdminTimetableForm';
import {
  getAllTimetables,
  deleteTimetable,
  createTimetable,
  updateTimetable,
} from '../services/api';
import { toast } from 'react-toastify';

// Add Saturday and Sunday to the days array
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const juniorLevels = ['jss1', 'jss2', 'jss3'];
const seniorLevels = ['ss1', 'ss2', 'ss3'];

// NEW: Define the class labels mapping
const classLabels = {
  jss1: 'LFC',
  jss2: 'LDC',
  jss3: 'LSC',
  ss1: 'UFC',
  ss2: 'UDC',
  ss3: 'USC',
};

const periods = [
  { label: '07:45–08:00', key: 'assembly' },
  { label: '08:00–08:40', key: 'p1' },
  { label: '08:40–09:20', key: 'p2' },
  { label: '09:20–10:00', key: 'p3' },
  { label: '10:00–10:15', key: 'short_break' },
  { label: '10:15–10:55', key: 'p4' },
  { label: '10:55–11:35', key: 'p5' },
  { label: '11:35–12:10', key: 'long_break' },
  { label: '12:10–12:50', key: 'p6' },
  { label: '12:50–13:30', key: 'p7' },
  { label: '13:30–14:10', key: 'p8' },
  { label: '14:10–14:50', key: 'p9' },
];

const getPeriodNumberFromStartTime = (startTime) => {
  const map = {
    '08:00': 1,
    '08:40': 2,
    '09:20': 3,
    '10:15': 4,
    '10:55': 5,
    '12:10': 6,
    '12:50': 7,
    '13:30': 8,
    '14:10': 9,
  };
  return map[startTime] || null;
};

const AdminTimetablePage = () => {
  const [timetables, setTimetables] = useState([]);
  const [timetableMap, setTimetableMap] = useState({});
  const [editEntry, setEditEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTimetables = async () => {
    try {
      setLoading(true);
      const data = await getAllTimetables();
      setTimetables(data);

      const map = {};
      data.forEach((entry) => {
        const dayKey = entry.day.trim().toLowerCase();
        const levelKey = entry.level.trim().toLowerCase();
        const periodNum = getPeriodNumberFromStartTime(entry.start_time);
        if (!periodNum) return;
        const key = `${dayKey} ${levelKey} period ${periodNum}`;
        if (!map[key]) map[key] = [];
        map[key].push(entry);
      });

      setTimetableMap(map);
    } catch (error) {
      toast.error('Failed to load timetable');
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      await deleteTimetable(id);
      toast.success('Entry deleted successfully');
      loadTimetables();
    } catch (err) {
      toast.error('Could not delete timetable entry');
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmit = async (formData) => {
    try {
      if (editEntry) {
        await updateTimetable(editEntry.id, formData);
        toast.success('Timetable updated successfully');
      } else {
        await createTimetable(formData);
        toast.success('Timetable created successfully');
      }

      setEditEntry(null);
      loadTimetables();
    } catch (err) {
      toast.error('Failed to save timetable');
      console.error('Submit error:', err);
    }
  };

  const renderGrid = (levels) => (
    <div className="overflow-x-auto rounded-lg border border-border shadow-sm mb-12">
      <table className="min-w-full text-sm bg-card text-card-foreground">
        <thead className="bg-muted text-muted-foreground sticky top-0">
          <tr>
            <th className="border border-border px-4 py-2 text-center">Day</th>
            <th className="border border-border px-4 py-2 text-center">Class</th>
            {periods.map((p, idx) => (
              <th key={idx} className="border border-border px-2 py-1 text-center whitespace-nowrap">
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) =>
            levels.map((level, idx) => (
              <tr key={`${day}-${level}`} className="text-center align-top">
                {idx === 0 && (
                  <td
                    rowSpan={levels.length}
                    className="border border-border px-3 py-2 font-bold bg-muted/50"
                  >
                    {day}
                  </td>
                )}
                <td className="border border-border px-3 py-2 font-medium">
                  {/* NEW: Use the mapping to display the correct label */}
                  {classLabels[level] || level.toUpperCase()}
                </td>
                {periods.map((p, pIdx) => {
                  if (p.key.includes('break') || p.key === 'assembly') {
                    return (
                      <td
                        key={pIdx}
                        className="border border-border px-2 py-2 text-xs text-muted-foreground bg-muted/30 italic"
                      >
                        {p.key === 'assembly' ? 'Assembly' : 'Break'}
                      </td>
                    );
                  }

                  const periodIndex = periods
                    .slice(0, pIdx + 1)
                    .filter((period) => !period.key.includes('break') && period.key !== 'assembly')
                    .length;

                  const lookupKey = `${day.toLowerCase()} ${level.toLowerCase()} period ${periodIndex}`;
                  const entries = timetableMap[lookupKey];

                  return (
                    <td key={pIdx} className="border border-border px-2 py-2 whitespace-pre-line">
                      {entries?.map((entry) => (
                        <div key={entry.id} className="mb-2">
                          <div className="text-sm font-medium">
                            {entry.subject}
                            {entry.department && (
                              <span className="text-xs text-muted-foreground"> ({entry.department})</span>
                            )}
                          </div>
                          <div className="flex justify-center gap-2 mt-1">
                            <button
                              className="text-primary hover:text-primary/80 hover:underline text-xs"
                              onClick={() => handleEdit(entry)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-destructive hover:text-destructive/80 hover:underline text-xs"
                              onClick={() => handleDelete(entry.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Timetable Management</h1>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading timetables...</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Junior Classes</h2>
            {renderGrid(juniorLevels)}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Senior Classes</h2>
            {renderGrid(seniorLevels)}
          </section>
        </>
      )}

      <section className="mt-12 border-t border-border pt-6">
        <h2 className="text-xl font-semibold mb-4">
          {editEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
        </h2>
        <AdminTimetableForm
          initialData={editEntry}
          onSubmit={handleSubmit}
          onCancel={() => setEditEntry(null)}
        />
      </section>
    </div>
  );
};

export default AdminTimetablePage;