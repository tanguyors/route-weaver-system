-- Add min_capacity and max_capacity to private_boats (for range like 8-12)
ALTER TABLE public.private_boats 
ADD COLUMN min_capacity integer DEFAULT 1,
ADD COLUMN max_capacity integer;

-- Update existing records: set min_capacity to 1 and max_capacity to current capacity
UPDATE public.private_boats 
SET min_capacity = 1, max_capacity = capacity;