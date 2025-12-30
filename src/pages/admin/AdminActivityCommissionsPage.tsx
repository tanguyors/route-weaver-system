import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Percent, Save, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityCommissionsData, usePartnerProductCommissions } from '@/hooks/useActivityCommissionsData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const AdminActivityCommissionsPage = () => {
  const {
    settings,
    isLoadingSettings,
    updateDefaultCommission,
    isUpdatingDefault,
    setPartnerCommission,
    isSettingPartner,
    upsertProductCommission,
    isUpsertingProduct,
    deleteProductCommission,
    isDeletingProduct,
  } = useActivityCommissionsData();

  // Local state
  const [defaultRate, setDefaultRate] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerRate, setPartnerRate] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productRate, setProductRate] = useState<string>('');

  // Fetch partners
  const { data: partners = [], isLoading: isLoadingPartners } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, commission_percent')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch products for selected partner
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['activity-products', selectedPartnerId],
    queryFn: async () => {
      if (!selectedPartnerId) return [];
      const { data, error } = await supabase
        .from('activity_products')
        .select('id, name')
        .eq('partner_id', selectedPartnerId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPartnerId,
  });

  // Partner product commissions
  const { data: productCommissions = [], isLoading: isLoadingProductCommissions } = 
    usePartnerProductCommissions(selectedPartnerId);

  // Initialize default rate when settings load
  useState(() => {
    if (settings?.default_commission_rate && !defaultRate) {
      setDefaultRate(settings.default_commission_rate.toString());
    }
  });

  // Update partner rate when partner changes
  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    const partner = partners.find(p => p.id === partnerId);
    setPartnerRate(partner?.commission_percent?.toString() || '');
    setSelectedProductId('');
    setProductRate('');
  };

  // Handlers
  const handleSaveDefault = async () => {
    const rate = parseFloat(defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    await updateDefaultCommission(rate);
  };

  const handleSavePartner = async () => {
    if (!selectedPartnerId) return;
    const rate = partnerRate ? parseFloat(partnerRate) : null;
    if (rate !== null && (isNaN(rate) || rate < 0 || rate > 100)) return;
    await setPartnerCommission({ partnerId: selectedPartnerId, rate });
  };

  const handleClearPartner = async () => {
    if (!selectedPartnerId) return;
    await setPartnerCommission({ partnerId: selectedPartnerId, rate: null });
    setPartnerRate('');
  };

  const handleAddProductOverride = async () => {
    if (!selectedPartnerId || !selectedProductId) return;
    const rate = parseFloat(productRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    await upsertProductCommission({ 
      partnerId: selectedPartnerId, 
      productId: selectedProductId, 
      rate 
    });
    setSelectedProductId('');
    setProductRate('');
  };

  const handleDeleteProductOverride = async (id: string) => {
    if (!selectedPartnerId) return;
    await deleteProductCommission({ id, partnerId: selectedPartnerId });
  };

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Percent className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity Commissions</h1>
          <p className="text-muted-foreground">
            Manage commission rates at global, partner, and product levels
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Global Default */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Global</Badge>
              Default Commission Rate
            </CardTitle>
            <CardDescription>
              Applied when no partner or product override exists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSettings ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="defaultRate">Rate (%)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="defaultRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={defaultRate || settings?.default_commission_rate || ''}
                      onChange={(e) => setDefaultRate(e.target.value)}
                      placeholder="10"
                    />
                    <Button 
                      onClick={handleSaveDefault} 
                      disabled={isUpdatingDefault}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Partner Override */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">Partner</Badge>
              Partner Commission Override
            </CardTitle>
            <CardDescription>
              Override the default rate for a specific partner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Partner</Label>
              <Select
                value={selectedPartnerId || ''}
                onValueChange={handlePartnerChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a partner..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPartners ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                        {partner.commission_percent && (
                          <span className="text-muted-foreground ml-2">
                            ({partner.commission_percent}%)
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPartnerId && (
              <div>
                <Label htmlFor="partnerRate">Commission Rate (%)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="partnerRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={partnerRate}
                    onChange={(e) => setPartnerRate(e.target.value)}
                    placeholder={`Default: ${settings?.default_commission_rate || 10}%`}
                  />
                  <Button 
                    onClick={handleSavePartner} 
                    disabled={isSettingPartner}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleClearPartner} 
                    disabled={isSettingPartner || !selectedPartner?.commission_percent}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use global default
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card 3: Partner+Product Overrides */}
      {selectedPartnerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Product</Badge>
              Product Commission Overrides
              <span className="text-muted-foreground font-normal">
                for {selectedPartner?.name}
              </span>
            </CardTitle>
            <CardDescription>
              Override commission rates for specific products (highest priority)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new override */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Product</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProducts ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : products.length === 0 ? (
                      <SelectItem value="none" disabled>No products found</SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={productRate}
                  onChange={(e) => setProductRate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleAddProductOverride}
                disabled={isUpsertingProduct || !selectedProductId || !productRate}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* List existing overrides */}
            {isLoadingProductCommissions ? (
              <Skeleton className="h-20 w-full" />
            ) : productCommissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No product overrides configured
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-32">Rate (%)</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{commission.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{commission.commission_rate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProductOverride(commission.id)}
                          disabled={isDeletingProduct}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Priority info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Commission Priority</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li><strong>Product Override</strong> — Specific rate for partner + product combination</li>
            <li><strong>Partner Override</strong> — Custom rate for the partner</li>
            <li><strong>Global Default</strong> — Fallback rate ({settings?.default_commission_rate || 10}%)</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityCommissionsPage;
