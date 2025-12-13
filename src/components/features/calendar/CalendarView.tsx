import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Interview } from '@/types';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'interview' | 'deadline' | 'follow-up';
  status?: string;
  color: string;
}

interface CalendarViewProps {
  interviews: Interview[];
  applications?: Array<{
    id: string;
    position: string;
    companyName: string;
    deadline?: Date;
    followUpDate?: Date;
  }>;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({
  interviews,
  applications = [],
  onEventClick,
  onDateClick,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Convert interviews and applications to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const evts: CalendarEvent[] = [];

    // Add interviews
    for (const interview of interviews) {
      if (interview.scheduledAt) {
        evts.push({
          id: interview.id,
          title: interview.type,
          date: new Date(interview.scheduledAt),
          type: 'interview',
          status: interview.status,
          color: interview.status === 'completed' ? 'bg-green-500' : 'bg-blue-500',
        });
      }
    }

    // Add application deadlines
    for (const app of applications) {
      if (app.deadline) {
        evts.push({
          id: `deadline-${app.id}`,
          title: `Deadline: ${app.position}`,
          date: new Date(app.deadline),
          type: 'deadline',
          color: 'bg-red-500',
        });
      }

      if (app.followUpDate) {
        evts.push({
          id: `followup-${app.id}`,
          title: `Follow up: ${app.companyName}`,
          date: new Date(app.followUpDate),
          type: 'follow-up',
          color: 'bg-yellow-500',
        });
      }
    }

    return evts;
  }, [interviews, applications]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Export to calendar format (ICS)
  const handleExportCalendar = () => {
    const icsEvents = events.map((event) => {
      const start = format(event.date, "yyyyMMdd'T'HHmmss");
      const end = format(event.date, "yyyyMMdd'T'HHmmss");
      return [
        'BEGIN:VEVENT',
        `UID:${event.id}`,
        `DTSTAMP:${start}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        'END:VEVENT',
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Thrive//Job Tracker//EN',
      'CALSCALE:GREGORIAN',
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thrive-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCalendar}>
          <Download className="h-4 w-4 mr-2" />
          Export to Calendar
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Interviews</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Deadlines</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Follow-ups</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => onDateClick?.(day)}
                className={cn(
                  'min-h-[100px] p-2 text-left border-r border-b transition-colors',
                  'hover:bg-muted/50',
                  !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                  (index + 1) % 7 === 0 && 'border-r-0',
                )}
              >
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mb-1',
                    isDayToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        'w-full text-xs p-1 rounded text-left truncate',
                        event.color,
                        'text-white hover:opacity-90 transition-opacity',
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Events</div>
          <div className="text-2xl font-bold">{events.length}</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground mb-1">Interviews</div>
          <div className="text-2xl font-bold">
            {events.filter((e) => e.type === 'interview').length}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground mb-1">Deadlines</div>
          <div className="text-2xl font-bold">
            {events.filter((e) => e.type === 'deadline').length}
          </div>
        </div>
      </div>
    </div>
  );
}
