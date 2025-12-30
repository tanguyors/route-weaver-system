-- Create enum for module types
CREATE TYPE public.module_type AS ENUM ('boat', 'activity');

-- Create enum for module status
CREATE TYPE public.module_status AS ENUM ('active', 'pending', 'disabled');

-- Create partner_modules table
CREATE TABLE public.partner_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  module_type module_type NOT NULL,
  status module_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id, module_type)
);

-- Enable RLS
ALTER TABLE public.partner_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all partner_modules"
ON public.partner_modules
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can view own modules"
ON public.partner_modules
FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Trigger for updated_at
CREATE TRIGGER update_partner_modules_updated_at
BEFORE UPDATE ON public.partner_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check if partner has active module
CREATE OR REPLACE FUNCTION public.partner_has_module(_partner_id uuid, _module_type module_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_modules
    WHERE partner_id = _partner_id
      AND module_type = _module_type
      AND status = 'active'
  )
$$;