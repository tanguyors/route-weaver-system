import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const AccommodationBookingsPage = () => {
  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage accommodation reservations</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg mt-6">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Booking management coming in Phase 4</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationBookingsPage;
