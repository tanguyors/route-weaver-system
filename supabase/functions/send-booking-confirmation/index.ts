import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  customer_email: string;
  customer_phone: string;
  booking_ref: string;
  booking_date: string;
  departure_date: string;
  departure_time: string;
  origin_port: string;
  destination_port: string;
  trip_name: string;
  pax_adult: string;
  pax_child: string;
  pax_total: string;
  total_amount: string;
  currency: string;
  partner_name: string;
  partner_phone: string;
  partner_email: string;
  ticket_url: string;
  return_info: string;
}

// Default templates
const DEFAULT_TEMPLATES = {
  booking_confirmation_email_customer: {
    subject: '✅ Booking Confirmed - {{trip_name}} on {{departure_date}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Thank you for your booking</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{{customer_name}}</strong>!</p>
    
    <p>Your booking has been confirmed. Here are your trip details:</p>
    
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Route</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #10b981;">{{origin_port}} → {{destination_port}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>⏰ Departure</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{departure_time}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Passengers</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pax_adult}} Adult(s), {{pax_child}} Child(ren)</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>💰 Total</strong></td>
          <td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px;">{{currency}} {{total_amount}}</strong></td>
        </tr>
      </table>
    </div>

    {{return_info}}
    
    <div style="background: #dbeafe; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>🎫 Your E-Ticket</strong></p>
      <a href="{{ticket_url}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View & Download Ticket</a>
    </div>
    
    <div style="background: #fef3c7; border-radius: 10px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> Please arrive at the port at least 60 minutes before departure.</p>
    </div>
    
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;"><strong>📞 Need help?</strong> Contact {{partner_name}}: {{partner_phone}}</p>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Have a safe trip! 🌴</p>
  </div>
</body>
</html>`
  },
  
  booking_confirmation_email_partner: {
    subject: '🆕 New Booking - {{customer_name}} - {{departure_date}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🆕 New Booking Received</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">A new booking has been confirmed</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Customer Details</h2>
    
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Name</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{customer_name}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📧 Email</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><a href="mailto:{{customer_email}}" style="color: #3b82f6;">{{customer_email}}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>📱 Phone</strong></td>
          <td style="padding: 10px 0; text-align: right;"><a href="tel:{{customer_phone}}" style="color: #3b82f6;">{{customer_phone}}</a></td>
        </tr>
      </table>
    </div>

    <h2 style="color: #1e293b;">Trip Details</h2>
    
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Route</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{origin_port}} → {{destination_port}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>⏰ Departure</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{departure_time}}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Passengers</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pax_total}} ({{pax_adult}} Adult, {{pax_child}} Child)</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>💰 Total</strong></td>
          <td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px; color: #10b981;">{{currency}} {{total_amount}}</strong></td>
        </tr>
      </table>
    </div>

    {{return_info}}
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p>
  </div>
</body>
</html>`
  },
  
  booking_confirmation_whatsapp_customer: {
    content: `✅ *BOOKING CONFIRMED*

Hi {{customer_name}}! 🎉

Your booking has been confirmed.

📍 *Route:* {{origin_port}} → {{destination_port}}
📅 *Date:* {{departure_date}}
⏰ *Departure:* {{departure_time}}
👥 *Passengers:* {{pax_total}}
💰 *Total:* {{currency}} {{total_amount}}

{{return_info}}

🎫 *Download your ticket:*
{{ticket_url}}

⏰ Please arrive at the port 60 minutes before departure.

📞 Need help? Contact: {{partner_phone}}

Booking ref: {{booking_ref}}`
  },
  
  booking_confirmation_whatsapp_partner: {
    content: `🆕 *NEW BOOKING*

👤 *Customer:* {{customer_name}}
📱 *Phone:* {{customer_phone}}
📧 *Email:* {{customer_email}}

📍 *Route:* {{origin_port}} → {{destination_port}}
📅 *Date:* {{departure_date}}
⏰ *Departure:* {{departure_time}}
👥 *Passengers:* {{pax_total}}
💰 *Total:* {{currency}} {{total_amount}}

{{return_info}}

Booking ref: {{booking_ref}}`
  }
};

