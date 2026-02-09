import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const AccommodationReportsPage = () => {
  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance reports</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg mt-6">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Reports coming in a future phase</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationReportsPage;
