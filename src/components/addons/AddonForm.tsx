import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Addon, AddonFormData, AddonType, AddonPricingModel, AddonApplicability } from '@/hooks/useAddonsData';

interface AddonFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddonFormData) => Promise<{ error: Error | null }>;
  initialData?: Addon | null;
  isEdit?: boolean;
  trips?: { id: string; trip_name: string }[];
  routes?: { id: string; route_name: string }[];
}

const AddonForm = ({ open, onClose, onSubmit, initialData, isEdit, trips = [], routes = [] }: AddonFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AddonType>('generic');
  const [pricingModel, setPricingModel] = useState<AddonPricingModel>('per_booking');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [enablePickupZones, setEnablePickupZones] = useState(false);
  const [pickupRequiredInfo, setPickupRequiredInfo] = useState({
    hotel_name: false,
    address: false,
    pickup_note: false,
  });
  const [isMandatory, setIsMandatory] = useState(false);
  const [applicability, setApplicability] = useState<AddonApplicability>('both');
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setType(initialData.type);
      setPricingModel(initialData.pricing_model);
      setPrice(String(initialData.price));
      setStatus(initialData.status);
      setEnablePickupZones(initialData.enable_pickup_zones);
      setPickupRequiredInfo(initialData.pickup_required_info);
      setIsMandatory(initialData.is_mandatory);
      setApplicability(initialData.applicability);
      setSelectedRouteIds(initialData.applicable_route_ids || []);
      setSelectedTripIds(initialData.applicable_trip_ids || []);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setType('generic');
      setPricingModel('per_booking');
      setPrice('');
      setStatus('active');
      setEnablePickupZones(false);
      setPickupRequiredInfo({ hotel_name: false, address: false, pickup_note: false });
      setIsMandatory(false);
      setApplicability('both');
      setSelectedRouteIds([]);
      setSelectedTripIds([]);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }

    const formData: AddonFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      pricing_model: pricingModel,
      price: parseFloat(price),
      status,
      enable_pickup_zones: type === 'pickup' ? enablePickupZones : false,
      pickup_required_info: type === 'pickup' ? pickupRequiredInfo : undefined,
      is_mandatory: isMandatory,
      applicability,
      applicable_route_ids: selectedRouteIds.length > 0 ? selectedRouteIds : undefined,
      applicable_trip_ids: selectedTripIds.length > 0 ? selectedTripIds : undefined,
    };

    const result = await onSubmit(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Add-on' : 'Create Add-on'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Add-on Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Airport Pickup, Extra Luggage"
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for customers"
                rows={2}
              />
            </div>
          </div>

          {/* Type & Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AddonType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic Add-on</SelectItem>
                  <SelectItem value="pickup">Pick-up Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as AddonPricingModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_booking">Per Booking</SelectItem>
                  <SelectItem value="per_person">Per Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (IDR) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select value={applicability} onValueChange={(v) => setApplicability(v as AddonApplicability)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Fastboat & Activities)</SelectItem>
                  <SelectItem value="fastboat">Fastboat Only</SelectItem>
                  <SelectItem value="activities">Activities Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mandatory Option */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Mandatory Add-on</Label>
              <p className="text-xs text-muted-foreground">Customers must select this add-on during booking</p>
            </div>
            <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
          </div>

          {/* Pick-up Specific Fields */}
          {type === 'pickup' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Pick-up Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Pick-up Zones</Label>
                  <p className="text-xs text-muted-foreground">Allow different pricing per zone</p>
                </div>
                <Switch checked={enablePickupZones} onCheckedChange={setEnablePickupZones} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Required Customer Information</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hotel Name</span>
                    <Switch
                      checked={pickupRequiredInfo.hotel_name}
                      onCheckedChange={(v) => setPickupRequiredInfo(prev => ({ ...prev, hotel_name: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Address</span>
                    <Switch
                      checked={pickupRequiredInfo.address}
                      onCheckedChange={(v) => setPickupRequiredInfo(prev => ({ ...prev, address: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pickup Note</span>
                    <Switch
                      checked={pickupRequiredInfo.pickup_note}
                      onCheckedChange={(v) => setPickupRequiredInfo(prev => ({ ...prev, pickup_note: v }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Apply to specific products */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <h4 className="font-medium">Apply to Specific Products (Optional)</h4>
            <p className="text-xs text-muted-foreground">Leave empty to apply to all products</p>
            
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Add-on' : 'Create Add-on'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddonForm;
