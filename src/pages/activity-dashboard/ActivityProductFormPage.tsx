import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Package,
  Clock,
  Key,
  Save,
  Loader2,
  Plus,
  Trash2,
  X,
  QrCode,
  FileText,
  Ban,
  Image,
  Link,
  Copy,
  Code,
} from 'lucide-react';
import { ProductImageGallery } from '@/components/activity-products/ProductImageGallery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityCategoriesData } from '@/hooks/useActivityCategoriesData';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

type ProductType = 'activity' | 'time_slot' | 'rental';
type ProductStatus = 'draft' | 'active' | 'inactive';
type VoucherType = 'e_voucher' | 'paper_voucher' | 'not_required';
type GuestFormApply = 'per_participant' | 'per_booking';

interface PricingTier {
  id?: string;
  tier_name: string;
  price: number;
  min_age: number | null;
  max_age: number | null;
}

interface TimeSlot {
  id?: string;
  slot_time: string;
  capacity: number;
}

interface RentalOption {
  id?: string;
  duration_unit: 'hour' | 'day';
  duration_value: number;
  price: number;
}

interface CustomField {
  label: string;
  required: boolean;
}

interface GuestFormConfig {
  name: boolean;
  phone: boolean;
  age: boolean;
  custom_fields: CustomField[];
}

// Safe type casting helpers
const asCustomField = (item: unknown): CustomField | null => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const obj = item as Record<string, unknown>;
  const label = typeof obj.label === 'string' ? obj.label.trim() : '';
  if (!label) return null;
  return {
    label,
    required: typeof obj.required === 'boolean' ? obj.required : false,
  };
};

const asGuestFormConfig = (json: Json | null): GuestFormConfig => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { name: true, phone: false, age: false, custom_fields: [] };
  }
  const obj = json as Record<string, unknown>;
  const customFields: CustomField[] = [];
  if (Array.isArray(obj.custom_fields)) {
    for (const item of obj.custom_fields) {
      const parsed = asCustomField(item);
      if (parsed) customFields.push(parsed);
    }
  }
  return {
    name: typeof obj.name === 'boolean' ? obj.name : true,
    phone: typeof obj.phone === 'boolean' ? obj.phone : false,
    age: typeof obj.age === 'boolean' ? obj.age : false,
    custom_fields: customFields,
  };
};

const asStringArray = (arr: unknown): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === 'string');
};

const toJson = (config: GuestFormConfig): Json => {
  return config as unknown as Json;
};


const ActivityProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categories } = useActivityCategoriesData();

  // Form state
  const [productType, setProductType] = useState<ProductType>('activity');
  const [formData, setFormData] = useState({
    category_id: '',
    language: 'en',
    name: '',
    highlights: [] as string[],
    short_description: '',
    full_description: '',
    location_name: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    voucher_type: 'e_voucher' as VoucherType,
    generate_qr_tickets: true,
    guest_form_enabled: false,
    guest_form_config: { name: true, phone: false, age: false, custom_fields: [] } as GuestFormConfig,
    guest_form_apply_to: 'per_booking' as GuestFormApply,
    default_capacity: 50,
    inventory_count: 1,
    status: 'draft' as ProductStatus,
  });

  const [highlightInput, setHighlightInput] = useState('');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { tier_name: 'Adult', price: 0, min_age: 12, max_age: null },
  ]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rentalOptions, setRentalOptions] = useState<RentalOption[]>([]);

  // Fetch partner ID
  const { data: partnerId } = useQuery({
    queryKey: ['partner-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('get_user_partner_id', { _user_id: user.id });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user?.id,
  });

  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['activity-product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('activity_products')
        .select(`
          *,
          pricing:activity_pricing(*),
          time_slots:activity_time_slots(*),
          rental_options:activity_rental_options(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setProductType(product.product_type as ProductType);
      setFormData({
        category_id: product.category_id || '',
        language: product.language,
        name: product.name,
        highlights: asStringArray(product.highlights),
        short_description: product.short_description || '',
        full_description: product.full_description || '',
        location_name: product.location_name || '',
        location_lat: product.location_lat,
        location_lng: product.location_lng,
        voucher_type: product.voucher_type as VoucherType,
        generate_qr_tickets: product.generate_qr_tickets ?? true,
        guest_form_enabled: product.guest_form_enabled || false,
        guest_form_config: asGuestFormConfig(product.guest_form_config),
        guest_form_apply_to: product.guest_form_apply_to as GuestFormApply,
        default_capacity: product.default_capacity || 50,
        inventory_count: product.inventory_count || 1,
        status: product.status as ProductStatus,
      });
      if (product.pricing?.length) {
        setPricingTiers(product.pricing.map((p: any) => ({
          id: p.id,
          tier_name: p.tier_name,
          price: p.price,
          min_age: p.min_age,
          max_age: p.max_age,
        })));
      }
      if (product.time_slots?.length) {
        setTimeSlots(product.time_slots.map((s: any) => ({
          id: s.id,
          slot_time: s.slot_time,
          capacity: s.capacity,
        })));
      }
      if (product.rental_options?.length) {
        setRentalOptions(product.rental_options.map((o: any) => ({
          id: o.id,
          duration_unit: o.duration_unit,
          duration_value: o.duration_value,
          price: o.price,
        })));
      }
    }
  }, [product]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!partnerId) throw new Error('No partner ID');

      const productData = {
        partner_id: partnerId,
        category_id: formData.category_id || null,
        product_type: productType,
        language: formData.language,
        name: formData.name,
        highlights: formData.highlights,
        short_description: formData.short_description || null,
        full_description: formData.full_description || null,
        location_name: formData.location_name || null,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        voucher_type: formData.voucher_type,
        generate_qr_tickets: formData.generate_qr_tickets,
        guest_form_enabled: formData.guest_form_enabled,
        guest_form_config: toJson(formData.guest_form_config),
        guest_form_apply_to: formData.guest_form_apply_to,
        default_capacity: productType === 'activity' ? formData.default_capacity : null,
        inventory_count: productType === 'rental' ? formData.inventory_count : null,
        status: formData.status,
      };

      let productId: string;

      if (isEditing) {
        const { error } = await supabase
          .from('activity_products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
        productId = id!;
      } else {
        const { data, error } = await supabase
          .from('activity_products')
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle pricing tiers (for activity and time_slot)
      if (productType !== 'rental') {
        // Delete existing and insert new
        await supabase.from('activity_pricing').delete().eq('product_id', productId);
        if (pricingTiers.length > 0) {
          const { error } = await supabase.from('activity_pricing').insert(
            pricingTiers.map(t => ({
              product_id: productId,
              partner_id: partnerId,
              tier_name: t.tier_name,
              price: t.price,
              min_age: t.min_age,
              max_age: t.max_age,
            }))
          );
          if (error) throw error;
        }
      }

      // Handle time slots
      if (productType === 'time_slot') {
        await supabase.from('activity_time_slots').delete().eq('product_id', productId);
        if (timeSlots.length > 0) {
          const { error } = await supabase.from('activity_time_slots').insert(
            timeSlots.map(s => ({
              product_id: productId,
              partner_id: partnerId,
              slot_time: s.slot_time,
              capacity: s.capacity,
            }))
          );
          if (error) throw error;
        }
      }

      // Handle rental options
      if (productType === 'rental') {
        await supabase.from('activity_rental_options').delete().eq('product_id', productId);
        if (rentalOptions.length > 0) {
          const { error } = await supabase.from('activity_rental_options').insert(
            rentalOptions.map(o => ({
              product_id: productId,
              partner_id: partnerId,
              duration_unit: o.duration_unit,
              duration_value: o.duration_value,
              price: o.price,
            }))
          );
          if (error) throw error;
        }
      }

      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success(isEditing ? 'Product updated' : 'Product created');
      navigate('/activity-dashboard/products');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save product');
    },
  });

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }));
      setHighlightInput('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const addPricingTier = () => {
    setPricingTiers(prev => [...prev, { tier_name: '', price: 0, min_age: null, max_age: null }]);
  };

  const updatePricingTier = (index: number, field: keyof PricingTier, value: any) => {
    setPricingTiers(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(prev => prev.filter((_, i) => i !== index));
  };

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { slot_time: '09:00', capacity: 10 }]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    setTimeSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const addRentalOption = () => {
    setRentalOptions(prev => [...prev, { duration_unit: 'hour', duration_value: 1, price: 0 }]);
  };

  const updateRentalOption = (index: number, field: keyof RentalOption, value: any) => {
    setRentalOptions(prev => prev.map((o, i) => i === index ? { ...o, [field]: value } : o));
  };

  const removeRentalOption = (index: number) => {
    setRentalOptions(prev => prev.filter((_, i) => i !== index));
  };

  if (isEditing && isLoadingProduct) {
    return (
      <ActivityDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ActivityDashboardLayout>
    );
  }

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/activity-dashboard/products')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Product' : 'Create Product'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update your product details' : 'Add a new activity, time slot, or rental'}
            </p>
          </div>
        </div>

        {/* Product Type Selection (only for new products) */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Product Type</CardTitle>
              <CardDescription>Choose the type of product you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType('activity')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    productType === 'activity' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Package className="w-8 h-8 mb-2 text-blue-600" />
                  <h3 className="font-semibold">Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Flexible activity with daily capacity
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('time_slot')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    productType === 'time_slot' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Clock className="w-8 h-8 mb-2 text-amber-600" />
                  <h3 className="font-semibold">Time Slot</h3>
                  <p className="text-sm text-muted-foreground">
                    Fixed time sessions with slot capacity
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('rental')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    productType === 'rental' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Key className="w-8 h-8 mb-2 text-purple-600" />
                  <h3 className="font-semibold">Rental</h3>
                  <p className="text-sm text-muted-foreground">
                    Duration-based rental with inventory
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form Tabs */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">
              {productType === 'rental' ? 'Rental Options' : 'Pricing'}
            </TabsTrigger>
            {productType === 'time_slot' && (
              <TabsTrigger value="slots">Time Slots</TabsTrigger>
            )}
            <TabsTrigger value="images">
              <Image className="h-4 w-4 mr-1" />
              Images
            </TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.status === 'active').map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="id">Indonesian</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Snorkeling Trip to Nusa Penida"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief description for listings (max 160 characters)"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{formData.short_description.length}/160</p>
                </div>

                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <Textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                    placeholder="Detailed description of the activity..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Highlights</Label>
                  <div className="flex gap-2">
                    <Input
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      placeholder="Add a highlight point"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                    />
                    <Button type="button" variant="outline" onClick={addHighlight}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.highlights.map((h, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {h}
                        <button onClick={() => removeHighlight(i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location Name</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                    placeholder="e.g., Nusa Penida, Bali"
                  />
                </div>

                {productType === 'activity' && (
                  <div className="space-y-2">
                    <Label>Default Daily Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.default_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_capacity: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                )}

                {productType === 'rental' && (
                  <div className="space-y-2">
                    <Label>Inventory Count</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.inventory_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, inventory_count: parseInt(e.target.value) || 1 }))}
                    />
                    <p className="text-xs text-muted-foreground">Number of units available for rental</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab (for activity and time_slot) */}
          {productType !== 'rental' && (
            <TabsContent value="pricing">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pricing Tiers</CardTitle>
                    <CardDescription>Set different prices for different guest types</CardDescription>
                  </div>
                  <Button onClick={addPricingTier} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier Name</TableHead>
                        <TableHead>Price (IDR)</TableHead>
                        <TableHead>Min Age</TableHead>
                        <TableHead>Max Age</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingTiers.map((tier, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={tier.tier_name}
                              onChange={(e) => updatePricingTier(index, 'tier_name', e.target.value)}
                              placeholder="e.g., Adult, Child"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={tier.price}
                              onChange={(e) => updatePricingTier(index, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={tier.min_age ?? ''}
                              onChange={(e) => updatePricingTier(index, 'min_age', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="-"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={tier.max_age ?? ''}
                              onChange={(e) => updatePricingTier(index, 'max_age', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="-"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePricingTier(index)}
                              disabled={pricingTiers.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Rental Options Tab */}
          {productType === 'rental' && (
            <TabsContent value="pricing">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Rental Options</CardTitle>
                    <CardDescription>Set duration-based pricing</CardDescription>
                  </div>
                  <Button onClick={addRentalOption} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Duration</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price (IDR)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentalOptions.map((option, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={option.duration_value}
                              onChange={(e) => updateRentalOption(index, 'duration_value', parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={option.duration_unit}
                              onValueChange={(value) => updateRentalOption(index, 'duration_unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hour">Hour(s)</SelectItem>
                                <SelectItem value="day">Day(s)</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={option.price}
                              onChange={(e) => updateRentalOption(index, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRentalOption(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rentalOptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No rental options. Click "Add Option" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Time Slots Tab */}
          {productType === 'time_slot' && (
            <TabsContent value="slots">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Time Slots</CardTitle>
                    <CardDescription>Define available time slots for this activity</CardDescription>
                  </div>
                  <Button onClick={addTimeSlot} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.map((slot, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="time"
                              value={slot.slot_time}
                              onChange={(e) => updateTimeSlot(index, 'slot_time', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={slot.capacity}
                              onChange={(e) => updateTimeSlot(index, 'capacity', parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeSlot(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {timeSlots.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No time slots. Click "Add Slot" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Images Tab */}
          <TabsContent value="images">
            <ProductImageGallery productId={id} partnerId={partnerId ?? undefined} />
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options">
            <div className="space-y-4">
              {/* Voucher Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Voucher Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, voucher_type: 'e_voucher' }))}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        formData.voucher_type === 'e_voucher' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <QrCode className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-medium">E-Voucher</p>
                      <p className="text-xs text-muted-foreground">QR Code</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, voucher_type: 'paper_voucher' }))}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        formData.voucher_type === 'paper_voucher' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Paper Voucher</p>
                      <p className="text-xs text-muted-foreground">Printable</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, voucher_type: 'not_required' }))}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        formData.voucher_type === 'not_required' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Ban className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Not Required</p>
                      <p className="text-xs text-muted-foreground">No voucher</p>
                    </button>
                  </div>

                  {/* Generate QR Tickets Option */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label>Generate QR Tickets</Label>
                      <p className="text-sm text-muted-foreground">
                        Create scannable QR code tickets for check-in
                      </p>
                    </div>
                    <Switch
                      checked={formData.generate_qr_tickets}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, generate_qr_tickets: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Guest Form */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Guest Form</CardTitle>
                      <CardDescription>Collect guest information at checkout</CardDescription>
                    </div>
                    <Switch
                      checked={formData.guest_form_enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, guest_form_enabled: checked }))
                      }
                    />
                  </div>
                </CardHeader>
                {formData.guest_form_enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Required Fields</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Name</span>
                          <Switch
                            checked={formData.guest_form_config.name}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({
                                ...prev,
                                guest_form_config: { ...prev.guest_form_config, name: checked }
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Phone</span>
                          <Switch
                            checked={formData.guest_form_config.phone}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({
                                ...prev,
                                guest_form_config: { ...prev.guest_form_config, phone: checked }
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Age</span>
                          <Switch
                            checked={formData.guest_form_config.age}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({
                                ...prev,
                                guest_form_config: { ...prev.guest_form_config, age: checked }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Apply To</Label>
                      <Select
                        value={formData.guest_form_apply_to}
                        onValueChange={(value: GuestFormApply) => 
                          setFormData(prev => ({ ...prev, guest_form_apply_to: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_booking">Per Booking</SelectItem>
                          <SelectItem value="per_participant">Per Participant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Widget / Embed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Widget / Embed
                  </CardTitle>
                  <CardDescription>Share or embed this product on your website</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Widget URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            readOnly 
                            value={`${window.location.origin}/widget/activity/${id}`}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/widget/activity/${id}`);
                              toast.success('Widget URL copied');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Embed Code (iframe)</Label>
                        <div className="flex gap-2">
                          <Textarea 
                            readOnly 
                            rows={3}
                            value={`<iframe\n  src="${window.location.origin}/widget/activity/${id}"\n  style="width:100%;height:900px;border:0;"\n  loading="lazy"\n></iframe>`}
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`<iframe\n  src="${window.location.origin}/widget/activity/${id}"\n  style="width:100%;height:900px;border:0;"\n  loading="lazy"\n></iframe>`);
                              toast.success('Embed code copied');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`/widget/activity/${id}`, '_blank')}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Preview Widget
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Save the product first to generate a widget link.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProductStatus) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only active products are visible and bookable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pb-8">
          <Button variant="outline" onClick={() => navigate('/activity-dashboard/products')}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={!formData.name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </ActivityDashboardLayout>
  );
};

export default ActivityProductFormPage;
