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
      .select('id, partner_id, status')
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

    // Get routes for this partner
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

    // Build departures query
    let departuresQuery = supabase
      .from('departures')
      .select('id, trip_id, route_id, departure_date, departure_time, capacity_total, capacity_reserved, status')
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
        ports: Array.from(ports.values()),
        routes: routes || [],
        trips: trips || [],
        price_rules: priceRules || [],
        departures: filteredDepartures,
        addons: addonsWithZones,
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
