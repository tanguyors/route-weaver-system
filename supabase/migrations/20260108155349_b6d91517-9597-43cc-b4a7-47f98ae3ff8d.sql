-- Add car_price and bus_price columns to private_pickup_dropoff_rules table
-- and migrate existing price data to car_price

ALTER TABLE public.private_pickup_dropoff_rules 
ADD COLUMN car_price numeric DEFAULT 0,
ADD COLUMN bus_price numeric DEFAULT 0;

-- Migrate existing price to car_price
UPDATE public.private_pickup_dropoff_rules 
SET car_price = price, bus_price = price;

-- Make columns NOT NULL after migration
ALTER TABLE public.private_pickup_dropoff_rules 
ALTER COLUMN car_price SET NOT NULL,
ALTER COLUMN bus_price SET NOT NULL;