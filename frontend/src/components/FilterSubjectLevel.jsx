
import React, { useEffect, useState } from 'react';
import { fetchAllSubjectsForAdmin } from '../services/api';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const FilterSubjectLevel = ({ subject, setSubject, level, setLevel }) => {
  const [subjectsData, setSubjectsData] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await fetchAllSubjectsForAdmin();
      setSubjectsData(data);
    };
    fetchSubjects();
  }, []);

  const uniqueSubjects = [...new Set(subjectsData.map((s) => s.name))];
  const uniqueLevels = [...new Set(subjectsData.map((s) => s.level.toUpperCase()))];

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
      <div className="w-full md:w-auto space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subjects</SelectItem>
            {uniqueSubjects.map((subj) => (
              <SelectItem key={subj} value={subj}>
                {subj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-auto space-y-2">
        <Label htmlFor="level">Level</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            {uniqueLevels.map((lvl) => (
              <SelectItem key={lvl} value={lvl.toLowerCase()}>
                {lvl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterSubjectLevel;
