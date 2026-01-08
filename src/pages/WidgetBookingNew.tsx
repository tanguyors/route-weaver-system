import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWidgetBooking, SelectedAddon } from '@/hooks/useWidgetBooking';
import { WidgetStepIndicator, WidgetStep } from '@/components/widget/WidgetStepIndicator';
import { WidgetSearchForm } from '@/components/widget/WidgetSearchForm';
import { WidgetTripResults } from '@/components/widget/WidgetTripResults';
import { WidgetShoppingCart, SelectedPickupInfo } from '@/components/widget/WidgetShoppingCart';
import { WidgetBookingDetails } from '@/components/widget/WidgetBookingDetails';
import { BookingSuccess } from '@/components/widget/BookingSuccess';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SelectedTrip {
  departure: any;
  trip: any;
  route: any;
  pricing: { adult: number; child: number };
  direction: 'outbound' | 'return';
}

const WidgetBookingNew = () => {
  const [searchParams] = useSearchParams();
  const widgetKey = searchParams.get('key');
  
  const [step, setStep] = useState<WidgetStep>('search');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [paxAdult, setPaxAdult] = useState(1);
  const [paxChild, setPaxChild] = useState(0);
  const [paxInfant, setPaxInfant] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedTrip | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<SelectedTrip | null>(null);
  const [selectedPickups, setSelectedPickups] = useState<SelectedPickupInfo[]>([]);

  const {
    data,
    loading,
    error,
    selectedOrigin,
    setSelectedOrigin,
    selectedDestination,
    setSelectedDestination,
    selectedDate,
    setSelectedDate,
    getAvailableDestinations,
    getAvailableDepartures,
    getPricing,
    createBooking,
  } = useWidgetBooking(widgetKey);

  const primaryColor = data?.theme_config?.primary_color || '#22c55e';

  if (!widgetKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Booking Link</h1>
          <p className="text-gray-500">This booking link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Booking Unavailable</h1>
          <p className="text-gray-500">{error}</p>
        </Card>
      </div>
    );
  }

  const handleSearch = () => {
    setSelectedDate(departureDate);
    setStep('select-trip');
  };

  const handleSelectOutbound = (departure: any) => {
    const route = data?.routes.find(r => r.id === departure.route_id);
    const trip = data?.trips.find(t => t.id === departure.trip_id);
    const pricing = getPricing(departure.trip_id, departure.departure_date);
    setSelectedOutbound({ departure, trip, route, pricing, direction: 'outbound' });
  };

  const handleSelectReturn = (departure: any) => {
    const route = data?.routes.find(r => r.id === departure.route_id);
    const trip = data?.trips.find(t => t.id === departure.trip_id);
    const pricing = getPricing(departure.trip_id, departure.departure_date);
    setSelectedReturn({ departure, trip, route, pricing, direction: 'return' });
  };

  const handleProceedToCart = () => {
    if (selectedOutbound) {
      setStep('cart');
    }
  };

  const getPort = (id: string) => data?.ports.find(p => p.id === id);

  // Build cart items
  const cartItems = [];
  if (selectedOutbound) {
    const origin = getPort(selectedOutbound.route?.origin_port_id);
    const dest = getPort(selectedOutbound.route?.destination_port_id);
    cartItems.push({
      id: selectedOutbound.departure.id,
      departure: selectedOutbound.departure,
      trip: selectedOutbound.trip,
      originName: origin?.name || '',
      destName: dest?.name || '',
      originPortId: selectedOutbound.route?.origin_port_id || '',
      destPortId: selectedOutbound.route?.destination_port_id || '',
      pricing: selectedOutbound.pricing,
      direction: 'outbound' as const,
    });
  }
  if (selectedReturn) {
    const origin = getPort(selectedReturn.route?.origin_port_id);
    const dest = getPort(selectedReturn.route?.destination_port_id);
    cartItems.push({
      id: selectedReturn.departure.id,
      departure: selectedReturn.departure,
      trip: selectedReturn.trip,
      originName: origin?.name || '',
      destName: dest?.name || '',
      originPortId: selectedReturn.route?.origin_port_id || '',
      destPortId: selectedReturn.route?.destination_port_id || '',
      pricing: selectedReturn.pricing,
      direction: 'return' as const,
    });
  }

  const calculateTotal = (item: typeof cartItems[0]) => 
    (paxAdult * item.pricing.adult) + (paxChild * item.pricing.child);

  const handleSubmit = async (formData: any) => {
    if (!selectedOutbound) return;
    setIsSubmitting(true);
    try {
      const result = await createBooking(
        selectedOutbound.departure.id,
        formData.customer,
        paxAdult,
        paxChild,
        promoCode,
        []
      );
      setBookingResult(result);
      setStep('finish');
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Step Indicator */}
      <WidgetStepIndicator currentStep={step} primaryColor={primaryColor} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Form */}
        {step === 'search' && (
          <WidgetSearchForm
            ports={data?.ports || []}
            availableDestinations={getAvailableDestinations()}
            selectedOrigin={selectedOrigin || ''}
            selectedDestination={selectedDestination || ''}
            departureDate={departureDate}
            returnDate={returnDate}
            tripType={tripType}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            onOriginChange={(v) => { setSelectedOrigin(v); setSelectedDestination(''); }}
            onDestinationChange={setSelectedDestination}
            onDepartureDateChange={setDepartureDate}
            onReturnDateChange={setReturnDate}
            onTripTypeChange={setTripType}
            onPaxChange={(a, c, i) => { setPaxAdult(a); setPaxChild(c); setPaxInfant(i); }}
            onSearch={handleSearch}
            primaryColor={primaryColor}
          />
        )}

        {/* Trip Results */}
        {step === 'select-trip' && (
          <>
            <WidgetSearchForm
              ports={data?.ports || []}
              availableDestinations={getAvailableDestinations()}
              selectedOrigin={selectedOrigin || ''}
              selectedDestination={selectedDestination || ''}
              departureDate={departureDate}
              returnDate={returnDate}
              tripType={tripType}
              paxAdult={paxAdult}
              paxChild={paxChild}
              paxInfant={paxInfant}
              onOriginChange={(v) => { setSelectedOrigin(v); setSelectedDestination(''); }}
              onDestinationChange={setSelectedDestination}
              onDepartureDateChange={setDepartureDate}
              onReturnDateChange={setReturnDate}
              onTripTypeChange={setTripType}
              onPaxChange={(a, c, i) => { setPaxAdult(a); setPaxChild(c); setPaxInfant(i); }}
              onSearch={handleSearch}
              primaryColor={primaryColor}
            />
            <div className="mt-6">
              <WidgetTripResults
                outboundDepartures={getAvailableDepartures()}
                trips={data?.trips || []}
                boats={data?.boats || []}
                routes={data?.routes || []}
                ports={data?.ports || []}
                selectedOrigin={selectedOrigin || ''}
                selectedDestination={selectedDestination || ''}
                departureDate={departureDate}
                tripType={tripType}
                paxAdult={paxAdult}
                paxChild={paxChild}
                paxInfant={paxInfant}
                getPricing={getPricing}
                selectedOutbound={selectedOutbound}
                selectedReturn={selectedReturn}
                onSelectOutbound={(d) => { handleSelectOutbound(d); handleProceedToCart(); }}
                onSelectReturn={handleSelectReturn}
                onBack={() => setStep('search')}
                primaryColor={primaryColor}
              />
            </div>
          </>
        )}

        {/* Shopping Cart */}
        {step === 'cart' && (
          <WidgetShoppingCart
            items={cartItems}
            boats={data?.boats || []}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            promoCode={promoCode}
            onPromoCodeChange={setPromoCode}
            onApplyPromo={() => toast.info('Promo code will be applied at checkout')}
            onRemoveItem={(id) => {
              if (selectedOutbound?.departure.id === id) setSelectedOutbound(null);
              if (selectedReturn?.departure.id === id) setSelectedReturn(null);
            }}
            onProceed={() => setStep('details')}
            onBack={() => setStep('select-trip')}
            pickupDropoffRules={data?.pickup_dropoff_rules || []}
            onPickupsChange={setSelectedPickups}
            primaryColor={primaryColor}
          />
        )}

        {/* Booking Details */}
        {step === 'details' && selectedOutbound && (
          <WidgetBookingDetails
            outbound={{
              originName: getPort(selectedOutbound.route?.origin_port_id)?.name || '',
              destName: getPort(selectedOutbound.route?.destination_port_id)?.name || '',
              date: selectedOutbound.departure.departure_date,
              time: selectedOutbound.departure.departure_time?.slice(0, 5),
              paxAdult,
              paxChild,
              paxInfant,
              price: calculateTotal(cartItems[0]),
            }}
            returnTrip={selectedReturn ? {
              originName: getPort(selectedReturn.route?.origin_port_id)?.name || '',
              destName: getPort(selectedReturn.route?.destination_port_id)?.name || '',
              date: selectedReturn.departure.departure_date,
              time: selectedReturn.departure.departure_time?.slice(0, 5),
              paxAdult,
              paxChild,
              paxInfant,
              price: calculateTotal(cartItems[1]),
            } : undefined}
            pickups={selectedPickups}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            onSubmit={handleSubmit}
            onBack={() => setStep('cart')}
            isSubmitting={isSubmitting}
            primaryColor={primaryColor}
          />
        )}

        {/* Success */}
        {step === 'finish' && bookingResult && (
          <BookingSuccess
            bookingId={bookingResult.booking_id}
            qrToken={bookingResult.qr_token}
            departure={{
              route: `${getPort(selectedOutbound?.route?.origin_port_id)?.name} → ${getPort(selectedOutbound?.route?.destination_port_id)?.name}`,
              date: selectedOutbound?.departure.departure_date || '',
              time: selectedOutbound?.departure.departure_time || '',
            }}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            totalAmount={bookingResult.total_amount}
            subtotalAmount={bookingResult.subtotal_amount}
            addonsAmount={0}
            discountAmount={0}
            addons={[]}
            customer={{ full_name: '', email: '' }}
          />
        )}
      </div>

      {/* Powered by tag */}
      <div className="fixed bottom-2 right-4">
        <span className="text-xs text-gray-400">
          By <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>SriBooking.com</a>
        </span>
      </div>
    </div>
  );
};

export default WidgetBookingNew;
