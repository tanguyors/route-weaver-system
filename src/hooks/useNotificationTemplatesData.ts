import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TemplateType = 
  | 'pickup_reminder_email_customer'
  | 'pickup_reminder_email_partner'
  | 'pickup_reminder_whatsapp_customer'
  | 'pickup_reminder_whatsapp_partner'
  | 'booking_confirmation_email_customer'
  | 'booking_confirmation_email_partner'
  | 'booking_confirmation_whatsapp_customer'
  | 'booking_confirmation_whatsapp_partner'
  // Accommodation templates
  | 'acc_booking_confirmation_email_customer'
  | 'acc_booking_confirmation_email_partner'
  | 'acc_booking_confirmation_whatsapp_customer'
  | 'acc_booking_confirmation_whatsapp_partner'
  | 'acc_checkin_reminder_email_customer'
  | 'acc_checkin_reminder_email_partner'
  | 'acc_checkin_reminder_whatsapp_customer'
  | 'acc_checkin_reminder_whatsapp_partner';

export interface NotificationTemplate {
  id: string;
  partner_id: string;
  template_type: TemplateType;
  subject: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Template placeholder variables - Boat module
export const TEMPLATE_VARIABLES = [
  { key: '{{customer_name}}', label: 'Customer Name', description: "Nom du client" },
  { key: '{{pickup_date}}', label: 'Pickup Date', description: "Date du pickup (ex: Lundi 5 février 2026)" },
  { key: '{{pickup_time}}', label: 'Pickup Time', description: "Heure du pickup (ex: 08:30)" },
  { key: '{{pickup_location}}', label: 'Pickup Location', description: "Adresse/hôtel de pickup" },
  { key: '{{pickup_area}}', label: 'Pickup Area', description: "Zone de pickup (ville)" },
  { key: '{{vehicle_type}}', label: 'Vehicle Type', description: "Type de véhicule (Car/Bus)" },
  { key: '{{origin_port}}', label: 'Origin Port', description: "Port de départ" },
  { key: '{{destination_port}}', label: 'Destination Port', description: "Port d'arrivée" },
  { key: '{{departure_time}}', label: 'Departure Time', description: "Heure de départ du ferry" },
  { key: '{{partner_name}}', label: 'Partner Name', description: "Nom du partenaire" },
  { key: '{{partner_phone}}', label: 'Partner Phone', description: "Téléphone du partenaire" },
  { key: '{{customer_phone}}', label: 'Customer Phone', description: "Téléphone du client (pour les messages partenaire)" },
  { key: '{{booking_ref}}', label: 'Booking Ref', description: "Référence de réservation" },
  { key: '{{hours_before}}', label: 'Hours Before', description: '"24 hours" ou "12 hours"' },
];

// Accommodation-specific template variables
export const ACC_TEMPLATE_VARIABLES = [
  { key: '{{guest_name}}', label: 'Guest Name', description: "Nom du guest" },
  { key: '{{guest_email}}', label: 'Guest Email', description: "Email du guest" },
  { key: '{{guest_phone}}', label: 'Guest Phone', description: "Téléphone du guest" },
  { key: '{{accommodation_name}}', label: 'Accommodation Name', description: "Nom de l'hébergement" },
  { key: '{{accommodation_type}}', label: 'Accommodation Type', description: "Type d'hébergement (villa, room, etc.)" },
  { key: '{{checkin_date}}', label: 'Check-in Date', description: "Date de check-in (ex: Lundi 5 février 2026)" },
  { key: '{{checkout_date}}', label: 'Check-out Date', description: "Date de check-out" },
  { key: '{{checkin_time}}', label: 'Check-in Time', description: "Heure de check-in (ex: 14:00)" },
  { key: '{{checkout_time}}', label: 'Check-out Time', description: "Heure de check-out (ex: 11:00)" },
  { key: '{{total_nights}}', label: 'Total Nights', description: "Nombre total de nuits" },
  { key: '{{guests_count}}', label: 'Guests Count', description: "Nombre de guests" },
  { key: '{{total_amount}}', label: 'Total Amount', description: "Montant total" },
  { key: '{{currency}}', label: 'Currency', description: "Devise (IDR, USD, etc.)" },
  { key: '{{partner_name}}', label: 'Partner Name', description: "Nom du partenaire" },
  { key: '{{partner_phone}}', label: 'Partner Phone', description: "Téléphone du partenaire" },
  { key: '{{partner_email}}', label: 'Partner Email', description: "Email du partenaire" },
  { key: '{{booking_ref}}', label: 'Booking Ref', description: "Référence de réservation" },
  { key: '{{channel}}', label: 'Channel', description: "Canal de réservation" },
];

// Default templates (used when no custom template exists)
export const DEFAULT_TEMPLATES: Record<TemplateType, { subject?: string; content: string }> = {
  // ===== BOAT MODULE TEMPLATES =====
  pickup_reminder_email_customer: {
    subject: '🚗 Pickup Reminder - {{hours_before}} before your trip',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Pickup Reminder</title></head>
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
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date & Time</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #0ea5e9; font-size: 18px;">{{pickup_date}}<br>{{pickup_time}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Pickup Location</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pickup_location}}<br><span style="color: #666;">{{pickup_area}}</span></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🚗 Vehicle</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{vehicle_type}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>🚢 Trip</strong></td><td style="padding: 10px 0; text-align: right;">{{origin_port}} → {{destination_port}}<br><span style="color: #666;">Departure: {{departure_time}}</span></td></tr>
      </table>
    </div>
    <div style="background: #fef3c7; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> Please be ready at least 10 minutes before the scheduled pickup time.</p></div>
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #065f46;"><strong>📞 Questions?</strong> Contact {{partner_name}}: {{partner_phone}}</p></div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">Have a safe trip! 🌴</p></div>
</body>
</html>`
  },
  
  pickup_reminder_email_partner: {
    subject: '🚗 Pickup Reminder - {{hours_before}} - {{customer_name}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Pickup Reminder - Partner</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Pickup Alert</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{hours_before}} - Customer Pickup Required</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Customer Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Customer Name</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{customer_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📱 Phone</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><a href="tel:{{customer_phone}}" style="color: #0ea5e9;">{{customer_phone}}</a></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Pickup Time</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #f97316; font-size: 18px;">{{pickup_date}}<br>{{pickup_time}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Pickup Location</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pickup_location}}<br><span style="color: #666;">{{pickup_area}}</span></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🚗 Vehicle Type</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{vehicle_type}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>🚢 Trip</strong></td><td style="padding: 10px 0; text-align: right;">{{origin_port}} → {{destination_port}}<br><span style="color: #666;">Departure: {{departure_time}}</span></td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p></div>
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
  },

  // Boat Booking Confirmation Templates
  booking_confirmation_email_customer: {
    subject: '✅ Booking Confirmed - {{trip_name}} on {{departure_date}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking Confirmation</title></head>
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
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Route</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #10b981;">{{origin_port}} → {{destination_port}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{departure_date}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>⏰ Departure</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{departure_time}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Passengers</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pax_adult}} Adult(s), {{pax_child}} Child(ren)</td></tr>
        <tr><td style="padding: 10px 0;"><strong>💰 Total</strong></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px;">{{currency}} {{total_amount}}</strong></td></tr>
      </table>
    </div>
    {{return_info}}
    <div style="background: #dbeafe; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>🎫 Your E-Ticket</strong></p>
      <a href="{{ticket_url}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View & Download Ticket</a>
    </div>
    <div style="background: #fef3c7; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> Please arrive at the port at least 60 minutes before departure.</p></div>
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #065f46;"><strong>📞 Need help?</strong> Contact {{partner_name}}: {{partner_phone}}</p></div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">Have a safe trip! 🌴</p></div>
</body>
</html>`
  },
  
  booking_confirmation_email_partner: {
    subject: '🆕 New Booking - {{customer_name}} - {{departure_date}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Booking Notification</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🆕 New Booking Received</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">A new booking has been confirmed</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Customer Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Name</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{customer_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📧 Email</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><a href="mailto:{{customer_email}}" style="color: #3b82f6;">{{customer_email}}</a></td></tr>
        <tr><td style="padding: 10px 0;"><strong>📱 Phone</strong></td><td style="padding: 10px 0; text-align: right;"><a href="tel:{{customer_phone}}" style="color: #3b82f6;">{{customer_phone}}</a></td></tr>
      </table>
    </div>
    <h2 style="color: #1e293b;">Trip Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📍 Route</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{origin_port}} → {{destination_port}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Date</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{departure_date}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>⏰ Departure</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{departure_time}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Passengers</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{pax_total}} ({{pax_adult}} Adult, {{pax_child}} Child)</td></tr>
        <tr><td style="padding: 10px 0;"><strong>💰 Total</strong></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px; color: #10b981;">{{currency}} {{total_amount}}</strong></td></tr>
      </table>
    </div>
    {{return_info}}
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p></div>
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
  },

