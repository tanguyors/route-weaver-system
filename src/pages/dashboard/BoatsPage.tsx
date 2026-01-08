import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Ship, Plus, MoreHorizontal, Pencil, Trash2, Users, Loader2, Car } from 'lucide-react';
import { useBoatsData, Boat } from '@/hooks/useBoatsData';
import BoatForm from '@/components/boats/BoatForm';
import PickupDropoffRulesTab from '@/components/private-boats/PickupDropoffRulesTab';

const BoatsPage = () => {
  const { boats, loading, canEdit, createBoat, updateBoat, deleteBoat, uploadBoatImage } = useBoatsData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boatToDelete, setBoatToDelete] = useState<Boat | null>(null);

  const handleEdit = (boat: Boat) => {
    setEditingBoat(boat);
    setFormOpen(true);
  };

  const handleDelete = (boat: Boat) => {
    setBoatToDelete(boat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (boatToDelete) {
      await deleteBoat(boatToDelete.id);
      setDeleteDialogOpen(false);
      setBoatToDelete(null);
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    capacity: number;
    image_url?: string;
    status: 'active' | 'inactive';
  }) => {
    if (editingBoat) {
      return updateBoat(editingBoat.id, data);
    }
    return createBoat(data);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBoat(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Boats</h1>
            <p className="text-muted-foreground mt-1">
              Manage your boat inventory
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Boat
            </Button>
          )}
        </div>

        <Tabs defaultValue="boats">
          <TabsList>
            <TabsTrigger value="boats" className="gap-2">
              <Ship className="h-4 w-4" />
              Boats
            </TabsTrigger>
            <TabsTrigger value="pickup-dropoff" className="gap-2">
              <Car className="h-4 w-4" />
              Pickup & Dropoff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Boat Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : boats.length === 0 ? (
                  <div className="text-center py-12">
                    <Ship className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No boats added yet</p>
                    {canEdit && (
                      <Button className="mt-4" onClick={() => setFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Boat
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Photo</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          {canEdit && <TableHead className="w-12"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boats.map((boat) => (
                          <TableRow key={boat.id}>
                            <TableCell>
                              {boat.image_url ? (
                                <img
                                  src={boat.image_url}
                                  alt={boat.name}
                                  className="w-16 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                                  <Ship className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{boat.name}</p>
                                {boat.description && (
                                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                                    {boat.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {boat.capacity}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={boat.status === 'active' ? 'default' : 'secondary'}>
                                {boat.status}
                              </Badge>
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(boat)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(boat)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pickup-dropoff" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Pickup & Dropoff Rules (Global)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PickupDropoffRulesTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BoatForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        onUploadImage={uploadBoatImage}
        initialData={editingBoat || undefined}
        isEdit={!!editingBoat}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Boat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{boatToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BoatsPage;
