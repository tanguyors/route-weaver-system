import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, client-id, request-id, request-timestamp, signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[v${VERSION}] DOKU webhook received`);

  try {
    const body = await req.json();
    console.log(`[v${VERSION}] DOKU notification:`, JSON.stringify(body).substring(0, 500));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // DOKU sends transaction status in different formats
    const invoiceNumber = body.order?.invoice_number || body.invoice_number;
    const transactionStatus = body.transaction?.status || body.status;
    const amount = body.order?.amount || body.amount;
    const currency = body.order?.currency || 'IDR';

    if (!invoiceNumber) {
      console.log("No invoice_number in DOKU webhook payload, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "No invoice_number, skipped", _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract booking ID from invoice_number (format: booking-{uuid})
    const bookingId = invoiceNumber.replace('booking-', '');
    console.log(`DOKU notification for booking: ${bookingId}, status: ${transactionStatus}`);

    if (transactionStatus === 'SUCCESS' || transactionStatus === 'PAID') {
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, partner_id, total_amount, currency")
        .eq("id", bookingId)
        .maybeSingle();

      if (booking) {
        await supabase.from("payments").insert({
          partner_id: booking.partner_id,
          booking_id: booking.id,
          amount: amount || booking.total_amount,
          currency: currency,
          method: body.channel?.id || "doku",
          provider: "doku",
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_reference: body.transaction?.id || invoiceNumber,
        });

        await handleBookingPayment(supabase, booking.id, booking.partner_id, amount || booking.total_amount, currency);
        console.log(`DOKU payment recorded for booking ${booking.id}`);
      } else {
        console.log(`No booking found for ID: ${bookingId}`);
      }
    } else if (transactionStatus === 'FAILED' || transactionStatus === 'EXPIRED') {
      console.log(`DOKU payment ${transactionStatus} for booking: ${bookingId}`);
    } else {
      console.log(`Unhandled DOKU transaction status: ${transactionStatus}`);
    }

    return new Response(
      JSON.stringify({ success: true, _version: VERSION }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[v${VERSION}] Error processing DOKU webhook:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error", _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleBookingPayment(supabase: any, bookingId: string, partnerId: string, amount: number, currency: string) {
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("booking_id", bookingId)
    .eq("status", "paid");

  const { data: booking } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("id", bookingId)
    .single();

  if (booking && payments) {
    const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    if (totalPaid >= booking.total_amount) {
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!existingTicket) {
        await supabase.from("tickets").insert({ booking_id: bookingId, status: "pending" });
      }

      const { data: existingCommission } = await supabase
        .from("commission_records")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!existingCommission) {
        const { data: partner } = await supabase
          .from("partners")
          .select("commission_percent")
          .eq("id", partnerId)
          .single();

        const feePercent = partner?.commission_percent || 7;
        const feeAmount = (booking.total_amount * feePercent) / 100;

        await supabase.from("commission_records").insert({
          partner_id: partnerId,
          booking_id: bookingId,
          gross_amount: booking.total_amount,
          platform_fee_percent: feePercent,
          platform_fee_amount: feeAmount,
          partner_net_amount: booking.total_amount - feeAmount,
          currency,
        });
      }

      console.log(`Booking ${bookingId} confirmed after full payment`);
    }
  }
}