  // ===== ACCOMMODATION MODULE TEMPLATES =====
  acc_booking_confirmation_email_customer: {
    subject: '✅ Booking Confirmed - {{accommodation_name}} | {{checkin_date}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Accommodation Booking Confirmation</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Your stay is all set</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{{guest_name}}</strong>!</p>
    <p>Your accommodation booking has been confirmed. Here are your stay details:</p>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🏠 Accommodation</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #10b981;">{{accommodation_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-in</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkin_date}}<br><span style="color: #666;">from {{checkin_time}}</span></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-out</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkout_date}}<br><span style="color: #666;">before {{checkout_time}}</span></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🌙 Nights</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{total_nights}} night(s)</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Guests</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{guests_count}} guest(s)</td></tr>
        <tr><td style="padding: 10px 0;"><strong>💰 Total</strong></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px;">{{currency}} {{total_amount}}</strong></td></tr>
      </table>
    </div>
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #065f46;"><strong>📞 Need help?</strong> Contact {{partner_name}}: {{partner_phone}}</p></div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">Enjoy your stay! 🏡</p></div>
</body>
</html>`
  },

  acc_booking_confirmation_email_partner: {
    subject: '🏠 New Accommodation Booking - {{guest_name}} | {{checkin_date}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Accommodation Booking</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏠 New Booking</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">A new accommodation booking has been confirmed</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Guest Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Guest Name</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{guest_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📧 Email</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{guest_email}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>📱 Phone</strong></td><td style="padding: 10px 0; text-align: right;">{{guest_phone}}</td></tr>
      </table>
    </div>
    <h2 style="color: #1e293b;">Stay Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🏠 Property</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{accommodation_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-in</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkin_date}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-out</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkout_date}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🌙 Nights</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{total_nights}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👥 Guests</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{guests_count}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📢 Channel</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{channel}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>💰 Total</strong></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 18px; color: #10b981;">{{currency}} {{total_amount}}</strong></td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: <strong>{{booking_ref}}</strong></p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p></div>
</body>
</html>`
  },

