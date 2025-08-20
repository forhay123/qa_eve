
import React, { useEffect, useState } from 'react';
import ChartStudentTopicScores from '../components/ChartStudentTopicScores';
import ChartDailyProgress from '../components/ChartDailyProgress';
import ChartSubjectAverage from '../components/ChartSubjectAverage';
import ChartToggleButtons from '../components/ChartToggleButtons';
import { fetchAdminAnalyticsData, fetchAllSubjectsForAdmin } from '../services/api';
import Layout from '../components/Layout';

const AdminAnalyticsPage = () => {
  const [showStudentScores, setShowStudentScores] = useState(true);
  const [showDailyProgress, setShowDailyProgress] = useState(true);
  const [showSubjectAverage, setShowSubjectAverage] = useState(true);

  const [data, setData] = useState({
    subjectAverages: [],
    studentTopicScores: [],
    dailyScores: [],
  });

  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectOptions, setSubjectOptions] = useState([]);

  const levelOptions = ['jss1', 'jss2'];
  const departmentOptions = ['Science', 'Art', 'Commercial'];
  const isSeniorLevel = level.startsWith('ss');

  useEffect(() => {
    const loadSubjects = async () => {
      if (!level || (isSeniorLevel && !department)) {
        setSubjectOptions([]);
        return;
      }
      try {
        const allSubjects = await fetchAllSubjectsForAdmin(level, department);
        const uniqueSubjects = [...new Set(allSubjects.map((s) => s.name))];
        setSubjectOptions(uniqueSubjects);
      } catch (err) {
        console.error('❌ Error fetching subjects', err);
      }
    };
    loadSubjects();
  }, [level, department]);

  useEffect(() => {
    const fetchData = async () => {
      if (!level) return;
      try {
        const res = await fetchAdminAnalyticsData(subject, level);
        setData({
          subjectAverages: res.subject_average,
          studentTopicScores: res.student_topic_scores,
          dailyScores: res.daily_progress,
        });
      } catch (err) {
        console.error('❌ Error fetching analytics data', err);
      }
    };
    fetchData();
  }, [subject, level]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-card text-card-foreground rounded-lg shadow-lg space-y-6 border border-border">
      <h2 className="text-2xl font-bold">📊 Admin Analytics</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setDepartment('');
            setSubject('');
            setSubjectOptions([]);
          }}
          className="w-full sm:w-auto px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select Level</option>
              {levelOptions.map((lvl) => {
                let displayName = lvl.toUpperCase();
                if (lvl.toLowerCase() === "jss1") displayName = "LFC";
                if (lvl.toLowerCase() === "jss2") displayName = "LDC";
                return (
                  <option key={lvl} value={lvl}>
                    {displayName}
                  </option>
                );
              })}
            </select>

        {isSeniorLevel && (
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setSubject('');
            }}
            className="w-full sm:w-auto px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select Department</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={!level || (isSeniorLevel && !department)}
          className="w-full sm:w-auto px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="">All Subjects</option>
          {subjectOptions
            .filter(
              (subj) =>
                subj.toLowerCase() !== "opening prayer" &&
                subj.toLowerCase() !== "closing prayer"
            )
            .map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
        </select>

      </div>

      {/* Toggle Buttons */}
      <ChartToggleButtons
        showStudentScores={showStudentScores}
        setShowStudentScores={setShowStudentScores}
        showDailyProgress={showDailyProgress}
        setShowDailyProgress={setShowDailyProgress}
        showSubjectAverage={showSubjectAverage}
        setShowSubjectAverage={setShowSubjectAverage}
      />

      {/* Charts */}
      <div className="grid gap-6">
        {showStudentScores && <ChartStudentTopicScores data={data.studentTopicScores} />}
        {showDailyProgress && <ChartDailyProgress data={data.dailyScores} />}
        {showSubjectAverage && <ChartSubjectAverage data={data.subjectAverages} />}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
