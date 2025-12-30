-- Add billing_details jsonb column to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS billing_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Create RPC to get partner billing details
CREATE OR REPLACE FUNCTION public.get_partner_billing_details(_partner_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_partner_id uuid;
  _effective_partner_id uuid;
  _result jsonb;
BEGIN
  -- Get user's partner_id if not admin
  IF NOT is_admin(auth.uid()) THEN
    SELECT partner_id INTO _user_partner_id
    FROM public.partner_users
    WHERE user_id = auth.uid() AND status = 'active'
    LIMIT 1;
    
    IF _user_partner_id IS NULL THEN
      RAISE EXCEPTION 'Access denied: no partner association';
    END IF;
    
    _effective_partner_id := _user_partner_id;
  ELSE
    _effective_partner_id := _partner_id;
  END IF;

  IF _effective_partner_id IS NULL THEN
    RAISE EXCEPTION 'Partner ID is required';
  END IF;

  SELECT jsonb_build_object(
    'company_name', COALESCE(p.legal_name, p.name),
    'address', COALESCE(p.address, ''),
    'city', COALESCE(p.city, ''),
    'country', COALESCE(p.country, 'Indonesia'),
    'tax_id', COALESCE(p.tax_id, ''),
    'billing_email', COALESCE(p.contact_email, ''),
    'billing_phone', COALESCE(p.contact_phone, ''),
    'bank_name', COALESCE(p.bank_name, ''),
    'bank_account', COALESCE(p.bank_account_number, ''),
    'bank_holder', COALESCE(p.bank_account_name, ''),
    'billing_details', COALESCE(p.billing_details, '{}'::jsonb)
  )
  INTO _result
  FROM public.partners p
  WHERE p.id = _effective_partner_id;

  RETURN COALESCE(_result, '{}'::jsonb);
END;
$$;

-- Create RPC to update partner billing details
CREATE OR REPLACE FUNCTION public.update_partner_billing_details(
  _company_name text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _country text DEFAULT NULL,
  _tax_id text DEFAULT NULL,
  _billing_email text DEFAULT NULL,
  _billing_phone text DEFAULT NULL,
  _bank_name text DEFAULT NULL,
  _bank_account text DEFAULT NULL,
  _bank_holder text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_partner_id uuid;
BEGIN
  -- Get user's partner_id - must be partner owner
  SELECT partner_id INTO _user_partner_id
  FROM public.partner_users
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role = 'PARTNER_OWNER'
  LIMIT 1;
  
  IF _user_partner_id IS NULL AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: must be partner owner';
  END IF;

  -- Update the partner's billing fields
  UPDATE public.partners
  SET 
    legal_name = COALESCE(_company_name, legal_name),
    address = COALESCE(_address, address),
    city = COALESCE(_city, city),
    country = COALESCE(_country, country),
    tax_id = COALESCE(_tax_id, tax_id),
    contact_email = COALESCE(_billing_email, contact_email),
    contact_phone = COALESCE(_billing_phone, contact_phone),
    bank_name = COALESCE(_bank_name, bank_name),
    bank_account_number = COALESCE(_bank_account, bank_account_number),
    bank_account_name = COALESCE(_bank_holder, bank_account_name),
    billing_details = jsonb_build_object(
      'company_name', COALESCE(_company_name, legal_name, name),
      'address', COALESCE(_address, address, ''),
      'city', COALESCE(_city, city, ''),
      'country', COALESCE(_country, country, 'Indonesia'),
      'tax_id', COALESCE(_tax_id, tax_id, ''),
      'billing_email', COALESCE(_billing_email, contact_email, ''),
      'billing_phone', COALESCE(_billing_phone, contact_phone, ''),
      'bank_name', COALESCE(_bank_name, bank_name, ''),
      'bank_account', COALESCE(_bank_account, bank_account_number, ''),
      'bank_holder', COALESCE(_bank_holder, bank_account_name, '')
    ),
    updated_at = now()
  WHERE id = _user_partner_id;

  RETURN jsonb_build_object('success', true);
END;
$$;