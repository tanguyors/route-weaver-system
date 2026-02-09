
-- Table for recording payments on accommodation bookings
CREATE TABLE public.accommodation_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.accommodation_bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'LKR',
  method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accommodation_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own accommodation payments"
  ON public.accommodation_payments FOR SELECT
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can insert their own accommodation payments"
  ON public.accommodation_payments FOR INSERT
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

-- Table for tracking platform commissions on accommodation payments
CREATE TABLE public.accommodation_commission_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.accommodation_bookings(id) ON DELETE CASCADE,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee_percent NUMERIC NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  partner_net_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'LKR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accommodation_commission_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own accommodation commissions"
  ON public.accommodation_commission_records FOR SELECT
  USING (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

CREATE POLICY "Partners can insert their own accommodation commissions"
  ON public.accommodation_commission_records FOR INSERT
  WITH CHECK (partner_id IN (SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_accommodation_payments_partner_id ON public.accommodation_payments(partner_id);
CREATE INDEX idx_accommodation_payments_booking_id ON public.accommodation_payments(booking_id);
CREATE INDEX idx_accommodation_commission_records_partner_id ON public.accommodation_commission_records(partner_id);
CREATE INDEX idx_accommodation_commission_records_booking_id ON public.accommodation_commission_records(booking_id);
