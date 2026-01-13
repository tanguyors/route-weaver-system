-- Create table for private boat activity add-ons (available activities for private boats)
CREATE TABLE public.private_boat_activity_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table to link activities to private boats with pricing type
CREATE TABLE public.private_boat_addon_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  private_boat_id UUID NOT NULL REFERENCES public.private_boats(id) ON DELETE CASCADE,
  activity_addon_id UUID NOT NULL REFERENCES public.private_boat_activity_addons(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  pricing_type TEXT NOT NULL DEFAULT 'normal' CHECK (pricing_type IN ('included', 'normal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(private_boat_id, activity_addon_id)
);

-- Enable Row Level Security
ALTER TABLE public.private_boat_activity_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_boat_addon_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for private_boat_activity_addons
CREATE POLICY "Partners can view their own activity addons"
  ON public.private_boat_activity_addons
  FOR SELECT
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can create their own activity addons"
  ON public.private_boat_activity_addons
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can update their own activity addons"
  ON public.private_boat_activity_addons
  FOR UPDATE
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can delete their own activity addons"
  ON public.private_boat_activity_addons
  FOR DELETE
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

-- RLS policies for private_boat_addon_assignments
CREATE POLICY "Partners can view their own addon assignments"
  ON public.private_boat_addon_assignments
  FOR SELECT
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can create their own addon assignments"
  ON public.private_boat_addon_assignments
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can update their own addon assignments"
  ON public.private_boat_addon_assignments
  FOR UPDATE
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can delete their own addon assignments"
  ON public.private_boat_addon_assignments
  FOR DELETE
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

-- Public read access for widget
CREATE POLICY "Public can view active activity addons"
  ON public.private_boat_activity_addons
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Public can view addon assignments"
  ON public.private_boat_addon_assignments
  FOR SELECT
  USING (true);

-- Create trigger for updated_at on private_boat_activity_addons
CREATE TRIGGER update_private_boat_activity_addons_updated_at
  BEFORE UPDATE ON public.private_boat_activity_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();