
-- RPC: get_activity_reports_summary
CREATE OR REPLACE FUNCTION public.get_activity_reports_summary(
  _partner_id uuid,
  _date_from date,
  _date_to date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _confirmed_count int;
  _draft_count int;
  _expired_count int;
  _cancelled_count int;
  _completed_count int;
  _total_count int;
  _conversion_rate float;
  _revenue_confirmed numeric;
  _revenue_completed numeric;
  _avg_order_value numeric;
  _total_qty int;
BEGIN
  -- Validate partner access
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get counts by status
  SELECT 
    COUNT(*) FILTER (WHERE status = 'confirmed'),
    COUNT(*) FILTER (WHERE status = 'draft'),
    COUNT(*) FILTER (WHERE status = 'expired'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO 
    _confirmed_count,
    _draft_count,
    _expired_count,
    _cancelled_count,
    _completed_count,
    _total_count
  FROM public.activity_bookings
  WHERE partner_id = _partner_id
    AND booking_date >= _date_from
    AND booking_date <= _date_to;

  -- Calculate conversion rate (confirmed / (confirmed + expired + cancelled))
  IF (_confirmed_count + _expired_count + _cancelled_count) > 0 THEN
    _conversion_rate := _confirmed_count::float / (_confirmed_count + _expired_count + _cancelled_count)::float;
  ELSE
    _conversion_rate := 0;
  END IF;

  -- Get revenue for confirmed + completed
  SELECT COALESCE(SUM(subtotal_amount), 0)
  INTO _revenue_confirmed
  FROM public.activity_bookings
  WHERE partner_id = _partner_id
    AND booking_date >= _date_from
    AND booking_date <= _date_to
    AND status IN ('confirmed', 'completed');

  -- Get revenue for completed only
  SELECT COALESCE(SUM(subtotal_amount), 0)
  INTO _revenue_completed
  FROM public.activity_bookings
  WHERE partner_id = _partner_id
    AND booking_date >= _date_from
    AND booking_date <= _date_to
    AND status = 'completed';

  -- Calculate avg order value
  IF (_confirmed_count + _completed_count) > 0 THEN
    _avg_order_value := _revenue_confirmed / (_confirmed_count + _completed_count);
  ELSE
    _avg_order_value := 0;
  END IF;

  -- Get total qty for confirmed + completed
  SELECT COALESCE(SUM(total_qty), 0)
  INTO _total_qty
  FROM public.activity_bookings
  WHERE partner_id = _partner_id
    AND booking_date >= _date_from
    AND booking_date <= _date_to
    AND status IN ('confirmed', 'completed');

  RETURN jsonb_build_object(
    'confirmed_bookings_count', _confirmed_count,
    'draft_bookings_count', _draft_count,
    'expired_bookings_count', _expired_count,
    'cancelled_bookings_count', _cancelled_count,
    'completed_bookings_count', _completed_count,
    'total_bookings_count', _total_count,
    'conversion_rate', _conversion_rate,
    'revenue_confirmed', _revenue_confirmed,
    'revenue_completed', _revenue_completed,
    'avg_order_value', _avg_order_value,
    'total_qty_confirmed', _total_qty
  );
END;
$$;

-- RPC: get_activity_reports_timeseries
CREATE OR REPLACE FUNCTION public.get_activity_reports_timeseries(
  _partner_id uuid,
  _date_from date,
  _date_to date,
  _granularity text DEFAULT 'day'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _trunc_interval text;
BEGIN
  -- Validate partner access
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Validate granularity
  IF _granularity NOT IN ('day', 'week', 'month') THEN
    _granularity := 'day';
  END IF;

  SELECT jsonb_agg(row_data ORDER BY bucket_start)
  INTO _result
  FROM (
    SELECT 
      date_trunc(_granularity, booking_date)::date as bucket_start,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
      COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
      COALESCE(SUM(subtotal_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as revenue,
      COALESCE(SUM(total_qty) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as qty
    FROM public.activity_bookings
    WHERE partner_id = _partner_id
      AND booking_date >= _date_from
      AND booking_date <= _date_to
    GROUP BY date_trunc(_granularity, booking_date)::date
  ) subq(bucket_start, confirmed_count, expired_count, cancelled_count, revenue, qty);

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- RPC: get_activity_reports_top_products
CREATE OR REPLACE FUNCTION public.get_activity_reports_top_products(
  _partner_id uuid,
  _date_from date,
  _date_to date,
  _limit int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
BEGIN
  -- Validate partner access
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_agg(row_data)
  INTO _result
  FROM (
    SELECT jsonb_build_object(
      'product_id', b.product_id,
      'product_name', p.name,
      'confirmed_count', COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'completed')),
      'revenue', COALESCE(SUM(b.subtotal_amount) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0),
      'qty', COALESCE(SUM(b.total_qty) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0)
    ) as row_data
    FROM public.activity_bookings b
    JOIN public.activity_products p ON p.id = b.product_id
    WHERE b.partner_id = _partner_id
      AND b.booking_date >= _date_from
      AND b.booking_date <= _date_to
    GROUP BY b.product_id, p.name
    ORDER BY 
      COALESCE(SUM(b.subtotal_amount) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0) DESC,
      COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'completed')) DESC
    LIMIT _limit
  ) subq;

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;
