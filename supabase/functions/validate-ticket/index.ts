import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateRequest {
  qr_token: string;
  user_id: string;
  partner_id: string;
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

    const { qr_token, user_id, partner_id }: ValidateRequest = await req.json();

    console.log("Validating QR token:", qr_token);

    if (!qr_token || !user_id || !partner_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields", reason: "invalid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find ticket by QR token
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        id,
        status,
        validated_at,
        booking:bookings(
          id,
          pax_adult,
          pax_child,
          partner_id,
          status,
          customer:customers(full_name, email, phone),
          departure:departures(
            id,
            departure_date,
            departure_time,
            partner_id,
            trip:trips(trip_name),
            route:routes(
              origin:ports!routes_origin_port_id_fkey(name),
              destination:ports!routes_destination_port_id_fkey(name)
            )
          )
        )
      `)
      .eq("qr_token", qr_token)
      .maybeSingle();

    if (ticketError) {
      console.error("Error fetching ticket:", ticketError);
      throw ticketError;
    }

    // Ticket not found
    if (!ticket) {
      console.log("Ticket not found for token:", qr_token);
      
      // Log failed attempt
      await supabase.from("checkin_events").insert({
        ticket_id: null,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: "invalid",
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid QR code - ticket not found",
          reason: "invalid",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const booking = ticket.booking as any;

    // Verify partner ownership
    if (booking?.partner_id !== partner_id) {
      console.log("Partner mismatch:", booking?.partner_id, "vs", partner_id);
      
      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: "invalid",
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "This ticket belongs to a different operator",
          reason: "invalid",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ticket status
    const ticketStatus = ticket.status;
    let reason: string | null = null;
    let message = "";

    switch (ticketStatus) {
      case "validated":
        reason = "already_used";
        message = `Ticket already used at ${new Date(ticket.validated_at).toLocaleString()}`;
        break;
      case "cancelled":
        reason = "cancelled";
        message = "This ticket has been cancelled";
        break;
      case "refunded":
        reason = "refunded";
        message = "This ticket has been refunded";
        break;
      case "expired":
        reason = "expired";
        message = "This ticket has expired";
        break;
      case "pending":
        // Valid - proceed with validation
        break;
      default:
        reason = "invalid";
        message = "Unknown ticket status";
    }

    // If invalid, log and return
    if (reason) {
      console.log("Invalid ticket status:", ticketStatus);

      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: reason === "already_used" ? "already_used" : "invalid",
      });

      return new Response(
        JSON.stringify({
          success: false,
          message,
          reason,
          ticket: { id: ticket.id, booking },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if departure is today (optional warning)
    const today = new Date().toISOString().split("T")[0];
    const departureDate = booking?.departure?.departure_date;
    
    if (departureDate && departureDate !== today) {
      console.log("Warning: Ticket is for different date:", departureDate, "vs today:", today);
      // We still allow validation but include a warning
    }

    // Valid ticket - update status
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "validated",
        validated_at: new Date().toISOString(),
        validated_by_user_id: user_id,
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      throw updateError;
    }

    // Log successful check-in
    await supabase.from("checkin_events").insert({
      ticket_id: ticket.id,
      partner_id: partner_id,
      scanned_by_user_id: user_id,
      result: "success",
    });

    console.log("Ticket validated successfully:", ticket.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ticket validated successfully",
        ticket: { id: ticket.id, booking },
        warning: departureDate !== today ? `Note: This ticket is for ${departureDate}, not today.` : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in validate-ticket function:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Internal server error", reason: "invalid" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
