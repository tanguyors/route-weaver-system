-- =============================================
-- SRIBOOKING DATABASE SCHEMA - PHASE 2
-- =============================================

-- 1) Create ENUM Types
CREATE TYPE public.partner_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.partner_user_role AS ENUM ('PARTNER_OWNER', 'PARTNER_STAFF');
CREATE TYPE public.partner_user_status AS ENUM ('active', 'inactive');
CREATE TYPE public.route_status AS ENUM ('active', 'inactive');
CREATE TYPE public.trip_status AS ENUM ('active', 'inactive');
CREATE TYPE public.departure_status AS ENUM ('open', 'closed', 'sold_out', 'cancelled');
CREATE TYPE public.price_rule_type AS ENUM ('base', 'seasonal', 'custom');
CREATE TYPE public.discount_type AS ENUM ('promo_code', 'automatic');
CREATE TYPE public.discount_value_type AS ENUM ('percent', 'fixed');
CREATE TYPE public.age_group AS ENUM ('adult', 'child', 'infant');
CREATE TYPE public.booking_channel AS ENUM ('online_widget', 'offline_walkin', 'offline_whatsapp', 'offline_agency', 'offline_other');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE public.ticket_status AS ENUM ('pending', 'validated', 'cancelled', 'refunded', 'expired');
CREATE TYPE public.checkin_result AS ENUM ('success', 'already_used', 'invalid', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('card', 'qris', 'transfer', 'cash', 'payment_link');
CREATE TYPE public.payment_provider AS ENUM ('stripe', 'xendit', 'midtrans', 'manual');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded', 'partial');
CREATE TYPE public.payment_link_status AS ENUM ('active', 'paid', 'expired', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('requested', 'approved', 'paid', 'rejected');
CREATE TYPE public.widget_type AS ENUM ('fastboat');
CREATE TYPE public.widget_status AS ENUM ('active', 'inactive');
CREATE TYPE public.app_role AS ENUM ('admin', 'partner_owner', 'partner_staff');

-- 2) Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) User roles table (RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4) Partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  logo_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  status partner_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Partner Users (maps users to partners with role)
CREATE TABLE public.partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role partner_user_role NOT NULL,
  status partner_user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, user_id)
);

-- 6) Ports
CREATE TABLE public.ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) Routes
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  origin_port_id UUID NOT NULL REFERENCES public.ports(id),
  destination_port_id UUID NOT NULL REFERENCES public.ports(id),
  route_name TEXT NOT NULL,
  duration_minutes INTEGER,
  status route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8) Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  description TEXT,
  capacity_default INTEGER NOT NULL DEFAULT 50,
  status trip_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) Departure Templates
CREATE TABLE public.departure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  seasonal_start_date DATE,
  seasonal_end_date DATE,
  status route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10) Departures (instances)
CREATE TABLE public.departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id),
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  capacity_total INTEGER NOT NULL,
  capacity_reserved INTEGER NOT NULL DEFAULT 0,
  status departure_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, departure_date, departure_time)
);

-- 11) Price Rules
CREATE TABLE public.price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  rule_type price_rule_type NOT NULL DEFAULT 'base',
  start_date DATE,
  end_date DATE,
  adult_price DECIMAL(12, 2) NOT NULL,
  child_price DECIMAL(12, 2),
  currency TEXT NOT NULL DEFAULT 'IDR',
  status route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12) Discount Rules
CREATE TABLE public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type discount_type NOT NULL,
  code TEXT,
  discount_value_type discount_value_type NOT NULL,
  discount_value DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  min_pax INTEGER,
  applicable_trip_ids UUID[],
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  status route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13) Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14) Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  departure_id UUID NOT NULL REFERENCES public.departures(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  channel booking_channel NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  pax_adult INTEGER NOT NULL DEFAULT 1,
  pax_child INTEGER NOT NULL DEFAULT 0,
  subtotal_amount DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  notes_internal TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15) Passengers
CREATE TABLE public.passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age_group age_group NOT NULL DEFAULT 'adult',
  id_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16) Booking Addons
CREATE TABLE public.booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17) Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  qr_image_url TEXT,
  status ticket_status NOT NULL DEFAULT 'pending',
  validated_at TIMESTAMPTZ,
  validated_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18) Checkin Events
CREATE TABLE public.checkin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id),
  scanned_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result checkin_result NOT NULL
);

