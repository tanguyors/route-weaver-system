import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import { useAccommodationRoomsData, CreateRoomInput } from '@/hooks/useAccommodationRoomsData';
import { toast } from 'sonner';

interface RoomTypesListProps {
  accommodationId: string;
  partnerId: string | undefined;
  currency: string;
}

const BED_TYPES = ['single', 'double', 'queen', 'king', 'twin', 'bunk', 'sofa'];

const emptyForm = {
  name: '',
  description: '',
  capacity: 2,
  bed_type: 'double',
  quantity: 1,
  price_per_night: 0,
  minimum_nights: 1,
  status: 'active',
};

export const RoomTypesList = ({ accommodationId, currency }: RoomTypesListProps) => {
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useAccommodationRoomsData(accommodationId);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (room: any) => {
    setEditId(room.id);
    setForm({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity,
      bed_type: room.bed_type,
      quantity: room.quantity,
      price_per_night: room.price_per_night,
      minimum_nights: room.minimum_nights,
      status: room.status,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Room name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateRoom(editId, { ...form, accommodation_id: accommodationId });
        toast.success('Room updated');
      } else {
        await createRoom({ ...form, accommodation_id: accommodationId, currency } as CreateRoomInput);
        toast.success('Room created');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message || 'Error saving room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room type?')) return;
    try {
      await deleteRoom(id);
      toast.success('Room deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting room');
    }
  };

  if (loading) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              Room Types
            </span>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add Room
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No room types yet. Add rooms to manage different room categories.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price/Night</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="capitalize">{r.bed_type}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{currency} {r.price_per_night.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Room Type' : 'New Room Type'}</DialogTitle>
            <DialogDescription>Configure room details and pricing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Deluxe Double" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bed Type</Label>
                <Select value={form.bed_type} onValueChange={v => setForm(f => ({ ...f, bed_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BED_TYPES.map(bt => (
                      <SelectItem key={bt} value={bt} className="capitalize">{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Guests</Label>
                <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity (Stock)</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Price/Night ({currency})</Label>
                <Input type="number" min={0} value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Min. Nights</Label>
              <Input type="number" min={1} value={form.minimum_nights} onChange={e => setForm(f => ({ ...f, minimum_nights: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
