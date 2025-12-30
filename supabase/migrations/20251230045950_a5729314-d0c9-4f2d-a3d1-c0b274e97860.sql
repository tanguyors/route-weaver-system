-- Add QR ticket generation option to activity_products
ALTER TABLE public.activity_products 
ADD COLUMN IF NOT EXISTS generate_qr_tickets boolean DEFAULT true;

-- Create activity_tickets table for storing tickets
CREATE TABLE IF NOT EXISTS public.activity_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES public.activity_bookings(id) ON DELETE CASCADE,
    partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
    qr_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    participant_index integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'expired')),
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create activity_checkin_events table
CREATE TABLE IF NOT EXISTS public.activity_checkin_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.activity_tickets(id) ON DELETE CASCADE,
    partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    scanned_by_user_id uuid NOT NULL,
    result text NOT NULL CHECK (result IN ('success', 'already_used', 'invalid', 'cancelled', 'expired')),
    scanned_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_tickets_booking_id ON public.activity_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_activity_tickets_qr_token ON public.activity_tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_activity_tickets_partner_id ON public.activity_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_activity_checkin_events_ticket_id ON public.activity_checkin_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_checkin_events_partner_id ON public.activity_checkin_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_activity_checkin_events_scanned_at ON public.activity_checkin_events(scanned_at);

-- Enable RLS
ALTER TABLE public.activity_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_checkin_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_tickets
CREATE POLICY "Admins can manage all activity_tickets"
ON public.activity_tickets FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own activity_tickets"
ON public.activity_tickets FOR ALL
TO authenticated
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own activity_tickets"
ON public.activity_tickets FOR SELECT
TO authenticated
USING (user_belongs_to_partner(auth.uid(), partner_id));

CREATE POLICY "Public can view own tickets by token"
ON public.activity_tickets FOR SELECT
TO anon, authenticated
USING (true);

-- RLS policies for activity_checkin_events
CREATE POLICY "Admins can manage all activity_checkin_events"
ON public.activity_checkin_events FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can create activity_checkin_events"
ON public.activity_checkin_events FOR INSERT
TO authenticated
WITH CHECK (user_belongs_to_partner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view activity_checkin_events"
ON public.activity_checkin_events FOR SELECT
TO authenticated
USING (user_belongs_to_partner(auth.uid(), partner_id));