// Replace placeholders in template
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

// Get template content
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

// Generate a simple HTML ticket for PDF conversion
function generateTicketHtml(booking: any, customer: any, departure: any, partner: any, ticket: any, returnDeparture: any): string {
  const departureDate = new Date(departure.departure_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let returnSection = '';
  if (returnDeparture) {
    const returnDate = new Date(returnDeparture.departure_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    returnSection = `
      <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #166534;">🔄 Return Trip</h3>
        <p style="margin: 5px 0;"><strong>Route:</strong> ${returnDeparture.route.origin_port.name} → ${returnDeparture.route.destination_port.name}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${returnDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${returnDeparture.departure_time}</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; }
    .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">🎫 E-TICKET</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${partner.name}</p>
  </div>
  
  <div class="content">
    <div class="qr-section">
      <div style="width: 150px; height: 150px; background: #e5e7eb; margin: 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
        <span style="font-size: 12px; color: #6b7280;">QR: ${ticket?.qr_token?.substring(0, 8) || booking.id.substring(0, 8)}</span>
      </div>
      <p style="margin: 10px 0 0 0; font-weight: bold; color: #1e293b;">Ref: ${booking.id.substring(0, 8).toUpperCase()}</p>
    </div>
    
    <h3 style="margin: 0 0 15px 0; color: #1e293b;">Trip Details</h3>
    
    <div class="detail-row">
      <span>📍 Route</span>
      <strong>${departure.route.origin_port.name} → ${departure.route.destination_port.name}</strong>
    </div>
    <div class="detail-row">
      <span>📅 Date</span>
      <strong>${departureDate}</strong>
    </div>
    <div class="detail-row">
      <span>⏰ Departure</span>
      <strong>${departure.departure_time}</strong>
    </div>
    <div class="detail-row">
      <span>👤 Passenger</span>
      <strong>${customer.full_name}</strong>
    </div>
    <div class="detail-row">
      <span>👥 Guests</span>
      <strong>${booking.pax_adult} Adult, ${booking.pax_child} Child</strong>
    </div>
    <div class="detail-row" style="border-bottom: none;">
      <span>💰 Total</span>
      <strong style="color: #10b981; font-size: 18px;">${booking.currency} ${booking.total_amount.toLocaleString()}</strong>
    </div>
    
    ${returnSection}
    
    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;"><strong>⏰ Important:</strong> Please arrive at the port at least 60 minutes before departure.</p>
    </div>
  </div>
  
  <div class="footer">
    <p style="margin: 0;">📞 Contact: ${partner.contact_phone || 'N/A'}</p>
    <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString("en-GB")}</p>
  </div>
</body>
</html>`;
}

// Upload ticket to storage and get public URL
async function uploadTicketPdf(supabase: any, bookingId: string, htmlContent: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    // Convert HTML to a simple text-based ticket for WhatsApp
    // Note: For actual PDF generation, you'd need a PDF library like puppeteer or pdfkit
    // For now, we upload the HTML as a file that can be viewed
    const fileName = `ticket-${bookingId}.html`;
    const filePath = `${bookingId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tickets')
      .upload(filePath, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading ticket:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tickets')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error in uploadTicketPdf:', error);
    return null;
  }
}

// Send WhatsApp message
async function sendWhatsApp(token: string, phone: string, message: string, fileUrl?: string) {
  const cleanPhone = phone.replace(/\D/g, "");

  const body: any = {
    target: cleanPhone,
    message,
    countryCode: "62",
  };

  // If file URL is provided, attach it (requires Fonnte Ultra)
  if (fileUrl) {
    body.url = fileUrl;
    body.filename = "ticket.html";
  }

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fonnteToken = Deno.env.get("FONNTE_API_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending confirmation for booking:", booking_id);

    // Fetch booking details
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        partner_id,
        pax_adult,
        pax_child,
        total_amount,
        currency,
        return_departure_id,
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
          ),
          trip:trips!departures_trip_id_fkey (trip_name)
        ),
        partner:partners!bookings_partner_id_fkey (
          id,
          name,
          contact_email,
          contact_phone,
          whatsapp_country_code,
          whatsapp_number
        ),
        ticket:tickets!tickets_booking_id_fkey (
          id,
          qr_token
        )
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !bookingData) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cast to any for easier access
    const booking = bookingData as any;
    const customer = booking.customer;
    const departure = booking.departure;
    const partner = booking.partner;
    const ticket = Array.isArray(booking.ticket) ? booking.ticket[0] : booking.ticket;

    // Fetch return departure if exists
    let returnDeparture: any = null;
    if (booking.return_departure_id) {
      const { data: retDep } = await supabase
        .from("departures")
        .select(`
          departure_date,
          departure_time,
          route:routes!departures_route_id_fkey (
            origin_port:ports!routes_origin_port_id_fkey (name),
            destination_port:ports!routes_destination_port_id_fkey (name)
          )
        `)
        .eq("id", booking.return_departure_id)
        .single();
      returnDeparture = retDep;
    }

    // Fetch partner settings
    const { data: partnerSettings } = await supabase
      .from("partner_settings")
      .select("email_booking_confirmation, whatsapp_booking_confirmation, whatsapp_attach_ticket")
      .eq("partner_id", booking.partner_id)
      .single();

    const emailEnabled = partnerSettings?.email_booking_confirmation ?? true;
    const whatsappEnabled = partnerSettings?.whatsapp_booking_confirmation ?? false;
    const whatsappAttachTicket = partnerSettings?.whatsapp_attach_ticket ?? false;

    // Fetch custom templates
    const templates = await fetchPartnerTemplates(supabase, booking.partner_id);

    // Format dates
    const departureDate = new Date(departure.departure_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Build ticket URL
    const ticketUrl = `${supabaseUrl.replace('.supabase.co', '')}/ticket/${ticket?.qr_token || booking.id}`;

    // Generate and upload ticket for WhatsApp attachment if enabled
    let ticketFileUrl: string | null = null;
    if (whatsappAttachTicket && fonnteToken) {
      const ticketHtml = generateTicketHtml(booking, customer, departure, partner, ticket, returnDeparture);
      ticketFileUrl = await uploadTicketPdf(supabase, booking.id, ticketHtml);
      console.log("Ticket uploaded for WhatsApp attachment:", ticketFileUrl);
    }

    // Build return info
    let returnInfo = "";
    if (returnDeparture) {
      const returnDate = new Date(returnDeparture.departure_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      returnInfo = `
    <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <h3 style="margin: 0 0 15px 0; color: #166534;">🔄 Return Trip</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;"><strong>📍 Route</strong></td>
          <td style="padding: 8px 0; text-align: right;">${returnDeparture.route.origin_port.name} → ${returnDeparture.route.destination_port.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>📅 Date</strong></td>
          <td style="padding: 8px 0; text-align: right;">${returnDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>⏰ Departure</strong></td>
          <td style="padding: 8px 0; text-align: right;"><strong>${returnDeparture.departure_time}</strong></td>
        </tr>
      </table>
    </div>`;
    }

    let returnInfoWhatsapp = "";
    if (returnDeparture) {
      const returnDate = new Date(returnDeparture.departure_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      returnInfoWhatsapp = `
🔄 *Return Trip:*
${returnDeparture.route.origin_port.name} → ${returnDeparture.route.destination_port.name}
${returnDate} at ${returnDeparture.departure_time}`;
    }

    // Prepare template data
    const templateData: TemplateData = {
      customer_name: customer.full_name,
      customer_email: customer.email || "N/A",
      customer_phone: customer.phone || "N/A",
      booking_ref: booking.id.substring(0, 8).toUpperCase(),
      booking_date: new Date().toLocaleDateString("en-GB"),
      departure_date: departureDate,
      departure_time: departure.departure_time,
      origin_port: departure.route.origin_port.name,
      destination_port: departure.route.destination_port.name,
      trip_name: departure.trip?.trip_name || "",
      pax_adult: String(booking.pax_adult),
      pax_child: String(booking.pax_child),
      pax_total: String(booking.pax_adult + booking.pax_child),
      total_amount: booking.total_amount.toLocaleString(),
      currency: booking.currency,
      partner_name: partner.name,
      partner_phone: partner.contact_phone || "",
      partner_email: partner.contact_email || "",
      ticket_url: ticketFileUrl || ticketUrl,
      return_info: returnInfo,
    };

    const templateDataWhatsapp = { ...templateData, return_info: returnInfoWhatsapp };

    const results = {
      emailsSent: 0,
      whatsappSent: 0,
      ticketAttached: false,
      errors: [] as string[],
    };

    // Send email to customer
    if (emailEnabled && customer.email && resend) {
      try {
        const template = getTemplateContent(templates, 'booking_confirmation_email_customer');
        const emailHtml = replacePlaceholders(template.content, templateData);
        const emailSubject = replacePlaceholders(template.subject || '', templateData);

        await resend.emails.send({
          from: "SriBooking <noreply@sribooking.com>",
          to: [customer.email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("Customer confirmation email sent");
        results.emailsSent++;
      } catch (err) {
        console.error("Error sending customer email:", err);
        results.errors.push(`Customer email: ${String(err)}`);
      }
    }

    // Send email to partner
    if (emailEnabled && partner.contact_email && resend) {
      try {
        const template = getTemplateContent(templates, 'booking_confirmation_email_partner');
        const emailHtml = replacePlaceholders(template.content, templateData);
        const emailSubject = replacePlaceholders(template.subject || '', templateData);

        await resend.emails.send({
          from: "SriBooking <noreply@sribooking.com>",
          to: [partner.contact_email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("Partner confirmation email sent");
        results.emailsSent++;
      } catch (err) {
        console.error("Error sending partner email:", err);
        results.errors.push(`Partner email: ${String(err)}`);
      }
    }

    // Send WhatsApp to customer (with attachment if enabled)
    if (whatsappEnabled && customer.phone && fonnteToken) {
      try {
        const template = getTemplateContent(templates, 'booking_confirmation_whatsapp_customer');
        const message = replacePlaceholders(template.content, templateDataWhatsapp);

        await sendWhatsApp(fonnteToken, customer.phone, message, ticketFileUrl || undefined);

        console.log("Customer WhatsApp sent", ticketFileUrl ? "with attachment" : "without attachment");
        results.whatsappSent++;
        if (ticketFileUrl) results.ticketAttached = true;
      } catch (err) {
        console.error("Error sending customer WhatsApp:", err);
        results.errors.push(`Customer WhatsApp: ${String(err)}`);
      }
    }

    // Send WhatsApp to partner
    const partnerWhatsAppNumber = partner.whatsapp_number
      ? `${partner.whatsapp_country_code || '+62'}${partner.whatsapp_number}`
      : null;

    if (whatsappEnabled && partnerWhatsAppNumber && fonnteToken) {
      try {
        const template = getTemplateContent(templates, 'booking_confirmation_whatsapp_partner');
        const message = replacePlaceholders(template.content, templateDataWhatsapp);

        await sendWhatsApp(fonnteToken, partnerWhatsAppNumber, message);

        console.log("Partner WhatsApp sent");
        results.whatsappSent++;
      } catch (err) {
        console.error("Error sending partner WhatsApp:", err);
        results.errors.push(`Partner WhatsApp: ${String(err)}`);
      }
    }

    console.log("Booking confirmation completed:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
