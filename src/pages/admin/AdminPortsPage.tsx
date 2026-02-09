import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Port {
  id: string;
  name: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

const AdminPortsPage = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [deletePortId, setDeletePortId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    lat: '',
    lng: ''
  });

  const fetchPorts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load ports');
      console.error(error);
    } else {
      setPorts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', area: '', lat: '', lng: '' });
    setEditingPort(null);
  };

  const handleOpenForm = (port?: Port) => {
    if (port) {
      setEditingPort(port);
      setFormData({
        name: port.name,
        area: port.area || '',
        lat: port.lat?.toString() || '',
        lng: port.lng?.toString() || ''
      });
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
    if (!formData.name.trim()) {
      toast.error('Port name is required');
      return;
    }

    setSaving(true);

    const portData = {
      name: formData.name.trim(),
      area: formData.area.trim() || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null
    };

    if (editingPort) {
      const { error } = await supabase
        .from('ports')
        .update(portData)
        .eq('id', editingPort.id);

      if (error) {
        toast.error('Failed to update port');
        console.error(error);
      } else {
        toast.success('Port updated successfully');
        handleCloseForm();
        fetchPorts();
      }
    } else {
      const { error } = await supabase
        .from('ports')
        .insert(portData);

      if (error) {
        toast.error('Failed to create port');
        console.error(error);
      } else {
        toast.success('Port created successfully');
        handleCloseForm();
        fetchPorts();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletePortId) return;

    const { error } = await supabase
      .from('ports')
      .delete()
      .eq('id', deletePortId);

    if (error) {
      toast.error('Failed to delete port. It may be in use by routes.');
      console.error(error);
    } else {
      toast.success('Port deleted successfully');
      fetchPorts();
    }

    setDeletePortId(null);
  };

  if (loading) {
    return (
       <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
       </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ports Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage all ports in the system
            </p>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Port
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              All Ports ({ports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ports.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No ports yet</p>
                <Button className="mt-4" onClick={() => handleOpenForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Port
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ports.map((port) => (
                    <TableRow key={port.id}>
                      <TableCell className="font-medium">{port.name}</TableCell>
                      <TableCell>{port.area || '-'}</TableCell>
                      <TableCell>
                        {port.lat && port.lng 
                          ? `${port.lat.toFixed(4)}, ${port.lng.toFixed(4)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(port)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePortId(port.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Port Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPort ? 'Edit Port' : 'Add New Port'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Port Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sanur Harbor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area / Region</Label>
              <Input
                id="area"
                placeholder="e.g., Bali"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="-8.7065"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="115.2624"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPort ? 'Update Port' : 'Create Port'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePortId} onOpenChange={() => setDeletePortId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Port?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The port will be permanently deleted.
              Note: Ports that are used by routes cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminPortsPage;
