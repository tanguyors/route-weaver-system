import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token, webhook-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[v${VERSION}] Xendit webhook received`);

  try {
    // Verify callback token
    const callbackToken = req.headers.get("x-callback-token");
    const expectedToken = Deno.env.get("XENDIT_CALLBACK_TOKEN");

    if (expectedToken && callbackToken !== expectedToken) {
      console.error("Invalid callback token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const event = body.event;
    const data = body.data;

    console.log(`[v${VERSION}] Event: ${event}, Payment ID: ${data?.id}, Status: ${data?.status}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract reference_id which should contain our booking ID or payment link token
    const referenceId = data?.reference_id;

    if (!referenceId) {
      console.log("No reference_id in webhook payload, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "No reference_id, skipped", _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (event === "payment.succeeded") {
      console.log(`Payment succeeded for reference: ${referenceId}, amount: ${data.amount} ${data.currency}`);

      // Try to find a payment link with this reference
      const { data: paymentLink } = await supabase
        .from("payment_links")
        .select("*")
        .eq("provider_reference", referenceId)
        .maybeSingle();

      if (paymentLink) {
        // Update payment link status
        await supabase
          .from("payment_links")
          .update({ status: "paid" })
          .eq("id", paymentLink.id);

        // Create payment record
        await supabase.from("payments").insert({
          partner_id: paymentLink.partner_id,
          booking_id: paymentLink.booking_id,
          amount: data.amount,
          currency: data.currency || paymentLink.currency,
          method: data.payment_method?.type?.toLowerCase() || "xendit",
          provider: "xendit",
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_reference: data.id,
        });

        // If linked to booking, update booking status
        if (paymentLink.booking_id) {
          await handleBookingPayment(supabase, paymentLink.booking_id, paymentLink.partner_id, data.amount, paymentLink.currency);
        }

        console.log(`Payment link ${paymentLink.id} marked as paid`);
      } else {
        // Try reference_id as booking_id directly
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, partner_id, total_amount, currency")
          .eq("id", referenceId)
          .maybeSingle();

        if (booking) {
          await supabase.from("payments").insert({
            partner_id: booking.partner_id,
            booking_id: booking.id,
            amount: data.amount,
            currency: data.currency || booking.currency,
            method: data.payment_method?.type?.toLowerCase() || "xendit",
            provider: "xendit",
            status: "paid",
            paid_at: new Date().toISOString(),
            provider_reference: data.id,
          });

          await handleBookingPayment(supabase, booking.id, booking.partner_id, data.amount, booking.currency);
          console.log(`Booking ${booking.id} payment recorded`);
        } else {
          console.log(`No matching payment link or booking found for reference: ${referenceId}`);
        }
      }
    } else if (event === "payment.failed") {
      console.log(`Payment failed for reference: ${referenceId}, failure_code: ${data.failure_code}`);

      // Update payment link if exists
      const { data: paymentLink } = await supabase
        .from("payment_links")
        .select("id")
        .eq("provider_reference", referenceId)
        .maybeSingle();

      if (paymentLink) {
        await supabase
          .from("payment_links")
          .update({ status: "failed" })
          .eq("id", paymentLink.id);

        console.log(`Payment link ${paymentLink.id} marked as failed`);
      }
    } else {
      console.log(`Unhandled event type: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true, _version: VERSION }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[v${VERSION}] Error processing webhook:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error", _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleBookingPayment(supabase: any, bookingId: string, partnerId: string, amount: number, currency: string) {
  // Check total payments
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

      // Generate ticket if not exists
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!existingTicket) {
        await supabase.from("tickets").insert({ booking_id: bookingId, status: "pending" });
      }

      // Create commission record
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
