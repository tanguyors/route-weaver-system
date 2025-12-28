import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

const AdminPartnersPage = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">Manage all partner accounts</p>
        </div>
        <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Add Partner</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No partners yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);

export default AdminPartnersPage;
