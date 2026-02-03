-- Add whatsapp_attach_ticket setting for Fonnte Ultra users
ALTER TABLE partner_settings 
ADD COLUMN IF NOT EXISTS whatsapp_attach_ticket boolean DEFAULT false;