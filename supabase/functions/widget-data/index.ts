// Widget Data Edge Function - v3 (Optimized with parallel queries and caching)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Cache headers for browser/CDN caching (5 minutes)
const cacheHeaders = {
  'Cache-Control': 'public, max-age=300, s-maxage=300',
  'Vary': 'Accept-Encoding',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const widgetKey = url.searchParams.get('widget_key');
    const date = url.searchParams.get('date');

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

    // Validate widget first (required before other queries)
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
    const today = date || new Date().toISOString().split('T')[0];
    
    // OPTIMIZATION: Run all independent queries in parallel
    const [
      partnerResult,
      routesResult,
      tripsResult,
      boatsResult,
      priceRulesResult,
      addonsResult,
      privateBoatsResult,
      pdRulesResult,
      departureTemplatesResult,
      departuresResult,
    ] = await Promise.all([
      // Partner info
      supabase
        .from('partners')
        .select('name, logo_url')
        .eq('id', partnerId)
        .single(),
      
      // Routes
      supabase
        .from('routes')
        .select(`
          id, route_name, origin_port_id, destination_port_id, duration_minutes,
          origin_port:ports!routes_origin_port_id_fkey(id, name, area),
          destination_port:ports!routes_destination_port_id_fkey(id, name, area)
        `)
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Trips
      supabase
        .from('trips')
        .select('id, route_id, trip_name, description, capacity_default')
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Boats
      supabase
        .from('boats')
        .select(`
          id, name, description, capacity, image_url, images,
          boat_facilities(facility_id, is_free, facility:facilities(id, name, icon))
        `)
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Price rules
      supabase
        .from('price_rules')
        .select('id, trip_id, adult_price, child_price, rule_type, start_date, end_date')
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Addons
      supabase
        .from('addons')
        .select(`
          id, name, description, type, pricing_model, price, 
          is_mandatory, enable_pickup_zones, pickup_required_info,
          applicability, applicable_route_ids, applicable_trip_ids, applicable_schedule_ids
        `)
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Private boats
      supabase
        .from('private_boats')
        .select('id, name, description, capacity, min_capacity, max_capacity, image_url, min_departure_time, max_departure_time')
        .eq('partner_id', partnerId)
        .eq('status', 'active'),
      
      // Pickup/dropoff rules (global)
      supabase
        .from('private_pickup_dropoff_rules')
        .select('id, from_port_id, service_type, city_name, price, car_price, bus_price, pickup_before_departure_minutes, dropoff_after_arrival_minutes, status')
        .eq('status', 'active'),
      
      // Departure templates
      supabase
        .from('departure_templates')
        .select('trip_id, departure_time, boat_id')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .not('boat_id', 'is', null),
      
      // Departures (limited to 100 for faster initial load)
      supabase
        .from('departures')
        .select('id, trip_id, route_id, departure_date, departure_time, capacity_total, capacity_reserved, status, boat_id')
        .eq('partner_id', partnerId)
        .eq('status', 'open')
        .gte('departure_date', today)
        .order('departure_date')
        .order('departure_time')
        .limit(100),
    ]);

    const partner = partnerResult.data;
    const routes = routesResult.data || [];
    const trips = tripsResult.data || [];
    const boats = boatsResult.data || [];
    const priceRules = priceRulesResult.data || [];
    const addons = addonsResult.data || [];
    const privateBoats = privateBoatsResult.data || [];
    const pdRules = pdRulesResult.data || [];
    const departureTemplates = departureTemplatesResult.data || [];
    const departures = departuresResult.data || [];

    // SECOND BATCH: Queries that depend on first batch results
    const addonIds = addons
      .filter((a: any) => a.enable_pickup_zones)
      .map((a: any) => a.id);
    
    const privateBoatIds = privateBoats.map((pb: any) => pb.id);

    const [pickupZonesResult, privateBoatRoutesResult] = await Promise.all([
      // Pickup zones (only if needed)
      addonIds.length > 0
        ? supabase
            .from('pickup_zones')
            .select('id, addon_id, zone_name, price_override')
            .eq('partner_id', partnerId)
            .eq('status', 'active')
            .in('addon_id', addonIds)
        : Promise.resolve({ data: [] }),
      
      // Private boat routes (only if needed)
      privateBoatIds.length > 0
        ? supabase
            .from('private_boat_routes')
            .select(`
              id, private_boat_id, from_port_id, to_port_id, price, duration_minutes,
              from_port:ports!private_boat_routes_from_port_id_fkey(id, name, area),
              to_port:ports!private_boat_routes_to_port_id_fkey(id, name, area)
            `)
            .in('private_boat_id', privateBoatIds)
            .eq('status', 'active')
        : Promise.resolve({ data: [] }),
    ]);

    const pickupZones = pickupZonesResult.data || [];
    const privateBoatRoutes = privateBoatRoutesResult.data || [];
    const routeIds = privateBoatRoutes.map((r: any) => r.id);

    // THIRD BATCH: Route activity addons (only if private boat routes exist)
    let routeActivityAddons: any[] = [];
    if (routeIds.length > 0) {
      const { data: raData } = await supabase
        .from('private_boat_route_addons')
        .select(`
          id, route_id, activity_addon_id, pricing_type,
          activity_addon:private_boat_activity_addons(id, name, description, price)
        `)
        .in('route_id', routeIds);
      routeActivityAddons = raData || [];
    }

    // Process data
    const addonsWithZones = addons.map((addon: any) => ({
      ...addon,
      pickup_zones: pickupZones.filter((z: any) => z.addon_id === addon.id)
    }));

    const privateBoatRoutesWithAddons = privateBoatRoutes.map((route: any) => ({
      ...route,
      activity_addons: routeActivityAddons.filter((ra: any) => ra.route_id === route.id),
    }));

    const pickupDropoffRules = pdRules.map((rule: any) => ({
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

    const privateBoatsWithData = privateBoats.map((boat: any) => ({
      ...boat,
      routes: privateBoatRoutesWithAddons.filter((r: any) => r.private_boat_id === boat.id),
      pickup_dropoff_rules: pickupDropoffRules,
    }));

    // Process departures with template fallback
    const normalizeTime = (t: string) => (t || '').slice(0, 5);
    const templateBoatMap = new Map<string, string>();

    for (const t of departureTemplates as any[]) {
      if (!t?.trip_id || !t?.departure_time || !t?.boat_id) continue;
      templateBoatMap.set(`${t.trip_id}__${normalizeTime(t.departure_time)}`, t.boat_id);
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().slice(0, 5);
    
    const filteredDepartures = departures
      .filter((d: any) => {
        if (d.departure_date === todayStr) {
          const depTime = (d.departure_time || '').slice(0, 5);
          return depTime > currentTimeStr;
        }
        return true;
      })
      .map((d: any) => {
        if (d.boat_id) return d;
        const boatId = templateBoatMap.get(`${d.trip_id}__${normalizeTime(d.departure_time)}`);
        return boatId ? { ...d, boat_id: boatId } : d;
      });

    // Build unique ports list
    const ports = new Map();
    for (const route of routes) {
      const originPort = route.origin_port as unknown as { id: string; name: string; area: string } | null;
      const destPort = route.destination_port as unknown as { id: string; name: string; area: string } | null;
      if (originPort) ports.set(originPort.id, originPort);
      if (destPort) ports.set(destPort.id, destPort);
    }

    const responseData = {
      partner_id: partnerId,
      theme_config: {
        ...(widget.theme_config || {}),
        partner_name: partner?.name || null,
        logo_url: (widget.theme_config as any)?.logo_url || partner?.logo_url || null,
      },
      ports: Array.from(ports.values()),
      routes,
      trips,
      boats,
      price_rules: priceRules,
      departures: filteredDepartures,
      addons: addonsWithZones,
      private_boats: privateBoatsWithData,
      pickup_dropoff_rules: pickupDropoffRules,
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...cacheHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Widget data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
