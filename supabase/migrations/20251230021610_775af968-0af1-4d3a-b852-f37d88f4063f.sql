-- =============================================
-- ACTIVITY AVAILABILITY ENGINE
-- =============================================

-- 1. Create enum for availability status
CREATE TYPE public.availability_status AS ENUM ('open', 'closed');

-- 2. Create activity_availability_days table
CREATE TABLE public.activity_availability_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  date date NOT NULL,
  status availability_status NOT NULL DEFAULT 'open',
  capacity_override integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, date)
);

-- 3. Create activity_blackout_ranges table
CREATE TABLE public.activity_blackout_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 4. Create activity_availability_slots table (for time_slot products)
CREATE TABLE public.activity_availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  date date NOT NULL,
  slot_time time NOT NULL,
  status availability_status NOT NULL DEFAULT 'open',
  capacity_override integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, date, slot_time)
);

-- 5. Enable RLS
ALTER TABLE public.activity_availability_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_blackout_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_availability_slots ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for activity_availability_days
CREATE POLICY "Admins can manage all activity_availability_days"
ON public.activity_availability_days FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_availability_days"
ON public.activity_availability_days FOR ALL
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_availability_days"
ON public.activity_availability_days FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- 7. RLS Policies for activity_blackout_ranges
CREATE POLICY "Admins can manage all activity_blackout_ranges"
ON public.activity_blackout_ranges FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_blackout_ranges"
ON public.activity_blackout_ranges FOR ALL
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_blackout_ranges"
ON public.activity_blackout_ranges FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- 8. RLS Policies for activity_availability_slots
CREATE POLICY "Admins can manage all activity_availability_slots"
ON public.activity_availability_slots FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_availability_slots"
ON public.activity_availability_slots FOR ALL
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_availability_slots"
ON public.activity_availability_slots FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- 9. Triggers for updated_at
CREATE TRIGGER update_activity_availability_days_updated_at
BEFORE UPDATE ON public.activity_availability_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_blackout_ranges_updated_at
BEFORE UPDATE ON public.activity_blackout_ranges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_availability_slots_updated_at
BEFORE UPDATE ON public.activity_availability_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Triggers to auto-set partner_id from product
CREATE OR REPLACE FUNCTION public.set_availability_partner_from_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT partner_id INTO NEW.partner_id
  FROM public.activity_products
  WHERE id = NEW.product_id;
  
  IF NEW.partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), NEW.partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not belong to this partner';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_availability_days_partner
BEFORE INSERT ON public.activity_availability_days
FOR EACH ROW EXECUTE FUNCTION public.set_availability_partner_from_product();

CREATE TRIGGER set_blackout_ranges_partner
BEFORE INSERT ON public.activity_blackout_ranges
FOR EACH ROW EXECUTE FUNCTION public.set_availability_partner_from_product();

CREATE TRIGGER set_availability_slots_partner
BEFORE INSERT ON public.activity_availability_slots
FOR EACH ROW EXECUTE FUNCTION public.set_availability_partner_from_product();

-- =============================================
-- RPCs
-- =============================================

