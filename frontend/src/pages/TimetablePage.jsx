import React, { useEffect, useState } from 'react';
import { fetchStudentTimetable } from '../api/api';

const TimetablePage = () => {
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    const loadTimetable = async () => {
      const data = await fetchStudentTimetable();
      setTimetable(data);
    };
    loadTimetable();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Your Timetable</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Day</th>
              <th className="px-4 py-2 border">Period</th>
              <th className="px-4 py-2 border">Subject</th>
              <th className="px-4 py-2 border">Start Time</th>
              <th className="px-4 py-2 border">End Time</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{item.day}</td>
                <td className="px-4 py-2 border">{item.period}</td>
                <td className="px-4 py-2 border">{item.subject}</td>
                <td className="px-4 py-2 border">{item.start_time}</td>
                <td className="px-4 py-2 border">{item.end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetablePage;
