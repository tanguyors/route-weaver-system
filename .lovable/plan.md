
# Feature 4 : Transactions & Paiements Accommodation

## Vue d'ensemble

Ajouter un systeme de suivi financier pour le module Accommodation, permettant aux partenaires de :
- Voir tous les paiements recus pour leurs reservations
- Suivre les commissions prelevees par la plateforme
- Consulter leur solde disponible
- Demander des retraits (withdrawals)

Ce systeme replique le pattern du module Boat (`useTransactionsData` + `TransactionsPage`) adapte aux reservations d'hebergement.

---

## 4.1 Migration SQL : Tables financieres Accommodation

Creer les tables dediees pour les paiements et commissions accommodation.

```text
+------------------------------+       +----------------------------------+
| accommodation_payments       |       | accommodation_commission_records |
+------------------------------+       +----------------------------------+
| id (uuid PK)                |       | id (uuid PK)                    |
| partner_id (uuid FK)         |       | partner_id (uuid FK)            |
| booking_id (uuid FK)         |       | booking_id (uuid FK)            |
| amount (numeric)             |       | gross_amount (numeric)          |
| currency (text)              |       | platform_fee_percent (numeric)  |
| method (text)                |       | platform_fee_amount (numeric)   |
| status (text)                |       | partner_net_amount (numeric)    |
| paid_at (timestamptz)        |       | currency (text)                 |
| notes (text)                 |       | created_at (timestamptz)        |
| created_at (timestamptz)     |       +----------------------------------+
+------------------------------+
```

**Tables** :
- `accommodation_payments` : enregistre chaque paiement (cash, transfer, card) lie a une reservation
- `accommodation_commission_records` : calcule automatiquement la commission plateforme sur chaque paiement

**Politiques RLS** :
- Les partenaires ne voient que leurs propres enregistrements (via `partner_id` + `partner_users`)
- Le service role a un acces complet pour les edge functions

---

## 4.2 Hook : `useAccommodationTransactionsData`

Nouveau hook qui gere toute la logique financiere du module Accommodation.

**Fonctionnalites** :
- Charge les paiements avec jointure sur `accommodation_bookings` (guest_name, accommodation name)
- Charge les commissions avec les memes jointures
- Calcule le resume financier : revenu brut, commissions, solde disponible, montant retire
- Permet d'enregistrer un nouveau paiement pour une reservation
- Permet de demander un retrait (withdrawal) via la table `withdrawal_requests` existante
- Separe les paiements cash vs online pour le calcul du solde

**Fichier** : `src/hooks/useAccommodationTransactionsData.ts` (nouveau)

---

## 4.3 Page : `AccommodationTransactionsPage`

Nouvelle page avec 3 onglets et des cartes KPI en haut.

**Structure** :
- **Cartes KPI** (en haut) :
  - Revenu brut total
  - Commission plateforme
  - Solde disponible
  - Montant retire
- **Onglet "Payments"** : liste des paiements avec filtres (date, statut, methode)
- **Onglet "Commissions"** : detail des commissions par reservation
- **Onglet "Withdrawals"** : historique des demandes de retrait + bouton "Request Withdrawal"

**Elements visuels** :
- Badge de statut colore (paid = vert, pending = jaune, failed = rouge)
- Badge de methode (cash, transfer, card)
- Dialog de demande de retrait avec montant et validation du solde

**Fichier** : `src/pages/accommodation-dashboard/AccommodationTransactionsPage.tsx` (nouveau)

---

## 4.4 Enregistrement de paiement dans la page Bookings

Ajouter une action "Record Payment" dans le menu dropdown de chaque reservation sur `AccommodationBookingsPage.tsx`.

**Changements** :
- Ajouter un `DropdownMenuItem` "Record Payment" dans le menu actions de chaque booking
- Ouvrir un dialog simple avec : montant (pre-rempli), methode de paiement (cash/transfer/card), notes
- A la sauvegarde : inserer dans `accommodation_payments` + calculer et inserer dans `accommodation_commission_records`
- Le taux de commission vient de `partners.commission_percent`

---

## 4.5 Integration navigation et routes

**Fichiers modifies** :
- `AccommodationDashboardLayout.tsx` : ajouter l'item "Transactions" dans la navigation (icone Wallet, entre Reports et Settings)
- `App.tsx` : ajouter la route `/accommodation-dashboard/transactions`

---

## Resume technique

### Migration SQL (1)
- Tables `accommodation_payments` + `accommodation_commission_records` avec RLS

### Nouveaux fichiers (2)
- `src/hooks/useAccommodationTransactionsData.ts`
- `src/pages/accommodation-dashboard/AccommodationTransactionsPage.tsx`

### Fichiers modifies (3)
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx` (action "Record Payment")
- `src/components/layouts/AccommodationDashboardLayout.tsx` (nav item Transactions)
- `src/App.tsx` (route transactions)

### Infrastructure reutilisee
- Table `withdrawal_requests` (deja existante, utilisee par tous les modules)
- Table `partners` (pour `commission_percent`)
- Composants UI existants (Card, Table, Badge, Dialog, Tabs)
- Pattern identique au module Boat pour coherence
