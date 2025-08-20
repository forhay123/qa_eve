import React, { useEffect, useState } from 'react';
import { getStudentAchievements } from '../services/api';
import Layout from '../components/Layout';

const AchievementsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const result = await getStudentAchievements();
        setData(result);
      } catch (error) {
        console.error('❌ Failed to fetch achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-lg text-muted-foreground">
        ⏳ Loading achievements...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-destructive text-lg">
        ❌ No achievements found.
      </div>
    );
  }

  const totalTopics = data.topic_progress?.length || 0;
  const totalTests = data.tests?.length || 0;
  const totalExams = data.exams?.length || 0;

  const averageScore = (() => {
    const scores = [...data.tests, ...data.exams].map(r => r.percentage);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  })();

  return (
      <div className="p-6 max-w-5xl mx-auto bg-background text-foreground">
        <h2 className="text-3xl font-bold mb-6">🏆 My Achievements</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card text-card-foreground p-5 rounded shadow hover:shadow-md transition border border-border">
            <h4 className="text-muted-foreground font-medium mb-1">✅ Topics Completed</h4>
            <p className="text-4xl font-bold text-green-500">{totalTopics}</p>
          </div>
          <div className="bg-card text-card-foreground p-5 rounded shadow hover:shadow-md transition border border-border">
            <h4 className="text-muted-foreground font-medium mb-1">🧪 Tests + Exams</h4>
            <p className="text-4xl font-bold text-blue-500">{totalTests + totalExams}</p>
          </div>
          <div className="bg-card text-card-foreground p-5 rounded shadow hover:shadow-md transition border border-border">
            <h4 className="text-muted-foreground font-medium mb-1">📊 Average Score</h4>
            <p className="text-4xl font-bold text-purple-500">{averageScore}%</p>
          </div>
        </div>

        {/* Tests */}
        <Section title="🧪 Test Results" data={data.tests}>
          {data.tests.map((t, i) => (
            <ListItem key={i} label={t.subject} detail={`${t.percentage}% (${t.total_score}/${t.total_questions})`} />
          ))}
        </Section>

        {/* Exams */}
        <Section title="🎓 Exam Results" data={data.exams}>
          {data.exams.map((e, i) => (
            <ListItem key={i} label={e.subject} detail={`${e.percentage}% (${e.total_score}/${e.total_questions})`} />
          ))}
        </Section>

        {/* Topic Progress */}
        <Section title="📚 Topic Progress" data={data.topic_progress}>
          {data.topic_progress.map((t, i) => (
            <ListItem key={i} label={`${t.topic_title} (${t.subject_name})`} detail={`${t.total_score}/${t.total_questions}`} />
          ))}
        </Section>

        {/* Daily Progress */}
        <Section title="📅 Daily Progress" data={data.daily_progress}>
          {data.daily_progress.map((d, i) => (
            <ListItem key={i} label={d.date} detail={`${d.total_score}/${d.total_questions}`} />
          ))}
        </Section>

        {/* Weekly Progress */}
        <Section title="🗓 Weekly Progress" data={data.weekly_progress}>
          {data.weekly_progress.map((w, i) => (
            <ListItem key={i} label={w.week} detail={`${w.total_score}/${w.total_questions}`} />
          ))}
        </Section>
      </div>
  );
};

// Reusable section component
const Section = ({ title, data, children }) => (
  <div className="mb-10">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    {data && data.length > 0 ? (
      <ul className="space-y-2">{children}</ul>
    ) : (
      <p className="text-muted-foreground">No data available.</p>
    )}
  </div>
);

// Reusable item display
const ListItem = ({ label, detail }) => (
  <li className="bg-muted/30 p-4 rounded shadow-sm flex justify-between items-center border border-border">
    <span className="font-medium">{label}</span>
    <span className="text-sm text-muted-foreground">{detail}</span>
  </li>
);

export default AchievementsPage;