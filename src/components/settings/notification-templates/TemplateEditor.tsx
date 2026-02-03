import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw, Save, Mail, MessageCircle, Send } from 'lucide-react';
import { 
  TemplateType, 
  DEFAULT_TEMPLATES, 
  SAMPLE_DATA 
} from '@/hooks/useNotificationTemplatesData';
import TemplatePreview from './TemplatePreview';
import VariablesList from './VariablesList';
import TestNotificationDialog from './TestNotificationDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TemplateEditorProps {
  templateType: TemplateType;
  initialSubject?: string | null;
  initialContent: string;
  isCustomized: boolean;
  isEmail: boolean;
  saving: boolean;
  partnerId: string;
  partnerEmail?: string;
  partnerPhone?: string;
  onSave: (content: string, subject?: string | null) => Promise<boolean>;
  onReset: () => Promise<boolean>;
}

const TemplateEditor = ({
  templateType,
  initialSubject,
  initialContent,
  isCustomized,
  isEmail,
  saving,
  partnerId,
  partnerEmail = '',
  partnerPhone = '',
  onSave,
  onReset,
}: TemplateEditorProps) => {
  const [subject, setSubject] = useState(initialSubject || '');
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update state when props change
  useEffect(() => {
    setSubject(initialSubject || '');
    setContent(initialContent);
    setHasChanges(false);
  }, [initialSubject, initialContent]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setHasChanges(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleInsertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + variable + content.substring(end);
      setContent(newContent);
      setHasChanges(true);
      
      // Set cursor position after variable
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
        }
      }, 0);
    } else {
      // Fallback: append to end
      setContent(content + variable);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    const success = await onSave(content, isEmail ? subject : null);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = async () => {
    const success = await onReset();
    if (success) {
      const defaultTemplate = DEFAULT_TEMPLATES[templateType];
      setSubject(defaultTemplate.subject || '');
      setContent(defaultTemplate.content);
      setHasChanges(false);
    }
  };

  // Generate preview with sample data
  const replaceWithSampleData = (text: string): string => {
    let result = text;
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  const previewContent = replaceWithSampleData(content);
  const previewSubject = subject ? replaceWithSampleData(subject) : undefined;

  // Character count for WhatsApp
  const charCount = content.length;
  const maxRecommended = 1000;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {isEmail ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                Éditeur de template
                {isCustomized && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Personnalisé
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEmail && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet de l'email</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    placeholder="Ex: 🚗 Pickup Reminder - {{hours_before}} before your trip"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">
                  Contenu {isEmail ? '(HTML)' : '(Texte)'}
                </Label>
                <Textarea
                  ref={textareaRef}
                  id="content"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={isEmail ? 20 : 15}
                  className="font-mono text-sm"
                  placeholder={isEmail 
                    ? "Contenu HTML de l'email..." 
                    : "Contenu du message WhatsApp..."
                  }
                />
                {!isEmail && (
                  <p className={`text-xs ${charCount > maxRecommended ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {charCount} caractères {charCount > maxRecommended && '(recommandé < 1000)'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <VariablesList onInsert={handleInsertVariable} />
        </div>

        {/* Preview Column */}
        <div className="space-y-4">
          <TemplatePreview 
            content={previewContent} 
            isHtml={isEmail}
            subject={previewSubject}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={saving || !isCustomized}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser par défaut
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser le template ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va supprimer vos personnalisations et restaurer le template par défaut. 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            variant="secondary" 
            onClick={() => setTestDialogOpen(true)}
            disabled={saving}
          >
            <Send className="w-4 h-4 mr-2" />
            Envoyer un test
          </Button>
        </div>

        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Test Notification Dialog */}
      <TestNotificationDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        partnerId={partnerId}
        channel={isEmail ? 'email' : 'whatsapp'}
        subject={subject}
        content={content}
        defaultEmail={partnerEmail}
        defaultPhone={partnerPhone}
      />
    </div>
  );
};

export default TemplateEditor;
