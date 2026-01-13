import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Route } from '@/hooks/useTripsData';

interface TripFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    route_id: string;
    trip_name: string;
    description?: string;
    capacity_default: number;
    status: 'active' | 'inactive';
    adult_price: number;
    child_price?: number;
  }) => Promise<{ error: Error | null }>;
  routes: Route[];
  initialData?: {
    route_id?: string;
    trip_name?: string;
    description?: string;
    capacity_default?: number;
    status?: 'active' | 'inactive';
    adult_price?: number;
    child_price?: number;
  };
  isEdit?: boolean;
}

const TripForm = ({ open, onClose, onSubmit, routes, initialData, isEdit }: TripFormProps) => {
  const [routeId, setRouteId] = useState(initialData?.route_id || '');
  const [tripName, setTripName] = useState(initialData?.trip_name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [capacityDefault, setCapacityDefault] = useState(initialData?.capacity_default?.toString() || '50');
  const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'active');
  const [adultPrice, setAdultPrice] = useState(initialData?.adult_price?.toString() || '');
  const [childPrice, setChildPrice] = useState(initialData?.child_price?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setRouteId(initialData.route_id || '');
      setTripName(initialData.trip_name || '');
      setDescription(initialData.description || '');
      setCapacityDefault(initialData.capacity_default?.toString() || '50');
      setStatus(initialData.status || 'active');
      setAdultPrice(initialData.adult_price?.toString() || '');
      setChildPrice(initialData.child_price?.toString() || '');
    } else {
      // Reset to defaults when no initialData
      setRouteId('');
      setTripName('');
      setDescription('');
      setCapacityDefault('50');
      setStatus('active');
      setAdultPrice('');
      setChildPrice('');
    }
  }, [initialData]);

  const activeRoutes = routes.filter(r => r.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!routeId) {
      setError('Please select a route');
      return;
    }

    if (!tripName.trim()) {
      setError('Please enter a trip name');
      return;
    }

    const capacity = parseInt(capacityDefault);
    if (isNaN(capacity) || capacity < 1) {
      setError('Please enter a valid capacity (minimum 1)');
      return;
    }

    const adultPriceNum = parseFloat(adultPrice);
    if (isNaN(adultPriceNum) || adultPriceNum < 0) {
      setError('Please enter a valid adult price');
      return;
    }

    const childPriceNum = childPrice ? parseFloat(childPrice) : undefined;
    if (childPrice && (isNaN(childPriceNum!) || childPriceNum! < 0)) {
      setError('Please enter a valid child price');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      route_id: routeId,
      trip_name: tripName.trim(),
      description: description.trim() || undefined,
      capacity_default: capacity,
      status,
      adult_price: adultPriceNum,
      child_price: childPriceNum,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
      // Reset form
      setRouteId('');
      setTripName('');
      setDescription('');
      setCapacityDefault('50');
      setStatus('active');
      setAdultPrice('');
      setChildPrice('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Route *</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a route" />
              </SelectTrigger>
              <SelectContent>
                {activeRoutes.length === 0 ? (
                  <SelectItem value="" disabled>No active routes available</SelectItem>
                ) : (
                  activeRoutes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.route_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trip Name *</Label>
            <Input
              placeholder="e.g. Morning Express"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Optional description for this trip..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adult Price (IDR) *</Label>
              <Input
                type="number"
                placeholder="350000"
                value={adultPrice}
                onChange={e => setAdultPrice(e.target.value)}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Child Price (IDR)</Label>
              <Input
                type="number"
                placeholder="250000"
                value={childPrice}
                onChange={e => setChildPrice(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Capacity *</Label>
              <Input
                type="number"
                placeholder="50"
                value={capacityDefault}
                onChange={e => setCapacityDefault(e.target.value)}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: 'active' | 'inactive') => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Trip' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripForm;
