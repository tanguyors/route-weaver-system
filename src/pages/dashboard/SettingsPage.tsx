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
import TermsSettingsForm from '@/components/settings/TermsSettingsForm';
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
  Landmark,
  Globe,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

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
    city: '',
    postal_code: '',
    country: 'Indonesia',
    tax_id: '',
    website: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch: '',
    bank_swift_code: '',
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
        city: partnerInfo.city || '',
        postal_code: partnerInfo.postal_code || '',
        country: partnerInfo.country || 'Indonesia',
        tax_id: partnerInfo.tax_id || '',
        website: partnerInfo.website || '',
        bank_name: partnerInfo.bank_name || '',
        bank_account_name: partnerInfo.bank_account_name || '',
        bank_account_number: partnerInfo.bank_account_number || '',
        bank_branch: partnerInfo.bank_branch || '',
        bank_swift_code: partnerInfo.bank_swift_code || '',
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

  if (!partnerInfo) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Partner settings
            </p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No partner account associated. Admin users can manage partners from the admin dashboard.
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => navigate('/admin/partners')}
              >
                Go to Partners Management
              </Button>
            </CardContent>
          </Card>
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
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
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
            <TabsTrigger value="terms" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Terms</span>
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
            <div className="space-y-6">
              {/* Business Information Card */}
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
                      <Label>Business Name *</Label>
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
                      <Label>Tax ID / NPWP</Label>
                      <Input
                        value={businessForm.tax_id || partnerInfo?.tax_id || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, tax_id: e.target.value })}
                        placeholder="Tax identification number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={businessForm.website || partnerInfo?.website || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                        placeholder="https://www.example.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={businessForm.address || partnerInfo?.address || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                      placeholder="Full business address"
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={businessForm.city || partnerInfo?.city || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                        placeholder="City"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        value={businessForm.postal_code || partnerInfo?.postal_code || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={businessForm.country || partnerInfo?.country || 'Indonesia'}
                        onChange={(e) => setBusinessForm({ ...businessForm, country: e.target.value })}
                        placeholder="Country"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={businessForm.contact_name || partnerInfo?.contact_name || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, contact_name: e.target.value })}
                        placeholder="Primary contact person"
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
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={businessForm.contact_phone || partnerInfo?.contact_phone || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, contact_phone: e.target.value })}
                      placeholder="+62..."
                      className="mt-2 sm:w-1/2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Banking Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="w-5 h-5" />
                    Banking Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Required for receiving withdrawal transfers
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Bank Name *</Label>
                      <Input
                        value={businessForm.bank_name || partnerInfo?.bank_name || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_name: e.target.value })}
                        placeholder="e.g. Bank BCA, Mandiri"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Account Holder Name *</Label>
                      <Input
                        value={businessForm.bank_account_name || partnerInfo?.bank_account_name || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_account_name: e.target.value })}
                        placeholder="Name on bank account"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Account Number *</Label>
                      <Input
                        value={businessForm.bank_account_number || partnerInfo?.bank_account_number || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_account_number: e.target.value })}
                        placeholder="Bank account number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input
                        value={businessForm.bank_branch || partnerInfo?.bank_branch || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_branch: e.target.value })}
                        placeholder="Bank branch name"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <Label>SWIFT Code (for international transfers)</Label>
                    <Input
                      value={businessForm.bank_swift_code || partnerInfo?.bank_swift_code || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, bank_swift_code: e.target.value })}
                      placeholder="e.g. CENAIDJA"
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button and Widget Shortcut */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSaveBusinessInfo} disabled={saving} size="lg">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save All Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/widget')}
                  className="gap-2"
                >
                  <Code className="w-4 h-4" />
                  Widget Settings
                </Button>
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
                partnerInfo={partnerInfo}
                onSave={updateSettings}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Terms & Conditions */}
          <TabsContent value="terms">
            {settings && (
              <TermsSettingsForm
                settings={settings}
                partnerInfo={partnerInfo}
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
                pickupReminderSettings={partnerInfo ? {
                  pickup_reminder_24h_enabled: partnerInfo.pickup_reminder_24h_enabled ?? true,
                  pickup_reminder_12h_enabled: partnerInfo.pickup_reminder_12h_enabled ?? true,
                } : undefined}
                whatsappSettings={partnerInfo ? {
                  whatsapp_country_code: partnerInfo.whatsapp_country_code || '+62',
                  whatsapp_number: partnerInfo.whatsapp_number || '',
                } : undefined}
                onSave={updateSettings}
                onSavePickupReminders={async (updates) => {
                  return await updatePartnerInfo(updates);
                }}
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
