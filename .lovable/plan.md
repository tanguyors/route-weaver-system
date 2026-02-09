

# Feature 3 : Notifications Accommodation

## Vue d'ensemble

Ajouter un systeme de notifications email et WhatsApp pour les reservations d'hebergement, en repliquant le pattern existant du module Boat. Cela inclut :
- Confirmation de reservation (email + WhatsApp) pour le guest et le partenaire
- Rappel de check-in (email + WhatsApp) pour le guest et le partenaire
- Templates personnalisables dans les settings Accommodation
- Edge function dediee pour l'envoi des notifications

---

## 3.1 Templates par defaut et types

Ajouter 8 nouveaux types de templates dans le hook `useNotificationTemplatesData` :

**Booking Confirmation Accommodation** (4 templates) :
- `acc_booking_confirmation_email_customer` : Email au guest avec details du sejour
- `acc_booking_confirmation_email_partner` : Email au partenaire avec infos guest
- `acc_booking_confirmation_whatsapp_customer` : WhatsApp au guest
- `acc_booking_confirmation_whatsapp_partner` : WhatsApp au partenaire

**Check-in Reminder Accommodation** (4 templates) :
- `acc_checkin_reminder_email_customer` : Email de rappel 24h avant le check-in
- `acc_checkin_reminder_email_partner` : Email de rappel au partenaire
- `acc_checkin_reminder_whatsapp_customer` : WhatsApp rappel au guest
- `acc_checkin_reminder_whatsapp_partner` : WhatsApp rappel au partenaire

**Variables specifiques Accommodation** :
- `{{guest_name}}`, `{{guest_email}}`, `{{guest_phone}}`
- `{{accommodation_name}}`, `{{accommodation_type}}`
- `{{checkin_date}}`, `{{checkout_date}}`, `{{checkin_time}}`, `{{checkout_time}}`
- `{{total_nights}}`, `{{guests_count}}`
- `{{total_amount}}`, `{{currency}}`
- `{{partner_name}}`, `{{partner_phone}}`, `{{partner_email}}`
- `{{booking_ref}}`, `{{channel}}`

**Fichier modifie** : `src/hooks/useNotificationTemplatesData.ts`
- Etendre le type `TemplateType` avec les 8 nouveaux types
- Ajouter les templates par defaut (HTML pour email, texte pour WhatsApp)
- Ajouter les variables specifiques accommodation dans `TEMPLATE_VARIABLES`
- Ajouter les sample data correspondantes dans `SAMPLE_DATA`

---

## 3.2 Edge Function : `send-accommodation-booking-confirmation`

Nouvelle edge function qui envoie les notifications de confirmation pour les reservations accommodation.

**Logique** :
1. Recoit `booking_id` en POST
2. Charge les details de la reservation (`accommodation_bookings` + `accommodations` + `partners`)
3. Charge les templates personnalises du partenaire (ou fallback sur les defauts)
4. Envoie email au guest via Resend (si email configure)
5. Envoie email au partenaire via Resend
6. Envoie WhatsApp au guest via Fonnte (si numero configure)
7. Envoie WhatsApp au partenaire via Fonnte
8. Respecte les settings `email_booking_confirmation` et `whatsapp_booking_confirmation` du partenaire

**Fichier** : `supabase/functions/send-accommodation-booking-confirmation/index.ts` (nouveau)

---

## 3.3 Edge Function : `send-accommodation-checkin-reminders`

Nouvelle edge function pour les rappels de check-in, appelee par un cron ou manuellement.

**Logique** :
1. Cherche toutes les reservations confirmees avec un check-in dans ~24h
2. Verifie qu'un rappel n'a pas deja ete envoie (via une table de logs ou un champ sur la reservation)
3. Envoie email + WhatsApp au guest et au partenaire
4. Marque le rappel comme envoye

**Fichier** : `supabase/functions/send-accommodation-checkin-reminders/index.ts` (nouveau)

---

## 3.4 Migration SQL : Table de logs des rappels

Creer une table pour tracker les rappels envoyes et eviter les doublons.

```sql
CREATE TABLE public.accommodation_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES accommodation_bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  channel text NOT NULL,
  recipient text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, reminder_type, channel, recipient)
);

ALTER TABLE accommodation_reminder_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view own reminder logs"
  ON accommodation_reminder_logs FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM accommodation_bookings
      WHERE partner_id IN (
        SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 3.5 Integration dans le hook de creation de booking

Modifier `useAccommodationBookingsData.ts` pour appeler l'edge function `send-accommodation-booking-confirmation` apres la creation reussie d'une reservation.

**Changement** : Dans `createBooking()`, apres l'insertion en base + blocage du calendrier, appeler :
```typescript
supabase.functions.invoke('send-accommodation-booking-confirmation', {
  body: { booking_id: booking.id }
});
```
(Appel non-bloquant pour ne pas ralentir la creation)

---

## 3.6 Integration dans les Settings Accommodation

Modifier `AccommodationSettingsPage.tsx` pour ajouter un onglet "Notifications" avec :

1. **Toggles de notification** : activer/desactiver email et WhatsApp pour les confirmations et rappels (reutilise le pattern `NotificationSettingsForm`)
2. **Editeur de templates** : reutilise `NotificationTemplatesEditor` adapte avec les categories Accommodation (Booking Confirmations + Check-in Reminders)

**Nouveau composant** : `AccommodationNotificationTemplatesEditor` - wrapper autour de `NotificationTemplatesEditor` qui filtre les templates specifiques accommodation.

**Fichier modifie** : `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx`
- Ajouter l'onglet "Notifications" (icone Bell)
- Passer de 3 a 4 onglets dans le TabsList

---

## Resume technique

### Migration SQL (1)
- Table `accommodation_reminder_logs` (tracking des rappels envoyes)

### Nouveaux fichiers (3)
- `supabase/functions/send-accommodation-booking-confirmation/index.ts`
- `supabase/functions/send-accommodation-checkin-reminders/index.ts`
- `src/components/accommodation/AccommodationNotificationTemplatesEditor.tsx`

### Fichiers modifies (3)
- `src/hooks/useNotificationTemplatesData.ts` (8 nouveaux types + templates + variables)
- `src/hooks/useAccommodationBookingsData.ts` (appel edge function apres creation)
- `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx` (onglet Notifications)

### Infrastructure reutilisee
- Table `notification_templates` (deja creee, accepte tout `template_type` text)
- Table `partner_settings` (toggles email/whatsapp existants)
- Secrets `RESEND_API_KEY` et `FONNTE_API_TOKEN` (deja configures)
- Composants `NotificationTemplatesEditor`, `TemplateEditor`, `TemplatePreview`, `VariablesList`

