import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Ban,
  Loader2,
  X,
  Package,
  Clock,
  Key,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailabilityData, DayAvailability, BlackoutRange } from '@/hooks/useAvailabilityData';
import { useActivityProductsData, ActivityProduct } from '@/hooks/useActivityProductsData';
import { cn } from '@/lib/utils';

const ActivityAvailabilityPage = () => {
  const { user } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);
  const [blackoutForm, setBlackoutForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [deleteBlackoutId, setDeleteBlackoutId] = useState<string | null>(null);

  // Day edit state
  const [dayStatus, setDayStatus] = useState<'open' | 'closed'>('open');
  const [dayCapacity, setDayCapacity] = useState<string>('');
  const [dayNote, setDayNote] = useState('');
  const [slotEdits, setSlotEdits] = useState<Record<string, { status: 'open' | 'closed'; capacity: string }>>({});

  const { products, isLoading: isLoadingProducts } = useActivityProductsData();
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const {
    fetchAvailability,
    blackoutRanges,
    isLoadingBlackouts,
    setBlackout,
    isSettingBlackout,
    deleteBlackout,
    isDeletingBlackout,
    upsertDay,
    isUpsertingDay,
    upsertSlot,
    isUpsertingSlot,
  } = useAvailabilityData(selectedProductId || undefined);

  // Fetch availability for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: availability = [], isLoading: isLoadingAvailability, refetch: refetchAvailability } = useQuery({
    queryKey: ['availability', selectedProductId, format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchAvailability(format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')),
    enabled: !!selectedProductId,
  });

  // Build availability map
  const availabilityMap = new Map<string, DayAvailability>();
  availability.forEach(day => {
    availabilityMap.set(day.date, day);
  });

  // Build blackout dates set
  const blackoutDates = new Set<string>();
  blackoutRanges.forEach(range => {
    const start = parseISO(range.start_date);
    const end = parseISO(range.end_date);
    eachDayOfInterval({ start, end }).forEach(date => {
      blackoutDates.add(format(date, 'yyyy-MM-dd'));
    });
  });

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateStr);
    
    if (dayData) {
      setDayStatus(dayData.status);
      setDayCapacity(dayData.capacity?.toString() || '');
      setDayNote(dayData.note || '');
      
      // Initialize slot edits
      if (dayData.slots) {
        const edits: Record<string, { status: 'open' | 'closed'; capacity: string }> = {};
        dayData.slots.forEach(slot => {
          edits[slot.slot_time] = { status: slot.status, capacity: slot.capacity.toString() };
        });
        setSlotEdits(edits);
      }
    } else {
      setDayStatus('open');
      setDayCapacity('');
      setDayNote('');
      setSlotEdits({});
    }
  };

  const handleSaveDay = async () => {
    if (!selectedDate || !selectedProductId) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    await upsertDay({
      date: dateStr,
      status: dayStatus,
      capacityOverride: dayCapacity ? parseInt(dayCapacity) : null,
      note: dayNote || null,
    });

    // Save slot edits if time_slot product
    if (selectedProduct?.product_type === 'time_slot') {
      for (const [slotTime, edit] of Object.entries(slotEdits)) {
        await upsertSlot({
          date: dateStr,
          slotTime,
          status: edit.status,
          capacityOverride: edit.capacity ? parseInt(edit.capacity) : null,
        });
      }
    }

    refetchAvailability();
    setSelectedDate(null);
  };

  const handleAddBlackout = async () => {
    if (!blackoutForm.startDate || !blackoutForm.endDate) return;

    await setBlackout({
      startDate: blackoutForm.startDate,
      endDate: blackoutForm.endDate,
      reason: blackoutForm.reason || undefined,
    });

    refetchAvailability();
    setShowBlackoutModal(false);
    setBlackoutForm({ startDate: '', endDate: '', reason: '' });
  };

  const handleDeleteBlackout = async () => {
    if (deleteBlackoutId) {
      await deleteBlackout(deleteBlackoutId);
      refetchAvailability();
      setDeleteBlackoutId(null);
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'time_slot': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'rental': return <Key className="h-4 w-4 text-purple-600" />;
      default: return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  // Calendar grid
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Availability Calendar</h1>
            <p className="text-muted-foreground">Manage product availability, blackout dates, and capacity</p>
          </div>
          <Button 
            onClick={() => setShowBlackoutModal(true)} 
            variant="outline"
            disabled={!selectedProductId}
          >
            <Ban className="h-4 w-4 mr-2" />
            Add Blackout
          </Button>
        </div>

        {/* Product Picker */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <Label className="mb-2 block">Select Product</Label>
                <Select value={selectedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Choose a product to manage availability" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p.status !== 'inactive')
                      .map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            {getProductTypeIcon(product.product_type)}
                            <span>{product.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {product.product_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProduct && (
                <div className="text-sm text-muted-foreground">
                  Default capacity: <span className="font-medium text-foreground">
                    {selectedProduct.product_type === 'rental' 
                      ? selectedProduct.inventory_count 
                      : selectedProduct.default_capacity}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedProductId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Select a product to view and manage its availability</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Today
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAvailability ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {paddingDays.map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square" />
                      ))}
                      {daysInMonth.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const dayData = availabilityMap.get(dateStr);
                        const isBlackout = blackoutDates.has(dateStr);
                        const isClosed = dayData?.status === 'closed' || isBlackout;
                        const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => handleDateClick(date)}
                            className={cn(
                              'aspect-square p-1 rounded-lg border text-sm transition-colors relative',
                              isToday(date) && 'ring-2 ring-primary ring-offset-1',
                              isSelected && 'border-primary bg-primary/10',
                              isClosed ? 'bg-destructive/10 border-destructive/30' : 'bg-background hover:bg-muted',
                              isBlackout && 'bg-muted border-muted-foreground/30'
                            )}
                          >
                            <span className={cn(
                              'block text-center font-medium',
                              isClosed && 'text-destructive',
                              isBlackout && 'text-muted-foreground line-through'
                            )}>
                              {format(date, 'd')}
                            </span>
                            {!isBlackout && dayData && selectedProduct?.product_type !== 'time_slot' && (
                              <span className="block text-[10px] text-center text-muted-foreground">
                                {dayData.capacity}
                              </span>
                            )}
                            {isBlackout && (
                              <Ban className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-background border" />
                        <span>Open</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-destructive/10 border-destructive/30 border" />
                        <span>Closed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-muted border" />
                        <span>Blackout</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Blackout Ranges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blackout Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBlackouts ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : blackoutRanges.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No blackout ranges set
                  </p>
                ) : (
                  <div className="space-y-2">
                    {blackoutRanges.map(range => (
                      <div key={range.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">
                            {format(parseISO(range.start_date), 'MMM d')} - {format(parseISO(range.end_date), 'MMM d, yyyy')}
                          </p>
                          {range.reason && (
                            <p className="text-xs text-muted-foreground">{range.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteBlackoutId(range.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Day Edit Sheet */}
        <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </SheetTitle>
              <SheetDescription>
                Edit availability for this day
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Day Status */}
              <div className="flex items-center justify-between">
                <Label>Day Status</Label>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', dayStatus === 'closed' && 'text-muted-foreground')}>Open</span>
                  <Switch
                    checked={dayStatus === 'closed'}
                    onCheckedChange={(checked) => setDayStatus(checked ? 'closed' : 'open')}
                  />
                  <span className={cn('text-sm', dayStatus === 'open' && 'text-muted-foreground')}>Closed</span>
                </div>
              </div>

              {/* Capacity Override */}
              {selectedProduct?.product_type !== 'time_slot' && (
                <div className="space-y-2">
                  <Label>Capacity Override</Label>
                  <Input
                    type="number"
                    placeholder={`Default: ${selectedProduct?.product_type === 'rental' ? selectedProduct.inventory_count : selectedProduct?.default_capacity}`}
                    value={dayCapacity}
                    onChange={(e) => setDayCapacity(e.target.value)}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use default capacity</p>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  placeholder="Add a note for this day..."
                  value={dayNote}
                  onChange={(e) => setDayNote(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Time Slots (for time_slot products) */}
              {selectedProduct?.product_type === 'time_slot' && selectedDate && (
                <div className="space-y-3">
                  <Label>Time Slots</Label>
                  {availabilityMap.get(format(selectedDate, 'yyyy-MM-dd'))?.slots?.map(slot => (
                    <div key={slot.slot_time} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium w-16">{slot.slot_time.slice(0, 5)}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <Switch
                          checked={slotEdits[slot.slot_time]?.status === 'closed'}
                          onCheckedChange={(checked) => 
                            setSlotEdits(prev => ({
                              ...prev,
                              [slot.slot_time]: {
                                ...prev[slot.slot_time],
                                status: checked ? 'closed' : 'open'
                              }
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {slotEdits[slot.slot_time]?.status === 'closed' ? 'Closed' : 'Open'}
                        </span>
                      </div>
                      <Input
                        type="number"
                        className="w-20 h-8"
                        placeholder={slot.capacity.toString()}
                        value={slotEdits[slot.slot_time]?.capacity || ''}
                        onChange={(e) => 
                          setSlotEdits(prev => ({
                            ...prev,
                            [slot.slot_time]: {
                              ...prev[slot.slot_time],
                              capacity: e.target.value
                            }
                          }))
                        }
                        min={0}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={handleSaveDay} 
                className="w-full" 
                disabled={isUpsertingDay || isUpsertingSlot}
              >
                {(isUpsertingDay || isUpsertingSlot) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Blackout Modal */}
        <Dialog open={showBlackoutModal} onOpenChange={setShowBlackoutModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Blackout Range</DialogTitle>
              <DialogDescription>
                Block a date range for this product. It will be unavailable for booking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={blackoutForm.startDate}
                    onChange={(e) => setBlackoutForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={blackoutForm.endDate}
                    onChange={(e) => setBlackoutForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input
                  placeholder="e.g., Holiday, Maintenance..."
                  value={blackoutForm.reason}
                  onChange={(e) => setBlackoutForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBlackoutModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddBlackout} 
                disabled={!blackoutForm.startDate || !blackoutForm.endDate || isSettingBlackout}
              >
                {isSettingBlackout && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Blackout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Blackout Confirmation */}
        <AlertDialog open={!!deleteBlackoutId} onOpenChange={() => setDeleteBlackoutId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blackout Range</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this blackout range? The dates will become available again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteBlackout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingBlackout && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ActivityDashboardLayout>
  );
};

export default ActivityAvailabilityPage;
