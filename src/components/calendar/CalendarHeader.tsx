import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth } from 'date-fns';

type ViewType = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
}

export const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onToday,
}: CalendarHeaderProps) => {
  const handlePrevious = () => {
    switch (view) {
      case 'day':
        onDateChange(addDays(currentDate, -1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, -1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(startOfMonth(currentDate), 'MMMM yyyy');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
        </Button>
        <h2 className="text-lg font-semibold ml-2">{getTitle()}</h2>
      </div>
      
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={view === 'day' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('day')}
        >
          Day
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
        >
          Week
        </Button>
        <Button
          variant={view === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('month')}
        >
          Month
        </Button>
      </div>
    </div>
  );
};
