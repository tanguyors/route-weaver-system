-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view own draft bookings by id" ON public.activity_bookings;

-- Create a secure policy for draft bookings - users can only view their own draft bookings
-- This requires the user to be authenticated and be the owner of the booking
CREATE POLICY "Users can view their own draft bookings"
ON public.activity_bookings
FOR SELECT
USING (
  -- Draft bookings can only be viewed by the user who created them
  (status = 'draft' AND user_id = auth.uid())
  OR
  -- Or by partner users/admins (already covered by other policies, but explicit here for clarity)
  user_belongs_to_partner(auth.uid(), partner_id)
  OR
  is_admin(auth.uid())
);