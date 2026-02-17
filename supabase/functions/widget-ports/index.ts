import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const widgetKey = url.searchParams.get("key");

    if (!widgetKey) {
      return new Response(JSON.stringify({ error: "Missing widget key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get widget and partner
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("partner_id, status")
      .eq("public_widget_key", widgetKey)
      .maybeSingle();

    if (widgetError || !widget) {
      return new Response(JSON.stringify({ error: "Widget not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (widget.status !== "active") {
      return new Response(JSON.stringify({ error: "Widget is inactive" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ports that have active routes for this partner
    const { data: routes } = await supabase
      .from("routes")
      .select("origin_port_id, destination_port_id")
      .eq("partner_id", widget.partner_id)
      .eq("status", "active");

    if (!routes || routes.length === 0) {
      // Still check for private boats even if no public routes
    }

    // Extract unique port IDs
    const portIds = new Set<string>();
    (routes || []).forEach((r) => {
      if (r.origin_port_id) portIds.add(r.origin_port_id);
      if (r.destination_port_id) portIds.add(r.destination_port_id);
    });

    // Get port details
    const { data: ports } = portIds.size > 0
      ? await supabase.from("ports").select("id, name").in("id", Array.from(portIds))
      : { data: [] };

    // Build route pairs for the prewidget
    const routePairs = (routes || []).map((r) => ({
      from: r.origin_port_id,
      to: r.destination_port_id,
    }));

    // Get private boats with their routes
    const { data: privateBoats } = await supabase
      .from("private_boats")
      .select("id, name, description, capacity, min_capacity, max_capacity, image_url, min_departure_time, max_departure_time")
      .eq("partner_id", widget.partner_id)
      .eq("status", "active");

    let privateBoatsWithRoutes: any[] = [];
    if (privateBoats && privateBoats.length > 0) {
      const boatIds = privateBoats.map((b) => b.id);
      const { data: pbRoutes } = await supabase
        .from("private_boat_routes")
        .select("id, boat_id, from_port_id, to_port_id, price, currency, from_port:ports!private_boat_routes_from_port_id_fkey(id, name), to_port:ports!private_boat_routes_to_port_id_fkey(id, name)")
        .in("boat_id", boatIds)
        .eq("status", "active");

      privateBoatsWithRoutes = privateBoats.map((boat) => ({
        ...boat,
        routes: (pbRoutes || []).filter((r) => r.boat_id === boat.id),
      }));
    }

    return new Response(
      JSON.stringify({
        ports: ports || [],
        routes: routePairs,
        private_boats: privateBoatsWithRoutes,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
