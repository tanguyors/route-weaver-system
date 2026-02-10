import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelectedAddon {
  addon_id?: string | null;
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
  return_departure_id?: string;
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
  payment_method?: 'cash' | 'bank_transfer' | 'xendit' | 'paypal';
  success_redirect_url?: string;
  failure_redirect_url?: string;
}

serve(async (req) => {
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

    // 2b. Validate return departure if provided
    let returnDeparture: any = null;
    if (body.return_departure_id) {
      const { data: retDep, error: retDepError } = await supabase
        .from('departures')
        .select(`
          id, partner_id, trip_id, route_id, departure_date, departure_time,
          capacity_total, capacity_reserved, status,
          trip:trips(id, trip_name, capacity_default)
        `)
        .eq('id', body.return_departure_id)
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (retDepError || !retDep) {
        console.error('Return departure not found:', retDepError);
        return new Response(
          JSON.stringify({ error: 'Return departure not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (retDep.status !== 'open') {
        return new Response(
          JSON.stringify({ error: 'Return departure is not available for booking' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const returnAvailableSeats = retDep.capacity_total - retDep.capacity_reserved;
      if (totalPax > returnAvailableSeats) {
        return new Response(
          JSON.stringify({ error: 'Not enough seats available for return trip', available: returnAvailableSeats }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      returnDeparture = retDep;
      console.log('Return departure validated:', returnDeparture.id);
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

    let outboundSubtotal = (body.pax_adult * adultPrice) + (body.pax_child * childPrice);
    
    // Calculate return trip pricing if applicable
    let returnSubtotal = 0;
    if (returnDeparture) {
      const { data: returnPriceRules } = await supabase
        .from('price_rules')
        .select('*')
        .eq('trip_id', returnDeparture.trip_id)
        .eq('status', 'active')
        .order('rule_type');

      let returnAdultPrice = 0;
      let returnChildPrice = 0;
      const returnDepDate = returnDeparture.departure_date;

      for (const rule of returnPriceRules || []) {
        if (rule.rule_type === 'seasonal' && rule.start_date && rule.end_date) {
          if (returnDepDate >= rule.start_date && returnDepDate <= rule.end_date) {
            returnAdultPrice = rule.adult_price;
            returnChildPrice = rule.child_price || 0;
            break;
          }
        } else if (rule.rule_type === 'base') {
          returnAdultPrice = rule.adult_price;
          returnChildPrice = rule.child_price || 0;
        }
      }

      returnSubtotal = (body.pax_adult * returnAdultPrice) + (body.pax_child * returnChildPrice);
      console.log('Return trip subtotal:', returnSubtotal);
    }

    let ticketSubtotal = outboundSubtotal + returnSubtotal;
    
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
    const newReserved = departure.capacity_reserved + totalPax;
    const newStatus = newReserved >= departure.capacity_total ? 'sold_out' : 'open';

    const { error: lockError } = await supabase
      .from('departures')
      .update({ 
        capacity_reserved: newReserved,
        status: newStatus
      })
      .eq('id', body.departure_id)
      .eq('capacity_reserved', departure.capacity_reserved);

    if (lockError) {
      console.error('Failed to lock capacity:', lockError);
      return new Response(
        JSON.stringify({ error: 'Failed to reserve seats. Please try again.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lock return departure capacity if applicable
    if (returnDeparture) {
      const returnNewReserved = returnDeparture.capacity_reserved + totalPax;
      const returnNewStatus = returnNewReserved >= returnDeparture.capacity_total ? 'sold_out' : 'open';

      const { error: returnLockError } = await supabase
        .from('departures')
        .update({ 
          capacity_reserved: returnNewReserved,
          status: returnNewStatus
        })
        .eq('id', body.return_departure_id)
        .eq('capacity_reserved', returnDeparture.capacity_reserved);

      if (returnLockError) {
        await supabase
          .from('departures')
          .update({ 
            capacity_reserved: departure.capacity_reserved,
            status: departure.status
          })
          .eq('id', body.departure_id);

        console.error('Failed to lock return capacity:', returnLockError);
        return new Response(
          JSON.stringify({ error: 'Failed to reserve seats for return trip. Please try again.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine booking status based on payment method
    const paymentMethod = body.payment_method || 'cash';
    const isOnlinePayment = paymentMethod === 'xendit' || paymentMethod === 'paypal';
    // Use 'pending' for all (the enum only supports: pending, confirmed, cancelled, refunded)
    const bookingStatus = 'pending';

    // 9. Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        partner_id: partnerId,
        departure_id: body.departure_id,
        return_departure_id: body.return_departure_id || null,
        customer_id: customerId,
        channel: 'online_widget',
        pax_adult: body.pax_adult,
        pax_child: body.pax_child,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: bookingStatus,
        currency: 'IDR',
      })
      .select('id')
      .single();

    if (bookingError) {
      // Rollback outbound capacity
      await supabase
        .from('departures')
        .update({ 
          capacity_reserved: departure.capacity_reserved,
          status: departure.status
        })
        .eq('id', body.departure_id);
      
      if (returnDeparture) {
        await supabase
          .from('departures')
          .update({ 
            capacity_reserved: returnDeparture.capacity_reserved,
            status: returnDeparture.status
          })
          .eq('id', body.return_departure_id);
      }
      
      throw bookingError;
    }

    // 10. Create booking_addons records
    if (addons.length > 0) {
      const bookingAddonsData = addons.map(addon => ({
        booking_id: booking.id,
        addon_id: addon.addon_id ?? null,
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
      } else {
        console.log('Created', addons.length, 'booking addon records');
      }
    }

    // For non-online payments: create ticket and commission immediately
    let ticket: any = null;
    if (!isOnlinePayment) {
      // 11. Create ticket with QR token
      const { data: ticketData, error: ticketError } = await supabase
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
      ticket = ticketData;

      // 12. Create commission record
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
    }

    // For online payments: create payment session and return redirect URL
    let paymentRedirectUrl: string | null = null;

    if (paymentMethod === 'xendit') {
      paymentRedirectUrl = await createXenditPayment(
        booking.id,
        totalAmount,
        body.customer,
        body.success_redirect_url || '',
        body.failure_redirect_url || ''
      );
    } else if (paymentMethod === 'paypal') {
      paymentRedirectUrl = await createPayPalPayment(
        booking.id,
        totalAmount,
        body.customer,
        body.success_redirect_url || '',
        body.failure_redirect_url || ''
      );
    }

    console.log('Booking created successfully:', booking.id, 'Payment method:', paymentMethod);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        ticket_id: ticket?.id || null,
        qr_token: ticket?.qr_token || null,
        outbound_subtotal: outboundSubtotal,
        return_subtotal: returnSubtotal,
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
        return_departure: returnDeparture ? {
          date: returnDeparture.departure_date,
          time: returnDeparture.departure_time,
        } : null,
        payment_method: paymentMethod,
        payment_redirect_url: paymentRedirectUrl,
        requires_payment: isOnlinePayment,
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

// ─── Xendit Payment Creation ───
async function createXenditPayment(
  bookingId: string,
  amount: number,
  customer: { full_name: string; email?: string; phone?: string },
  successUrl: string,
  failureUrl: string
): Promise<string | null> {
  const xenditKey = Deno.env.get('XENDIT_SECRET_KEY');
  if (!xenditKey) {
    console.error('XENDIT_SECRET_KEY not configured');
    return null;
  }

  try {
    const payload: any = {
      external_id: bookingId,
      amount,
      currency: 'IDR',
      description: `Booking ${bookingId}`,
      payer_email: customer.email || undefined,
      customer: {
        given_names: customer.full_name,
        email: customer.email || undefined,
        mobile_number: customer.phone || undefined,
      },
      customer_notification_preference: {
        invoice_created: customer.email ? ['email'] : [],
        invoice_paid: customer.email ? ['email'] : [],
      },
      success_redirect_url: successUrl || undefined,
      failure_redirect_url: failureUrl || undefined,
    };

    console.log('Creating Xendit invoice:', JSON.stringify(payload));

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditKey + ':')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Xendit returned non-JSON:', textResponse.substring(0, 500));
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('Xendit API error:', JSON.stringify(data));
      return null;
    }

    console.log('Xendit invoice created:', data.id, 'URL:', data.invoice_url);
    return data.invoice_url;
  } catch (error) {
    console.error('Xendit payment creation failed:', error);
    return null;
  }
}

// ─── PayPal Payment Creation ───
async function createPayPalPayment(
  bookingId: string,
  amountIDR: number,
  customer: { full_name: string; email?: string },
  successUrl: string,
  failureUrl: string
): Promise<string | null> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('PayPal credentials not configured');
    return null;
  }

  try {
    // 1. Get access token
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('PayPal token error:', JSON.stringify(tokenData));
      return null;
    }

    const accessToken = tokenData.access_token;

    // Convert IDR to USD (approximate - PayPal doesn't support IDR well)
    // Using a rough conversion, partners should configure proper rates
    const amountUSD = Math.max(1, Math.round((amountIDR / 15500) * 100) / 100);

    // 2. Create order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: bookingId,
        custom_id: bookingId,
        description: `Booking ${bookingId}`,
        amount: {
          currency_code: 'USD',
          value: amountUSD.toFixed(2),
        },
      }],
      application_context: {
        return_url: successUrl || 'https://sribooking.com',
        cancel_url: failureUrl || 'https://sribooking.com',
        brand_name: 'SriBooking',
        user_action: 'PAY_NOW',
      },
    };

    console.log('Creating PayPal order:', JSON.stringify(orderPayload));

    const orderResponse = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal order creation error:', JSON.stringify(orderData));
      return null;
    }

    const approveLink = orderData.links?.find((l: any) => l.rel === 'approve');
    if (approveLink) {
      console.log('PayPal order created:', orderData.id, 'Approve URL:', approveLink.href);
      return approveLink.href;
    }

    console.error('No approve link in PayPal response');
    return null;
  } catch (error) {
    console.error('PayPal payment creation failed:', error);
    return null;
  }
}
