

# Phase 3 & Phase 4 - iCal Bidirectionnel + Bookings Accommodation

## Vue d'ensemble

Ce plan couvre les deux phases restantes du module Accommodation :
- **Phase 3** : Synchronisation iCal bidirectionnelle (export + import + CRON)
- **Phase 4** : Gestion des reservations (online/offline) + Dashboard dynamique

---

## Phase 3 - iCal Bidirectionnel

### 3.1 Edge Function : `generate-ical-export`

Nouvelle backend function qui genere un fichier `.ics` a partir des donnees du calendrier d'une accommodation.

**Endpoint** : `GET /generate-ical-export?token={ical_token}`

**Logique** :
1. Recevoir le `ical_token` (UUID) en query param
2. Trouver l'accommodation correspondante via la table `accommodations.ical_token`
3. Lire toutes les entrees `accommodation_calendar` avec status `booked_sribooking`, `booked_external` ou `blocked`
4. Generer un fichier iCalendar (.ics) conforme RFC 5545 avec :
   - `VCALENDAR` header (prodid Sribooking)
   - Un `VEVENT` par date ou plage de dates consecutives
   - `DTSTART` / `DTEND` en format DATE (pas DATETIME, convention hebergement)
   - `SUMMARY` : "Booked - Sribooking" ou "Blocked"
5. Retourner avec `Content-Type: text/calendar`

**Fichiers** :
- `supabase/functions/generate-ical-export/index.ts` (nouveau)
- `supabase/config.toml` (ajouter `[functions.generate-ical-export]` avec `verify_jwt = false`)

### 3.2 Edge Function : `sync-ical-imports`

Backend function qui importe les calendriers iCal externes et met a jour le calendrier interne.

**Endpoint** : `POST /sync-ical-imports` (appele manuellement ou par CRON)

**Logique** :
1. Lister tous les `accommodation_ical_imports` avec `is_active = true`
2. Pour chaque import :
   - Fetch l'URL iCal externe
   - Parser les events VEVENT (DTSTART/DTEND)
   - Supprimer les anciennes entrees `accommodation_calendar` de source correspondante (airbnb/booking/other) pour cette accommodation
   - Inserer les nouvelles dates avec status `booked_external` et la source appropriee
   - Mettre a jour `last_sync_at`, `last_sync_status`, `last_sync_error`
3. Gerer les erreurs par import (un echec ne bloque pas les autres)

**Fichiers** :
- `supabase/functions/sync-ical-imports/index.ts` (nouveau)
- `supabase/config.toml` (ajouter `[functions.sync-ical-imports]` avec `verify_jwt = false`)

### 3.3 Hook : `useAccommodationIcalData`

Nouveau hook pour gerer les imports iCal cote frontend.

**Fonctionnalites** :
- `icalImports` : liste des imports pour une accommodation
- `createIcalImport(data)` : ajouter un lien iCal externe
- `updateIcalImport(id, data)` : modifier un import
- `deleteIcalImport(id)` : supprimer un import
- `toggleIcalImport(id)` : activer/desactiver
- `triggerSync(accommodationId)` : declencher une synchro manuelle via la backend function

**Fichier** : `src/hooks/useAccommodationIcalData.ts` (nouveau)

### 3.4 Page iCal Sync (refonte complete)

Remplacer le placeholder actuel par une page fonctionnelle avec :

**Section 1 - Export iCal (en haut)** :
- Selecteur d'accommodation
- Champ en lecture seule avec le lien iCal permanent : `{SUPABASE_URL}/functions/v1/generate-ical-export?token={ical_token}`
- Bouton "Copy Link"
- Bloc pedagogique inline :
  - Titre : "Connect Sribooking with Airbnb / Booking"
  - Etapes : 1. Ouvrir Airbnb > 2. Calendar > Import > 3. Coller le lien
  - Note : "This is done once only. Sribooking keeps everything in sync."

