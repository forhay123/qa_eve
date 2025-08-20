import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Trophy, BookOpen, Clock, CheckCircle, Target, TrendingUp, CalendarDays, 
    ListChecks, BarChart3, AlertCircle, Award, Star, GraduationCap,
    Brain, Zap, Activity
} from 'lucide-react';

const ChildPerformanceDisplay = ({ performanceData }) => {
    // Memoize calculations for performance
    const {
        overallAverageScore,
        totalTopicsAttempted,
        topicsCompleted,
        subjectPerformance,
        recentActivities,
        performanceGrade,
        strongestSubject,
        improvementAreas
    } = useMemo(() => {
        if (!performanceData || performanceData.length === 0) {
            return {
                overallAverageScore: 0,
                totalTopicsAttempted: 0,
                topicsCompleted: 0,
                subjectPerformance: [],
                recentActivities: [],
                performanceGrade: { grade: 'No Data', color: 'text-muted-foreground', variant: 'outline' },
                strongestSubject: null,
                improvementAreas: []
            };
        }

        let totalScoreSum = 0;
        let totalQuestionsSum = 0;
        const uniqueTopics = new Set();
        const completedTopicsSet = new Set();
        const subjectsMap = new Map();

        performanceData.forEach(record => {
            totalScoreSum += record.score;
            totalQuestionsSum += record.total_questions;
            uniqueTopics.add(record.topic_id);

            // A topic is considered 'completed' if the score is above 70% of total questions
            if (record.total_questions > 0 && (record.score / record.total_questions) >= 0.7) {
                completedTopicsSet.add(record.topic_id);
            }

            if (!subjectsMap.has(record.subject_name)) {
                subjectsMap.set(record.subject_name, { score: 0, questions: 0, attempts: 0 });
            }
            const subjectStats = subjectsMap.get(record.subject_name);
            subjectStats.score += record.score;
            subjectStats.questions += record.total_questions;
            subjectStats.attempts += 1;
        });

        const overallAvg = totalQuestionsSum > 0 ? (totalScoreSum / totalQuestionsSum) * 100 : 0;

        const subjectsArray = Array.from(subjectsMap.entries()).map(([name, stats]) => ({
            subject_name: name,
            average_score: stats.questions > 0 ? (stats.score / stats.questions) * 100 : 0,
            attempts: stats.attempts
        })).sort((a, b) => b.average_score - a.average_score);

        // Determine performance grade
        let performanceGrade;
        if (overallAvg >= 90) {
            performanceGrade = { grade: 'Outstanding', color: 'text-success', variant: 'default' };
        } else if (overallAvg >= 80) {
            performanceGrade = { grade: 'Excellent', color: 'text-info', variant: 'secondary' };
        } else if (overallAvg >= 70) {
            performanceGrade = { grade: 'Good', color: 'text-warning', variant: 'outline' };
        } else if (overallAvg >= 60) {
            performanceGrade = { grade: 'Fair', color: 'text-warning', variant: 'outline' };
        } else {
            performanceGrade = { grade: 'Needs Improvement', color: 'text-destructive', variant: 'destructive' };
        }

        const strongestSubject = subjectsArray.length > 0 ? subjectsArray[0] : null;
        const improvementAreas = subjectsArray.filter(subject => subject.average_score < 70);

        const sortedActivities = [...performanceData]
            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
            .slice(0, 8);

        return {
            overallAverageScore: parseFloat(overallAvg.toFixed(2)),
            totalTopicsAttempted: uniqueTopics.size,
            topicsCompleted: completedTopicsSet.size,
            subjectPerformance: subjectsArray,
            recentActivities: sortedActivities,
            performanceGrade,
            strongestSubject,
            improvementAreas
        };
    }, [performanceData]);

    if (!performanceData || performanceData.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-gradient-glass p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-soft">
                    <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No Performance Data Available</h3>
                <p className="text-muted-foreground text-lg mb-4">
                    Your child hasn't completed any academic activities yet.
                </p>
                <Badge variant="outline" className="px-4 py-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start Learning Journey
                </Badge>
            </div>
        );
    }

    const completionRate = totalTopicsAttempted > 0 ? (topicsCompleted / totalTopicsAttempted) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Performance Overview Dashboard */}
            <Card className="shadow-elegant bg-gradient-card border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                <CardHeader className="pb-6 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
                                <GraduationCap className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">Academic Performance Dashboard</CardTitle>
                                <CardDescription className="text-lg text-muted-foreground">
                                    Comprehensive analysis of learning progress and achievements
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant={performanceGrade.variant} className="px-4 py-2 text-lg font-bold">
                            <Star className="w-4 h-4 mr-2" />
                            {performanceGrade.grade}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <Brain className="w-8 h-8 text-primary" />
                                <Badge variant="secondary">Score</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-3xl font-bold ${performanceGrade.color}`}>
                                    {overallAverageScore}%
                                </div>
                                <div className="text-sm text-muted-foreground">Overall Average</div>
                                <Progress value={overallAverageScore} className="h-3 bg-muted-foreground/20" />
                            </div>
                        </div>

                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <BookOpen className="w-8 h-8 text-info" />
                                <Badge variant="secondary">Topics</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-info">{totalTopicsAttempted}</div>
                                <div className="text-sm text-muted-foreground">Topics Attempted</div>
                                <div className="flex items-center space-x-2">
                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Active Learning</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <CheckCircle className="w-8 h-8 text-success" />
                                <Badge variant="secondary">Progress</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-success">{topicsCompleted}</div>
                                <div className="text-sm text-muted-foreground">Topics Mastered</div>
                                <Progress value={completionRate} className="h-3 bg-muted-foreground/20" />
                            </div>
                        </div>

                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <Zap className="w-8 h-8 text-warning" />
                                <Badge variant="secondary">Subjects</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-warning">{subjectPerformance.length}</div>
                                <div className="text-sm text-muted-foreground">Active Subjects</div>
                                <div className="flex items-center space-x-2">
                                    <Target className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Multi-disciplinary</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subject Performance Analysis */}
            <Card className="shadow-medium bg-gradient-glass border-0">
                <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-primary" />
                        Subject Performance Breakdown
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Detailed analysis of performance across different academic subjects
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subjectPerformance.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No subject performance data available.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Top Performer Highlight */}
                            {strongestSubject && (
                                <div className="bg-gradient-primary/10 p-6 rounded-xl border border-primary/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-foreground flex items-center">
                                            <Trophy className="w-6 h-6 mr-3 text-primary" />
                                            Strongest Subject
                                        </h3>
                                        <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1">
                                            <Award className="w-4 h-4 mr-1" />
                                            Top Performer
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-primary">
                                                {strongestSubject.subject_name.toUpperCase()}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {strongestSubject.attempts} learning sessions completed
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-success">
                                                {strongestSubject.average_score.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Average Score</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subject Performance Grid */}
                            <div className="space-y-4">
                                {subjectPerformance.map((subject, index) => (
                                    <div key={index} className="bg-gradient-glass p-4 rounded-xl border border-border/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-primary/10 p-2 rounded-lg">
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-lg">
                                                        {subject.subject_name.toUpperCase()}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {subject.attempts} learning sessions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-foreground">
                                                    {subject.average_score.toFixed(1)}%
                                                </div>
                                                <Badge 
                                                    variant={subject.average_score >= 80 ? "default" : subject.average_score >= 70 ? "secondary" : "outline"}
                                                    className="mt-1"
                                                >
                                                    {subject.average_score >= 80 ? "Excellent" : subject.average_score >= 70 ? "Good" : "Improving"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Progress value={subject.average_score} className="h-3 bg-muted-foreground/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Learning Activities */}
            <Card className="shadow-medium bg-gradient-glass border-0">
                <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <ListChecks className="w-6 h-6 mr-3 text-primary" />
                        Recent Learning Activities
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Latest completed topics and learning achievements
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentActivities.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No recent learning activities found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/50">
                                        <TableHead className="font-bold">Topic</TableHead>
                                        <TableHead className="font-bold">Subject</TableHead>
                                        <TableHead className="text-center font-bold">Score</TableHead>
                                        <TableHead className="text-center font-bold">Accuracy</TableHead>
                                        <TableHead className="text-center font-bold">Status</TableHead>
                                        <TableHead className="text-right font-bold">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivities.map(activity => {
                                        const accuracy = activity.total_questions > 0 ? 
                                            ((activity.score / activity.total_questions) * 100) : 0;
                                        const isExcellent = accuracy >= 85;
                                        const isGood = accuracy >= 70;
                                        
                                        return (
                                            <TableRow key={activity.id} className="border-border/30 hover:bg-muted/20 transition-smooth">
                                                <TableCell className="font-semibold text-foreground">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="bg-primary/10 p-1 rounded">
                                                            <BookOpen className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span>{activity.topic_title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {activity.subject_name.toUpperCase()}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {activity.score}/{activity.total_questions}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`font-bold ${
                                                        isExcellent ? 'text-success' : 
                                                        isGood ? 'text-info' : 'text-warning'
                                                    }`}>
                                                        {accuracy.toFixed(1)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge 
                                                        variant={isExcellent ? "default" : isGood ? "secondary" : "outline"}
                                                        className="font-medium"
                                                    >
                                                        {isExcellent ? (
                                                            <>
                                                                <Star className="w-3 h-3 mr-1" />
                                                                Mastered
                                                            </>
                                                        ) : isGood ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Good
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                                Improving
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {new Date(activity.completed_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Improvement Recommendations */}
            {improvementAreas.length > 0 && (
                <Card className="shadow-medium bg-gradient-glass border-0 border-l-4 border-l-warning">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold flex items-center text-warning">
                            <Target className="w-5 h-5 mr-3" />
                            Areas for Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                The following subjects show potential for improvement with focused practice:
                            </p>
                            <div className="grid gap-3">
                                {improvementAreas.slice(0, 3).map((subject, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                                        <span className="font-medium text-foreground">
                                            {subject.subject_name.toUpperCase()}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-warning font-bold">
                                                {subject.average_score.toFixed(1)}%
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                Focus Area
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ChildPerformanceDisplay;