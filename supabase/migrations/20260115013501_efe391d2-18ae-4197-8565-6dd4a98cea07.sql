-- Add columns to track outbound and return validation separately
-- This allows one QR code to be scanned twice: once for outbound, once for return
-- Each leg can be validated by a different partner (company)

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS outbound_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outbound_validated_by_user_id UUID,
ADD COLUMN IF NOT EXISTS outbound_validated_by_partner_id UUID REFERENCES public.partners(id),
ADD COLUMN IF NOT EXISTS return_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_validated_by_user_id UUID,
ADD COLUMN IF NOT EXISTS return_validated_by_partner_id UUID REFERENCES public.partners(id);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_outbound_validated ON public.tickets(outbound_validated_at) WHERE outbound_validated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_return_validated ON public.tickets(return_validated_at) WHERE return_validated_at IS NOT NULL;

-- Update checkin_events to track which leg was validated
ALTER TABLE public.checkin_events 
ADD COLUMN IF NOT EXISTS leg_type TEXT CHECK (leg_type IN ('outbound', 'return'));