-- 11. get_product_availability RPC
CREATE OR REPLACE FUNCTION public.get_product_availability(
  _product_id uuid,
  _start_date date,
  _end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _product record;
  _partner_id uuid;
  _result jsonb := '[]'::jsonb;
  _current_date date;
  _day_data jsonb;
  _is_blackout boolean;
  _day_override record;
  _slot record;
  _slots jsonb;
  _slot_override record;
  _effective_status text;
  _effective_capacity int;
BEGIN
  -- Get product and validate access
  SELECT * INTO _product FROM public.activity_products WHERE id = _product_id;
  IF _product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  _partner_id := _product.partner_id;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Iterate through date range
  _current_date := _start_date;
  WHILE _current_date <= _end_date LOOP
    -- Check blackout
    SELECT EXISTS (
      SELECT 1 FROM public.activity_blackout_ranges
      WHERE product_id = _product_id
        AND _current_date BETWEEN start_date AND end_date
    ) INTO _is_blackout;
    
    -- Get day override
    SELECT * INTO _day_override
    FROM public.activity_availability_days
    WHERE product_id = _product_id AND date = _current_date;
    
    -- Compute based on product type
    IF _product.product_type = 'time_slot' THEN
      -- Time slot: build slots array
      _slots := '[]'::jsonb;
      
      FOR _slot IN 
        SELECT ts.slot_time, ts.capacity, ts.status as base_status
        FROM public.activity_time_slots ts
        WHERE ts.product_id = _product_id AND ts.status = 'active'
        ORDER BY ts.slot_time
      LOOP
        -- Get slot override for this date
        SELECT * INTO _slot_override
        FROM public.activity_availability_slots
        WHERE product_id = _product_id 
          AND date = _current_date 
          AND slot_time = _slot.slot_time;
        
        -- Determine slot status
        IF _is_blackout THEN
          _effective_status := 'closed';
        ELSIF _day_override IS NOT NULL AND _day_override.status = 'closed' THEN
          _effective_status := 'closed';
        ELSIF _slot_override IS NOT NULL AND _slot_override.status = 'closed' THEN
          _effective_status := 'closed';
        ELSE
          _effective_status := 'open';
        END IF;
        
        -- Determine slot capacity
        IF _slot_override IS NOT NULL AND _slot_override.capacity_override IS NOT NULL THEN
          _effective_capacity := _slot_override.capacity_override;
        ELSE
          _effective_capacity := _slot.capacity;
        END IF;
        
        _slots := _slots || jsonb_build_object(
          'slot_time', _slot.slot_time::text,
          'status', _effective_status,
          'capacity', _effective_capacity
        );
      END LOOP;
      
      _day_data := jsonb_build_object(
        'date', _current_date,
        'status', CASE WHEN _is_blackout OR (_day_override IS NOT NULL AND _day_override.status = 'closed') THEN 'closed' ELSE 'open' END,
        'note', _day_override.note,
        'slots', _slots
      );
      
    ELSE
      -- Activity or Rental
      IF _is_blackout THEN
        _effective_status := 'closed';
      ELSIF _day_override IS NOT NULL AND _day_override.status = 'closed' THEN
        _effective_status := 'closed';
      ELSE
        _effective_status := 'open';
      END IF;
      
      IF _day_override IS NOT NULL AND _day_override.capacity_override IS NOT NULL THEN
        _effective_capacity := _day_override.capacity_override;
      ELSIF _product.product_type = 'rental' THEN
        _effective_capacity := _product.inventory_count;
      ELSE
        _effective_capacity := _product.default_capacity;
      END IF;
      
      _day_data := jsonb_build_object(
        'date', _current_date,
        'status', _effective_status,
        'capacity', _effective_capacity,
        'note', _day_override.note
      );
    END IF;
    
    _result := _result || _day_data;
    _current_date := _current_date + 1;
  END LOOP;
  
  RETURN _result;
END;
$$;

-- 12. set_blackout_range RPC
CREATE OR REPLACE FUNCTION public.set_blackout_range(
  _product_id uuid,
  _start_date date,
  _end_date date,
  _reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _new_id uuid;
BEGIN
  -- Validate dates
  IF _end_date < _start_date THEN
    RAISE EXCEPTION 'End date must be >= start date';
  END IF;
  
  -- Get partner_id and validate access
  SELECT partner_id INTO _partner_id
  FROM public.activity_products
  WHERE id = _product_id;
  
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Insert blackout range
  INSERT INTO public.activity_blackout_ranges (partner_id, product_id, start_date, end_date, reason)
  VALUES (_partner_id, _product_id, _start_date, _end_date, _reason)
  RETURNING id INTO _new_id;
  
  RETURN _new_id;
END;
$$;

-- 13. upsert_availability_day RPC
CREATE OR REPLACE FUNCTION public.upsert_availability_day(
  _product_id uuid,
  _date date,
  _status availability_status,
  _capacity_override integer DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _result_id uuid;
BEGIN
  -- Get partner_id and validate access
  SELECT partner_id INTO _partner_id
  FROM public.activity_products
  WHERE id = _product_id;
  
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Upsert
  INSERT INTO public.activity_availability_days (partner_id, product_id, date, status, capacity_override, note)
  VALUES (_partner_id, _product_id, _date, _status, _capacity_override, _note)
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    status = EXCLUDED.status,
    capacity_override = EXCLUDED.capacity_override,
    note = EXCLUDED.note,
    updated_at = now()
  RETURNING id INTO _result_id;
  
  RETURN _result_id;
END;
$$;

-- 14. upsert_availability_slot RPC
CREATE OR REPLACE FUNCTION public.upsert_availability_slot(
  _product_id uuid,
  _date date,
  _slot_time time,
  _status availability_status,
  _capacity_override integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _product_type text;
  _slot_exists boolean;
  _result_id uuid;
BEGIN
  -- Get product and validate
  SELECT partner_id, product_type INTO _partner_id, _product_type
  FROM public.activity_products
  WHERE id = _product_id;
  
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  IF _product_type != 'time_slot' THEN
    RAISE EXCEPTION 'This operation is only for time_slot products';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Validate slot_time exists in activity_time_slots
  SELECT EXISTS (
    SELECT 1 FROM public.activity_time_slots
    WHERE product_id = _product_id AND slot_time = _slot_time AND status = 'active'
  ) INTO _slot_exists;
  
  IF NOT _slot_exists THEN
    RAISE EXCEPTION 'Slot time % does not exist for this product', _slot_time;
  END IF;
  
  -- Upsert
  INSERT INTO public.activity_availability_slots (partner_id, product_id, date, slot_time, status, capacity_override)
  VALUES (_partner_id, _product_id, _date, _slot_time, _status, _capacity_override)
  ON CONFLICT (product_id, date, slot_time)
  DO UPDATE SET
    status = EXCLUDED.status,
    capacity_override = EXCLUDED.capacity_override,
    updated_at = now()
  RETURNING id INTO _result_id;
  
  RETURN _result_id;
END;
$$;

-- 15. delete_blackout_range RPC
CREATE OR REPLACE FUNCTION public.delete_blackout_range(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
BEGIN
  SELECT partner_id INTO _partner_id
  FROM public.activity_blackout_ranges
  WHERE id = _id;
  
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Blackout range not found';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  DELETE FROM public.activity_blackout_ranges WHERE id = _id;
END;
$$;