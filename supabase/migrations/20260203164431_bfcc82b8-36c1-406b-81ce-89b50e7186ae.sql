-- Create pickup_reminder_logs table to track sent notifications
CREATE TABLE public.pickup_reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '12h')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'partner')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_pickup_reminder_logs_booking_id ON public.pickup_reminder_logs(booking_id);
CREATE INDEX idx_pickup_reminder_logs_reminder_type ON public.pickup_reminder_logs(reminder_type);
CREATE UNIQUE INDEX idx_pickup_reminder_unique ON public.pickup_reminder_logs(booking_id, reminder_type, channel, recipient_type);

-- Enable RLS
ALTER TABLE public.pickup_reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only allow system/service role to insert
CREATE POLICY "Service role can manage pickup reminder logs"
ON public.pickup_reminder_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add pickup reminder settings to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS pickup_reminder_24h_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pickup_reminder_12h_enabled BOOLEAN DEFAULT true;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;