-- 1) Global default commission settings table
CREATE TABLE IF NOT EXISTS public.activity_settings (
  id int PRIMARY KEY DEFAULT 1,
  default_commission_rate numeric NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.activity_settings (id, default_commission_rate)
VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.activity_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Admin can manage
CREATE POLICY "Admins can manage activity_settings"
ON public.activity_settings FOR ALL
USING (is_admin(auth.uid()));

-- RLS: Authenticated users can read (for effective rate calculation)
CREATE POLICY "Authenticated can read activity_settings"
ON public.activity_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2) Partner+Product override table
CREATE TABLE IF NOT EXISTS public.activity_partner_product_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.activity_products(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_apc_partner ON public.activity_partner_product_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_apc_product ON public.activity_partner_product_commissions(product_id);

-- Enable RLS
ALTER TABLE public.activity_partner_product_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all activity_partner_product_commissions"
ON public.activity_partner_product_commissions FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Partner users can view own activity_partner_product_commissions"
ON public.activity_partner_product_commissions FOR SELECT
USING (user_belongs_to_partner(auth.uid(), partner_id));

-- Trigger for updated_at
CREATE TRIGGER update_activity_partner_product_commissions_updated_at
BEFORE UPDATE ON public.activity_partner_product_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- A) Get global settings
CREATE OR REPLACE FUNCTION public.get_activity_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'default_commission_rate', s.default_commission_rate
  )
  FROM public.activity_settings s
  WHERE s.id = 1;
$$;

-- B) Update global default (admin only)
CREATE OR REPLACE FUNCTION public.update_activity_settings_default_commission(_rate numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF _rate IS NULL OR _rate < 0 OR _rate > 100 THEN
    RAISE EXCEPTION 'Invalid commission rate: must be between 0 and 100';
  END IF;

  UPDATE public.activity_settings
  SET default_commission_rate = _rate,
      updated_at = now()
  WHERE id = 1;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- C) Set partner commission override (admin only)
CREATE OR REPLACE FUNCTION public.set_partner_commission_rate(_partner_id uuid, _rate numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF _rate IS NOT NULL AND (_rate < 0 OR _rate > 100) THEN
    RAISE EXCEPTION 'Invalid commission rate: must be between 0 and 100';
  END IF;

  UPDATE public.partners
  SET commission_percent = _rate,
      updated_at = now()
  WHERE id = _partner_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- D) Upsert partner+product override (admin only)
CREATE OR REPLACE FUNCTION public.upsert_partner_product_commission(
  _partner_id uuid,
  _product_id uuid,
  _rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF _rate IS NULL OR _rate < 0 OR _rate > 100 THEN
    RAISE EXCEPTION 'Invalid commission rate: must be between 0 and 100';
  END IF;

  INSERT INTO public.activity_partner_product_commissions (partner_id, product_id, commission_rate)
  VALUES (_partner_id, _product_id, _rate)
  ON CONFLICT (partner_id, product_id)
  DO UPDATE SET commission_rate = EXCLUDED.commission_rate,
                updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- E) Delete partner+product override (admin only)
CREATE OR REPLACE FUNCTION public.delete_partner_product_commission(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  DELETE FROM public.activity_partner_product_commissions WHERE id = _id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- F) List partner+product overrides (for admin UI)
CREATE OR REPLACE FUNCTION public.list_partner_product_commissions(_partner_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'product_id', c.product_id,
      'product_name', p.name,
      'commission_rate', c.commission_rate
    )
  ), '[]'::jsonb)
  FROM public.activity_partner_product_commissions c
  JOIN public.activity_products p ON p.id = c.product_id
  WHERE c.partner_id = _partner_id;
$$;

-- G) Get effective commission rate (core priority logic)
CREATE OR REPLACE FUNCTION public.get_effective_activity_commission_rate(
  _partner_id uuid,
  _product_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- Priority 1: Partner+Product override
  SELECT commission_rate INTO v_rate
  FROM public.activity_partner_product_commissions
  WHERE partner_id = _partner_id AND product_id = _product_id
  LIMIT 1;

  IF v_rate IS NOT NULL THEN RETURN v_rate; END IF;

  -- Priority 2: Partner override
  SELECT commission_percent INTO v_rate
  FROM public.partners
  WHERE id = _partner_id
  LIMIT 1;

  IF v_rate IS NOT NULL THEN RETURN v_rate; END IF;

  -- Priority 3: Global default
  SELECT default_commission_rate INTO v_rate
  FROM public.activity_settings
  WHERE id = 1;

  RETURN COALESCE(v_rate, 10);
END;
$$;