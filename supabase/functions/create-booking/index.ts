import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelectedAddon {
  addon_id: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  pickup_zone_id?: string;
  pickup_zone_name?: string;
  pickup_info?: {
    hotel_name?: string;
    address?: string;
    pickup_note?: string;
  };
}

interface BookingRequest {
  widget_key: string;
  departure_id: string;
  customer: {
    full_name: string;
    phone?: string;
    email?: string;
    country?: string;
  };
  pax_adult: number;
  pax_child: number;
  promo_code?: string;
  addons?: SelectedAddon[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: BookingRequest = await req.json();
    console.log('Booking request received:', JSON.stringify(body));

    // 1. Validate widget key
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('id, partner_id, status, allowed_domains')
      .eq('public_widget_key', body.widget_key)
      .eq('status', 'active')
      .maybeSingle();

    if (widgetError || !widget) {
      console.error('Widget validation failed:', widgetError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive widget' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerId = widget.partner_id;
    console.log('Widget validated for partner:', partnerId);

    // 2. Validate departure and check capacity
    const { data: departure, error: depError } = await supabase
      .from('departures')
      .select(`
        id, partner_id, trip_id, route_id, departure_date, departure_time,
        capacity_total, capacity_reserved, status,
        trip:trips(id, trip_name, capacity_default)
      `)
      .eq('id', body.departure_id)
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (depError || !departure) {
      console.error('Departure not found:', depError);
      return new Response(
        JSON.stringify({ error: 'Departure not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (departure.status !== 'open') {
      return new Response(
        JSON.stringify({ error: 'Departure is not available for booking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalPax = body.pax_adult + body.pax_child;
    const availableSeats = departure.capacity_total - departure.capacity_reserved;

    if (totalPax > availableSeats) {
      return new Response(
        JSON.stringify({ error: 'Not enough seats available', available: availableSeats }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get pricing
    const { data: priceRules } = await supabase
      .from('price_rules')
      .select('*')
      .eq('trip_id', departure.trip_id)
      .eq('status', 'active')
      .order('rule_type');

    let adultPrice = 0;
    let childPrice = 0;
    const today = new Date().toISOString().split('T')[0];
    const depDate = departure.departure_date;

    // Find applicable price rule
    for (const rule of priceRules || []) {
      if (rule.rule_type === 'seasonal' && rule.start_date && rule.end_date) {
        if (depDate >= rule.start_date && depDate <= rule.end_date) {
          adultPrice = rule.adult_price;
          childPrice = rule.child_price || 0;
          break;
        }
      } else if (rule.rule_type === 'base') {
        adultPrice = rule.adult_price;
        childPrice = rule.child_price || 0;
      }
    }

    let ticketSubtotal = (body.pax_adult * adultPrice) + (body.pax_child * childPrice);
    
    // 4. Calculate add-ons total
    const addons = body.addons || [];
    let addonsTotal = 0;
    for (const addon of addons) {
      addonsTotal += addon.total;
    }
    console.log('Add-ons total:', addonsTotal, 'from', addons.length, 'add-ons');

    let subtotal = ticketSubtotal + addonsTotal;
    let discountAmount = 0;

    // 5. Apply promo code if provided
    if (body.promo_code) {
      const { data: discount } = await supabase
        .from('discount_rules')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('code', body.promo_code.toUpperCase())
        .eq('type', 'promo_code')
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .maybeSingle();

      if (discount) {
        const minPax = discount.min_pax || 1;
        if (totalPax >= minPax) {
          if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
            console.log('Promo code usage limit reached');
          } else {
            if (discount.discount_value_type === 'percent') {
              discountAmount = subtotal * (discount.discount_value / 100);
            } else {
              discountAmount = discount.discount_value;
            }
            
            // Increment usage count
            await supabase
              .from('discount_rules')
              .update({ usage_count: discount.usage_count + 1 })
              .eq('id', discount.id);
          }
        }
      }
    }

    // 6. Check for automatic discounts
    const { data: autoDiscounts } = await supabase
      .from('discount_rules')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('type', 'automatic')
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today);

    for (const discount of autoDiscounts || []) {
      const minPax = discount.min_pax || 1;
      if (totalPax >= minPax) {
        let autoDiscount = 0;
        if (discount.discount_value_type === 'percent') {
          autoDiscount = subtotal * (discount.discount_value / 100);
        } else {
          autoDiscount = discount.discount_value;
        }
        discountAmount = Math.max(discountAmount, autoDiscount);
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // 7. Create or find customer
    let customerId: string;
    
    if (body.customer.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', body.customer.email)
        .maybeSingle();
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert({
            full_name: body.customer.full_name,
            phone: body.customer.phone || null,
            email: body.customer.email || null,
            country: body.customer.country || null,
          })
          .select('id')
          .single();
        
        if (custError) throw custError;
        customerId = newCustomer.id;
      }
    } else {
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          full_name: body.customer.full_name,
          phone: body.customer.phone || null,
          email: body.customer.email || null,
          country: body.customer.country || null,
        })
        .select('id')
        .single();
      
      if (custError) throw custError;
      customerId = newCustomer.id;
    }

    // 8. ATOMIC: Lock capacity and create booking
    // First, lock the departure row
    const newReserved = departure.capacity_reserved + totalPax;
    const newStatus = newReserved >= departure.capacity_total ? 'sold_out' : 'open';

    const { error: lockError } = await supabase
      .from('departures')
      .update({ 
        capacity_reserved: newReserved,
        status: newStatus
      })
      .eq('id', body.departure_id)
      .eq('capacity_reserved', departure.capacity_reserved); // Optimistic lock

    if (lockError) {
      console.error('Failed to lock capacity:', lockError);
      return new Response(
        JSON.stringify({ error: 'Failed to reserve seats. Please try again.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        partner_id: partnerId,
        departure_id: body.departure_id,
        customer_id: customerId,
        channel: 'online_widget',
        pax_adult: body.pax_adult,
        pax_child: body.pax_child,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'pending',
        currency: 'IDR',
      })
      .select('id')
      .single();

    if (bookingError) {
      // Rollback capacity
      await supabase
        .from('departures')
        .update({ 
          capacity_reserved: departure.capacity_reserved,
          status: departure.status
        })
        .eq('id', body.departure_id);
      
      throw bookingError;
    }

    // 10. Create booking_addons records
    if (addons.length > 0) {
      const bookingAddonsData = addons.map(addon => ({
        booking_id: booking.id,
        addon_id: addon.addon_id,
        name: addon.name,
        price: addon.price,
        qty: addon.qty,
        total: addon.total,
        pickup_zone_id: addon.pickup_zone_id || null,
        pickup_info: addon.pickup_info || null,
      }));

      const { error: addonsError } = await supabase
        .from('booking_addons')
        .insert(bookingAddonsData);

      if (addonsError) {
        console.error('Failed to create booking addons:', addonsError);
        // Don't fail the booking, just log the error
      } else {
        console.log('Created', addons.length, 'booking addon records');
      }
    }

    // 11. Create ticket with QR token
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        booking_id: booking.id,
        status: 'pending',
      })
      .select('id, qr_token')
      .single();

    if (ticketError) {
      console.error('Ticket creation failed:', ticketError);
    }

    // 12. Get partner's commission rate and create commission record
    const { data: partner } = await supabase
      .from('partners')
      .select('commission_percent')
      .eq('id', partnerId)
      .single();

    const platformFeePercent = partner?.commission_percent || 7;
    const platformFeeAmount = totalAmount * (platformFeePercent / 100);
    const partnerNetAmount = totalAmount - platformFeeAmount;

    await supabase.from('commission_records').insert({
      booking_id: booking.id,
      partner_id: partnerId,
      gross_amount: totalAmount,
      platform_fee_percent: platformFeePercent,
      platform_fee_amount: platformFeeAmount,
      partner_net_amount: partnerNetAmount,
      currency: 'IDR',
    });

    console.log('Booking created successfully:', booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        ticket_id: ticket?.id,
        qr_token: ticket?.qr_token,
        subtotal_amount: ticketSubtotal,
        addons_amount: addonsTotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency: 'IDR',
        addons: addons,
        departure: {
          date: departure.departure_date,
          time: departure.departure_time,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
