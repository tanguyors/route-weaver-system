import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Addon, PickupZone, PickupZoneFormData } from '@/hooks/useAddonsData';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface PickupZonesModalProps {
  open: boolean;
  onClose: () => void;
  addon: Addon | null;
  onCreateZone: (addonId: string, data: PickupZoneFormData) => Promise<{ error: Error | null }>;
  onUpdateZone: (zoneId: string, data: Partial<PickupZoneFormData>) => Promise<{ error: Error | null }>;
  onDeleteZone: (zoneId: string) => Promise<{ error: Error | null }>;
}

const PickupZonesModal = ({ open, onClose, addon, onCreateZone, onUpdateZone, onDeleteZone }: PickupZonesModalProps) => {
  const [loading, setLoading] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePrice, setNewZonePrice] = useState('');

  if (!addon) return null;

  const handleAddZone = async () => {
    if (!newZoneName.trim()) {
      toast.error('Zone name is required');
      return;
    }

    setLoading(true);
    const result = await onCreateZone(addon.id, {
      zone_name: newZoneName.trim(),
      price_override: newZonePrice ? parseFloat(newZonePrice) : null,
    });
    setLoading(false);

    if (result.error) {
      toast.error('Failed to add zone: ' + result.error.message);
    } else {
      toast.success('Zone added successfully');
      setNewZoneName('');
      setNewZonePrice('');
    }
  };

  const handleToggleZoneStatus = async (zone: PickupZone) => {
    const newStatus = zone.status === 'active' ? 'inactive' : 'active';
    const result = await onUpdateZone(zone.id, { status: newStatus });
    if (result.error) {
      toast.error('Failed to update zone status');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;
    
    const result = await onDeleteZone(zoneId);
    if (result.error) {
      toast.error('Failed to delete zone');
    } else {
      toast.success('Zone deleted');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Manage Pickup Zones - {addon.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Zone */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <h4 className="font-medium">Add New Zone</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="zoneName">Zone Name</Label>
                <Input
                  id="zoneName"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. Kuta Area, Seminyak, Ubud"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zonePrice">Price Override (IDR)</Label>
                <Input
                  id="zonePrice"
                  type="number"
                  value={newZonePrice}
                  onChange={(e) => setNewZonePrice(e.target.value)}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
            <Button onClick={handleAddZone} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </div>

          {/* Existing Zones */}
          <div className="space-y-2">
            <h4 className="font-medium">Existing Zones</h4>
            {addon.pickup_zones && addon.pickup_zones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addon.pickup_zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.zone_name}</TableCell>
                      <TableCell>
                        {zone.price_override 
                          ? <span className="font-mono">IDR {zone.price_override.toLocaleString()}</span>
                          : <span className="text-muted-foreground">Default (IDR {addon.price.toLocaleString()})</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={zone.status === 'active'}
                          onCheckedChange={() => handleToggleZoneStatus(zone)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No zones created yet</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PickupZonesModal;
