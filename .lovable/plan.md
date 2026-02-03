

# Plan : Système de Templates de Notifications Personnalisables

## Objectif
Permettre aux partenaires de personnaliser les messages Email et WhatsApp envoyés aux clients et à leur équipe pour les rappels de pickup, via une interface dans les paramètres.

---

## Architecture proposée

```text
+------------------+     +------------------------+     +----------------------+
|   Settings UI    | --> |  notification_templates |     | send-pickup-reminders|
|   (Dashboard)    |     |     (Database)          | <-- |   Edge Function      |
+------------------+     +------------------------+     +----------------------+
```

---

## Étape 1 : Nouvelle table en base de données

**Table : `notification_templates`**

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| partner_id | uuid | Référence au partenaire |
| template_type | text | 'pickup_reminder_email_customer', 'pickup_reminder_email_partner', 'pickup_reminder_whatsapp_customer', 'pickup_reminder_whatsapp_partner' |
| subject | text | Sujet de l'email (null pour WhatsApp) |
| content | text | Contenu du template avec variables placeholders |
| is_active | boolean | Template actif ou non |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de modification |

**Contrainte :** Un seul template par type par partenaire (UNIQUE sur `partner_id` + `template_type`)

---

## Étape 2 : Variables disponibles dans les templates

Les partenaires pourront utiliser ces placeholders qui seront remplacés automatiquement :

| Variable | Description |
|----------|-------------|
| `{{customer_name}}` | Nom du client |
| `{{pickup_date}}` | Date du pickup (ex: Lundi 5 février 2026) |
| `{{pickup_time}}` | Heure du pickup (ex: 08:30) |
| `{{pickup_location}}` | Adresse/hôtel de pickup |
| `{{pickup_area}}` | Zone de pickup (ville) |
| `{{vehicle_type}}` | Type de véhicule (Voiture/Bus) |
| `{{origin_port}}` | Port de départ |
| `{{destination_port}}` | Port d'arrivée |
| `{{departure_time}}` | Heure de départ du ferry |
| `{{partner_name}}` | Nom du partenaire |
| `{{partner_phone}}` | Téléphone du partenaire |
| `{{customer_phone}}` | Téléphone du client (pour les messages partenaire) |
| `{{booking_ref}}` | Référence de réservation |
| `{{hours_before}}` | "24 heures" ou "12 heures" |

---

## Étape 3 : Interface utilisateur

**Nouvelle section dans Paramètres → Notifications : "Personnalisation des messages"**

Composant avec 4 onglets :
1. **Email Client** - Éditeur HTML simplifié avec sujet
2. **Email Partenaire** - Éditeur HTML simplifié avec sujet
3. **WhatsApp Client** - Éditeur texte avec preview
4. **WhatsApp Partenaire** - Éditeur texte avec preview

Fonctionnalités :
- Prévisualisation en temps réel avec données fictives
- Liste des variables disponibles (clic pour insérer)
- Bouton "Réinitialiser au template par défaut"
- Indicateur de caractères pour WhatsApp (limite recommandée)

---

## Étape 4 : Modifications de la fonction Edge

La fonction `send-pickup-reminders` sera modifiée pour :

1. **Charger les templates personnalisés** depuis la table `notification_templates`
2. **Utiliser le template par défaut** si aucun template personnalisé n'existe
3. **Remplacer les placeholders** par les valeurs réelles
4. **Gérer le HTML** pour les emails et le texte brut pour WhatsApp

---

## Fichiers à créer/modifier

1. **Migration SQL** : Créer la table `notification_templates`
2. **Hook** : `useNotificationTemplatesData.ts` - CRUD des templates
3. **Composant UI** : `NotificationTemplatesEditor.tsx` - Interface d'édition
4. **Composant UI** : `TemplatePreview.tsx` - Prévisualisation
5. **Modification** : `NotificationSettingsForm.tsx` - Ajouter section templates
6. **Modification** : `send-pickup-reminders/index.ts` - Charger et utiliser les templates

---

## Templates par défaut

Les templates actuels (hardcodés) seront conservés comme **templates par défaut** utilisés quand aucun template personnalisé n'existe.

---

## Détails techniques

### Structure du composant d'édition

```text
┌─────────────────────────────────────────────────────────┐
│ 📝 Personnalisation des messages de rappel             │
├─────────────────────────────────────────────────────────┤
│ [Email Client] [Email Partenaire] [WA Client] [WA Part] │
├─────────────────────────────────────────────────────────┤
│ Sujet: ________________________________________         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Contenu du message...                               │ │
│ │                                                     │ │
│ │ Bonjour {{customer_name}},                          │ │
│ │ Votre pickup est prévu pour {{pickup_date}}...      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Variables disponibles:                                  │
│ [customer_name] [pickup_date] [pickup_time] [...]       │
│                                                         │
│ ─────────── Prévisualisation ───────────                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Bonjour Jean Dupont,                                │ │
│ │ Votre pickup est prévu pour Lundi 5 février...      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Réinitialiser par défaut]              [Enregistrer]   │
└─────────────────────────────────────────────────────────┘
```

### Sécurité RLS

- Les partenaires ne peuvent voir/modifier que leurs propres templates
- Politique SELECT, INSERT, UPDATE, DELETE avec `partner_id = auth.uid()` via la relation profiles

