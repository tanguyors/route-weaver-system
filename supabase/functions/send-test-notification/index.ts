import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sample data for testing templates
const SAMPLE_DATA = {
  customer_name: 'John Doe',
  customer_email: 'test@example.com',
  customer_phone: '+62812345678',
  booking_ref: 'SRB-TEST123',
  booking_date: 'Monday, February 3rd, 2026',
  departure_date: 'Tuesday, February 4th, 2026',
  departure_time: '09:00',
  origin_port: 'Sanur Harbor',
  destination_port: 'Nusa Penida',
  trip_name: 'Sanur → Nusa Penida',
  pax_adult: '2',
  pax_child: '1',
  pax_total: '3',
  total_amount: '450,000',
  currency: 'IDR',
  partner_name: 'Your Company',
  partner_phone: '+62812345678',
  partner_email: 'partner@example.com',
  ticket_url: 'https://example.com/ticket',
  return_info: '',
  pickup_date: 'Tuesday, February 4th, 2026',
  pickup_time: '07:30',
  pickup_location: 'Sunset Hotel Bali',
  pickup_area: 'Kuta',
  vehicle_type: 'Car',
  hours_before: '24 hours',
};

// Replace placeholders in template
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  });
  return result;
}

// Send WhatsApp message via Fonnte
async function sendWhatsApp(token: string, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: cleanPhone,
      message,
      countryCode: "62",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fonnte API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      partnerId, 
      channel, // 'email' or 'whatsapp'
      subject, 
      content,
      testEmail, // Email destination for test
      testPhone, // Phone destination for WhatsApp test
    } = await req.json();

    if (!partnerId || !channel || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('name, contact_email, contact_phone, whatsapp_country_code, whatsapp_number')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      console.error('Partner fetch error:', partnerError);
      return new Response(
        JSON.stringify({ error: "Partner not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update sample data with partner info
    const templateData = {
      ...SAMPLE_DATA,
      partner_name: partner.name || 'Your Company',
      partner_phone: partner.contact_phone || '+62812345678',
      partner_email: partner.contact_email || 'partner@example.com',
    };

    // Replace placeholders in content and subject
    const processedContent = replacePlaceholders(content, templateData);
    const processedSubject = subject ? replacePlaceholders(subject, templateData) : '';

    if (channel === 'email') {
      if (!testEmail) {
        return new Response(
          JSON.stringify({ error: "Test email address required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Email service not configured (RESEND_API_KEY missing)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resend = new Resend(resendApiKey);

      const emailResult = await resend.emails.send({
        from: "SriBooking <noreply@sribooking.com>",
        to: [testEmail],
        subject: processedSubject || "[TEST] Template Preview",
        html: processedContent,
      });

      console.log(`Test email sent to ${testEmail}:`, emailResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test email sent to ${testEmail}`,
          result: emailResult
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (channel === 'whatsapp') {
      if (!testPhone) {
        return new Response(
          JSON.stringify({ error: "Test phone number required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fonnteToken = Deno.env.get("FONNTE_TOKEN");
      if (!fonnteToken) {
        return new Response(
          JSON.stringify({ error: "WhatsApp service not configured (FONNTE_TOKEN missing)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add [TEST] prefix to message
      const testMessage = `🧪 *[TEST MESSAGE]*\n\n${processedContent}`;
      
      const waResult = await sendWhatsApp(fonnteToken, testPhone, testMessage);

      console.log(`Test WhatsApp sent to ${testPhone}:`, waResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test WhatsApp sent to ${testPhone}`,
          result: waResult
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid channel. Use 'email' or 'whatsapp'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    console.error("Error in send-test-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
