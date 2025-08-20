import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Search, UserPlus, CheckCircle, Clock, BarChart3, Users,
    AlertCircle, Loader2, CalendarDays, FileText, Star, TrendingUp,
    Shield, Sparkles, Award, BookOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    fetchMyChildren,
    searchStudents,
    linkChildToParent,
    fetchChildPerformance,
    fetchChildAttendance,
    fetchChildReportCard
} from '../../services/api';
import { toast } from '@/hooks/use-toast'; // Correct toast import
import ChildPerformanceDisplay from '../../components/ChildPerformanceDisplay';
import ChildAttendanceDisplay from '../../components/ChildAttendanceDisplay';
import ChildReportCardDisplay from '../../components/ChildReportCardDisplay';

const ResponsiveParentDashboard = () => {
    const [linkedChildren, setLinkedChildren] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchClass, setSearchClass] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [childPerformance, setChildPerformance] = useState(null);
    const [childAttendance, setChildAttendance] = useState(null);
    const [childReportCard, setChildReportCard] = useState(null);
    const [loading, setLoading] = useState(true); // Initial dashboard loading
    const [searchLoading, setSearchLoading] = useState(false); // Loading for student search
    const [contentLoading, setContentLoading] = useState(false); // Consolidated loading for performance/attendance/report card display

    const [activeView, setActiveView] = useState('performance');

    const [reportCardTerm, setReportCardTerm] = useState('term_1');
    const [reportCardYear, setReportCardYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const getMyLinkedChildren = async () => {
            try {
                setLoading(true);
                const data = await fetchMyChildren();
                setLinkedChildren(data);
            } catch (err) {
                console.error("Failed to fetch linked children:", err);
                // Corrected toast call
                toast.error("Failed to fetch linked children. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        getMyLinkedChildren();
    }, []);

    const handleSearch = useCallback(async () => {
        setSearchResults([]);
        if (!searchTerm.trim() && !searchClass.trim()) {
            // Corrected toast call
            toast.warn("Please enter a search term or class.");
            return;
        }

        try {
            setSearchLoading(true);
            const data = await searchStudents(searchTerm, searchClass);
            setSearchResults(data);
            if (data.length === 0) {
                // Corrected toast call
                toast.info("No students found matching your criteria.");
            } else {
                // Corrected toast call
                toast.success(`Found ${data.length} student(s).`);
            }
        } catch (err) {
            console.error("Failed to search students:", err);
            // Corrected toast call
            toast.error("Failed to search students. Please try again.");
        } finally {
            setSearchLoading(false);
        }
    }, [searchTerm, searchClass]);

    const handleLinkChild = useCallback(async (childId) => {
        try {
            await linkChildToParent(childId);
            // Corrected toast call
            toast.success("Request to link child sent successfully! Awaiting admin approval.");

            const data = await fetchMyChildren();
            setLinkedChildren(data);
            setSearchResults([]);
            setSearchTerm('');
            setSearchClass('');
        } catch (err) {
            console.error("Failed to link child:", err);
            const errorMessage = err?.response?.data?.detail || "Failed to link child. Please try again.";
            // Corrected toast call
            toast.error(errorMessage);
        }
    }, []);

    // New useCallback to clear all child data states
    const resetChildDataViews = useCallback(() => {
        setChildPerformance(null);
        setChildAttendance(null);
        setChildReportCard(null);
    }, []);

    const handleViewChildPerformance = useCallback(async (childId, isApproved) => {
        if (!isApproved) {
            // Corrected toast call
            toast.error("Access Denied: This child's record is awaiting admin approval and cannot be viewed yet.");
            return;
        }

        setSelectedChildId(childId);
        setActiveView('performance');
        resetChildDataViews(); // Clear previous data before loading new
        setContentLoading(true); // Start loading for the content area

        try {
            const performanceData = await fetchChildPerformance(childId);
            setChildPerformance(performanceData);
            // Corrected toast call
            toast.success("Successfully loaded performance data.");
        } catch (err) {
            console.error("Failed to fetch child performance:", err);
            // Corrected toast call
            toast.error("Failed to fetch child performance. Please try again.");
        } finally {
            setContentLoading(false); // End loading for the content area
        }
    }, [resetChildDataViews]); // Dependencies updated

    const handleViewChildAttendance = useCallback(async (childId, isApproved) => {
        if (!isApproved) {
            // Corrected toast call
            toast.error("Access Denied: This child's record is awaiting admin approval and cannot be viewed yet.");
            return;
        }

        setSelectedChildId(childId);
        setActiveView('attendance');
        resetChildDataViews(); // Clear previous data before loading new
        setContentLoading(true); // Start loading for the content area

        try {
            const attendanceData = await fetchChildAttendance(childId);
            setChildAttendance(attendanceData);
            // Corrected toast call
            toast.success("Successfully loaded attendance data.");
        } catch (err) {
            console.error("Failed to fetch child attendance:", err);
            // Corrected toast call
            toast.error("Failed to fetch child attendance. Please try again.");
        } finally {
            setContentLoading(false); // End loading for the content area
        }
    }, [resetChildDataViews]); // Dependencies updated

    const handleViewReportCard = useCallback(async (childId, isApproved) => {
        if (!isApproved) {
            // Corrected toast call
            toast.error("Access Denied: This child's record is awaiting admin approval and cannot be viewed yet.");
            return;
        }

        setSelectedChildId(childId);
        setActiveView('report_card');
        resetChildDataViews(); // Clear previous data before loading new
        setContentLoading(true); // Start loading for the content area

        try {
            const reportCardData = await fetchChildReportCard(childId, reportCardTerm, reportCardYear);
            setChildReportCard(reportCardData);
            // Corrected toast call
            toast.success("Successfully loaded report card data.");
        } catch (err) {
            console.error("Failed to fetch child report card:", err);
            // Corrected toast call
            toast.error("Failed to fetch child report card. Please try again.");
        } finally {
            setContentLoading(false); // End loading for the content area
        }
    }, [resetChildDataViews, reportCardTerm, reportCardYear]); // Dependencies updated

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
                <Card className="w-full max-w-md shadow-elegant bg-gradient-glass border-0">
                    <CardContent className="flex flex-col items-center space-y-6 p-8">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-bold text-foreground">Loading Dashboard</h3>
                            <p className="text-muted-foreground text-lg">Preparing your family portal...</p>
                            <div className="flex items-center justify-center space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const selectedChild = linkedChildren.find(a => a.child.id === selectedChildId);
    const approvedChildren = linkedChildren.filter(a => a.approved);

    return (
        <div className="min-h-screen bg-gradient-subtle">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Enhanced Header Section */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="bg-gradient-primary p-4 rounded-3xl shadow-glow transition-transform duration-300 hover:scale-110">
                                <Users className="w-10 h-10 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                                <div className="bg-gradient-primary p-1 rounded-full shadow-medium">
                                    <Star className="w-4 h-4 text-primary-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                        Family Academic Portal
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Comprehensive oversight of your children's educational journey, academic achievements, and growth milestones
                    </p>

                    {/* Stats Bar */}
                    <div className="flex justify-center mt-8">
                        <div className="bg-gradient-glass rounded-2xl p-6 shadow-elegant border border-border">
                            <div className="flex items-center space-x-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">{linkedChildren.length}</div>
                                    <div className="text-sm text-muted-foreground">Children Linked</div>
                                </div>
                                <Separator orientation="vertical" className="h-8" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-success">{approvedChildren.length}</div>
                                    <div className="text-sm text-muted-foreground">Active Profiles</div>
                                </div>
                                <Separator orientation="vertical" className="h-8" />
                                <div className="text-center">
                                    <div className="flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-success mr-1" />
                                        <span className="text-xl font-bold text-success">Secure</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">Platform</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Search and Link Section */}
                <Card className="mb-10 shadow-elegant bg-gradient-card border-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                    <CardHeader className="pb-6 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-primary/10 p-3 rounded-xl shadow-soft">
                                    <UserPlus className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">Connect New Child</CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground">
                                        Search and request to link your child's academic profile
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="hidden md:flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Verified Parent
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Enter child's name or email address"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 text-lg shadow-soft bg-gradient-glass border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-smooth"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Input
                                    placeholder="Class (e.g., JSS1, SS2)"
                                    value={searchClass}
                                    onChange={(e) => setSearchClass(e.target.value)}
                                    className="h-12 text-lg shadow-soft bg-gradient-glass border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-smooth"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Button
                                    onClick={handleSearch}
                                    disabled={searchLoading}
                                    className="w-full h-12 text-lg bg-gradient-primary shadow-medium hover:shadow-elegant transition-spring font-semibold"
                                >
                                    {searchLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5 mr-3" />
                                            Find Student
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <>
                                <Separator className="my-8" />
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-foreground flex items-center">
                                        <Search className="w-6 h-6 mr-3 text-primary" />
                                        Discovery Results ({searchResults.length})
                                    </h3>
                                    <div className="grid gap-4">
                                        {searchResults.map((student) => (
                                            <div key={student.id} className="flex items-center justify-between p-6 bg-gradient-glass rounded-xl border border-border/50 shadow-soft hover:shadow-medium transition-spring">
                                                <div className="flex items-center space-x-4">
                                                    <div className="bg-primary/10 p-3 rounded-xl shadow-soft">
                                                        <BookOpen className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-card-foreground">{student.full_name}</h4>
                                                        <p className="text-muted-foreground">
                                                            {student.username} • Class: {student.student_class}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleLinkChild(student.id)}
                                                    variant="outline"
                                                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-spring font-semibold"
                                                >
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Request Connection
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Linked Children Section */}
                <Card className="mb-10 shadow-elegant bg-gradient-card border-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                    <CardHeader className="pb-6 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-accent/10 p-3 rounded-xl shadow-soft">
                                    <Users className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">Connected Children</CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground">
                                        Manage and monitor your children's academic profiles
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {approvedChildren.length} Active
                                </Badge>
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    Total: {linkedChildren.length}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        {linkedChildren.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gradient-glass p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-soft">
                                    <Users className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">No Children Connected</h3>
                                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                                    Start building your family academic dashboard by connecting your children's profiles
                                </p>
                                <Button
                                    onClick={() => document.querySelector('input[placeholder*="name"]')?.focus()}
                                    className="bg-gradient-primary shadow-medium hover:shadow-elegant transition-spring"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Find Your Child
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {linkedChildren.map((association) => (
                                    <div key={association.id} className="group relative">
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 bg-gradient-glass rounded-2xl border border-border/50 shadow-soft hover:shadow-medium transition-spring">
                                            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                                                <div className="relative">
                                                    <div className="bg-primary/10 p-4 rounded-2xl shadow-soft group-hover:shadow-medium transition-spring">
                                                        <User className="w-8 h-8 text-primary" />
                                                    </div>
                                                    {association.approved && (
                                                        <div className="absolute -top-2 -right-2 bg-success p-1 rounded-full shadow-medium">
                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-bold text-card-foreground mb-1">
                                                        {association.child.full_name}
                                                    </h4>
                                                    <p className="text-muted-foreground text-lg mb-3">
                                                        Class: {association.child.student_class}
                                                    </p>
                                                    <div className="flex items-center space-x-3">
                                                        {association.approved ? (
                                                            <Badge className="bg-success/10 text-success border-success/20 px-3 py-1">
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Verified & Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-warning/50 text-warning px-3 py-1">
                                                                <Clock className="w-4 h-4 mr-2" />
                                                                Awaiting Verification
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-end lg:justify-start">
                                                <Button
                                                    onClick={() => handleViewChildPerformance(association.child.id, association.approved)}
                                                    disabled={!association.approved || contentLoading}
                                                    variant={association.approved && activeView === 'performance' && selectedChildId === association.child.id ? "default" : "secondary"}
                                                    className={`transition-spring font-medium ${
                                                        association.approved && activeView === 'performance' && selectedChildId === association.child.id
                                                            ? "bg-gradient-primary shadow-medium hover:shadow-elegant"
                                                            : "hover:bg-primary/10"
                                                    }`}
                                                >
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    Performance
                                                </Button>
                                                <Button
                                                    onClick={() => handleViewChildAttendance(association.child.id, association.approved)}
                                                    disabled={!association.approved || contentLoading}
                                                    variant={association.approved && activeView === 'attendance' && selectedChildId === association.child.id ? "default" : "secondary"}
                                                    className={`transition-spring font-medium ${
                                                        association.approved && activeView === 'attendance' && selectedChildId === association.child.id
                                                            ? "bg-gradient-primary shadow-medium hover:shadow-elegant"
                                                            : "hover:bg-primary/10"
                                                    }`}
                                                >
                                                    <CalendarDays className="w-4 h-4 mr-2" />
                                                    Attendance
                                                </Button>
                                                <Button
                                                    onClick={() => handleViewReportCard(association.child.id, association.approved)}
                                                    disabled={!association.approved || contentLoading}
                                                    variant={association.approved && activeView === 'report_card' && selectedChildId === association.child.id ? "default" : "secondary"}
                                                    className={`transition-spring font-medium ${
                                                        association.approved && activeView === 'report_card' && selectedChildId === association.child.id
                                                            ? "bg-gradient-primary shadow-medium hover:shadow-elegant"
                                                            : "hover:bg-primary/10"
                                                    }`}
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Report Card
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Data Display Section */}
                {selectedChildId && (
                    <Card className="shadow-elegant bg-gradient-card border-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                        <CardHeader className="pb-6 relative">
                            <div className="flex items-center space-x-4">
                                <div className="bg-primary/10 p-3 rounded-xl shadow-soft">
                                    {activeView === 'performance' && <BarChart3 className="w-6 h-6 text-primary" />}
                                    {activeView === 'attendance' && <CalendarDays className="w-6 h-6 text-primary" />}
                                    {activeView === 'report_card' && <FileText className="w-6 h-6 text-primary" />}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">
                                        {selectedChild?.child?.full_name}'s {activeView === 'performance' ? 'Performance' : activeView === 'attendance' ? 'Attendance' : 'Report Card'}
                                    </CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground">
                                        Viewing detailed data for {selectedChild?.child?.full_name}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            {contentLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {activeView === 'performance' && childPerformance && (
                                        <ChildPerformanceDisplay performanceData={childPerformance} />
                                    )}
                                    {activeView === 'attendance' && childAttendance && (
                                        <ChildAttendanceDisplay attendanceData={childAttendance} />
                                    )}
                                    {activeView === 'report_card' && childReportCard && (
                                        <ChildReportCardDisplay reportCardData={childReportCard} />
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ResponsiveParentDashboard;
