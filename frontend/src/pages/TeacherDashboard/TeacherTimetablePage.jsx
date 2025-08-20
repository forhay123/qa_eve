
import React, { useEffect, useState } from 'react';
import { fetchTeacherTimetable } from '../../services/api';
import { toast } from 'react-toastify';

// Days of the week to render
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Time periods (including special ones like assembly and breaks)
const periods = [
  { label: '07:45–08:00', key: 'assembly' },
  { label: '08:00–08:40', key: 'p1', start: '08:00' },
  { label: '08:40–09:20', key: 'p2', start: '08:40' },
  { label: '09:20–10:00', key: 'p3', start: '09:20' },
  { label: '10:00–10:15', key: 'short_break' },
  { label: '10:15–10:55', key: 'p4', start: '10:15' },
  { label: '10:55–11:35', key: 'p5', start: '10:55' },
  { label: '11:35–12:10', key: 'long_break' },
  { label: '12:10–12:50', key: 'p6', start: '12:10' },
  { label: '12:50–13:30', key: 'p7', start: '12:50' },
  { label: '13:30–14:10', key: 'p8', start: '13:30' },
  { label: '14:10–14:50', key: 'p9', start: '14:10' },
];

// Map start times to period numbers
const getPeriodNumber = (startTime) => {
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

const TeacherTimetablePage = () => {
  const [timetableMap, setTimetableMap] = useState({});

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        const data = await fetchTeacherTimetable();

        const map = {};
        for (const entry of data) {
          const dayKey = entry.day?.toLowerCase().trim();
          const periodNum = getPeriodNumber(entry.start_time);

          if (!dayKey || !periodNum) continue;

          const key = `${dayKey}-p${periodNum}`;
          if (!map[key]) map[key] = [];
          map[key].push(entry);
        }

        setTimetableMap(map);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        const msg = err?.response?.data?.detail || 'Failed to load timetable';
        toast.error(msg);
      }
    };

    loadTimetable();
  }, []);

  return (
    <div className="p-6 overflow-x-auto bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6">📅 My Teaching Timetable</h1>

      <table className="min-w-full text-sm border border-border text-center bg-card">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="border border-border px-3 py-2">Day</th>
            {periods.map((p, idx) => (
              <th key={idx} className="border border-border px-2 py-1">{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day} className="align-top">
              <td className="border border-border px-2 py-1 font-medium bg-muted/50">{day}</td>
              {periods.map((p, idx) => {
                if (p.key.includes('break') || p.key === 'assembly') {
                  return (
                    <td
                      key={idx}
                      className="border border-border px-2 py-1 bg-muted/50 italic text-muted-foreground"
                    >
                      {p.key === 'assembly' ? 'Assembly' : 'Break'}
                    </td>
                  );
                }

                const key = `${day.toLowerCase()}-${p.key}`;
                const entries = timetableMap[key];

                return (
                  <td key={idx} className="border border-border px-2 py-1 whitespace-pre-line">
                    {entries?.length > 0 ? (
                      entries.map((entry) => (
                        <div key={entry.id} className="mb-1">
                          <div className="text-foreground">{entry.subject}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.level?.toUpperCase()}
                            {entry.department && ` (${entry.department})`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">–</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTimetablePage;