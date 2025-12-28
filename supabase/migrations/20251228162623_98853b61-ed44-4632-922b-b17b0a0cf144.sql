-- Create platform_settings table for admin-managed global settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform_settings"
ON public.platform_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Authenticated users can view platform settings (for commission calculations)
CREATE POLICY "Authenticated can view platform_settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission rate
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES 
  ('commission_rate', '{"percent": 7}', 'Default platform commission rate in percent'),
  ('payment_providers', '{"enabled": ["manual", "stripe", "xendit", "midtrans"]}', 'Enabled payment providers'),
  ('currencies', '{"default": "IDR", "enabled": ["IDR", "USD", "EUR"]}', 'Supported currencies');