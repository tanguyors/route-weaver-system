import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, MessageCircle, Loader2, Clock } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';

interface NotificationSettingsFormProps {
  settings: PartnerSettings;
  pickupReminderSettings?: {
    pickup_reminder_24h_enabled: boolean;
    pickup_reminder_12h_enabled: boolean;
  };
  onSave: (updates: Partial<PartnerSettings>, onboardingSection?: 'business' | 'payments' | 'cancellation' | 'tickets' | 'terms' | 'notifications') => Promise<boolean>;
  onSavePickupReminders?: (updates: { pickup_reminder_24h_enabled: boolean; pickup_reminder_12h_enabled: boolean }) => Promise<boolean>;
  saving: boolean;
}

const NotificationSettingsForm = ({ 
  settings, 
  pickupReminderSettings,
  onSave, 
  onSavePickupReminders,
  saving 
}: NotificationSettingsFormProps) => {
  const [formData, setFormData] = useState({
    email_booking_confirmation: settings.email_booking_confirmation ?? true,
    email_payment_received: settings.email_payment_received ?? true,
    email_cancellation: settings.email_cancellation ?? true,
    whatsapp_booking_confirmation: settings.whatsapp_booking_confirmation || false,
    whatsapp_payment_link: settings.whatsapp_payment_link || false,
  });

  const [pickupReminders, setPickupReminders] = useState({
    pickup_reminder_24h_enabled: pickupReminderSettings?.pickup_reminder_24h_enabled ?? true,
    pickup_reminder_12h_enabled: pickupReminderSettings?.pickup_reminder_12h_enabled ?? true,
  });

  const handleSave = async () => {
    await onSave(formData, 'notifications');
    if (onSavePickupReminders) {
      await onSavePickupReminders(pickupReminders);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Email Notifications</Label>
          </div>
          
          <div className="ml-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailBooking" className="cursor-pointer">
                Booking confirmation
              </Label>
              <Switch
                id="emailBooking"
                checked={formData.email_booking_confirmation}
                onCheckedChange={(checked) => setFormData({ ...formData, email_booking_confirmation: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailPayment" className="cursor-pointer">
                Payment received
              </Label>
              <Switch
                id="emailPayment"
                checked={formData.email_payment_received}
                onCheckedChange={(checked) => setFormData({ ...formData, email_payment_received: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailCancel" className="cursor-pointer">
                Cancellation notice
              </Label>
              <Switch
                id="emailCancel"
                checked={formData.email_cancellation}
                onCheckedChange={(checked) => setFormData({ ...formData, email_cancellation: checked })}
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">WhatsApp Notifications</Label>
          </div>
          
          <div className="ml-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="waBooking" className="cursor-pointer">
                Booking confirmation
              </Label>
              <Switch
                id="waBooking"
                checked={formData.whatsapp_booking_confirmation}
                onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_booking_confirmation: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="waPaymentLink" className="cursor-pointer">
                Payment link
              </Label>
              <Switch
                id="waPaymentLink"
                checked={formData.whatsapp_payment_link}
                onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_payment_link: checked })}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground ml-6">
            WhatsApp notifications require additional configuration
          </p>
        </div>

        {/* Pickup Reminders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Pickup Reminders</Label>
          </div>
          
          <p className="text-sm text-muted-foreground ml-6">
            Automatically send reminders to customers and your team before scheduled pickups via email and WhatsApp.
          </p>
          
          <div className="ml-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminder24h" className="cursor-pointer">
                  24 hours before pickup
                </Label>
                <p className="text-xs text-muted-foreground">Send reminder 24h before scheduled pickup time</p>
              </div>
              <Switch
                id="reminder24h"
                checked={pickupReminders.pickup_reminder_24h_enabled}
                onCheckedChange={(checked) => setPickupReminders({ ...pickupReminders, pickup_reminder_24h_enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminder12h" className="cursor-pointer">
                  12 hours before pickup
                </Label>
                <p className="text-xs text-muted-foreground">Send reminder 12h before scheduled pickup time</p>
              </div>
              <Switch
                id="reminder12h"
                checked={pickupReminders.pickup_reminder_12h_enabled}
                onCheckedChange={(checked) => setPickupReminders({ ...pickupReminders, pickup_reminder_12h_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;
