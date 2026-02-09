

# Feature 5 : Integration Admin pour Accommodation

## Vue d'ensemble

Le panel Admin ne voit actuellement que les donnees du module Boat. Il faut integrer les donnees Accommodation pour que l'admin ait une vue complete de la plateforme :
- Voir les reservations accommodation dans le dashboard admin
- Suivre les commissions accommodation
- Voir la liste des reservations accommodation
- Avoir des statistiques globales incluant tous les modules

---

## 5.1 Mise a jour du Admin Dashboard

**Fichier** : `src/hooks/useAdminDashboardData.ts`

Le hook actuel ne compte que les `bookings` (boat) et les `commission_records` (boat). Il faut ajouter :
- Comptage des `accommodation_bookings` dans le total bookings
- Somme des `accommodation_commission_records.platform_fee_amount` dans le platform revenue
- Ajout des reservations accommodation recentes dans l'activite recente

**Changements** :
- Ajouter des requetes paralleles pour `accommodation_bookings` (count) et `accommodation_commission_records` (sum platform_fee_amount)
- Ajouter les reservations accommodation recentes dans le flux d'activite (type "accommodation_booking")
- Fusionner les totaux : `totalBookings = boatBookings + accommodationBookings`, `platformRevenue = boatCommissions + accommodationCommissions`

**Fichier** : `src/pages/admin/AdminDashboard.tsx`

- Ajouter une icone pour le type "accommodation_booking" dans `ActivityIcon`

---

## 5.2 Page Admin : Reservations Accommodation

**Fichier** : `src/pages/admin/AdminAccommodationBookingsPage.tsx` (nouveau)

Page permettant a l'admin de voir toutes les reservations accommodation de tous les partenaires.

**Structure** :
- Filtres : partenaire, statut, canal, dates
- Tableau avec colonnes : Date, Guest, Property, Partner, Check-in, Check-out, Nights, Amount, Status
- Badge de statut colore (confirmed = vert, cancelled = rouge, completed = bleu)

---

## 5.3 Page Admin : Commissions Accommodation

**Fichier** : `src/pages/admin/AdminAccommodationCommissionsPage.tsx` (nouveau)

Page repliquant le pattern de `AdminCommissionsPage` mais pour les donnees accommodation.

**Structure** :
- KPI Cards : Platform Revenue, Gross Volume, Partner Earnings, Transactions count
- Filtres : partenaire, periode, dates custom
- Onglets :
  - "By Partner" : regroupement par partenaire avec totaux
  - "By Day" : regroupement quotidien
  - "Payment History" : liste des `accommodation_payments`
  - "Commission Details" : liste des `accommodation_commission_records`
- Export CSV pour paiements et commissions

---

## 5.4 Navigation Admin

**Fichier** : `src/components/layouts/DashboardLayout.tsx`

Ajouter dans `adminNavItems` :
- "Accom. Bookings" (icone Home, href `/admin/accommodation-bookings`)
- "Accom. Commissions" (icone Percent, href `/admin/accommodation-commissions`)

Ces items s'ajoutent entre "Commissions" et "Withdrawals" dans le menu admin.

**Fichier** : `src/App.tsx`

Ajouter les routes :
- `/admin/accommodation-bookings` vers `AdminAccommodationBookingsPage`
- `/admin/accommodation-commissions` vers `AdminAccommodationCommissionsPage`

---

## Resume technique

### Nouveaux fichiers (2)
- `src/pages/admin/AdminAccommodationBookingsPage.tsx` : liste admin de toutes les reservations accommodation
- `src/pages/admin/AdminAccommodationCommissionsPage.tsx` : commissions et paiements accommodation pour l'admin

### Fichiers modifies (3)
- `src/hooks/useAdminDashboardData.ts` : ajouter les compteurs accommodation (bookings + commissions) et les activites recentes
- `src/components/layouts/DashboardLayout.tsx` : ajouter 2 items dans la navigation admin
- `src/App.tsx` : ajouter 2 routes admin accommodation

### Aucune migration SQL necessaire
Les tables `accommodation_bookings`, `accommodation_payments` et `accommodation_commission_records` existent deja avec les bonnes politiques RLS. L'admin (via son role) a deja acces a toutes les donnees.

### Infrastructure reutilisee
- Pattern identique a `AdminCommissionsPage` pour la page commissions accommodation
- Pattern identique a `AdminDashboard` pour les stats fusionnees
- Composants UI existants (Card, Table, Badge, Tabs, Select)

### Etape suivante apres Feature 5
**Feature 6 : Codes de reduction Accommodation** - Ajouter un systeme de codes promo/reduction specifique au module accommodation (table `accommodation_discounts`, gestion dans le dashboard partenaire, application lors de la creation de booking).

