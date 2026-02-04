import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      return new Response(JSON.stringify({ ports: [], routes: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract unique port IDs
    const portIds = new Set<string>();
    routes.forEach((r) => {
      if (r.origin_port_id) portIds.add(r.origin_port_id);
      if (r.destination_port_id) portIds.add(r.destination_port_id);
    });

    // Get port details
    const { data: ports } = await supabase
      .from("ports")
      .select("id, name, code")
      .in("id", Array.from(portIds));

    // Build route pairs for the prewidget
    const routePairs = routes.map((r) => ({
      from: r.origin_port_id,
      to: r.destination_port_id,
    }));

    return new Response(
      JSON.stringify({
        ports: ports || [],
        routes: routePairs,
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
