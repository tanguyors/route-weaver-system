import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, ExternalLink, LayoutGrid, GripHorizontal, Sparkles } from 'lucide-react';

interface WidgetEmbedCodeProps {
  embedCode: string;
  barEmbedCode: string;
  testEmbedCode?: string;
  directLink: string;
  barDirectLink: string;
  testDirectLink?: string;
  widgetKey: string;
  selectedStyle: 'block' | 'bar' | 'test';
  onStyleChange: (style: 'block' | 'bar' | 'test') => void;
  onCopyKey: () => void;
}

const WidgetEmbedCode = ({
  embedCode,
  barEmbedCode,
  testEmbedCode = '',
  directLink,
  barDirectLink,
  testDirectLink = '',
  widgetKey,
  selectedStyle,
  onStyleChange,
  onCopyKey,
}: WidgetEmbedCodeProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const currentEmbedCode = selectedStyle === 'block' ? embedCode : selectedStyle === 'bar' ? barEmbedCode : testEmbedCode;
  const currentDirectLink = selectedStyle === 'block' ? directLink : selectedStyle === 'bar' ? barDirectLink : testDirectLink;

  const getStyleDescription = () => {
    switch (selectedStyle) {
      case 'block':
        return 'Full booking form widget (coming soon)';
      case 'bar':
        return 'Compact horizontal search bar (coming soon)';
      case 'test':
        return 'Step-by-step booking flow with shopping cart';
    }
  };

  return (
    <div className="space-y-4">
      {/* Widget Key */}
      <div className="space-y-2">
        <Label>Widget Key</Label>
        <div className="flex gap-2">
          <Input
            value={widgetKey}
            readOnly
            className="font-mono text-sm bg-muted"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={onCopyKey}
          >
            {copied === 'key' ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Widget Style Selector */}
      <div className="space-y-2">
        <Label>Widget Style</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <LayoutGrid className="w-4 h-4" />
            Block
          </Button>
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <GripHorizontal className="w-4 h-4" />
            Bar
          </Button>
          <Button
            variant={selectedStyle === 'test' ? 'default' : 'outline'}
            onClick={() => onStyleChange('test')}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Widget v2
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {getStyleDescription()}
        </p>
      </div>

      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
          <TabsTrigger value="link">Direct Link</TabsTrigger>
        </TabsList>

        <TabsContent value="iframe" className="space-y-3">
          <div className="relative">
            <Textarea
              value={currentEmbedCode}
              readOnly
              className="font-mono text-xs h-32 bg-muted resize-none"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(currentEmbedCode, 'embed')}
            >
              {copied === 'embed' ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste this code on your website where you want the booking widget to appear.
          </p>
        </TabsContent>

        <TabsContent value="link" className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={currentDirectLink}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(currentDirectLink, 'link')}
            >
              {copied === 'link' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(currentDirectLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link directly with customers or use it for testing.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WidgetEmbedCode;
