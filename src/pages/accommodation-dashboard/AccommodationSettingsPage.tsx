import { useState, useEffect } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsData } from '@/hooks/useSettingsData';
import { useAuth } from '@/contexts/AuthContext';
import CancellationSettingsForm from '@/components/settings/CancellationSettingsForm';
import StaffList from '@/components/settings/StaffList';
import AccommodationNotificationTemplatesEditor from '@/components/accommodation/AccommodationNotificationTemplatesEditor';
import { Building2, XCircle, Users, Loader2, Landmark, Globe, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AccommodationSettingsPage = () => {
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
  const { toast } = useToast();

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

  // Initialize form when data loads
  useEffect(() => {
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
  }, [partnerInfo]);

  const handleSaveBusinessInfo = async () => {
    await updatePartnerInfo(businessForm);
  };

  const handleInviteStaff = () => {
    toast({
      title: 'Coming Soon',
      description: 'Staff invitation will be available in a future update.',
    });
  };

  if (loading) {
    return (
      <AccommodationDashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AccommodationDashboardLayout>
    );
  }

  if (!partnerInfo) {
    return (
      <AccommodationDashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your accommodation module</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No partner account associated.</p>
            </CardContent>
          </Card>
        </div>
      </AccommodationDashboardLayout>
    );
  }

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your accommodation module</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="cancellation" className="gap-2">
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Cancellation</span>
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
                        value={businessForm.name}
                        onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                        placeholder="Your business name"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Legal Name</Label>
                      <Input
                        value={businessForm.legal_name}
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
                        value={businessForm.tax_id}
                        onChange={(e) => setBusinessForm({ ...businessForm, tax_id: e.target.value })}
                        placeholder="Tax identification number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={businessForm.website}
                        onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                        placeholder="https://www.example.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={businessForm.address}
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
                        value={businessForm.city}
                        onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                        placeholder="City"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        value={businessForm.postal_code}
                        onChange={(e) => setBusinessForm({ ...businessForm, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={businessForm.country}
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
                        value={businessForm.contact_name}
                        onChange={(e) => setBusinessForm({ ...businessForm, contact_name: e.target.value })}
                        placeholder="Primary contact person"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={businessForm.contact_email}
                        onChange={(e) => setBusinessForm({ ...businessForm, contact_email: e.target.value })}
                        placeholder="contact@example.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={businessForm.contact_phone}
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
                        value={businessForm.bank_name}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_name: e.target.value })}
                        placeholder="e.g. Bank BCA, Mandiri"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Account Holder Name *</Label>
                      <Input
                        value={businessForm.bank_account_name}
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
                        value={businessForm.bank_account_number}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_account_number: e.target.value })}
                        placeholder="Bank account number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input
                        value={businessForm.bank_branch}
                        onChange={(e) => setBusinessForm({ ...businessForm, bank_branch: e.target.value })}
                        placeholder="Bank branch name"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <Label>SWIFT Code (for international transfers)</Label>
                    <Input
                      value={businessForm.bank_swift_code}
                      onChange={(e) => setBusinessForm({ ...businessForm, bank_swift_code: e.target.value })}
                      placeholder="e.g. CENAIDJA"
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={handleSaveBusinessInfo} disabled={saving} size="lg">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save All Changes
              </Button>
            </div>
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

          {/* Team */}
          <TabsContent value="team">
            {user && (
              <StaffList
                staff={staff}
                currentUserId={user.id}
                onToggleStatus={toggleStaffStatus}
                onInvite={handleInviteStaff}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationSettingsPage;
