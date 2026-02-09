

# Feature 1 : Photos des Accommodations

## Vue d'ensemble

Ajouter la gestion de photos pour chaque propriete hebergement : upload, galerie drag-and-drop, image principale, suppression. On reutilise au maximum les patterns existants du module Activity (`useProductImagesData` + `ProductImageGallery`) en les adaptant pour les accommodations.

---

## 1.1 Migration SQL : Fonction de reorder

Creer une fonction RPC `reorder_accommodation_images` pour la reordonnation atomique des images (identique au pattern `reorder_product_images`).

```sql
CREATE OR REPLACE FUNCTION public.reorder_accommodation_images(
  _accommodation_id uuid,
  _orders jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.accommodation_images AS ai
  SET display_order = (o->>'display_order')::int
  FROM jsonb_array_elements(_orders) AS o
  WHERE ai.id = (o->>'id')::uuid
    AND ai.accommodation_id = _accommodation_id;
END;
$$;
```

---

## 1.2 Hook : `useAccommodationImagesData`

Nouveau hook qui replique la logique de `useProductImagesData` adapte pour les accommodations.

**Fonctionnalites** :
- `images` : liste des images de l'accommodation triees par `display_order`
- `uploadImages(files)` : upload vers le bucket `accommodation-images`, insert en base
- `reorderImages(orders)` : reordonnation via RPC `reorder_accommodation_images`
- `deleteImage(image)` : suppression du storage + base
- `setMainImage(id)` : deplace une image en position 1
- Validation : max 10 images, max 5 MB, types JPG/PNG/WEBP

**Fichier** : `src/hooks/useAccommodationImagesData.ts` (nouveau)

---

## 1.3 Composant : `AccommodationImageGallery`

Nouveau composant reutilisant le meme pattern que `ProductImageGallery` :

**Elements** :
- Zone d'upload drag-and-drop (react-dropzone, deja installe)
- Grille d'images sortable (dnd-kit, deja installe)
- Badge "Main" sur la premiere image
- Actions au hover : "Set Main", "Delete"
- Dialog de confirmation pour la suppression
- Compteur d'images (X / 10)

**Fichier** : `src/components/accommodation/AccommodationImageGallery.tsx` (nouveau)

---

## 1.4 Integration dans le formulaire

Ajouter le composant `AccommodationImageGallery` dans `AccommodationFormPage.tsx` :
- Affiche uniquement en mode edition (quand l'accommodation est deja sauvegardee)
- Positionne apres la section "General Information"
- Passe `accommodationId` et `partnerId` en props

**Fichier** : `src/pages/accommodation-dashboard/AccommodationFormPage.tsx` (modifie)

---

## Resume technique

### Migration SQL (1)
- Fonction `reorder_accommodation_images` (reorder atomique)

### Nouveaux fichiers (2)
- `src/hooks/useAccommodationImagesData.ts`
- `src/components/accommodation/AccommodationImageGallery.tsx`

### Fichiers modifies (1)
- `src/pages/accommodation-dashboard/AccommodationFormPage.tsx` (ajout galerie)

### Infrastructure existante reutilisee
- Bucket storage `accommodation-images` (deja cree, public, avec RLS)
- Table `accommodation_images` (deja creee avec RLS)
- Packages `react-dropzone` et `@dnd-kit/*` (deja installes)

