import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AccommodationSettingsPage = () => {
  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your accommodation module</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg mt-6">
            <div className="text-center">
              <Settings className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Settings coming in a future phase</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationSettingsPage;