  acc_booking_confirmation_whatsapp_customer: {
    content: `✅ *ACCOMMODATION BOOKING CONFIRMED*

Hi {{guest_name}}! 🎉

Your booking has been confirmed.

🏠 *{{accommodation_name}}*
📅 *Check-in:* {{checkin_date}} (from {{checkin_time}})
📅 *Check-out:* {{checkout_date}} (before {{checkout_time}})
🌙 *Nights:* {{total_nights}}
👥 *Guests:* {{guests_count}}
💰 *Total:* {{currency}} {{total_amount}}

📞 Need help? Contact: {{partner_phone}}

Booking ref: {{booking_ref}}`
  },

  acc_booking_confirmation_whatsapp_partner: {
    content: `🏠 *NEW ACCOMMODATION BOOKING*

👤 *Guest:* {{guest_name}}
📱 *Phone:* {{guest_phone}}
📧 *Email:* {{guest_email}}

🏠 *Property:* {{accommodation_name}}
📅 *Check-in:* {{checkin_date}}
📅 *Check-out:* {{checkout_date}}
🌙 *Nights:* {{total_nights}}
👥 *Guests:* {{guests_count}}
📢 *Channel:* {{channel}}
💰 *Total:* {{currency}} {{total_amount}}

Booking ref: {{booking_ref}}`
  },

