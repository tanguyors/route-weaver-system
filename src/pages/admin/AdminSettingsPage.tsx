import { useState, useEffect } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Percent, CreditCard, Globe, Save } from 'lucide-react';
import { useAdminSettingsData } from '@/hooks/useAdminSettingsData';

const PAYMENT_PROVIDERS = [
  { id: 'manual', label: 'Manual (Cash/Transfer)' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'xendit', label: 'Xendit' },
  { id: 'midtrans', label: 'Midtrans' },
];

const CURRENCIES = [
  { code: 'IDR', label: 'Indonesian Rupiah (IDR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
];

const AdminSettingsPage = () => {
  const {
    loading,
    saving,
    settings,
    updateCommissionRate,
    updatePaymentProviders,
    updateCurrencies,
  } = useAdminSettingsData();

  // Local state for form values
  const [commissionPercent, setCommissionPercent] = useState(7);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState('IDR');
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>([]);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setCommissionPercent(settings.commission_rate.percent);
      setEnabledProviders(settings.payment_providers.enabled);
      setDefaultCurrency(settings.currencies.default);
      setEnabledCurrencies(settings.currencies.enabled);
    }
  }, [settings]);

  const handleSaveCommission = async () => {
    await updateCommissionRate(commissionPercent);
  };

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    const newProviders = enabled
      ? [...enabledProviders, providerId]
      : enabledProviders.filter((p) => p !== providerId);
    setEnabledProviders(newProviders);
  };

  const handleSaveProviders = async () => {
    await updatePaymentProviders(enabledProviders);
  };

  const handleToggleCurrency = (currencyCode: string, enabled: boolean) => {
    let newCurrencies = enabled
      ? [...enabledCurrencies, currencyCode]
      : enabledCurrencies.filter((c) => c !== currencyCode);
    
    // Ensure default currency is always enabled
    if (!newCurrencies.includes(defaultCurrency)) {
      newCurrencies = [...newCurrencies, defaultCurrency];
    }
    
    setEnabledCurrencies(newCurrencies);
  };

  const handleSaveCurrencies = async () => {
    await updateCurrencies(defaultCurrency, enabledCurrencies);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">
            Manage global platform settings, commission rates, and payment configurations
          </p>
        </div>

        <Tabs defaultValue="commission" className="space-y-4">
          <TabsList>
            <TabsTrigger value="commission" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Commission
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Providers
            </TabsTrigger>
            <TabsTrigger value="currencies" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Currencies
            </TabsTrigger>
          </TabsList>

          {/* Commission Tab */}
          <TabsContent value="commission">
            <Card>
              <CardHeader>
                <CardTitle>Platform Commission Rate</CardTitle>
                <CardDescription>
                  Set the default commission rate charged to partners on each booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission Rate (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Button onClick={handleSaveCommission} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Example:</strong> For a booking of IDR 1,000,000 with a {commissionPercent}% commission rate:
                  </p>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• Platform fee: IDR {((1000000 * commissionPercent) / 100).toLocaleString()}</li>
                    <li>• Partner receives: IDR {(1000000 - (1000000 * commissionPercent) / 100).toLocaleString()}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Providers Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Providers</CardTitle>
                <CardDescription>
                  Enable or disable payment providers available to partners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {PAYMENT_PROVIDERS.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{provider.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.id === 'manual' && 'Cash payments and bank transfers'}
                          {provider.id === 'stripe' && 'International card payments'}
                          {provider.id === 'xendit' && 'Indonesian payment gateway'}
                          {provider.id === 'midtrans' && 'Indonesian payment solutions'}
                        </p>
                      </div>
                      <Switch
                        checked={enabledProviders.includes(provider.id)}
                        onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleSaveProviders} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currencies Tab */}
          <TabsContent value="currencies">
            <Card>
              <CardHeader>
                <CardTitle>Supported Currencies</CardTitle>
                <CardDescription>
                  Configure which currencies are available on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter((c) => enabledCurrencies.includes(c.code)).map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Enabled Currencies</Label>
                  <div className="space-y-2">
                    {CURRENCIES.map((currency) => (
                      <div
                        key={currency.code}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{currency.code}</p>
                          <p className="text-sm text-muted-foreground">{currency.label}</p>
                        </div>
                        <Switch
                          checked={enabledCurrencies.includes(currency.code)}
                          onCheckedChange={(checked) => handleToggleCurrency(currency.code, checked)}
                          disabled={currency.code === defaultCurrency}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveCurrencies} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Currency Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
