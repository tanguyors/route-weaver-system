-- Create activity_booking_status enum
CREATE TYPE public.activity_booking_status AS ENUM ('draft', 'confirmed', 'cancelled', 'expired');

-- Create activity_bookings table
CREATE TABLE public.activity_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  product_id uuid NOT NULL REFERENCES public.activity_products(id),
  user_id uuid REFERENCES auth.users(id),
  booking_date date NOT NULL,
  slot_time time NULL,
  status public.activity_booking_status NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'IDR',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_qty integer NOT NULL DEFAULT 0,
  subtotal_amount numeric NOT NULL DEFAULT 0,
  customer jsonb NULL,
  guest_data jsonb NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_activity_bookings_product_date ON public.activity_bookings(product_id, booking_date);
CREATE INDEX idx_activity_bookings_partner_created ON public.activity_bookings(partner_id, created_at);
CREATE INDEX idx_activity_bookings_status_expires ON public.activity_bookings(status, expires_at) WHERE status = 'draft';

-- Create activity_booking_participants table
CREATE TABLE public.activity_booking_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.activity_bookings(id) ON DELETE CASCADE,
  name text NULL,
  phone text NULL,
  age integer NULL,
  custom_fields jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_participants_booking ON public.activity_booking_participants(booking_id);

-- Enable RLS
ALTER TABLE public.activity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_booking_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_bookings
CREATE POLICY "Admins can manage all activity_bookings"
  ON public.activity_bookings FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_bookings"
  ON public.activity_bookings FOR ALL
  USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_bookings"
  ON public.activity_bookings FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

CREATE POLICY "Public can view own draft bookings by id"
  ON public.activity_bookings FOR SELECT
  USING (true);

-- RLS policies for activity_booking_participants  
CREATE POLICY "Admins can manage all activity_booking_participants"
  ON public.activity_booking_participants FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can view participants via booking"
  ON public.activity_booking_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.activity_bookings b
    WHERE b.id = booking_id AND user_belongs_to_partner(auth.uid(), b.partner_id)
  ));

-- Trigger to auto-set partner_id from product
CREATE OR REPLACE FUNCTION public.set_booking_partner_from_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT partner_id INTO NEW.partner_id
  FROM public.activity_products
  WHERE id = NEW.product_id;
  
  IF NEW.partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_partner_trigger
  BEFORE INSERT ON public.activity_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_partner_from_product();

-- Trigger for updated_at
CREATE TRIGGER update_activity_bookings_updated_at
  BEFORE UPDATE ON public.activity_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: create_activity_booking_intent