-- 19) Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id),
  method payment_method NOT NULL,
  provider payment_provider NOT NULL DEFAULT 'manual',
  provider_reference TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status payment_status NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20) Payment Links
CREATE TABLE public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  provider payment_provider NOT NULL,
  url TEXT,
  status payment_link_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21) Commission Records
CREATE TABLE public.commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id),
  gross_amount DECIMAL(12, 2) NOT NULL,
  platform_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 7.00,
  platform_fee_amount DECIMAL(12, 2) NOT NULL,
  payment_provider_fee_amount DECIMAL(12, 2) DEFAULT 0,
  partner_net_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22) Withdrawal Requests
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status withdrawal_status NOT NULL DEFAULT 'requested',
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  processed_by_admin_user_id UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 23) Widgets
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  widget_type widget_type NOT NULL DEFAULT 'fastboat',
  public_widget_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  allowed_domains TEXT[],
  theme_config JSONB DEFAULT '{}',
  status widget_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24) Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES public.partners(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_partner_users_partner_id ON public.partner_users(partner_id);
CREATE INDEX idx_partner_users_user_id ON public.partner_users(user_id);
CREATE INDEX idx_routes_partner_id ON public.routes(partner_id);
CREATE INDEX idx_trips_partner_id ON public.trips(partner_id);
CREATE INDEX idx_trips_route_id ON public.trips(route_id);
CREATE INDEX idx_departure_templates_partner_id ON public.departure_templates(partner_id);
CREATE INDEX idx_departures_partner_id ON public.departures(partner_id);
CREATE INDEX idx_departures_trip_id ON public.departures(trip_id);
CREATE INDEX idx_departures_date ON public.departures(departure_date);
CREATE INDEX idx_price_rules_partner_id ON public.price_rules(partner_id);
CREATE INDEX idx_price_rules_trip_id ON public.price_rules(trip_id);
CREATE INDEX idx_discount_rules_partner_id ON public.discount_rules(partner_id);
CREATE INDEX idx_bookings_partner_id ON public.bookings(partner_id);
CREATE INDEX idx_bookings_departure_id ON public.bookings(departure_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_passengers_booking_id ON public.passengers(booking_id);
CREATE INDEX idx_tickets_booking_id ON public.tickets(booking_id);
CREATE INDEX idx_tickets_qr_token ON public.tickets(qr_token);
CREATE INDEX idx_checkin_events_ticket_id ON public.checkin_events(ticket_id);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_partner_id ON public.payments(partner_id);
CREATE INDEX idx_commission_records_booking_id ON public.commission_records(booking_id);
CREATE INDEX idx_commission_records_partner_id ON public.commission_records(partner_id);
CREATE INDEX idx_withdrawal_requests_partner_id ON public.withdrawal_requests(partner_id);
CREATE INDEX idx_widgets_partner_id ON public.widgets(partner_id);
CREATE INDEX idx_widgets_public_key ON public.widgets(public_widget_key);
CREATE INDEX idx_audit_logs_partner_id ON public.audit_logs(partner_id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- =============================================
-- SECURITY DEFINER FUNCTIONS FOR RBAC
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Get user's partner_id (returns first active partner)
CREATE OR REPLACE FUNCTION public.get_user_partner_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.partner_users
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- Check if user belongs to a partner
CREATE OR REPLACE FUNCTION public.user_belongs_to_partner(_user_id UUID, _partner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE user_id = _user_id AND partner_id = _partner_id AND status = 'active'
  )
$$;

-- Check if user is partner owner
CREATE OR REPLACE FUNCTION public.is_partner_owner(_user_id UUID, _partner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE user_id = _user_id 
      AND partner_id = _partner_id 
      AND role = 'PARTNER_OWNER' 
      AND status = 'active'
  )
$$;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departure_templates_updated_at BEFORE UPDATE ON public.departure_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departures_updated_at BEFORE UPDATE ON public.departures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_price_rules_updated_at BEFORE UPDATE ON public.price_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON public.discount_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: users can view/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles: only admins can manage, users can view their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- Partners: admins see all, partner users see their own
CREATE POLICY "Admins can manage all partners" ON public.partners FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own partner" ON public.partners FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), id));
CREATE POLICY "Partner owners can update own partner" ON public.partners FOR UPDATE USING (public.is_partner_owner(auth.uid(), id));

-- Partner Users: admins see all, partner owners manage their own
CREATE POLICY "Admins can manage all partner_users" ON public.partner_users FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own partner members" ON public.partner_users FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage partner members" ON public.partner_users FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Ports: public read for authenticated users
CREATE POLICY "Authenticated users can view ports" ON public.ports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ports" ON public.ports FOR ALL USING (public.is_admin(auth.uid()));

-- Routes: partner-scoped
CREATE POLICY "Admins can manage all routes" ON public.routes FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own routes" ON public.routes FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own routes" ON public.routes FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Trips: partner-scoped
CREATE POLICY "Admins can manage all trips" ON public.trips FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own trips" ON public.trips FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own trips" ON public.trips FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Departure Templates: partner-scoped
CREATE POLICY "Admins can manage all departure_templates" ON public.departure_templates FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own departure_templates" ON public.departure_templates FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own departure_templates" ON public.departure_templates FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Departures: partner-scoped
CREATE POLICY "Admins can manage all departures" ON public.departures FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own departures" ON public.departures FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own departures" ON public.departures FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Price Rules: partner-scoped
CREATE POLICY "Admins can manage all price_rules" ON public.price_rules FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own price_rules" ON public.price_rules FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own price_rules" ON public.price_rules FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Discount Rules: partner-scoped
CREATE POLICY "Admins can manage all discount_rules" ON public.discount_rules FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own discount_rules" ON public.discount_rules FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage own discount_rules" ON public.discount_rules FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Customers: partner users can create/view (linked via bookings)
CREATE POLICY "Authenticated users can create customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);

-- Bookings: partner-scoped, staff can create
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own bookings" ON public.bookings FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner users can create bookings" ON public.bookings FOR INSERT WITH CHECK (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can update bookings" ON public.bookings FOR UPDATE USING (public.is_partner_owner(auth.uid(), partner_id));

-- Passengers: linked via bookings
CREATE POLICY "Admins can manage all passengers" ON public.passengers FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view passengers via booking" ON public.passengers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.user_belongs_to_partner(auth.uid(), b.partner_id))
);
CREATE POLICY "Partner users can create passengers" ON public.passengers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.user_belongs_to_partner(auth.uid(), b.partner_id))
);

-- Booking Addons
CREATE POLICY "Admins can manage all booking_addons" ON public.booking_addons FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view booking_addons" ON public.booking_addons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.user_belongs_to_partner(auth.uid(), b.partner_id))
);

