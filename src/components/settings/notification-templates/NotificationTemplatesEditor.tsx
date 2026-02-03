import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageCircle, Loader2, FileEdit } from 'lucide-react';
import { 
  useNotificationTemplatesData, 
  TemplateType,
  DEFAULT_TEMPLATES 
} from '@/hooks/useNotificationTemplatesData';
import TemplateEditor from './TemplateEditor';

interface NotificationTemplatesEditorProps {
  partnerId: string | null;
}

const TEMPLATE_CONFIG: {
  type: TemplateType;
  label: string;
  shortLabel: string;
  isEmail: boolean;
  icon: typeof Mail;
}[] = [
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

const NotificationTemplatesEditor = ({ partnerId }: NotificationTemplatesEditorProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="w-5 h-5" />
          Personnalisation des messages de rappel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les emails et messages WhatsApp envoyés aux clients et à votre équipe 
          pour les rappels de pickup. Utilisez les variables pour insérer dynamiquement les informations.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={TEMPLATE_CONFIG[0].type} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {TEMPLATE_CONFIG.map((config) => {
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

          {TEMPLATE_CONFIG.map((config) => {
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
