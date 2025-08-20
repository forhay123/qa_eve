import React, { useEffect, useState, useMemo } from 'react';
import { fetchAdminDashboardData } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { 
  Trophy, Users, Activity, TrendingUp, Calendar, 
  Medal, Crown, Award, Clock, UserCheck, 
  BarChart3, ChevronUp, ChevronDown, Filter, CalendarIcon, Search,
  Eye, MoreVertical, Star, Zap, ChevronRight, Globe, Wifi, WifiOff
} from 'lucide-react';

const AdminActivityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Separate states for better control
  const [topStudents, setTopStudents] = useState([]);
  const [filteredTopStudents, setFilteredTopStudents] = useState([]);
  const [logins, setLogins] = useState([]);
  const [filteredLogins, setFilteredLogins] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    class: '',
    department: '',
    status: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await fetchAdminDashboardData();
      setDashboardData(data);
      
      // Set separate states and debug
      setTopStudents(data.topStudents || []);
      setFilteredTopStudents(data.topStudents || []);
      setLogins(data.logins || []);
      setFilteredLogins(data.logins || []);
      
      // Debug: Print to console
      console.log("Top Students:", data.topStudents || []);
      console.log("Logins:", data.logins || []);
      
      setError('');
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Apply filters using useEffect for better control
  useEffect(() => {
    const filtered = topStudents.filter((student) => {
      const classMatch = !filters.class || student.level === filters.class;
      const deptMatch = !filters.department || student.department === filters.department;
      const searchMatch = !filters.searchTerm || 
        student.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      return classMatch && deptMatch && searchMatch;
    });

    setFilteredTopStudents(filtered);
    
    // Debug: Print filtered results
    console.log("Filtered Top Students:", filtered);
  }, [topStudents, filters]);

  useEffect(() => {
    const filtered = logins.filter((user) => {
      const loginDate = new Date(user.last_login);
      const loginDateStr = loginDate.toISOString().split('T')[0];
      
      // Date filters
      if (filters.dateFrom && loginDate < filters.dateFrom) return false;
      if (filters.dateTo && loginDate > filters.dateTo) return false;
      
      // Class filter
      if (filters.class && user.level !== filters.class) return false;
      
      // Department filter  
      if (filters.department && user.department !== filters.department) return false;
      
      // Status filter (online/offline based on recent activity)
      if (filters.status) {
        const now = new Date();
        const timeDiff = now.getTime() - loginDate.getTime();
        const isOnline = timeDiff < 15 * 60 * 1000; // Online if logged in within 15 minutes
        
        if (filters.status === 'online' && !isOnline) return false;
        if (filters.status === 'offline' && isOnline) return false;
      }
      
      // Search filter
      if (filters.searchTerm && !user.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    setFilteredLogins(filtered);
    
    // Debug: Print filtered results
    console.log("Filtered Logins:", filtered);
  }, [logins, filters]);

  // Analytics computations using filtered data
  const analytics = useMemo(() => {
    return {
      totalActiveUsers: filteredLogins.length,
      averagePerformance: filteredTopStudents.length > 0 
        ? Math.round(filteredTopStudents.reduce((sum, s) => sum + s.average_score, 0) / filteredTopStudents.length)
        : 0,
      excellentStudents: filteredTopStudents.filter(s => s.average_score >= 80).length,
      recentActivity: filteredLogins.filter(user => {
        const loginDate = new Date(user.last_login);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return loginDate >= yesterday;
      }).length
    };
  }, [filteredLogins, filteredTopStudents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-semibold">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="p-6 space-y-8">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Admin Activity Dashboard</h1>
              <p className="text-muted-foreground">Real-time insights and analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              onClick={() => loadData(true)}
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Refreshing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters(prev => ({...prev, dateFrom: date}))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters(prev => ({...prev, dateTo: date}))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Class Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={filters.class || 'all'} onValueChange={(value) => setFilters(prev => ({...prev, class: value === 'all' ? '' : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="jss1">JSS1</SelectItem>
                      <SelectItem value="jss2">JSS2</SelectItem>
                      <SelectItem value="jss3">JSS3</SelectItem>
                      <SelectItem value="ss1">SS1</SelectItem>
                      <SelectItem value="ss2">SS2</SelectItem>
                      <SelectItem value="ss3">SS3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={filters.department || 'all'} onValueChange={(value) => setFilters(prev => ({...prev, department: value === 'all' ? '' : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({...prev, status: value === 'all' ? '' : value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    dateFrom: null,
                    dateTo: null,
                    class: '',
                    department: '',
                    status: '',
                    searchTerm: ''
                  })}
                  className="gap-2"
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Active Users</p>
                    <p className="text-3xl font-bold">{analytics.totalActiveUsers}</p>
                    <p className="text-blue-200 text-xs">Recent logins</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Top Performers</p>
                    <p className="text-3xl font-bold">{topStudents.length}</p>
                    <p className="text-emerald-200 text-xs">Students tracked</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Avg Performance</p>
                    <p className="text-3xl font-bold">{analytics.averagePerformance}%</p>
                    <p className="text-amber-200 text-xs">Overall score</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Excellence Rate</p>
                    <p className="text-3xl font-bold">{analytics.excellentStudents}</p>
                    <p className="text-purple-200 text-xs">Students ≥80%</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Distribution Chart */}
        {topStudents.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {topStudents.filter(s => s.average_score >= 80).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Excellent (80%+)</p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {topStudents.filter(s => s.average_score >= 60 && s.average_score < 80).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Good (60-79%)</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {topStudents.filter(s => s.average_score < 60).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Needs Support (&lt;60%)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Recent Logins Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card via-card to-muted/10">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                    <p className="text-sm text-muted-foreground">Live user sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    {filteredLogins.length} users
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogins.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Activity Found</h3>
                  <p className="text-muted-foreground text-sm">
                    {Object.values(filters).some(f => f && f !== '') ? 'No logins match the current filters' : 'No recent login activity to display'}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredLogins.map((user, idx) => {
                    // Ensure proper date parsing - add 'Z' if not present for UTC
                    const loginDateStr = user.last_login.includes('Z') ? user.last_login : user.last_login + 'Z';
                    const loginDate = new Date(loginDateStr);
                    const now = new Date();
                    const timeDiff = now.getTime() - loginDate.getTime();
                    const isOnline = timeDiff < 15 * 60 * 1000; // Online if logged in within 15 minutes
                    
                    console.log(`User: ${user.full_name}, Login: ${loginDateStr}, Now: ${now.toISOString()}, TimeDiff: ${timeDiff}ms, IsOnline: ${isOnline}`);
                    const timeAgo = Math.floor(timeDiff / 60000);
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{user.full_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {user.level || 'Unspecified'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {user.department}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {isOnline ? (
                              <Wifi className="h-3 w-3 text-green-500" />
                            ) : (
                              <WifiOff className="h-3 w-3 text-gray-400" />
                            )}
                            <Badge 
                              variant={isOnline ? "default" : "outline"} 
                              className={`text-xs px-2 py-0.5 ${isOnline ? 'bg-green-500 hover:bg-green-600 text-white' : 'text-muted-foreground border-muted'}`}
                            >
                              {isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isOnline ? `${timeAgo}m ago` : loginDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Top Performing Students Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card via-card to-amber-50/20 dark:to-amber-950/10">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Top Performers</CardTitle>
                    <p className="text-sm text-muted-foreground">Academic excellence leaders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    {filteredTopStudents.length} students
                  </Badge>
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTopStudents.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Data Available</h3>
                  <p className="text-muted-foreground text-sm">
                    {Object.values(filters).some(f => f && f !== '') 
                      ? "No students match the current filters"
                      : "No performance data to display"}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredTopStudents.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center">
                            {idx === 0 && <Crown className="h-5 w-5 text-amber-600" />}
                            {idx === 1 && <Medal className="h-5 w-5 text-gray-500" />}
                            {idx === 2 && <Award className="h-5 w-5 text-amber-700" />}
                            {idx > 2 && (
                              <span className="text-sm font-bold text-amber-600">
                                #{idx + 1}
                              </span>
                            )}
                          </div>
                          {idx < 3 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                              <Zap className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{student.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {student.level || 'Unspecified'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {student.department}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={
                              student.average_score >= 80
                                ? "default"
                                : student.average_score >= 60
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs font-semibold px-2 py-1"
                          >
                            {student.average_score ?? '—'}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Rank #{idx + 1}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityDashboard;