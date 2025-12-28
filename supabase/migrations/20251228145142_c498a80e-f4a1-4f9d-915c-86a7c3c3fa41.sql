-- Create partner_settings table for configurable settings
CREATE TABLE public.partner_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- Payment Settings
  payment_methods_enabled TEXT[] DEFAULT ARRAY['cash', 'transfer', 'qris']::TEXT[],
  default_payment_provider TEXT DEFAULT 'manual',
  currency TEXT DEFAULT 'IDR',
  deposit_enabled BOOLEAN DEFAULT false,
  min_deposit_percent INTEGER DEFAULT 50,
  
  -- Cancellation & Refund Rules
  cancellation_deadline_hours INTEGER DEFAULT 24,
  cancellation_fee_type TEXT DEFAULT 'percent', -- 'percent' or 'fixed'
  cancellation_fee_value NUMERIC DEFAULT 10,
  refund_enabled BOOLEAN DEFAULT true,
  no_show_policy TEXT DEFAULT 'no_refund',
  
  -- Ticket & Check-in Settings
  ticket_validity_hours INTEGER DEFAULT 24,
  checkin_requires_full_payment BOOLEAN DEFAULT true,
  qr_override_allowed BOOLEAN DEFAULT false,
  auto_expire_tickets BOOLEAN DEFAULT true,
  
  -- Notification Settings
  email_booking_confirmation BOOLEAN DEFAULT true,
  email_payment_received BOOLEAN DEFAULT true,
  email_cancellation BOOLEAN DEFAULT true,
  whatsapp_booking_confirmation BOOLEAN DEFAULT false,
  whatsapp_payment_link BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(partner_id)
);

-- Enable RLS
ALTER TABLE public.partner_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all partner_settings"
ON public.partner_settings
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own settings"
ON public.partner_settings
FOR ALL
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own settings"
ON public.partner_settings
FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Create trigger for updated_at
CREATE TRIGGER update_partner_settings_updated_at
BEFORE UPDATE ON public.partner_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for existing partners
INSERT INTO public.partner_settings (partner_id)
SELECT id FROM public.partners
ON CONFLICT (partner_id) DO NOTHING;