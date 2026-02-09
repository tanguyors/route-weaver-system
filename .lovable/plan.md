

# Correction du Header - Ajout du Dashboard Accommodation

## Probleme identifie

Le fichier `src/components/Header.tsx` n'a pas ete mis a jour lors de la Phase 1. Il ne contient que les entrees Boat et Activity dans le dropdown des dashboards, sans aucune reference au module Accommodation.

## Modifications a apporter

### Fichier : `src/components/Header.tsx`

**1. Import** : Ajouter `Home` a la liste des icones importees de `lucide-react`

**2. Variables** : Ajouter la detection du module accommodation
```text
const hasAccommodationModule = activeModules.includes('accommodation');
const hasDashboardAccess = isAdmin || hasBoatModule || hasActivityModule || hasAccommodationModule;
```

**3. Dropdown** : Ajouter l'entree Accommodation dans le composant `DashboardDropdown`, apres l'entree Activity
- Icone : `Home` (violet/indigo, coherent avec le theme du module)
- Label : "Dashboard Accommodation"  
- Lien : `/accommodation-dashboard`

**4. Coherence** : Le meme ajout sera fait dans la version desktop ET mobile du dropdown (le composant `DashboardDropdown` est reutilise pour les deux, donc une seule modification suffit).

## Impact

- Aucun nouveau fichier
- 1 seul fichier modifie : `src/components/Header.tsx`
- Correction rapide, aucun effet de bord

