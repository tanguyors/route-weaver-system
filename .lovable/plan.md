
# Refonte du Module Accommodation : Niveau Booking.com / Airbnb

## Contexte

Le module actuel traite chaque hebergement comme une entite unique et plate. Cela fonctionne pour les villas, mais pas pour les hotels qui ont plusieurs types de chambres avec des inventaires distincts. De plus, il manque un systeme de **tarification degressive** automatique (plus le sejour est long, moins cher la nuit) et le widget public necessite des ameliorations pour atteindre le niveau Booking.com.

---

## 1. Nouvelle table : `accommodation_rooms` (types de chambres)

Permet a un hotel de definir plusieurs types de chambres (Standard, Deluxe, Suite...), chacun avec son prix, sa capacite et son **stock** (nombre de chambres de ce type).

**Pour les villas :** Pas de changement. Une villa n'aura simplement pas de chambres -- elle reste reservable en entier comme aujourd'hui.

**Pour les hotels :** Le partenaire cree des types de chambres sous l'hebergement. Chaque type a son propre prix/nuit, capacite, stock, et photos.

```text
Table: accommodation_rooms
- id (uuid, PK)
- accommodation_id (FK -> accommodations)
- partner_id (FK -> partners)
- name (text) -- ex: "Deluxe Double", "Suite Oceanview"
- description (text, nullable)
- capacity (integer, default 2)
- bed_type (text) -- ex: "double", "twin", "king", "single"
- quantity (integer, default 1) -- nombre de chambres de ce type
- price_per_night (numeric)
- currency (text, default 'IDR')
- minimum_nights (integer, default 1)
- amenities (jsonb, default '[]')
- status (text, default 'active')
- display_order (integer, default 0)
- created_at, updated_at
```

**Impact sur les bookings :** La table `accommodation_bookings` recevra une colonne nullable `room_id` (FK -> accommodation_rooms). Pour les villas, `room_id = NULL`. Pour les hotels, `room_id` identifie le type de chambre reserve.

**Impact sur le calendrier :** La table `accommodation_calendar` recevra une colonne nullable `room_id`. Pour les villas, le fonctionnement reste identique (1 entree par date). Pour les hotels, on a 1 entree par date **par chambre reservee**, et la disponibilite est calculee en comparant le nombre d'entrees "booked" avec le `quantity` du type de chambre.

---

## 2. Nouvelle table : `accommodation_room_images`

Photos dediees par type de chambre, meme pattern que `accommodation_images`.

```text
Table: accommodation_room_images
- id (uuid, PK)
- room_id (FK -> accommodation_rooms)
- partner_id (FK -> partners)
- image_url (text)
- file_path (text, nullable)
- display_order (integer, default 0)
- created_at
```

---

## 3. Nouveau systeme : Tarification degressive (`accommodation_price_tiers`)

Permet au partenaire de definir des paliers de prix automatiques en fonction de la duree du sejour. S'applique a un hebergement (villa) ou a un type de chambre (hotel).

```text
Table: accommodation_price_tiers
- id (uuid, PK)
- accommodation_id (FK -> accommodations)
- room_id (FK -> accommodation_rooms, nullable) -- null = s'applique a la villa entiere
- partner_id (FK -> partners)
- min_nights (integer) -- a partir de X nuits
- price_per_night (numeric) -- prix/nuit pour ce palier
- currency (text)
- status (text, default 'active')
- created_at, updated_at
```

**Exemple concret :**
| Palier | Nuits min | Prix/nuit |
|--------|-----------|-----------|
| Base   | 1         | 150 USD   |
| Semaine| 7         | 120 USD   |
| Mois   | 28        | 90 USD    |

Le systeme selectionne automatiquement le palier le plus avantageux dont le `min_nights` est inferieur ou egal a la duree du sejour. Ce calcul intervient avant les reductions (early bird, last minute, promo code).

---

## 4. Modifications de la base existante (Migration SQL)

```text
-- 1. Creer la table accommodation_rooms
-- 2. Creer la table accommodation_room_images  
-- 3. Creer la table accommodation_price_tiers
-- 4. Ajouter room_id nullable a accommodation_bookings
-- 5. Ajouter room_id nullable a accommodation_calendar
-- 6. RLS policies pour les 3 nouvelles tables (meme pattern que accommodations)
```

---

## 5. Modifications du formulaire de creation/edition

