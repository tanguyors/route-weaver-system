-- Add images column to boats table for multiple photos (up to 5)
ALTER TABLE public.boats 
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Migrate existing image_url to images array if present
UPDATE public.boats 
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- Keep image_url for backwards compatibility (will be first image in array)