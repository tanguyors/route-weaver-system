import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Loader2 } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';

interface TicketSettingsFormProps {
  settings: PartnerSettings;
  onSave: (updates: Partial<PartnerSettings>) => Promise<boolean>;
  saving: boolean;
}

const TicketSettingsForm = ({ settings, onSave, saving }: TicketSettingsFormProps) => {
  const [formData, setFormData] = useState({
    ticket_validity_hours: settings.ticket_validity_hours || 24,
    checkin_requires_full_payment: settings.checkin_requires_full_payment ?? true,
    qr_override_allowed: settings.qr_override_allowed || false,
    auto_expire_tickets: settings.auto_expire_tickets ?? true,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Ticket & Check-in Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ticket Validity */}
        <div className="space-y-2">
          <Label>Ticket Validity (hours after departure)</Label>
          <Input
            type="number"
            min="1"
            value={formData.ticket_validity_hours}
            onChange={(e) => setFormData({ ...formData, ticket_validity_hours: parseInt(e.target.value) || 24 })}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Tickets remain valid for {formData.ticket_validity_hours} hours after scheduled departure
          </p>
        </div>

        {/* Check-in Payment Requirement */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fullPayment"
              checked={formData.checkin_requires_full_payment}
              onCheckedChange={(checked) => setFormData({ ...formData, checkin_requires_full_payment: !!checked })}
            />
            <label htmlFor="fullPayment" className="text-sm cursor-pointer">
              Require full payment for check-in
            </label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {formData.checkin_requires_full_payment
              ? 'Only fully paid bookings can be checked in'
              : 'Deposit-paid bookings can also be checked in'}
          </p>
        </div>

        {/* QR Override */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qrOverride"
              checked={formData.qr_override_allowed}
              onCheckedChange={(checked) => setFormData({ ...formData, qr_override_allowed: !!checked })}
            />
            <label htmlFor="qrOverride" className="text-sm cursor-pointer">
              Allow QR scan override
            </label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Staff can override invalid QR scans (with audit log)
          </p>
        </div>

        {/* Auto-expire */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoExpire"
            checked={formData.auto_expire_tickets}
            onCheckedChange={(checked) => setFormData({ ...formData, auto_expire_tickets: !!checked })}
          />
          <label htmlFor="autoExpire" className="text-sm cursor-pointer">
            Auto-expire tickets after departure
          </label>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Ticket Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default TicketSettingsForm;
