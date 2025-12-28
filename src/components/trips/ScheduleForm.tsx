import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Trip } from '@/hooks/useTripsData';

interface ScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    trip_id: string;
    departure_time: string;
    days_of_week: number[];
    seasonal_start_date?: string;
    seasonal_end_date?: string;
    status: 'active' | 'inactive';
  }) => Promise<{ error: Error | null }>;
  trips: Trip[];
  initialData?: {
    trip_id?: string;
    departure_time?: string;
    days_of_week?: number[];
    seasonal_start_date?: string;
    seasonal_end_date?: string;
    status?: 'active' | 'inactive';
  };
  isEdit?: boolean;
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const ScheduleForm = ({ open, onClose, onSubmit, trips, initialData, isEdit }: ScheduleFormProps) => {
  const [tripId, setTripId] = useState(initialData?.trip_id || '');
  const [departureTime, setDepartureTime] = useState(initialData?.departure_time || '08:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialData?.days_of_week || [0, 1, 2, 3, 4, 5, 6]);
  const [seasonalStart, setSeasonalStart] = useState(initialData?.seasonal_start_date || '');
  const [seasonalEnd, setSeasonalEnd] = useState(initialData?.seasonal_end_date || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeTrips = trips.filter(t => t.status === 'active');

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tripId) {
      setError('Please select a trip');
      return;
    }

    if (!departureTime) {
      setError('Please enter departure time');
      return;
    }

    if (daysOfWeek.length === 0) {
      setError('Please select at least one day');
      return;
    }

    if (seasonalStart && seasonalEnd && seasonalStart > seasonalEnd) {
      setError('Seasonal end date must be after start date');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      trip_id: tripId,
      departure_time: departureTime,
      days_of_week: daysOfWeek,
      seasonal_start_date: seasonalStart || undefined,
      seasonal_end_date: seasonalEnd || undefined,
      status,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
      // Reset form
      setTripId('');
      setDepartureTime('08:00');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setSeasonalStart('');
      setSeasonalEnd('');
      setStatus('active');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Trip *</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trip" />
              </SelectTrigger>
              <SelectContent>
                {activeTrips.length === 0 ? (
                  <SelectItem value="" disabled>No active trips available</SelectItem>
                ) : (
                  activeTrips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.trip_name} ({trip.route?.route_name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departure Time *</Label>
              <Input
                type="time"
                value={departureTime}
                onChange={e => setDepartureTime(e.target.value)}
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

          <div className="space-y-2">
            <Label>Active Days *</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <label
                  key={day.value}
                  className={`flex items-center justify-center w-12 h-10 rounded-lg border cursor-pointer transition-colors ${
                    daysOfWeek.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={daysOfWeek.includes(day.value)}
                    onChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Seasonal Period (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                placeholder="Start date"
                value={seasonalStart}
                onChange={e => setSeasonalStart(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End date"
                value={seasonalEnd}
                onChange={e => setSeasonalEnd(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for year-round operation
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleForm;
