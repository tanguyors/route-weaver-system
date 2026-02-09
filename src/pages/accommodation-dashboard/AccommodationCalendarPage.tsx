import { useState, useMemo, useEffect } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { useAccommodationCalendarData } from '@/hooks/useAccommodationCalendarData';
import { useMultiPropertyCalendarData } from '@/hooks/useMultiPropertyCalendarData';
import MultiPropertyCalendar from '@/components/accommodation/MultiPropertyCalendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 hover:bg-green-200',
  booked_sribooking: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  booked_external: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 hover:bg-red-200',
};

type ViewMode = 'single' | 'multi';

const AccommodationCalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('multi');
  const { accommodations, loading: accLoading } = useAccommodationsData();

  const accommodationId = selectedAccommodation || accommodations[0]?.id || '';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startStr = format(monthStart, 'yyyy-MM-dd');
  const endStr = format(monthEnd, 'yyyy-MM-dd');

  const { calendarEntries, loading: calLoading, toggleBlock } = useAccommodationCalendarData(
    accommodationId, startStr, endStr
  );

  const { groups, loading: multiLoading, toggleBlock: multiToggleBlock } = useMultiPropertyCalendarData(
    startStr, endStr
  );

  // Default to single view if only 1 accommodation
  useEffect(() => {
    if (!accLoading && accommodations.length <= 1) {
      setViewMode('single');
    }
  }, [accLoading, accommodations.length]);

  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [currentMonth]);
  const firstDayOffset = (getDay(monthStart) + 6) % 7;

  const getStatusForDate = (dateStr: string) => {
    const entry = calendarEntries.find(e => e.date === dateStr);
    return entry?.status || 'available';
  };

  const getGuestForDate = (dateStr: string) => {
    const entry = calendarEntries.find(e => e.date === dateStr);
    return entry?.guest_name || null;
  };

  const handleDayClick = async (dateStr: string) => {
    if (!accommodationId) return;
    const status = getStatusForDate(dateStr);
    if (status === 'booked_sribooking' || status === 'booked_external') return;
    try {
      await toggleBlock(dateStr, status);
      toast.success(status === 'blocked' ? 'Date unblocked' : 'Date blocked');
    } catch {
      toast.error('Failed to update date');
    }
  };

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage availability for your accommodations</p>
        </div>

        {accLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : accommodations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No accommodations yet. Create one first.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* View toggle (only show if multiple accommodations) */}
              {accommodations.length > 1 && (
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'multi' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('multi')}
                  >
                    <List className="w-4 h-4 mr-1" />
                    Multi
                  </Button>
                  <Button
                    variant={viewMode === 'single' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode('single')}
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Single
                  </Button>
                </div>
              )}

              {/* Accommodation selector (single view only) */}
              {viewMode === 'single' && (
                <Select value={accommodationId} onValueChange={setSelectedAccommodation}>
                  <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select accommodation" /></SelectTrigger>
                  <SelectContent>
                    {accommodations.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Month navigation */}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900" />Available</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />Booked (Sribooking)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-900" />Booked (External)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900" />Blocked</div>
            </div>

            {/* Calendar Views */}
            {viewMode === 'multi' ? (
              <MultiPropertyCalendar
                currentMonth={currentMonth}
                groups={groups}
                loading={multiLoading}
                onToggleBlock={multiToggleBlock}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  {calLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                      ))}
                      {Array.from({ length: firstDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const status = getStatusForDate(dateStr);
                        const guestName = getGuestForDate(dateStr);
                        const isBooked = status === 'booked_sribooking' || status === 'booked_external';

                        return (
                          <button
                            key={dateStr}
                            onClick={() => handleDayClick(dateStr)}
                            disabled={isBooked}
                            className={cn(
                              'aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors p-1',
                              statusColors[status] || statusColors.available,
                              isBooked && 'cursor-not-allowed opacity-80',
                              !isSameMonth(day, currentMonth) && 'opacity-30',
                              isToday(day) && 'ring-2 ring-primary/40',
                            )}
                          >
                            <span>{format(day, 'd')}</span>
                            {guestName && (
                              <span className="text-[9px] leading-tight truncate max-w-full mt-0.5 opacity-80">
                                {guestName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationCalendarPage;
