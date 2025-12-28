import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Copy, ExternalLink, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WidgetPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Widget</h1>
          <p className="text-muted-foreground mt-1">
            Configure and embed the booking widget on your website
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Embed Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Widget Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value="Configure your partner profile first" 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Embed Script</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-sm text-muted-foreground">
                  {'<script src="https://widget.sribooking.com/embed.js"></script>'}
                  <br />
                  {'<div id="sribooking-widget" data-key="YOUR_KEY"></div>'}
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Widget Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-muted/50">
                <div className="text-center">
                  <Code2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Widget preview</p>
                  <p className="text-muted-foreground text-sm">
                    Configure routes to see preview
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Allowed Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Add domains where the widget can be embedded for security
            </p>
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">No domains configured</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WidgetPage;