-- Tickets: partner-scoped via booking
CREATE POLICY "Admins can manage all tickets" ON public.tickets FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view tickets" ON public.tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.user_belongs_to_partner(auth.uid(), b.partner_id))
);
CREATE POLICY "Partner users can update tickets for validation" ON public.tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.user_belongs_to_partner(auth.uid(), b.partner_id))
);

-- Checkin Events: partner-scoped
CREATE POLICY "Admins can manage all checkin_events" ON public.checkin_events FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view checkin_events" ON public.checkin_events FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner users can create checkin_events" ON public.checkin_events FOR INSERT WITH CHECK (public.user_belongs_to_partner(auth.uid(), partner_id));

-- Payments: partner-scoped
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view payments" ON public.payments FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage payments" ON public.payments FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Payment Links: partner-scoped
CREATE POLICY "Admins can manage all payment_links" ON public.payment_links FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view payment_links" ON public.payment_links FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage payment_links" ON public.payment_links FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Commission Records: partner-scoped (read-only for partners)
CREATE POLICY "Admins can manage all commission_records" ON public.commission_records FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view commission_records" ON public.commission_records FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));

-- Withdrawal Requests: partner-scoped
CREATE POLICY "Admins can manage all withdrawal_requests" ON public.withdrawal_requests FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view withdrawal_requests" ON public.withdrawal_requests FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can create withdrawal_requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (public.is_partner_owner(auth.uid(), partner_id));

-- Widgets: partner-scoped
CREATE POLICY "Admins can manage all widgets" ON public.widgets FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view widgets" ON public.widgets FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "Partner owners can manage widgets" ON public.widgets FOR ALL USING (public.is_partner_owner(auth.uid(), partner_id));

-- Audit Logs: admins see all, partners see their own
CREATE POLICY "Admins can view all audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Partner users can view own audit_logs" ON public.audit_logs FOR SELECT USING (public.user_belongs_to_partner(auth.uid(), partner_id));
CREATE POLICY "System can insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);