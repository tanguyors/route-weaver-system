
# Module Accommodation - Plan d'implementation

Ce projet est tres volumineux. Pour garantir la qualite et eviter les erreurs, l'implementation sera decoupee en **4 phases** progressives. Ce plan couvre la **Phase 1** (fondations) et la **Phase 2** (CRUD hebergements + calendrier), qui constituent le coeur fonctionnel minimum viable.

---

## Vue d'ensemble des phases

```text
Phase 1 - Fondations (cette iteration)
  Base de donnees + integration module_type + routing + layout

Phase 2 - CRUD Accommodations + Calendar
  Formulaire creation/edition + calendrier interne + blocage dates

Phase 3 - iCal Bidirectionnel
  Export iCal + Import iCal + Edge function CRON sync

Phase 4 - Bookings + Rates + Widget
  Reservations online/offline + tarifs + widget public
```

---

## Phase 1 - Fondations

### 1.1 Base de donnees (Migration SQL)

**Ajout de la valeur `accommodation` dans l'enum `module_type`** pour que le systeme de modules existant (`partner_modules`) supporte le nouveau type.

**Nouvelles tables :**

- **`accommodations`** : table principale des hebergements
  - `id` (uuid, PK)
  - `partner_id` (uuid, FK partners)
  - `name` (text, NOT NULL)
  - `type` (text : villa, hotel, guesthouse, homestay, apartment)
  - `description` (text)
  - `capacity` (integer, max guests)
  - `bedrooms` (integer)
  - `bathrooms` (integer)
  - `amenities` (jsonb, tableau de strings : WiFi, AC, Pool, etc.)
  - `address` (text)
  - `city` (text)
  - `country` (text, default 'Indonesia')
  - `latitude` / `longitude` (numeric, nullable)
  - `status` (text : draft / active / inactive, default 'draft')
  - `price_per_night` (numeric, default 0)
  - `minimum_nights` (integer, default 1)
  - `checkin_time` (time, default '14:00')
  - `checkout_time` (time, default '11:00')
  - `ical_token` (uuid, unique, pour export iCal securise)
  - `created_at`, `updated_at`

- **`accommodation_images`** : galerie photos
  - `id`, `accommodation_id` (FK), `partner_id` (FK), `image_url`, `display_order`, `created_at`

- **`accommodation_calendar`** : etats jour par jour
  - `id`, `accommodation_id` (FK), `partner_id` (FK), `date` (date), `status` (available / booked_sribooking / booked_external / blocked), `source` (text : sribooking / airbnb / booking / manual / other), `booking_id` (uuid, nullable), `note` (text), `created_at`, `updated_at`
  - Contrainte unique : `(accommodation_id, date)`

- **`accommodation_ical_imports`** : liens iCal externes
  - `id`, `accommodation_id` (FK), `partner_id` (FK), `platform_name` (text : airbnb / booking / other), `ical_url` (text), `is_active` (boolean, default true), `last_sync_at` (timestamptz), `last_sync_status` (text : ok / error), `last_sync_error` (text), `created_at`, `updated_at`

- **`accommodation_bookings`** : reservations
  - `id`, `accommodation_id` (FK), `partner_id` (FK), `checkin_date`, `checkout_date`, `guest_name`, `guest_email`, `guest_phone`, `guests_count`, `total_nights`, `total_amount`, `currency` (default 'IDR'), `status` (draft / confirmed / cancelled / completed), `channel` (online / offline_walkin / offline_whatsapp / offline_other), `notes`, `cancelled_at`, `created_at`, `updated_at`

