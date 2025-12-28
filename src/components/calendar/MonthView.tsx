import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import { CalendarDeparture } from '@/hooks/useCalendarData';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MonthViewProps {
  date: Date;
  departures: CalendarDeparture[];
  onDepartureClick: (departure: CalendarDeparture) => void;
  onDayClick: (date: Date) => void;
}

export const MonthView = ({ date, departures, onDepartureClick, onDayClick }: MonthViewProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days: Date[] = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getDayDepartures = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return departures
      .filter(d => d.departure_date === dateStr)
      .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
  };

  const getDaySummary = (dayDeps: CalendarDeparture[]) => {
    const total = dayDeps.length;
    const soldOut = dayDeps.filter(d => d.status === 'sold_out').length;
    const cancelled = dayDeps.filter(d => d.status === 'cancelled').length;
    const open = dayDeps.filter(d => d.status === 'open').length;
    return { total, soldOut, cancelled, open };
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 divide-x">
          {week.map((day, dayIndex) => {
            const dayDeps = getDayDepartures(day);
            const summary = getDaySummary(dayDeps);
            const inMonth = isSameMonth(day, date);
            
            return (
              <div 
                key={dayIndex}
                onClick={() => onDayClick(day)}
                className={cn(
                  'min-h-[100px] p-1 cursor-pointer transition-colors hover:bg-muted/50',
                  !inMonth && 'bg-muted/30 text-muted-foreground',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday(day) && 'bg-primary text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                
                {summary.total > 0 && (
                  <div className="space-y-1">
                    {/* Quick stats */}
                    <div className="flex gap-1 text-xs">
                      {summary.open > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          {summary.open}
                        </span>
                      )}
                      {summary.soldOut > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-400">
                          {summary.soldOut}
                        </span>
                      )}
                    </div>
                    
                    {/* First few departures */}
                    <ScrollArea className="max-h-[60px]">
                      {dayDeps.slice(0, 3).map(dep => (
                        <div
                          key={dep.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDepartureClick(dep);
                          }}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer hover:opacity-80',
                            dep.status === 'open' && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
                            dep.status === 'sold_out' && 'bg-red-500/20 text-red-700 dark:text-red-400',
                            dep.status === 'closed' && 'bg-muted text-muted-foreground',
                            dep.status === 'cancelled' && 'bg-zinc-500/20 text-zinc-600 line-through'
                          )}
                        >
                          {dep.departure_time.slice(0, 5)}
                        </div>
                      ))}
                      {dayDeps.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayDeps.length - 3} more
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
