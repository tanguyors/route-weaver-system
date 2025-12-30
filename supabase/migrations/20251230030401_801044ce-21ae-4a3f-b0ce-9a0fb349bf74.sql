-- Create enum for payout status
CREATE TYPE public.activity_payout_status AS ENUM ('pending', 'approved', 'paid');

-- Create activity_partner_payouts table
CREATE TABLE public.activity_partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 7.00,
  currency text NOT NULL DEFAULT 'IDR',
  status public.activity_payout_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT activity_partner_payouts_period_check CHECK (period_end >= period_start)
);

-- Indexes
CREATE INDEX idx_activity_partner_payouts_partner_period 
  ON public.activity_partner_payouts(partner_id, period_start, period_end);
CREATE INDEX idx_activity_partner_payouts_status 
  ON public.activity_partner_payouts(status);

-- Enable RLS
ALTER TABLE public.activity_partner_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all activity_partner_payouts"
  ON public.activity_partner_payouts FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can view own activity_partner_payouts"
  ON public.activity_partner_payouts FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Trigger for updated_at
CREATE TRIGGER update_activity_partner_payouts_updated_at
  BEFORE UPDATE ON public.activity_partner_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Generate payout for a partner + period (idempotent)
CREATE OR REPLACE FUNCTION public.generate_activity_partner_payout(
  _partner_id uuid,
  _period_start date,
  _period_end date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _existing_payout_id uuid;
  _partner record;
  _gross numeric;
  _commission_rate numeric;
  _commission_amount numeric;
  _net_amount numeric;
  _new_id uuid;
  _booking_count int;
  _total_qty int;
BEGIN
  -- Admin only
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  -- Check for existing payout for same partner + period
  SELECT id INTO _existing_payout_id
  FROM public.activity_partner_payouts
  WHERE partner_id = _partner_id
    AND period_start = _period_start
    AND period_end = _period_end;
  
  IF _existing_payout_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payout already exists for this period',
      'existing_payout_id', _existing_payout_id
    );
  END IF;

  -- Get partner and commission rate
  SELECT * INTO _partner FROM public.partners WHERE id = _partner_id;
  IF _partner IS NULL THEN
    RAISE EXCEPTION 'Partner not found';
  END IF;
  
  _commission_rate := COALESCE(_partner.commission_percent, 7.00);

  -- Aggregate bookings for the period
  SELECT 
    COALESCE(SUM(subtotal_amount), 0),
    COUNT(*),
    COALESCE(SUM(total_qty), 0)
  INTO _gross, _booking_count, _total_qty
  FROM public.activity_bookings
  WHERE partner_id = _partner_id
    AND status IN ('confirmed', 'completed')
    AND booking_date >= _period_start
    AND booking_date <= _period_end;

  -- Calculate commission and net
  _commission_amount := _gross * (_commission_rate / 100);
  _net_amount := _gross - _commission_amount;

  -- Insert payout
  INSERT INTO public.activity_partner_payouts (
    partner_id, period_start, period_end,
    gross_revenue, commission_amount, net_amount,
    commission_rate, status
  ) VALUES (
    _partner_id, _period_start, _period_end,
    _gross, _commission_amount, _net_amount,
    _commission_rate, 'pending'
  )
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', _new_id,
    'gross_revenue', _gross,
    'commission_amount', _commission_amount,
    'net_amount', _net_amount,
    'booking_count', _booking_count,
    'total_qty', _total_qty
  );
END;
$$;

