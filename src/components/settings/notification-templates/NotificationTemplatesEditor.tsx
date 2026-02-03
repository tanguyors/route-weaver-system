import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageCircle, Loader2, FileEdit, Clock, CheckCircle } from 'lucide-react';
import { 
  useNotificationTemplatesData, 
  TemplateType,
  DEFAULT_TEMPLATES 
} from '@/hooks/useNotificationTemplatesData';
import TemplateEditor from './TemplateEditor';

interface NotificationTemplatesEditorProps {
  partnerId: string | null;
  partnerEmail?: string;
  partnerPhone?: string;
}

interface TemplateConfig {
  type: TemplateType;
  label: string;
  shortLabel: string;
  isEmail: boolean;
  icon: typeof Mail;
}

const PICKUP_REMINDER_TEMPLATES: TemplateConfig[] = [
  { 
    type: 'pickup_reminder_email_customer', 
    label: 'Email Client', 
    shortLabel: 'Email Client',
    isEmail: true,
    icon: Mail,
  },
  { 
    type: 'pickup_reminder_email_partner', 
    label: 'Email Partenaire', 
    shortLabel: 'Email Part.',
    isEmail: true,
    icon: Mail,
  },
  { 
    type: 'pickup_reminder_whatsapp_customer', 
    label: 'WhatsApp Client', 
    shortLabel: 'WA Client',
    isEmail: false,
    icon: MessageCircle,
  },
  { 
    type: 'pickup_reminder_whatsapp_partner', 
    label: 'WhatsApp Partenaire', 
    shortLabel: 'WA Part.',
    isEmail: false,
    icon: MessageCircle,
  },
];

const BOOKING_CONFIRMATION_TEMPLATES: TemplateConfig[] = [
  { 
    type: 'booking_confirmation_email_customer', 
    label: 'Email Client', 
    shortLabel: 'Email Client',
    isEmail: true,
    icon: Mail,
  },
  { 
    type: 'booking_confirmation_email_partner', 
    label: 'Email Partenaire', 
    shortLabel: 'Email Part.',
    isEmail: true,
    icon: Mail,
  },
  { 
    type: 'booking_confirmation_whatsapp_customer', 
    label: 'WhatsApp Client', 
    shortLabel: 'WA Client',
    isEmail: false,
    icon: MessageCircle,
  },
  { 
    type: 'booking_confirmation_whatsapp_partner', 
    label: 'WhatsApp Partenaire', 
    shortLabel: 'WA Part.',
    isEmail: false,
    icon: MessageCircle,
  },
];

type TemplateCategoryKey = 'pickup_reminders' | 'booking_confirmations';

const NotificationTemplatesEditor = ({ partnerId, partnerEmail, partnerPhone }: NotificationTemplatesEditorProps) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryKey>('booking_confirmations');
  
  const { 
    templates, 
    loading, 
    saving, 
    getTemplate, 
    saveTemplate, 
    resetTemplate 
  } = useNotificationTemplatesData(partnerId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const templateConfigs = activeCategory === 'pickup_reminders' 
    ? PICKUP_REMINDER_TEMPLATES 
    : BOOKING_CONFIRMATION_TEMPLATES;

  const categoryTitle = activeCategory === 'pickup_reminders'
    ? 'Rappels de pickup'
    : 'Confirmations de réservation';

  const categoryDescription = activeCategory === 'pickup_reminders'
    ? 'Personnalisez les messages envoyés 24h et 12h avant le pickup.'
    : 'Personnalisez les messages envoyés lors de la confirmation d\'une réservation.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="w-5 h-5" />
          Personnalisation des messages
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les emails et messages WhatsApp envoyés aux clients et à votre équipe. 
          Utilisez les variables pour insérer dynamiquement les informations.
        </p>
        
        {/* Category Selector */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveCategory('booking_confirmations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'booking_confirmations'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Confirmations de réservation
          </button>
          <button
            onClick={() => setActiveCategory('pickup_reminders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'pickup_reminders'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Clock className="w-4 h-4" />
            Rappels de pickup
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{categoryTitle}</h3>
          <p className="text-sm text-muted-foreground">{categoryDescription}</p>
        </div>
        
        <Tabs defaultValue={templateConfigs[0].type} key={activeCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {templateConfigs.map((config) => {
              const customTemplate = getTemplate(config.type);
              const isCustomized = !!customTemplate;
              
              return (
                <TabsTrigger 
                  key={config.type} 
                  value={config.type}
                  className="relative text-xs sm:text-sm"
                >
                  <config.icon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{config.shortLabel}</span>
                  {isCustomized && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {templateConfigs.map((config) => {
            const customTemplate = getTemplate(config.type);
            const defaultTemplate = DEFAULT_TEMPLATES[config.type];
            
            const currentSubject = customTemplate?.subject ?? defaultTemplate.subject ?? null;
            const currentContent = customTemplate?.content ?? defaultTemplate.content;
            const isCustomized = !!customTemplate;

            return (
              <TabsContent key={config.type} value={config.type} className="mt-6">
                <TemplateEditor
                  templateType={config.type}
                  initialSubject={currentSubject}
                  initialContent={currentContent}
                  isCustomized={isCustomized}
                  isEmail={config.isEmail}
                  saving={saving}
                  partnerId={partnerId || ''}
                  partnerEmail={partnerEmail}
                  partnerPhone={partnerPhone}
                  onSave={(content, subject) => saveTemplate(config.type, content, subject)}
                  onReset={() => resetTemplate(config.type)}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationTemplatesEditor;
