import { format } from 'date-fns';
import { CalendarDeparture } from '@/hooks/useCalendarData';
import { DepartureCard } from './DepartureCard';

interface DayViewProps {
  date: Date;
  departures: CalendarDeparture[];
  onDepartureClick: (departure: CalendarDeparture) => void;
}

export const DayView = ({ date, departures, onDepartureClick }: DayViewProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayDepartures = departures
    .filter(d => d.departure_date === dateStr)
    .sort((a, b) => a.departure_time.localeCompare(b.departure_time));

  return (
    <div className="space-y-4">
      <div className="text-center py-4 border-b">
        <div className="text-3xl font-bold">{format(date, 'd')}</div>
        <div className="text-muted-foreground">{format(date, 'EEEE')}</div>
      </div>
      
      {dayDepartures.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No departures scheduled for this day
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dayDepartures.map(departure => (
            <DepartureCard
              key={departure.id}
              departure={departure}
              onClick={() => onDepartureClick(departure)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
