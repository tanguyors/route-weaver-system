import { useState } from 'react';
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
import { XCircle, Loader2 } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';

interface CancellationSettingsFormProps {
  settings: PartnerSettings;
  onSave: (updates: Partial<PartnerSettings>, onboardingSection?: 'business' | 'payments' | 'cancellation' | 'tickets' | 'terms' | 'notifications') => Promise<boolean>;
  saving: boolean;
}

const CancellationSettingsForm = ({ settings, onSave, saving }: CancellationSettingsFormProps) => {
  const [formData, setFormData] = useState({
    cancellation_deadline_hours: settings.cancellation_deadline_hours || 24,
    cancellation_fee_type: settings.cancellation_fee_type || 'percent',
    cancellation_fee_value: settings.cancellation_fee_value || 10,
    refund_enabled: settings.refund_enabled ?? true,
    no_show_policy: settings.no_show_policy || 'no_refund',
  });

  const handleSave = () => {
    onSave(formData, 'cancellation');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Cancellation & Refund Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cancellation Deadline */}
        <div className="space-y-2">
          <Label>Cancellation Deadline (hours before departure)</Label>
          <Input
            type="number"
            min="0"
            value={formData.cancellation_deadline_hours}
            onChange={(e) => setFormData({ ...formData, cancellation_deadline_hours: parseInt(e.target.value) || 24 })}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Customers can cancel up to {formData.cancellation_deadline_hours} hours before departure
          </p>
        </div>

        {/* Cancellation Fee */}
        <div className="space-y-2">
          <Label>Cancellation Fee</Label>
          <div className="flex gap-2">
            <Select
              value={formData.cancellation_fee_type}
              onValueChange={(value) => setFormData({ ...formData, cancellation_fee_type: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              value={formData.cancellation_fee_value}
              onChange={(e) => setFormData({ ...formData, cancellation_fee_value: parseFloat(e.target.value) || 0 })}
              className="w-32"
            />
            <span className="self-center text-muted-foreground">
              {formData.cancellation_fee_type === 'percent' ? '%' : 'IDR'}
            </span>
          </div>
        </div>

        {/* Refund Enabled */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="refund"
            checked={formData.refund_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, refund_enabled: !!checked })}
          />
          <label htmlFor="refund" className="text-sm cursor-pointer">
            Enable refunds for cancellations
          </label>
        </div>

        {/* No-Show Policy */}
        <div className="space-y-2">
          <Label>No-Show Policy</Label>
          <Select
            value={formData.no_show_policy}
            onValueChange={(value) => setFormData({ ...formData, no_show_policy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_refund">No Refund</SelectItem>
              <SelectItem value="partial_refund">Partial Refund (50%)</SelectItem>
              <SelectItem value="reschedule_only">Reschedule Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Cancellation Rules
        </Button>
      </CardContent>
    </Card>
  );
};

export default CancellationSettingsForm;
