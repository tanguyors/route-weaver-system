
-- =====================================================
-- Feature 6: Accommodation Discount System
-- =====================================================

-- Table: accommodation_discounts
CREATE TABLE public.accommodation_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  code text,
  type text NOT NULL DEFAULT 'promo_code' CHECK (type IN ('promo_code', 'automatic')),
  category text NOT NULL DEFAULT 'booking_percent' CHECK (category IN ('booking_fixed', 'booking_percent', 'per_night_fixed', 'per_night_percent', 'early_bird', 'last_minute', 'long_stay')),
  discount_value numeric NOT NULL DEFAULT 0,
  discount_value_type text NOT NULL DEFAULT 'percent' CHECK (discount_value_type IN ('percent', 'fixed')),
  book_start_date date,
  book_end_date date,
  checkin_start_date date,
  checkin_end_date date,
  minimum_spend numeric DEFAULT 0,
  min_nights integer,
  early_bird_days integer,
  last_minute_days integer,
  applicable_accommodation_ids uuid[] DEFAULT '{}'::uuid[],
  individual_use_only boolean DEFAULT false,
  usage_limit integer,
  limit_per_customer integer DEFAULT 1,
  usage_count integer NOT NULL DEFAULT 0,
  total_discounted_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: accommodation_discount_usage
CREATE TABLE public.accommodation_discount_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_id uuid NOT NULL REFERENCES public.accommodation_discounts(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.accommodation_bookings(id) ON DELETE SET NULL,
  customer_email text,
  customer_phone text,
  discounted_amount numeric NOT NULL DEFAULT 0,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accommodation_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_discount_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accommodation_discounts
CREATE POLICY "Admins can manage all accommodation_discounts"
  ON public.accommodation_discounts FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own accommodation_discounts"
  ON public.accommodation_discounts FOR ALL
  USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own accommodation_discounts"
  ON public.accommodation_discounts FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for accommodation_discount_usage
CREATE POLICY "Admins can manage all accommodation_discount_usage"
  ON public.accommodation_discount_usage FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own accommodation_discount_usage"
  ON public.accommodation_discount_usage FOR ALL
  USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own accommodation_discount_usage"
  ON public.accommodation_discount_usage FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Indexes
CREATE INDEX idx_accommodation_discounts_partner ON public.accommodation_discounts(partner_id);
CREATE INDEX idx_accommodation_discounts_status ON public.accommodation_discounts(status);
CREATE INDEX idx_accommodation_discounts_code ON public.accommodation_discounts(code) WHERE code IS NOT NULL;
CREATE INDEX idx_accommodation_discount_usage_discount ON public.accommodation_discount_usage(discount_id);
CREATE INDEX idx_accommodation_discount_usage_booking ON public.accommodation_discount_usage(booking_id);

-- Update trigger for accommodation_discounts
CREATE TRIGGER update_accommodation_discounts_updated_at
  BEFORE UPDATE ON public.accommodation_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
