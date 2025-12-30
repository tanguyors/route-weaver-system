import { useState, useEffect } from 'react';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { usePartnerBillingData, BillingDetails } from '@/hooks/usePartnerBillingData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Phone, Landmark } from 'lucide-react';

const ActivityBillingSettingsPage = () => {
  const { toast } = useToast();
  const { billingDetails, isLoading, updateBillingDetails, isUpdating } = usePartnerBillingData();
  
  const [formData, setFormData] = useState<BillingDetails>({
    company_name: '',
    address: '',
    city: '',
    country: 'Indonesia',
    tax_id: '',
    billing_email: '',
    billing_phone: '',
    bank_name: '',
    bank_account: '',
    bank_holder: '',
  });

  useEffect(() => {
    if (billingDetails) {
      setFormData({
        company_name: billingDetails.company_name || '',
        address: billingDetails.address || '',
        city: billingDetails.city || '',
        country: billingDetails.country || 'Indonesia',
        tax_id: billingDetails.tax_id || '',
        billing_email: billingDetails.billing_email || '',
        billing_phone: billingDetails.billing_phone || '',
        bank_name: billingDetails.bank_name || '',
        bank_account: billingDetails.bank_account || '',
        bank_holder: billingDetails.bank_holder || '',
      });
    }
  }, [billingDetails]);

  const handleChange = (field: keyof BillingDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBillingDetails(formData);
      toast({ title: 'Billing settings saved', description: 'Your billing details have been updated.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <ActivityDashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ActivityDashboardLayout>
    );
  }

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Settings</h1>
          <p className="text-muted-foreground">
            These details will appear on invoices and payout documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Legal entity details for invoicing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="PT Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Jl. Example Street No. 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Jakarta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Indonesia"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID (NPWP)</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder="00.000.000.0-000.000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Billing Contact
              </CardTitle>
              <CardDescription>
                Contact information for billing inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billing_email">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => handleChange('billing_email', e.target.value)}
                  placeholder="billing@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_phone">Billing Phone</Label>
                <Input
                  id="billing_phone"
                  value={formData.billing_phone}
                  onChange={(e) => handleChange('billing_phone', e.target.value)}
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                Bank Details
              </CardTitle>
              <CardDescription>
                Bank account for receiving payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="BCA, Mandiri, BNI, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account Number</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => handleChange('bank_account', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_holder">Account Holder Name</Label>
                <Input
                  id="bank_holder"
                  value={formData.bank_holder}
                  onChange={(e) => handleChange('bank_holder', e.target.value)}
                  placeholder="PT Your Company Name"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Billing Settings
          </Button>
        </form>
      </div>
    </ActivityDashboardLayout>
  );
};

export default ActivityBillingSettingsPage;
