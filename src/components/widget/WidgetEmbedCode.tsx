import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, ExternalLink, Home, Layout } from 'lucide-react';

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
  preWidgetCode?: string;
  fullWidgetCode?: string;
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
  preWidgetCode = '',
  fullWidgetCode = '',
}: WidgetEmbedCodeProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [embedType, setEmbedType] = useState<'prewidget' | 'fullwidget'>('prewidget');

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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

      {/* Integration Type Selector */}
      <div className="space-y-2">
        <Label>Integration Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={embedType === 'prewidget' ? 'default' : 'outline'}
            onClick={() => setEmbedType('prewidget')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Pre-Widget (Home)
          </Button>
          <Button
            variant={embedType === 'fullwidget' ? 'default' : 'outline'}
            onClick={() => setEmbedType('fullwidget')}
            className="flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Full Widget (Page)
          </Button>
        </div>
      </div>

      {embedType === 'prewidget' && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Home className="w-4 h-4" />
              Pre-Widget Search Bar
            </h3>
            <p className="text-sm text-muted-foreground">
              Embed this <strong>native search form</strong> on your homepage. It looks exactly like the first step of the main widget and redirects users to your booking page.
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={preWidgetCode}
              readOnly
              className="font-mono text-xs h-56 bg-background resize-none"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(preWidgetCode, 'prewidget')}
            >
              {copied === 'prewidget' ? (
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

          <div className="text-xs text-muted-foreground bg-background p-3 rounded border space-y-2">
            <p className="font-semibold">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>User fills in From/To, Dates, Passengers on your homepage</li>
              <li>Clicks "Search Trips" → redirects to your booking page with params</li>
              <li>The full widget auto-reads params and shows results</li>
            </ol>
          </div>
        </div>
      )}

      {embedType === 'fullwidget' && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Full Widget (Dedicated Page)
            </h3>
            <p className="text-sm text-muted-foreground">
              Embed this iframe on a <strong>dedicated booking page</strong> (e.g., /booking). It auto-reads URL parameters from the pre-widget and starts the search.
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={fullWidgetCode}
              readOnly
              className="font-mono text-xs h-72 bg-background resize-none"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(fullWidgetCode, 'fullwidget')}
            >
              {copied === 'fullwidget' ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-success" />
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

          <div className="text-xs text-muted-foreground bg-background p-3 rounded border space-y-2">
            <p className="font-semibold">Important for mobile:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The booking page should have minimal content (just the iframe)</li>
              <li>No scroll wrapper around the iframe</li>
              <li>If you have a fixed header, adjust <code className="bg-muted px-1 rounded">--header-h</code></li>
            </ul>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(testDirectLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Preview Widget
            </Button>
          </div>
        </div>
      )}

      {/* Separator with divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or use legacy embed</span>
        </div>
      </div>

      {/* Legacy Tabs */}
      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
          <TabsTrigger value="link">Direct Link</TabsTrigger>
        </TabsList>

        <TabsContent value="iframe" className="space-y-3">
          <div className="relative">
            <Textarea
              value={testEmbedCode}
              readOnly
              className="font-mono text-xs h-32 bg-muted resize-none"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(testEmbedCode, 'embed')}
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
            Legacy embed with auto-resize. May have touch issues on iOS when embedded in long pages.
          </p>
        </TabsContent>

        <TabsContent value="link" className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={testDirectLink}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(testDirectLink, 'link')}
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
              onClick={() => window.open(testDirectLink, '_blank')}
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
