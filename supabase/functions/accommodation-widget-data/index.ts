import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const cacheHeaders = {
  'Cache-Control': 'public, max-age=300, s-maxage=300',
  'Vary': 'Accept-Encoding',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const widgetKey = url.searchParams.get('widget_key');

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
      .eq('widget_type', 'accommodation')
      .eq('status', 'active')
      .maybeSingle();

    if (widgetError || !widget) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive widget' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerId = widget.partner_id;

    // Calculate date range for availability (today + 6 months)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const endDateStr = sixMonthsLater.toISOString().split('T')[0];

    // Run all queries in parallel
    const [
      partnerResult,
      accommodationsResult,
      imagesResult,
      calendarResult,
      discountsResult,
    ] = await Promise.all([
      // Partner info
      supabase
        .from('partners')
        .select('name, logo_url')
        .eq('id', partnerId)
        .single(),

      // Active accommodations
      supabase
        .from('accommodations')
        .select('id, name, type, description, capacity, bedrooms, bathrooms, amenities, city, country, price_per_night, currency, minimum_nights, checkin_time, checkout_time')
        .eq('partner_id', partnerId)
        .eq('status', 'active'),

      // All images for partner accommodations
      supabase
        .from('accommodation_images')
        .select('id, accommodation_id, image_url, display_order')
        .eq('partner_id', partnerId)
        .order('display_order'),

      // Blocked/booked dates for the next 6 months
      supabase
        .from('accommodation_calendar')
        .select('accommodation_id, date, status')
        .eq('partner_id', partnerId)
        .neq('status', 'available')
        .gte('date', todayStr)
        .lte('date', endDateStr),

      // Active automatic discounts
      supabase
        .from('accommodation_discounts')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('type', 'automatic')
        .eq('status', 'active'),
    ]);

    const partner = partnerResult.data;
    const accommodations = accommodationsResult.data || [];
    const images = imagesResult.data || [];
    const calendarEntries = calendarResult.data || [];
    const automaticDiscounts = discountsResult.data || [];

    // Build blocked dates map per accommodation
    const blockedDatesMap = new Map<string, string[]>();
    for (const entry of calendarEntries) {
      const accId = entry.accommodation_id;
      if (!blockedDatesMap.has(accId)) {
        blockedDatesMap.set(accId, []);
      }
      blockedDatesMap.get(accId)!.push(entry.date);
    }

    // Build accommodations with images and blocked dates
    const accommodationsWithData = accommodations.map((acc: any) => ({
      ...acc,
      images: images
        .filter((img: any) => img.accommodation_id === acc.id)
        .map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          display_order: img.display_order,
        })),
      blocked_dates: blockedDatesMap.get(acc.id) || [],
    }));

    const responseData = {
      partner_id: partnerId,
      theme_config: {
        ...(widget.theme_config || {}),
        partner_name: partner?.name || null,
        logo_url: (widget.theme_config as any)?.logo_url || partner?.logo_url || null,
      },
      accommodations: accommodationsWithData,
      automatic_discounts: automaticDiscounts,
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          ...cacheHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Accommodation widget data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});