### Fichier modifie : `AccommodationFormPage.tsx`

**Changements :**
- Quand le type est **"hotel"** : afficher un onglet/section supplementaire "Room Types" permettant d'ajouter/editer/supprimer des types de chambres avec : nom, description, type de lit, capacite, quantite, prix/nuit, amenites
- **Pour tous les types** : nouvelle section "Price Tiers" (tarification degressive) avec un tableau editable de paliers (nuits min + prix/nuit)
- Chaque type de chambre pourra avoir sa propre galerie photos

### Nouveau hook : `useAccommodationRoomsData.ts`
- CRUD pour `accommodation_rooms` et `accommodation_room_images`
- Meme pattern que `useAccommodationsData`

### Nouveau hook : `useAccommodationPriceTiersData.ts`
- CRUD pour `accommodation_price_tiers`
- Fonction `getEffectivePrice(accommodationId, roomId, nights)` retournant le prix/nuit effectif

---

## 6. Mise a jour de la logique de disponibilite

### Pour les villas (room_id = null)
Aucun changement. 1 villa = 1 unite reservable.

### Pour les hotels (room_id present)
La disponibilite d'un type de chambre pour une date donnee est :
```text
disponible = quantity - nombre_de_bookings_actifs_pour_cette_date
```
On ne bloque la date dans le calendrier que si toutes les chambres de ce type sont prises.

### Fichiers impactes :
- `accommodation-widget-data` (edge function) : retourner les rooms avec leurs disponibilites
- `create-accommodation-booking` (edge function) : gerer room_id, verifier stock, calculer prix degressif
- `useAccommodationWidgetData.ts` : adapter les helpers
- `useAccommodationCalendarData.ts` : adapter pour les rooms
- `useAccommodationBookingsData.ts` : gerer room_id

---

## 7. Widget public ameliore

### Fichier modifie : `AccommodationWidgetPage.tsx`

**Nouveau flux UX :**

1. **Liste des proprietes** (inchange pour les villas)
2. **Pour un hotel** : apres selection de l'hotel, afficher la **liste des types de chambres** avec photos, prix, capacite, stock restant
3. **Selection du type de chambre** (ou directement pour les villas)
4. **Calendrier de disponibilites** avec les dates bloquees specifiques au room type
5. **Tarification degressive visible** : afficher les paliers de prix a cote du calendrier ("7+ nuits : -20%", "28+ nuits : -40%")
6. **Recapitulatif ameliore** montrant :
   - Prix de base par nuit
   - Prix degressif applique (si applicable)
   - Reduction automatique (early bird, last minute, long stay)
   - Code promo
   - Total final
7. **Formulaire client** et confirmation (inchange)

---

## 8. Page dashboard "Bookings" mise a jour

### Fichier modifie : `AccommodationBookingsPage.tsx`

- Afficher le nom de la chambre dans la table des reservations (si hotel)
- Dans le formulaire de nouvelle reservation offline, permettre de selectionner un type de chambre quand l'accommodation est un hotel

---

## Resume technique

### Migration SQL (1)
- 3 nouvelles tables : `accommodation_rooms`, `accommodation_room_images`, `accommodation_price_tiers`
- 2 colonnes ajoutees : `room_id` sur `accommodation_bookings` et `accommodation_calendar`
- Policies RLS associees

### Nouveaux fichiers (2)
- `src/hooks/useAccommodationRoomsData.ts`
- `src/hooks/useAccommodationPriceTiersData.ts`

### Fichiers modifies (7)
- `src/pages/accommodation-dashboard/AccommodationFormPage.tsx` : sections Rooms + Price Tiers
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` : colonne room + filtre
- `src/pages/accommodation-widget/AccommodationWidgetPage.tsx` : flux room selection + affichage prix degressif
- `src/hooks/useAccommodationWidgetData.ts` : adapter pour rooms et price tiers
- `src/hooks/useAccommodationBookingsData.ts` : room_id
- `supabase/functions/accommodation-widget-data/index.ts` : rooms + price tiers
- `supabase/functions/create-accommodation-booking/index.ts` : stock check + degressive pricing

### Logique de priorite tarifaire
```text
1. Prix degressif (tiers) -> determine le prix/nuit de base
2. Reductions automatiques (early bird, last minute, long stay) -> appliquees sur le total
3. Code promo -> applique sur le total apres reductions auto
```
