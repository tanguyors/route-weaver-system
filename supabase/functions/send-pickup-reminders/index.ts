import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PickupInfo {
  pickup_area?: string;
  pickup_hotel?: string;
  pickup_address?: string;
  pickup_note?: string;
  vehicle_type?: string;
}

interface BookingAddon {
  id: string;
  booking_id: string;
  name: string;
  pickup_info: PickupInfo | null;
}

interface Departure {
  id: string;
  departure_date: string;
  departure_time: string;
  route: {
    origin_port: { name: string };
    destination_port: { name: string };
  };
}

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Partner {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_country_code: string | null;
  whatsapp_number: string | null;
  pickup_reminder_24h_enabled: boolean;
  pickup_reminder_12h_enabled: boolean;
}

interface BookingWithPickup {
  id: string;
  partner_id: string;
  customer: Customer;
  departure: Departure;
  partner: Partner;
  booking_addons: BookingAddon[];
}

interface NotificationTemplate {
  id: string;
  partner_id: string;
  template_type: string;
  subject: string | null;
  content: string;
  is_active: boolean;
}

interface TemplateData {
  customer_name: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  pickup_area: string;
  vehicle_type: string;
  origin_port: string;
  destination_port: string;
  departure_time: string;
  partner_name: string;
  partner_phone: string;
  customer_phone: string;
  booking_ref: string;
  hours_before: string;
}

// Default templates (fallback when no custom template exists)
const DEFAULT_TEMPLATES = {
  pickup_reminder_email_customer: {
    subject: '🚗 Pickup Reminder - {{hours_before}} before your trip',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pickup Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Pickup Reminder</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{hours_before}} before your trip!</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{{customer_name}}</strong>!</p>
    
    <p>This is a friendly reminder about your upcoming pickup:</p>
    
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date & Time</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #0ea5e9; font-size: 18px;">{{pickup_date}}<br>{{pickup_time}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Pickup Location</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pickup_location}}<br><span style="color: #666;">{{pickup_area}}</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🚗 Vehicle</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{vehicle_type}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>🚢 Trip</strong></td>
          <td style="padding: 10px 0; text-align: right;">{{origin_port}} → {{destination_port}}<br><span style="color: #666;">Departure: {{departure_time}}</span></td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; border-radius: 10px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> Please be ready at least 10 minutes before the scheduled pickup time.</p>
    </div>
    
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;"><strong>📞 Questions?</strong> Contact {{partner_name}}: {{partner_phone}}</p>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Have a safe trip! 🌴</p>
  </div>
</body>
</html>`
  },
  
  pickup_reminder_email_partner: {
    subject: '🚗 Pickup Reminder - {{hours_before}} - {{customer_name}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pickup Reminder - Partner</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Pickup Alert</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{hours_before}} - Customer Pickup Required</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Customer Details</h2>
    
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Customer Name</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{customer_name}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📱 Phone</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><a href="tel:{{customer_phone}}" style="color: #0ea5e9;">{{customer_phone}}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Pickup Time</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #f97316; font-size: 18px;">{{pickup_date}}<br>{{pickup_time}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Pickup Location</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pickup_location}}<br><span style="color: #666;">{{pickup_area}}</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🚗 Vehicle Type</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{vehicle_type}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>🚢 Trip</strong></td>
          <td style="padding: 10px 0; text-align: right;">{{origin_port}} → {{destination_port}}<br><span style="color: #666;">Departure: {{departure_time}}</span></td>
        </tr>
      </table>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p>
  </div>
</body>
</html>`
  },
  
  pickup_reminder_whatsapp_customer: {
    content: `🚗 *PICKUP REMINDER*

Hi {{customer_name}}!

Your pickup is scheduled for:
📅 *{{pickup_date}}*
⏰ *{{pickup_time}}*

📍 *Pickup Location:*
{{pickup_location}}
Area: {{pickup_area}}

🚗 *Vehicle:* {{vehicle_type}}

🚢 *Trip Details:*
{{origin_port}} → {{destination_port}}
Departure: {{departure_time}}

⏰ Please be ready 10 minutes before pickup time.

📞 Questions? Contact: {{partner_phone}}

Booking ref: {{booking_ref}}`
  },
  
  pickup_reminder_whatsapp_partner: {
    content: `🚗 *PICKUP ALERT - {{hours_before}}*

👤 *Customer:* {{customer_name}}
📱 *Phone:* {{customer_phone}}

📅 *Pickup Time:*
{{pickup_date}}
{{pickup_time}}

📍 *Location:*
{{pickup_location}}
Area: {{pickup_area}}

🚗 *Vehicle:* {{vehicle_type}}

🚢 *Trip:* {{origin_port}} → {{destination_port}}
Departure: {{departure_time}}

Booking ref: {{booking_ref}}`
  }
};

// Replace placeholders in template with actual data
function replacePlaceholders(template: string, data: TemplateData): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  });
  return result;
}

