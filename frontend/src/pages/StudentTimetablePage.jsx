import React, { useEffect, useState } from 'react';
import { getUserTimetable, getCurrentUser } from '../services/api';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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
  { label: '07:45 - 08:00', key: 'assembly' },
  { label: '08:00 - 08:40', key: 'p1' },
  { label: '08:40 - 09:20', key: 'p2' },
  { label: '09:20 - 10:00', key: 'p3' },
  { label: '10:00 - 10:15', key: 'short_break' },
  { label: '10:15 - 10:55', key: 'p4' },
  { label: '10:55 - 11:35', key: 'p5' },
  { label: '11:35 - 12:10', key: 'long_break' },
  { label: '12:10 - 12:50', key: 'p6' },
  { label: '12:50 - 13:30', key: 'p7' },
  { label: '13:30 - 14:10', key: 'p8' },
  { label: '14:10 - 14:50', key: 'p9' },
];

const StudentTimetablePage = () => {
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
        const data = await getUserTimetable(me.level);
        setTimetable(data);
      } catch (err) {
        console.error('❌ Error loading timetable:', err.message);
      }
    };

    fetchData();
  }, []);

  const getPeriodNumberFromStartTime = (startTime) => {
    switch (startTime) {
      case '08:00': return 1;
      case '08:40': return 2;
      case '09:20': return 3;
      case '10:15': return 4;
      case '10:55': return 5;
      case '12:10': return 6;
      case '12:50': return 7;
      case '13:30': return 8;
      case '14:10': return 9;
      default: return null;
    }
  };

  const timetableMap = {};
  timetable.forEach((t) => {
    const key = `${t.day.trim().toLowerCase()} ${t.level.trim().toLowerCase()} period ${getPeriodNumberFromStartTime(t.start_time)}`;
    if (!timetableMap[key]) timetableMap[key] = [];
    timetableMap[key].push(t.subject);
  });

  const renderGrid = (levels) => (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg mb-10 border border-gray-200">
      <table className="min-w-full text-sm text-gray-800">
        <thead>
          <tr className="bg-blue-100 text-gray-700">
            <th className="border px-3 py-2 text-left">Day</th>
            <th className="border px-3 py-2 text-left">Class</th>
            {periods.map((p, idx) => (
              <th key={idx} className="border px-2 py-2 text-center whitespace-nowrap">
                {p.label}
                {p.key.includes('break') ? (
                  <div className="text-xs italic text-gray-500">{p.key.replace('_', ' ')}</div>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) =>
            levels.map((level, idx) => (
              <tr key={`${day}-${level}`} className="border-t">
                {idx === 0 && (
                  <td
                    rowSpan={levels.length}
                    className="border px-3 py-2 align-top font-semibold bg-gray-50 text-sm"
                  >
                    {day}
                  </td>
                )}
                {/* MODIFIED LINE: Use the classLabels mapping here */}
                <td className="border px-3 py-2 font-medium text-sm">
                  {classLabels[level] || level.toUpperCase()}
                </td>
                {periods.map((p, pIdx) => {
                  if (['assembly', 'short_break', 'long_break'].includes(p.key)) {
                    return (
                      <td
                        key={pIdx}
                        className="border px-2 py-2 text-center bg-gray-100 italic text-gray-500"
                      >
                        {p.key === 'assembly' ? 'Assembly' : 'Break'}
                      </td>
                    );
                  }

                  // Compute actual teaching period index (excluding breaks)
                  let teachingSlotIndex = 0;
                  for (let i = 0; i <= pIdx; i++) {
                    if (!['assembly', 'short_break', 'long_break'].includes(periods[i].key)) {
                      teachingSlotIndex++;
                    }
                  }

                  const lookupKey = `${day.toLowerCase()} ${level.toLowerCase()} period ${teachingSlotIndex}`;
                  const subjects = timetableMap[lookupKey];

                  return (
                    <td key={pIdx} className="border px-2 py-2 text-center text-sm">
                      {subjects?.join(', ') || ''}
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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-lg text-gray-600">
        ⏳ Loading timetable...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 My Timetable</h2>
      {user.level?.toLowerCase().startsWith('jss') && renderGrid(juniorLevels)}
      {user.level?.toLowerCase().startsWith('ss') && renderGrid(seniorLevels)}
    </div>
  );
};

export default StudentTimetablePage;