import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { 
    AlertCircle, 
    Award, 
    Calendar, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    User,
    GraduationCap,
    BookOpen,
    Target,
    Star
} from 'lucide-react';

const ChildReportCardDisplay = ({ reportCardData }) => {
    console.log("Report Card Data:", reportCardData);

    if (!reportCardData || !reportCardData.subjects || reportCardData.subjects.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-gradient-glass p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-soft">
                    <AlertCircle className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No Report Card Available</h3>
                <p className="text-muted-foreground text-lg mb-2">
                    No report card data is available for the selected term and year.
                </p>
                <p className="text-muted-foreground">
                    Please ensure a report card has been generated for this period.
                </p>
            </div>
        );
    }

    const { student, term, year, level, attendance, subjects } = reportCardData;

    const calculateOverallAverage = () => {
        if (!subjects || subjects.length === 0) return 0;
        const totalScore = subjects.reduce((sum, sub) => sum + (sub.total || 0), 0);
        const maxPossible = subjects.length * 100;
        return ((totalScore / maxPossible) * 100).toFixed(2);
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return "text-success";
        if (percentage >= 80) return "text-info";
        if (percentage >= 70) return "text-warning";
        return "text-destructive";
    };

    const getGradeBadgeVariant = (percentage) => {
        if (percentage >= 90) return "default";
        if (percentage >= 80) return "secondary";
        if (percentage >= 70) return "outline";
        return "destructive";
    };

    const overallAverage = parseFloat(calculateOverallAverage());

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <Card className="shadow-elegant bg-gradient-card border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                <CardHeader className="text-center pb-6 relative">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-gradient-primary p-4 rounded-3xl shadow-glow">
                            <GraduationCap className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-bold text-foreground mb-2">
                        Academic Report Card
                    </CardTitle>
                    <CardDescription className="text-xl text-muted-foreground">
                        {term.replace('_', ' ').toUpperCase()} {year} • {level?.toUpperCase()}
                    </CardDescription>
                    <div className="flex items-center justify-center mt-4">
                        <Badge variant="secondary" className="px-4 py-2 text-lg font-semibold">
                            <Calendar className="w-4 h-4 mr-2" />
                            Official Academic Record
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Student Information */}
            <Card className="shadow-medium bg-gradient-glass border-0">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <User className="w-6 h-6 mr-3 text-primary" />
                        Student Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                            <p className="text-lg font-bold text-foreground">{student?.full_name || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Class Level</p>
                            <p className="text-lg font-bold text-foreground">{level?.toUpperCase() || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Gender</p>
                            <p className="text-lg font-bold text-foreground">{student?.gender || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                            <p className="text-lg font-bold text-foreground">
                                {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Academic Performance */}
            <Card className="shadow-medium bg-gradient-glass border-0">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <BookOpen className="w-6 h-6 mr-3 text-primary" />
                        Academic Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/50">
                                    <TableHead className="text-left font-bold">Subject</TableHead>
                                    <TableHead className="text-center font-bold">1st Test</TableHead>
                                    <TableHead className="text-center font-bold">2nd Test</TableHead>
                                    <TableHead className="text-center font-bold">Exam</TableHead>
                                    <TableHead className="text-center font-bold">Total Score</TableHead>
                                    <TableHead className="text-center font-bold">Grade</TableHead>
                                    <TableHead className="text-left font-bold">Comments</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subject, index) => {
                                    const totalPercentage = ((subject.total || 0) / 100) * 100;
                                    return (
                                        <TableRow key={index} className="border-border/30 hover:bg-muted/20 transition-smooth">
                                            <TableCell className="font-semibold text-foreground">
                                                {subject.subject?.toUpperCase() || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{subject.first_test_score ?? 0}/20</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {(subject.first_test_percentage ?? 0).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{subject.second_test_score ?? 0}/20</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {(subject.second_test_percentage ?? 0).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{subject.exam_score ?? 0}/60</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {(subject.exam_percentage ?? 0).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={`text-xl font-bold ${getGradeColor(totalPercentage)}`}>
                                                    {(subject.total ?? 0).toFixed(1)}/100
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getGradeBadgeVariant(totalPercentage)} className="font-bold">
                                                    {totalPercentage >= 90 ? 'A' : 
                                                     totalPercentage >= 80 ? 'B' : 
                                                     totalPercentage >= 70 ? 'C' : 
                                                     totalPercentage >= 60 ? 'D' : 'F'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs">
                                                {subject.comment || 'No comments available'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Overall Performance Summary */}
            <Card className="shadow-elegant bg-gradient-card border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                <CardHeader className="text-center pb-6 relative">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center">
                        <Award className="w-6 h-6 mr-3 text-primary" />
                        Overall Academic Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative">
                    <div className="space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-primary p-1 shadow-glow">
                                    <div className="w-full h-full rounded-full bg-gradient-glass flex items-center justify-center">
                                        <div className="text-center">
                                            <div className={`text-3xl font-bold ${getGradeColor(overallAverage)}`}>
                                                {overallAverage}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Average</div>
                                        </div>
                                    </div>
                                </div>
                                {overallAverage >= 80 && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-primary p-2 rounded-full shadow-medium">
                                        <Star className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-glass p-4 rounded-xl border border-border/50">
                                <div className="text-lg font-bold text-foreground">{subjects.length}</div>
                                <div className="text-sm text-muted-foreground">Subjects Evaluated</div>
                            </div>
                            <div className="bg-gradient-glass p-4 rounded-xl border border-border/50">
                                <div className="text-lg font-bold text-success">
                                    {subjects.filter(s => ((s.total || 0) / 100) * 100 >= 70).length}
                                </div>
                                <div className="text-sm text-muted-foreground">Subjects Passed</div>
                            </div>
                            <div className="bg-gradient-glass p-4 rounded-xl border border-border/50">
                                <div className={`text-lg font-bold ${getGradeColor(overallAverage)}`}>
                                    {overallAverage >= 90 ? 'Excellent' : 
                                     overallAverage >= 80 ? 'Very Good' : 
                                     overallAverage >= 70 ? 'Good' : 
                                     overallAverage >= 60 ? 'Fair' : 'Needs Improvement'}
                                </div>
                                <div className="text-sm text-muted-foreground">Overall Grade</div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Badge 
                                variant={getGradeBadgeVariant(overallAverage)} 
                                className="text-xl px-6 py-3 font-bold"
                            >
                                <TrendingUp className="w-5 h-5 mr-2" />
                                Academic Standing: {
                                    overallAverage >= 90 ? 'Outstanding' : 
                                    overallAverage >= 80 ? 'Proficient' : 
                                    overallAverage >= 70 ? 'Satisfactory' : 
                                    overallAverage >= 60 ? 'Developing' : 'Requires Support'
                                }
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChildReportCardDisplay;