-- Create enum for private boat status
CREATE TYPE public.private_boat_status AS ENUM ('draft', 'active', 'inactive');

-- Create enum for pickup/dropoff service type
CREATE TYPE public.pickup_dropoff_service_type AS ENUM ('pickup', 'dropoff');

-- Create private_boats table
CREATE TABLE public.private_boats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  capacity integer NOT NULL DEFAULT 1,
  image_url text,
  status public.private_boat_status NOT NULL DEFAULT 'draft',
  min_departure_time time NOT NULL DEFAULT '06:00',
  max_departure_time time NOT NULL DEFAULT '18:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT private_boats_capacity_positive CHECK (capacity > 0),
  CONSTRAINT private_boats_time_range_valid CHECK (min_departure_time < max_departure_time)
);

-- Create private_boat_routes table
CREATE TABLE public.private_boat_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  private_boat_id uuid NOT NULL REFERENCES public.private_boats(id) ON DELETE CASCADE,
  from_port_id uuid NOT NULL REFERENCES public.ports(id) ON DELETE CASCADE,
  to_port_id uuid NOT NULL REFERENCES public.ports(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  duration_minutes integer,
  status public.route_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT private_boat_routes_price_positive CHECK (price >= 0),
  CONSTRAINT private_boat_routes_different_ports CHECK (from_port_id != to_port_id),
  CONSTRAINT private_boat_routes_unique UNIQUE (private_boat_id, from_port_id, to_port_id)
);

-- Create private_pickup_dropoff_rules table (global)
CREATE TABLE public.private_pickup_dropoff_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_port_id uuid NOT NULL REFERENCES public.ports(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  service_type public.pickup_dropoff_service_type NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  pickup_before_departure_minutes integer,
  dropoff_after_arrival_minutes integer,
  status public.route_status NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT private_pickup_dropoff_rules_price_positive CHECK (price >= 0)
);

-- Enable RLS
ALTER TABLE public.private_boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_boat_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_pickup_dropoff_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_boats
CREATE POLICY "Admins can manage all private_boats"
  ON public.private_boats FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own private_boats"
  ON public.private_boats FOR ALL
  USING (is_partner_owner(auth.uid(), partner_id));

CREATE POLICY "Partner users can view own private_boats"
  ON public.private_boats FOR SELECT
  USING (user_belongs_to_partner(auth.uid(), partner_id));

-- RLS Policies for private_boat_routes
CREATE POLICY "Admins can manage all private_boat_routes"
  ON public.private_boat_routes FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Partner owners can manage own private_boat_routes"
  ON public.private_boat_routes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.private_boats pb
      WHERE pb.id = private_boat_routes.private_boat_id
      AND is_partner_owner(auth.uid(), pb.partner_id)
    )
  );

CREATE POLICY "Partner users can view own private_boat_routes"
  ON public.private_boat_routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_boats pb
      WHERE pb.id = private_boat_routes.private_boat_id
      AND user_belongs_to_partner(auth.uid(), pb.partner_id)
    )
  );

-- RLS Policies for private_pickup_dropoff_rules (global read, admin write)
CREATE POLICY "Admins can manage all private_pickup_dropoff_rules"
  ON public.private_pickup_dropoff_rules FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view private_pickup_dropoff_rules"
  ON public.private_pickup_dropoff_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on private_boats
CREATE TRIGGER update_private_boats_updated_at
  BEFORE UPDATE ON public.private_boats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on private_boat_routes
CREATE TRIGGER update_private_boat_routes_updated_at
  BEFORE UPDATE ON public.private_boat_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on private_pickup_dropoff_rules
CREATE TRIGGER update_private_pickup_dropoff_rules_updated_at
  BEFORE UPDATE ON public.private_pickup_dropoff_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();