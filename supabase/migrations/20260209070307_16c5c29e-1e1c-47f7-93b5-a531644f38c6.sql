-- Create table for tracking accommodation check-in reminders
CREATE TABLE public.accommodation_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.accommodation_bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  channel text NOT NULL,
  recipient text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reminder_type, channel, recipient)
);

-- Enable RLS
ALTER TABLE public.accommodation_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Partners can view their own reminder logs
CREATE POLICY "Partners can view own accommodation reminder logs"
  ON public.accommodation_reminder_logs FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.accommodation_bookings
      WHERE partner_id IN (
        SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert accommodation reminder logs"
  ON public.accommodation_reminder_logs FOR INSERT
  WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_accommodation_reminder_logs_booking ON public.accommodation_reminder_logs(booking_id, reminder_type);