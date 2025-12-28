import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessPaymentRequest {
  payment_link_token: string;
  payment_method?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const token = pathParts[pathParts.length - 1];

    // GET request - fetch payment link details
    if (req.method === "GET" && token && token !== "process-payment") {
      console.log("Fetching payment link for token:", token);

      // Find payment link by URL containing the token
      const { data: paymentLinks, error: linkError } = await supabase
        .from("payment_links")
        .select(`
          *,
          booking:bookings(
            id,
            pax_adult,
            pax_child,
            total_amount,
            customer:customers(full_name, email, phone),
            departure:departures(
              departure_date,
              departure_time,
              trip:trips(trip_name),
              route:routes(
                origin:ports!routes_origin_port_id_fkey(name),
                destination:ports!routes_destination_port_id_fkey(name)
              )
            )
          ),
          partner:partners(name, logo_url)
        `)
        .like("url", `%${token}%`)
        .single();

      if (linkError || !paymentLinks) {
        console.error("Payment link not found:", linkError);
        return new Response(
          JSON.stringify({ error: "Payment link not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if expired
      if (paymentLinks.expires_at && new Date(paymentLinks.expires_at) < new Date()) {
        // Update status to expired
        await supabase
          .from("payment_links")
          .update({ status: "expired" })
          .eq("id", paymentLinks.id);

        return new Response(
          JSON.stringify({ error: "Payment link has expired" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check status
      if (paymentLinks.status !== "active") {
        return new Response(
          JSON.stringify({ error: `Payment link is ${paymentLinks.status}` }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: paymentLinks }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST request - process payment (simulate for now)
    if (req.method === "POST") {
      const body: ProcessPaymentRequest = await req.json();
      const { payment_link_token, payment_method } = body;

      console.log("Processing payment for token:", payment_link_token);

      // Find payment link
      const { data: paymentLink, error: linkError } = await supabase
        .from("payment_links")
        .select("*")
        .like("url", `%${payment_link_token}%`)
        .single();

      if (linkError || !paymentLink) {
        return new Response(
          JSON.stringify({ error: "Payment link not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate status
      if (paymentLink.status !== "active") {
        return new Response(
          JSON.stringify({ error: `Payment link is ${paymentLink.status}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
        await supabase
          .from("payment_links")
          .update({ status: "expired" })
          .eq("id", paymentLink.id);

        return new Response(
          JSON.stringify({ error: "Payment link has expired" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // In a real implementation, this would:
      // 1. Create a payment session with Stripe/Xendit/Midtrans
      // 2. Return the payment URL or handle inline payment
      // For now, we'll simulate a successful payment

      // Update payment link status
      await supabase
        .from("payment_links")
        .update({ status: "paid" })
        .eq("id", paymentLink.id);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          partner_id: paymentLink.partner_id,
          booking_id: paymentLink.booking_id,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          method: "payment_link",
          provider: paymentLink.provider,
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_reference: `PL-${paymentLink.id}`,
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
      }

      // If linked to booking, update booking status
      if (paymentLink.booking_id) {
        // Check total payments for this booking
        const { data: bookingPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("booking_id", paymentLink.booking_id)
          .eq("status", "paid");

        const { data: booking } = await supabase
          .from("bookings")
          .select("total_amount")
          .eq("id", paymentLink.booking_id)
          .single();

        if (booking && bookingPayments) {
          const totalPaid = bookingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          
          if (totalPaid >= booking.total_amount) {
            await supabase
              .from("bookings")
              .update({ status: "confirmed" })
              .eq("id", paymentLink.booking_id);

            // Generate ticket if not exists
            const { data: existingTicket } = await supabase
              .from("tickets")
              .select("id")
              .eq("booking_id", paymentLink.booking_id)
              .maybeSingle();

            if (!existingTicket) {
              await supabase
                .from("tickets")
                .insert({
                  booking_id: paymentLink.booking_id,
                  status: "pending",
                });
            }

            // Create commission record if not exists
            const { data: existingCommission } = await supabase
              .from("commission_records")
              .select("id")
              .eq("booking_id", paymentLink.booking_id)
              .maybeSingle();

            if (!existingCommission) {
              const platformFeePercent = 7;
              const platformFeeAmount = (booking.total_amount * platformFeePercent) / 100;
              const partnerNetAmount = booking.total_amount - platformFeeAmount;

              await supabase
                .from("commission_records")
                .insert({
                  partner_id: paymentLink.partner_id,
                  booking_id: paymentLink.booking_id,
                  gross_amount: booking.total_amount,
                  platform_fee_percent: platformFeePercent,
                  platform_fee_amount: platformFeeAmount,
                  partner_net_amount: partnerNetAmount,
                  currency: paymentLink.currency,
                });
            }
          }
        }
      }

      // Log audit
      await supabase.from("audit_logs").insert({
        partner_id: paymentLink.partner_id,
        action: "payment_completed",
        entity_type: "payment_link",
        entity_id: paymentLink.id,
        metadata: {
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          provider: paymentLink.provider,
          booking_id: paymentLink.booking_id,
        },
      });

      console.log("Payment processed successfully");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          payment_id: payment?.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in process-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