**Section 2 - Import iCal (en bas)** :
- Liste des imports existants avec : plateforme, URL (tronquee), statut derniere synchro, date derniere synchro, toggle actif/inactif
- Bouton "Add iCal Import" ouvrant un dialogue avec :
  - Select plateforme (Airbnb / Booking.com / Other)
  - Champ URL iCal
- Bouton "Sync Now" pour declencher une synchro manuelle
- Indicateur de statut (OK / Error) avec message d'erreur si applicable

**Fichier** : `src/pages/accommodation-dashboard/AccommodationIcalSyncPage.tsx` (refonte)

---

## Phase 4 - Bookings + Dashboard Dynamique

### 4.1 Hook : `useAccommodationBookingsData`

Nouveau hook pour gerer les reservations accommodation.

**Fonctionnalites** :
- `bookings` : liste des reservations avec filtre par accommodation, statut, date
- `createBooking(data)` : creer une reservation avec blocage automatique du calendrier
  - Verifier que toutes les dates sont disponibles
  - Inserer la reservation
  - Creer les entrees `accommodation_calendar` pour chaque nuit (checkin a checkout-1) avec status `booked_sribooking`
- `updateBookingStatus(id, status)` : confirmer, annuler, completer
  - Si annulation : supprimer les entrees calendrier associees
- `stats` : statistiques pour le dashboard (total bookings, revenue, nights booked)

**Fichier** : `src/hooks/useAccommodationBookingsData.ts` (nouveau)

### 4.2 Page Bookings (refonte complete)

Remplacer le placeholder par une page fonctionnelle :

**Elements** :
- Bouton "New Booking" (reservation offline/manuelle)
- Filtres : accommodation, statut (all/confirmed/cancelled/completed), canal, plage de dates
- Tableau : Guest Name, Accommodation, Check-in, Check-out, Nights, Total, Channel, Status, Actions
- Badges de statut colores (confirmed=vert, cancelled=rouge, draft=gris, completed=bleu)
- Actions par ligne : View details, Confirm, Cancel

**Dialogue "New Booking"** :
- Select accommodation
- Dates check-in / check-out (avec validation disponibilite)
- Infos guest : nom, email, telephone, nombre de guests
- Canal : Walk-in, WhatsApp, Other
- Prix total (auto-calcule : nights x price_per_night, modifiable)
- Notes
- Bouton Create

**Fichier** : `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` (refonte)

### 4.3 Dashboard Dynamique (refonte)

Remplacer les valeurs statiques "0" par des donnees reelles :

**Cartes de stats** :
- Total Properties : nombre d'accommodations actives
- Nights Booked : total de nuits reservees ce mois
- Bookings : nombre de reservations actives (confirmed)
- Revenue : somme des montants des reservations confirmees ce mois

**Section inferieure** :
- Prochaines reservations (5 max) avec nom du guest, accommodation, dates
- Ou message "Start by adding your first accommodation" si aucune accommodation

**Fichier** : `src/pages/accommodation-dashboard/AccommodationDashboard.tsx` (refonte)

---

## Resume technique

### Nouveaux fichiers (5)
- `supabase/functions/generate-ical-export/index.ts`
- `supabase/functions/sync-ical-imports/index.ts`
- `src/hooks/useAccommodationIcalData.ts`
- `src/hooks/useAccommodationBookingsData.ts`

### Fichiers modifies (4)
- `supabase/config.toml` (2 nouvelles entrees functions)
- `src/pages/accommodation-dashboard/AccommodationIcalSyncPage.tsx` (refonte complete)
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` (refonte complete)
- `src/pages/accommodation-dashboard/AccommodationDashboard.tsx` (refonte complete)

### Pas de migration SQL
Toutes les tables necessaires existent deja (`accommodation_calendar`, `accommodation_ical_imports`, `accommodation_bookings`). Aucune modification de schema.

### Points de securite
- L'export iCal est public mais protege par UUID non listable (token unique par accommodation)
- Le sync iCal utilise le service role key (backend only)
- Les reservations respectent les RLS policies existantes (partner voit uniquement ses donnees)
- La creation de booking verifie la disponibilite avant insertion pour prevenir les doubles reservations

