import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Route, Loader2, ArrowRight } from 'lucide-react';
import { usePrivateBoatRoutesData, PrivateBoatRoute, Port } from '@/hooks/usePrivateBoatsData';
import { PrivateBoat } from '@/hooks/usePrivateBoatsData';

interface PrivateBoatRoutesModalProps {
  open: boolean;
  onClose: () => void;
  boat: PrivateBoat | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const PrivateBoatRoutesModal = ({ open, onClose, boat }: PrivateBoatRoutesModalProps) => {
  const { routes, ports, loading, createRoute, updateRoute, deleteRoute } = usePrivateBoatRoutesData(boat?.id || null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<PrivateBoatRoute | null>(null);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fromPortId, setFromPortId] = useState('');
  const [toPortId, setToPortId] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setFromPortId('');
    setToPortId('');
    setPrice('');
    setDurationMinutes('');
    setStatus('active');
    setEditingRoute(null);
    setFormError('');
  };

  const handleOpenForm = (route?: PrivateBoatRoute) => {
    if (route) {
      setEditingRoute(route);
      setFromPortId(route.from_port_id);
      setToPortId(route.to_port_id);
      setPrice(route.price.toString());
      setDurationMinutes(route.duration_minutes?.toString() || '');
      setStatus(route.status);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!fromPortId || !toPortId) {
      setFormError('Both ports are required');
      return;
    }

    if (fromPortId === toPortId) {
      setFormError('From and To ports must be different');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a positive number');
      return;
    }

    setSaving(true);

    const data = {
      from_port_id: fromPortId,
      to_port_id: toPortId,
      price: priceNum,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      status,
    };

    let result;
    if (editingRoute) {
      result = await updateRoute(editingRoute.id, data);
    } else {
      result = await createRoute({
        private_boat_id: boat!.id,
        ...data,
      });
    }

    setSaving(false);

    if (!result.error) {
      handleCloseForm();
    } else {
      setFormError(result.error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteRouteId) return;
    await deleteRoute(deleteRouteId);
    setDeleteRouteId(null);
  };

  if (!boat) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Routes & Pricing - {boat.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No routes configured</p>
                <Button className="mt-4" onClick={() => handleOpenForm()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Route
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{route.from_port?.name}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{route.to_port?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(route.price)}
                      </TableCell>
                      <TableCell>
                        {route.duration_minutes ? `${route.duration_minutes} min` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                          {route.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(route)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRouteId(route.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Route Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoute ? 'Edit Route' : 'Add Route'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Port *</Label>
              <Select value={fromPortId} onValueChange={setFromPortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select departure port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Port *</Label>
              <Select value={toPortId} onValueChange={setToPortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arrival port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.filter(p => p.id !== fromPortId).map((port) => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="Optional"
                  min={0}
                />
              </div>
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

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRoute ? 'Update' : 'Add Route'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The route will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PrivateBoatRoutesModal;
