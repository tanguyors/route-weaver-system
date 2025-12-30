
-- Update RPC: get_activity_reports_timeseries with strict granularity validation
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
BEGIN
  -- Validate partner access
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Strict granularity validation
  IF _granularity NOT IN ('day', 'week', 'month') THEN
    RAISE EXCEPTION 'Invalid granularity: %. Must be day, week, or month.', _granularity;
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
