import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../services/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Trophy,
  Calendar,
  Target,
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

const PerformanceIndicator = ({ score, totalQuestions }) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: "excellent", color: "text-green-600 dark:text-green-400", icon: Trophy };
    if (percentage >= 80) return { level: "very good", color: "text-blue-600 dark:text-blue-400", icon: Award };
    if (percentage >= 70) return { level: "good", color: "text-yellow-600 dark:text-yellow-400", icon: CheckCircle };
    if (percentage >= 60) return { level: "average", color: "text-orange-600 dark:text-orange-400", icon: Target };
    return { level: "needs improvement", color: "text-red-600 dark:text-red-400", icon: XCircle };
  };

  const performance = getPerformanceLevel();
  const Icon = performance.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${performance.color} border-current dark:border-current`}>
        <Icon className="h-3 w-3 mr-1" />
        {percentage}%
      </Badge>
      <span className={`text-xs font-medium ${performance.color} capitalize`}>
        {performance.level}
      </span>
    </div>
  );
};

const ResultCard = ({ result, index }) => {
  const percentage = result.total_questions > 0
    ? Math.round((result.score / result.total_questions) * 100)
    : 0;
  const completedDate = result.completed_at
    ? new Date(result.completed_at).toLocaleDateString('en-US', {
        year: "numeric", month: "short", day: "numeric"
      })
    : "N/A";

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group dark:border-l-primary/50 dark:hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors dark:bg-primary/20 dark:group-hover:bg-primary/30">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold leading-tight">
                {result.subject_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {result.topic_title}
              </p>
            </div>
          </div>
          <Badge variant="secondary">#{index + 1}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance</span>
            <PerformanceIndicator score={result.score} totalQuestions={result.total_questions} />
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg dark:bg-muted/50">
            <div className="text-lg font-bold text-primary">{result.score}</div>
            <div className="text-xs text-muted-foreground">Score Achieved</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg dark:bg-muted/50">
            <div className="text-lg font-bold text-muted-foreground">{result.total_questions}</div>
            <div className="text-xs text-muted-foreground">Total Questions</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Completed</span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{completedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const SummaryStats = ({ results }) => {
  const totalResults = results.length;
  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalQuestions = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
  const averagePercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const passCount = results.filter(r => {
    const percentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
    return percentage >= 60;
  }).length;
  const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

  const stats = [
    {
      label: "Average Score",
      value: `${averagePercentage}%`,
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-300",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/30"
    },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30"
    },
    {
      label: "Completed",
      value: totalResults,
      icon: Award,
      color: "text-amber-600 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-900/30"
    }
  ];


  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`text-center p-4 rounded-lg ${stat.bgColor}`}>
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectFilter, setSubjectFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${BASE_URL}/student/results`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(data || []);
      } catch (err) {
        console.error("❌ Failed to fetch results:", err);
        toast({
          title: "Error",
          description: "Could not load your results.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filteredResults = [...results].filter((r) => {
    const matchesSubject = subjectFilter ? r.subject_name === subjectFilter : true;
    const completedDate = r.completed_at ? new Date(r.completed_at) : null;

    const matchesStart = startDate ? completedDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? completedDate <= new Date(endDate) : true;

    return matchesSubject && matchesStart && matchesEnd;
  });

  const sortedResults = filteredResults.sort((a, b) =>
    new Date(b.completed_at || 0) - new Date(a.completed_at || 0)
  );

  const uniqueSubjects = [...new Set(results.map(r => r.subject_name))];

  return (
    <div className="container mx-auto py-6 px-4 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center dark:bg-primary/20">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Academic Results</h1>
            <p className="text-muted-foreground mt-1">
              Track your performance across all completed assessments
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 animate-spin" />
                <span>Loading your results...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
              <p>Complete some assessments to see your results here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Statistics */}
          <SummaryStats results={filteredResults} />

          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Assessment Results
            </h2>
            <Badge variant="outline">
              {filteredResults.length} {filteredResults.length === 1 ? "Result" : "Results"}
            </Badge>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResults.map((result, index) => (
              <ResultCard
                key={`${result.subject_name}-${result.topic_title}-${index}`}
                result={result}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsPage;
