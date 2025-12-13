import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { MapPin, Phone, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Application, Interview } from '@/types';

interface InterviewCalendarViewProps {
  interviews: Interview[];
  applications: Application[];
  onInterviewClick?: (interview: Interview) => void;
}

export function InterviewCalendarView({
  interviews,
  applications,
  onInterviewClick,
}: InterviewCalendarViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getInterviewsForDay = (day: Date) => {
    return interviews.filter((interview) => {
      if (!interview.scheduledAt) return false;
      return isSameDay(new Date(interview.scheduledAt), day);
    });
  };

  const getApplicationName = (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    return app ? `${app.position} at ${app.companyName}` : 'Unknown';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'video') return <Video className="h-3 w-3" />;
    if (type === 'phone-screen') return <Phone className="h-3 w-3" />;
    if (type === 'on-site' || type === 'panel') return <MapPin className="h-3 w-3" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{format(today, 'MMMM yyyy')}</h2>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayInterviews = getInterviewsForDay(day);
            const isCurrentMonth = isSameMonth(day, today);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[120px] border rounded-lg p-2 transition-colors',
                  isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                  isDayToday && 'ring-2 ring-primary',
                  dayInterviews.length > 0 && 'hover:bg-accent/50 cursor-pointer',
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isDayToday && 'text-primary font-bold',
                    !isCurrentMonth && 'text-muted-foreground',
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayInterviews.map((interview) => (
                    <button
                      key={interview.id}
                      type="button"
                      onClick={() => onInterviewClick?.(interview)}
                      className="w-full text-left p-1.5 rounded text-xs bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {getTypeIcon(interview.type)}
                        <span className="font-medium truncate">
                          {interview.scheduledAt &&
                            format(new Date(interview.scheduledAt), 'h:mm a')}
                        </span>
                      </div>
                      <div className="truncate text-muted-foreground">
                        {getApplicationName(interview.applicationId)}
                      </div>
                      <Badge
                        variant={interview.status === 'completed' ? 'secondary' : 'outline'}
                        className="text-[10px] mt-1 px-1 py-0"
                      >
                        {interview.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
