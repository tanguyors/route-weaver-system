-- Create enum for invoice status
CREATE TYPE public.activity_invoice_status AS ENUM ('draft', 'issued', 'void');

-- Create sequence for invoice numbers
CREATE SEQUENCE public.activity_invoice_number_seq START 1;

-- Create activity_partner_invoices table
CREATE TABLE public.activity_partner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL UNIQUE REFERENCES public.activity_partner_payouts(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  billing_details jsonb DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'IDR',
  gross_revenue numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status public.activity_invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_activity_partner_invoices_partner ON public.activity_partner_invoices(partner_id);
CREATE INDEX idx_activity_partner_invoices_number ON public.activity_partner_invoices(invoice_number);
CREATE INDEX idx_activity_partner_invoices_status ON public.activity_partner_invoices(status);

-- Enable RLS
ALTER TABLE public.activity_partner_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all activity_partner_invoices"
  ON public.activity_partner_invoices FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can view own activity_partner_invoices"
  ON public.activity_partner_invoices FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Trigger for updated_at
CREATE TRIGGER update_activity_partner_invoices_updated_at
  BEFORE UPDATE ON public.activity_partner_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Generate invoice number (concurrency-safe)
CREATE OR REPLACE FUNCTION public.generate_activity_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _seq_val int;
  _year text;
BEGIN
  _seq_val := nextval('activity_invoice_number_seq');
  _year := to_char(CURRENT_DATE, 'YYYY');
  RETURN 'ACT-' || _year || '-' || lpad(_seq_val::text, 6, '0');
END;
$$;

-- RPC: Create invoice from payout (idempotent)
CREATE OR REPLACE FUNCTION public.create_activity_invoice_from_payout(_payout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payout record;
  _partner record;
  _existing_invoice record;
  _invoice_number text;
  _billing_details jsonb;
  _new_id uuid;
BEGIN
  -- Get payout
  SELECT * INTO _payout FROM public.activity_partner_payouts WHERE id = _payout_id;
  IF _payout IS NULL THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  -- Access check: admin or partner user
  IF NOT is_admin(auth.uid()) AND NOT user_belongs_to_partner(auth.uid(), _payout.partner_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Only approved or paid payouts can have invoices
  IF _payout.status NOT IN ('approved', 'paid') THEN
    RAISE EXCEPTION 'Can only create invoice for approved or paid payouts';
  END IF;

  -- Check for existing invoice (idempotent)
  SELECT * INTO _existing_invoice FROM public.activity_partner_invoices WHERE payout_id = _payout_id;
  IF _existing_invoice IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'invoice_id', _existing_invoice.id,
      'invoice_number', _existing_invoice.invoice_number,
      'already_exists', true
    );
  END IF;

  -- Get partner for billing details
  SELECT * INTO _partner FROM public.partners WHERE id = _payout.partner_id;
  
  _billing_details := jsonb_build_object(
    'company_name', COALESCE(_partner.legal_name, _partner.name),
    'address', _partner.address,
    'city', _partner.city,
    'country', _partner.country,
    'tax_id', _partner.tax_id,
    'email', _partner.contact_email,
    'phone', _partner.contact_phone,
    'bank_name', _partner.bank_name,
    'bank_account', _partner.bank_account_number,
    'bank_holder', _partner.bank_account_name
  );

  -- Generate invoice number
  _invoice_number := generate_activity_invoice_number();

  -- Create invoice
  INSERT INTO public.activity_partner_invoices (
    payout_id, partner_id, invoice_number, issue_date,
    billing_details, currency, gross_revenue, commission_amount, net_amount, status
  ) VALUES (
    _payout_id, _payout.partner_id, _invoice_number, CURRENT_DATE,
    _billing_details, _payout.currency, _payout.gross_revenue, _payout.commission_amount, _payout.net_amount, 'issued'
  )
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', _new_id,
    'invoice_number', _invoice_number,
    'already_exists', false
  );
END;
$$;

-- RPC: Get invoice detail with breakdown
CREATE OR REPLACE FUNCTION public.get_activity_invoice_detail(_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invoice record;
  _payout record;
  _partner record;
  _product_breakdown jsonb;
  _bookings jsonb;
  _booking_count int;
  _total_qty int;
BEGIN
  SELECT * INTO _invoice FROM public.activity_partner_invoices WHERE id = _invoice_id;
  IF _invoice IS NULL THEN
    RETURN NULL;
  END IF;

  -- Access check
  IF NOT is_admin(auth.uid()) AND NOT user_belongs_to_partner(auth.uid(), _invoice.partner_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get payout and partner
  SELECT * INTO _payout FROM public.activity_partner_payouts WHERE id = _invoice.payout_id;
  SELECT * INTO _partner FROM public.partners WHERE id = _invoice.partner_id;

  -- Get product breakdown (from payout period)
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
  WHERE b.partner_id = _invoice.partner_id
    AND b.status IN ('confirmed', 'completed')
    AND b.booking_date >= _payout.period_start
    AND b.booking_date <= _payout.period_end
  GROUP BY b.product_id, p.name;

  -- Get bookings (capped to 200)
  SELECT jsonb_agg(jsonb_build_object(
    'id', b.id,
    'product_name', p.name,
    'booking_date', b.booking_date,
    'slot_time', b.slot_time,
    'total_qty', b.total_qty,
    'subtotal_amount', b.subtotal_amount,
    'status', b.status
  ) ORDER BY b.booking_date DESC)
  INTO _bookings
  FROM (
    SELECT * FROM public.activity_bookings
    WHERE partner_id = _invoice.partner_id
      AND status IN ('confirmed', 'completed')
      AND booking_date >= _payout.period_start
      AND booking_date <= _payout.period_end
    ORDER BY booking_date DESC
    LIMIT 200
  ) b
  JOIN public.activity_products p ON p.id = b.product_id;

  -- Get totals
  SELECT COUNT(*), COALESCE(SUM(total_qty), 0)
  INTO _booking_count, _total_qty
  FROM public.activity_bookings
  WHERE partner_id = _invoice.partner_id
    AND status IN ('confirmed', 'completed')
    AND booking_date >= _payout.period_start
    AND booking_date <= _payout.period_end;

  RETURN jsonb_build_object(
    'id', _invoice.id,
    'invoice_number', _invoice.invoice_number,
    'partner_id', _invoice.partner_id,
    'partner_name', _partner.name,
    'billing_details', _invoice.billing_details,
    'issue_date', _invoice.issue_date,
    'due_date', _invoice.due_date,
    'period_start', _payout.period_start,
    'period_end', _payout.period_end,
    'currency', _invoice.currency,
    'gross_revenue', _invoice.gross_revenue,
    'commission_amount', _invoice.commission_amount,
    'net_amount', _invoice.net_amount,
    'status', _invoice.status,
    'payout_status', _payout.status,
    'payout_paid_at', _payout.paid_at,
    'booking_count', _booking_count,
    'total_qty', _total_qty,
    'product_breakdown', COALESCE(_product_breakdown, '[]'::jsonb),
    'bookings', COALESCE(_bookings, '[]'::jsonb),
    'created_at', _invoice.created_at
  );
END;
$$;

-- RPC: List invoices
CREATE OR REPLACE FUNCTION public.list_activity_partner_invoices(
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

  SELECT jsonb_agg(row_data ORDER BY issue_date DESC)
  INTO _result
  FROM (
    SELECT jsonb_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'partner_id', i.partner_id,
      'partner_name', pa.name,
      'payout_id', i.payout_id,
      'period_start', p.period_start,
      'period_end', p.period_end,
      'issue_date', i.issue_date,
      'currency', i.currency,
      'gross_revenue', i.gross_revenue,
      'commission_amount', i.commission_amount,
      'net_amount', i.net_amount,
      'status', i.status,
      'payout_status', p.status,
      'created_at', i.created_at
    ) AS row_data,
    i.issue_date
    FROM public.activity_partner_invoices i
    JOIN public.partners pa ON pa.id = i.partner_id
    JOIN public.activity_partner_payouts p ON p.id = i.payout_id
    WHERE 
      (_effective_partner_id IS NULL OR i.partner_id = _effective_partner_id)
      AND (_status IS NULL OR i.status::text = _status)
      AND (_date_from IS NULL OR i.issue_date >= _date_from)
      AND (_date_to IS NULL OR i.issue_date <= _date_to)
    ORDER BY i.issue_date DESC
    LIMIT _limit
    OFFSET _offset
  ) subq;

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- RPC: Void invoice (admin only)
CREATE OR REPLACE FUNCTION public.void_activity_invoice(_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invoice record;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT * INTO _invoice FROM public.activity_partner_invoices WHERE id = _invoice_id;
  IF _invoice IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF _invoice.status = 'void' THEN
    RAISE EXCEPTION 'Invoice is already void';
  END IF;

  UPDATE public.activity_partner_invoices
  SET status = 'void', updated_at = now()
  WHERE id = _invoice_id;

  RETURN jsonb_build_object('success', true, 'invoice_id', _invoice_id, 'status', 'void');
END;
$$;

-- RPC: Export invoices CSV data
CREATE OR REPLACE FUNCTION public.export_activity_invoices_csv(
  _date_from date,
  _date_to date,
  _partner_id uuid DEFAULT NULL
)
RETURNS TABLE(
  invoice_number text,
  partner_name text,
  period_start date,
  period_end date,
  issue_date date,
  currency text,
  gross_revenue numeric,
  commission_amount numeric,
  net_amount numeric,
  status text,
  paid_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT 
    i.invoice_number,
    pa.name AS partner_name,
    p.period_start,
    p.period_end,
    i.issue_date,
    i.currency,
    i.gross_revenue,
    i.commission_amount,
    i.net_amount,
    i.status::text,
    p.paid_at
  FROM public.activity_partner_invoices i
  JOIN public.partners pa ON pa.id = i.partner_id
  JOIN public.activity_partner_payouts p ON p.id = i.payout_id
  WHERE i.issue_date >= _date_from
    AND i.issue_date <= _date_to
    AND (_partner_id IS NULL OR i.partner_id = _partner_id)
  ORDER BY i.issue_date DESC;
END;
$$;

-- RPC: Export booking lines CSV data
CREATE OR REPLACE FUNCTION public.export_activity_bookings_lines_csv(
  _date_from date,
  _date_to date,
  _partner_id uuid DEFAULT NULL
)
RETURNS TABLE(
  booking_id uuid,
  partner_name text,
  product_name text,
  booking_date date,
  slot_time time,
  total_qty int,
  subtotal_amount numeric,
  status text,
  payout_id uuid,
  invoice_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT 
    b.id AS booking_id,
    pa.name AS partner_name,
    pr.name AS product_name,
    b.booking_date,
    b.slot_time,
    b.total_qty,
    b.subtotal_amount,
    b.status::text,
    p.id AS payout_id,
    i.invoice_number
  FROM public.activity_bookings b
  JOIN public.partners pa ON pa.id = b.partner_id
  JOIN public.activity_products pr ON pr.id = b.product_id
  LEFT JOIN public.activity_partner_payouts p ON p.partner_id = b.partner_id
    AND b.booking_date >= p.period_start
    AND b.booking_date <= p.period_end
  LEFT JOIN public.activity_partner_invoices i ON i.payout_id = p.id
  WHERE b.booking_date >= _date_from
    AND b.booking_date <= _date_to
    AND b.status IN ('confirmed', 'completed')
    AND (_partner_id IS NULL OR b.partner_id = _partner_id)
  ORDER BY b.booking_date DESC, b.created_at DESC;
END;
$$;