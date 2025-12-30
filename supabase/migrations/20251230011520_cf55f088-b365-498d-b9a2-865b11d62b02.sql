-- Create a transactional function to create partner with modules
CREATE OR REPLACE FUNCTION public.create_partner_with_modules(
  _user_id uuid,
  _partner_name text,
  _contact_name text,
  _contact_email text,
  _module_types text[] -- array of 'boat', 'activity'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _module text;
BEGIN
  -- Validate inputs
  IF _partner_name IS NULL OR length(trim(_partner_name)) < 2 THEN
    RAISE EXCEPTION 'Partner name must be at least 2 characters';
  END IF;
  
  IF _contact_name IS NULL OR length(trim(_contact_name)) < 2 THEN
    RAISE EXCEPTION 'Contact name must be at least 2 characters';
  END IF;
  
  IF array_length(_module_types, 1) IS NULL OR array_length(_module_types, 1) < 1 THEN
    RAISE EXCEPTION 'At least one module type is required';
  END IF;

  -- Create partner
  INSERT INTO public.partners (
    name,
    contact_name,
    contact_email,
    status
  ) VALUES (
    trim(_partner_name),
    trim(_contact_name),
    trim(_contact_email),
    'pending'
  )
  RETURNING id INTO _partner_id;

  -- Create partner_users row (PARTNER_OWNER)
  INSERT INTO public.partner_users (
    partner_id,
    user_id,
    role,
    status
  ) VALUES (
    _partner_id,
    _user_id,
    'PARTNER_OWNER',
    'active'
  );

  -- Create partner_modules rows
  FOREACH _module IN ARRAY _module_types
  LOOP
    IF _module NOT IN ('boat', 'activity') THEN
      RAISE EXCEPTION 'Invalid module type: %', _module;
    END IF;
    
    INSERT INTO public.partner_modules (
      partner_id,
      module_type,
      status
    ) VALUES (
      _partner_id,
      _module::module_type,
      'pending'
    );
  END LOOP;

  RETURN _partner_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_partner_with_modules TO authenticated;