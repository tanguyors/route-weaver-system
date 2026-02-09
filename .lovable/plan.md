

# Feature 2 : Calendrier Multi-Proprietes

## Vue d'ensemble

Ameliorer le calendrier du module Accommodation avec deux vues :
1. **Vue Multi-Proprietes (Gantt)** : toutes les proprietes en lignes, les jours en colonnes, avec les noms des guests affiches directement sur les reservations (barres horizontales colorees).
2. **Vue Single Property** : la vue actuelle amelioree avec les noms des guests affiches dans les cellules des jours reserves.

---

## 2.1 Nouveau hook : `useMultiPropertyCalendarData`

Hook dedie pour charger les donnees calendrier de toutes les proprietes d'un partenaire sur une plage de dates.

**Fonctionnalites** :
- Charge toutes les entrees `accommodation_calendar` du partenaire pour la plage visible
- Joint les donnees `accommodation_bookings` (guest_name, checkin_date, checkout_date) via `booking_id`
- Joint les donnees `accommodations` (name) via `accommodation_id`
- Retourne les donnees groupees par accommodation pour faciliter le rendu Gantt

**Fichier** : `src/hooks/useMultiPropertyCalendarData.ts` (nouveau)

---

## 2.2 Amelioration de la vue Single Property

Modifier la page `AccommodationCalendarPage.tsx` existante pour :
- Afficher le **nom du guest** dans les cellules des jours avec statut `booked_sribooking` (en utilisant la jointure `booking_id` -> `accommodation_bookings.guest_name`)
- Enrichir le hook `useAccommodationCalendarData` pour retourner les infos guest associees

**Modification du hook** : `useAccommodationCalendarData` - ajouter une jointure avec `accommodation_bookings` pour recuperer `guest_name` quand `booking_id` est present.

---

## 2.3 Composant Gantt : `MultiPropertyCalendar`

Nouveau composant qui affiche une vue timeline/Gantt :

**Structure** :
- En-tete : navigation mois (precedent/suivant) + mois/annee courant
- Colonne gauche fixe : liste des noms des accommodations
- Grille horizontale scrollable : 1 colonne par jour du mois
- Barres horizontales colorees pour les reservations (bleu = Sribooking, orange = externe, rouge = bloque)
- Le nom du guest est affiche dans la barre de reservation
- Les jours disponibles sont cliquables (meme logique de block/unblock que la vue single)

**Elements visuels** :
- Couleurs coherentes avec la vue single (vert = disponible, bleu = booked sribooking, orange = booked external, rouge = bloque)
- Les barres de reservation s'etendent sur plusieurs jours (check-in a check-out)
- Texte du nom du guest tronque si la barre est trop courte
- Ligne de "today" en surbrillance

**Fichier** : `src/components/accommodation/MultiPropertyCalendar.tsx` (nouveau)

---

## 2.4 Integration dans la page Calendar

Modifier `AccommodationCalendarPage.tsx` pour ajouter un toggle entre les deux vues :

**Changements** :
- Ajouter un bouton toggle "Single / Multi" en haut de la page
- Vue "Single" : la vue actuelle (1 propriete, grille mensuelle) avec les noms de guests ajoutes
- Vue "Multi" : le nouveau composant `MultiPropertyCalendar` (toutes les proprietes, vue Gantt)
- Par defaut : vue Multi si plus d'1 propriete, sinon vue Single

---

## Resume technique

### Nouveaux fichiers (2)
- `src/hooks/useMultiPropertyCalendarData.ts` (donnees multi-proprietes avec guests)
- `src/components/accommodation/MultiPropertyCalendar.tsx` (composant Gantt)

### Fichiers modifies (2)
- `src/hooks/useAccommodationCalendarData.ts` (ajout jointure guest_name)
- `src/pages/accommodation-dashboard/AccommodationCalendarPage.tsx` (toggle vues + noms guests)

### Pas de migration SQL
Les donnees necessaires (guest_name via booking_id) existent deja dans les tables existantes.

### Pas de nouvelle dependance
Tout est fait avec CSS Grid/Flexbox natif et les composants UI existants.

