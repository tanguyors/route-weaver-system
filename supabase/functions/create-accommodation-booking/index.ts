import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getDatesInRange(checkin: string, checkout: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkin);
  const end = new Date(checkout);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function calculateNights(checkin: string, checkout: string): number {
  return Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24));
}

function getEffectivePrice(tiers: any[], nights: number, basePrice: number): number {
  if (!tiers || tiers.length === 0) return basePrice;
  const applicable = tiers
    .filter((t: any) => t.min_nights <= nights)
    .sort((a: any, b: any) => b.min_nights - a.min_nights);
  return applicable.length > 0 ? applicable[0].price_per_night : basePrice;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const {
      widget_key,
      accommodation_id,
      room_id,
      checkin_date,
      checkout_date,
      guests_count,
      customer,
      promo_code,
    } = body;

    // Validate required fields
    if (!widget_key || !accommodation_id || !checkin_date || !checkout_date || !customer?.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate widget
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('id, partner_id, status')
      .eq('public_widget_key', widget_key)
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

    // 2. Validate accommodation
    const { data: accommodation, error: accError } = await supabase
      .from('accommodations')
      .select('id, name, type, price_per_night, currency, minimum_nights, capacity')
      .eq('id', accommodation_id)
      .eq('partner_id', partnerId)
      .eq('status', 'active')
      .single();

    if (accError || !accommodation) {
      return new Response(
        JSON.stringify({ error: 'Accommodation not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nights = calculateNights(checkin_date, checkout_date);
    if (nights < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid date range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guestsCount = guests_count || 1;
    const datesToBook = getDatesInRange(checkin_date, checkout_date);

    let basePricePerNight = accommodation.price_per_night;
    let currency = accommodation.currency;
    let minimumNights = accommodation.minimum_nights;
    let maxCapacity = accommodation.capacity;
    let roomName: string | null = null;
    let validatedRoomId: string | null = null;

    // 3. If room_id provided, validate room and use room pricing
    if (room_id) {
      const { data: room, error: roomError } = await supabase
        .from('accommodation_rooms')
        .select('id, name, price_per_night, currency, minimum_nights, capacity, quantity')
        .eq('id', room_id)
        .eq('accommodation_id', accommodation_id)
        .eq('status', 'active')
        .single();

      if (roomError || !room) {
        return new Response(
          JSON.stringify({ error: 'Room type not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      basePricePerNight = room.price_per_night;
      currency = room.currency;
      minimumNights = room.minimum_nights;
      maxCapacity = room.capacity;
      roomName = room.name;
      validatedRoomId = room.id;

      // Check accommodation-level blocks
      const { data: accBlocks } = await supabase
        .from('accommodation_calendar')
        .select('date')
        .eq('accommodation_id', accommodation_id)
        .is('room_id', null)
        .in('date', datesToBook)
        .in('status', ['blocked', 'booked_external']);

      if (accBlocks && accBlocks.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Some dates are blocked at property level',
            blocked_dates: accBlocks.map((d: any) => d.date),
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check room stock availability
      const { data: overlapping } = await supabase
        .from('accommodation_bookings')
        .select('checkin_date, checkout_date')
        .eq('room_id', room_id)
        .eq('status', 'confirmed')
        .lt('checkin_date', checkout_date)
        .gte('checkout_date', checkin_date);

      for (const date of datesToBook) {
        const count = (overlapping || []).filter((b: any) =>
          b.checkin_date <= date && b.checkout_date > date
        ).length;
        if (count >= (room as any).quantity) {
          return new Response(
            JSON.stringify({ error: `No rooms available on ${date}` }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else {
      // Villa booking: check calendar availability
      const { data: blockedDates } = await supabase
        .from('accommodation_calendar')
        .select('date')
        .eq('accommodation_id', accommodation_id)
        .neq('status', 'available')
        .in('date', datesToBook);

      if (blockedDates && blockedDates.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Some dates are not available',
            blocked_dates: blockedDates.map((d: any) => d.date),
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate minimum nights
    if (nights < minimumNights) {
      return new Response(
        JSON.stringify({ error: `Minimum stay is ${minimumNights} nights` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate guests
    if (guestsCount > maxCapacity) {
      return new Response(
        JSON.stringify({ error: `Maximum capacity is ${maxCapacity} guests` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Fetch price tiers and calculate effective price
    let tierQuery = supabase
      .from('accommodation_price_tiers')
      .select('min_nights, price_per_night')
      .eq('accommodation_id', accommodation_id)
      .eq('status', 'active')
      .order('min_nights');

    if (validatedRoomId) {
      tierQuery = tierQuery.eq('room_id', validatedRoomId);
    } else {
      tierQuery = tierQuery.is('room_id', null);
    }

    const { data: tiers } = await tierQuery;
    const effectivePricePerNight = getEffectivePrice(tiers || [], nights, basePricePerNight);
    let baseTotal = effectivePricePerNight * nights;

    let discountAmount = 0;
    let appliedDiscountId: string | null = null;

    // 5. Apply promo code if provided
    if (promo_code) {
      const { data: discount } = await supabase
        .from('accommodation_discounts')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('code', promo_code.toUpperCase())
        .eq('type', 'promo_code')
        .eq('status', 'active')
        .maybeSingle();

      if (discount) {
        // Validate usage limit
        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
          return new Response(
            JSON.stringify({ error: 'Promo code usage limit reached' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const today = new Date().toISOString().split('T')[0];
        if (discount.book_start_date && today < discount.book_start_date) {
          return new Response(
            JSON.stringify({ error: 'Promo code is not yet valid' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.book_end_date && today > discount.book_end_date) {
          return new Response(
            JSON.stringify({ error: 'Promo code has expired' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.checkin_start_date && checkin_date < discount.checkin_start_date) {
          return new Response(
            JSON.stringify({ error: 'Promo code not valid for this check-in date' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.checkin_end_date && checkin_date > discount.checkin_end_date) {
          return new Response(
            JSON.stringify({ error: 'Promo code not valid for this check-in date' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.minimum_spend && baseTotal < discount.minimum_spend) {
          return new Response(
            JSON.stringify({ error: `Minimum spend of ${discount.minimum_spend} required` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.min_nights && nights < discount.min_nights) {
          return new Response(
            JSON.stringify({ error: `Minimum ${discount.min_nights} nights required for this promo` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (discount.applicable_accommodation_ids && discount.applicable_accommodation_ids.length > 0) {
          if (!discount.applicable_accommodation_ids.includes(accommodation_id)) {
            return new Response(
              JSON.stringify({ error: 'Promo code not valid for this accommodation' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        discountAmount = calculateDiscount(discount, baseTotal, nights, effectivePricePerNight, checkin_date);
        appliedDiscountId = discount.id;
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid promo code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Apply automatic discounts (only if no promo code applied)
    if (!appliedDiscountId) {
      const { data: autoDiscounts } = await supabase
        .from('accommodation_discounts')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('type', 'automatic')
        .eq('status', 'active');

      if (autoDiscounts) {
        for (const discount of autoDiscounts) {
          if (isAutoDiscountApplicable(discount, baseTotal, nights, checkin_date, accommodation_id)) {
            const amount = calculateDiscount(discount, baseTotal, nights, effectivePricePerNight, checkin_date);
            if (amount > discountAmount) {
              discountAmount = amount;
              appliedDiscountId = discount.id;
            }
          }
        }
      }
    }

    const totalAmount = Math.max(0, baseTotal - discountAmount);

    // 7. Create booking
    const bookingData: any = {
      accommodation_id,
      partner_id: partnerId,
      guest_name: customer.name,
      guest_email: customer.email || null,
      guest_phone: customer.phone || null,
      checkin_date,
      checkout_date,
      guests_count: guestsCount,
      total_nights: nights,
      total_amount: totalAmount,
      currency,
      status: 'confirmed',
      channel: 'online_widget',
    };
    if (validatedRoomId) {
      bookingData.room_id = validatedRoomId;
    }

    const { data: booking, error: bookingError } = await supabase
      .from('accommodation_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Block dates in calendar (only for villa bookings, not room bookings)
    if (!validatedRoomId) {
      const calendarEntries = datesToBook.map((date) => ({
        accommodation_id,
        partner_id: partnerId,
        date,
        status: 'booked_sribooking',
        booking_id: booking.id,
        source: 'sribooking',
      }));

      const { error: calendarError } = await supabase
        .from('accommodation_calendar')
        .upsert(calendarEntries, { onConflict: 'accommodation_id,date' });

      if (calendarError) {
        console.error('Calendar blocking error:', calendarError);
      }
    }

    // 9. Create commission record
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('accommodation_commission_rate')
      .single();

    const commissionRate = adminSettings?.accommodation_commission_rate || 10;
    const platformFee = totalAmount * (commissionRate / 100);
    const partnerNet = totalAmount - platformFee;

    await supabase.from('accommodation_commission_records').insert({
      booking_id: booking.id,
      partner_id: partnerId,
      gross_amount: totalAmount,
      platform_fee_percent: commissionRate,
      platform_fee_amount: platformFee,
      partner_net_amount: partnerNet,
      currency,
    });

    // 10. Send booking confirmation notification
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    fetch(`${supabaseUrl}/functions/v1/send-accommodation-booking-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ booking_id: booking.id }),
    }).catch((err) => console.error('Notification send error:', err));

    // 11. Record discount usage
    if (appliedDiscountId && discountAmount > 0) {
      await supabase.from('accommodation_discount_usage').insert({
        discount_id: appliedDiscountId,
        booking_id: booking.id,
        partner_id: partnerId,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        discounted_amount: discountAmount,
      });

      await supabase.rpc('increment_accommodation_discount_usage', {
        p_discount_id: appliedDiscountId,
        p_amount: discountAmount,
      }).then(null, (err: any) => {
        console.warn('RPC increment failed, using manual update:', err);
        supabase
          .from('accommodation_discounts')
          .update({
            usage_count: (body._current_usage_count || 0) + 1,
            total_discounted_amount: (body._current_total_discounted || 0) + discountAmount,
          })
          .eq('id', appliedDiscountId)
          .then(null, (e: any) => console.error('Manual discount update error:', e));
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          accommodation_name: accommodation.name,
          room_name: roomName,
          checkin_date: booking.checkin_date,
          checkout_date: booking.checkout_date,
          total_nights: nights,
          guests_count: guestsCount,
          base_price_per_night: basePricePerNight,
          effective_price_per_night: effectivePricePerNight,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          currency,
          status: 'confirmed',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Create accommodation booking error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDiscount(
  discount: any,
  baseTotal: number,
  nights: number,
  pricePerNight: number,
  checkinDate: string
): number {
  const category = discount.category;
  const value = discount.discount_value;
  const valueType = discount.discount_value_type;

  switch (category) {
    case 'booking_fixed':
      return Math.min(value, baseTotal);
    case 'booking_percent':
      return baseTotal * (value / 100);
    case 'per_night_fixed':
      return Math.min(value * nights, baseTotal);
    case 'per_night_percent':
      return pricePerNight * (value / 100) * nights;
    case 'early_bird': {
      const daysUntilCheckin = Math.floor(
        (new Date(checkinDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilCheckin >= (discount.early_bird_days || 30)) {
        return valueType === 'percentage'
          ? baseTotal * (value / 100)
          : Math.min(value, baseTotal);
      }
      return 0;
    }
    case 'last_minute': {
      const daysUntil = Math.floor(
        (new Date(checkinDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= (discount.last_minute_days || 3)) {
        return valueType === 'percentage'
          ? baseTotal * (value / 100)
          : Math.min(value, baseTotal);
      }
      return 0;
    }
    case 'long_stay':
      if (nights >= (discount.min_nights || 7)) {
        return valueType === 'percentage'
          ? baseTotal * (value / 100)
          : Math.min(value, baseTotal);
      }
      return 0;
    default:
      return valueType === 'percentage'
        ? baseTotal * (value / 100)
        : Math.min(value, baseTotal);
  }
}

function isAutoDiscountApplicable(
  discount: any,
  baseTotal: number,
  nights: number,
  checkinDate: string,
  accommodationId: string
): boolean {
  const today = new Date().toISOString().split('T')[0];

  if (discount.book_start_date && today < discount.book_start_date) return false;
  if (discount.book_end_date && today > discount.book_end_date) return false;
  if (discount.checkin_start_date && checkinDate < discount.checkin_start_date) return false;
  if (discount.checkin_end_date && checkinDate > discount.checkin_end_date) return false;
  if (discount.minimum_spend && baseTotal < discount.minimum_spend) return false;
  if (discount.min_nights && nights < discount.min_nights) return false;
  if (discount.usage_limit && discount.usage_count >= discount.usage_limit) return false;

  if (discount.applicable_accommodation_ids && discount.applicable_accommodation_ids.length > 0) {
    if (!discount.applicable_accommodation_ids.includes(accommodationId)) return false;
  }

  if (discount.category === 'early_bird') {
    const daysUntil = Math.floor(
      (new Date(checkinDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < (discount.early_bird_days || 30)) return false;
  }

  if (discount.category === 'last_minute') {
    const daysUntil = Math.floor(
      (new Date(checkinDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil > (discount.last_minute_days || 3)) return false;
  }

  if (discount.category === 'long_stay') {
    if (nights < (discount.min_nights || 7)) return false;
  }

  return true;
}
