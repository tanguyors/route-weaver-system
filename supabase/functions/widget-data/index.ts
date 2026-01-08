import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const widgetKey = url.searchParams.get('widget_key');
    const date = url.searchParams.get('date');
    const originPortId = url.searchParams.get('origin');
    const destinationPortId = url.searchParams.get('destination');

    if (!widgetKey) {
      return new Response(
        JSON.stringify({ error: 'Widget key required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate widget
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('id, partner_id, status, theme_config')
      .eq('public_widget_key', widgetKey)
      .eq('status', 'active')
      .maybeSingle();

    if (widgetError || !widget) {
      return new Response(
        JSON.stringify({ error: 'Invalid widget' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerId = widget.partner_id;

    // Get routes for this partner (Public Fast Ferry)
    const { data: routes } = await supabase
      .from('routes')
      .select(`
        id, route_name, origin_port_id, destination_port_id, duration_minutes,
        origin_port:ports!routes_origin_port_id_fkey(id, name, area),
        destination_port:ports!routes_destination_port_id_fkey(id, name, area)
      `)
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get trips for this partner
    const { data: trips } = await supabase
      .from('trips')
      .select('id, route_id, trip_name, description, capacity_default')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get boats for this partner (Public Fast Ferry fleet)
    const { data: boats } = await supabase
      .from('boats')
      .select('id, name, description, capacity, image_url')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get price rules
    const { data: priceRules } = await supabase
      .from('price_rules')
      .select('id, trip_id, adult_price, child_price, rule_type, start_date, end_date')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get add-ons for this partner
    const { data: addons } = await supabase
      .from('addons')
      .select(`
        id, name, description, type, pricing_model, price, 
        is_mandatory, enable_pickup_zones, pickup_required_info,
        applicability, applicable_route_ids, applicable_trip_ids, applicable_schedule_ids
      `)
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get pickup zones for add-ons with pickup zones enabled
    const addonIds = (addons || [])
      .filter(a => a.enable_pickup_zones)
      .map(a => a.id);
    
    let pickupZones: any[] = [];
    if (addonIds.length > 0) {
      const { data: zones } = await supabase
        .from('pickup_zones')
        .select('id, addon_id, zone_name, price_override')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .in('addon_id', addonIds);
      pickupZones = zones || [];
    }

    // Attach pickup zones to their addons
    const addonsWithZones = (addons || []).map(addon => ({
      ...addon,
      pickup_zones: pickupZones.filter(z => z.addon_id === addon.id)
    }));

    // ========== PRIVATE BOATS DATA ==========
    // Get private boats for this partner
    const { data: privateBoats } = await supabase
      .from('private_boats')
      .select('id, name, description, capacity, min_capacity, max_capacity, image_url, min_departure_time, max_departure_time')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    // Get private boat routes with port details
    const privateBoatIds = (privateBoats || []).map(pb => pb.id);
    let privateBoatRoutes: any[] = [];
    if (privateBoatIds.length > 0) {
      const { data: pbRoutes } = await supabase
        .from('private_boat_routes')
        .select(`
          id, private_boat_id, from_port_id, to_port_id, price, duration_minutes,
          from_port:ports!private_boat_routes_from_port_id_fkey(id, name, area),
          to_port:ports!private_boat_routes_to_port_id_fkey(id, name, area)
        `)
        .in('private_boat_id', privateBoatIds)
        .eq('status', 'active');
      privateBoatRoutes = pbRoutes || [];
    }

    // Get pickup/dropoff rules for private boats (GLOBAL - from private_pickup_dropoff_rules)
    const { data: pdRules } = await supabase
      .from('private_pickup_dropoff_rules')
      .select('id, from_port_id, service_type, city_name, price, car_price, bus_price, pickup_before_departure_minutes, dropoff_after_arrival_minutes, status')
      .eq('status', 'active');
    
    // Transform the rules to match the expected format (mapping to all boats since rules are global)
    const pickupDropoffRules = (pdRules || []).map(rule => ({
      id: rule.id,
      from_port_id: rule.from_port_id,
      service_type: rule.service_type,
      city_name: rule.city_name,
      price: rule.price,
      car_price: rule.car_price || rule.price,
      bus_price: rule.bus_price || rule.price,
      before_departure_minutes: rule.service_type === 'pickup' 
        ? rule.pickup_before_departure_minutes 
        : rule.dropoff_after_arrival_minutes,
    }));

    // Attach routes and rules to private boats (rules are global, attach to all boats)
    const privateBoatsWithData = (privateBoats || []).map(boat => ({
      ...boat,
      routes: privateBoatRoutes.filter(r => r.private_boat_id === boat.id),
      pickup_dropoff_rules: pickupDropoffRules,
    }));

    // Build departures query
    let departuresQuery = supabase
      .from('departures')
      .select('id, trip_id, route_id, departure_date, departure_time, capacity_total, capacity_reserved, status, boat_id')
      .eq('partner_id', partnerId)
      .eq('status', 'open')
      .gte('departure_date', date || new Date().toISOString().split('T')[0])
      .order('departure_date')
      .order('departure_time')
      .limit(50);

    const { data: departures } = await departuresQuery;

    // Filter by route if origin/destination provided
    let filteredDepartures = departures || [];
    if (originPortId && destinationPortId) {
      const matchingRoutes = (routes || []).filter(
        r => r.origin_port_id === originPortId && r.destination_port_id === destinationPortId
      );
      const matchingRouteIds = matchingRoutes.map(r => r.id);
      filteredDepartures = filteredDepartures.filter(d => matchingRouteIds.includes(d.route_id));
    }

    // Build unique ports list
    const ports = new Map();
    for (const route of routes || []) {
      const originPort = route.origin_port as unknown as { id: string; name: string; area: string } | null;
      const destPort = route.destination_port as unknown as { id: string; name: string; area: string } | null;
      if (originPort) {
        ports.set(originPort.id, originPort);
      }
      if (destPort) {
        ports.set(destPort.id, destPort);
      }
    }

    return new Response(
      JSON.stringify({
        partner_id: partnerId,
        theme_config: widget.theme_config,
        ports: Array.from(ports.values()),
        routes: routes || [],
        trips: trips || [],
        boats: boats || [],
        price_rules: priceRules || [],
        departures: filteredDepartures,
        addons: addonsWithZones,
        // Private boats data
        private_boats: privateBoatsWithData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Widget data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
