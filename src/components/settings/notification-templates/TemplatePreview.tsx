import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface TemplatePreviewProps {
  content: string;
  isHtml?: boolean;
  subject?: string;
}

const TemplatePreview = ({ content, isHtml = false, subject }: TemplatePreviewProps) => {
  if (!content) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun contenu à prévisualiser
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Prévisualisation
        </CardTitle>
        {subject && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Sujet:</span> {subject}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isHtml ? (
          <div 
            className="border rounded-lg overflow-hidden bg-white"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            <iframe
              srcDoc={content}
              title="Email Preview"
              className="w-full h-[400px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div 
            className="bg-[#DCF8C6] rounded-lg p-4 text-sm whitespace-pre-wrap"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplatePreview;
