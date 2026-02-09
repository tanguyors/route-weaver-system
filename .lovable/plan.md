

# Feature 7 : Widget de Reservation Accommodation

## Vue d'ensemble

Creer un systeme de widget public permettant aux visiteurs de rechercher des disponibilites et reserver un hebergement directement, similaire au widget fastboat existant mais adapte au contexte des sejours (dates check-in/check-out, calendrier de disponibilites, galerie photos, etc.).

Le widget sera accessible via une route publique `/accommodation/:widgetKey` et pourra etre integre en iframe sur le site du partenaire.

---

## 7.1 Migration SQL : Ajouter "accommodation" au type widget

L'enum `widget_type` ne contient actuellement que `fastboat` et `activity`. Il faut ajouter `accommodation`.

**Migration** :
```text
ALTER TYPE widget_type ADD VALUE 'accommodation';
```

Cela permet de reutiliser la table `widgets` existante avec la contrainte unique `(partner_id, widget_type)`.

---

## 7.2 Edge Function : `accommodation-widget-data`

Nouvelle Edge Function pour fournir les donnees publiques d'un widget accommodation.

**Fichier** : `supabase/functions/accommodation-widget-data/index.ts`

**Logique** :
1. Valider le `widget_key` dans la table `widgets` (type = accommodation, status = active)
2. Recuperer les donnees publiques du partenaire en parallele :
   - Infos partenaire (nom, logo)
   - Liste des `accommodations` actives avec images (`accommodation_images`)
   - Calendrier de disponibilites pour les 6 prochains mois (`accommodation_calendar`)
   - Reductions automatiques actives (`accommodation_discounts` type = automatic)
3. Retourner un JSON structure avec cache HTTP (5 min)

**Donnees retournees** :
```text
{
  partner_id, theme_config,
  accommodations: [
    { id, name, type, description, capacity, bedrooms, bathrooms, amenities,
      city, country, price_per_night, currency, minimum_nights,
      checkin_time, checkout_time,
      images: [{ id, image_url, display_order }],
      blocked_dates: ["2026-02-15", "2026-02-16", ...] }
  ],
  automatic_discounts: [...]
}
```

Les dates bloquees sont les dates ayant un statut != 'available' dans `accommodation_calendar` (booked_sribooking, booked_external, blocked).

---

## 7.3 Edge Function : `create-accommodation-booking`

Nouvelle Edge Function pour creer une reservation depuis le widget public.

**Fichier** : `supabase/functions/create-accommodation-booking/index.ts`

**Logique** :
1. Valider le `widget_key`
2. Valider l'hebergement (actif, appartient au partenaire)
3. Verifier la disponibilite de toutes les dates (check-in a check-out - 1)
4. Calculer le prix : `price_per_night * nights`
5. Appliquer le code promo si fourni (via `accommodation_discounts`)
6. Appliquer les reductions automatiques si applicables
7. Creer le `accommodation_booking` (status = confirmed, channel = online_widget)
8. Bloquer les dates dans `accommodation_calendar` (status = booked_sribooking)
9. Creer les enregistrements de commission (`accommodation_commission_records`)
10. Envoyer la notification de confirmation (via `send-accommodation-booking-confirmation`)
11. Si promo code utilise : enregistrer l'usage dans `accommodation_discount_usage`

**Payload attendu** :
```text
{
  widget_key, accommodation_id,
  checkin_date, checkout_date, guests_count,
  customer: { name, email, phone, country },
  promo_code?: string
}
```

---

## 7.4 Hook : `useAccommodationWidgetData`

Nouveau hook client pour le widget public.

**Fichier** : `src/hooks/useAccommodationWidgetData.ts`

**Fonctionnalites** :
- Fetch des donnees via l'edge function `accommodation-widget-data`
- Cache en memoire (5 min TTL, meme pattern que `useWidgetBooking`)
- Helpers : `getAvailableDates(accommodationId)`, `isDateAvailable(accommodationId, date)`, `calculatePrice(accommodationId, checkin, checkout)`
- Fonction `createBooking(...)` appelant l'edge function `create-accommodation-booking`
- Gestion de la validation du code promo

