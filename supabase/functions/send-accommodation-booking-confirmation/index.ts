import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccTemplateData {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  accommodation_name: string;
  accommodation_type: string;
  checkin_date: string;
  checkout_date: string;
  checkin_time: string;
  checkout_time: string;
  total_nights: string;
  guests_count: string;
  total_amount: string;
  currency: string;
  partner_name: string;
  partner_phone: string;
  partner_email: string;
  booking_ref: string;
  channel: string;
}

// Default templates
const DEFAULT_TEMPLATES: Record<string, { subject?: string; content: string }> = {
  acc_booking_confirmation_email_customer: {
    subject: '✅ Booking Confirmed - {{accommodation_name}} | {{checkin_date}}',
    content: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your stay is all set</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p>Hi <strong>{{guest_name}}</strong>!</p>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🏠 Property</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{accommodation_name}}</strong></td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-in</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkin_date}} from {{checkin_time}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-out</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkout_date}} before {{checkout_time}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🌙 Nights</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">{{total_nights}}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>💰 Total</strong></td><td style="padding: 8px 0; text-align: right;"><strong>{{currency}} {{total_amount}}</strong></td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 12px;">Booking ref: {{booking_ref}}</p>
  </div>
</body></html>`,
  },
  acc_booking_confirmation_email_partner: {
    subject: '🏠 New Accommodation Booking - {{guest_name}} | {{checkin_date}}',
    content: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🏠 New Booking</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p><strong>Guest:</strong> {{guest_name}} | {{guest_email}} | {{guest_phone}}</p>
    <p><strong>Property:</strong> {{accommodation_name}}</p>
    <p><strong>Check-in:</strong> {{checkin_date}} | <strong>Check-out:</strong> {{checkout_date}}</p>
    <p><strong>Nights:</strong> {{total_nights}} | <strong>Guests:</strong> {{guests_count}}</p>
    <p><strong>Channel:</strong> {{channel}} | <strong>Total:</strong> {{currency}} {{total_amount}}</p>
    <p style="color: #666; font-size: 12px;">Booking ref: {{booking_ref}}</p>
  </div>
</body></html>`,
  },
  acc_booking_confirmation_whatsapp_customer: {
    content: `✅ *ACCOMMODATION BOOKING CONFIRMED*

Hi {{guest_name}}! 🎉

🏠 *{{accommodation_name}}*
📅 Check-in: {{checkin_date}} (from {{checkin_time}})
📅 Check-out: {{checkout_date}} (before {{checkout_time}})
🌙 Nights: {{total_nights}}
💰 Total: {{currency}} {{total_amount}}

📞 Contact: {{partner_phone}}
Ref: {{booking_ref}}`,
  },
  acc_booking_confirmation_whatsapp_partner: {
    content: `🏠 *NEW ACCOMMODATION BOOKING*

👤 {{guest_name}} | 📱 {{guest_phone}}
🏠 {{accommodation_name}}
📅 {{checkin_date}} → {{checkout_date}} ({{total_nights}} nights)
👥 {{guests_count}} guests | 📢 {{channel}}
💰 {{currency}} {{total_amount}}
Ref: {{booking_ref}}`,
  },
};

function replacePlaceholders(template: string, data: AccTemplateData): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  });
  return result;
}

async function fetchPartnerTemplates(supabase: any, partnerId: string) {
  const { data } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_active', true)
    .like('template_type', 'acc_%');

  const map = new Map();
  (data || []).forEach((t: any) => map.set(t.template_type, t));
  return map;
}

function getTemplate(templates: Map<string, any>, type: string) {
  const custom = templates.get(type);
  if (custom) return { subject: custom.subject || undefined, content: custom.content };
  const def = DEFAULT_TEMPLATES[type];
  return def || { content: '' };
}

async function sendWhatsApp(token: string, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({ target: cleanPhone, message, countryCode: "62" }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Fonnte error: ${response.status} - ${err}`);
  }
  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fonnteToken = Deno.env.get("FONNTE_API_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Sending accommodation confirmation for booking:", booking_id);

    // Fetch booking with accommodation and partner
    const { data: booking, error: bookingErr } = await supabase
      .from("accommodation_bookings")
      .select(`
        *,
        accommodation:accommodations!accommodation_bookings_accommodation_id_fkey (
          name, type, checkin_time, checkout_time
        ),
        partner:partners!accommodation_bookings_partner_id_fkey (
          id, name, contact_email, contact_phone,
          whatsapp_country_code, whatsapp_number
        )
      `)
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      console.error("Booking not found:", bookingErr);
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const acc = booking.accommodation as any;
    const partner = booking.partner as any;

    // Fetch partner settings
    const { data: settings } = await supabase
      .from("partner_settings")
      .select("email_booking_confirmation, whatsapp_booking_confirmation")
      .eq("partner_id", booking.partner_id)
      .single();

    const emailEnabled = settings?.email_booking_confirmation ?? true;
    const whatsappEnabled = settings?.whatsapp_booking_confirmation ?? false;

    // Fetch custom templates
    const templates = await fetchPartnerTemplates(supabase, booking.partner_id);

    // Format dates
    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });

    const templateData: AccTemplateData = {
      guest_name: booking.guest_name,
      guest_email: booking.guest_email || "N/A",
      guest_phone: booking.guest_phone || "N/A",
      accommodation_name: acc?.name || "N/A",
      accommodation_type: acc?.type || "N/A",
      checkin_date: formatDate(booking.checkin_date),
      checkout_date: formatDate(booking.checkout_date),
      checkin_time: acc?.checkin_time || "14:00",
      checkout_time: acc?.checkout_time || "11:00",
      total_nights: String(booking.total_nights),
      guests_count: String(booking.guests_count),
      total_amount: booking.total_amount.toLocaleString(),
      currency: booking.currency,
      partner_name: partner?.name || "",
      partner_phone: partner?.contact_phone || "",
      partner_email: partner?.contact_email || "",
      booking_ref: booking.id.substring(0, 8).toUpperCase(),
      channel: booking.channel,
    };

    const results = { emailsSent: 0, whatsappSent: 0, errors: [] as string[] };

    // Send email to guest
    if (emailEnabled && booking.guest_email && resend) {
      try {
        const tmpl = getTemplate(templates, 'acc_booking_confirmation_email_customer');
        await resend.emails.send({
          from: "SriBooking <noreply@sribooking.com>",
          to: [booking.guest_email],
          subject: replacePlaceholders(tmpl.subject || '', templateData),
          html: replacePlaceholders(tmpl.content, templateData),
        });
        results.emailsSent++;
      } catch (err) {
        console.error("Guest email error:", err);
        results.errors.push(`Guest email: ${String(err)}`);
      }
    }

    // Send email to partner
    if (emailEnabled && partner?.contact_email && resend) {
      try {
        const tmpl = getTemplate(templates, 'acc_booking_confirmation_email_partner');
        await resend.emails.send({
          from: "SriBooking <noreply@sribooking.com>",
          to: [partner.contact_email],
          subject: replacePlaceholders(tmpl.subject || '', templateData),
          html: replacePlaceholders(tmpl.content, templateData),
        });
        results.emailsSent++;
      } catch (err) {
        console.error("Partner email error:", err);
        results.errors.push(`Partner email: ${String(err)}`);
      }
    }

    // Send WhatsApp to guest
    if (whatsappEnabled && booking.guest_phone && fonnteToken) {
      try {
        const tmpl = getTemplate(templates, 'acc_booking_confirmation_whatsapp_customer');
        await sendWhatsApp(fonnteToken, booking.guest_phone, replacePlaceholders(tmpl.content, templateData));
        results.whatsappSent++;
      } catch (err) {
        console.error("Guest WhatsApp error:", err);
        results.errors.push(`Guest WA: ${String(err)}`);
      }
    }

    // Send WhatsApp to partner
    const partnerWA = partner?.whatsapp_number
      ? `${partner.whatsapp_country_code || '+62'}${partner.whatsapp_number}`
      : null;

    if (whatsappEnabled && partnerWA && fonnteToken) {
      try {
        const tmpl = getTemplate(templates, 'acc_booking_confirmation_whatsapp_partner');
        await sendWhatsApp(fonnteToken, partnerWA, replacePlaceholders(tmpl.content, templateData));
        results.whatsappSent++;
      } catch (err) {
        console.error("Partner WhatsApp error:", err);
        results.errors.push(`Partner WA: ${String(err)}`);
      }
    }

    console.log("Accommodation confirmation completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-accommodation-booking-confirmation:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
