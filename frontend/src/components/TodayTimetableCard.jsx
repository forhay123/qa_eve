import React from 'react';
import { CalendarDays, Clock, Users, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import dayjs from 'dayjs';

const TodayTimetableCard = ({ timetableData = [], loading = false, error = null }) => {
  const getCurrentTime = () => dayjs().format('HH:mm');

  const isCurrentClass = (startTime, endTime) => {
    const now = getCurrentTime();
    return now >= startTime && now <= (endTime || '23:59');
  };

  const isUpcomingClass = (startTime) => {
    const now = getCurrentTime();
    const timeDiff = dayjs(`2000-01-01 ${startTime}`).diff(dayjs(`2000-01-01 ${now}`), 'minute');
    return timeDiff > 0 && timeDiff <= 60;
  };

  const currentDay = dayjs().format('dddd');
  const currentTime = getCurrentTime();

  if (loading) {
    return (
      <Card className="h-fit max-h-[500px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Today's Schedule</CardTitle>
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-fit border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <CalendarDays className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl text-destructive">Schedule Error</CardTitle>
              <p className="text-sm text-muted-foreground">Unable to load schedule</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit bg-gradient-to-br from-background to-muted/20 hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Today's Schedule</CardTitle>
              <p className="text-sm text-muted-foreground">{currentDay} • {currentTime}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            {timetableData.length} {timetableData.length === 1 ? 'class' : 'classes'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        {timetableData.length > 0 ? (
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3">
                {timetableData.map((item, idx) => {
                  const isCurrent = isCurrentClass(item.start_time, item.end_time);
                  const isUpcoming = isUpcomingClass(item.start_time);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border transition-all duration-200 relative overflow-hidden ${
                        isCurrent
                          ? 'bg-primary/10 border-primary/50 shadow-sm ring-1 ring-primary/20'
                          : isUpcoming
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-card hover:bg-accent/50 hover:shadow-sm'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCurrent ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <Clock className={`h-4 w-4 ${
                              isCurrent ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <span className={`text-sm font-semibold ${
                              isCurrent ? 'text-primary' : 'text-foreground'
                            }`}>
                              {item.start_time}
                            </span>
                            <span className="text-muted-foreground text-sm mx-2">-</span>
                            <span className="text-sm text-muted-foreground">
                              {item.end_time}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {isCurrent && (
                            <Badge variant="default" className="text-xs animate-pulse">
                              Live
                            </Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="secondary" className="text-xs">
                              Soon
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-muted rounded">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{item.subject}</span>
                      </div>

                      {item.teacher && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Users className="h-3 w-3" />
                          <span>{item.teacher}</span>
                        </div>
                      )}

                      {item.location && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📍 {item.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="pt-4 mt-4 border-t flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:bg-primary hover:text-primary-foreground transition-colors" 
                onClick={() => window.location.href = '/timetable'}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Timetable
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 h-full flex flex-col justify-center">
            <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">No classes today</p>
            <p className="text-xs text-muted-foreground mb-4">Enjoy your free day!</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mx-auto hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => window.location.href = '/timetable'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Schedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayTimetableCard;