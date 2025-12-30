import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Code2,
  ExternalLink,
  Copy,
  Eye,
  Loader2,
  Package,
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface ProductForWidget {
  id: string;
  name: string;
  product_type: 'activity' | 'time_slot' | 'rental';
  status: 'active' | 'draft' | 'archived';
  short_description: string | null;
}

const ActivityWidgetConfigPage = () => {
  const { partnerId } = useUserRole();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const baseUrl = window.location.origin;

  // Fetch active products for widget
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['activity-products-widget', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await supabase
        .from('activity_products')
        .select('id, name, product_type, status, short_description')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data as ProductForWidget[];
    },
    enabled: !!partnerId,
  });

  const getWidgetUrl = (productId: string) => {
    return `${baseUrl}/widget/activity/${productId}`;
  };

  const getIframeCode = (productId: string) => {
    const url = getWidgetUrl(productId);
    return `<iframe 
  src="${url}" 
  style="width: 100%; min-height: 800px; border: none;"
  title="Booking Widget"
></iframe>`;
  };

  const handleCopyLink = (productId: string) => {
    navigator.clipboard.writeText(getWidgetUrl(productId));
    toast.success('Widget link copied to clipboard');
  };

  const handleCopyIframe = (productId: string) => {
    navigator.clipboard.writeText(getIframeCode(productId));
    toast.success('Embed code copied to clipboard');
  };

  const handlePreview = (productId: string) => {
    window.open(getWidgetUrl(productId), '_blank');
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'time_slot': return 'Time Slot';
      case 'rental': return 'Rental';
      default: return 'Activity';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Booking Widget
          </h1>
          <p className="text-muted-foreground mt-1">
            Embed booking widgets for your products on your website
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <CardContent className="flex items-start gap-3 pt-4">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800 dark:text-emerald-200">
              <p className="font-medium mb-1">How it works</p>
              <p>
                Each active product has its own booking widget URL. You can embed the widget on your website 
                using an iframe, or share the direct link with customers for online booking.
              </p>
            </div>
          </CardContent>
        </Card>

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Active Products</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create and activate products to generate booking widget links.
                Only active products can be embedded as widgets.
              </p>
              <Button onClick={() => window.location.href = '/activity-dashboard/products'}>
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Widget Links
                </CardTitle>
                <CardDescription>
                  Click on a product to view its embed code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow 
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedProductId(
                            selectedProductId === product.id ? null : product.id
                          )}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.short_description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {product.short_description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getProductTypeLabel(product.product_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-emerald-500">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(product.id);
                                }}
                                title="Copy link"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview(product.id);
                                }}
                                title="Preview widget"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Panel */}
            {selectedProductId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Embed Code - {products.find(p => p.id === selectedProductId)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Direct Link */}
                  <div className="space-y-2">
                    <Label>Direct Link</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={getWidgetUrl(selectedProductId)}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleCopyLink(selectedProductId)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePreview(selectedProductId)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Iframe Embed */}
                  <div className="space-y-2">
                    <Label>Iframe Embed Code</Label>
                    <p className="text-sm text-muted-foreground">
                      Copy and paste this code into your website's HTML where you want the booking widget to appear.
                    </p>
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                        {getIframeCode(selectedProductId)}
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyIframe(selectedProductId)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Widget Preview</Label>
                    <div className="border rounded-lg overflow-hidden bg-muted/50">
                      <iframe
                        src={getWidgetUrl(selectedProductId)}
                        className="w-full h-[600px] border-0"
                        title="Widget Preview"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityWidgetConfigPage;
