import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDeparture, DepartureBooking } from '@/hooks/useCalendarData';
import { Ship, Users, Clock, AlertTriangle, XCircle, Check, Lock, Unlock, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface DepartureDetailModalProps {
  departure: CalendarDeparture | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onStatusChange: (id: string, status: 'open' | 'closed' | 'sold_out' | 'cancelled') => Promise<void>;
  onCapacityChange: (id: string, capacity: number) => Promise<void>;
  onBlockSeats: (id: string, seats: number) => Promise<void>;
  fetchBookings: (id: string) => Promise<DepartureBooking[]>;
}

export const DepartureDetailModal = ({
  departure,
  open,
  onClose,
  canEdit,
  onStatusChange,
  onCapacityChange,
  onBlockSeats,
  fetchBookings,
}: DepartureDetailModalProps) => {
  const [bookings, setBookings] = useState<DepartureBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [newCapacity, setNewCapacity] = useState('');
  const [seatsToBlock, setSeatsToBlock] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (departure && open) {
      setNewCapacity(departure.capacity_total.toString());
      setSeatsToBlock('');
      loadBookings();
    }
  }, [departure, open]);

  const loadBookings = async () => {
    if (!departure) return;
    setLoadingBookings(true);
    const data = await fetchBookings(departure.id);
    setBookings(data);
    setLoadingBookings(false);
  };

  if (!departure) return null;

  const available = departure.capacity_total - departure.capacity_reserved;
  const routeName = departure.trip?.route?.route_name || 'Unknown Route';

  const handleStatusChange = async (status: 'open' | 'closed' | 'sold_out' | 'cancelled') => {
    setIsUpdating(true);
    await onStatusChange(departure.id, status);
    setIsUpdating(false);
  };

  const handleCapacityUpdate = async () => {
    const cap = parseInt(newCapacity);
    if (isNaN(cap) || cap < departure.capacity_reserved) return;
    setIsUpdating(true);
    await onCapacityChange(departure.id, cap);
    setIsUpdating(false);
  };

  const handleBlockSeats = async () => {
    const seats = parseInt(seatsToBlock);
    if (isNaN(seats) || seats <= 0) return;
    setIsUpdating(true);
    await onBlockSeats(departure.id, seats);
    setSeatsToBlock('');
    setIsUpdating(false);
  };

  const getStatusBadge = () => {
    switch (departure.status) {
      case 'open':
        return <Badge variant="default" className="bg-emerald-500">Open</Badge>;
      case 'sold_out':
        return <Badge variant="destructive">Sold Out</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
    }
  };

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      online_widget: 'bg-blue-500/20 text-blue-700',
      offline_walkin: 'bg-amber-500/20 text-amber-700',
      offline_whatsapp: 'bg-green-500/20 text-green-700',
      offline_agency: 'bg-purple-500/20 text-purple-700',
      offline_other: 'bg-gray-500/20 text-gray-700',
    };
    return (
      <Badge variant="outline" className={cn('capitalize', colors[channel] || '')}>
        {channel.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Ship className="h-5 w-5" />
            <span>{routeName}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold">{format(new Date(departure.departure_date), 'MMM d')}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(departure.departure_date), 'EEEE')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              {departure.departure_time.slice(0, 5)}
            </div>
            <div className="text-sm text-muted-foreground">Departure Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              {departure.capacity_reserved}/{departure.capacity_total}
            </div>
            <div className="text-sm text-muted-foreground">{available} seats left</div>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="controls" disabled={!canEdit}>Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="flex-1 overflow-auto mt-4">
            {loadingBookings ? (
              <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Pax</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">{booking.customer?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{booking.customer?.email}</div>
                      </TableCell>
                      <TableCell>
                        {booking.pax_adult}A {booking.pax_child > 0 && `+ ${booking.pax_child}C`}
                      </TableCell>
                      <TableCell>{getChannelBadge(booking.channel)}</TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        IDR {booking.total_amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href={`/dashboard/checkin?departure=${departure.id}`}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Go to Check-in View
                </a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6 mt-4">
            {/* Status Controls */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Departure Status</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={departure.status === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('open')}
                  disabled={isUpdating || departure.status === 'open'}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button
                  variant={departure.status === 'closed' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('closed')}
                  disabled={isUpdating || departure.status === 'closed'}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isUpdating || departure.status === 'cancelled'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
              {departure.status === 'cancelled' && bookings.length > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {bookings.length} booking(s) affected by cancellation
                </div>
              )}
            </div>

            <Separator />

            {/* Capacity Override */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Capacity Override</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  min={departure.capacity_reserved}
                  className="w-32"
                />
                <Button 
                  onClick={handleCapacityUpdate}
                  disabled={isUpdating || parseInt(newCapacity) === departure.capacity_total}
                >
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: {departure.capacity_reserved} (already booked)
              </p>
            </div>

            <Separator />

            {/* Block Seats */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Block Seats (Agency Reserve)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={seatsToBlock}
                  onChange={(e) => setSeatsToBlock(e.target.value)}
                  placeholder="Number of seats"
                  min={1}
                  max={available}
                  className="w-32"
                />
                <Button 
                  onClick={handleBlockSeats}
                  disabled={isUpdating || !seatsToBlock || parseInt(seatsToBlock) > available}
                  variant="secondary"
                >
                  Block
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to block: {available} seats
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
