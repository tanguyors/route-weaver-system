

# Finaliser Feature 3 : Onglet Notifications dans les Settings Accommodation

## Ce qui reste a faire

Il ne reste qu'une seule modification a effectuer : ajouter l'onglet "Notifications" dans la page Settings Accommodation.

Tous les autres elements sont deja en place :
- Les 8 templates par defaut (email + WhatsApp pour confirmations et rappels check-in)
- Les 2 edge functions (confirmation et rappels)
- Le composant `AccommodationNotificationTemplatesEditor`
- Les imports dans `AccommodationSettingsPage.tsx` (deja presents)
- La table `accommodation_reminder_logs` en base
- L'appel automatique de notification apres creation d'un booking

## Modification unique

**Fichier** : `src/pages/accommodation-dashboard/AccommodationSettingsPage.tsx`

1. Passer le `TabsList` de `grid-cols-3` a `grid-cols-4`
2. Ajouter un `TabsTrigger` pour "Notifications" avec l'icone `Bell` (deja importee)
3. Ajouter un `TabsContent` avec le composant `AccommodationNotificationTemplatesEditor` en lui passant le `partnerId`, `partnerEmail` et `partnerPhone`

Le `partnerId` provient de `partnerInfo.id`, l'email de `partnerInfo.contact_email` et le phone de `partnerInfo.contact_phone`.

---

## Section technique

### Changement dans AccommodationSettingsPage.tsx

Ligne 125 : `grid-cols-3` devient `grid-cols-4`

Apres le TabsTrigger "Team" (ligne 137), ajouter :
```tsx
<TabsTrigger value="notifications" className="gap-2">
  <Bell className="w-4 h-4" />
  <span className="hidden sm:inline">Notifications</span>
</TabsTrigger>
```

Apres le TabsContent "team" (ligne 369), ajouter :
```tsx
<TabsContent value="notifications">
  <AccommodationNotificationTemplatesEditor
    partnerId={partnerInfo?.id || null}
    partnerEmail={partnerInfo?.contact_email}
    partnerPhone={partnerInfo?.contact_phone}
  />
</TabsContent>
```

### Aucun autre fichier a modifier
Tout le reste est deja implemente et fonctionnel.

