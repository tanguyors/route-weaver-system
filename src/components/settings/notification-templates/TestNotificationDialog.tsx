import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Mail, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  channel: 'email' | 'whatsapp';
  subject?: string | null;
  content: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

const TestNotificationDialog = ({
  open,
  onOpenChange,
  partnerId,
  channel,
  subject,
  content,
  defaultEmail = '',
  defaultPhone = '',
}: TestNotificationDialogProps) => {
  const [testEmail, setTestEmail] = useState(defaultEmail);
  const [testPhone, setTestPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (channel === 'email' && !testEmail) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une adresse email',
        variant: 'destructive',
      });
      return;
    }

    if (channel === 'whatsapp' && !testPhone) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        body: {
          partnerId,
          channel,
          subject,
          content,
          testEmail: channel === 'email' ? testEmail : undefined,
          testPhone: channel === 'whatsapp' ? testPhone : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'Envoi réussi ✅',
        description: channel === 'email' 
          ? `Email de test envoyé à ${testEmail}`
          : `Message WhatsApp de test envoyé à ${testPhone}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Erreur d\'envoi',
        description: error.message || 'Impossible d\'envoyer la notification de test',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === 'email' ? (
              <Mail className="w-5 h-5" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
            Envoyer un test {channel === 'email' ? 'Email' : 'WhatsApp'}
          </DialogTitle>
          <DialogDescription>
            Envoyez une notification de test avec des données d'exemple pour vérifier votre template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {channel === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="testEmail">Adresse email de destination</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="votre@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="testPhone">Numéro WhatsApp de destination</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+62812345678"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format international avec indicatif pays (ex: +62812345678)
              </p>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ Ce test utilisera des <strong>données fictives</strong> (John Doe, Sanur → Nusa Penida, etc.) 
              pour remplir les variables du template.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer le test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestNotificationDialog;
