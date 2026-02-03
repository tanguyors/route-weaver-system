-- Add dedicated WhatsApp number field with country code for partners
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS whatsapp_country_code TEXT DEFAULT '+62',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;