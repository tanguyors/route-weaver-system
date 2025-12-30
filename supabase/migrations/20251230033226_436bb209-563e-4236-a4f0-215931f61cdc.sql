-- Drop and recreate update_partner_billing_details to accept single jsonb param
CREATE OR REPLACE FUNCTION public.update_partner_billing_details(_billing_details jsonb)
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
    legal_name = COALESCE(_billing_details->>'company_name', legal_name),
    address = COALESCE(_billing_details->>'address', address),
    city = COALESCE(_billing_details->>'city', city),
    country = COALESCE(_billing_details->>'country', country),
    tax_id = COALESCE(_billing_details->>'tax_id', tax_id),
    contact_email = COALESCE(_billing_details->>'billing_email', contact_email),
    contact_phone = COALESCE(_billing_details->>'billing_phone', contact_phone),
    bank_name = COALESCE(_billing_details->>'bank_name', bank_name),
    bank_account_number = COALESCE(_billing_details->>'bank_account', bank_account_number),
    bank_account_name = COALESCE(_billing_details->>'bank_holder', bank_account_name),
    billing_details = _billing_details,
    updated_at = now()
  WHERE id = _user_partner_id;

  RETURN jsonb_build_object('success', true);
END;
$$;