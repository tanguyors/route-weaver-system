
# Feature 6 : Codes de reduction Accommodation

## Vue d'ensemble

Ajouter un systeme de codes promo et reductions automatiques dedie au module Accommodation. Le systeme sera plus simple que celui du module Boat car les hebergements n'ont pas de concepts de trips/routes/schedules. Les categories de reduction seront adaptees au contexte accommodation (reduction par nuit, sejour minimum, early bird, last minute, etc.).

---

## 6.1 Migration SQL : Tables accommodation_discounts et accommodation_discount_usage

Deux nouvelles tables dediees au module accommodation.

```text
+----------------------------------+       +----------------------------------+
| accommodation_discounts          |       | accommodation_discount_usage     |
+----------------------------------+       +----------------------------------+
| id (uuid PK)                    |       | id (uuid PK)                    |
| partner_id (uuid FK)             |       | discount_id (uuid FK)            |
| code (text, nullable)            |       | booking_id (uuid FK, nullable)   |
| type (text: promo_code/automatic)|       | customer_email (text, nullable)  |
| category (text)                  |       | customer_phone (text, nullable)  |
| discount_value (numeric)         |       | discounted_amount (numeric)      |
| discount_value_type (text: %/fix)|       | partner_id (uuid)                |
| book_start_date (date, nullable) |       | used_at (timestamptz)            |
| book_end_date (date, nullable)   |       +----------------------------------+
| checkin_start_date (date, null.) |
| checkin_end_date (date, nullable)|
| minimum_spend (numeric)         |
| min_nights (integer, nullable)   |   <-- specifique accommodation
| applicable_accommodation_ids     |   <-- filtre par propriete
| individual_use_only (boolean)    |
| usage_limit (integer, nullable)  |
| limit_per_customer (integer)     |
| usage_count (integer, default 0) |
| total_discounted_amount (numeric)|
| status (text: active/inactive)   |
| created_at, updated_at           |
+----------------------------------+
```

**Categories adaptees a l'accommodation** :
- `booking_fixed` : Montant fixe sur la reservation
- `booking_percent` : Pourcentage sur la reservation
- `per_night_fixed` : Montant fixe par nuit
- `per_night_percent` : Pourcentage par nuit
- `early_bird` : Reduction si reserve X jours avant le check-in
- `last_minute` : Reduction si reserve proche du check-in
- `long_stay` : Reduction pour sejours de X nuits minimum

Champ specifique : `early_bird_days` (nombre de jours avant check-in pour early bird) et `last_minute_days` (pour last minute).

**Politiques RLS** :
- Les partenaires ne voient que leurs propres reductions (via `partner_id` + `partner_users`)
- Le service role a un acces complet

---

## 6.2 Hook : `useAccommodationDiscountsData`

Nouveau hook repliquant le pattern de `useDiscountsData` mais adapte au module accommodation.

**Fichier** : `src/hooks/useAccommodationDiscountsData.ts` (nouveau)

**Fonctionnalites** :
- CRUD complet sur `accommodation_discounts`
- Fetch des usages depuis `accommodation_discount_usage`
- Toggle de statut (active/inactive)
- Categories specifiques accommodation (ACCOM_DISCOUNT_CATEGORIES)
- Audit logging via `audit_logs`

---

## 6.3 Page : `AccommodationDiscountsPage`

Nouvelle page dans le dashboard accommodation, repliquant le pattern de la page `DiscountsPage` du module boat.

**Fichier** : `src/pages/accommodation-dashboard/AccommodationDiscountsPage.tsx` (nouveau)

**Structure** :
- Cartes KPI : Total, Active, Uses, Amount discounted
- Onglets : "Promo Codes" / "Automatic"
- Liste avec actions : Edit, Delete, Toggle Status, View Usage
- Dialog de creation/edition adapte aux categories accommodation
- Modal d'historique d'utilisation

Le formulaire sera integre directement dans la page (dialog) avec les champs specifiques par categorie :
- Pour `early_bird` : champ "Days before check-in"
- Pour `last_minute` : champ "Days before check-in"
- Pour `long_stay` : champ "Minimum nights"
- Pour `per_night_*` : le montant s'applique par nuit
- Option de filtrage par accommodation specifique

---

## 6.4 Application du discount lors du booking

Modification de `AccommodationBookingsPage.tsx` pour permettre l'application d'un code promo lors de la creation d'un booking.

**Changements** :
- Ajouter un champ "Promo Code" dans le dialog de creation de booking
- Bouton "Apply" pour verifier et appliquer le code
- Affichage du montant de reduction et du nouveau total
- A la confirmation : enregistrer l'usage dans `accommodation_discount_usage` et mettre a jour `usage_count` + `total_discounted_amount` dans `accommodation_discounts`

La verification du code promo inclut :
- Code actif et dans la periode de validite (book dates + checkin dates)
- Usage limit non atteinte
- Minimum spend respecte
- Min nights respecte
- Accommodation applicable (si filtre)

---

## 6.5 Navigation et routes

**Fichier** : `src/components/layouts/AccommodationDashboardLayout.tsx`
- Ajouter "Discounts" dans la navigation (icone Tag, entre Bookings et iCal Sync)

**Fichier** : `src/App.tsx`
- Ajouter la route `/accommodation-dashboard/discounts`

---

## Resume technique

### Migration SQL (1)
- Tables `accommodation_discounts` + `accommodation_discount_usage` avec RLS et index

### Nouveaux fichiers (2)
- `src/hooks/useAccommodationDiscountsData.ts` : hook CRUD + validation
- `src/pages/accommodation-dashboard/AccommodationDiscountsPage.tsx` : page complete avec formulaire, liste, usage modal

### Fichiers modifies (3)
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` : champ promo code dans le dialog de creation
- `src/components/layouts/AccommodationDashboardLayout.tsx` : nav item "Discounts"
- `src/App.tsx` : route `/accommodation-dashboard/discounts`

### Etape suivante apres Feature 6
**Feature 7 : Widget de reservation Accommodation** - Creer un widget public permettant aux visiteurs de rechercher des disponibilites et reserver directement un hebergement (similaire au widget de reservation bateau mais adapte aux sejours).
