-- Drop and recreate the check constraint to add new template types
ALTER TABLE public.notification_templates 
DROP CONSTRAINT IF EXISTS notification_templates_template_type_check;

ALTER TABLE public.notification_templates 
ADD CONSTRAINT notification_templates_template_type_check 
CHECK (template_type IN (
  'pickup_reminder_email_customer',
  'pickup_reminder_email_partner',
  'pickup_reminder_whatsapp_customer',
  'pickup_reminder_whatsapp_partner',
  'booking_confirmation_email_customer',
  'booking_confirmation_email_partner',
  'booking_confirmation_whatsapp_customer',
  'booking_confirmation_whatsapp_partner'
));