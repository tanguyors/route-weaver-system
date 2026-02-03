
# Plan: Pickup Reminder Notification System (24h & 12h before)

## Overview
Create an automated system that sends reminder notifications (Email + WhatsApp) to both customers and partners 24 hours and 12 hours before a scheduled pickup. The system will only trigger for bookings that include a pickup service.

---

## Architecture

```text
+------------------+     +----------------------+     +------------------+
|   pg_cron job    | --> | send-pickup-reminders| --> |    Resend API    |
| (runs hourly)    |     |    Edge Function     |     |    (Email)       |
+------------------+     +----------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |   Fonnte API     |
                         |   (WhatsApp)     |
                         +------------------+
```

---

## Recommended Providers

### Email: Resend
- Modern, developer-friendly API
- Cost: Free up to 100 emails/day, then $20/month for 50,000 emails
- Easy integration, good deliverability

### WhatsApp: Fonnte
- Indonesian-based service, popular for local businesses
- Cost: Starting from IDR 25,000/month for personal plan
- Simple API, no business verification required
- Alternative: Twilio (more expensive but more reliable internationally)

---

## Implementation Steps

### Step 1: Database Changes
Create a table to track sent notifications and prevent duplicates:

**New Table: `pickup_reminder_logs`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| booking_id | uuid | Reference to booking |
| reminder_type | text | '24h' or '12h' |
| channel | text | 'email' or 'whatsapp' |
| recipient_type | text | 'customer' or 'partner' |
| sent_at | timestamp | When notification was sent |
| status | text | 'sent', 'failed' |
| error_message | text | Error details if failed |

### Step 2: Edge Function - `send-pickup-reminders`

**Logic:**
1. Query all confirmed bookings with pickup addons where:
   - Pickup time is within 24-25 hours from now (for 24h reminder)
   - Pickup time is within 12-13 hours from now (for 12h reminder)
   - No reminder already sent for this booking/type combination
2. For each eligible booking:
   - Calculate exact pickup time from departure time - pickup_before_departure_minutes
   - Send Email via Resend to customer + partner
   - Send WhatsApp via Fonnte to customer + partner (if phone available)
   - Log the notification in `pickup_reminder_logs`

**Data to include in notifications:**
- Customer name
- Pickup date and time
- Pickup address/hotel
- Pickup area (city)
- Vehicle type (car/bus)
- Departure port
- Trip details (route, departure time)
- Partner contact info (for customer)
- Customer phone (for partner)

### Step 3: Scheduled Cron Job
Set up a pg_cron job to run the edge function every hour to check for upcoming pickups.

### Step 4: Secrets Required
You will need to provide:
- **RESEND_API_KEY**: For sending emails (get from resend.com)
- **FONNTE_API_TOKEN**: For sending WhatsApp (get from fonnte.com)

---

## Email Template Structure

**Subject:** Pickup Reminder - [X hours] before your trip to [Destination]

**Content:**
- Greeting with customer name
- Pickup time (bold, prominent)
- Pickup location details
- Trip summary
- Driver/partner contact info
- Important reminders (be ready on time, bring ticket, etc.)

---

## WhatsApp Message Structure

```text
🚗 PICKUP REMINDER

Hi [Name]!

Your pickup is scheduled for:
📅 [Date] at [Time]
📍 [Address], [City]
🚐 [Vehicle Type]

Going to: [Destination Port] → [Final Destination]
Departure: [Departure Time]

Please be ready 10 minutes before pickup time.

Questions? Contact: [Partner Phone]

Booking ref: [Booking ID]
```

---

## Technical Details

### Pickup Time Calculation
```typescript
// Get departure datetime
const departureDateTime = new Date(`${departure_date}T${departure_time}`);

// Extract minutes from pickup_info.pickup_note (e.g., "60 min before departure")
const minutesBefore = extractMinutes(pickup_info.pickup_note);

// Calculate pickup time
const pickupDateTime = new Date(departureDateTime.getTime() - minutesBefore * 60000);
```

### Files to Create/Modify

1. **New Edge Function**: `supabase/functions/send-pickup-reminders/index.ts`
   - Query eligible bookings
   - Send notifications via Resend + Fonnte
   - Log results

2. **Database Migration**: 
   - Create `pickup_reminder_logs` table
   - Enable pg_cron and pg_net extensions
   - Create cron schedule

3. **Partner Settings** (optional enhancement):
   - Add toggle for pickup reminders in notification settings
   - `pickup_reminder_24h_enabled`, `pickup_reminder_12h_enabled`

---

## Cost Estimate

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Resend | 100 emails/day | $20/month for 50,000 |
| Fonnte | 10 messages/day | IDR 25,000/month (~$1.50) |

For a small to medium business (100-200 pickups/month), the free tiers should be sufficient for testing. Production usage would cost approximately $20-25/month total.

---

## Next Steps After Approval

1. I'll ask you to configure the API keys for Resend and Fonnte
2. Create the database table for logging reminders
3. Build the edge function with email and WhatsApp integration
4. Set up the hourly cron job
5. Test the complete flow
