-- Drop existing enum and create new comprehensive discount type enum
DROP TYPE IF EXISTS public.discount_category CASCADE;
CREATE TYPE public.discount_category AS ENUM (
  'cart_fixed',
  'cart_percent', 
  'schedule_fixed',
  'schedule_percent',
  'free_ticket',
  'per_product',
  'value_added',
  'last_minute'
);

-- Add new columns to discount_rules table
ALTER TABLE public.discount_rules 
ADD COLUMN IF NOT EXISTS category discount_category DEFAULT 'cart_percent',
ADD COLUMN IF NOT EXISTS book_start_date date,
ADD COLUMN IF NOT EXISTS book_end_date date,
ADD COLUMN IF NOT EXISTS checkin_start_date date,
ADD COLUMN IF NOT EXISTS checkin_end_date date,
ADD COLUMN IF NOT EXISTS minimum_spend numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS individual_use_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS limit_per_customer integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS applicable_route_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS applicable_schedule_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS free_ticket_min_pax integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS free_ticket_pax_type text DEFAULT 'any',
ADD COLUMN IF NOT EXISTS last_minute_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS value_added_addon_name text,
ADD COLUMN IF NOT EXISTS total_discounted_amount numeric DEFAULT 0;

-- Rename columns for clarity (start_date/end_date become book period by default)
-- Copy existing data to new columns
UPDATE public.discount_rules 
SET book_start_date = start_date, 
    book_end_date = end_date,
    checkin_start_date = start_date,
    checkin_end_date = end_date
WHERE book_start_date IS NULL;

-- Create discount_usage table to track per-customer usage
CREATE TABLE IF NOT EXISTS public.discount_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_rule_id uuid NOT NULL REFERENCES public.discount_rules(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_email text,
  customer_phone text,
  discounted_amount numeric NOT NULL DEFAULT 0,
  used_at timestamptz NOT NULL DEFAULT now(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE
);

-- Enable RLS on discount_usage
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_usage
CREATE POLICY "Admins can manage all discount_usage"
ON public.discount_usage FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own discount_usage"
ON public.discount_usage FOR ALL
USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own discount_usage"
ON public.discount_usage FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_usage_rule_id ON public.discount_usage(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_customer ON public.discount_usage(customer_email, customer_phone);
CREATE INDEX IF NOT EXISTS idx_discount_rules_partner ON public.discount_rules(partner_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_status ON public.discount_rules(status);
CREATE INDEX IF NOT EXISTS idx_discount_rules_dates ON public.discount_rules(book_start_date, book_end_date);