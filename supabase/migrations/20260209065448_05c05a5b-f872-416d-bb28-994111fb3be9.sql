CREATE OR REPLACE FUNCTION public.reorder_accommodation_images(
  _accommodation_id uuid,
  _orders jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.accommodation_images AS ai
  SET display_order = (o->>'display_order')::int
  FROM jsonb_array_elements(_orders) AS o
  WHERE ai.id = (o->>'id')::uuid
    AND ai.accommodation_id = _accommodation_id;
END;
$$;