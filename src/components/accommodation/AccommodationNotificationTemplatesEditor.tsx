import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageCircle, Loader2, FileEdit, Clock, CheckCircle } from 'lucide-react';
import { 
  useNotificationTemplatesData, 
  TemplateType,
  DEFAULT_TEMPLATES,
  ACC_TEMPLATE_VARIABLES,
} from '@/hooks/useNotificationTemplatesData';
import TemplateEditor from '@/components/settings/notification-templates/TemplateEditor';

interface AccommodationNotificationTemplatesEditorProps {
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

const ACC_BOOKING_CONFIRMATION_TEMPLATES: TemplateConfig[] = [
  { type: 'acc_booking_confirmation_email_customer', label: 'Email Guest', shortLabel: 'Email Guest', isEmail: true, icon: Mail },
  { type: 'acc_booking_confirmation_email_partner', label: 'Email Partenaire', shortLabel: 'Email Part.', isEmail: true, icon: Mail },
  { type: 'acc_booking_confirmation_whatsapp_customer', label: 'WhatsApp Guest', shortLabel: 'WA Guest', isEmail: false, icon: MessageCircle },
  { type: 'acc_booking_confirmation_whatsapp_partner', label: 'WhatsApp Partenaire', shortLabel: 'WA Part.', isEmail: false, icon: MessageCircle },
];

const ACC_CHECKIN_REMINDER_TEMPLATES: TemplateConfig[] = [
  { type: 'acc_checkin_reminder_email_customer', label: 'Email Guest', shortLabel: 'Email Guest', isEmail: true, icon: Mail },
  { type: 'acc_checkin_reminder_email_partner', label: 'Email Partenaire', shortLabel: 'Email Part.', isEmail: true, icon: Mail },
  { type: 'acc_checkin_reminder_whatsapp_customer', label: 'WhatsApp Guest', shortLabel: 'WA Guest', isEmail: false, icon: MessageCircle },
  { type: 'acc_checkin_reminder_whatsapp_partner', label: 'WhatsApp Partenaire', shortLabel: 'WA Part.', isEmail: false, icon: MessageCircle },
];

type AccCategoryKey = 'acc_booking_confirmations' | 'acc_checkin_reminders';

const AccommodationNotificationTemplatesEditor = ({ partnerId, partnerEmail, partnerPhone }: AccommodationNotificationTemplatesEditorProps) => {
  const [activeCategory, setActiveCategory] = useState<AccCategoryKey>('acc_booking_confirmations');
  
  const { 
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

  const templateConfigs = activeCategory === 'acc_booking_confirmations' 
    ? ACC_BOOKING_CONFIRMATION_TEMPLATES 
    : ACC_CHECKIN_REMINDER_TEMPLATES;

  const categoryTitle = activeCategory === 'acc_booking_confirmations'
    ? 'Booking Confirmations'
    : 'Check-in Reminders';

  const categoryDescription = activeCategory === 'acc_booking_confirmations'
    ? 'Customize messages sent when an accommodation booking is confirmed.'
    : 'Customize messages sent 24h before check-in.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="w-5 h-5" />
          Accommodation Message Templates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize emails and WhatsApp messages for accommodation bookings.
          Use variables to dynamically insert booking information.
        </p>
        
        {/* Category Selector */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveCategory('acc_booking_confirmations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'acc_booking_confirmations'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Booking Confirmations
          </button>
          <button
            onClick={() => setActiveCategory('acc_checkin_reminders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'acc_checkin_reminders'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Clock className="w-4 h-4" />
            Check-in Reminders
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
                  customVariables={ACC_TEMPLATE_VARIABLES}
                  useAccSampleData={true}
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

export default AccommodationNotificationTemplatesEditor;
