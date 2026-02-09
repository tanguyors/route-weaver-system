import { useState, useEffect } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccommodationWidgetConfigData } from '@/hooks/useAccommodationWidgetConfigData';
import { supabase } from '@/integrations/supabase/client';
import WidgetDomainsForm from '@/components/widget/WidgetDomainsForm';
import {
  Code2,
  Palette,
  Globe,
  ExternalLink,
  Loader2,
  Plus,
  Eye,
  Copy,
  Check,
  Key,
  AlertTriangle,
  Home,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AccommodationWidgetConfigPage = () => {
  const {
    widget,
    loading,
    createWidget,
    addDomain,
    removeDomain,
    updateTheme,
    toggleStatus,
    copyWidgetKey,
    getEmbedCode,
    getDirectLink,
  } = useAccommodationWidgetConfigData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accommodationCount, setAccommodationCount] = useState<number | null>(null);

  // Check if partner has accommodations
  useEffect(() => {
    const checkAccommodations = async () => {
      if (!widget) return;
      const { count } = await supabase
        .from('accommodations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      setAccommodationCount(count ?? 0);
    };
    checkAccommodations();
  }, [widget]);

  const handleCreateWidget = async () => {
    setCreating(true);
    await createWidget();
    setCreating(false);
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      setCopied(true);
      toast({ title: 'Copied', description: 'Embed code copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <AccommodationDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AccommodationDashboardLayout>
    );
  }

  if (!widget) {
    return (
      <AccommodationDashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Widget</h1>
            <p className="text-muted-foreground mt-1">
              Configure and embed the accommodation booking widget on your website
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Code2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">Create Your Accommodation Widget</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Generate an embeddable widget that displays your properties and allows guests to
                check availability and book directly on your website.
              </p>
              <Button onClick={handleCreateWidget} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Widget
              </Button>
            </CardContent>
          </Card>
        </div>
      </AccommodationDashboardLayout>
    );
  }

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Widget</h1>
            <p className="text-muted-foreground mt-1">
              Configure and embed the accommodation booking widget on your website
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={widget.status === 'active' ? 'default' : 'secondary'}>
                {widget.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <Switch checked={widget.status === 'active'} onCheckedChange={toggleStatus} />
            </div>
            <Button variant="outline" onClick={() => window.open(getDirectLink(), '_blank')}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <Tabs defaultValue="embed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="embed" className="gap-2">
              <Code2 className="w-4 h-4" />
              Embed Code
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <Globe className="w-4 h-4" />
              Domains
            </TabsTrigger>
          </TabsList>

          {/* Embed Code Tab */}
          <TabsContent value="embed">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Embed Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Widget Key */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4" />
                      Widget Key
                    </Label>
                    <div className="flex gap-2">
                      <Input value={widget.public_widget_key} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={copyWidgetKey}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Direct Link */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4" />
                      Direct Link
                    </Label>
                    <div className="flex gap-2">
                      <Input value={getDirectLink()} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(getDirectLink());
                          toast({ title: 'Copied', description: 'Direct link copied' });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Embed Code */}
                  <div>
                    <Label className="mb-2 block">Iframe Embed Code</Label>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                      {getEmbedCode()}
                    </pre>
                    <Button variant="outline" className="mt-2 w-full" onClick={handleCopyEmbed}>
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Embed Code'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Widget Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accommodationCount === 0 && (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>No active properties found. Create at least one accommodation to see the widget in action.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4 shrink-0"
                          onClick={() => navigate('/accommodation-dashboard/accommodations')}
                        >
                          <Home className="w-4 h-4 mr-1" />
                          Add Property
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="border rounded-lg overflow-hidden bg-muted/50">
                    <iframe
                      src={getDirectLink()}
                      className="w-full h-[500px] border-0"
                      title="Accommodation Widget Preview"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Widget Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-lg space-y-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="primary_color"
                        type="color"
                        value={widget.theme_config?.primary_color || '#7c3aed'}
                        onChange={(e) => updateTheme({ primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widget.theme_config?.primary_color || '#7c3aed'}
                        onChange={(e) => updateTheme({ primary_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bg_color">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="bg_color"
                        type="color"
                        value={widget.theme_config?.background_color || '#ffffff'}
                        onChange={(e) => updateTheme({ background_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widget.theme_config?.background_color || '#ffffff'}
                        onChange={(e) => updateTheme({ background_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="text_color"
                        type="color"
                        value={widget.theme_config?.text_color || '#1f2937'}
                        onChange={(e) => updateTheme({ text_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widget.theme_config?.text_color || '#1f2937'}
                        onChange={(e) => updateTheme({ text_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="btn_text_color">Button Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="btn_text_color"
                        type="color"
                        value={widget.theme_config?.button_text_color || '#ffffff'}
                        onChange={(e) => updateTheme({ button_text_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={widget.theme_config?.button_text_color || '#ffffff'}
                        onChange={(e) => updateTheme({ button_text_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={widget.theme_config?.logo_url || ''}
                      onChange={(e) => updateTheme({ logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domains Tab */}
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Allowed Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-lg">
                  <WidgetDomainsForm
                    domains={widget.allowed_domains}
                    onAdd={addDomain}
                    onRemove={removeDomain}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationWidgetConfigPage;