-- 1. Add file_path column to activity_product_images
ALTER TABLE public.activity_product_images 
ADD COLUMN IF NOT EXISTS file_path text;

-- 2. Create trigger to auto-set partner_id from product_id
CREATE OR REPLACE FUNCTION public.set_image_partner_from_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get partner_id from the product
  SELECT partner_id INTO NEW.partner_id
  FROM public.activity_products
  WHERE id = NEW.product_id;
  
  -- Validate the user belongs to this partner
  IF NOT user_belongs_to_partner(auth.uid(), NEW.partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not belong to this partner';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_image_partner_trigger
BEFORE INSERT ON public.activity_product_images
FOR EACH ROW
EXECUTE FUNCTION public.set_image_partner_from_product();

-- 3. Create atomic reorder RPC
CREATE OR REPLACE FUNCTION public.reorder_product_images(
  _product_id uuid,
  _orders jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _order_item jsonb;
  _image_id uuid;
  _new_order int;
BEGIN
  -- Get partner_id from product and verify access
  SELECT partner_id INTO _partner_id
  FROM public.activity_products
  WHERE id = _product_id;
  
  IF _partner_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  IF NOT user_belongs_to_partner(auth.uid(), _partner_id) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Update all orders in a single transaction
  FOR _order_item IN SELECT * FROM jsonb_array_elements(_orders)
  LOOP
    _image_id := (_order_item->>'id')::uuid;
    _new_order := (_order_item->>'display_order')::int;
    
    UPDATE public.activity_product_images
    SET display_order = _new_order
    WHERE id = _image_id 
      AND product_id = _product_id;
  END LOOP;
END;
$$;