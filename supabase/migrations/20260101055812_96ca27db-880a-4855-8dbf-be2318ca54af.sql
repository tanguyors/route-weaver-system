-- Add onboarding tracking columns to partner_settings
ALTER TABLE public.partner_settings
ADD COLUMN IF NOT EXISTS onboarding_business_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_payments_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_cancellation_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_tickets_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_terms_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_notifications_completed boolean NOT NULL DEFAULT false;

-- Create a function to check if partner onboarding is complete
CREATE OR REPLACE FUNCTION public.is_partner_onboarding_complete(_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      onboarding_business_completed AND
      onboarding_payments_completed AND
      onboarding_cancellation_completed AND
      onboarding_tickets_completed AND
      onboarding_terms_completed AND
      onboarding_notifications_completed
    FROM public.partner_settings
    WHERE partner_id = _partner_id),
    false
  )
$$;