-- RPC: Approve payout (admin only)
CREATE OR REPLACE FUNCTION public.approve_activity_partner_payout(_payout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payout record;
BEGIN
  -- Admin only
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT * INTO _payout FROM public.activity_partner_payouts WHERE id = _payout_id;
  
  IF _payout IS NULL THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF _payout.status != 'pending' THEN
    RAISE EXCEPTION 'Can only approve pending payouts. Current status: %', _payout.status;
  END IF;

  UPDATE public.activity_partner_payouts
  SET status = 'approved', updated_at = now()
  WHERE id = _payout_id;

  RETURN jsonb_build_object('success', true, 'payout_id', _payout_id, 'status', 'approved');
END;
$$;

-- RPC: Mark payout as paid (admin only)
CREATE OR REPLACE FUNCTION public.mark_activity_partner_payout_paid(_payout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payout record;
BEGIN
  -- Admin only
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT * INTO _payout FROM public.activity_partner_payouts WHERE id = _payout_id;
  
  IF _payout IS NULL THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF _payout.status = 'paid' THEN
    RAISE EXCEPTION 'Payout is already marked as paid';
  END IF;

  IF _payout.status != 'approved' THEN
    RAISE EXCEPTION 'Can only mark approved payouts as paid. Current status: %', _payout.status;
  END IF;

  UPDATE public.activity_partner_payouts
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE id = _payout_id;

  RETURN jsonb_build_object('success', true, 'payout_id', _payout_id, 'status', 'paid', 'paid_at', now());
END;
$$;

-- RPC: Get payout details with breakdown
CREATE OR REPLACE FUNCTION public.get_activity_payout_detail(_payout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payout record;
  _partner record;
  _bookings jsonb;
  _product_breakdown jsonb;
  _booking_count int;
  _total_qty int;
BEGIN
  SELECT * INTO _payout FROM public.activity_partner_payouts WHERE id = _payout_id;
  
  IF _payout IS NULL THEN
    RETURN NULL;
  END IF;

  -- Access check
  IF NOT is_admin(auth.uid()) AND NOT user_belongs_to_partner(auth.uid(), _payout.partner_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get partner info
  SELECT * INTO _partner FROM public.partners WHERE id = _payout.partner_id;

  -- Get bookings in this payout period
  SELECT jsonb_agg(jsonb_build_object(
    'id', b.id,
    'product_name', p.name,
    'booking_date', b.booking_date,
    'total_qty', b.total_qty,
    'subtotal_amount', b.subtotal_amount,
    'status', b.status
  ) ORDER BY b.booking_date DESC)
  INTO _bookings
  FROM public.activity_bookings b
  JOIN public.activity_products p ON p.id = b.product_id
  WHERE b.partner_id = _payout.partner_id
    AND b.status IN ('confirmed', 'completed')
    AND b.booking_date >= _payout.period_start
    AND b.booking_date <= _payout.period_end;

  -- Get product breakdown
  SELECT jsonb_agg(jsonb_build_object(
    'product_id', b.product_id,
    'product_name', p.name,
    'booking_count', COUNT(*),
    'total_qty', SUM(b.total_qty),
    'revenue', SUM(b.subtotal_amount)
  ) ORDER BY SUM(b.subtotal_amount) DESC)
  INTO _product_breakdown
  FROM public.activity_bookings b
  JOIN public.activity_products p ON p.id = b.product_id
  WHERE b.partner_id = _payout.partner_id
    AND b.status IN ('confirmed', 'completed')
    AND b.booking_date >= _payout.period_start
    AND b.booking_date <= _payout.period_end
  GROUP BY b.product_id, p.name;

  -- Get totals
  SELECT COUNT(*), COALESCE(SUM(total_qty), 0)
  INTO _booking_count, _total_qty
  FROM public.activity_bookings
  WHERE partner_id = _payout.partner_id
    AND status IN ('confirmed', 'completed')
    AND booking_date >= _payout.period_start
    AND booking_date <= _payout.period_end;

  RETURN jsonb_build_object(
    'id', _payout.id,
    'partner_id', _payout.partner_id,
    'partner_name', _partner.name,
    'period_start', _payout.period_start,
    'period_end', _payout.period_end,
    'gross_revenue', _payout.gross_revenue,
    'commission_rate', _payout.commission_rate,
    'commission_amount', _payout.commission_amount,
    'net_amount', _payout.net_amount,
    'currency', _payout.currency,
    'status', _payout.status,
    'paid_at', _payout.paid_at,
    'created_at', _payout.created_at,
    'booking_count', _booking_count,
    'total_qty', _total_qty,
    'bookings', COALESCE(_bookings, '[]'::jsonb),
    'product_breakdown', COALESCE(_product_breakdown, '[]'::jsonb)
  );
END;
$$;

-- RPC: List payouts with filters
CREATE OR REPLACE FUNCTION public.list_activity_partner_payouts(
  _partner_id uuid DEFAULT NULL,
  _status text DEFAULT NULL,
  _date_from date DEFAULT NULL,
  _date_to date DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_partner_id uuid;
  _is_admin boolean;
  _effective_partner_id uuid;
  _result jsonb;
BEGIN
  _is_admin := is_admin(auth.uid());
  
  IF NOT _is_admin THEN
    SELECT partner_id INTO _user_partner_id
    FROM public.partner_users
    WHERE user_id = auth.uid() AND status = 'active'
    LIMIT 1;
    
    IF _user_partner_id IS NULL THEN
      RAISE EXCEPTION 'Access denied: no partner association';
    END IF;
    _effective_partner_id := _user_partner_id;
  ELSE
    _effective_partner_id := _partner_id;
  END IF;

  SELECT jsonb_agg(row_data ORDER BY period_start DESC)
  INTO _result
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'partner_id', p.partner_id,
      'partner_name', pa.name,
      'period_start', p.period_start,
      'period_end', p.period_end,
      'gross_revenue', p.gross_revenue,
      'commission_rate', p.commission_rate,
      'commission_amount', p.commission_amount,
      'net_amount', p.net_amount,
      'currency', p.currency,
      'status', p.status,
      'paid_at', p.paid_at,
      'created_at', p.created_at
    ) AS row_data,
    p.period_start
    FROM public.activity_partner_payouts p
    JOIN public.partners pa ON pa.id = p.partner_id
    WHERE 
      (_effective_partner_id IS NULL OR p.partner_id = _effective_partner_id)
      AND (_status IS NULL OR p.status::text = _status)
      AND (_date_from IS NULL OR p.period_start >= _date_from)
      AND (_date_to IS NULL OR p.period_end <= _date_to)
    ORDER BY p.period_start DESC
    LIMIT _limit
    OFFSET _offset
  ) subq;

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;