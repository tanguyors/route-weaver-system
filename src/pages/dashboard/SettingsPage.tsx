import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Building2, Users, CreditCard, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your partner account and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input placeholder="Your business name" className="mt-2" />
                  </div>
                  <div>
                    <Label>Legal Name</Label>
                    <Input placeholder="Legal entity name" className="mt-2" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" placeholder="contact@example.com" className="mt-2" />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input placeholder="+62..." className="mt-2" />
                  </div>
                </div>
                <Button variant="hero">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">Payment provider settings</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">No team members</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Invite Member
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Notification settings coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