  acc_checkin_reminder_email_customer: {
    subject: '🏠 Check-in Reminder - {{accommodation_name}} tomorrow!',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Check-in Reminder</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Check-in Tomorrow!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Get ready for your stay</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{{guest_name}}</strong>!</p>
    <p>This is a friendly reminder that your check-in is tomorrow:</p>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🏠 Property</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #0ea5e9;">{{accommodation_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-in</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{checkin_date}}</strong><br>from {{checkin_time}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-out</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkout_date}} before {{checkout_time}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>🌙 Duration</strong></td><td style="padding: 10px 0; text-align: right;">{{total_nights}} night(s)</td></tr>
      </table>
    </div>
    <div style="background: #ecfdf5; border-radius: 10px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #065f46;"><strong>📞 Questions?</strong> Contact {{partner_name}}: {{partner_phone}}</p></div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">Enjoy your stay! 🏡</p></div>
</body>
</html>`
  },

  acc_checkin_reminder_email_partner: {
    subject: '🏠 Check-in Tomorrow - {{guest_name}} at {{accommodation_name}}',
    content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Check-in Reminder - Partner</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Check-in Alert</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Guest arriving tomorrow</p>
  </div>
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #1e293b;">Guest Details</h2>
    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Guest</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="font-size: 18px;">{{guest_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📱 Phone</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{guest_phone}}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>🏠 Property</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>{{accommodation_name}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-in</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: #f97316;">{{checkin_date}}</strong></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Check-out</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">{{checkout_date}}</td></tr>
        <tr><td style="padding: 10px 0;"><strong>👥 Guests</strong></td><td style="padding: 10px 0; text-align: right;">{{guests_count}}</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Booking Reference: {{booking_ref}}</p>
  </div>
  <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;"><p style="color: #94a3b8; margin: 0; font-size: 14px;">SriBooking Partner Notification</p></div>
</body>
</html>`
  },

  acc_checkin_reminder_whatsapp_customer: {
    content: `🏠 *CHECK-IN REMINDER*

Hi {{guest_name}}!

Your check-in is tomorrow!

🏠 *{{accommodation_name}}*
📅 *Check-in:* {{checkin_date}} (from {{checkin_time}})
📅 *Check-out:* {{checkout_date}} (before {{checkout_time}})
🌙 *Duration:* {{total_nights}} night(s)

📞 Questions? Contact: {{partner_phone}}

Booking ref: {{booking_ref}}`
  },

  acc_checkin_reminder_whatsapp_partner: {
    content: `🏠 *CHECK-IN ALERT - Tomorrow*

👤 *Guest:* {{guest_name}}
📱 *Phone:* {{guest_phone}}

🏠 *Property:* {{accommodation_name}}
📅 *Check-in:* {{checkin_date}}
📅 *Check-out:* {{checkout_date}}
👥 *Guests:* {{guests_count}}

Booking ref: {{booking_ref}}`
  },
};

// Sample data for preview - Boat module
export const SAMPLE_DATA: Record<string, string> = {
  customer_name: 'Jean Dupont',
  customer_email: 'jean.dupont@email.com',
  pickup_date: 'Lundi 5 février 2026',
  pickup_time: '08:30',
  pickup_location: 'Grand Hyatt Hotel',
  pickup_area: 'Sanur',
  vehicle_type: 'Private Car',
  origin_port: 'Sanur Harbor',
  destination_port: 'Nusa Penida',
  departure_time: '09:30',
  departure_date: 'Lundi 5 février 2026',
  partner_name: 'SriBooking Tours',
  partner_phone: '+62 812 3456 7890',
  partner_email: 'contact@sribooking.com',
  customer_phone: '+33 6 12 34 56 78',
  booking_ref: 'ABC12345',
  hours_before: '24 hours',
  trip_name: 'Fast Boat to Nusa Penida',
  pax_adult: '2',
  pax_child: '1',
  pax_total: '3',
  total_amount: '450,000',
  currency: 'IDR',
  ticket_url: 'https://sribooking.com/ticket/ABC12345',
  return_info: '',
};

