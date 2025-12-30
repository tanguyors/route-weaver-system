import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qr_token, user_id, partner_id } = await req.json();

    if (!qr_token || !user_id || !partner_id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required fields',
        reason: 'invalid',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the ticket by QR token
    const { data: ticket, error: ticketError } = await supabase
      .from('activity_tickets')
      .select(`
        id,
        booking_id,
        partner_id,
        product_id,
        status,
        used_at,
        expires_at,
        participant_index,
        booking:activity_bookings(
          id,
          booking_date,
          slot_time,
          status,
          customer,
          total_qty,
          product:activity_products(
            id,
            name
          )
        )
      `)
      .eq('qr_token', qr_token)
      .single();

    if (ticketError || !ticket) {
      // Log the invalid scan
      await supabase.from('activity_checkin_events').insert({
        ticket_id: null,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'invalid',
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Ticket not found',
        reason: 'invalid',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if ticket belongs to this partner
    if (ticket.partner_id !== partner_id) {
      await supabase.from('activity_checkin_events').insert({
        ticket_id: ticket.id,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'invalid',
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Ticket does not belong to this partner',
        reason: 'invalid',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check ticket status
    if (ticket.status === 'used') {
      await supabase.from('activity_checkin_events').insert({
        ticket_id: ticket.id,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'already_used',
      });

      const bookingData = Array.isArray(ticket.booking) ? ticket.booking[0] : ticket.booking;
      const productData = bookingData?.product as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
      const productName = Array.isArray(productData) ? productData[0]?.name : productData?.name;
      const customerData = bookingData?.customer as { name?: string } | null;

      return new Response(JSON.stringify({
        success: false,
        message: 'Ticket has already been used',
        reason: 'already_used',
        ticket: {
          used_at: ticket.used_at,
          product_name: productName,
          customer_name: customerData?.name,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ticket.status === 'cancelled') {
      await supabase.from('activity_checkin_events').insert({
        ticket_id: ticket.id,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'cancelled',
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Ticket has been cancelled',
        reason: 'cancelled',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ticket.status === 'expired' || (ticket.expires_at && new Date(ticket.expires_at) < new Date())) {
      await supabase.from('activity_checkin_events').insert({
        ticket_id: ticket.id,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'expired',
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Ticket has expired',
        reason: 'expired',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract booking data (handle array from Supabase join)
    const bookingData = Array.isArray(ticket.booking) ? ticket.booking[0] : ticket.booking;
    const productData = bookingData?.product as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    const productInfo = Array.isArray(productData) ? productData[0] : productData;
    const customerData = bookingData?.customer as { name?: string } | null;

    if (!bookingData || bookingData.status !== 'confirmed') {
      await supabase.from('activity_checkin_events').insert({
        ticket_id: ticket.id,
        partner_id,
        scanned_by_user_id: user_id,
        result: 'cancelled',
      });

      return new Response(JSON.stringify({
        success: false,
        message: `Booking is ${bookingData?.status || 'not found'}`,
        reason: 'cancelled',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Success - Mark ticket as used
    const { error: updateError } = await supabase
      .from('activity_tickets')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', ticket.id);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    // Log successful check-in
    await supabase.from('activity_checkin_events').insert({
      ticket_id: ticket.id,
      partner_id,
      scanned_by_user_id: user_id,
      result: 'success',
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Check-in successful',
      reason: 'success',
      ticket: {
        id: ticket.id,
        participant_index: ticket.participant_index,
        product_name: productInfo?.name,
        customer_name: customerData?.name,
        booking_date: bookingData.booking_date,
        slot_time: bookingData.slot_time,
        total_qty: bookingData.total_qty,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error validating activity ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      message: errorMessage,
      reason: 'invalid',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
