import { useEffect, useState } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { useAccommodationBookingsData, AccommodationBooking } from '@/hooks/useAccommodationBookingsData';
import { format } from 'date-fns';

const AccommodationDashboard = () => {
  const { stats, loading, getUpcomingBookings } = useAccommodationBookingsData();
  const [upcoming, setUpcoming] = useState<AccommodationBooking[]>([]);

  useEffect(() => {
    getUpcomingBookings(5).then(setUpcoming);
  }, [getUpcomingBookings]);

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Accommodation Dashboard</h1>
          <p className="text-muted-foreground">Overview of your accommodation business</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">Active accommodations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nights Booked</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats.nightsBooked}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">Confirmed this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">IDR {loading ? '—' : stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings or Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Home className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {stats.totalProperties === 0
                      ? 'Start by adding your first accommodation'
                      : 'No upcoming bookings'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{b.guest_name}</p>
                      <p className="text-sm text-muted-foreground">{b.accommodation?.name}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{format(new Date(b.checkin_date), 'MMM d')} → {format(new Date(b.checkout_date), 'MMM d, yyyy')}</p>
                      <p className="text-muted-foreground">{b.total_nights} night{b.total_nights > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationDashboard;
