
-- =============================================
-- MODULE ACCOMMODATION — Phase 1 Migration
-- =============================================

-- 1. Add 'accommodation' to the module_type enum
ALTER TYPE public.module_type ADD VALUE IF NOT EXISTS 'accommodation';

-- 2. Update create_partner_with_modules to accept 'accommodation'
CREATE OR REPLACE FUNCTION public.create_partner_with_modules(
  _user_id uuid, _partner_name text, _contact_name text, _contact_email text, _module_types text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner_id uuid;
  _module text;
BEGIN
  IF _partner_name IS NULL OR length(trim(_partner_name)) < 2 THEN
    RAISE EXCEPTION 'Partner name must be at least 2 characters';
  END IF;
  IF _contact_name IS NULL OR length(trim(_contact_name)) < 2 THEN
    RAISE EXCEPTION 'Contact name must be at least 2 characters';
  END IF;
  IF array_length(_module_types, 1) IS NULL OR array_length(_module_types, 1) < 1 THEN
    RAISE EXCEPTION 'At least one module type is required';
  END IF;

  INSERT INTO public.partners (name, contact_name, contact_email, status)
  VALUES (trim(_partner_name), trim(_contact_name), trim(_contact_email), 'pending')
  RETURNING id INTO _partner_id;

  INSERT INTO public.partner_users (partner_id, user_id, role, status)
  VALUES (_partner_id, _user_id, 'PARTNER_OWNER', 'active');

  FOREACH _module IN ARRAY _module_types LOOP
    IF _module NOT IN ('boat', 'activity', 'accommodation') THEN
      RAISE EXCEPTION 'Invalid module type: %', _module;
    END IF;
    INSERT INTO public.partner_modules (partner_id, module_type, status)
    VALUES (_partner_id, _module::module_type, 'pending');
  END LOOP;

  RETURN _partner_id;
END;
$function$;

-- 3. Create accommodations table
CREATE TABLE public.accommodations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'villa',
  description text,
  capacity integer NOT NULL DEFAULT 2,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  amenities jsonb DEFAULT '[]'::jsonb,
  address text,
  city text,
  country text DEFAULT 'Indonesia',
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'draft',
  price_per_night numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  minimum_nights integer NOT NULL DEFAULT 1,
  checkin_time time DEFAULT '14:00',
  checkout_time time DEFAULT '11:00',
  ical_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create accommodation_images table
CREATE TABLE public.accommodation_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  file_path text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create accommodation_calendar table
CREATE TABLE public.accommodation_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  source text NOT NULL DEFAULT 'manual',
  booking_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (accommodation_id, date)
);

-- 6. Create accommodation_ical_imports table
CREATE TABLE public.accommodation_ical_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  platform_name text NOT NULL DEFAULT 'other',
  ical_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create accommodation_bookings table
CREATE TABLE public.accommodation_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  checkout_date date NOT NULL,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  guests_count integer NOT NULL DEFAULT 1,
  total_nights integer NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  status text NOT NULL DEFAULT 'draft',
  channel text NOT NULL DEFAULT 'online',
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Indexes
CREATE INDEX idx_accommodations_partner ON public.accommodations(partner_id);
CREATE INDEX idx_accommodations_status ON public.accommodations(status);
CREATE INDEX idx_accommodation_calendar_date ON public.accommodation_calendar(accommodation_id, date);
CREATE INDEX idx_accommodation_bookings_dates ON public.accommodation_bookings(accommodation_id, checkin_date, checkout_date);
CREATE INDEX idx_accommodation_bookings_partner ON public.accommodation_bookings(partner_id);
CREATE INDEX idx_accommodation_ical_imports_accommodation ON public.accommodation_ical_imports(accommodation_id);

-- 9. Updated_at triggers
CREATE TRIGGER update_accommodations_updated_at
  BEFORE UPDATE ON public.accommodations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accommodation_calendar_updated_at
  BEFORE UPDATE ON public.accommodation_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accommodation_ical_imports_updated_at
  BEFORE UPDATE ON public.accommodation_ical_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accommodation_bookings_updated_at
  BEFORE UPDATE ON public.accommodation_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Enable RLS on all tables
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_ical_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_bookings ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies — accommodations
CREATE POLICY "Partners can view own accommodations"
  ON public.accommodations FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can create accommodations"
  ON public.accommodations FOR INSERT
  WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can update own accommodations"
  ON public.accommodations FOR UPDATE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can delete own accommodations"
  ON public.accommodations FOR DELETE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

-- 12. RLS Policies — accommodation_images
CREATE POLICY "Partners can view own accommodation images"
  ON public.accommodation_images FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can insert accommodation images"
  ON public.accommodation_images FOR INSERT
  WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can update own accommodation images"
  ON public.accommodation_images FOR UPDATE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can delete own accommodation images"
  ON public.accommodation_images FOR DELETE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

-- 13. RLS Policies — accommodation_calendar
CREATE POLICY "Partners can view own calendar"
  ON public.accommodation_calendar FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Public can view calendar for active accommodations"
  ON public.accommodation_calendar FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accommodations a
      WHERE a.id = accommodation_id AND a.status = 'active'
    )
  );

CREATE POLICY "Partners can insert calendar entries"
  ON public.accommodation_calendar FOR INSERT
  WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can update own calendar entries"
  ON public.accommodation_calendar FOR UPDATE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can delete own calendar entries"
  ON public.accommodation_calendar FOR DELETE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

-- 14. RLS Policies — accommodation_ical_imports
CREATE POLICY "Partners can view own ical imports"
  ON public.accommodation_ical_imports FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can insert ical imports"
  ON public.accommodation_ical_imports FOR INSERT
  WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can update own ical imports"
  ON public.accommodation_ical_imports FOR UPDATE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can delete own ical imports"
  ON public.accommodation_ical_imports FOR DELETE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

-- 15. RLS Policies — accommodation_bookings
CREATE POLICY "Partners can view own bookings"
  ON public.accommodation_bookings FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can create bookings"
  ON public.accommodation_bookings FOR INSERT
  WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can update own bookings"
  ON public.accommodation_bookings FOR UPDATE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

CREATE POLICY "Partners can delete own bookings"
  ON public.accommodation_bookings FOR DELETE
  USING (user_belongs_to_partner(auth.uid(), partner_id) OR is_admin(auth.uid()));

-- 16. Storage bucket for accommodation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('accommodation-images', 'accommodation-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view accommodation images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'accommodation-images');

CREATE POLICY "Partners can upload accommodation images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'accommodation-images' AND auth.role() = 'authenticated');

CREATE POLICY "Partners can delete own accommodation images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'accommodation-images' AND auth.role() = 'authenticated');
