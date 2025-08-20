import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    Info, 
    CalendarDays, 
    TrendingUp, 
    AlertTriangle,
    Award,
    Target,
    BarChart3
} from 'lucide-react';

const AttendanceStatusIcon = ({ status }) => {
    const iconProps = "w-5 h-5 mr-2";
    
    switch (status.toLowerCase()) {
        case 'present':
            return <CheckCircle className={`${iconProps} text-success`} />;
        case 'absent':
            return <XCircle className={`${iconProps} text-destructive`} />;
        case 'late':
            return <Clock className={`${iconProps} text-warning`} />;
        case 'excused':
            return <Info className={`${iconProps} text-info`} />;
        default:
            return null;
    }
};

const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'present':
            return 'bg-success/10 text-success border-success/20';
        case 'absent':
            return 'bg-destructive/10 text-destructive border-destructive/20';
        case 'late':
            return 'bg-warning/10 text-warning border-warning/20';
        case 'excused':
            return 'bg-info/10 text-info border-info/20';
        default:
            return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
};

const ChildAttendanceDisplay = ({ attendanceData }) => {
    const attendanceStats = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) {
            return {
                totalDays: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                attendanceRate: 0,
                punctualityRate: 0
            };
        }

        const totalDays = attendanceData.length;
        const presentCount = attendanceData.filter(record => record.status.toLowerCase() === 'present').length;
        const absentCount = attendanceData.filter(record => record.status.toLowerCase() === 'absent').length;
        const lateCount = attendanceData.filter(record => record.status.toLowerCase() === 'late').length;
        const excusedCount = attendanceData.filter(record => record.status.toLowerCase() === 'excused').length;
        
        const attendanceRate = totalDays > 0 ? ((presentCount + lateCount) / totalDays) * 100 : 0;
        const punctualityRate = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

        return {
            totalDays,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            attendanceRate,
            punctualityRate
        };
    }, [attendanceData]);

    if (!attendanceData || attendanceData.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-gradient-glass p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-soft">
                    <CalendarDays className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No Attendance Records</h3>
                <p className="text-muted-foreground text-lg">
                    No attendance data is available for this child at the moment.
                </p>
            </div>
        );
    }

    const { totalDays, presentCount, absentCount, lateCount, excusedCount, attendanceRate, punctualityRate } = attendanceStats;
    
    // Sort attendance data by date in descending order
    const sortedAttendance = [...attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getAttendanceGrade = (rate) => {
        if (rate >= 95) return { grade: 'Excellent', color: 'text-success', variant: 'default' };
        if (rate >= 90) return { grade: 'Very Good', color: 'text-info', variant: 'secondary' };
        if (rate >= 85) return { grade: 'Good', color: 'text-warning', variant: 'outline' };
        if (rate >= 75) return { grade: 'Satisfactory', color: 'text-warning', variant: 'outline' };
        return { grade: 'Needs Improvement', color: 'text-destructive', variant: 'destructive' };
    };

    const attendanceGrade = getAttendanceGrade(attendanceRate);

    return (
        <div className="space-y-8">
            {/* Overview Statistics */}
            <Card className="shadow-elegant bg-gradient-card border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                <CardHeader className="pb-6 relative">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-primary" />
                        Attendance Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Attendance Rate */}
                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground">Overall Attendance</h3>
                                <Award className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-end space-x-2">
                                    <span className={`text-4xl font-bold ${attendanceGrade.color}`}>
                                        {attendanceRate.toFixed(1)}%
                                    </span>
                                    <Badge variant={attendanceGrade.variant} className="mb-1">
                                        {attendanceGrade.grade}
                                    </Badge>
                                </div>
                                <Progress value={attendanceRate} className="h-3 bg-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">
                                    Based on {totalDays} total school days
                                </p>
                            </div>
                        </div>

                        {/* Punctuality Rate */}
                        <div className="bg-gradient-glass p-6 rounded-xl border border-border/50 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground">Punctuality</h3>
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-end space-x-2">
                                    <span className="text-4xl font-bold text-info">
                                        {punctualityRate.toFixed(1)}%
                                    </span>
                                    <Badge variant="secondary" className="mb-1">
                                        On Time
                                    </Badge>
                                </div>
                                <Progress value={punctualityRate} className="h-3 bg-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">
                                    {presentCount} days arrived on time
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center bg-success/10 border border-success/20 shadow-soft">
                            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                            <div className="text-2xl font-bold text-success">{presentCount}</div>
                            <div className="text-sm text-muted-foreground">Present</div>
                        </Card>
                        <Card className="p-4 text-center bg-destructive/10 border border-destructive/20 shadow-soft">
                            <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <div className="text-2xl font-bold text-destructive">{absentCount}</div>
                            <div className="text-sm text-muted-foreground">Absent</div>
                        </Card>
                        <Card className="p-4 text-center bg-warning/10 border border-warning/20 shadow-soft">
                            <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
                            <div className="text-2xl font-bold text-warning">{lateCount}</div>
                            <div className="text-sm text-muted-foreground">Late</div>
                        </Card>
                        <Card className="p-4 text-center bg-info/10 border border-info/20 shadow-soft">
                            <Info className="w-8 h-8 text-info mx-auto mb-2" />
                            <div className="text-2xl font-bold text-info">{excusedCount}</div>
                            <div className="text-sm text-muted-foreground">Excused</div>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Detailed Records */}
            <Card className="shadow-medium bg-gradient-glass border-0">
                <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold flex items-center">
                            <CalendarDays className="w-6 h-6 mr-3 text-primary" />
                            Daily Attendance Records
                        </CardTitle>
                        <Badge variant="secondary" className="px-3 py-1">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Latest {Math.min(sortedAttendance.length, 20)} Days
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedAttendance.slice(0, 20).map((record) => (
                            <Card key={record.id} className="shadow-soft border border-border/50 hover:shadow-medium transition-smooth bg-gradient-glass">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-bold text-foreground">
                                            {format(new Date(record.date), 'MMM dd, yyyy')}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(record.date), 'EEEE')}
                                        </p>
                                    </div>
                                    <AttendanceStatusIcon status={record.status} />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Badge
                                        className={`w-full justify-center py-2 px-4 text-sm font-bold border ${getStatusColor(record.status)}`}
                                    >
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    
                    {sortedAttendance.length > 20 && (
                        <div className="mt-6 text-center">
                            <Badge variant="outline" className="px-4 py-2">
                                Showing {Math.min(20, sortedAttendance.length)} of {sortedAttendance.length} total records
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Insights */}
            {(absentCount > 0 || lateCount > 3) && (
                <Card className="shadow-medium bg-gradient-glass border-0 border-l-4 border-l-warning">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold flex items-center text-warning">
                            <AlertTriangle className="w-5 h-5 mr-3" />
                            Attendance Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {absentCount > 0 && (
                                <p className="text-muted-foreground">
                                    • Student has been absent for {absentCount} {absentCount === 1 ? 'day' : 'days'} this term.
                                </p>
                            )}
                            {lateCount > 3 && (
                                <p className="text-muted-foreground">
                                    • Student has been late {lateCount} times, which may impact learning outcomes.
                                </p>
                            )}
                            {attendanceRate < 85 && (
                                <p className="text-muted-foreground">
                                    • Current attendance rate is below the recommended 85% threshold.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ChildAttendanceDisplay;