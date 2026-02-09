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
      roomsResult,
      roomImagesResult,
      priceTiersResult,
      roomBookingsResult,
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

      // Blocked/booked dates for the next 6 months (villa-level)
      supabase
        .from('accommodation_calendar')
        .select('accommodation_id, date, status, room_id')
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

      // Active rooms for all accommodations
      supabase
        .from('accommodation_rooms')
        .select('id, accommodation_id, name, description, capacity, bed_type, quantity, price_per_night, currency, minimum_nights, amenities, display_order')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .order('display_order'),

      // Room images
      supabase
        .from('accommodation_room_images')
        .select('id, room_id, image_url, display_order')
        .eq('partner_id', partnerId)
        .order('display_order'),

      // Active price tiers
      supabase
        .from('accommodation_price_tiers')
        .select('id, accommodation_id, room_id, min_nights, price_per_night, currency')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .order('min_nights'),

      // Confirmed room bookings in the next 6 months (for stock availability)
      supabase
        .from('accommodation_bookings')
        .select('room_id, checkin_date, checkout_date')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .not('room_id', 'is', null)
        .lt('checkin_date', endDateStr)
        .gte('checkout_date', todayStr),
    ]);

    const partner = partnerResult.data;
    const accommodations = accommodationsResult.data || [];
    const images = imagesResult.data || [];
    const calendarEntries = calendarResult.data || [];
    const automaticDiscounts = discountsResult.data || [];
    const rooms = roomsResult.data || [];
    const roomImages = roomImagesResult.data || [];
    const priceTiers = priceTiersResult.data || [];
    const roomBookings = roomBookingsResult.data || [];

    // Build blocked dates map per accommodation (only entries without room_id = villa-level blocks)
    const blockedDatesMap = new Map<string, string[]>();
    for (const entry of calendarEntries) {
      // Villa-level: entries with no room_id
      if (!entry.room_id) {
        const accId = entry.accommodation_id;
        if (!blockedDatesMap.has(accId)) {
          blockedDatesMap.set(accId, []);
        }
        blockedDatesMap.get(accId)!.push(entry.date);
      }
    }

    // Build room fully-booked dates map
    // For each room, count bookings per date. If count >= quantity, the date is fully booked.
    const roomQuantityMap = new Map<string, number>();
    for (const room of rooms) {
      roomQuantityMap.set(room.id, room.quantity);
    }

    const roomBlockedDatesMap = new Map<string, string[]>();
    // Group bookings by room_id
    const bookingsByRoom = new Map<string, Array<{ checkin_date: string; checkout_date: string }>>();
    for (const booking of roomBookings) {
      if (!booking.room_id) continue;
      if (!bookingsByRoom.has(booking.room_id)) {
        bookingsByRoom.set(booking.room_id, []);
      }
      bookingsByRoom.get(booking.room_id)!.push(booking);
    }

    // For each room, compute fully booked dates
    for (const room of rooms) {
      const quantity = room.quantity;
      const roomBkgs = bookingsByRoom.get(room.id) || [];
      if (roomBkgs.length === 0) {
        roomBlockedDatesMap.set(room.id, []);
        continue;
      }

      // Iterate through each day in the range
      const fullyBookedDates: string[] = [];
      const current = new Date(todayStr);
      const end = new Date(endDateStr);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        // Count bookings that overlap this date
        let count = 0;
        for (const bkg of roomBkgs) {
          if (bkg.checkin_date <= dateStr && bkg.checkout_date > dateStr) {
            count++;
          }
        }
        if (count >= quantity) {
          fullyBookedDates.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }

      roomBlockedDatesMap.set(room.id, fullyBookedDates);
    }

    // Also add accommodation-level blocks to room blocked dates
    for (const room of rooms) {
      const accBlocked = blockedDatesMap.get(room.accommodation_id) || [];
      const roomBlocked = roomBlockedDatesMap.get(room.id) || [];
      const combined = [...new Set([...roomBlocked, ...accBlocked])];
      roomBlockedDatesMap.set(room.id, combined);
    }

    // Build accommodations with images, rooms, tiers, and blocked dates
    const accommodationsWithData = accommodations.map((acc: any) => {
      const accRooms = rooms
        .filter((r: any) => r.accommodation_id === acc.id)
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          capacity: r.capacity,
          bed_type: r.bed_type,
          quantity: r.quantity,
          price_per_night: r.price_per_night,
          currency: r.currency,
          minimum_nights: r.minimum_nights,
          amenities: r.amenities,
          images: roomImages
            .filter((img: any) => img.room_id === r.id)
            .map((img: any) => ({
              id: img.id,
              image_url: img.image_url,
              display_order: img.display_order,
            })),
          blocked_dates: roomBlockedDatesMap.get(r.id) || [],
          price_tiers: priceTiers
            .filter((t: any) => t.room_id === r.id)
            .map((t: any) => ({
              min_nights: t.min_nights,
              price_per_night: t.price_per_night,
            })),
        }));

      return {
        ...acc,
        images: images
          .filter((img: any) => img.accommodation_id === acc.id)
          .map((img: any) => ({
            id: img.id,
            image_url: img.image_url,
            display_order: img.display_order,
          })),
        blocked_dates: blockedDatesMap.get(acc.id) || [],
        rooms: accRooms,
        price_tiers: priceTiers
          .filter((t: any) => t.accommodation_id === acc.id && !t.room_id)
          .map((t: any) => ({
            min_nights: t.min_nights,
            price_per_night: t.price_per_night,
          })),
      };
    });

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