---

## 7.5 Page Widget Public : `AccommodationWidgetPage`

Nouveau composant pour le widget public accessible via `/accommodation/:widgetKey`.

**Fichier** : `src/pages/accommodation-widget/AccommodationWidgetPage.tsx`

**Experience utilisateur en une seule page (scroll vertical)** :

1. **En-tete** : Logo partenaire + nom
2. **Liste des proprietes** : Grille de cartes avec image principale, nom, type, ville, prix/nuit, capacite
3. **Selection d'une propriete** : Carrousel d'images, description, equipements, details
4. **Selecteur de dates** : Calendrier interactif montrant les disponibilites (vert = disponible, gris = bloque/reserve)
   - Selection check-in puis check-out
   - Respect du minimum_nights
   - Exclusion des dates passees et bloquees
5. **Nombre d'invites** : Selecteur avec max = capacite
6. **Recapitulatif** : Nuits x prix/nuit, code promo, total
7. **Formulaire client** : Nom, email, telephone, pays
8. **Confirmation** : Message de succes avec details de la reservation

**UX** : Le widget s'adapte a l'iframe (utilise `useIframeHeightMessenger`). Le flux est un scroll vertical continu sans pagination d'etapes pour simplifier l'experience accommodation.

---

## 7.6 Page de configuration widget (Dashboard partenaire)

Nouveau hook et page pour configurer le widget accommodation depuis le dashboard partenaire.

**Fichier** : `src/hooks/useAccommodationWidgetConfigData.ts`

Hook repliquant le pattern de `useWidgetConfigData` mais avec `widget_type = 'accommodation'`. Inclut la creation/lecture/mise a jour du widget, la gestion des domaines autorises, et la generation des codes embed.

**Fichier** : `src/pages/accommodation-dashboard/AccommodationWidgetPage.tsx`

Page permettant au partenaire de :
- Activer/desactiver le widget
- Personnaliser les couleurs du theme
- Gerer les domaines autorises
- Copier le code embed (iframe) et le lien direct
- Previsualiser le widget

---

## 7.7 Navigation et routes

**Fichier** : `src/components/layouts/AccommodationDashboardLayout.tsx`
- Ajouter "Widget" dans la navigation (icone Globe, entre iCal Sync et Reports)

**Fichier** : `src/App.tsx`
- Route publique : `/accommodation/:widgetKey` vers `AccommodationWidgetPage`
- Route dashboard : `/accommodation-dashboard/widget` vers la page de configuration

---

## Resume technique

### Migration SQL (1)
- Ajout de `'accommodation'` a l'enum `widget_type`

### Nouvelles Edge Functions (2)
- `supabase/functions/accommodation-widget-data/index.ts` : donnees publiques du widget
- `supabase/functions/create-accommodation-booking/index.ts` : creation de reservation publique

### Nouveaux fichiers front-end (4)
- `src/hooks/useAccommodationWidgetData.ts` : hook pour le widget public
- `src/hooks/useAccommodationWidgetConfigData.ts` : hook pour la configuration du widget
- `src/pages/accommodation-widget/AccommodationWidgetPage.tsx` : page widget publique
- `src/pages/accommodation-dashboard/AccommodationWidgetPage.tsx` : page de configuration

### Fichiers modifies (2)
- `src/components/layouts/AccommodationDashboardLayout.tsx` : nav item "Widget"
- `src/App.tsx` : 2 nouvelles routes

### Infrastructure reutilisee
- Table `widgets` existante (avec nouveau type enum)
- Table `accommodation_calendar` pour les disponibilites
- Table `accommodation_bookings` pour les reservations
- Table `accommodation_discounts` pour les codes promo
- Table `accommodation_commission_records` pour les commissions
- Edge function `send-accommodation-booking-confirmation` pour les notifications
- Hook `useIframeHeightMessenger` pour l'integration iframe
- Pattern de cache identique a `useWidgetBooking`

### Etape suivante apres Feature 7
**Feature 8 : Notification Templates Accommodation** - Enrichir le systeme de templates de notifications pour couvrir les rappels de check-in, les messages post-sejour, et les relances d'avis client.

