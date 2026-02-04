import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const cacheHeaders = {
  "Cache-Control": "public, max-age=300, s-maxage=300",
  Vary: "Accept-Encoding",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const googleMapsApiKey = Deno.env.get("VITE_GOOGLE_MAPS_API_KEY") ?? null;

  return new Response(
    JSON.stringify({
      google_maps_api_key: googleMapsApiKey,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