// Fetch custom templates for a partner
async function fetchPartnerTemplates(supabase: any, partnerId: string): Promise<Map<string, NotificationTemplate>> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching templates:', error);
    return new Map();
  }

  const templateMap = new Map<string, NotificationTemplate>();
  (data || []).forEach((template: NotificationTemplate) => {
    templateMap.set(template.template_type, template);
  });

  return templateMap;
}

// Get template content (custom or default)
function getTemplateContent(
  templates: Map<string, NotificationTemplate>,
  templateType: string
): { subject?: string; content: string } {
  const customTemplate = templates.get(templateType);
  if (customTemplate) {
    return {
      subject: customTemplate.subject || undefined,
      content: customTemplate.content,
    };
  }
  
  const defaultTemplate = DEFAULT_TEMPLATES[templateType as keyof typeof DEFAULT_TEMPLATES];
  if (!defaultTemplate) {
    return { content: '' };
  }
  
  return {
    subject: 'subject' in defaultTemplate ? defaultTemplate.subject : undefined,
    content: defaultTemplate.content || '',
  };
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

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - skipping email notifications");
    }

    if (!fonnteToken) {
      console.warn("FONNTE_API_TOKEN not configured - skipping WhatsApp notifications");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const now = new Date();
    const results = {
      processed: 0,
      emailsSent: 0,
      whatsappSent: 0,
      errors: [] as string[],
    };

    // Query bookings with pickup addons that have confirmed status
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        partner_id,
        customer:customers!bookings_customer_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        departure:departures!bookings_departure_id_fkey (
          id,
          departure_date,
          departure_time,
          route:routes!departures_route_id_fkey (
            origin_port:ports!routes_origin_port_id_fkey (name),
            destination_port:ports!routes_destination_port_id_fkey (name)
          )
        ),
        partner:partners!bookings_partner_id_fkey (
          id,
          name,
          contact_email,
          contact_phone,
          whatsapp_country_code,
          whatsapp_number,
          pickup_reminder_24h_enabled,
          pickup_reminder_12h_enabled
        ),
        booking_addons (
          id,
          booking_id,
          name,
          pickup_info
        )
      `)
      .eq("status", "confirmed")
      .not("booking_addons.pickup_info", "is", null);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings with pickup addons found");
      return new Response(
        JSON.stringify({ message: "No pickups to remind", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${bookings.length} bookings with pickup addons`);

    // Cache for partner templates
    const partnerTemplatesCache = new Map<string, Map<string, NotificationTemplate>>();

    for (const booking of bookings as unknown as BookingWithPickup[]) {
      try {
        // Get the pickup addon with pickup_info
        const pickupAddon = booking.booking_addons.find(
          (addon) => addon.pickup_info !== null
        );

        if (!pickupAddon || !pickupAddon.pickup_info) continue;

        const pickupInfo = pickupAddon.pickup_info;
        const departure = booking.departure;
        const customer = booking.customer;
        const partner = booking.partner;

        // Calculate pickup time
        const departureDateTime = new Date(
          `${departure.departure_date}T${departure.departure_time}`
        );

        // Extract minutes before departure from pickup_note (e.g., "60 min before departure")
        let minutesBefore = 60; // Default 60 minutes
        if (pickupInfo.pickup_note) {
          const match = pickupInfo.pickup_note.match(/(\d+)\s*min/i);
          if (match) {
            minutesBefore = parseInt(match[1], 10);
          }
        }

        const pickupDateTime = new Date(
          departureDateTime.getTime() - minutesBefore * 60000
        );

        // Calculate hours until pickup
        const hoursUntilPickup = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Determine which reminder to send
        let reminderType: "24h" | "12h" | null = null;
        if (hoursUntilPickup >= 23 && hoursUntilPickup < 25 && partner.pickup_reminder_24h_enabled) {
          reminderType = "24h";
        } else if (hoursUntilPickup >= 11 && hoursUntilPickup < 13 && partner.pickup_reminder_12h_enabled) {
          reminderType = "12h";
        }

        if (!reminderType) continue;

        results.processed++;

        // Check if reminder already sent
        const { data: existingLogs } = await supabase
          .from("pickup_reminder_logs")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", reminderType);

        if (existingLogs && existingLogs.length > 0) {
          console.log(`Reminder ${reminderType} already sent for booking ${booking.id}`);
          continue;
        }

        // Fetch partner templates (with caching)
        let partnerTemplates = partnerTemplatesCache.get(partner.id);
        if (!partnerTemplates) {
          partnerTemplates = await fetchPartnerTemplates(supabase, partner.id);
          partnerTemplatesCache.set(partner.id, partnerTemplates);
        }

        const pickupDate = pickupDateTime.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const pickupTime = pickupDateTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const hoursText = reminderType === "24h" ? "24 hours" : "12 hours";
        const vehicleText = pickupInfo.vehicle_type === "bus" ? "Shuttle Bus" : "Private Car";
        const pickupLocation = pickupInfo.pickup_hotel || pickupInfo.pickup_address || pickupInfo.pickup_area || "";

        // Prepare template data
        const templateData: TemplateData = {
          customer_name: customer.full_name,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          pickup_location: pickupLocation,
          pickup_area: pickupInfo.pickup_area || "",
          vehicle_type: vehicleText,
          origin_port: departure.route.origin_port.name,
          destination_port: departure.route.destination_port.name,
          departure_time: departure.departure_time,
          partner_name: partner.name,
          partner_phone: partner.contact_phone || "",
          customer_phone: customer.phone || "N/A",
          booking_ref: booking.id.substring(0, 8).toUpperCase(),
          hours_before: hoursText,
        };

        // Send notifications to customer
        if (customer.email && resend) {
          try {
            const template = getTemplateContent(partnerTemplates, 'pickup_reminder_email_customer');
            const emailHtml = replacePlaceholders(template.content, templateData);
            const emailSubject = replacePlaceholders(template.subject || '', templateData);

            await resend.emails.send({
              from: "SriBooking <noreply@sribooking.com>",
              to: [customer.email],
              subject: emailSubject,
              html: emailHtml,
            });

            await logReminder(supabase, booking.id, reminderType, "email", "customer", "sent");
            results.emailsSent++;
          } catch (emailError) {
            console.error("Error sending customer email:", emailError);
            await logReminder(supabase, booking.id, reminderType, "email", "customer", "failed", String(emailError));
          }
        }

        // Send WhatsApp to customer
        if (customer.phone && fonnteToken) {
          try {
            const template = getTemplateContent(partnerTemplates, 'pickup_reminder_whatsapp_customer');
            const message = replacePlaceholders(template.content, templateData);

            await sendWhatsApp(fonnteToken, customer.phone, message);

            await logReminder(supabase, booking.id, reminderType, "whatsapp", "customer", "sent");
            results.whatsappSent++;
          } catch (waError) {
            console.error("Error sending customer WhatsApp:", waError);
            await logReminder(supabase, booking.id, reminderType, "whatsapp", "customer", "failed", String(waError));
          }
        }

        // Send notifications to partner
        if (partner.contact_email && resend) {
          try {
            const template = getTemplateContent(partnerTemplates, 'pickup_reminder_email_partner');
            const emailHtml = replacePlaceholders(template.content, templateData);
            const emailSubject = replacePlaceholders(template.subject || '', templateData);

            await resend.emails.send({
              from: "SriBooking <noreply@sribooking.com>",
              to: [partner.contact_email],
              subject: emailSubject,
              html: emailHtml,
            });

            await logReminder(supabase, booking.id, reminderType, "email", "partner", "sent");
            results.emailsSent++;
          } catch (emailError) {
            console.error("Error sending partner email:", emailError);
            await logReminder(supabase, booking.id, reminderType, "email", "partner", "failed", String(emailError));
          }
        }

        // Send WhatsApp to partner (use dedicated WhatsApp number if configured)
        const partnerWhatsAppNumber = partner.whatsapp_number 
          ? `${partner.whatsapp_country_code || '+62'}${partner.whatsapp_number}`
          : null;
        
        if (partnerWhatsAppNumber && fonnteToken) {
          try {
            const template = getTemplateContent(partnerTemplates, 'pickup_reminder_whatsapp_partner');
            const message = replacePlaceholders(template.content, templateData);

            await sendWhatsApp(fonnteToken, partnerWhatsAppNumber, message);

            await logReminder(supabase, booking.id, reminderType, "whatsapp", "partner", "sent");
            results.whatsappSent++;
          } catch (waError) {
            console.error("Error sending partner WhatsApp:", waError);
            await logReminder(supabase, booking.id, reminderType, "whatsapp", "partner", "failed", String(waError));
          }
        }
      } catch (bookingError) {
        console.error(`Error processing booking ${booking.id}:`, bookingError);
        results.errors.push(`Booking ${booking.id}: ${String(bookingError)}`);
      }
    }

    console.log("Pickup reminders completed:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-pickup-reminders:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function logReminder(
  supabase: any,
  bookingId: string,
  reminderType: string,
  channel: string,
  recipientType: string,
  status: string,
  errorMessage?: string
) {
  const { error } = await supabase.from("pickup_reminder_logs").insert({
    booking_id: bookingId,
    reminder_type: reminderType,
    channel,
    recipient_type: recipientType,
    status,
    error_message: errorMessage,
  });

  if (error) {
    console.error("Error logging reminder:", error);
  }
}

async function sendWhatsApp(token: string, phone: string, message: string) {
  // Clean phone number (remove spaces, dashes, etc.)
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
      countryCode: "62", // Indonesia default
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fonnte API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

serve(handler);
