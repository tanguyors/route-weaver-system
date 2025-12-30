-- Add cancelled_at column to activity_bookings
ALTER TABLE public.activity_bookings 
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz DEFAULT NULL;

-- Add completed status to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'activity_booking_status'::regtype) THEN
    ALTER TYPE activity_booking_status ADD VALUE 'completed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = 'activity_booking_status'::regtype) THEN
    ALTER TYPE activity_booking_status ADD VALUE 'cancelled';
  END IF;
END $$;

-- RPC: list_activity_bookings
CREATE OR REPLACE FUNCTION public.list_activity_bookings(
  _partner_id uuid DEFAULT NULL,
  _product_id uuid DEFAULT NULL,
  _status text DEFAULT NULL,
  _q text DEFAULT NULL,
  _date_from date DEFAULT NULL,
  _date_to date DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_partner_id uuid;
  _is_admin boolean;
  _effective_partner_id uuid;
  _result jsonb;
BEGIN
  -- Check if user is admin
  _is_admin := is_admin(auth.uid());
  
  -- Get user's partner_id
  SELECT partner_id INTO _user_partner_id
  FROM public.partner_users
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
  
  -- Determine effective partner_id
  IF _is_admin THEN
    _effective_partner_id := _partner_id; -- Admin can filter by any or null for all
  ELSE
    IF _user_partner_id IS NULL THEN
      RAISE EXCEPTION 'Access denied: no partner association';
    END IF;
    _effective_partner_id := _user_partner_id; -- Force to user's partner
  END IF;
  
  SELECT jsonb_agg(row_data ORDER BY created_at DESC)
  INTO _result
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'partner_id', b.partner_id,
      'product_id', b.product_id,
      'product_name', p.name,
      'booking_date', b.booking_date,
      'slot_time', b.slot_time,
      'status', b.status,
      'total_qty', b.total_qty,
      'subtotal_amount', b.subtotal_amount,
      'created_at', b.created_at,
      'expires_at', b.expires_at,
      'customer', b.customer
    ) AS row_data,
    b.created_at
    FROM public.activity_bookings b
    JOIN public.activity_products p ON p.id = b.product_id
    WHERE 
      (_effective_partner_id IS NULL OR b.partner_id = _effective_partner_id)
      AND (_product_id IS NULL OR b.product_id = _product_id)
      AND (_status IS NULL OR b.status::text = _status)
      AND (_date_from IS NULL OR b.booking_date >= _date_from)
      AND (_date_to IS NULL OR b.booking_date <= _date_to)
      AND (
        _q IS NULL 
        OR b.id::text ILIKE '%' || _q || '%'
        OR p.name ILIKE '%' || _q || '%'
        OR (b.customer->>'name') ILIKE '%' || _q || '%'
        OR (b.customer->>'email') ILIKE '%' || _q || '%'
        OR (b.customer->>'phone') ILIKE '%' || _q || '%'
      )
    ORDER BY b.created_at DESC
    LIMIT _limit
    OFFSET _offset
  ) subq;
  
  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- RPC: cancel_activity_booking
CREATE OR REPLACE FUNCTION public.cancel_activity_booking(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _booking record;
  _user_partner_id uuid;
  _is_admin boolean;
BEGIN
  -- Get booking
  SELECT * INTO _booking FROM public.activity_bookings WHERE id = _booking_id;
  
  IF _booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Check permissions
  _is_admin := is_admin(auth.uid());
  
  IF NOT _is_admin THEN
    SELECT partner_id INTO _user_partner_id
    FROM public.partner_users
    WHERE user_id = auth.uid() AND status = 'active'
    LIMIT 1;
    
    IF _user_partner_id IS NULL OR _user_partner_id != _booking.partner_id THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;
  
  -- Validate status
  IF _booking.status NOT IN ('draft', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot cancel booking with status: %', _booking.status;
  END IF;
  
  -- Update booking
  UPDATE public.activity_bookings
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = _booking_id;
  
  RETURN jsonb_build_object('success', true, 'booking_id', _booking_id, 'status', 'cancelled');
END;
$$;

-- RPC: complete_activity_booking
CREATE OR REPLACE FUNCTION public.complete_activity_booking(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _booking record;
  _user_partner_id uuid;
  _is_admin boolean;
BEGIN
  -- Get booking
  SELECT * INTO _booking FROM public.activity_bookings WHERE id = _booking_id;
  
  IF _booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Check permissions
  _is_admin := is_admin(auth.uid());
  
  IF NOT _is_admin THEN
    SELECT partner_id INTO _user_partner_id
    FROM public.partner_users
    WHERE user_id = auth.uid() AND status = 'active'
    LIMIT 1;
    
    IF _user_partner_id IS NULL OR _user_partner_id != _booking.partner_id THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;
  
  -- Validate status - must be confirmed and booking_date must be in the past
  IF _booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'Can only complete confirmed bookings';
  END IF;
  
  IF _booking.booking_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot complete booking for future date';
  END IF;
  
  -- Update booking
  UPDATE public.activity_bookings
  SET status = 'completed', updated_at = now()
  WHERE id = _booking_id;
  
  RETURN jsonb_build_object('success', true, 'booking_id', _booking_id, 'status', 'completed');
END;
$$;