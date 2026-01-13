import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Anchor, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Users, 
  Loader2, 
  Route, 
  Clock,
  Search,
  Car,
  Activity
} from 'lucide-react';
import { usePrivateBoatsData, PrivateBoat, PrivateBoatStatus } from '@/hooks/usePrivateBoatsData';
import PrivateBoatForm from '@/components/private-boats/PrivateBoatForm';
import PrivateBoatRoutesModal from '@/components/private-boats/PrivateBoatRoutesModal';
import PickupDropoffRulesTab from '@/components/private-boats/PickupDropoffRulesTab';
import ActivityAddonsTab from '@/components/private-boats/ActivityAddonsTab';

const PrivateBoatsPage = () => {
  const { 
    boats, 
    loading, 
    canEdit, 
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createBoat, 
    updateBoat, 
    deleteBoat, 
    uploadBoatImage 
  } = usePrivateBoatsData();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<PrivateBoat | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boatToDelete, setBoatToDelete] = useState<PrivateBoat | null>(null);
  const [routesModalOpen, setRoutesModalOpen] = useState(false);
  const [selectedBoatForRoutes, setSelectedBoatForRoutes] = useState<PrivateBoat | null>(null);

  const handleEdit = (boat: PrivateBoat) => {
    setEditingBoat(boat);
    setFormOpen(true);
  };

  const handleDelete = (boat: PrivateBoat) => {
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
    min_capacity: number;
    max_capacity: number;
    image_url?: string;
    status: PrivateBoatStatus;
    min_departure_time: string;
    max_departure_time: string;
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

  const handleOpenRoutes = (boat: PrivateBoat) => {
    setSelectedBoatForRoutes(boat);
    setRoutesModalOpen(true);
  };

  const handleCloseRoutes = () => {
    setRoutesModalOpen(false);
    setSelectedBoatForRoutes(null);
  };

  const getStatusBadgeVariant = (status: PrivateBoatStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'outline';
      case 'inactive':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Private Boats</h1>
            <p className="text-muted-foreground mt-1">
              Manage private boat charters, routes & pricing
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Private Boat
            </Button>
          )}
        </div>

        <Tabs defaultValue="boats">
          <TabsList>
            <TabsTrigger value="boats" className="gap-2">
              <Anchor className="h-4 w-4" />
              Private Boats
            </TabsTrigger>
            <TabsTrigger value="activity-addons" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity Add-ons
            </TabsTrigger>
            <TabsTrigger value="pickup-dropoff" className="gap-2">
              <Car className="h-4 w-4" />
              Pickup & Dropoff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boats" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Anchor className="h-5 w-5" />
                    Private Boats ({boats.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search boats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select 
                      value={statusFilter} 
                      onValueChange={(v) => setStatusFilter(v as PrivateBoatStatus | 'all')}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : boats.length === 0 ? (
                  <div className="text-center py-12">
                    <Anchor className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No private boats added yet</p>
                    {canEdit && (
                      <Button className="mt-4" onClick={() => setFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Private Boat
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
                          <TableHead>Time Range</TableHead>
                          <TableHead>Routes</TableHead>
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
                                  <Anchor className="h-5 w-5 text-muted-foreground" />
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
                                {boat.min_capacity || 1}-{boat.max_capacity || boat.capacity} pax
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {boat.min_departure_time.slice(0, 5)} - {boat.max_departure_time.slice(0, 5)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRoutes(boat)}
                                className="gap-1"
                              >
                                <Route className="h-3 w-3" />
                                {boat.routes_count || 0} routes
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(boat.status)}>
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
                                    <DropdownMenuItem onClick={() => handleOpenRoutes(boat)}>
                                      <Route className="h-4 w-4 mr-2" />
                                      Manage Routes
                                    </DropdownMenuItem>
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

          <TabsContent value="activity-addons" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityAddonsTab />
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

      <PrivateBoatForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        onUploadImage={uploadBoatImage}
        initialData={editingBoat || undefined}
        isEdit={!!editingBoat}
      />

      <PrivateBoatRoutesModal
        open={routesModalOpen}
        onClose={handleCloseRoutes}
        boat={selectedBoatForRoutes}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Private Boat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{boatToDelete?.name}"? This will also delete all associated routes. This action cannot be undone.
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

export default PrivateBoatsPage;
