import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Users, CreditCard, Ticket, Minus, Plus } from 'lucide-react';
import { useTripsData } from '@/hooks/useTripsData';
import { CreateBookingData } from '@/hooks/useBookingsData';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OfflineBookingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBookingData) => Promise<{ error: Error | null; bookingId?: string }>;
}

interface Departure {
  id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  trip_id: string;
  route_id: string;
}

interface PriceRule {
  trip_id: string;
  adult_price: number;
  child_price: number | null;
  rule_type: string;
  start_date: string | null;
  end_date: string | null;
}

const CHANNELS = [
  { value: 'offline_walkin', label: 'Walk-in' },
  { value: 'offline_whatsapp', label: 'WhatsApp' },
  { value: 'offline_agency', label: 'Agency' },
  { value: 'offline_other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

export const OfflineBookingForm = ({ open, onClose, onSubmit }: OfflineBookingFormProps) => {
  const { routes, trips, ports } = useTripsData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);

  // Form state
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDeparture, setSelectedDeparture] = useState('');
  const [channel, setChannel] = useState<'offline_walkin' | 'offline_whatsapp' | 'offline_agency' | 'offline_other'>('offline_walkin');
  const [paxAdult, setPaxAdult] = useState(1);
  const [paxChild, setPaxChild] = useState(0);
  const [customer, setCustomer] = useState({ full_name: '', phone: '', email: '', country: '' });
  const [notes, setNotes] = useState('');
  const [generateTicket, setGenerateTicket] = useState(true);
  
  // Pricing
  const [adultPrice, setAdultPrice] = useState(0);
  const [childPrice, setChildPrice] = useState(0);
  const [manualPriceOverride, setManualPriceOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'partial'>('unpaid');

  // Load departures when route/date changes
  useEffect(() => {
    const loadDepartures = async () => {
      if (!selectedRoute || !selectedDate) {
        setDepartures([]);
        return;
      }

      setLoadingDepartures(true);
      
      const { data } = await supabase
        .from('departures')
        .select('id, departure_date, departure_time, capacity_total, capacity_reserved, trip_id, route_id')
        .eq('route_id', selectedRoute)
        .eq('departure_date', selectedDate)
        .eq('status', 'open')
        .order('departure_time');

      setDepartures(data || []);
      setSelectedDeparture('');
      setLoadingDepartures(false);
    };

    loadDepartures();
  }, [selectedRoute, selectedDate]);

  // Load price rules
  useEffect(() => {
    const loadPriceRules = async () => {
      const tripIds = trips.map(t => t.id);
      if (tripIds.length === 0) return;

      const { data } = await supabase
        .from('price_rules')
        .select('trip_id, adult_price, child_price, rule_type, start_date, end_date')
        .in('trip_id', tripIds)
        .eq('status', 'active');

      setPriceRules(data || []);
    };

    loadPriceRules();
  }, [trips]);

  // Update pricing when departure changes
  useEffect(() => {
    if (!selectedDeparture || manualPriceOverride) return;

    const departure = departures.find(d => d.id === selectedDeparture);
    if (!departure) return;

    const rules = priceRules.filter(r => r.trip_id === departure.trip_id);
    let adult = 0;
    let child = 0;

    for (const rule of rules) {
      if (rule.rule_type === 'seasonal' && rule.start_date && rule.end_date) {
        if (selectedDate >= rule.start_date && selectedDate <= rule.end_date) {
          adult = rule.adult_price;
          child = rule.child_price || 0;
          break;
        }
      } else if (rule.rule_type === 'base') {
        adult = rule.adult_price;
        child = rule.child_price || 0;
      }
    }

    setAdultPrice(adult);
    setChildPrice(child);
  }, [selectedDeparture, departures, priceRules, selectedDate, manualPriceOverride]);

  const subtotal = (paxAdult * adultPrice) + (paxChild * childPrice);
  const total = Math.max(0, subtotal - discountAmount);

  const selectedDep = departures.find(d => d.id === selectedDeparture);
  const availableSeats = selectedDep ? selectedDep.capacity_total - selectedDep.capacity_reserved : 0;
  const totalPax = paxAdult + paxChild;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async () => {
    if (!selectedDeparture || !customer.full_name) {
      toast.error('Please fill all required fields');
      return;
    }

    if (totalPax > availableSeats) {
      toast.error(`Only ${availableSeats} seats available`);
      return;
    }

    setIsSubmitting(true);

    const result = await onSubmit({
      departure_id: selectedDeparture,
      customer,
      channel,
      pax_adult: paxAdult,
      pax_child: paxChild,
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      total_amount: total,
      notes_internal: notes || undefined,
      payment: paymentAmount > 0 ? {
        method: paymentMethod as any,
        amount: paymentAmount,
        status: paymentStatus,
      } : undefined,
      generate_ticket: generateTicket,
      price_override: manualPriceOverride ? { reason: overrideReason } : undefined,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success('Booking created successfully');
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedRoute('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedDeparture('');
    setChannel('offline_walkin');
    setPaxAdult(1);
    setPaxChild(0);
    setCustomer({ full_name: '', phone: '', email: '', country: '' });
    setNotes('');
    setGenerateTicket(true);
    setManualPriceOverride(false);
    setOverrideReason('');
    setDiscountAmount(0);
    setPaymentMethod('cash');
    setPaymentAmount(0);
    setPaymentStatus('unpaid');
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Offline Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trip Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Trip Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Route *</Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.filter(r => r.status === 'active' && r.id).map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.route_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departure Time *</Label>
                <Select 
                  value={selectedDeparture} 
                  onValueChange={setSelectedDeparture}
                  disabled={loadingDepartures || departures.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingDepartures ? "Loading..." : departures.length === 0 ? "No departures" : "Select time"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departures.filter(dep => dep.id).map(dep => {
                      const avail = dep.capacity_total - dep.capacity_reserved;
                      return (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.departure_time.slice(0, 5)} ({avail} seats)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Booking Source *</Label>
                <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(ch => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Passengers */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Label>Adults:</Label>
                <Button variant="outline" size="icon" onClick={() => setPaxAdult(Math.max(1, paxAdult - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{paxAdult}</span>
                <Button variant="outline" size="icon" onClick={() => setPaxAdult(paxAdult + 1)} disabled={totalPax >= availableSeats}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Label>Children:</Label>
                <Button variant="outline" size="icon" onClick={() => setPaxChild(Math.max(0, paxChild - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{paxChild}</span>
                <Button variant="outline" size="icon" onClick={() => setPaxChild(paxChild + 1)} disabled={totalPax >= availableSeats}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={customer.full_name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone / WhatsApp</Label>
                <Input
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+62812345678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={customer.country}
                  onChange={(e) => setCustomer(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Indonesia"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pricing
              </h3>
              <div className="flex items-center gap-2">
                <Switch checked={manualPriceOverride} onCheckedChange={setManualPriceOverride} />
                <Label className="text-sm">Manual Override</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Adult Price</Label>
                <Input
                  type="number"
                  value={adultPrice}
                  onChange={(e) => setAdultPrice(Number(e.target.value))}
                  disabled={!manualPriceOverride}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Child Price</Label>
                <Input
                  type="number"
                  value={childPrice}
                  onChange={(e) => setChildPrice(Number(e.target.value))}
                  disabled={!manualPriceOverride}
                  className="mt-1"
                />
              </div>
            </div>

            {manualPriceOverride && (
              <div>
                <Label>Override Reason *</Label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for price change"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label>Discount Amount</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>{paxAdult} Adult(s) × {formatPrice(adultPrice)}</span>
                <span>{formatPrice(paxAdult * adultPrice)}</span>
              </div>
              {paxChild > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{paxChild} Child(ren) × {formatPrice(childPrice)}</span>
                  <span>{formatPrice(paxChild * childPrice)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div className="space-y-4">
            <h3 className="font-semibold">Payment</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => {
                    const amt = Number(e.target.value);
                    setPaymentAmount(amt);
                    if (amt >= total) setPaymentStatus('paid');
                    else if (amt > 0) setPaymentStatus('partial');
                    else setPaymentStatus('unpaid');
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ticket & Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Ticket & Notes
              </h3>
              <div className="flex items-center gap-2">
                <Switch checked={generateTicket} onCheckedChange={setGenerateTicket} />
                <Label className="text-sm">Generate QR Ticket</Label>
              </div>
            </div>

            <div>
              <Label>Internal Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible only to staff..."
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedDeparture || !customer.full_name}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Booking'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
