import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Clock,
  Package,
  Key,
  Loader2,
  AlertCircle,
  Search,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WidgetProduct {
  id: string;
  name: string;
  short_description: string | null;
  product_type: 'activity' | 'time_slot' | 'rental';
  location_name: string | null;
  images: { id: string; image_url: string }[];
  pricing: { price: number }[];
  rental_options: { price: number }[];
}

interface WidgetData {
  partner_id: string;
  partner_name: string;
  logo_url: string | null;
  theme_config: {
    primary_color?: string;
    background_color?: string;
    text_color?: string;
    button_text_color?: string;
  } | null;
  products: WidgetProduct[];
}

const ActivityWidgetListPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const widgetKey = searchParams.get('key');
  const style = searchParams.get('style') || 'block';
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch widget data
  const { data: widgetData, isLoading, error } = useQuery({
    queryKey: ['activity-widget-public', widgetKey],
    queryFn: async () => {
      if (!widgetKey) throw new Error('Widget key is required');

      // Validate widget and get partner info
      const { data: widget, error: widgetError } = await supabase
        .from('widgets')
        .select('id, partner_id, status, theme_config')
        .eq('public_widget_key', widgetKey)
        .eq('widget_type', 'activity')
        .eq('status', 'active')
        .maybeSingle();

      if (widgetError || !widget) {
        throw new Error('Invalid or inactive widget');
      }

      // Get partner info
      const { data: partner } = await supabase
        .from('partners')
        .select('name, logo_url')
        .eq('id', widget.partner_id)
        .single();

      // Get active products with images and pricing
      const { data: products, error: productsError } = await supabase
        .from('activity_products')
        .select(`
          id, name, short_description, product_type, location_name,
          activity_product_images(id, image_url, display_order),
          activity_pricing(price),
          activity_rental_options(price)
        `)
        .eq('partner_id', widget.partner_id)
        .eq('status', 'active')
        .order('name');

      if (productsError) throw productsError;

      const formattedProducts: WidgetProduct[] = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        short_description: p.short_description,
        product_type: p.product_type as 'activity' | 'time_slot' | 'rental',
        location_name: p.location_name,
        images: (p.activity_product_images || [])
          .sort((a: any, b: any) => a.display_order - b.display_order),
        pricing: p.activity_pricing || [],
        rental_options: p.activity_rental_options || [],
      }));

      return {
        partner_id: widget.partner_id,
        partner_name: partner?.name || 'Partner',
        logo_url: partner?.logo_url,
        theme_config: widget.theme_config as WidgetData['theme_config'],
        products: formattedProducts,
      } as WidgetData;
    },
    enabled: !!widgetKey,
  });

  // Filter products by search query
  const filteredProducts = widgetData?.products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getMinPrice = (product: WidgetProduct): number => {
    if (product.product_type === 'rental') {
      return Math.min(...product.rental_options.map(o => o.price), Infinity);
    }
    return Math.min(...product.pricing.map(p => p.price), Infinity);
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'time_slot': return <Clock className="h-3 w-3" />;
      case 'rental': return <Key className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/widget/activity/${productId}`);
  };

  // Apply theme
  const themeStyles = widgetData?.theme_config ? {
    '--widget-primary': widgetData.theme_config.primary_color || '#10b981',
    '--widget-bg': widgetData.theme_config.background_color || '#ffffff',
    '--widget-text': widgetData.theme_config.text_color || '#1e293b',
    '--widget-button-text': widgetData.theme_config.button_text_color || '#ffffff',
  } as React.CSSProperties : {};

  if (!widgetKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Widget Key Required</h2>
            <p className="text-muted-foreground">Please provide a valid widget key.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !widgetData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Widget Not Available</h2>
            <p className="text-muted-foreground">This widget is not available or has been disabled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bar style - compact horizontal display
  if (style === 'bar') {
    return (
      <div className="p-4 bg-background" style={themeStyles}>
        <div className="flex items-center gap-4 overflow-x-auto">
          {widgetData.logo_url && (
            <img src={widgetData.logo_url} alt="Logo" className="h-8 object-contain flex-shrink-0" />
          )}
          <div className="flex gap-2 flex-shrink-0">
            {widgetData.products.slice(0, 5).map(product => (
              <Button
                key={product.id}
                variant="outline"
                size="sm"
                onClick={() => handleProductClick(product.id)}
                className="whitespace-nowrap"
              >
                {product.name}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Block style - full grid display
  return (
    <div 
      className="min-h-screen p-4 md:p-6"
      style={{
        ...themeStyles,
        backgroundColor: widgetData.theme_config?.background_color || undefined,
        color: widgetData.theme_config?.text_color || undefined,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {widgetData.logo_url && (
            <img 
              src={widgetData.logo_url} 
              alt={widgetData.partner_name} 
              className="h-12 mx-auto object-contain"
            />
          )}
          <h1 className="text-2xl md:text-3xl font-bold">
            {widgetData.partner_name}
          </h1>
          <p className="text-muted-foreground">
            {widgetData.products.length} {widgetData.products.length === 1 ? 'activity' : 'activities'} available
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Activities Found</h2>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'No activities are currently available.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => {
              const minPrice = getMinPrice(product);
              const coverImage = product.images[0]?.image_url;

              return (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Image */}
                  <div className="aspect-video bg-muted relative">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 text-xs"
                    >
                      {getProductTypeIcon(product.product_type)}
                      <span className="ml-1">{product.product_type.replace('_', ' ')}</span>
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    
                    {product.location_name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{product.location_name}</span>
                      </div>
                    )}

                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.short_description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {minPrice !== Infinity ? (
                        <p className="font-semibold" style={{ color: widgetData.theme_config?.primary_color }}>
                          From IDR {minPrice.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">Price on request</p>
                      )}
                      <Button 
                        size="sm"
                        style={{
                          backgroundColor: widgetData.theme_config?.primary_color,
                          color: widgetData.theme_config?.button_text_color,
                        }}
                      >
                        Book
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityWidgetListPage;
