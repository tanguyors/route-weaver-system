import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsData } from '@/hooks/useSettingsData';
import { useAuth } from '@/contexts/AuthContext';
import PaymentSettingsForm from '@/components/settings/PaymentSettingsForm';
import CancellationSettingsForm from '@/components/settings/CancellationSettingsForm';
import TicketSettingsForm from '@/components/settings/TicketSettingsForm';
import NotificationSettingsForm from '@/components/settings/NotificationSettingsForm';
import StaffList from '@/components/settings/StaffList';
import {
  Building2,
  CreditCard,
  XCircle,
  Ticket,
  Bell,
  Users,
  Code,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const {
    loading,
    saving,
    settings,
    partnerInfo,
    staff,
    updatePartnerInfo,
    updateSettings,
    toggleStaffStatus,
  } = useSettingsData();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessForm, setBusinessForm] = useState({
    name: '',
    legal_name: '',
    contact_email: '',
    contact_phone: '',
    contact_name: '',
    address: '',
  });

  // Initialize business form when data loads
  useState(() => {
    if (partnerInfo) {
      setBusinessForm({
        name: partnerInfo.name || '',
        legal_name: partnerInfo.legal_name || '',
        contact_email: partnerInfo.contact_email || '',
        contact_phone: partnerInfo.contact_phone || '',
        contact_name: partnerInfo.contact_name || '',
        address: partnerInfo.address || '',
      });
    }
  });

  const handleSaveBusinessInfo = async () => {
    await updatePartnerInfo(businessForm);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your partner account and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="cancellation" className="gap-2">
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Cancellation</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Info */}
          <TabsContent value="business">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
                        <Input
                          value={businessForm.name || partnerInfo?.name || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                          placeholder="Your business name"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Legal Name</Label>
                        <Input
                          value={businessForm.legal_name || partnerInfo?.legal_name || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, legal_name: e.target.value })}
                          placeholder="Legal entity name"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Name</Label>
                        <Input
                          value={businessForm.contact_name || partnerInfo?.contact_name || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, contact_name: e.target.value })}
                          placeholder="Primary contact"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={businessForm.contact_email || partnerInfo?.contact_email || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, contact_email: e.target.value })}
                          placeholder="contact@example.com"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Phone</Label>
                        <Input
                          value={businessForm.contact_phone || partnerInfo?.contact_phone || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, contact_phone: e.target.value })}
                          placeholder="+62..."
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={businessForm.address || partnerInfo?.address || ''}
                          onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                          placeholder="Business address"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveBusinessInfo} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Widget Shortcut */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Widget Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure your booking widget for embedding on your website.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/dashboard/widget')}
                    >
                      Go to Widget Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments">
            {settings && (
              <PaymentSettingsForm
                settings={settings}
                onSave={updateSettings}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Cancellation Settings */}
          <TabsContent value="cancellation">
            {settings && (
              <CancellationSettingsForm
                settings={settings}
                onSave={updateSettings}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Ticket Settings */}
          <TabsContent value="tickets">
            {settings && (
              <TicketSettingsForm
                settings={settings}
                onSave={updateSettings}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            {settings && (
              <NotificationSettingsForm
                settings={settings}
                onSave={updateSettings}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Team Members */}
          <TabsContent value="team">
            <StaffList
              staff={staff}
              currentUserId={user?.id || ''}
              onToggleStatus={toggleStaffStatus}
              onInvite={() => {
                // TODO: Implement invite modal
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
