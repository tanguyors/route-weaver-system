import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, isBefore, isToday, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users,
  Package,
  Key,
  Minus,
  Plus,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useActivityWidgetData, LineItem, CustomerInfo, WidgetAvailability } from '@/hooks/useActivityWidgetData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ActivityWidgetPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const { product, isLoadingProduct, productError, fetchAvailability, createBooking, isCreatingBooking } = useActivityWidgetData(productId);
  
  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedRentalOption, setSelectedRentalOption] = useState<string | null>(null);
  const [tierQty, setTierQty] = useState<Record<string, number>>({});
  const [rentalQty, setRentalQty] = useState(1);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', email: '', phone: '' });
  const [guestData, setGuestData] = useState<{ name?: string; phone?: string; age?: string }>({});
  const [participantData, setParticipantData] = useState<{ name?: string; phone?: string; age?: string }[]>([]);
  
  // Fetch availability for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { data: availability = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['widget-availability', productId, format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchAvailability(format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')),
    enabled: !!productId,
  });
  
  const availabilityMap = useMemo(() => {
    const map = new Map<string, WidgetAvailability>();
    availability.forEach(day => map.set(day.date, day));
    return map;
  }, [availability]);
  
  // Get selected day's availability
  const selectedDayAvailability = selectedDate ? availabilityMap.get(format(selectedDate, 'yyyy-MM-dd')) : null;
  
  // Calculate total qty and subtotal
  const { totalQty, subtotal, lineItems } = useMemo(() => {
    if (!product) return { totalQty: 0, subtotal: 0, lineItems: [] };
    
    if (product.product_type === 'rental') {
      const option = product.rental_options.find(o => o.id === selectedRentalOption);
      if (!option) return { totalQty: 0, subtotal: 0, lineItems: [] };
      
      const items: LineItem[] = [{
        duration_unit: option.duration_unit,
        duration_value: option.duration_value,
        qty: rentalQty,
        price: option.price,
      }];
      return { totalQty: rentalQty, subtotal: option.price * rentalQty, lineItems: items };
    } else {
      let qty = 0;
      let total = 0;
      const items: LineItem[] = [];
      
      product.pricing.forEach(tier => {
        const q = tierQty[tier.id] || 0;
        if (q > 0) {
          qty += q;
          total += tier.price * q;
          items.push({ tier_name: tier.tier_name, qty: q, price: tier.price });
        }
      });
      
      return { totalQty: qty, subtotal: total, lineItems: items };
    }
  }, [product, tierQty, rentalQty, selectedRentalOption]);
  
  // Update participant data when totalQty changes
  useEffect(() => {
    if (product?.guest_form_apply_to === 'per_participant') {
      setParticipantData(prev => {
        const newData = [...prev];
        while (newData.length < totalQty) {
          newData.push({});
        }
        return newData.slice(0, totalQty);
      });
    }
  }, [totalQty, product?.guest_form_apply_to]);
  
  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateStr);
    
    if (!dayData || dayData.status === 'closed') return;
    if (isBefore(date, startOfDay(new Date()))) return;
    
    setSelectedDate(date);
    setSelectedSlot(null);
  };
  
  const handleReserve = async () => {
    if (!selectedDate || !productId) return;
    
    // Validate customer info
    if (!customer.name.trim() || !customer.email.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    
    // For time_slot, require slot selection
    if (product?.product_type === 'time_slot' && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    
    // For rental, require option selection
    if (product?.product_type === 'rental' && !selectedRentalOption) {
      toast.error('Please select a rental option');
      return;
    }
    
    if (totalQty <= 0) {
      toast.error('Please select at least one item');
      return;
    }
    
    try {
      // Build guest data
      let guestPayload = null;
      if (product?.guest_form_enabled) {
        if (product.guest_form_apply_to === 'per_participant') {
          guestPayload = { participants: participantData };
        } else {
          guestPayload = guestData;
        }
      }
      
      const result = await createBooking({
        bookingDate: format(selectedDate, 'yyyy-MM-dd'),
        slotTime: selectedSlot,
        lineItems,
        customer,
        guestData: guestPayload,
      });
      
      navigate(`/activity/checkout/${result.booking_id}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to create booking');
    }
  };
  
  // Calendar rendering
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);
  
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (productError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">This product is not available for booking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getProductTypeIcon = () => {
    switch (product.product_type) {
      case 'time_slot': return <Clock className="h-4 w-4" />;
      case 'rental': return <Key className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Product Header */}
        <div className="space-y-3">
          {/* Image Carousel */}
          {product.images.length > 0 && (
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <img 
                        src={img.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {product.images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getProductTypeIcon()}
                <span className="ml-1">{product.product_type.replace('_', ' ')}</span>
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.location_name && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                <span>{product.location_name}</span>
              </div>
            )}
            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}
          </div>
          
          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.highlights.map((h, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  {h}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Date Picker */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Select Date</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoadingAvailability ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {paddingDays.map((_, i) => <div key={`pad-${i}`} className="aspect-square" />)}
                  {daysInMonth.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = availabilityMap.get(dateStr);
                    const isPast = isBefore(date, startOfDay(new Date()));
                    const isClosed = !dayData || dayData.status === 'closed';
                    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                    const isDisabled = isPast || isClosed;
                    
                    return (
                      <button
                        key={dateStr}
                        disabled={isDisabled}
                        onClick={() => handleDateSelect(date)}
                        className={cn(
                          'aspect-square rounded-lg text-sm font-medium transition-colors',
                          isDisabled && 'text-muted-foreground/40 cursor-not-allowed',
                          !isDisabled && 'hover:bg-primary/10',
                          isToday(date) && 'ring-1 ring-primary',
                          isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                          isClosed && !isPast && 'bg-destructive/10'
                        )}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Time Slot Selector (for time_slot products) */}
        {product.product_type === 'time_slot' && selectedDate && selectedDayAvailability?.slots && (
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Select Time</h3>
              <div className="grid grid-cols-3 gap-2">
                {selectedDayAvailability.slots
                  .filter(s => s.status === 'open')
                  .map(slot => {
                    const isSelected = selectedSlot === slot.slot_time;
                    return (
                      <Button
                        key={slot.slot_time}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSlot(slot.slot_time)}
                        className="justify-center"
                      >
                        {slot.slot_time.slice(0, 5)}
                      </Button>
                    );
                  })}
              </div>
              {selectedDayAvailability.slots.filter(s => s.status === 'open').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No available slots for this date</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Pricing Selector */}
        {selectedDate && (product.product_type !== 'time_slot' || selectedSlot) && (
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">
                {product.product_type === 'rental' ? 'Select Rental Option' : 'Select Tickets'}
              </h3>
              
              {product.product_type === 'rental' ? (
                <div className="space-y-2">
                  {product.rental_options.map(option => {
                    const isSelected = selectedRentalOption === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedRentalOption(option.id)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-colors',
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {option.duration_value} {option.duration_unit}{option.duration_value > 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold">IDR {option.price.toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })}
                  
                  {selectedRentalOption && (
                    <div className="flex items-center justify-between pt-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setRentalQty(Math.max(1, rentalQty - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{rentalQty}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setRentalQty(rentalQty + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {product.pricing.map(tier => {
                    const qty = tierQty[tier.id] || 0;
                    return (
                      <div key={tier.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tier.tier_name}</p>
                          <p className="text-sm text-muted-foreground">IDR {tier.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setTierQty(prev => ({ ...prev, [tier.id]: Math.max(0, qty - 1) }))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{qty}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setTierQty(prev => ({ ...prev, [tier.id]: qty + 1 }))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Customer Info */}
        {totalQty > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name"
                    value={customer.name}
                    onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={e => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    value={customer.phone}
                    onChange={e => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+62..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Guest Form (per_booking) */}
        {totalQty > 0 && product.guest_form_enabled && product.guest_form_apply_to === 'per_booking' && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold">Guest Information</h3>
              <div className="space-y-3">
                {product.guest_form_config?.name && (
                  <div className="space-y-1.5">
                    <Label>Guest Name</Label>
                    <Input 
                      value={guestData.name || ''}
                      onChange={e => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                )}
                {product.guest_form_config?.phone && (
                  <div className="space-y-1.5">
                    <Label>Guest Phone</Label>
                    <Input 
                      value={guestData.phone || ''}
                      onChange={e => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                )}
                {product.guest_form_config?.age && (
                  <div className="space-y-1.5">
                    <Label>Age</Label>
                    <Input 
                      type="number"
                      value={guestData.age || ''}
                      onChange={e => setGuestData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Guest Form (per_participant) */}
        {totalQty > 0 && product.guest_form_enabled && product.guest_form_apply_to === 'per_participant' && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold">Participant Information</h3>
              {participantData.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-3">
                  <p className="text-sm font-medium">Participant {i + 1}</p>
                  {product.guest_form_config?.name && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Name</Label>
                      <Input 
                        value={p.name || ''}
                        onChange={e => {
                          const newData = [...participantData];
                          newData[i] = { ...newData[i], name: e.target.value };
                          setParticipantData(newData);
                        }}
                      />
                    </div>
                  )}
                  {product.guest_form_config?.phone && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input 
                        value={p.phone || ''}
                        onChange={e => {
                          const newData = [...participantData];
                          newData[i] = { ...newData[i], phone: e.target.value };
                          setParticipantData(newData);
                        }}
                      />
                    </div>
                  )}
                  {product.guest_form_config?.age && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Age</Label>
                      <Input 
                        type="number"
                        value={p.age || ''}
                        onChange={e => {
                          const newData = [...participantData];
                          newData[i] = { ...newData[i], age: e.target.value };
                          setParticipantData(newData);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Summary & Reserve Button */}
        {totalQty > 0 && (
          <Card className="sticky bottom-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
                  <p className="text-xl font-bold">IDR {subtotal.toLocaleString()}</p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleReserve}
                  disabled={isCreatingBooking}
                >
                  {isCreatingBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reserve
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActivityWidgetPage;
