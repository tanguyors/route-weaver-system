import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { DayView } from '@/components/calendar/DayView';
import { WeekView } from '@/components/calendar/WeekView';
import { MonthView } from '@/components/calendar/MonthView';
import { DepartureDetailModal } from '@/components/calendar/DepartureDetailModal';
import GenerateDeparturesDialog from '@/components/trips/GenerateDeparturesDialog';
import { useCalendarData, CalendarDeparture } from '@/hooks/useCalendarData';
import { useTripsData } from '@/hooks/useTripsData';
import { Loader2, Zap } from 'lucide-react';

type ViewType = 'day' | 'week' | 'month';

const SchedulesPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [selectedDeparture, setSelectedDeparture] = useState<CalendarDeparture | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  
  const { 
    departures, 
    loading, 
    canEdit,
    setDateRange,
    fetchDepartures,
    fetchDepartureBookings,
    updateDepartureStatus,
    updateDepartureCapacity,
    blockSeats,
  } = useCalendarData();

  const { trips, schedules, generateDepartures } = useTripsData();

  // Update date range when view/date changes
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    const start = format(startOfMonth(addMonths(date, -1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(addMonths(date, 1)), 'yyyy-MM-dd');
    setDateRange({ start, end });
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  const handleDepartureClick = (departure: CalendarDeparture) => {
    setSelectedDeparture(departure);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleGenerateDepartures = async (tripId: string, startDate: string, endDate: string) => {
    const result = await generateDepartures(tripId, startDate, endDate);
    if (!result.error) {
      await fetchDepartures();
    }
    return result;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trips Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Manage departures, capacity, and view bookings
            </p>
          </div>
          {canEdit && trips.length > 0 && (
            <Button variant="hero" onClick={() => setGenerateDialogOpen(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Generate Departures
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onViewChange={handleViewChange}
              onDateChange={handleDateChange}
              onToday={handleToday}
            />

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {view === 'day' && (
                  <DayView
                    date={currentDate}
                    departures={departures}
                    onDepartureClick={handleDepartureClick}
                  />
                )}
                {view === 'week' && (
                  <WeekView
                    date={currentDate}
                    departures={departures}
                    onDepartureClick={handleDepartureClick}
                  />
                )}
                {view === 'month' && (
                  <MonthView
                    date={currentDate}
                    departures={departures}
                    onDepartureClick={handleDepartureClick}
                    onDayClick={handleDayClick}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DepartureDetailModal
        departure={selectedDeparture}
        open={!!selectedDeparture}
        onClose={() => setSelectedDeparture(null)}
        canEdit={canEdit}
        onStatusChange={async (id, status) => { await updateDepartureStatus(id, status); }}
        onCapacityChange={async (id, cap) => { await updateDepartureCapacity(id, cap); }}
        onBlockSeats={async (id, seats) => { await blockSeats(id, seats); }}
        fetchBookings={fetchDepartureBookings}
      />

      <GenerateDeparturesDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleGenerateDepartures}
        trips={trips}
      />
    </DashboardLayout>
  );
};

export default SchedulesPage;
