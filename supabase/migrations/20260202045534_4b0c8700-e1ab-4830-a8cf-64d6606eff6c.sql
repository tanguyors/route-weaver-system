-- Add partner_id column to private_pickup_dropoff_rules
ALTER TABLE public.private_pickup_dropoff_rules 
ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admins can manage all private_pickup_dropoff_rules" ON public.private_pickup_dropoff_rules;
DROP POLICY IF EXISTS "Authenticated users can view private_pickup_dropoff_rules" ON public.private_pickup_dropoff_rules;

-- Create new RLS policies for partner-specific rules
CREATE POLICY "Admins can manage all private_pickup_dropoff_rules" 
ON public.private_pickup_dropoff_rules 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own private_pickup_dropoff_rules" 
ON public.private_pickup_dropoff_rules 
FOR ALL 
USING (is_partner_owner(auth.uid(), partner_id))
WITH CHECK (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own private_pickup_dropoff_rules" 
ON public.private_pickup_dropoff_rules 
FOR SELECT 
USING (user_belongs_to_partner(auth.uid(), partner_id));

CREATE POLICY "Public can view active private_pickup_dropoff_rules" 
ON public.private_pickup_dropoff_rules 
FOR SELECT 
USING (status = 'active');