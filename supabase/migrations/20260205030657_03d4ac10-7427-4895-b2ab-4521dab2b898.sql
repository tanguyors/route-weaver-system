-- Create facilities table for boat services
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage facilities"
ON public.facilities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can read facilities (for widget display)
CREATE POLICY "Everyone can view facilities"
ON public.facilities
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();