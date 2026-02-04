import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BookingWithDetails } from '@/hooks/useBookingsData';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, CreditCard, QrCode, Ship, 
  Phone, Mail, MapPin, Plus, XCircle, Loader2, AlertTriangle,
  ArrowRight, Car, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingDetailModalProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onAddPayment: (bookingId: string, payment: { method: string; amount: number; status: string }) => Promise<{ error: Error | null }>;
  onCancel: (bookingId: string, reason?: string) => Promise<{ error: Error | null }>;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

export const BookingDetailModal = ({
  booking,
  open,
  onClose,
  canEdit,
  onAddPayment,
  onCancel,
}: BookingDetailModalProps) => {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newPayment, setNewPayment] = useState({ method: 'cash', amount: 0 });

  if (!booking) return null;

  const totalPaid = booking.payments?.reduce((sum, p) => 
    p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
  const balanceDue = booking.total_amount - totalPaid;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-700',
      confirmed: 'bg-emerald-500/20 text-emerald-700',
      cancelled: 'bg-red-500/20 text-red-700',
      refunded: 'bg-purple-500/20 text-purple-700',
    };
    return <Badge className={cn('capitalize', variants[status] || '')}>{status}</Badge>;
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      online_widget: 'Online Widget',
      offline_walkin: 'Walk-in',
      offline_whatsapp: 'WhatsApp',
      offline_agency: 'Agency',
      offline_other: 'Other',
    };
    return labels[channel] || channel;
  };

  const handleAddPayment = async () => {
    if (newPayment.amount <= 0) return;
    setIsAddingPayment(true);
    await onAddPayment(booking.id, { ...newPayment, status: 'paid' });
    setNewPayment({ method: 'cash', amount: 0 });
    setIsAddingPayment(false);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    await onCancel(booking.id, cancelReason);
    setIsCancelling(false);
    setShowCancelConfirm(false);
    onClose();
  };

  const qrCodeUrl = booking.ticket?.qr_token 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.ticket.qr_token)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              Booking Details
              {getStatusBadge(booking.status)}
            </DialogTitle>
            <span className="text-sm font-mono text-muted-foreground">
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="ticket">Ticket</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Outbound Trip Info */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {booking.return_departure ? 'Outbound Trip' : 'Trip Details'}
                  </span>
                </div>
                {/* Unit prices */}
                {(booking.outbound_price_adult || booking.outbound_price_child) && (
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Adult: <span className="font-medium text-foreground">{formatPrice(booking.outbound_price_adult || 0)}</span></div>
                    {booking.pax_child > 0 && (
                      <div>Child: <span className="font-medium text-foreground">{formatPrice(booking.outbound_price_child || 0)}</span></div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Boat Image */}
              {booking.departure?.boat?.image_url && (
                <div className="flex items-center gap-3">
                  <img 
                    src={booking.departure.boat.image_url} 
                    alt={booking.departure.boat.name}
                    className="w-20 h-14 object-cover rounded-lg border"
                  />
                  <span className="text-sm text-muted-foreground">{booking.departure.boat.name}</span>
                </div>
              )}
              
              {/* Route */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {booking.departure?.trip?.route?.origin?.name || 'Origin'}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {booking.departure?.trip?.route?.destination?.name || 'Destination'}
                </span>
              </div>
              
              {/* Date and Times */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.departure?.departure_date 
                      ? format(new Date(booking.departure.departure_date), 'EEEE, dd MMM yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Dep: <span className="font-medium">{booking.departure?.departure_time?.slice(0, 5) || 'N/A'}</span>
                    </span>
                  </div>
                  {booking.departure?.trip?.route?.duration_minutes && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 opacity-0" />
                      <span>
                        Arr: <span className="font-medium text-foreground">
                          {(() => {
                            const depTime = booking.departure?.departure_time;
                            const duration = booking.departure?.trip?.route?.duration_minutes;
                            if (!depTime || !duration) return 'N/A';
                            const [h, m] = depTime.split(':').map(Number);
                            const totalMinutes = h * 60 + m + duration;
                            const arrH = Math.floor(totalMinutes / 60) % 24;
                            const arrM = totalMinutes % 60;
                            return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;
                          })()}
                        </span>
                        <span className="text-xs ml-1">({booking.departure?.trip?.route?.duration_minutes} min)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {booking.departure?.boat && !booking.departure?.boat?.image_url && (
                <div className="flex items-center gap-2 text-sm">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <span>Boat: {booking.departure.boat.name}</span>
                </div>
              )}
            </div>

            {/* Return Trip Info */}
            {booking.return_departure && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Return Trip</span>
                  </div>
                  {/* Unit prices */}
                  {(booking.return_price_adult || booking.return_price_child) && (
                    <div className="text-xs text-muted-foreground text-right">
                      <div>Adult: <span className="font-medium text-foreground">{formatPrice(booking.return_price_adult || 0)}</span></div>
                      {booking.pax_child > 0 && (
                        <div>Child: <span className="font-medium text-foreground">{formatPrice(booking.return_price_child || 0)}</span></div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Boat Image */}
                {booking.return_departure?.boat?.image_url && (
                  <div className="flex items-center gap-3">
                    <img 
                      src={booking.return_departure.boat.image_url} 
                      alt={booking.return_departure.boat.name}
                      className="w-20 h-14 object-cover rounded-lg border"
                    />
                    <span className="text-sm text-muted-foreground">{booking.return_departure.boat.name}</span>
                  </div>
                )}
                
                {/* Route */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {booking.return_departure?.trip?.route?.origin?.name || 'Origin'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {booking.return_departure?.trip?.route?.destination?.name || 'Destination'}
                  </span>
                </div>
                
                {/* Date and Times */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.return_departure?.departure_date 
                        ? format(new Date(booking.return_departure.departure_date), 'EEEE, dd MMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Dep: <span className="font-medium">{booking.return_departure?.departure_time?.slice(0, 5) || 'N/A'}</span>
                      </span>
                    </div>
                    {booking.return_departure?.trip?.route?.duration_minutes && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 opacity-0" />
                        <span>
                          Arr: <span className="font-medium text-foreground">
                            {(() => {
                              const depTime = booking.return_departure?.departure_time;
                              const duration = booking.return_departure?.trip?.route?.duration_minutes;
                              if (!depTime || !duration) return 'N/A';
                              const [h, m] = depTime.split(':').map(Number);
                              const totalMinutes = h * 60 + m + duration;
                              const arrH = Math.floor(totalMinutes / 60) % 24;
                              const arrM = totalMinutes % 60;
                              return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;
                            })()}
                          </span>
                          <span className="text-xs ml-1">({booking.return_departure?.trip?.route?.duration_minutes} min)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {booking.return_departure?.boat && !booking.return_departure?.boat?.image_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ship className="h-4 w-4 text-muted-foreground" />
                    <span>Boat: {booking.return_departure.boat.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Passengers Section */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Passengers
              </h4>
              <div className="bg-muted/50 rounded-lg px-4 py-2 inline-flex gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Adults: </span>
                  <span className="font-medium">{booking.pax_adult}</span>
                </span>
                {booking.pax_child > 0 && (
                  <span>
                    <span className="text-muted-foreground">Children: </span>
                    <span className="font-medium">{booking.pax_child}</span>
                  </span>
                )}
              </div>
              
              {/* Passenger List */}
              {booking.passengers && booking.passengers.length > 0 && (
                <div className="space-y-2 mt-3">
                  {booking.passengers.map((passenger, index) => (
                    <div key={passenger.id} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                      <div>
                        <span className="text-muted-foreground mr-2">{index + 1}.</span>
                        <span className="font-medium">{passenger.full_name}</span>
                        <span className="text-muted-foreground ml-2 capitalize">({passenger.age_group})</span>
                      </div>
                      {passenger.id_number && (
                        <span className="text-muted-foreground text-xs">ID: {passenger.id_number}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add-ons Section */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Add-ons & Services
                </h4>
                <div className="space-y-2">
                  {booking.addons.map((addon) => (
                    <div key={addon.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {addon.pickup_zone_id ? (
                              <Car className="h-4 w-4 text-primary" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{addon.name}</span>
                            <span className="text-xs text-muted-foreground">
                              x{addon.qty}
                            </span>
                          </div>
                          
                          {/* Pickup Info */}
                          {addon.pickup_info && (
                            <div className="mt-2 pl-6 space-y-1 text-sm text-muted-foreground">
                              {addon.pickup_info.hotel_name && (
                                <p>Hotel: {addon.pickup_info.hotel_name}</p>
                              )}
                              {addon.pickup_info.address && (() => {
                                const coords = addon.pickup_info.coords;
                                const mapsUrl = coords?.lat && coords?.lng
                                  ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addon.pickup_info.address)}`;
                                return (
                                  <p className="flex items-start gap-1">
                                    <MapPin className="h-3 w-3 mt-1 shrink-0" />
                                    <a 
                                      href={mapsUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary underline hover:text-primary/80"
                                    >
                                      {addon.pickup_info.address} 📍
                                    </a>
                                  </p>
                                );
                              })()}
                              {addon.pickup_info.pickup_note && (
                                <p className="italic">Note: {addon.pickup_info.pickup_note}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-sm">
                          {formatPrice(addon.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="space-y-2">
              <h4 className="font-semibold">Customer</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customer?.full_name || 'Unknown'}</span>
                </div>
                {booking.customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.phone}</span>
                  </div>
                )}
                {booking.customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.email}</span>
                  </div>
                )}
                {booking.customer?.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.country}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="space-y-2">
              <h4 className="font-semibold">Pricing Breakdown</h4>
              <div className="space-y-1 text-sm">
                {/* Calculate ticket price without addons */}
                {(() => {
                  const addonsTotal = booking.addons?.reduce((sum, a) => sum + a.total, 0) || 0;
                  const ticketPrice = booking.subtotal_amount - addonsTotal;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Ticket ({booking.pax_adult + booking.pax_child} pax)</span>
                        <span>{formatPrice(ticketPrice)}</span>
                      </div>
                      {addonsTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Add-ons</span>
                          <span>{formatPrice(addonsTotal)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span>-{formatPrice(booking.discount_amount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid</span>
                  <span>{formatPrice(totalPaid)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between text-destructive font-semibold">
                    <span>Balance Due</span>
                    <span>{formatPrice(balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Channel:</span>
                <span className="ml-2">{getChannelLabel(booking.channel)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">{format(new Date(booking.created_at), 'MMM d, HH:mm')}</span>
              </div>
            </div>

            {booking.notes_internal && (
              <div className="p-3 bg-muted rounded text-sm">
                <span className="font-medium">Notes: </span>
                {booking.notes_internal}
              </div>
            )}

            {/* Cancel Action */}
            {canEdit && booking.status !== 'cancelled' && (
              <div className="pt-4">
                {!showCancelConfirm ? (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                ) : (
                  <div className="p-4 border border-destructive rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">Confirm Cancellation</span>
                    </div>
                    <Input
                      placeholder="Reason for cancellation"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1"
                      >
                        Keep Booking
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex-1"
                      >
                        {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Payment History */}
            {booking.payments && booking.payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.created_at), 'MMM d, HH:mm')}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payments recorded yet
              </div>
            )}

            {/* Add Payment */}
            {canEdit && booking.status !== 'cancelled' && balanceDue > 0 && (
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Payment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Method</Label>
                    <Select 
                      value={newPayment.method} 
                      onValueChange={(v) => setNewPayment(prev => ({ ...prev, method: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder={`Max: ${formatPrice(balanceDue)}`}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddPayment} 
                  disabled={isAddingPayment || newPayment.amount <= 0}
                  className="w-full"
                >
                  {isAddingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-semibold">{formatPrice(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Total Paid</span>
                <span className="font-semibold">{formatPrice(totalPaid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Balance Due</span>
                <span className={balanceDue > 0 ? 'text-destructive' : 'text-emerald-600'}>
                  {formatPrice(balanceDue)}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ticket" className="flex-1 overflow-auto mt-4">
            {booking.ticket ? (
              <div className="text-center space-y-4">
                <Badge variant={booking.ticket.status === 'validated' ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                  {booking.ticket.status.toUpperCase()}
                </Badge>
                
                {qrCodeUrl && (
                  <div className="p-6 border rounded-lg inline-block mx-auto">
                    <img src={qrCodeUrl} alt="QR Ticket" className="mx-auto" />
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Ticket ID: {booking.ticket.id.slice(0, 8).toUpperCase()}
                </p>

                <Button variant="outline" onClick={() => window.print()}>
                  Print Ticket
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No ticket generated for this booking</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
