import React, { useEffect, useState } from "react";
import { fetchPersonalizedRecommendations } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { 
  Brain, 
  TrendingDown, 
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Sparkles
} from 'lucide-react';

const PersonalizationCard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use state to track dark mode, similar to ProgressPanel
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode status, just like in ProgressPanel
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const recommendations = await fetchPersonalizedRecommendations();
        setData(recommendations);
      } catch (err) {
        console.error("❌ Personalization error:", err);
        setError(err.message || "Failed to fetch personalized insights");
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const getRiskLevelConfig = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return {
          variant: 'destructive',
          icon: AlertTriangle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-950/70 border-red-200 dark:border-red-900',
          badgeVariant: 'destructive'
        };
      case 'medium':
        return {
          variant: 'secondary',
          icon: TrendingDown,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900',
          badgeVariant: 'secondary'
        };
      case 'low':
        return {
          variant: 'outline',
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-950/70 border-green-200 dark:border-green-900',
          badgeVariant: 'success'
        };
      default:
        return {
          variant: 'secondary',
          icon: Target,
          color: 'text-muted-foreground',
          bgColor: 'bg-gray-100 dark:bg-red-950/70 border-gray-200 dark:border-red-900',
          badgeVariant: 'secondary'
        };
    }
  };

  // Consistent theme colors and spacing
  const cardBgClasses = "bg-gray-100 dark:bg-red-950 dark:border-red-900";
  const headerIconBgClasses = "p-2 rounded-lg bg-red-100 dark:bg-red-800/50";
  const headerIconClasses = "h-5 w-5 text-red-700 dark:text-red-300";

  if (loading) {
    return (
      <Card className={`h-full border-0 shadow-lg ${cardBgClasses}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={headerIconBgClasses}>
              <Brain className={headerIconClasses} />
            </div>
            <CardTitle className="text-xl text-red-900 dark:text-red-200">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-gray-300 dark:bg-red-800" />
            <Skeleton className="h-6 w-24 bg-gray-300 dark:bg-red-800" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-gray-300 dark:bg-red-800" />
            <Skeleton className="h-4 w-3/4 bg-gray-300 dark:bg-red-800" />
            <Skeleton className="h-4 w-1/2 bg-gray-300 dark:bg-red-800" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`h-full border-0 shadow-lg border-destructive/50 ${cardBgClasses}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={headerIconBgClasses}>
              <Brain className={`h-5 w-5 ${getRiskLevelConfig('high').color}`} />
            </div>
            <CardTitle className={`text-xl ${getRiskLevelConfig('high').color}`}>Insights Unavailable</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-red-300 mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 dark:bg-red-900 dark:text-red-200 border-gray-300 dark:border-red-800"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const riskConfig = getRiskLevelConfig(data.risk_level);
  const RiskIcon = riskConfig.icon;

  return (
    <Card className={`h-fit border-0 shadow-lg transition-all duration-300 ${cardBgClasses}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={headerIconBgClasses}>
            <Brain className={headerIconClasses} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-900 dark:text-red-200">
              AI Insights
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-200" />
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-red-300">Personalized recommendations</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Academic Risk Assessment */}
        <div className={`p-4 rounded-lg border ${riskConfig.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiskIcon className={`h-4 w-4 ${riskConfig.color}`} />
              <span className="font-semibold text-sm text-gray-900 dark:text-red-100">Academic Performance</span>
            </div>
            <Badge variant={riskConfig.badgeVariant} className="text-xs bg-red-600 text-white dark:bg-red-800 dark:text-red-100">
              {data.risk_level || 'Unknown'} Risk
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-red-300">
            Based on attendance and assignment completion
          </p>
        </div>

        {/* Attendance Summary */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-red-900/50 border-gray-200 dark:border-red-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-red-800/50 rounded-lg">
              <Calendar className="h-4 w-4 text-red-700 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-red-100">Recent Attendance</p>
              <p className="text-xs text-gray-500 dark:text-red-300">Last 2 weeks</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-red-100">{data.missed_days || 0}</p>
            <p className="text-xs text-gray-500 dark:text-red-300">days missed</p>
          </div>
        </div>

        {/* Recommended Topics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-red-700 dark:text-red-300" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-red-100">Recommended Study Topics</h3>
          </div>

          {data.recommended_topics?.length === 0 ? (
            <div className="text-center py-4">
              <div className="p-2 bg-green-100 dark:bg-green-950/20 rounded-full w-fit mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Excellent work!
              </p>
              <p className="text-xs text-gray-500 dark:text-red-300">
                No weak areas identified recently
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.recommended_topics?.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-red-900/50 transition-colors bg-white dark:bg-red-900/30 border-gray-200 dark:border-red-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-red-100">
                        {typeof topic.subject === 'object' && topic.subject?.name
                          ? topic.subject.name
                          : topic.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-red-300">
                        Lecture {topic.week_number}: {topic.title}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2 bg-gray-200 text-gray-600 dark:bg-red-900 dark:text-red-200 border-gray-300 dark:border-red-800">
                      Review
                    </Badge>
                  </div>
                </div>
              )) || []}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-gray-200 dark:border-red-900">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-red-700 text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-100 border-red-700 dark:border-red-700"
            onClick={() => window.location.href = '/resources/student'}
          >
            Access Study Materials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizationCard;