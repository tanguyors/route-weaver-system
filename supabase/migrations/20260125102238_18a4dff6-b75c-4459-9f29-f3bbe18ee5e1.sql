-- Step 1: Delete duplicate widgets, keeping only the most recent per partner/type
DELETE FROM public.widgets 
WHERE id NOT IN (
  SELECT DISTINCT ON (partner_id, widget_type) id
  FROM public.widgets
  ORDER BY partner_id, widget_type, created_at DESC
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE public.widgets 
ADD CONSTRAINT widgets_partner_type_unique 
UNIQUE (partner_id, widget_type);