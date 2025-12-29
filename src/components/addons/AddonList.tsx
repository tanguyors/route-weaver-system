import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Addon } from '@/hooks/useAddonsData';
import { Edit, Trash2, MapPin, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface AddonListProps {
  addons: Addon[];
  onEdit: (addon: Addon) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onManageZones: (addon: Addon) => void;
  canEdit: boolean;
}

const AddonList = ({ addons, onEdit, onDelete, onToggleStatus, onManageZones, canEdit }: AddonListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (addons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No add-ons created yet</p>
        <p className="text-sm">Create your first add-on to start offering extras to customers</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Pricing</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Applies To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {addons.map((addon) => (
          <>
            <TableRow key={addon.id}>
              <TableCell>
                {addon.type === 'pickup' && addon.enable_pickup_zones && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === addon.id ? null : addon.id)}
                  >
                    {expandedId === addon.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {addon.type === 'pickup' ? (
                    <MapPin className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Package className="w-4 h-4 text-purple-500" />
                  )}
                  <div>
                    <div className="font-medium">{addon.name}</div>
                    {addon.description && (
                      <div className="text-xs text-muted-foreground">{addon.description}</div>
                    )}
                    {addon.is_mandatory && (
                      <Badge variant="secondary" className="text-xs mt-1">Mandatory</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={addon.type === 'pickup' ? 'default' : 'secondary'}>
                  {addon.type === 'pickup' ? 'Pick-up' : 'Generic'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {addon.pricing_model === 'per_person' ? 'Per Person' : 'Per Booking'}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono">IDR {addon.price.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                  {addon.applicability}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={addon.status === 'active'}
                  onCheckedChange={() => onToggleStatus(addon.id)}
                  disabled={!canEdit}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {addon.type === 'pickup' && addon.enable_pickup_zones && canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageZones(addon)}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Zones ({addon.pickup_zones?.length || 0})
                    </Button>
                  )}
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(addon)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(addon.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
            {expandedId === addon.id && addon.pickup_zones && addon.pickup_zones.length > 0 && (
              <TableRow>
                <TableCell colSpan={8} className="bg-muted/30">
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-2">Pickup Zones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {addon.pickup_zones.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <span className="text-sm">{zone.zone_name}</span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {zone.price_override ? `IDR ${zone.price_override.toLocaleString()}` : 'Default'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
};

export default AddonList;
