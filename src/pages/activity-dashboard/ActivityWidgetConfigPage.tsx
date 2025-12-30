import { useState } from 'react';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityWidgetConfigData } from '@/hooks/useActivityWidgetConfigData';
import ActivityWidgetEmbedCode from '@/components/activity-widget/ActivityWidgetEmbedCode';
import ActivityWidgetThemeForm from '@/components/activity-widget/ActivityWidgetThemeForm';
import WidgetDomainsForm from '@/components/widget/WidgetDomainsForm';
import {
  Code2,
  Palette,
  Globe,
  ExternalLink,
  Loader2,
  Plus,
  Eye,
} from 'lucide-react';

const ActivityWidgetConfigPage = () => {
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
  } = useActivityWidgetConfigData();

  const [creating, setCreating] = useState(false);

  const handleCreateWidget = async () => {
    setCreating(true);
    await createWidget();
    setCreating(false);
  };

  if (loading) {
    return (
      <ActivityDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </ActivityDashboardLayout>
    );
  }

  // No widget yet - show creation prompt
  if (!widget) {
    return (
      <ActivityDashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Widget
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and embed the activity booking widget on your website
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Code2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">Create Your Activity Widget</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Generate an embeddable widget that displays all your activities
                and allows customers to book directly on your website.
              </p>
              <Button onClick={handleCreateWidget} disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Widget
              </Button>
            </CardContent>
          </Card>
        </div>
      </ActivityDashboardLayout>
    );
  }

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Widget
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and embed the activity booking widget on your website
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={widget.status === 'active' ? 'default' : 'secondary'}>
                {widget.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <Switch
                checked={widget.status === 'active'}
                onCheckedChange={toggleStatus}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(getDirectLink(), '_blank')}
            >
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
                <CardContent>
                  <ActivityWidgetEmbedCode
                    embedCode={getEmbedCode()}
                    directLink={getDirectLink()}
                    widgetKey={widget.public_widget_key}
                    onCopyKey={copyWidgetKey}
                  />
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
                  <div className="border rounded-lg overflow-hidden bg-muted/50">
                    <iframe
                      src={getDirectLink()}
                      className="w-full h-[500px] border-0"
                      title="Activity Widget Preview"
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
                <div className="max-w-lg">
                  <ActivityWidgetThemeForm
                    themeConfig={widget.theme_config}
                    onUpdate={updateTheme}
                  />
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
    </ActivityDashboardLayout>
  );
};

export default ActivityWidgetConfigPage;
