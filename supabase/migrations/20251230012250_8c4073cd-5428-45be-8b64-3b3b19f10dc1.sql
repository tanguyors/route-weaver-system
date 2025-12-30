-- Add admin_note and audit fields to partner_modules
ALTER TABLE public.partner_modules 
ADD COLUMN IF NOT EXISTS admin_note text,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);