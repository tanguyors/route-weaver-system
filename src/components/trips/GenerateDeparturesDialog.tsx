import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trip } from '@/hooks/useTripsData';
import { Calendar, Zap } from 'lucide-react';

interface GenerateDeparturesDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (tripId: string, startDate: string, endDate: string) => Promise<{ error: Error | null; count?: number }>;
  trips: Trip[];
}

const GenerateDeparturesDialog = ({ open, onClose, onGenerate, trips }: GenerateDeparturesDialogProps) => {
  const [tripId, setTripId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeTrips = trips.filter(t => t.status === 'active');

  // Set default dates (next 30 days)
  const getDefaultDates = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    return {
      start: today.toISOString().split('T')[0],
      end: nextMonth.toISOString().split('T')[0],
    };
  };

  const handleOpen = () => {
    const defaults = getDefaultDates();
    if (!startDate) setStartDate(defaults.start);
    if (!endDate) setEndDate(defaults.end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!tripId) {
      setError('Please select a trip');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    const result = await onGenerate(tripId, startDate, endDate);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(`Successfully generated ${result.count || 0} departures!`);
      setTimeout(() => {
        onClose();
        setSuccess('');
        setTripId('');
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) handleOpen();
      onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Generate Departures
          </DialogTitle>
          <DialogDescription>
            Create departure instances from active schedules for the selected date range.
          </DialogDescription>
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
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Departures will be created based on active schedules for this trip.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Departures'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDeparturesDialog;
