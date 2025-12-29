import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';

interface CancellationTier {
  days_min: number;
  days_max: number;
  refund_percent: number;
}

interface TermsSettingsFormProps {
  settings: PartnerSettings;
  onSave: (updates: Partial<PartnerSettings>) => Promise<boolean>;
  saving: boolean;
}

const TermsSettingsForm = ({ settings, onSave, saving }: TermsSettingsFormProps) => {
  const [termsBooking, setTermsBooking] = useState(settings.terms_booking || '');
  const [termsVoucher, setTermsVoucher] = useState(settings.terms_voucher || '');
  const [cancellationEnabled, setCancellationEnabled] = useState(settings.cancellation_policy_enabled ?? true);
  const [cancellationTiers, setCancellationTiers] = useState<CancellationTier[]>(
    (settings.cancellation_policy_tiers as CancellationTier[]) || [
      { days_min: 0, days_max: 3, refund_percent: 0 },
      { days_min: 4, days_max: 14, refund_percent: 40 },
      { days_min: 15, days_max: 30, refund_percent: 90 },
    ]
  );
  const [taxServicePercent, setTaxServicePercent] = useState(settings.tax_service_percent || 16);
  const [maxBookingAdvanceDays, setMaxBookingAdvanceDays] = useState(settings.max_booking_advance_days || 0);

  const handleAddTier = () => {
    const lastTier = cancellationTiers[cancellationTiers.length - 1];
    const newDaysMin = lastTier ? lastTier.days_max + 1 : 0;
    setCancellationTiers([
      ...cancellationTiers,
      { days_min: newDaysMin, days_max: newDaysMin + 7, refund_percent: 100 },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setCancellationTiers(cancellationTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof CancellationTier, value: number) => {
    setCancellationTiers(
      cancellationTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      )
    );
  };

  const handleSave = () => {
    onSave({
      terms_booking: termsBooking,
      terms_voucher: termsVoucher,
      cancellation_policy_enabled: cancellationEnabled,
      cancellation_policy_tiers: cancellationTiers as unknown as PartnerSettings['cancellation_policy_tiers'],
      tax_service_percent: taxServicePercent,
      max_booking_advance_days: maxBookingAdvanceDays,
    });
  };

  return (
    <div className="space-y-6">
      {/* Booking Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Booking Terms & Conditions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These terms will be displayed on booking confirmations and tickets
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={termsBooking}
            onChange={(e) => setTermsBooking(e.target.value)}
            placeholder="Enter your booking terms and conditions..."
            rows={12}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Voucher Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Voucher Terms</CardTitle>
          <p className="text-sm text-muted-foreground">
            Terms specific to vouchers and tickets
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={termsVoucher}
            onChange={(e) => setTermsVoucher(e.target.value)}
            placeholder="Enter voucher terms...&#10;• Voucher is valid for the above mentioned date only.&#10;• Voucher cannot be exchanged without approval.&#10;• etc."
            rows={6}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Reschedule & Cancellation Policy</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={cancellationEnabled}
              onCheckedChange={setCancellationEnabled}
            />
            <Label>Enable cancellation policy display</Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground px-2">
              <span>Days Min</span>
              <span>Days Max</span>
              <span>Refund %</span>
              <span></span>
            </div>
            {cancellationTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  value={tier.days_min}
                  onChange={(e) => handleTierChange(index, 'days_min', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <Input
                  type="number"
                  min="0"
                  value={tier.days_max}
                  onChange={(e) => handleTierChange(index, 'days_max', parseInt(e.target.value) || 0)}
                  placeholder="3"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.refund_percent}
                    onChange={(e) => handleTierChange(index, 'refund_percent', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTier(index)}
                  disabled={cancellationTiers.length <= 1}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddTier} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Tier
            </Button>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <strong>Preview:</strong>
            <ul className="mt-2 space-y-1">
              {cancellationTiers.map((tier, index) => (
                <li key={index}>
                  {tier.days_min} - {tier.days_max} days before scheduled arrival: <strong>{tier.refund_percent}% refund</strong>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Service */}
      <Card>
        <CardHeader>
          <CardTitle>Tax & Service Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tax & Service (%)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxServicePercent}
                  onChange={(e) => setTaxServicePercent(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Applied to ticket prices (e.g., 5% service + 11% VAT = 16%)
              </p>
            </div>
            <div>
              <Label>Max. Booking Calendar in Advance</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min="0"
                  value={maxBookingAdvanceDays}
                  onChange={(e) => setMaxBookingAdvanceDays(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-muted-foreground">day(s)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                0 for no date limit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Terms & Settings
      </Button>
    </div>
  );
};

export default TermsSettingsForm;
