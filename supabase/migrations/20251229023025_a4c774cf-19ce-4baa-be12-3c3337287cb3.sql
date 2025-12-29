-- Add Terms & Conditions and booking settings columns to partner_settings table
ALTER TABLE public.partner_settings 
ADD COLUMN IF NOT EXISTS terms_booking text,
ADD COLUMN IF NOT EXISTS terms_voucher text,
ADD COLUMN IF NOT EXISTS cancellation_policy_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS cancellation_policy_tiers jsonb DEFAULT '[{"days_min": 0, "days_max": 3, "refund_percent": 0}, {"days_min": 4, "days_max": 14, "refund_percent": 40}, {"days_min": 15, "days_max": 30, "refund_percent": 90}]'::jsonb,
ADD COLUMN IF NOT EXISTS tax_service_percent numeric DEFAULT 16,
ADD COLUMN IF NOT EXISTS max_booking_advance_days integer DEFAULT 0;