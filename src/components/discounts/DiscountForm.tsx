import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { DiscountFormData, DiscountCategory, DISCOUNT_CATEGORIES, DiscountRule } from '@/hooks/useDiscountsData';

interface DiscountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DiscountFormData) => Promise<{ error: Error | null }>;
  initialData?: DiscountRule | null;
  isEdit?: boolean;
  trips?: { id: string; trip_name: string }[];
  routes?: { id: string; route_name: string }[];
}

const DiscountForm = ({ open, onClose, onSubmit, initialData, isEdit, trips = [], routes = [] }: DiscountFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'promo_code' | 'automatic'>('promo_code');
  const [category, setCategory] = useState<DiscountCategory>('cart_percent');
  const [discountValue, setDiscountValue] = useState('');
  const [discountValueType, setDiscountValueType] = useState<'percent' | 'fixed'>('percent');
  const [bookStartDate, setBookStartDate] = useState('');
  const [bookEndDate, setBookEndDate] = useState('');
  const [checkinStartDate, setCheckinStartDate] = useState('');
  const [checkinEndDate, setCheckinEndDate] = useState('');
  const [minimumSpend, setMinimumSpend] = useState('');
  const [minPax, setMinPax] = useState('');
  const [individualUseOnly, setIndividualUseOnly] = useState(false);
  const [usageLimit, setUsageLimit] = useState('');
  const [limitPerCustomer, setLimitPerCustomer] = useState('1');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [freeTicketMinPax, setFreeTicketMinPax] = useState('2');
  const [freeTicketPaxType, setFreeTicketPaxType] = useState('any');
  const [lastMinuteHours, setLastMinuteHours] = useState('24');
  const [valueAddedAddonName, setValueAddedAddonName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code || '');
      setType(initialData.type);
      setCategory(initialData.category || 'cart_percent');
      setDiscountValue(String(initialData.discount_value));
      setDiscountValueType(initialData.discount_value_type);
      setBookStartDate(initialData.book_start_date || '');
      setBookEndDate(initialData.book_end_date || '');
      setCheckinStartDate(initialData.checkin_start_date || '');
      setCheckinEndDate(initialData.checkin_end_date || '');
      setMinimumSpend(String(initialData.minimum_spend || ''));
      setMinPax(initialData.min_pax ? String(initialData.min_pax) : '');
      setIndividualUseOnly(initialData.individual_use_only);
      setUsageLimit(initialData.usage_limit ? String(initialData.usage_limit) : '');
      setLimitPerCustomer(String(initialData.limit_per_customer || 1));
      setSelectedTripIds(initialData.applicable_trip_ids || []);
      setSelectedRouteIds(initialData.applicable_route_ids || []);
      setFreeTicketMinPax(String(initialData.free_ticket_min_pax || 2));
      setFreeTicketPaxType(initialData.free_ticket_pax_type || 'any');
      setLastMinuteHours(String(initialData.last_minute_hours || 24));
      setValueAddedAddonName(initialData.value_added_addon_name || '');
      setStatus(initialData.status);
    } else {
      // Reset form
      setCode('');
      setType('promo_code');
      setCategory('cart_percent');
      setDiscountValue('');
      setDiscountValueType('percent');
      setBookStartDate('');
      setBookEndDate('');
      setCheckinStartDate('');
      setCheckinEndDate('');
      setMinimumSpend('');
      setMinPax('');
      setIndividualUseOnly(false);
      setUsageLimit('');
      setLimitPerCustomer('1');
      setSelectedTripIds([]);
      setSelectedRouteIds([]);
      setFreeTicketMinPax('2');
      setFreeTicketPaxType('any');
      setLastMinuteHours('24');
      setValueAddedAddonName('');
      setStatus('active');
    }
  }, [initialData, open]);

  // Auto-set discount value type based on category
  useEffect(() => {
    if (category.includes('percent')) {
      setDiscountValueType('percent');
    } else if (category.includes('fixed')) {
      setDiscountValueType('fixed');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!discountValue || parseFloat(discountValue) <= 0) {
      setError('Discount value is required');
      setLoading(false);
      return;
    }

    const formData: DiscountFormData = {
      code: code.trim() || undefined,
      type,
      category,
      discount_value: parseFloat(discountValue),
      discount_value_type: discountValueType,
      book_start_date: bookStartDate || undefined,
      book_end_date: bookEndDate || undefined,
      checkin_start_date: checkinStartDate || undefined,
      checkin_end_date: checkinEndDate || undefined,
      minimum_spend: minimumSpend ? parseFloat(minimumSpend) : undefined,
      min_pax: minPax ? parseInt(minPax) : undefined,
      individual_use_only: individualUseOnly,
      usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
      limit_per_customer: parseInt(limitPerCustomer) || 1,
      applicable_trip_ids: selectedTripIds.length > 0 ? selectedTripIds : undefined,
      applicable_route_ids: selectedRouteIds.length > 0 ? selectedRouteIds : undefined,
      free_ticket_min_pax: parseInt(freeTicketMinPax) || 2,
      free_ticket_pax_type: freeTicketPaxType,
      last_minute_hours: parseInt(lastMinuteHours) || 24,
      value_added_addon_name: valueAddedAddonName || undefined,
      status,
    };

    const result = await onSubmit(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  const showScheduleFields = category === 'schedule_fixed' || category === 'schedule_percent';
  const showFreeTicketFields = category === 'free_ticket';
  const showLastMinuteFields = category === 'last_minute';
  const showValueAddedFields = category === 'value_added';
  const showProductFields = category === 'per_product' || showScheduleFields;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Discount Rule' : 'Create Discount Rule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Discount Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20 (optional for automatic)"
              />
              <p className="text-xs text-muted-foreground">Leave empty for automatic discount</p>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'promo_code' | 'automatic')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo_code">Promo Code</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Discount Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DiscountCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">Amount</Label>
              <Input
                id="discountValue"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountValueType === 'percent' ? 'e.g. 10' : 'e.g. 50000'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Value Type</Label>
              <Select 
                value={discountValueType} 
                onValueChange={(v) => setDiscountValueType(v as 'percent' | 'fixed')}
                disabled={category.includes('percent') || category.includes('fixed')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (IDR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Book Period */}
          <div className="space-y-2">
            <Label>Book Period (when booking can be made)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={bookStartDate}
                onChange={(e) => setBookStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={bookEndDate}
                onChange={(e) => setBookEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Check-in Period */}
          <div className="space-y-2">
            <Label>Check-in Period (departure date range)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={checkinStartDate}
                onChange={(e) => setCheckinStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={checkinEndDate}
                onChange={(e) => setCheckinEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumSpend">Minimum Spend (IDR)</Label>
              <Input
                id="minimumSpend"
                type="number"
                value={minimumSpend}
                onChange={(e) => setMinimumSpend(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPax">Minimum Passengers</Label>
              <Input
                id="minPax"
                type="number"
                value={minPax}
                onChange={(e) => setMinPax(e.target.value)}
                placeholder="No minimum"
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Limit Per Coupon</Label>
              <Input
                id="usageLimit"
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="0 = Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitPerCustomer">Limit Per Customer</Label>
              <Input
                id="limitPerCustomer"
                type="number"
                value={limitPerCustomer}
                onChange={(e) => setLimitPerCustomer(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {/* Individual Use Only */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Individual Use Only</Label>
              <p className="text-xs text-muted-foreground">Cannot be combined with other discounts</p>
            </div>
            <Switch checked={individualUseOnly} onCheckedChange={setIndividualUseOnly} />
          </div>

          {/* Free Ticket Fields */}
          {showFreeTicketFields && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Free Ticket Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Paid Passengers</Label>
                  <Input
                    type="number"
                    value={freeTicketMinPax}
                    onChange={(e) => setFreeTicketMinPax(e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passenger Type</Label>
                  <Select value={freeTicketPaxType} onValueChange={setFreeTicketPaxType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="adult">Adult Only</SelectItem>
                      <SelectItem value="child">Child Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Last Minute Fields */}
          {showLastMinuteFields && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Last Minute Deal Settings</h4>
              <div className="space-y-2">
                <Label>Hours Before Departure</Label>
                <Input
                  type="number"
                  value={lastMinuteHours}
                  onChange={(e) => setLastMinuteHours(e.target.value)}
                  placeholder="24"
                />
                <p className="text-xs text-muted-foreground">
                  Discount applies if booking is made within X hours of departure
                </p>
              </div>
            </div>
          )}

          {/* Value Added Fields */}
          {showValueAddedFields && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Value Added Settings</h4>
              <div className="space-y-2">
                <Label>Free Add-on Name</Label>
                <Input
                  value={valueAddedAddonName}
                  onChange={(e) => setValueAddedAddonName(e.target.value)}
                  placeholder="e.g. Free Luggage, Free Pickup"
                />
              </div>
            </div>
          )}

          {/* Product/Schedule Selection */}
          {showProductFields && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Apply to Specific Products</h4>
              
              {routes.length > 0 && (
                <div className="space-y-2">
                  <Label>Routes</Label>
                  <div className="flex flex-wrap gap-2">
                    {routes.map((route) => (
                      <Button
                        key={route.id}
                        type="button"
                        variant={selectedRouteIds.includes(route.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedRouteIds(prev => 
                            prev.includes(route.id) 
                              ? prev.filter(id => id !== route.id)
                              : [...prev, route.id]
                          );
                        }}
                      >
                        {route.route_name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {trips.length > 0 && (
                <div className="space-y-2">
                  <Label>Trips</Label>
                  <div className="flex flex-wrap gap-2">
                    {trips.map((trip) => (
                      <Button
                        key={trip.id}
                        type="button"
                        variant={selectedTripIds.includes(trip.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedTripIds(prev => 
                            prev.includes(trip.id) 
                              ? prev.filter(id => id !== trip.id)
                              : [...prev, trip.id]
                          );
                        }}
                      >
                        {trip.trip_name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Status</Label>
              <p className="text-xs text-muted-foreground">Enable or disable this discount</p>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Discount' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountForm;
