-- Add return_departure_id to bookings table
ALTER TABLE public.bookings 
ADD COLUMN return_departure_id UUID REFERENCES public.departures(id);

-- Add index for performance
CREATE INDEX idx_bookings_return_departure_id ON public.bookings(return_departure_id);

-- Add comment
COMMENT ON COLUMN public.bookings.return_departure_id IS 'Optional return trip departure';