CREATE OR REPLACE FUNCTION public.create_activity_booking_intent(
  _product_id uuid,
  _booking_date date,
  _slot_time time DEFAULT NULL,
  _line_items jsonb DEFAULT '[]'::jsonb,
  _customer jsonb DEFAULT NULL,
  _guest_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _product record;
  _partner_id uuid;
  _is_blackout boolean;
  _day_override record;
  _slot_override record;
  _base_slot record;
  _effective_capacity int;
  _total_qty int := 0;
  _subtotal numeric := 0;
  _item jsonb;
  _booking_id uuid;
  _expires_at timestamptz;
  _participant jsonb;
BEGIN
  -- 1. Load product and validate active
  SELECT * INTO _product FROM public.activity_products WHERE id = _product_id;
  IF _product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  IF _product.status != 'active' THEN
    RAISE EXCEPTION 'Product is not available for booking';
  END IF;
  
  _partner_id := _product.partner_id;
  
  -- 2. Check blackout range
  SELECT EXISTS (
    SELECT 1 FROM public.activity_blackout_ranges
    WHERE product_id = _product_id
      AND _booking_date BETWEEN start_date AND end_date
  ) INTO _is_blackout;
  
  IF _is_blackout THEN
    RAISE EXCEPTION 'Selected date is not available (blackout)';
  END IF;
  
  -- 3. Check day override status
  SELECT * INTO _day_override
  FROM public.activity_availability_days
  WHERE product_id = _product_id AND date = _booking_date;
  
  IF _day_override IS NOT NULL AND _day_override.status = 'closed' THEN
    RAISE EXCEPTION 'Selected date is closed';
  END IF;
  
  -- 4. For time_slot products, validate slot
  IF _product.product_type = 'time_slot' THEN
    IF _slot_time IS NULL THEN
      RAISE EXCEPTION 'Slot time is required for time slot products';
    END IF;
    
    -- Check base slot exists and is active
    SELECT * INTO _base_slot
    FROM public.activity_time_slots
    WHERE product_id = _product_id AND slot_time = _slot_time AND status = 'active';
    
    IF _base_slot IS NULL THEN
      RAISE EXCEPTION 'Selected time slot is not available';
    END IF;
    
    -- Check slot override
    SELECT * INTO _slot_override
    FROM public.activity_availability_slots
    WHERE product_id = _product_id AND date = _booking_date AND slot_time = _slot_time;
    
    IF _slot_override IS NOT NULL AND _slot_override.status = 'closed' THEN
      RAISE EXCEPTION 'Selected time slot is closed on this date';
    END IF;
    
    -- Determine effective capacity
    IF _slot_override IS NOT NULL AND _slot_override.capacity_override IS NOT NULL THEN
      _effective_capacity := _slot_override.capacity_override;
    ELSE
      _effective_capacity := _base_slot.capacity;
    END IF;
  ELSIF _product.product_type = 'rental' THEN
    -- For rental, use inventory_count or day override
    IF _day_override IS NOT NULL AND _day_override.capacity_override IS NOT NULL THEN
      _effective_capacity := _day_override.capacity_override;
    ELSE
      _effective_capacity := COALESCE(_product.inventory_count, 1);
    END IF;
  ELSE
    -- For activity, use default_capacity or day override
    IF _day_override IS NOT NULL AND _day_override.capacity_override IS NOT NULL THEN
      _effective_capacity := _day_override.capacity_override;
    ELSE
      _effective_capacity := COALESCE(_product.default_capacity, 50);
    END IF;
  END IF;
  
  -- 5. Compute total qty and subtotal from line_items
  FOR _item IN SELECT * FROM jsonb_array_elements(_line_items)
  LOOP
    _total_qty := _total_qty + COALESCE((_item->>'qty')::int, 0);
    _subtotal := _subtotal + (COALESCE((_item->>'qty')::int, 0) * COALESCE((_item->>'price')::numeric, 0));
  END LOOP;
  
  IF _total_qty <= 0 THEN
    RAISE EXCEPTION 'At least one item must be selected';
  END IF;
  
  -- 6. Validate capacity (check existing confirmed bookings too)
  DECLARE
    _existing_qty int;
  BEGIN
    IF _product.product_type = 'time_slot' THEN
      SELECT COALESCE(SUM(total_qty), 0) INTO _existing_qty
      FROM public.activity_bookings
      WHERE product_id = _product_id 
        AND booking_date = _booking_date 
        AND slot_time = _slot_time
        AND status IN ('draft', 'confirmed');
    ELSE
      SELECT COALESCE(SUM(total_qty), 0) INTO _existing_qty
      FROM public.activity_bookings
      WHERE product_id = _product_id 
        AND booking_date = _booking_date
        AND status IN ('draft', 'confirmed');
    END IF;
    
    IF (_existing_qty + _total_qty) > _effective_capacity THEN
      RAISE EXCEPTION 'Not enough capacity available. Requested: %, Available: %', _total_qty, (_effective_capacity - _existing_qty);
    END IF;
  END;
  
  -- 7. Insert booking
  _expires_at := now() + interval '30 minutes';
  
  INSERT INTO public.activity_bookings (
    partner_id, product_id, user_id, booking_date, slot_time, 
    status, line_items, total_qty, subtotal_amount, 
    customer, guest_data, expires_at
  ) VALUES (
    _partner_id, _product_id, auth.uid(), _booking_date, _slot_time,
    'draft', _line_items, _total_qty, _subtotal,
    _customer, _guest_data, _expires_at
  )
  RETURNING id INTO _booking_id;
  
  -- 8. If per_participant and guest_data has participants array, insert them
  IF _product.guest_form_apply_to = 'per_participant' AND _guest_data IS NOT NULL AND _guest_data ? 'participants' THEN
    FOR _participant IN SELECT * FROM jsonb_array_elements(_guest_data->'participants')
    LOOP
      INSERT INTO public.activity_booking_participants (booking_id, name, phone, age, custom_fields)
      VALUES (
        _booking_id,
        _participant->>'name',
        _participant->>'phone',
        (_participant->>'age')::int,
        _participant->'custom_fields'
      );
    END LOOP;
  END IF;
  
  -- 9. Return result
  RETURN jsonb_build_object(
    'booking_id', _booking_id,
    'expires_at', _expires_at,
    'subtotal_amount', _subtotal,
    'total_qty', _total_qty
  );
END;
$$;

-- RPC: expire_draft_bookings
CREATE OR REPLACE FUNCTION public.expire_draft_bookings()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int;
BEGIN
  UPDATE public.activity_bookings
  SET status = 'expired', updated_at = now()
  WHERE status = 'draft' AND expires_at < now();
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- RPC: confirm_activity_booking
CREATE OR REPLACE FUNCTION public.confirm_activity_booking(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _booking record;
BEGIN
  SELECT * INTO _booking FROM public.activity_bookings WHERE id = _booking_id;
  
  IF _booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  IF _booking.status = 'expired' OR _booking.expires_at < now() THEN
    -- Mark as expired if not already
    UPDATE public.activity_bookings SET status = 'expired', updated_at = now() WHERE id = _booking_id;
    RAISE EXCEPTION 'Booking has expired';
  END IF;
  
  IF _booking.status != 'draft' THEN
    RAISE EXCEPTION 'Booking cannot be confirmed (status: %)', _booking.status;
  END IF;
  
  UPDATE public.activity_bookings 
  SET status = 'confirmed', updated_at = now()
  WHERE id = _booking_id;
  
  RETURN jsonb_build_object('success', true, 'booking_id', _booking_id);
END;
$$;

-- RPC: get_activity_booking (for checkout page)
CREATE OR REPLACE FUNCTION public.get_activity_booking(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _booking record;
  _product record;
  _participants jsonb;
BEGIN
  SELECT * INTO _booking FROM public.activity_bookings WHERE id = _booking_id;
  
  IF _booking IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT * INTO _product FROM public.activity_products WHERE id = _booking.product_id;
  
  SELECT jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'phone', p.phone,
    'age', p.age,
    'custom_fields', p.custom_fields
  )) INTO _participants
  FROM public.activity_booking_participants p
  WHERE p.booking_id = _booking_id;
  
  RETURN jsonb_build_object(
    'id', _booking.id,
    'product_id', _booking.product_id,
    'product_name', _product.name,
    'product_type', _product.product_type,
    'booking_date', _booking.booking_date,
    'slot_time', _booking.slot_time,
    'status', _booking.status,
    'currency', _booking.currency,
    'line_items', _booking.line_items,
    'total_qty', _booking.total_qty,
    'subtotal_amount', _booking.subtotal_amount,
    'customer', _booking.customer,
    'guest_data', _booking.guest_data,
    'expires_at', _booking.expires_at,
    'participants', COALESCE(_participants, '[]'::jsonb),
    'is_expired', _booking.status = 'expired' OR _booking.expires_at < now()
  );
END;
$$;

-- RPC: get_widget_product (public, for widget)
CREATE OR REPLACE FUNCTION public.get_widget_product(_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _product record;
  _images jsonb;
  _pricing jsonb;
  _time_slots jsonb;
  _rental_options jsonb;
BEGIN
  SELECT * INTO _product FROM public.activity_products WHERE id = _product_id AND status = 'active';
  
  IF _product IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get images
  SELECT jsonb_agg(jsonb_build_object('id', id, 'image_url', image_url, 'display_order', display_order) ORDER BY display_order)
  INTO _images
  FROM public.activity_product_images WHERE product_id = _product_id;
  
  -- Get pricing tiers
  SELECT jsonb_agg(jsonb_build_object('id', id, 'tier_name', tier_name, 'price', price, 'min_age', min_age, 'max_age', max_age) ORDER BY price)
  INTO _pricing
  FROM public.activity_pricing WHERE product_id = _product_id AND status = 'active';
  
  -- Get time slots
  IF _product.product_type = 'time_slot' THEN
    SELECT jsonb_agg(jsonb_build_object('id', id, 'slot_time', slot_time, 'capacity', capacity) ORDER BY slot_time)
    INTO _time_slots
    FROM public.activity_time_slots WHERE product_id = _product_id AND status = 'active';
  END IF;
  
  -- Get rental options
  IF _product.product_type = 'rental' THEN
    SELECT jsonb_agg(jsonb_build_object('id', id, 'duration_unit', duration_unit, 'duration_value', duration_value, 'price', price) ORDER BY price)
    INTO _rental_options
    FROM public.activity_rental_options WHERE product_id = _product_id AND status = 'active';
  END IF;
  
  RETURN jsonb_build_object(
    'id', _product.id,
    'name', _product.name,
    'short_description', _product.short_description,
    'full_description', _product.full_description,
    'highlights', _product.highlights,
    'location_name', _product.location_name,
    'product_type', _product.product_type,
    'default_capacity', _product.default_capacity,
    'inventory_count', _product.inventory_count,
    'guest_form_enabled', _product.guest_form_enabled,
    'guest_form_config', _product.guest_form_config,
    'guest_form_apply_to', _product.guest_form_apply_to,
    'images', COALESCE(_images, '[]'::jsonb),
    'pricing', COALESCE(_pricing, '[]'::jsonb),
    'time_slots', COALESCE(_time_slots, '[]'::jsonb),
    'rental_options', COALESCE(_rental_options, '[]'::jsonb)
  );
END;
$$;