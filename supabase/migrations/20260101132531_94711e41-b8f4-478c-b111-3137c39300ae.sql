-- Create boats table for boat inventory
CREATE TABLE public.boats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 50,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all boats"
  ON public.boats FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own boats"
  ON public.boats FOR ALL
  USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own boats"
  ON public.boats FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Add boat_id to departure_templates
ALTER TABLE public.departure_templates
  ADD COLUMN boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL;

-- Add boat_id to departures
ALTER TABLE public.departures
  ADD COLUMN boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL;