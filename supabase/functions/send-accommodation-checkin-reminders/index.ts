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

// Default reminder templates (fallback)
const DEFAULT_TEMPLATES: Record<string, { subject?: string; content: string }> = {
  acc_checkin_reminder_email_customer: {
    subject: '🏠 Check-in Reminder - {{accommodation_name}} tomorrow!',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🏠 Check-in Tomorrow!</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p>Hi <strong>{{guest_name}}</strong>!</p>
    <p>Your check-in at <strong>{{accommodation_name}}</strong> is tomorrow.</p>
    <p><strong>Check-in:</strong> {{checkin_date}} from {{checkin_time}}</p>
    <p><strong>Check-out:</strong> {{checkout_date}} before {{checkout_time}}</p>
    <p><strong>Duration:</strong> {{total_nights}} night(s)</p>
    <p>📞 Contact: {{partner_name}} - {{partner_phone}}</p>
    <p style="color: #666; font-size: 12px;">Ref: {{booking_ref}}</p>
  </div>
</body></html>`,
  },
  acc_checkin_reminder_email_partner: {
    subject: '🏠 Check-in Tomorrow - {{guest_name}} at {{accommodation_name}}',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🏠 Check-in Alert</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p><strong>Guest:</strong> {{guest_name}} | {{guest_phone}}</p>
    <p><strong>Property:</strong> {{accommodation_name}}</p>
    <p><strong>Check-in:</strong> {{checkin_date}} | <strong>Check-out:</strong> {{checkout_date}}</p>
    <p><strong>Guests:</strong> {{guests_count}}</p>
    <p style="color: #666; font-size: 12px;">Ref: {{booking_ref}}</p>
  </div>
</body></html>`,
  },
  acc_checkin_reminder_whatsapp_customer: {
    content: `🏠 *CHECK-IN REMINDER*

Hi {{guest_name}}!

Your check-in is tomorrow!
🏠 {{accommodation_name}}
📅 {{checkin_date}} (from {{checkin_time}})
📅 Check-out: {{checkout_date}}

📞 Contact: {{partner_phone}}
Ref: {{booking_ref}}`,
  },
  acc_checkin_reminder_whatsapp_partner: {
    content: `🏠 *CHECK-IN ALERT*

👤 {{guest_name}} | 📱 {{guest_phone}}
🏠 {{accommodation_name}}
📅 Check-in: {{checkin_date}}
📅 Check-out: {{checkout_date}}
👥 {{guests_count}} guests

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
    .like('template_type', 'acc_checkin%');

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
  if (!response.ok) throw new Error(`Fonnte error: ${response.status}`);
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

    // Find confirmed bookings with check-in tomorrow (within 20-28h window)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error: bookingsErr } = await supabase
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
      .eq("status", "confirmed")
      .eq("checkin_date", tomorrowStr);

    if (bookingsErr) {
      console.error("Error fetching bookings:", bookingsErr);
      throw new Error(bookingsErr.message);
    }

    const results = { processed: 0, emailsSent: 0, whatsappSent: 0, errors: [] as string[] };

    if (!bookings || bookings.length === 0) {
      console.log("No check-ins tomorrow");
      return new Response(JSON.stringify({ message: "No check-ins tomorrow", results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${bookings.length} check-ins for tomorrow`);

    // Partner templates cache
    const templatesCache = new Map();

    for (const booking of bookings) {
      try {
        // Check if reminder already sent
        const { data: existing } = await supabase
          .from("accommodation_reminder_logs")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", "checkin_24h");

        if (existing && existing.length > 0) {
          console.log(`Reminder already sent for booking ${booking.id}`);
          continue;
        }

        results.processed++;

        const acc = booking.accommodation as any;
        const partner = booking.partner as any;

        // Fetch templates (cached)
        let templates = templatesCache.get(booking.partner_id);
        if (!templates) {
          templates = await fetchPartnerTemplates(supabase, booking.partner_id);
          templatesCache.set(booking.partner_id, templates);
        }

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

        // Fetch partner settings
        const { data: settings } = await supabase
          .from("partner_settings")
          .select("email_booking_confirmation, whatsapp_booking_confirmation")
          .eq("partner_id", booking.partner_id)
          .single();

        const emailEnabled = settings?.email_booking_confirmation ?? true;
        const whatsappEnabled = settings?.whatsapp_booking_confirmation ?? false;

        // Send email to guest
        if (emailEnabled && booking.guest_email && resend) {
          try {
            const tmpl = getTemplate(templates, 'acc_checkin_reminder_email_customer');
            await resend.emails.send({
              from: "SriBooking <noreply@sribooking.com>",
              to: [booking.guest_email],
              subject: replacePlaceholders(tmpl.subject || '', templateData),
              html: replacePlaceholders(tmpl.content, templateData),
            });
            results.emailsSent++;

            await supabase.from("accommodation_reminder_logs").insert({
              booking_id: booking.id, reminder_type: "checkin_24h",
              channel: "email", recipient: "customer",
            });
          } catch (err) {
            results.errors.push(`Email guest ${booking.id}: ${String(err)}`);
          }
        }

        // Send email to partner
        if (emailEnabled && partner?.contact_email && resend) {
          try {
            const tmpl = getTemplate(templates, 'acc_checkin_reminder_email_partner');
            await resend.emails.send({
              from: "SriBooking <noreply@sribooking.com>",
              to: [partner.contact_email],
              subject: replacePlaceholders(tmpl.subject || '', templateData),
              html: replacePlaceholders(tmpl.content, templateData),
            });
            results.emailsSent++;

            await supabase.from("accommodation_reminder_logs").insert({
              booking_id: booking.id, reminder_type: "checkin_24h",
              channel: "email", recipient: "partner",
            });
          } catch (err) {
            results.errors.push(`Email partner ${booking.id}: ${String(err)}`);
          }
        }

        // Send WhatsApp to guest
        if (whatsappEnabled && booking.guest_phone && fonnteToken) {
          try {
            const tmpl = getTemplate(templates, 'acc_checkin_reminder_whatsapp_customer');
            await sendWhatsApp(fonnteToken, booking.guest_phone, replacePlaceholders(tmpl.content, templateData));
            results.whatsappSent++;

            await supabase.from("accommodation_reminder_logs").insert({
              booking_id: booking.id, reminder_type: "checkin_24h",
              channel: "whatsapp", recipient: "customer",
            });
          } catch (err) {
            results.errors.push(`WA guest ${booking.id}: ${String(err)}`);
          }
        }

        // Send WhatsApp to partner
        const partnerWA = partner?.whatsapp_number
          ? `${partner.whatsapp_country_code || '+62'}${partner.whatsapp_number}`
          : null;

        if (whatsappEnabled && partnerWA && fonnteToken) {
          try {
            const tmpl = getTemplate(templates, 'acc_checkin_reminder_whatsapp_partner');
            await sendWhatsApp(fonnteToken, partnerWA, replacePlaceholders(tmpl.content, templateData));
            results.whatsappSent++;

            await supabase.from("accommodation_reminder_logs").insert({
              booking_id: booking.id, reminder_type: "checkin_24h",
              channel: "whatsapp", recipient: "partner",
            });
          } catch (err) {
            results.errors.push(`WA partner ${booking.id}: ${String(err)}`);
          }
        }
      } catch (err) {
        console.error(`Error processing booking ${booking.id}:`, err);
        results.errors.push(`Booking ${booking.id}: ${String(err)}`);
      }
    }

    console.log("Accommodation check-in reminders completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-accommodation-checkin-reminders:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
