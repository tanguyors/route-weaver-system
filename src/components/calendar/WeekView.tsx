import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { CalendarDeparture } from '@/hooks/useCalendarData';
import { DepartureCard } from './DepartureCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WeekViewProps {
  date: Date;
  departures: CalendarDeparture[];
  onDepartureClick: (departure: CalendarDeparture) => void;
}

export const WeekView = ({ date, departures, onDepartureClick }: WeekViewProps) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayDepartures = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return departures
      .filter(d => d.departure_date === dateStr)
      .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
  };

  return (
    <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
      {days.map((day, index) => (
        <div key={index} className="bg-card min-h-[300px] flex flex-col">
          <div 
            className={cn(
              'p-2 text-center border-b sticky top-0 bg-card z-10',
              isToday(day) && 'bg-primary/10'
            )}
          >
            <div className="text-xs text-muted-foreground uppercase">
              {format(day, 'EEE')}
            </div>
            <div 
              className={cn(
                'text-lg font-semibold',
                isToday(day) && 'text-primary'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {getDayDepartures(day).map(departure => (
                <DepartureCard
                  key={departure.id}
                  departure={departure}
                  compact
                  onClick={() => onDepartureClick(departure)}
                />
              ))}
              {getDayDepartures(day).length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No departures
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
