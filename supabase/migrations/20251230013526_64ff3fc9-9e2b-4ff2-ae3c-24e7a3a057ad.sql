-- Create enums for activity products
CREATE TYPE activity_product_type AS ENUM ('activity', 'time_slot', 'rental');
CREATE TYPE activity_product_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE activity_voucher_type AS ENUM ('e_voucher', 'paper_voucher', 'not_required');
CREATE TYPE guest_form_apply_type AS ENUM ('per_participant', 'per_booking');
CREATE TYPE duration_unit AS ENUM ('hour', 'day');

-- Activity Categories
CREATE TABLE public.activity_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status route_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Products
CREATE TABLE public.activity_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.activity_categories(id) ON DELETE SET NULL,
  product_type activity_product_type NOT NULL,
  language text NOT NULL DEFAULT 'en',
  name text NOT NULL,
  highlights text[] DEFAULT '{}',
  short_description text,
  full_description text,
  location_name text,
  location_lat numeric,
  location_lng numeric,
  voucher_type activity_voucher_type NOT NULL DEFAULT 'e_voucher',
  guest_form_enabled boolean DEFAULT false,
  guest_form_config jsonb DEFAULT '{"name": true, "phone": false, "age": false, "custom_fields": []}'::jsonb,
  guest_form_apply_to guest_form_apply_type DEFAULT 'per_booking',
  -- For activity type: default capacity per day
  default_capacity integer DEFAULT 50,
  -- For rental type: inventory count
  inventory_count integer DEFAULT 1,
  status activity_product_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Product Images
CREATE TABLE public.activity_product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Time Slots (for time_slot product type)
CREATE TABLE public.activity_time_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slot_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  status route_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Rental Options (for rental product type)
CREATE TABLE public.activity_rental_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  duration_unit duration_unit NOT NULL DEFAULT 'hour',
  duration_value integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  status route_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Pricing (for activity and time_slot types)
CREATE TABLE public.activity_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  tier_name text NOT NULL DEFAULT 'Adult',
  price numeric NOT NULL DEFAULT 0,
  min_age integer,
  max_age integer,
  status route_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_rental_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_categories
CREATE POLICY "Admins can view all activity_categories" ON public.activity_categories
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_categories" ON public.activity_categories
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_categories" ON public.activity_categories
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for activity_products
CREATE POLICY "Admins can view all activity_products" ON public.activity_products
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_products" ON public.activity_products
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_products" ON public.activity_products
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for activity_product_images
CREATE POLICY "Admins can view all activity_product_images" ON public.activity_product_images
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_product_images" ON public.activity_product_images
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_product_images" ON public.activity_product_images
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for activity_time_slots
CREATE POLICY "Admins can view all activity_time_slots" ON public.activity_time_slots
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_time_slots" ON public.activity_time_slots
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_time_slots" ON public.activity_time_slots
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for activity_rental_options
CREATE POLICY "Admins can view all activity_rental_options" ON public.activity_rental_options
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_rental_options" ON public.activity_rental_options
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_rental_options" ON public.activity_rental_options
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for activity_pricing
CREATE POLICY "Admins can view all activity_pricing" ON public.activity_pricing
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_pricing" ON public.activity_pricing
  FOR ALL USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_pricing" ON public.activity_pricing
  FOR SELECT USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Updated_at triggers
CREATE TRIGGER update_activity_categories_updated_at
  BEFORE UPDATE ON public.activity_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_products_updated_at
  BEFORE UPDATE ON public.activity_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_pricing_updated_at
  BEFORE UPDATE ON public.activity_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_activity_categories_partner ON public.activity_categories(partner_id);
CREATE INDEX idx_activity_products_partner ON public.activity_products(partner_id);
CREATE INDEX idx_activity_products_category ON public.activity_products(category_id);
CREATE INDEX idx_activity_products_type ON public.activity_products(product_type);
CREATE INDEX idx_activity_products_status ON public.activity_products(status);
CREATE INDEX idx_activity_product_images_product ON public.activity_product_images(product_id);
CREATE INDEX idx_activity_time_slots_product ON public.activity_time_slots(product_id);
CREATE INDEX idx_activity_rental_options_product ON public.activity_rental_options(product_id);
CREATE INDEX idx_activity_pricing_product ON public.activity_pricing(product_id);