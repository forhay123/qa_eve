import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchAllClasses,
  fetchStudentsByClass,
  generateStudentReportCard,
  searchReportCards,
  updateReportCard,
} from '../services/api';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';

const AdminGenerateReportCards = () => {
  const [mode, setMode] = useState('generate');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [term, setTerm] = useState('term_1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [results, setResults] = useState([]);

  const safeNumber = (n) => (n == null || isNaN(n) ? 0 : Number(n));
  const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchAllClasses();
        setClasses(res);
      } catch (err) {
        console.error('Failed to load classes:', err.message);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return setStudents([]);
      const [level, department = ''] = selectedClass.split('-');
      try {
        const res = await fetchStudentsByClass(level, department);
        setStudents(res || []);
      } catch (err) {
        console.error('Failed to load students:', err.message);
        setStudents([]);
      }
    };

    setStudents([]);
    setSelectedStudentId('');
    setResults([]);
    loadStudents();
  }, [selectedClass]);

  const handleGenerate = async () => {
    if (!term || !year || !selectedStudentId) {
      return toast.error('Select class, student, term, and year');
    }

    try {
      await generateStudentReportCard(Number(selectedStudentId), term, year);
      toast.success(`Report card generated for Student ID ${selectedStudentId}`);
    } catch (err) {
      toast.error(err.message || 'Generation failed');
    }
  };

  // ✅ UPDATED handleSearch FUNCTION
  const handleSearch = async () => {
    if (!selectedStudentId || !term || !year) {
      return toast.error('Fill all search fields');
    }

    try {
      const data = await searchReportCards(Number(selectedStudentId), term, year);
      setResults(data);
      if (!data.length) toast.info('No report found for student');
    } catch (err) {
      toast.error(err.message || 'Search failed');
    }
  };

  const handleUpdate = async (id, updatedComment) => {
    try {
      await updateReportCard(id, { comment: updatedComment });
      toast.success('Comment saved');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background text-foreground rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Admin: Report Card Tools</h2>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-6">
        {['generate', 'search'].map((m) => (
          <button
            key={m}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => {
              setMode(m);
              setResults([]);
            }}
          >
            {m === 'generate' ? 'Generate Report Cards' : 'Search & Edit Reports'}
          </button>
        ))}
      </div>

      {/* Common Select Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="class-select">Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="-- Choose Class --" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls, idx) => {
                const value = `${cls.level}-${cls.department || ''}`;
                
                // Apply custom label mapping
                let displayText = `${cls.level.toUpperCase()} ${cls.department?.toUpperCase() || ''}`;
                if (cls.level?.toLowerCase() === "jss1") displayText = "LFC";
                if (cls.level?.toLowerCase() === "jss2") displayText = "LDC";

                return (
                  <SelectItem key={`class-${idx}-${value}`} value={value}>
                    {displayText}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="student-select">Select Student</Label>
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
            disabled={students.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={students.length === 0 ? 'No students found' : '-- Choose Student --'}
              />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={`student-${s.user_id}`} value={String(s.user_id)}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Term + Year Inputs */}
      <select
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="input mb-4"
      >
        <option value="term_1">Term 1</option>
        <option value="term_2">Term 2</option>
        <option value="term_3">Term 3</option>
      </select>

      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="w-full mb-6 px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        min={2000}
        max={2100}
      />

      {/* Generate or Search Button */}
      {mode === 'generate' ? (
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors font-semibold mb-6"
        >
          Generate Report Card
        </button>
      ) : (
        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors font-semibold mb-6"
        >
          Search Report Cards
        </button>
      )}

      {/* Search Results */}
      {mode === 'search' && results.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <h3 className="font-semibold text-lg mb-2">
            Student: {results[0]?.student_name || 'Unknown'}
          </h3>
          <table className="w-full border border-border rounded text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">1st Test</th>
                <th className="p-2 border">2nd Test</th>
                <th className="p-2 border">Exam</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Comment</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const total =
                  r.total ??
                  safeNumber(r.first_test_score) +
                  safeNumber(r.second_test_score) +
                  safeNumber(r.exam_score);
                const grade = getLetterGrade(total);

                return (
                  <tr key={r.id} className="hover:bg-muted/50 text-center">
                    <td className="p-2 border text-left">{r.subject}</td>
                    <td className="p-2 border">{safeNumber(r.first_test_score).toFixed(1)}</td>
                    <td className="p-2 border">{safeNumber(r.second_test_score).toFixed(1)}</td>
                    <td className="p-2 border">{safeNumber(r.exam_score).toFixed(1)}</td>
                    <td className="p-2 border font-bold">{total.toFixed(1)}</td>
                    <td className="p-2 border">{grade}</td>
                    <td className="p-2 border">
                      <input
                        value={r.comment || ''}
                        onChange={(e) =>
                          setResults((prev) =>
                            prev.map((item) =>
                              item.id === r.id ? { ...item, comment: e.target.value } : item
                            )
                          )
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
                        onClick={() => handleUpdate(r.id, r.comment || '')}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminGenerateReportCards;
