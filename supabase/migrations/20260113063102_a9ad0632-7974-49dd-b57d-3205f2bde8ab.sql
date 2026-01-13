-- Drop the old assignment table (linked to boats) and recreate linked to routes
DROP TABLE IF EXISTS public.private_boat_addon_assignments;

-- Create new junction table linking activity addons to routes
CREATE TABLE public.private_boat_route_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.private_boat_routes(id) ON DELETE CASCADE,
  activity_addon_id UUID NOT NULL REFERENCES public.private_boat_activity_addons(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  pricing_type TEXT NOT NULL DEFAULT 'normal' CHECK (pricing_type IN ('included', 'normal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_id, activity_addon_id)
);

-- Enable RLS
ALTER TABLE public.private_boat_route_addons ENABLE ROW LEVEL SECURITY;

-- Partners can manage their own route addons
CREATE POLICY "Partners can manage their own route addons"
  ON public.private_boat_route_addons
  FOR ALL
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()
    )
  );

-- Public read access for widget
CREATE POLICY "Public can read route addons"
  ON public.private_boat_route_addons
  FOR SELECT
  USING (true);