**Politiques RLS :**
- Toutes les tables : partner voit uniquement ses donnees (via `user_belongs_to_partner`), admin voit tout
- `accommodation_calendar` en lecture publique uniquement pour les lignes liees a une accommodation active (pour le futur widget)
- iCal export endpoint : acces public via token UUID (pas de RLS, c'est une edge function)

**Fonctions de base de donnees :**
- `set_accommodation_partner()` : trigger pour auto-remplir `partner_id` sur les sous-tables
- `partner_has_module('accommodation')` : deja gere par la fonction existante apres ajout enum

### 1.2 Mise a jour du systeme de modules

Fichiers concernes :

- **`src/hooks/usePartnerModules.ts`** : ajouter `'accommodation'` au type `ModuleType`
- **`src/components/ModuleProtectedRoute.tsx`** : ajouter le cas `'accommodation'` pour le nom affiche
- **`src/pages/ModuleSelector.tsx`** : ajouter la carte Accommodation (icone `Home`, gradient violet/indigo)
- **`src/pages/Auth.tsx`** : ajouter le choix "Accommodation Provider" dans la selection de modules a l'inscription
- **`src/components/admin/PartnerDetailModal.tsx`** : ajouter l'icone et le label pour le module accommodation
- **`src/pages/admin/AdminPartnersPage.tsx`** : ajouter le filtre accommodation dans la liste admin
- **`src/pages/ModuleNotEnabled.tsx`** : deja generique, pas de changement

### 1.3 Layout et Routing

**Nouveau fichier : `src/components/layouts/AccommodationDashboardLayout.tsx`**
- Meme structure que `ActivityDashboardLayout` avec :
  - Icone : `Home` (lucide)
  - Gradient : violet/indigo (`from-violet-500 to-indigo-600`)
  - Menu lateral : Dashboard, Accommodations, Calendar, Bookings, iCal Sync, Reports, Settings

**Nouveaux fichiers pages :**
- `src/pages/accommodation-dashboard/AccommodationDashboard.tsx` : page d'accueil avec stats
- `src/pages/accommodation-dashboard/AccommodationListPage.tsx` : liste des hebergements
- `src/pages/accommodation-dashboard/AccommodationFormPage.tsx` : creation/edition
- `src/pages/accommodation-dashboard/AccommodationCalendarPage.tsx` : calendrier
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` : reservations
- `src/pages/accommodation-dashboard/AccommodationIcalSyncPage.tsx` : config iCal
- `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx` : parametres

**Mise a jour de `src/App.tsx` :**
- Ajouter toutes les routes `/accommodation-dashboard/*` protegees par `<ModuleProtectedRoute requiredModule="accommodation">`

---

## Phase 2 - CRUD Accommodations + Calendar

### 2.1 Hooks de donnees

**Nouveaux hooks :**
- `src/hooks/useAccommodationsData.ts` : CRUD accommodations (liste, create, update, delete, toggle status)
- `src/hooks/useAccommodationImagesData.ts` : gestion galerie images (upload, reorder, delete)
- `src/hooks/useAccommodationCalendarData.ts` : lecture/ecriture calendrier, blocage dates manuelles
- `src/hooks/useAccommodationBookingsData.ts` : liste et gestion des reservations
- `src/hooks/useAccommodationIcalData.ts` : CRUD des imports iCal

### 2.2 Page Liste Accommodations

- Tableau avec colonnes : Image, Nom, Type, Capacite, Prix/nuit, Statut, Actions
- Filtres : recherche texte, type, statut
- Actions : Edit, Duplicate, Activate/Deactivate, Delete (soft)
- Pattern identique a `ActivityProductsPage`

### 2.3 Formulaire Creation/Edition

Formulaire multi-sections :
- **Informations generales** : nom, type (select), description (textarea)
- **Capacite** : max guests, bedrooms, bathrooms
- **Amenities** : grille de checkboxes (WiFi, AC, Pool, Kitchen, Parking, Hot Water, TV, Garden, etc.)
- **Localisation** : adresse, ville, pays, map (optionnel)
- **Galerie images** : upload drag-and-drop avec reorder (meme composant que `ProductImageGallery`)
- **Tarifs** : prix par nuit, minimum nights, check-in/check-out times
- **Statut** : Draft / Active / Inactive

### 2.4 Calendrier Interne

- Vue mensuelle avec grille de jours
- Chaque jour affiche son statut en couleur :
  - Vert = Available
  - Bleu = Booked (Sribooking)
  - Orange = Booked (External iCal)
  - Rouge = Blocked (Manual)
- Click sur un jour ou selection de plage pour bloquer/debloquer manuellement
- Selecteur d'accommodation en haut si le partenaire en a plusieurs

---

## Phase 3 (future iteration) - iCal Bidirectionnel

- Edge function `generate-ical-export` : genere le fichier .ics a partir de `accommodation_calendar`
- Edge function `sync-ical-imports` : CRON qui fetch les URLs iCal externes, parse les events, met a jour `accommodation_calendar`
- Page UI iCal Sync avec tutorial inline, copie du lien export, gestion des imports
- Config CRON dans `supabase/config.toml`

## Phase 4 (future iteration) - Bookings + Rates

- Reservations online + offline avec formulaire
- Prevention doubles reservations via verification calendrier
- Tarifs saisonniers (optionnel v2)
- Widget public de reservation

---

## Resume des fichiers a creer/modifier

**Nouveaux fichiers (environ 15) :**
- 1 layout
- 7 pages
- 5 hooks
- 1 composant formulaire
- 1 composant galerie images (reutilisation possible)

**Fichiers modifies (environ 7) :**
- `usePartnerModules.ts` (type ModuleType)
- `ModuleProtectedRoute.tsx` (label accommodation)
- `ModuleSelector.tsx` (carte accommodation)
- `Auth.tsx` (checkbox inscription)
- `PartnerDetailModal.tsx` (icone accommodation)
- `AdminPartnersPage.tsx` (filtre module)
- `App.tsx` (routes)

**Migration SQL :**
- 1 migration avec : ALTER TYPE enum, 5 tables, triggers, RLS policies, mise a jour de `create_partner_with_modules`

L'implementation commencera par la Phase 1 (fondations) puis enchaînera sur la Phase 2 (CRUD + calendrier) dans la meme iteration.
