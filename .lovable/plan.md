

# Phase 5 - Reports & Settings Accommodation

## Vue d'ensemble

Les deux derniers placeholders du module Accommodation : la page Reports (analytics de performance) et la page Settings (configuration business partagee avec le partner existant).

---

## 5.1 Page Reports (refonte complete)

Remplacer le placeholder actuel par une page fonctionnelle avec des metriques reelles basees sur les reservations.

### Nouveau hook : `useAccommodationReportsData`

**Fonctionnalites** :
- Filtres par plage de dates (dateFrom / dateTo)
- `summary` : metriques cles calculees a partir de `accommodation_bookings`
  - Revenue totale (confirmed + completed)
  - Nombre de reservations confirmees
  - Nuits totales reservees
  - Taux d'occupation (nuits reservees / nuits disponibles x nombre de proprietes)
  - Valeur moyenne par reservation
- `revenueByAccommodation` : ventilation du revenu et des reservations par propriete (top properties)
- `bookingsByChannel` : repartition par canal (walk-in, whatsapp, other)
- `bookingsByStatus` : repartition par statut (confirmed, cancelled, completed)

**Fichier** : `src/hooks/useAccommodationReportsData.ts` (nouveau)

### Page Reports

**Elements** :
- Filtres en haut : plage de dates (From / To) avec valeurs par defaut (30 derniers jours)
- 5 cartes KPI : Revenue, Bookings confirmes, Nuits reservees, Taux d'occupation, Valeur moyenne
- Tableau "Top Properties" : nom de la propriete, nombre de reservations, nuits, revenu
- Deux graphiques simples via recharts :
  - Repartition par canal (PieChart ou BarChart horizontal)
  - Repartition par statut (PieChart)

**Fichier** : `src/pages/accommodation-dashboard/AccommodationReportsPage.tsx` (refonte)

---

## 5.2 Page Settings (refonte complete)

Le module Accommodation reutilise les informations business du partenaire existant (table `partners` et `partner_settings`). La page Settings doit permettre la gestion de ces infos, adaptee au contexte hebergement.

### Approche

Reutiliser le hook `useSettingsData` existant (deja utilise par les dashboards Boat et Activity). Pas de nouveau hook necessaire.

### Page Settings

**Structure avec 3 onglets** :
1. **Business** : Meme formulaire que les autres dashboards (Business Info + Contact + Banking), reutilisant `useSettingsData`
2. **Cancellation** : Politique d'annulation (reutiliser `CancellationSettingsForm`)
3. **Team** : Gestion du personnel (reutiliser `StaffList`)

On n'inclut pas les onglets Tickets, Payments online, Terms ou Notifications car ils sont specifiques aux modules Boat/Activity et non pertinents pour l'Accommodation (pas de billets, pas de paiement en ligne pour le moment).

**Fichier** : `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx` (refonte)

---

## Resume technique

### Nouveaux fichiers (1)
- `src/hooks/useAccommodationReportsData.ts`

### Fichiers modifies (2)
- `src/pages/accommodation-dashboard/AccommodationReportsPage.tsx` (refonte complete)
- `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx` (refonte complete)

### Pas de migration SQL
Toutes les donnees necessaires existent deja dans les tables `accommodation_bookings`, `accommodations`, `partners`, et `partner_settings`.

### Pas de nouvelle edge function
Les reports se calculent cote client a partir des donnees existantes.

### Dependances reutilisees
- `recharts` (deja installe) pour les graphiques
- `useSettingsData` pour la page Settings
- `CancellationSettingsForm` et `StaffList` pour les onglets Settings

