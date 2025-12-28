import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Port } from '@/hooks/useTripsData';
import { ArrowRight } from 'lucide-react';

interface RouteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    origin_port_id: string;
    destination_port_id: string;
    duration_minutes?: number;
    status: 'active' | 'inactive';
  }) => Promise<{ error: Error | null }>;
  ports: Port[];
  initialData?: {
    origin_port_id?: string;
    destination_port_id?: string;
    duration_minutes?: number;
    status?: 'active' | 'inactive';
  };
  isEdit?: boolean;
}

const RouteForm = ({ open, onClose, onSubmit, ports, initialData, isEdit }: RouteFormProps) => {
  const [originPortId, setOriginPortId] = useState(initialData?.origin_port_id || '');
  const [destinationPortId, setDestinationPortId] = useState(initialData?.destination_port_id || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes?.toString() || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const originPort = ports.find(p => p.id === originPortId);
  const destinationPort = ports.find(p => p.id === destinationPortId);
  const routePreview = originPort && destinationPort 
    ? `${originPort.name} → ${destinationPort.name}` 
    : 'Select ports to preview route name';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!originPortId || !destinationPortId) {
      setError('Please select both origin and destination ports');
      return;
    }

    if (originPortId === destinationPortId) {
      setError('Origin and destination must be different');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      origin_port_id: originPortId,
      destination_port_id: destinationPortId,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      status,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
      // Reset form
      setOriginPortId('');
      setDestinationPortId('');
      setDurationMinutes('');
      setStatus('active');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Route' : 'Create Route'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Route Preview */}
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Route Name (auto-generated)</p>
            <p className="font-semibold text-lg flex items-center justify-center gap-2">
              {originPort?.name || '?'} 
              <ArrowRight className="w-4 h-4" /> 
              {destinationPort?.name || '?'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origin Port</Label>
              <Select value={originPortId} onValueChange={setOriginPortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(port => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination Port</Label>
              <Select value={destinationPortId} onValueChange={setDestinationPortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.filter(p => p.id !== originPortId).map(port => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
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
            <Button type="submit" variant="hero" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RouteForm;
