import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Code2,
  ExternalLink,
  Copy,
  Eye,
  Loader2,
  Package,
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

  // Auto-select first product when products load
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

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

  const selectedProduct = products.find(p => p.id === selectedProductId);

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
          <div className="space-y-6">
            {/* Product Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Product</CardTitle>
                <CardDescription>Choose a product to get its widget embed code</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select
                    value={selectedProductId || ''}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getProductTypeLabel(product.product_type)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedProductId && (
                    <Button
                      variant="outline"
                      onClick={() => handlePreview(selectedProductId)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Widget
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Panel */}
            {selectedProductId && selectedProduct && (
              <>
                {/* Direct Link */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Direct Link
                    </CardTitle>
                    <CardDescription>
                      Share this link directly with customers for booking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Iframe Embed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      Iframe Embed Code
                    </CardTitle>
                    <CardDescription>
                      Copy and paste this code into your website's HTML
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
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
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Widget Preview - {selectedProduct.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden bg-muted/50">
                      <iframe
                        src={getWidgetUrl(selectedProductId)}
                        className="w-full h-[600px] border-0"
                        title="Widget Preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityWidgetConfigPage;
