-- Add commission_percent column to partners table
ALTER TABLE public.partners 
ADD COLUMN commission_percent numeric NOT NULL DEFAULT 7.00;