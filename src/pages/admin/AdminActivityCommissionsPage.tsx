import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Percent, Save, Trash2, Plus, X, Info, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

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

  // Date range for revenue
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month' | 'all'>('30d');

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return subDays(now, 7).toISOString();
      case '30d':
        return subDays(now, 30).toISOString();
      case 'month':
        return startOfMonth(now).toISOString();
      default:
        return null;
    }
  };

  // Fetch commission revenue summary
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['admin-commission-revenue', dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();
      
      let query = supabase
        .from('commission_records')
        .select(`
          id,
          gross_amount,
          platform_fee_amount,
          platform_fee_percent,
          partner_net_amount,
          currency,
          created_at,
          partner:partners(name)
        `)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate totals
  const totals = revenueData?.reduce((acc, record) => {
    const currency = record.currency || 'IDR';
    if (!acc[currency]) {
      acc[currency] = { gross: 0, platformFees: 0, partnerNet: 0, count: 0 };
    }
    acc[currency].gross += Number(record.gross_amount) || 0;
    acc[currency].platformFees += Number(record.platform_fee_amount) || 0;
    acc[currency].partnerNet += Number(record.partner_net_amount) || 0;
    acc[currency].count += 1;
    return acc;
  }, {} as Record<string, { gross: number; platformFees: number; partnerNet: number; count: number }>);

  // Group by partner
  const byPartner = revenueData?.reduce((acc, record) => {
    const partnerName = (record.partner as any)?.name || 'Unknown';
    if (!acc[partnerName]) {
      acc[partnerName] = { gross: 0, platformFees: 0, count: 0, currency: record.currency };
    }
    acc[partnerName].gross += Number(record.gross_amount) || 0;
    acc[partnerName].platformFees += Number(record.platform_fee_amount) || 0;
    acc[partnerName].count += 1;
    return acc;
  }, {} as Record<string, { gross: number; platformFees: number; count: number; currency: string }>);

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
  useEffect(() => {
    if (settings?.default_commission_rate !== undefined && defaultRate === '') {
      setDefaultRate(String(settings.default_commission_rate));
    }
  }, [settings?.default_commission_rate]);

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

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Percent className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Platform Commissions</h1>
          <p className="text-muted-foreground">
            Revenue collected from partner transactions
          </p>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Commission Revenue
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Rate Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Commission Revenue */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Date filter */}
          <div className="flex gap-2">
            {(['7d', '30d', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === '7d' && '7 Days'}
                {range === '30d' && '30 Days'}
                {range === 'month' && 'This Month'}
                {range === 'all' && 'All Time'}
              </Button>
            ))}
          </div>

          {/* Summary Cards */}
          {isLoadingRevenue ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(totals || {}).map(([currency, data]) => (
                <>
                  <Card key={`${currency}-fees`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Platform Revenue
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(data.platformFees, currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Commission collected
                      </p>
                    </CardContent>
                  </Card>
                  <Card key={`${currency}-gross`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Gross Volume
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.gross, currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total transaction volume
                      </p>
                    </CardContent>
                  </Card>
                  <Card key={`${currency}-net`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Partner Payouts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.partnerNet, currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Owed to partners
                      </p>
                    </CardContent>
                  </Card>
                  <Card key={`${currency}-count`}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.count}</div>
                      <p className="text-xs text-muted-foreground">
                        Commission records
                      </p>
                    </CardContent>
                  </Card>
                </>
              ))}
              {Object.keys(totals || {}).length === 0 && (
                <Card className="col-span-4">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No commission records found for this period
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Revenue by Partner */}
          <Card>
            <CardHeader>
              <CardTitle>Commission by Partner</CardTitle>
              <CardDescription>
                Platform revenue breakdown per partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRevenue ? (
                <Skeleton className="h-40" />
              ) : Object.keys(byPartner || {}).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No commission data available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Gross Volume</TableHead>
                      <TableHead className="text-right">Platform Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(byPartner || {})
                      .sort((a, b) => b[1].platformFees - a[1].platformFees)
                      .map(([partnerName, data]) => (
                        <TableRow key={partnerName}>
                          <TableCell className="font-medium">{partnerName}</TableCell>
                          <TableCell className="text-right">{data.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.gross, data.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">
                              {formatCurrency(data.platformFees, data.currency)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Commission Records</CardTitle>
              <CardDescription>
                Latest transactions with platform commission
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRevenue ? (
                <Skeleton className="h-40" />
              ) : (revenueData?.length || 0) === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No recent transactions
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData?.slice(0, 20).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(record.created_at), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{(record.partner as any)?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(record.gross_amount), record.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{record.platform_fee_percent}%</Badge>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(Number(record.platform_fee_amount), record.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Rate Settings */}
        <TabsContent value="settings" className="space-y-6">
          {/* Model explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Platform Take Rate Model</AlertTitle>
            <AlertDescription>
              The platform commission is the percentage kept from partner gross revenue. 
              Partners receive <strong>net_amount = gross_revenue - commission_amount</strong>.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1: Global Default */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Global</Badge>
                  Global Default Commission
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
                      <Label htmlFor="defaultRate">Platform commission rate (%)</Label>
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
                  Override the global default for a specific partner
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
                            {partner.commission_percent !== null && (
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
                    <Label htmlFor="partnerRate">Platform commission rate (%)</Label>
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
                        disabled={isSettingPartner || selectedPartner?.commission_percent === null}
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
                  Override platform commission for specific products (highest priority)
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
                        <TableHead className="w-32">Platform Rate (%)</TableHead>
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
              <p className="text-xs text-muted-foreground mt-3 border-t pt-3">
                Example: 1,000,000 IDR gross × 10% rate = 100,000 commission (platform keeps) / 900,000 net (partner receives)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminActivityCommissionsPage;
