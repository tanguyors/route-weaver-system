import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import { AccommodationGroup, MultiCalendarEntry } from '@/hooks/useMultiPropertyCalendarData';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MultiPropertyCalendarProps {
  currentMonth: Date;
  groups: AccommodationGroup[];
  loading: boolean;
  onToggleBlock: (accommodationId: string, date: string, currentStatus: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  booked_sribooking: 'bg-blue-500 dark:bg-blue-600',
  booked_external: 'bg-orange-500 dark:bg-orange-600',
  blocked: 'bg-red-400 dark:bg-red-600',
};

const cellStatusColors: Record<string, string> = {
  available: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/50 cursor-pointer',
  blocked: 'bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50 cursor-pointer',
  booked_sribooking: 'bg-blue-50 dark:bg-blue-950/30',
  booked_external: 'bg-orange-50 dark:bg-orange-950/30',
};

interface BookingSpan {
  bookingId: string;
  guestName: string;
  status: string;
  startIdx: number;
  endIdx: number;
}

const MultiPropertyCalendar = ({ currentMonth, groups, loading, onToggleBlock }: MultiPropertyCalendarProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [currentMonth]);
  const dayCount = days.length;

  const handleCellClick = async (accommodationId: string, dateStr: string, status: string) => {
    if (status === 'booked_sribooking' || status === 'booked_external') return;
    try {
      await onToggleBlock(accommodationId, dateStr, status);
      toast.success(status === 'blocked' ? 'Date unblocked' : 'Date blocked');
    } catch {
      toast.error('Failed to update date');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No accommodations found.</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-max">
          {/* Header row: property name column + day columns */}
          <div className="flex border-b bg-muted/50 sticky top-0 z-10">
            <div className="w-48 min-w-48 flex-shrink-0 p-2 font-medium text-sm text-muted-foreground border-r sticky left-0 bg-muted/50 z-20">
              Property
            </div>
            {days.map(day => {
              const isCurrentDay = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'w-10 min-w-10 flex-shrink-0 text-center text-xs py-1 border-r',
                    isCurrentDay && 'bg-primary/10 font-bold'
                  )}
                >
                  <div className="text-muted-foreground">{format(day, 'EEE').charAt(0)}</div>
                  <div className={cn(isCurrentDay && 'text-primary')}>{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>

          {/* Accommodation rows */}
          {groups.map(group => (
            <AccommodationRow
              key={group.accommodation_id}
              group={group}
              days={days}
              dayCount={dayCount}
              onCellClick={handleCellClick}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

interface AccommodationRowProps {
  group: AccommodationGroup;
  days: Date[];
  dayCount: number;
  onCellClick: (accommodationId: string, dateStr: string, status: string) => Promise<void>;
}

const AccommodationRow = ({ group, days, dayCount, onCellClick }: AccommodationRowProps) => {
  // Build a map of date -> entry for quick lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, MultiCalendarEntry>();
    group.entries.forEach(e => map.set(e.date, e));
    return map;
  }, [group.entries]);

  // Build booking spans for the bar overlay
  const bookingSpans = useMemo(() => {
    const spans: BookingSpan[] = [];
    const seenBookings = new Set<string>();

    group.entries.forEach(entry => {
      if (!entry.booking_id || seenBookings.has(entry.booking_id)) return;
      if (entry.status !== 'booked_sribooking' && entry.status !== 'booked_external') return;
      seenBookings.add(entry.booking_id);

      // Find all days for this booking in the visible range
      const bookingDays = group.entries
        .filter(e => e.booking_id === entry.booking_id)
        .map(e => e.date)
        .sort();

      if (bookingDays.length === 0) return;

      const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));
      const startIdx = dayStrings.indexOf(bookingDays[0]);
      const endIdx = dayStrings.indexOf(bookingDays[bookingDays.length - 1]);

      if (startIdx === -1 && endIdx === -1) return;

      spans.push({
        bookingId: entry.booking_id,
        guestName: entry.guest_name || 'Guest',
        status: entry.status,
        startIdx: Math.max(startIdx, 0),
        endIdx: endIdx === -1 ? dayCount - 1 : endIdx,
      });
    });

    return spans;
  }, [group.entries, days, dayCount]);

  return (
    <div className="flex border-b relative">
      {/* Property name */}
      <div className="w-48 min-w-48 flex-shrink-0 p-2 text-sm font-medium border-r truncate flex items-center sticky left-0 bg-background z-10">
        {group.accommodation_name}
      </div>

      {/* Day cells */}
      <div className="flex relative">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = entryMap.get(dateStr);
          const status = entry?.status || 'available';
          const isBooked = status === 'booked_sribooking' || status === 'booked_external';
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateStr}
              onClick={() => !isBooked && onCellClick(group.accommodation_id, dateStr, status)}
              className={cn(
                'w-10 min-w-10 h-10 flex-shrink-0 border-r transition-colors',
                cellStatusColors[status] || cellStatusColors.available,
                isBooked && 'cursor-default',
                isCurrentDay && 'ring-1 ring-inset ring-primary/30'
              )}
              title={`${dateStr} - ${status}${entry?.guest_name ? ` (${entry.guest_name})` : ''}`}
            />
          );
        })}

        {/* Booking bar overlays */}
        {bookingSpans.map(span => {
          const left = span.startIdx * 40; // 40px = w-10
          const width = (span.endIdx - span.startIdx + 1) * 40;
          return (
            <div
              key={span.bookingId}
              className={cn(
                'absolute top-1 h-8 rounded-md flex items-center px-2 text-white text-xs font-medium pointer-events-none overflow-hidden',
                statusColors[span.status] || 'bg-blue-500'
              )}
              style={{ left: `${left}px`, width: `${width}px` }}
              title={span.guestName}
            >
              <span className="truncate">{span.guestName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiPropertyCalendar;
