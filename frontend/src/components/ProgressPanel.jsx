import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  BookOpen,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  RadarIcon,
  Trophy,
  Clock,
  Wine,
  Sparkles,
  Scroll,
  Users,
  CheckCircle2,
  Activity,
  Calendar
} from 'lucide-react';

const ACADEMIC_THEME_COLORS = ['#8B0000', '#B22222', '#6A0505', '#CD5C5C', '#DAA520'];

const ProgressPanel = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [topicProgress, setTopicProgress] = useState([]);
  const [dailyProgress, setDailyProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State to track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const [topicRes, dailyRes, summaryRes, subjectRes] = await Promise.all([
          axios.get('/progress/my-topic-progress', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/progress/my-daily-progress', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/progress/my-summary', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/progress/my-subject-summary', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setTopicProgress(topicRes.data);
        setDailyProgress(dailyRes.data);
        setSummary(summaryRes.data);
        setSubjectSummary(subjectRes.data);
      } catch (err) {
        console.error('Failed to fetch progress', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProgress();
    }
  }, [token]);

  const pieData = summary && summary.total_topics > 0 ? [
    { name: 'Completed Topics', value: Math.min(summary.completed_topics, summary.total_topics) },
    { name: 'Remaining Topics', value: Math.max(summary.total_topics - summary.completed_topics, 0) }
  ] : [];

  const completionRate = summary && summary.total_topics > 0
    ? Math.round((summary.completed_topics / summary.total_topics) * 100)
    : 0;

  // Define chart colors based on the theme
  const chartAxisColor = isDarkMode ? '#DAA520' : '#333';
  const chartGridColor = isDarkMode ? '#6A0505' : '#e0e0e0';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6 bg-white text-gray-900 dark:bg-gradient-to-br dark:from-red-950 dark:to-red-900/30 dark:text-slate-100 min-h-screen">
        <Card className="bg-gray-100 dark:bg-red-950">
          <CardHeader>
            <div className="h-8 bg-gray-300 rounded w-1/3 dark:bg-red-800"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg dark:bg-red-800"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-white text-gray-900 dark:bg-gradient-to-br dark:from-red-950 dark:to-red-900/30 dark:text-slate-100 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-xl bg-gray-200 dark:bg-red-900/50">
            <Wine className="h-8 w-8 text-red-700 dark:text-red-300" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-amber-600 bg-clip-text text-transparent dark:from-red-400 dark:to-amber-200">
            Academic Performance Dashboard
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          Visualize your academic progress with a comprehensive overview of your learning journey and mastery
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Topics Mastered */}
          <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-red-200 text-sm font-medium">Topics Mastered</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-red-100">{summary.completed_topics}</p>
                  <p className="text-gray-500 dark:text-red-300 text-xs mt-1">of {summary.total_topics} total topics</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-800/50">
                  <BookOpen className="h-6 w-6 text-red-700 dark:text-red-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-red-200 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-red-100">{summary.average_score}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3 text-amber-500 dark:text-red-200" />
                    <p className="text-gray-500 dark:text-red-300 text-xs">A solid performance</p>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-800/50">
                  <Target className="h-6 w-6 text-red-700 dark:text-red-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Attempted */}
          <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-red-200 text-sm font-medium">Questions Attempted</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-red-100">{summary.total_questions}</p>
                  <p className="text-gray-500 dark:text-red-300 text-xs mt-1">Total questions</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-800/50">
                  <Activity className="h-6 w-6 text-red-700 dark:text-red-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Completion Rate */}
          <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-red-200 text-sm font-medium">Overall Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-red-100">{completionRate}%</p>
                  <p className="text-gray-500 dark:text-red-300 text-xs mt-1">Overall curriculum progress</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-800/50">
                  <Trophy className="h-6 w-6 text-red-700 dark:text-red-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/50">
                <PieChartIcon className="h-5 w-5 text-red-700 dark:text-red-300" />
              </div>
              <CardTitle className="text-xl text-red-900 dark:text-red-200">Curriculum Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 && pieData.some(d => d.value > 0) ? (
              <div className="flex flex-col items-center space-y-4">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      startAngle={90}
                      endAngle={450}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ACADEMIC_THEME_COLORS[index % ACADEMIC_THEME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-red-200">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-700"></div>Completed ({pieData[0]?.value || 0})
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>Remaining ({pieData[1]?.value || 0})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-red-400 text-center">
                <Scroll className="h-12 w-12 mb-4 opacity-50 mx-auto" />
                <p>No data available. Time to begin your studies!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        {subjectSummary.length > 0 && (
          <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/50">
                  <RadarIcon className="h-5 w-5 text-red-700 dark:text-red-300" />
                </div>
                <CardTitle className="text-xl text-red-900 dark:text-red-200">Discipline Mastery Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={subjectSummary}>
                  <PolarGrid stroke={chartGridColor} />
                  <PolarAngleAxis dataKey="subject_name" stroke={chartAxisColor} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke={chartAxisColor} />
                  <Radar
                    name="Average Score"
                    dataKey="average_score"
                    stroke="#B22222"
                    fill="#B22222"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Progress */}
      <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/50">
              <Calendar className="h-5 w-5 text-red-700 dark:text-red-300" />
            </div>
            <CardTitle className="text-xl text-red-900 dark:text-red-200">Daily Activity Log</CardTitle>
            <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-600 dark:bg-red-950 dark:border-red-900 dark:text-red-200">Last 7 days</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {dailyProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-red-400 text-center">
              <Clock className="h-12 w-12 mb-4 opacity-50 mx-auto" />
              <p>No recent sessions logged</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyProgress}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B0000" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B0000" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="questionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CD5C5C" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#CD5C5C" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="date" stroke={chartAxisColor} />
                <YAxis stroke={chartAxisColor} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_score" fill="url(#scoreGradient)" name="Total Score" />
                <Bar dataKey="total_questions" fill="url(#questionsGradient)" name="Questions Attempted" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Topic Progress Grid */}
      <Card className="border-0 shadow-lg bg-gray-100 dark:bg-red-950 dark:border-red-900">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/50">
              <BookOpen className="h-5 w-5 text-red-700 dark:text-red-300" />
            </div>
            <CardTitle className="text-xl text-red-900 dark:text-red-200">Topic Mastery Progress</CardTitle>
            <Badge variant="outline" className="ml-auto bg-gray-200 text-gray-600 dark:bg-red-950 dark:border-red-900 dark:text-red-200">{topicProgress.length} topics</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {topicProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-red-400">
              <Users className="h-8 w-8 opacity-50" />
              <p className="ml-2">No topics in the curriculum</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicProgress.map((tp, idx) => {
                const progressPercentage = tp.total_questions > 0
                  ? (tp.total_score / tp.total_questions) * 100
                  : 0;
                const isCompleted = progressPercentage >= 80;

                return (
                  <Card key={idx} className="group border border-gray-300 dark:border-red-900 hover:border-red-700 transition-all hover:shadow-md hover:-translate-y-1 bg-white dark:bg-red-950">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant={isCompleted ? "default" : "secondary"} className={`${isCompleted ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-red-900 dark:text-red-200'}`}>
                            {tp.subject_name}
                          </Badge>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-red-100">{tp.topic_title}</h4>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-red-300">Mastery Score</span>
                          <span className="font-medium text-gray-900 dark:text-red-100">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2 [&>div]:bg-red-500" />
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-red-300">
                          <span>{tp.total_score} correct answers</span>
                          <span>{tp.total_questions} total questions</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPanel;