// Accommodation-specific sample data
export const ACC_SAMPLE_DATA: Record<string, string> = {
  guest_name: 'Marie Martin',
  guest_email: 'marie.martin@email.com',
  guest_phone: '+33 6 98 76 54 32',
  accommodation_name: 'Sunset Villa Nusa Penida',
  accommodation_type: 'villa',
  checkin_date: 'Samedi 7 février 2026',
  checkout_date: 'Mardi 10 février 2026',
  checkin_time: '14:00',
  checkout_time: '11:00',
  total_nights: '3',
  guests_count: '2',
  total_amount: '3,600,000',
  currency: 'IDR',
  partner_name: 'SriBooking Stays',
  partner_phone: '+62 812 3456 7890',
  partner_email: 'stays@sribooking.com',
  booking_ref: 'ACC78901',
  channel: 'SriBooking',
};

export const useNotificationTemplatesData = (partnerId: string | null) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (partnerId) {
      fetchTemplates();
    }
  }, [partnerId]);

  const fetchTemplates = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('partner_id', partnerId);

      if (error) throw error;
      setTemplates((data || []) as NotificationTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates de notification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemplate = (templateType: TemplateType): NotificationTemplate | null => {
    return templates.find(t => t.template_type === templateType) || null;
  };

  const getEffectiveTemplate = (templateType: TemplateType): { subject?: string; content: string } => {
    const customTemplate = getTemplate(templateType);
    if (customTemplate && customTemplate.is_active) {
      return {
        subject: customTemplate.subject || undefined,
        content: customTemplate.content,
      };
    }
    return DEFAULT_TEMPLATES[templateType];
  };

  const saveTemplate = async (
    templateType: TemplateType,
    content: string,
    subject?: string | null
  ): Promise<boolean> => {
    if (!partnerId) return false;
    
    setSaving(true);
    try {
      const existingTemplate = getTemplate(templateType);

      if (existingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update({
            content,
            subject,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert({
            partner_id: partnerId,
            template_type: templateType,
            content,
            subject,
            is_active: true,
          });

        if (error) throw error;
      }

      await fetchTemplates();
      
      toast({
        title: 'Succès',
        description: 'Template enregistré avec succès',
      });
      
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetTemplate = async (templateType: TemplateType): Promise<boolean> => {
    if (!partnerId) return false;
    
    setSaving(true);
    try {
      const existingTemplate = getTemplate(templateType);

      if (existingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .delete()
          .eq('id', existingTemplate.id);

        if (error) throw error;
      }

      await fetchTemplates();
      
      toast({
        title: 'Succès',
        description: 'Template réinitialisé par défaut',
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réinitialiser le template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplateActive = async (templateType: TemplateType, isActive: boolean): Promise<boolean> => {
    if (!partnerId) return false;
    
    setSaving(true);
    try {
      const existingTemplate = getTemplate(templateType);

      if (existingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTemplate.id);

        if (error) throw error;
      }

      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to replace placeholders with sample data
  const replaceWithSampleData = (content: string, useAccData = false): string => {
    let result = content;
    const data = useAccData ? ACC_SAMPLE_DATA : SAMPLE_DATA;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  return {
    templates,
    loading,
    saving,
    getTemplate,
    getEffectiveTemplate,
    saveTemplate,
    resetTemplate,
    toggleTemplateActive,
    replaceWithSampleData,
    refetch: fetchTemplates,
  };
};
