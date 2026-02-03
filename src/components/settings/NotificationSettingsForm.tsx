import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageCircle, Loader2, Clock, Phone } from 'lucide-react';
import { PartnerSettings } from '@/hooks/useSettingsData';

// Common phone country codes sorted by code
const PHONE_COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+7', country: 'RU' },
  { code: '+31', country: 'NL' },
  { code: '+33', country: 'FR' },
  { code: '+34', country: 'ES' },
  { code: '+39', country: 'IT' },
  { code: '+44', country: 'UK' },
  { code: '+49', country: 'DE' },
  { code: '+60', country: 'MY' },
  { code: '+61', country: 'AU' },
  { code: '+62', country: 'ID' },
  { code: '+63', country: 'PH' },
  { code: '+65', country: 'SG' },
  { code: '+66', country: 'TH' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+84', country: 'VN' },
  { code: '+86', country: 'CN' },
  { code: '+91', country: 'IN' },
  { code: '+852', country: 'HK' },
  { code: '+886', country: 'TW' },
  { code: '+971', country: 'AE' },
].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

interface NotificationSettingsFormProps {
  settings: PartnerSettings;
  pickupReminderSettings?: {
    pickup_reminder_24h_enabled: boolean;
    pickup_reminder_12h_enabled: boolean;
  };
  whatsappSettings?: {
    whatsapp_country_code: string;
    whatsapp_number: string;
  };
  onSave: (updates: Partial<PartnerSettings>, onboardingSection?: 'business' | 'payments' | 'cancellation' | 'tickets' | 'terms' | 'notifications') => Promise<boolean>;
  onSavePickupReminders?: (updates: { 
    pickup_reminder_24h_enabled: boolean; 
    pickup_reminder_12h_enabled: boolean;
    whatsapp_country_code: string;
    whatsapp_number: string;
  }) => Promise<boolean>;
  saving: boolean;
}

const NotificationSettingsForm = ({ 
  settings, 
  pickupReminderSettings,
  whatsappSettings,
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

  const [whatsapp, setWhatsapp] = useState({
    whatsapp_country_code: whatsappSettings?.whatsapp_country_code || '+62',
    whatsapp_number: whatsappSettings?.whatsapp_number || '',
  });

  const handleSave = async () => {
    await onSave(formData, 'notifications');
    if (onSavePickupReminders) {
      await onSavePickupReminders({
        ...pickupReminders,
        ...whatsapp,
      });
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
        {/* WhatsApp Number Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">WhatsApp Number for Notifications</Label>
          </div>
          
          <p className="text-sm text-muted-foreground ml-6">
            Entrez votre numéro WhatsApp pour recevoir les rappels de pickup et autres notifications.
          </p>
          
          <div className="ml-6 flex gap-2">
            <Select 
              value={whatsapp.whatsapp_country_code} 
              onValueChange={(value) => setWhatsapp({ ...whatsapp, whatsapp_country_code: value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent>
                {PHONE_COUNTRY_CODES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code} ({item.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              placeholder="812345678"
              value={whatsapp.whatsapp_number}
              onChange={(e) => {
                // Only allow digits
                const value = e.target.value.replace(/\D/g, '');
                setWhatsapp({ ...whatsapp, whatsapp_number: value });
              }}
              className="flex-1 max-w-[200px]"
            />
          </div>
          
          {whatsapp.whatsapp_number && (
            <p className="text-xs text-muted-foreground ml-6">
              Numéro complet : <span className="font-mono font-medium">{whatsapp.whatsapp_country_code}{whatsapp.whatsapp_number}</span>
            </p>
          )}
        </div>

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
          
          {!whatsapp.whatsapp_number && (
            <p className="text-xs text-amber-600 ml-6">
              ⚠️ Veuillez configurer votre numéro WhatsApp ci-dessus pour recevoir ces notifications
            </p>
          )}
        </div>

        {/* Pickup Reminders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Pickup Reminders</Label>
          </div>
          
          <p className="text-sm text-muted-foreground ml-6">
            Envoyez automatiquement des rappels aux clients et à votre équipe avant les pickups planifiés (email + WhatsApp).
          </p>
          
          <div className="ml-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminder24h" className="cursor-pointer">
                  24 heures avant le pickup
                </Label>
                <p className="text-xs text-muted-foreground">Envoyer un rappel 24h avant l'heure de pickup prévue</p>
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
                  12 heures avant le pickup
                </Label>
                <p className="text-xs text-muted-foreground">Envoyer un rappel 12h avant l'heure de pickup prévue</p>
              </div>
              <Switch
                id="reminder12h"
                checked={pickupReminders.pickup_reminder_12h_enabled}
                onCheckedChange={(checked) => setPickupReminders({ ...pickupReminders, pickup_reminder_12h_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer les paramètres de notification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;
