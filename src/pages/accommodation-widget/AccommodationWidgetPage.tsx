import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAccommodationWidgetData, AccommodationItem } from '@/hooks/useAccommodationWidgetData';
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

  // Pricing
  const pricing = useMemo(() => {
    if (!selectedAccommodation || !checkinDate || !checkoutDate) return null;
    return calculatePrice(
      selectedAccommodation.id,
      checkinDate.toISOString().split('T')[0],
      checkoutDate.toISOString().split('T')[0]
    );
  }, [selectedAccommodation, checkinDate, checkoutDate, calculatePrice]);

  // Calendar disabled dates
  const disabledDays = useCallback(
    (date: Date) => {
      if (!selectedAccommodation) return true;
      const dateStr = date.toISOString().split('T')[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
      if (!selectingCheckout) {
        return !isDateAvailable(selectedAccommodation.id, dateStr);
      }
      // For checkout selection, allow dates after checkin
      if (!checkinDate) return true;
      if (date <= checkinDate) return true;
      // Check all dates in range are available
      const checkinStr = checkinDate.toISOString().split('T')[0];
      return !isRangeAvailable(selectedAccommodation.id, checkinStr, dateStr);
    },
    [selectedAccommodation, isDateAvailable, isRangeAvailable, selectingCheckout, checkinDate]
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
        if (nights < selectedAccommodation.minimum_nights) {
          toast({
            title: 'Minimum stay',
            description: `Minimum stay is ${selectedAccommodation.minimum_nights} nights`,
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
    setImageIndex(0);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setSelectingCheckout(false);
    setGuestsCount(1);
    setPromoCode('');
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
        {/* Back button when accommodation selected */}
        {selectedAccommodation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAccommodation(null)}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to all properties
          </Button>
        )}

        {/* Property List */}
        {!selectedAccommodation && (
          <div>
            <h2 className="text-xl font-bold mb-4">Our Properties</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.accommodations.map((acc) => (
                <Card
                  key={acc.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectAccommodation(acc)}
                >
                  {acc.images.length > 0 ? (
                    <img
                      src={acc.images[0].image_url}
                      alt={acc.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-48 flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <BedDouble className="w-12 h-12" style={{ color: `${primaryColor}40` }} />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg">{acc.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {acc.type}
                    </Badge>
                    {acc.city && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {acc.city}{acc.country ? `, ${acc.country}` : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{acc.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />{acc.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3" />{acc.bathrooms}
                      </span>
                    </div>
                    <p className="font-bold text-lg" style={{ color: primaryColor }}>
                      {acc.currency} {acc.price_per_night.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/night</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {data.accommodations.length === 0 && (
              <p className="text-center text-gray-400 py-12">No properties available at the moment.</p>
            )}
          </div>
        )}

        {/* Selected Accommodation Details */}
        {selectedAccommodation && (
          <div className="space-y-8">
            {/* Image Carousel */}
            {selectedAccommodation.images.length > 0 && (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={selectedAccommodation.images[imageIndex]?.image_url}
                  alt={selectedAccommodation.name}
                  className="w-full h-64 md:h-96 object-cover"
                />
                {selectedAccommodation.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex((i) => (i > 0 ? i - 1 : selectedAccommodation.images.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImageIndex((i) => (i < selectedAccommodation.images.length - 1 ? i + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selectedAccommodation.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === imageIndex ? 'bg-white w-4' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Property Info */}
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
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />{selectedAccommodation.capacity} guests
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <BedDouble className="w-3 h-3" />{selectedAccommodation.bedrooms} bed
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Bath className="w-3 h-3" />{selectedAccommodation.bathrooms} bath
                </span>
              </div>
              {selectedAccommodation.description && (
                <p className="mt-4 text-gray-600 leading-relaxed">{selectedAccommodation.description}</p>
              )}
              {selectedAccommodation.amenities && Array.isArray(selectedAccommodation.amenities) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedAccommodation.amenities as string[]).map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-1">Select Dates</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {!selectingCheckout
                    ? 'Choose your check-in date'
                    : 'Choose your check-out date'}
                  {selectedAccommodation.minimum_nights > 1 &&
                    ` (min. ${selectedAccommodation.minimum_nights} nights)`}
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
                      {selectedAccommodation.checkin_time && (
                        <span className="text-gray-400"> from {selectedAccommodation.checkin_time}</span>
                      )}
                    </div>
                    {checkoutDate && (
                      <div>
                        <span className="text-gray-500">Check-out: </span>
                        <span className="font-medium">{checkoutDate.toLocaleDateString()}</span>
                        {selectedAccommodation.checkout_time && (
                          <span className="text-gray-400"> before {selectedAccommodation.checkout_time}</span>
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
                      onClick={() => setGuestsCount((g) => Math.min(selectedAccommodation.capacity, g + 1))}
                      disabled={guestsCount >= selectedAccommodation.capacity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      max {selectedAccommodation.capacity} guests
                    </span>
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
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={customerCountry} onValueChange={setCustomerCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.name}>
                              {c.name}
                            </SelectItem>
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