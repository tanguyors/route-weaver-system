import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAccommodationWidgetData, AccommodationItem, RoomItem } from '@/hooks/useAccommodationWidgetData';
import { useIframeHeightMessenger } from '@/hooks/useIframeHeightMessenger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import {
  Loader2,
  Users,
  BedDouble,
  Bath,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Tag,
  Minus,
  Plus,
  Moon,
  AlertCircle,
  DoorOpen,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AccommodationWidgetPage = () => {
  const { widgetKey } = useParams<{ widgetKey: string }>();
  const { data, loading, error, isDateAvailable, isRangeAvailable, calculatePrice, createBooking } =
    useAccommodationWidgetData(widgetKey || null);
  useIframeHeightMessenger();
  const { toast } = useToast();

  // State
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationItem | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [checkinDate, setCheckinDate] = useState<Date | undefined>();
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>();
  const [selectingCheckout, setSelectingCheckout] = useState(false);
  const [guestsCount, setGuestsCount] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCountry, setCustomerCountry] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Theme
  const primaryColor = data?.theme_config?.primary_color || '#7c3aed';
  const bgColor = data?.theme_config?.background_color || '#ffffff';
  const textColor = data?.theme_config?.text_color || '#1f2937';

  // Determine if hotel with rooms
  const isHotelWithRooms = selectedAccommodation?.type === 'hotel' && (selectedAccommodation?.rooms?.length || 0) > 0;

  // Active source for calendar/pricing: room if selected, else accommodation
  const activeRoomId = selectedRoom?.id;
  const activeMinNights = selectedRoom?.minimum_nights ?? selectedAccommodation?.minimum_nights ?? 1;
  const activeCapacity = selectedRoom?.capacity ?? selectedAccommodation?.capacity ?? 1;

  // Pricing
  const pricing = useMemo(() => {
    if (!selectedAccommodation || !checkinDate || !checkoutDate) return null;
    return calculatePrice(
      selectedAccommodation.id,
      checkinDate.toISOString().split('T')[0],
      checkoutDate.toISOString().split('T')[0],
      activeRoomId
    );
  }, [selectedAccommodation, checkinDate, checkoutDate, calculatePrice, activeRoomId]);

  // Price tiers for display
  const activeTiers = useMemo(() => {
    if (!selectedAccommodation) return [];
    if (selectedRoom && selectedRoom.price_tiers?.length > 0) return selectedRoom.price_tiers;
    return selectedAccommodation.price_tiers || [];
  }, [selectedAccommodation, selectedRoom]);

  // Calendar disabled dates
  const disabledDays = useCallback(
    (date: Date) => {
      if (!selectedAccommodation) return true;
      const dateStr = date.toISOString().split('T')[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
      if (!selectingCheckout) {
        return !isDateAvailable(selectedAccommodation.id, dateStr, activeRoomId);
      }
      if (!checkinDate) return true;
      if (date <= checkinDate) return true;
      const checkinStr = checkinDate.toISOString().split('T')[0];
      return !isRangeAvailable(selectedAccommodation.id, checkinStr, dateStr, activeRoomId);
    },
    [selectedAccommodation, isDateAvailable, isRangeAvailable, selectingCheckout, checkinDate, activeRoomId]
  );

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!selectingCheckout) {
      setCheckinDate(date);
      setCheckoutDate(undefined);
      setSelectingCheckout(true);
    } else {
      if (selectedAccommodation) {
        const nights = Math.round((date.getTime() - (checkinDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));
        if (nights < activeMinNights) {
          toast({
            title: 'Minimum stay',
            description: `Minimum stay is ${activeMinNights} nights`,
            variant: 'destructive',
          });
          return;
        }
      }
      setCheckoutDate(date);
      setSelectingCheckout(false);
    }
  };

  // Handle booking submission
  const handleSubmit = async () => {
    if (!selectedAccommodation || !checkinDate || !checkoutDate || !customerName) return;

    setBooking(true);
    try {
      const result = await createBooking({
        accommodation_id: selectedAccommodation.id,
        room_id: activeRoomId,
        checkin_date: checkinDate.toISOString().split('T')[0],
        checkout_date: checkoutDate.toISOString().split('T')[0],
        guests_count: guestsCount,
        customer: {
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
          country: customerCountry || undefined,
        },
        promo_code: promoCode || undefined,
      });
      setBookingResult(result.booking);
    } catch (err: any) {
      toast({
        title: 'Booking failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  // Select accommodation
  const handleSelectAccommodation = (acc: AccommodationItem) => {
    setSelectedAccommodation(acc);
    setSelectedRoom(null);
    setImageIndex(0);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setSelectingCheckout(false);
    setGuestsCount(1);
    setPromoCode('');
  };

  // Select room
  const handleSelectRoom = (room: RoomItem) => {
    setSelectedRoom(room);
    setImageIndex(0);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setSelectingCheckout(false);
    setGuestsCount(1);
  };

  // Go back
  const handleBackToProperties = () => {
    setSelectedAccommodation(null);
    setSelectedRoom(null);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setSelectingCheckout(false);
    setBookingResult(null);
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setSelectingCheckout(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ backgroundColor: bgColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6" style={{ backgroundColor: bgColor }}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg font-medium" style={{ color: textColor }}>
          {error || 'Widget not available'}
        </p>
      </div>
    );
  }

  // Booking success
  if (bookingResult) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="max-w-lg mx-auto text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-8">Your accommodation has been reserved.</p>

          <Card className="text-left">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Property</span>
                <span className="font-medium">{bookingResult.accommodation_name}</span>
              </div>
              {bookingResult.room_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Room Type</span>
                  <span className="font-medium">{bookingResult.room_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="font-medium">{bookingResult.checkin_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-out</span>
                <span className="font-medium">{bookingResult.checkout_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nights</span>
                <span className="font-medium">{bookingResult.total_nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guests</span>
                <span className="font-medium">{bookingResult.guests_count}</span>
              </div>
              {bookingResult.effective_price_per_night && bookingResult.effective_price_per_night !== bookingResult.base_price_per_night && (
                <div className="flex justify-between text-green-600">
                  <span>Tier discount</span>
                  <span>
                    {bookingResult.currency} {bookingResult.effective_price_per_night.toLocaleString()}/night
                    <span className="line-through text-gray-400 ml-1 text-xs">
                      {bookingResult.base_price_per_night.toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
              {bookingResult.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{bookingResult.currency} {bookingResult.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span style={{ color: primaryColor }}>
                  {bookingResult.currency} {bookingResult.total_amount.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 text-center pt-2">
                Ref: {bookingResult.id.substring(0, 8).toUpperCase()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Current images to show
  const currentImages = selectedRoom?.images?.length
    ? selectedRoom.images
    : selectedAccommodation?.images || [];

  // Show calendar (when villa selected, or room selected for hotel)
  const showCalendarAndBooking = selectedAccommodation && (!isHotelWithRooms || selectedRoom);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3" style={{ borderColor: `${textColor}15` }}>
        {data.theme_config?.logo_url && (
          <img src={data.theme_config.logo_url} alt="" className="h-8 w-auto object-contain" />
        )}
        <span className="font-semibold text-lg">{data.theme_config?.partner_name || 'Accommodations'}</span>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {/* Back buttons */}
        {selectedAccommodation && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToProperties} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to all properties
            </Button>
            {isHotelWithRooms && selectedRoom && (
              <Button variant="ghost" size="sm" onClick={handleBackToRooms} className="mb-2">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to room types
              </Button>
            )}
          </div>
        )}

        {/* Property List */}
        {!selectedAccommodation && (
          <div>
            <h2 className="text-xl font-bold mb-4">Our Properties</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.accommodations.map((acc) => {
                const startingPrice = acc.type === 'hotel' && acc.rooms?.length > 0
                  ? Math.min(...acc.rooms.map(r => r.price_per_night))
                  : acc.price_per_night;
                const hasRooms = acc.type === 'hotel' && acc.rooms?.length > 0;

                return (
                  <Card
                    key={acc.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectAccommodation(acc)}
                  >
                    {acc.images.length > 0 ? (
                      <img src={acc.images[0].image_url} alt={acc.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}>
                        <BedDouble className="w-12 h-12" style={{ color: `${primaryColor}40` }} />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg">{acc.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">{acc.type}</Badge>
                        {hasRooms && (
                          <Badge variant="outline" className="text-xs">
                            <DoorOpen className="w-3 h-3 mr-1" />
                            {acc.rooms.length} room type{acc.rooms.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {acc.city && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {acc.city}{acc.country ? `, ${acc.country}` : ''}
                        </p>
                      )}
                      {!hasRooms && (
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{acc.capacity}</span>
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{acc.bedrooms}</span>
                          <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{acc.bathrooms}</span>
                        </div>
                      )}
                      <p className="font-bold text-lg" style={{ color: primaryColor }}>
                        {hasRooms && <span className="text-sm font-normal text-gray-500">from </span>}
                        {acc.currency} {startingPrice.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">/night</span>
                      </p>
                      {acc.price_tiers?.length > 0 && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Long stay discounts available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {data.accommodations.length === 0 && (
              <p className="text-center text-gray-400 py-12">No properties available at the moment.</p>
            )}
          </div>
        )}

        {/* Hotel Room Selection */}
        {selectedAccommodation && isHotelWithRooms && !selectedRoom && (
          <div className="space-y-6">
            {/* Hotel info */}
            <div>
              <h2 className="text-2xl font-bold">{selectedAccommodation.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge variant="secondary">{selectedAccommodation.type}</Badge>
                {selectedAccommodation.city && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedAccommodation.city}
                    {selectedAccommodation.country ? `, ${selectedAccommodation.country}` : ''}
                  </span>
                )}
              </div>
              {selectedAccommodation.description && (
                <p className="mt-3 text-gray-600 leading-relaxed">{selectedAccommodation.description}</p>
              )}
            </div>

            {/* Room type cards */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Choose Your Room</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedAccommodation.rooms.map((room) => (
                  <Card
                    key={room.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectRoom(room)}
                  >
                    {room.images?.length > 0 ? (
                      <img src={room.images[0].image_url} alt={room.name} className="w-full h-40 object-cover" />
                    ) : selectedAccommodation.images.length > 0 ? (
                      <img src={selectedAccommodation.images[0].image_url} alt={room.name} className="w-full h-40 object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}>
                        <DoorOpen className="w-10 h-10" style={{ color: `${primaryColor}40` }} />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold">{room.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity}</span>
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{room.bed_type}</span>
                        <Badge variant="outline" className="text-xs">×{room.quantity}</Badge>
                      </div>
                      {room.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{room.description}</p>
                      )}
                      <p className="font-bold text-lg" style={{ color: primaryColor }}>
                        {room.currency} {room.price_per_night.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">/night</span>
                      </p>
                      {room.price_tiers?.length > 0 && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {room.price_tiers.map(t => `${t.min_nights}+ nights: ${room.currency} ${t.price_per_night.toLocaleString()}`).join(' · ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Accommodation/Room Details + Calendar + Booking */}
        {showCalendarAndBooking && (
          <div className="space-y-8">
            {/* Image Carousel */}
            {currentImages.length > 0 && (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={currentImages[imageIndex]?.image_url}
                  alt={selectedRoom?.name || selectedAccommodation!.name}
                  className="w-full h-64 md:h-96 object-cover"
                />
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex((i) => (i > 0 ? i - 1 : currentImages.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImageIndex((i) => (i < currentImages.length - 1 ? i + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {currentImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === imageIndex ? 'bg-white w-4' : 'bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Property/Room Info */}
            <div>
              <h2 className="text-2xl font-bold">
                {selectedRoom ? `${selectedAccommodation!.name} — ${selectedRoom.name}` : selectedAccommodation!.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge variant="secondary">{selectedAccommodation!.type}</Badge>
                {selectedRoom && <Badge variant="outline">{selectedRoom.bed_type}</Badge>}
                {selectedAccommodation!.city && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedAccommodation!.city}
                    {selectedAccommodation!.country ? `, ${selectedAccommodation!.country}` : ''}
                  </span>
                )}
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />{activeCapacity} guests
                </span>
                {!selectedRoom && (
                  <>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />{selectedAccommodation!.bedrooms} bed
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Bath className="w-3 h-3" />{selectedAccommodation!.bathrooms} bath
                    </span>
                  </>
                )}
              </div>
              {(selectedRoom?.description || (!selectedRoom && selectedAccommodation!.description)) && (
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {selectedRoom?.description || selectedAccommodation!.description}
                </p>
              )}
              {!selectedRoom && selectedAccommodation!.amenities && Array.isArray(selectedAccommodation!.amenities) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedAccommodation!.amenities as string[]).map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
              {selectedRoom?.amenities && Array.isArray(selectedRoom.amenities) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedRoom.amenities as string[]).map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price Tiers Info */}
            {activeTiers.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-green-800 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4" /> Long Stay Discounts
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {activeTiers.map((tier, i) => {
                      const basePrice = selectedRoom?.price_per_night ?? selectedAccommodation!.price_per_night;
                      const savings = basePrice > 0 ? Math.round((1 - tier.price_per_night / basePrice) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-white border border-green-100">
                          <span className="text-sm font-medium text-green-700">
                            {tier.min_nights}+ nights
                          </span>
                          <span className="text-sm">
                            <span className="font-bold" style={{ color: primaryColor }}>
                              {(selectedRoom?.currency || selectedAccommodation!.currency)} {tier.price_per_night.toLocaleString()}
                            </span>
                            {savings > 0 && (
                              <span className="text-xs text-green-600 ml-1">-{savings}%</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-1">Select Dates</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {!selectingCheckout
                    ? 'Choose your check-in date'
                    : 'Choose your check-out date'}
                  {activeMinNights > 1 && ` (min. ${activeMinNights} nights)`}
                </p>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectingCheckout ? checkoutDate : checkinDate}
                    onSelect={handleDateSelect}
                    disabled={disabledDays}
                    numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                    fromDate={new Date()}
                    className="rounded-md border"
                    modifiers={{
                      checkin: checkinDate ? [checkinDate] : [],
                      checkout: checkoutDate ? [checkoutDate] : [],
                      range:
                        checkinDate && checkoutDate
                          ? Array.from({ length: Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000) - 1 }, (_, i) => {
                              const d = new Date(checkinDate);
                              d.setDate(d.getDate() + i + 1);
                              return d;
                            })
                          : [],
                    }}
                    modifiersStyles={{
                      checkin: { backgroundColor: primaryColor, color: '#fff', borderRadius: '50% 0 0 50%' },
                      checkout: { backgroundColor: primaryColor, color: '#fff', borderRadius: '0 50% 50% 0' },
                      range: { backgroundColor: `${primaryColor}20`, borderRadius: 0 },
                    }}
                  />
                </div>

                {checkinDate && (
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Check-in: </span>
                      <span className="font-medium">{checkinDate.toLocaleDateString()}</span>
                      {selectedAccommodation!.checkin_time && (
                        <span className="text-gray-400"> from {selectedAccommodation!.checkin_time}</span>
                      )}
                    </div>
                    {checkoutDate && (
                      <div>
                        <span className="text-gray-500">Check-out: </span>
                        <span className="font-medium">{checkoutDate.toLocaleDateString()}</span>
                        {selectedAccommodation!.checkout_time && (
                          <span className="text-gray-400"> before {selectedAccommodation!.checkout_time}</span>
                        )}
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setCheckinDate(undefined); setCheckoutDate(undefined); setSelectingCheckout(false); }}>
                      Reset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guests */}
            {checkinDate && checkoutDate && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Number of Guests</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGuestsCount((g) => Math.max(1, g - 1))}
                      disabled={guestsCount <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{guestsCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGuestsCount((g) => Math.min(activeCapacity, g + 1))}
                      disabled={guestsCount >= activeCapacity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">max {activeCapacity} guests</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary & Promo */}
            {pricing && pricing.nights > 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Booking Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Moon className="w-4 h-4" />
                        {pricing.nights} night{pricing.nights > 1 ? 's' : ''} × {pricing.currency} {pricing.pricePerNight.toLocaleString()}
                      </span>
                      <span className="font-medium">
                        {pricing.currency} {pricing.baseTotal.toLocaleString()}
                      </span>
                    </div>
                    {pricing.tierApplied && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Long stay rate applied
                        </span>
                        <span className="line-through text-gray-400">
                          {pricing.currency} {(pricing.originalPricePerNight * pricing.nights).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      {pricing.currency} {pricing.baseTotal.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Form */}
            {pricing && pricing.nights > 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Your Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+1 234 567 890" />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={customerCountry} onValueChange={setCustomerCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full text-lg py-6"
                    style={{ backgroundColor: primaryColor, color: data.theme_config?.button_text_color || '#ffffff' }}
                    onClick={handleSubmit}
                    disabled={booking || !customerName}
                  >
                    {booking ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    )}
                    {booking ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationWidgetPage;
