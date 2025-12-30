-- Drop the old function that returns numeric
DROP FUNCTION IF EXISTS public.get_effective_activity_commission_rate(uuid, uuid);

-- Create new function that returns jsonb with effective_rate and source
CREATE OR REPLACE FUNCTION public.get_effective_activity_commission_rate(_partner_id uuid, _product_id uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric;
BEGIN
  -- Priority 1: Partner+Product override (if product_id provided)
  IF _product_id IS NOT NULL THEN
    SELECT commission_rate INTO v_rate
    FROM public.activity_partner_product_commissions
    WHERE partner_id = _partner_id AND product_id = _product_id
    LIMIT 1;

    IF v_rate IS NOT NULL THEN 
      RETURN jsonb_build_object('effective_rate', v_rate, 'source', 'product_override');
    END IF;
  END IF;

  -- Priority 2: Partner override
  SELECT commission_percent INTO v_rate
  FROM public.partners
  WHERE id = _partner_id
  LIMIT 1;

  IF v_rate IS NOT NULL THEN 
    RETURN jsonb_build_object('effective_rate', v_rate, 'source', 'partner_override');
  END IF;

  -- Priority 3: Global default
  SELECT default_commission_rate INTO v_rate
  FROM public.activity_settings
  WHERE id = 1;

  RETURN jsonb_build_object('effective_rate', COALESCE(v_rate, 10), 'source', 'global_default');
END;
$function$;