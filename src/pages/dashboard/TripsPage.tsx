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
import { Plus, Route as RouteIcon, Ship, Clock, MoreVertical, Pencil, Trash2, Zap, ArrowRight } from 'lucide-react';
import { useTripsData, Route, Trip, DepartureTemplate } from '@/hooks/useTripsData';
import { useToast } from '@/hooks/use-toast';
import RouteForm from '@/components/trips/RouteForm';
import TripForm from '@/components/trips/TripForm';
import ScheduleForm from '@/components/trips/ScheduleForm';
import GenerateDeparturesDialog from '@/components/trips/GenerateDeparturesDialog';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TripsPage = () => {
  const { 
    ports, routes, trips, schedules, loading, canEdit,
    createRoute, updateRoute, deleteRoute,
    createTrip, updateTrip, deleteTrip,
    createSchedule, updateSchedule, deleteSchedule,
    generateDepartures, regenerateScheduleDepartures
  } = useTripsData();
  const { toast } = useToast();

  // Form states
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  
  // Edit states
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<DepartureTemplate | null>(null);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'route' | 'trip' | 'schedule'; id: string; name: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    let result;
    switch (deleteConfirm.type) {
      case 'route':
        result = await deleteRoute(deleteConfirm.id);
        break;
      case 'trip':
        result = await deleteTrip(deleteConfirm.id);
        break;
      case 'schedule':
        result = await deleteSchedule(deleteConfirm.id);
        break;
    }
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: `${deleteConfirm.type} deleted successfully`,
      });
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trips & Schedules</h1>
            <p className="text-muted-foreground mt-1">
              Manage your boat routes, trips, and departure schedules
            </p>
          </div>
          {canEdit && (
            <Button variant="hero" onClick={() => setGenerateDialogOpen(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Generate Departures
            </Button>
          )}
        </div>

        <Tabs defaultValue="routes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="routes" className="gap-2">
              <RouteIcon className="w-4 h-4" />
              Routes ({routes.length})
            </TabsTrigger>
            <TabsTrigger value="trips" className="gap-2">
              <Ship className="w-4 h-4" />
              Trips ({trips.length})
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Clock className="w-4 h-4" />
              Schedules ({schedules.length})
            </TabsTrigger>
          </TabsList>

          {/* Routes Tab */}
          <TabsContent value="routes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Routes</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setRouteFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Route
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <RouteIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-3">No routes configured yet</p>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => setRouteFormOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Route
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routes.map(route => (
                        <TableRow key={route.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 font-medium">
                              {route.origin_port?.name || 'Unknown'}
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              {route.destination_port?.name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {route.duration_minutes ? `${route.duration_minutes} min` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                              {route.status}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingRoute(route);
                                    setRouteFormOpen(true);
                                  }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteConfirm({ type: 'route', id: route.id, name: route.route_name })}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Trips</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setTripFormOpen(true)} disabled={routes.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Trip
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {trips.length === 0 ? (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <Ship className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-3">
                        {routes.length === 0 ? 'Create a route first to add trips' : 'No trips configured yet'}
                      </p>
                      {canEdit && routes.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setTripFormOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Trip
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip Name</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Adult Price</TableHead>
                        <TableHead>Child Price</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map(trip => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">{trip.trip_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {trip.route?.route_name || 'Unknown route'}
                          </TableCell>
                          <TableCell>
                            {trip.adult_price ? `${trip.adult_price.toLocaleString()} IDR` : '-'}
                          </TableCell>
                          <TableCell>
                            {trip.child_price ? `${trip.child_price.toLocaleString()} IDR` : '-'}
                          </TableCell>
                          <TableCell>{trip.capacity_default} seats</TableCell>
                          <TableCell>
                            <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                              {trip.status}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingTrip(trip);
                                    setTripFormOpen(true);
                                  }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteConfirm({ type: 'trip', id: trip.id, name: trip.trip_name })}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departure Schedules</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setScheduleFormOpen(true)} disabled={trips.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-3">
                        {trips.length === 0 ? 'Create a trip first to add schedules' : 'No schedules configured yet'}
                      </p>
                      {canEdit && trips.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setScheduleFormOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">
                            {schedule.trip?.trip_name || 'Unknown'}
                          </TableCell>
                          <TableCell>{schedule.departure_time.substring(0, 5)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {schedule.days_of_week.map(d => (
                                <span key={d} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                  {DAYS_SHORT[d]}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {schedule.seasonal_start_date && schedule.seasonal_end_date
                              ? `${schedule.seasonal_start_date} - ${schedule.seasonal_end_date}`
                              : 'Year-round'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingSchedule(schedule);
                                    setScheduleFormOpen(true);
                                  }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteConfirm({ type: 'schedule', id: schedule.id, name: `${schedule.departure_time}` })}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      <RouteForm
        open={routeFormOpen}
        onClose={() => {
          setRouteFormOpen(false);
          setEditingRoute(null);
        }}
        onSubmit={async (data) => {
          if (editingRoute) {
            return updateRoute(editingRoute.id, data);
          }
          return createRoute(data);
        }}
        ports={ports}
        initialData={editingRoute || undefined}
        isEdit={!!editingRoute}
      />

      <TripForm
        open={tripFormOpen}
        onClose={() => {
          setTripFormOpen(false);
          setEditingTrip(null);
        }}
        onSubmit={async (data) => {
          if (editingTrip) {
            return updateTrip(editingTrip.id, data);
          }
          return createTrip(data);
        }}
        routes={routes}
        initialData={editingTrip || undefined}
        isEdit={!!editingTrip}
      />

      <ScheduleForm
        open={scheduleFormOpen}
        onClose={() => {
          setScheduleFormOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={async (data) => {
          let result;
          
          if (editingSchedule) {
            // For update, convert departure_times array to single departure_time
            const { departure_times, ...rest } = data;
            result = await updateSchedule(editingSchedule.id, {
              ...rest,
              departure_time: departure_times[0], // Use first time for update
            });
            
            // Regenerate departures for this specific schedule
            if (!result.error && data.seasonal_start_date && data.seasonal_end_date) {
              const regenResult = await regenerateScheduleDepartures(
                editingSchedule.id, 
                data.seasonal_start_date, 
                data.seasonal_end_date
              );
              
              if (data.status === 'active' && regenResult.count && regenResult.count > 0) {
                toast({
                  title: 'Schedule Updated',
                  description: `${regenResult.count} departures regenerated for the schedule period`,
                });
              } else if (data.status === 'inactive') {
                toast({
                  title: 'Schedule Updated',
                  description: 'Departures removed (schedule inactive)',
                });
              } else {
                toast({
                  title: 'Schedule Updated',
                  description: 'No departures generated for the selected period/days',
                });
              }
            }
          } else {
            result = await createSchedule(data);
            
            // If status is active and we have dates, generate departures automatically for each created schedule
            if (!result.error && data.status === 'active' && data.seasonal_start_date && data.seasonal_end_date) {
              const createdSchedules = (result as any).createdSchedules || [];
              let totalDepartures = 0;
              
              for (const schedule of createdSchedules) {
                const regenResult = await regenerateScheduleDepartures(
                  schedule.id,
                  data.seasonal_start_date,
                  data.seasonal_end_date
                );
                totalDepartures += regenResult.count || 0;
              }
              
              if (totalDepartures > 0) {
                toast({
                  title: 'Schedule Created',
                  description: `${totalDepartures} departures have been generated for the schedule period`,
                });
              } else {
                toast({
                  title: 'Schedule Created',
                  description: 'No departures generated for the selected days/period',
                });
              }
            }
          }
          
          return result;
        }}
        trips={trips}
        initialData={editingSchedule || undefined}
        isEdit={!!editingSchedule}
      />

      <GenerateDeparturesDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={generateDepartures}
        trips={trips}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
              {deleteConfirm?.type === 'route' && ' All associated trips and schedules will also be deleted.'}
              {deleteConfirm?.type === 'trip' && ' All associated schedules will also be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TripsPage;
