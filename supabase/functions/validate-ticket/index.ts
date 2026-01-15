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

    console.log("Validating QR token:", qr_token, "by partner:", partner_id);

    if (!qr_token || !user_id || !partner_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields", reason: "invalid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find ticket by QR token with booking info (including return departure)
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        id,
        status,
        validated_at,
        outbound_validated_at,
        outbound_validated_by_partner_id,
        return_validated_at,
        return_validated_by_partner_id,
        booking:bookings(
          id,
          pax_adult,
          pax_child,
          partner_id,
          status,
          customer:customers(full_name, email, phone),
          departure:departures!bookings_departure_id_fkey(
            id,
            departure_date,
            departure_time,
            partner_id,
            trip:trips(trip_name),
            route:routes(
              origin:ports!routes_origin_port_id_fkey(name),
              destination:ports!routes_destination_port_id_fkey(name)
            )
          ),
          return_departure:departures!bookings_return_departure_id_fkey(
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

    // Check booking status first - must be confirmed (paid) to allow check-in
    if (booking?.status !== "confirmed") {
      console.log("Booking status is not confirmed:", booking?.status);
      
      let message = "This booking cannot be checked in";
      let reason = "invalid";
      
      if (booking?.status === "cancelled") {
        message = "This booking has been cancelled";
        reason = "cancelled";
      } else if (booking?.status === "pending") {
        message = "Payment required. Please complete payment before check-in.";
        reason = "unpaid";
      } else if (booking?.status === "expired") {
        message = "This booking has expired";
        reason = "expired";
      }
      
      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: reason,
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: message,
          reason: reason,
          ticket: { id: ticket.id, booking },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which leg to validate based on:
    // 1. Which partner is scanning (match departure partner)
    // 2. Which leg hasn't been validated yet
    // 3. Date matching
    
    const outboundDeparture = booking?.departure;
    const returnDeparture = booking?.return_departure;
    const today = new Date().toISOString().split("T")[0];
    
    const outboundPartnerId = outboundDeparture?.partner_id || booking?.partner_id;
    const returnPartnerId = returnDeparture?.partner_id || booking?.partner_id;
    
    const outboundAlreadyValidated = !!ticket.outbound_validated_at;
    const returnAlreadyValidated = !!ticket.return_validated_at;
    
    console.log("Outbound partner:", outboundPartnerId, "validated:", outboundAlreadyValidated);
    console.log("Return partner:", returnPartnerId, "validated:", returnAlreadyValidated);
    console.log("Scanning partner:", partner_id);

    let legToValidate: 'outbound' | 'return' | null = null;
    let legDeparture: any = null;
    let validationError: { message: string; reason: string } | null = null;

    // Logic to determine which leg to validate:
    // Priority 1: Match by partner + not yet validated
    // Priority 2: Match by date (today) + not yet validated
    // Priority 3: Any unvalidated leg

    // Check if scanning partner matches outbound departure partner
    if (partner_id === outboundPartnerId) {
      if (!outboundAlreadyValidated) {
        legToValidate = 'outbound';
        legDeparture = outboundDeparture;
      } else {
        // Partner matches outbound but already validated - check if trying to scan again
        if (!returnAlreadyValidated && returnDeparture) {
          // Maybe they're trying to validate return even though they're outbound partner
          // Only allow if return partner is the same
          if (partner_id === returnPartnerId) {
            legToValidate = 'return';
            legDeparture = returnDeparture;
          } else {
            validationError = {
              message: `Outbound already validated on ${new Date(ticket.outbound_validated_at).toLocaleString()}`,
              reason: "already_used"
            };
          }
        } else if (returnAlreadyValidated) {
          validationError = {
            message: `Both legs already validated. Outbound: ${new Date(ticket.outbound_validated_at).toLocaleString()}, Return: ${new Date(ticket.return_validated_at).toLocaleString()}`,
            reason: "already_used"
          };
        } else {
          validationError = {
            message: `Outbound already validated on ${new Date(ticket.outbound_validated_at).toLocaleString()}`,
            reason: "already_used"
          };
        }
      }
    }
    // Check if scanning partner matches return departure partner
    else if (returnDeparture && partner_id === returnPartnerId) {
      if (!returnAlreadyValidated) {
        legToValidate = 'return';
        legDeparture = returnDeparture;
      } else {
        validationError = {
          message: `Return already validated on ${new Date(ticket.return_validated_at).toLocaleString()}`,
          reason: "already_used"
        };
      }
    }
    // Partner doesn't match any departure - check booking partner (fallback for same-company bookings)
    else if (partner_id === booking?.partner_id) {
      // Same company that created the booking - allow validation
      if (!outboundAlreadyValidated) {
        legToValidate = 'outbound';
        legDeparture = outboundDeparture;
      } else if (returnDeparture && !returnAlreadyValidated) {
        legToValidate = 'return';
        legDeparture = returnDeparture;
      } else if (outboundAlreadyValidated && (!returnDeparture || returnAlreadyValidated)) {
        const messages = [];
        if (outboundAlreadyValidated) {
          messages.push(`Outbound: ${new Date(ticket.outbound_validated_at).toLocaleString()}`);
        }
        if (returnAlreadyValidated) {
          messages.push(`Return: ${new Date(ticket.return_validated_at).toLocaleString()}`);
        }
        validationError = {
          message: `Already validated - ${messages.join(", ")}`,
          reason: "already_used"
        };
      }
    }
    // Partner doesn't match at all
    else {
      console.log("Partner mismatch - scanning partner doesn't own any leg of this ticket");
      validationError = {
        message: "This ticket belongs to a different operator",
        reason: "invalid"
      };
    }

    // Handle validation error
    if (validationError) {
      console.log("Validation error:", validationError);
      
      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: validationError.reason === "already_used" ? "already_used" : "invalid",
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: validationError.message,
          reason: validationError.reason,
          ticket: { id: ticket.id, booking },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!legToValidate) {
      console.log("Could not determine which leg to validate");
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Could not determine which trip leg to validate",
          reason: "invalid",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if departure date is TODAY - only allow check-in on the day of departure
    const departureDate = legDeparture?.departure_date;
    if (departureDate && departureDate !== today) {
      console.log("Check-in date mismatch - departure:", departureDate, "today:", today);
      
      const isBeforeDeparture = departureDate > today;
      const message = isBeforeDeparture 
        ? `Check-in not yet allowed. This ${legToValidate} ticket is for ${departureDate}.`
        : `Check-in expired. This ${legToValidate} ticket was for ${departureDate}.`;
      
      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: "invalid",
        leg_type: legToValidate,
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: message,
          reason: isBeforeDeparture ? "too_early" : "expired",
          ticket: { 
            id: ticket.id, 
            booking,
            departure_date: departureDate,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ticket base status (for cancelled/refunded/expired)
    if (ticket.status === "cancelled" || ticket.status === "refunded" || ticket.status === "expired") {
      console.log("Ticket status invalid:", ticket.status);
      
      await supabase.from("checkin_events").insert({
        ticket_id: ticket.id,
        partner_id: partner_id,
        scanned_by_user_id: user_id,
        result: ticket.status,
        leg_type: legToValidate,
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: `This ticket has been ${ticket.status}`,
          reason: ticket.status,
          ticket: { id: ticket.id, booking },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the leg
    const now = new Date().toISOString();
    const updateData: Record<string, any> = {};
    
    if (legToValidate === 'outbound') {
      updateData.outbound_validated_at = now;
      updateData.outbound_validated_by_user_id = user_id;
      updateData.outbound_validated_by_partner_id = partner_id;
    } else {
      updateData.return_validated_at = now;
      updateData.return_validated_by_user_id = user_id;
      updateData.return_validated_by_partner_id = partner_id;
    }

    // Also update legacy fields if both legs are now validated or if no return
    const willBothBeValidated = (legToValidate === 'outbound' && returnAlreadyValidated) ||
                                 (legToValidate === 'return' && outboundAlreadyValidated) ||
                                 !returnDeparture;
    
    if (willBothBeValidated || !returnDeparture) {
      updateData.status = "validated";
      updateData.validated_at = now;
      updateData.validated_by_user_id = user_id;
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      throw updateError;
    }

    // Log successful check-in with leg type
    await supabase.from("checkin_events").insert({
      ticket_id: ticket.id,
      partner_id: partner_id,
      scanned_by_user_id: user_id,
      result: "success",
      leg_type: legToValidate,
    });

    console.log("Ticket validated successfully:", ticket.id, "leg:", legToValidate);

    // Build route info for response
    const validatedDepartureDate = legDeparture?.departure_date;

    // Build route info for response
    const routeInfo = legDeparture?.route 
      ? `${legDeparture.route.origin?.name || '?'} → ${legDeparture.route.destination?.name || '?'}`
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${legToValidate === 'outbound' ? 'Outbound' : 'Return'} ticket validated successfully`,
        leg: legToValidate,
        ticket: { 
          id: ticket.id, 
          booking,
          route: routeInfo,
          departure_time: legDeparture?.departure_time,
          departure_date: legDeparture?.departure_date,
        },
        // Date is already validated above, no warning needed
        // Info about remaining legs
        remainingLegs: {
          outbound: legToValidate === 'return' ? (outboundAlreadyValidated ? 'validated' : 'pending') : 'just_validated',
          return: returnDeparture 
            ? (legToValidate === 'outbound' ? (returnAlreadyValidated ? 'validated' : 'pending') : 'just_validated')
            : null
        }
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
