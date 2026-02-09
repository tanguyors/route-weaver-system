import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

const AccommodationIcalSyncPage = () => {
  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">iCal Sync</h1>
          <p className="text-muted-foreground">Synchronize calendars with Airbnb, Booking, and more</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg mt-6">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">iCal synchronization coming in Phase 3</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationIcalSyncPage;
