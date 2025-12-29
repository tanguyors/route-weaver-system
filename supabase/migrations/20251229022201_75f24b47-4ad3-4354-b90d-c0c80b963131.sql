-- Add additional business and banking information columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Indonesia',
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_branch text,
ADD COLUMN IF NOT EXISTS bank_swift_code text;