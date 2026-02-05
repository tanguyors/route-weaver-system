-- Create junction table for boat facilities
CREATE TABLE public.boat_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  is_free BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(boat_id, facility_id)
);

-- Enable RLS
ALTER TABLE public.boat_facilities ENABLE ROW LEVEL SECURITY;

-- Partners can manage their own boat facilities
CREATE POLICY "Partners can manage their boat facilities"
ON public.boat_facilities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.boats b
    JOIN public.partner_users pu ON pu.partner_id = b.partner_id
    WHERE b.id = boat_facilities.boat_id
    AND pu.user_id = auth.uid()
    AND pu.status = 'active'
  )
);

-- Admins can manage all
CREATE POLICY "Admins can manage all boat facilities"
ON public.boat_facilities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view boat facilities (for widget display)
CREATE POLICY "Everyone can view boat facilities"
ON public.boat_facilities
FOR SELECT
USING (true);