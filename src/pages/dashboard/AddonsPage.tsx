import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MapPin, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddonsData, Addon } from '@/hooks/useAddonsData';
import { useTripsData } from '@/hooks/useTripsData';
import AddonForm from '@/components/addons/AddonForm';
import AddonList from '@/components/addons/AddonList';
import PickupZonesModal from '@/components/addons/PickupZonesModal';

const AddonsPage = () => {
  const { 
    addons, 
    loading, 
    canEdit, 
    createAddon, 
    updateAddon, 
    deleteAddon, 
    toggleStatus,
    createPickupZone,
    updatePickupZone,
    deletePickupZone,
  } = useAddonsData();
  const { trips, routes } = useTripsData();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [zonesModalOpen, setZonesModalOpen] = useState(false);
  const [managingAddon, setManagingAddon] = useState<Addon | null>(null);

  const pickupAddons = addons.filter(a => a.type === 'pickup');
  const genericAddons = addons.filter(a => a.type === 'generic');

  const handleCreate = async (data: Parameters<typeof createAddon>[0]) => {
    const result = await createAddon(data);
    if (!result.error) {
      toast.success('Add-on created successfully');
    } else {
      toast.error('Failed to create add-on: ' + result.error.message);
    }
    return result;
  };

  const handleUpdate = async (data: Parameters<typeof createAddon>[0]) => {
    if (!editingAddon) return { error: new Error('No add-on selected') };
    const result = await updateAddon(editingAddon.id, data);
    if (!result.error) {
      toast.success('Add-on updated successfully');
    } else {
      toast.error('Failed to update add-on: ' + result.error.message);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteAddon(deleteConfirm);
    if (!result.error) {
      toast.success('Add-on deleted successfully');
    } else {
      toast.error('Failed to delete add-on: ' + result.error.message);
    }
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleStatus(id);
    if (!result.error) {
      toast.success('Status updated');
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setFormOpen(true);
  };

  const handleManageZones = (addon: Addon) => {
    setManagingAddon(addon);
    setZonesModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAddon(null);
  };

  // Summary stats
  const activeCount = addons.filter(a => a.status === 'active').length;
  const mandatoryCount = addons.filter(a => a.is_mandatory).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add-ons & Pick-up Options</h1>
            <p className="text-muted-foreground mt-1">
              Manage optional services and pick-up options for bookings
            </p>
          </div>
          {canEdit && (
            <Button variant="hero" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Add-on
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{addons.length}</div>
              <div className="text-sm text-muted-foreground">Total Add-ons</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{pickupAddons.length}</div>
              <div className="text-sm text-muted-foreground">Pick-up Options</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{mandatoryCount}</div>
              <div className="text-sm text-muted-foreground">Mandatory</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Pick-up vs Generic */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({addons.length})
            </TabsTrigger>
            <TabsTrigger value="pickup" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Pick-up ({pickupAddons.length})
            </TabsTrigger>
            <TabsTrigger value="generic" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Generic ({genericAddons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <AddonList
                  addons={addons}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleStatus={handleToggleStatus}
                  onManageZones={handleManageZones}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pickup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Pick-up Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddonList
                  addons={pickupAddons}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleStatus={handleToggleStatus}
                  onManageZones={handleManageZones}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Generic Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddonList
                  addons={genericAddons}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleStatus={handleToggleStatus}
                  onManageZones={handleManageZones}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Form */}
      <AddonForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={editingAddon ? handleUpdate : handleCreate}
        initialData={editingAddon}
        isEdit={!!editingAddon}
        trips={trips.map(t => ({ id: t.id, trip_name: t.trip_name }))}
        routes={routes.map(r => ({ id: r.id, route_name: r.route_name }))}
      />

      {/* Pickup Zones Modal */}
      <PickupZonesModal
        open={zonesModalOpen}
        onClose={() => {
          setZonesModalOpen(false);
          setManagingAddon(null);
        }}
        addon={managingAddon}
        onCreateZone={createPickupZone}
        onUpdateZone={updatePickupZone}
        onDeleteZone={deletePickupZone}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Add-on?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the add-on and all associated pickup zones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AddonsPage;
