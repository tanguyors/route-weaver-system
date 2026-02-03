-- Create notification_templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'pickup_reminder_email_customer',
    'pickup_reminder_email_partner',
    'pickup_reminder_whatsapp_customer',
    'pickup_reminder_whatsapp_partner'
  )),
  subject TEXT, -- Subject for emails, null for WhatsApp
  content TEXT NOT NULL, -- Template content with placeholders
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique template per type per partner
  CONSTRAINT unique_partner_template_type UNIQUE (partner_id, template_type)
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Partners can only access their own templates via partner_users
CREATE POLICY "Partners can view their own templates"
  ON public.notification_templates
  FOR SELECT
  USING (
    partner_id IN (
      SELECT pu.partner_id FROM partner_users pu
      WHERE pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can create their own templates"
  ON public.notification_templates
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT pu.partner_id FROM partner_users pu
      WHERE pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own templates"
  ON public.notification_templates
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT pu.partner_id FROM partner_users pu
      WHERE pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can delete their own templates"
  ON public.notification_templates
  FOR DELETE
  USING (
    partner_id IN (
      SELECT pu.partner_id FROM partner_users pu
      WHERE pu.user_id = auth.uid()
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_notification_templates_partner_id ON public.notification_templates(partner_id);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(template_type);