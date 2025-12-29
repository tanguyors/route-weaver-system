import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2 } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSettingsFormProps {
  settings: PartnerSettings;
  onSave: (updates: Partial<PartnerSettings>) => Promise<boolean>;
  saving: boolean;
}

const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card' },
  { id: 'qris', label: 'QRIS' },
  { id: 'transfer', label: 'Bank Transfer' },
  { id: 'cash', label: 'Cash' },
  { id: 'payment_link', label: 'Payment Link' },
];

const PaymentSettingsForm = ({ settings, onSave, saving }: PaymentSettingsFormProps) => {
  const [formData, setFormData] = useState({
    payment_methods_enabled: settings.payment_methods_enabled || [],
    default_payment_provider: settings.default_payment_provider || 'manual',
    currency: settings.currency || 'IDR',
    deposit_enabled: settings.deposit_enabled || false,
    min_deposit_percent: settings.min_deposit_percent || 50,
  });
  const [commissionRate, setCommissionRate] = useState<number>(7);

  useEffect(() => {
    const fetchCommissionRate = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'commission_rate')
        .single();
      
      if (data?.setting_value) {
        const value = data.setting_value as { percent?: number };
        if (value.percent !== undefined) {
          setCommissionRate(value.percent);
        }
      }
    };
    fetchCommissionRate();
  }, []);

  const handleMethodToggle = (methodId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      payment_methods_enabled: checked
        ? [...prev.payment_methods_enabled, methodId]
        : prev.payment_methods_enabled.filter((m) => m !== methodId),
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Methods */}
        <div className="space-y-3">
          <Label>Enabled Payment Methods</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <Checkbox
                  id={method.id}
                  checked={formData.payment_methods_enabled.includes(method.id)}
                  onCheckedChange={(checked) => handleMethodToggle(method.id, !!checked)}
                />
                <label htmlFor={method.id} className="text-sm cursor-pointer">
                  {method.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Default Provider */}
        <div className="space-y-2">
          <Label>Default Payment Provider</Label>
          <Select
            value={formData.default_payment_provider}
            onValueChange={(value) => setFormData({ ...formData, default_payment_provider: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="xendit">Xendit</SelectItem>
              <SelectItem value="midtrans">Midtrans</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deposit Settings */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deposit"
              checked={formData.deposit_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, deposit_enabled: !!checked })}
            />
            <label htmlFor="deposit" className="text-sm cursor-pointer">
              Allow deposit payments
            </label>
          </div>

          {formData.deposit_enabled && (
            <div className="ml-6 space-y-2">
              <Label>Minimum Deposit (%)</Label>
              <Input
                type="number"
                min="10"
                max="90"
                value={formData.min_deposit_percent}
                onChange={(e) => setFormData({ ...formData, min_deposit_percent: parseInt(e.target.value) || 50 })}
                className="w-32"
              />
            </div>
          )}
        </div>

        {/* Platform Commission Notice */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <strong>Note:</strong> Platform commission ({commissionRate}%) is automatically applied to all transactions and cannot be modified.
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Payment Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentSettingsForm;
