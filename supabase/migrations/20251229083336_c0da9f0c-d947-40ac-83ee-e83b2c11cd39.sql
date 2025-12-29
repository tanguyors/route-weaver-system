-- Create enum for addon type
CREATE TYPE public.addon_type AS ENUM ('pickup', 'generic');

-- Create enum for addon pricing model
CREATE TYPE public.addon_pricing_model AS ENUM ('per_person', 'per_booking');

-- Create enum for addon applicability
CREATE TYPE public.addon_applicability AS ENUM ('fastboat', 'activities', 'both');

-- Create addons table (master data for available add-ons)
CREATE TABLE public.addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type addon_type NOT NULL DEFAULT 'generic',
  pricing_model addon_pricing_model NOT NULL DEFAULT 'per_booking',
  price NUMERIC NOT NULL DEFAULT 0,
  status route_status NOT NULL DEFAULT 'active',
  -- Pick-up specific fields
  enable_pickup_zones BOOLEAN DEFAULT false,
  pickup_required_info JSONB DEFAULT '{"hotel_name": false, "address": false, "pickup_note": false}'::jsonb,
  is_mandatory BOOLEAN DEFAULT false,
  -- Applicability
  applicability addon_applicability NOT NULL DEFAULT 'both',
  applicable_route_ids UUID[] DEFAULT '{}'::uuid[],
  applicable_trip_ids UUID[] DEFAULT '{}'::uuid[],
  applicable_schedule_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pickup_zones table
CREATE TABLE public.pickup_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  price_override NUMERIC,
  status route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add reference to addon in booking_addons
ALTER TABLE public.booking_addons 
ADD COLUMN addon_id UUID REFERENCES public.addons(id),
ADD COLUMN pickup_zone_id UUID REFERENCES public.pickup_zones(id),
ADD COLUMN pickup_info JSONB;

-- Enable RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addons
CREATE POLICY "Admins can manage all addons" 
ON public.addons FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own addons" 
ON public.addons FOR ALL 
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own addons" 
ON public.addons FOR SELECT 
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for pickup_zones
CREATE POLICY "Admins can manage all pickup_zones" 
ON public.pickup_zones FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own pickup_zones" 
ON public.pickup_zones FOR ALL 
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own pickup_zones" 
ON public.pickup_zones FOR SELECT 
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Add trigger for updated_at on addons
CREATE TRIGGER update_addons_updated_at
BEFORE UPDATE ON public.addons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_addons_partner_id ON public.addons(partner_id);
CREATE INDEX idx_addons_status ON public.addons(status);
CREATE INDEX idx_pickup_zones_addon_id ON public.pickup_zones(addon_id);