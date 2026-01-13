import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWidgetBooking, SelectedAddon, PrivateBoat } from '@/hooks/useWidgetBooking';
import { WidgetStepIndicator, WidgetStep } from '@/components/widget/WidgetStepIndicator';
import { WidgetSearchForm, PrivateBoatSelection } from '@/components/widget/WidgetSearchForm';
import { WidgetTripResults } from '@/components/widget/WidgetTripResults';
import { WidgetShoppingCart, SelectedPickupInfo } from '@/components/widget/WidgetShoppingCart';
import { WidgetBookingDetails } from '@/components/widget/WidgetBookingDetails';
import { BookingStepPayment, PaymentMethod } from '@/components/widget/BookingStepPayment';
import { BookingSuccess } from '@/components/widget/BookingSuccess';
import { WidgetLanguageSelector } from '@/components/widget/WidgetLanguageSelector';
import { WidgetLanguageProvider } from '@/contexts/WidgetLanguageContext';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PassengerInfo {
  name: string;
  age: string;
  idNumber: string;
}

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
  
  // Customer and passengers state
  const [customerData, setCustomerData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    country: string;
  } | null>(null);
  const [passengersData, setPassengersData] = useState<PassengerInfo[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  
  // Private boat state
  const [privateBoatSelection, setPrivateBoatSelection] = useState<PrivateBoatSelection | null>(null);

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
    getReturnDepartures,
    getPricing,
    createBooking,
  } = useWidgetBooking(widgetKey);

  const primaryColor = data?.theme_config?.primary_color || '#1B5E3B';

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
    // Proceed to cart after selecting return
    setStep('cart');
  };

  const handleProceedToCart = () => {
    if (selectedOutbound) {
      setStep('cart');
    }
  };

  const getPort = (id: string) => data?.ports.find(p => p.id === id);
  const getBoat = (id: string) => data?.boats.find(b => b.id === id);
  
  // Calculate arrival time from departure time and duration
  const calculateArrivalTime = (departureTime: string, durationMinutes: number | null) => {
    if (!departureTime || !durationMinutes) return undefined;
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMins = totalMinutes % 60;
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;
  };

  // Build cart items
  const cartItems = [];
  if (selectedOutbound) {
    const origin = getPort(selectedOutbound.route?.origin_port_id);
    const dest = getPort(selectedOutbound.route?.destination_port_id);
    cartItems.push({
      id: selectedOutbound.departure.id,
      departure: selectedOutbound.departure,
      trip: selectedOutbound.trip,
      route: selectedOutbound.route,
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
      route: selectedReturn.route,
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

  // Handle details form submission - save customer/passengers and go to payment
  const handleDetailsSubmit = (formData: { 
    customer: { full_name: string; email: string; phone: string; country: string }; 
    passengers: PassengerInfo[] 
  }) => {
    setCustomerData(formData.customer);
    setPassengersData(formData.passengers);
    setStep('payment');
  };

  // Handle payment submission - create the actual booking
  const handlePaymentSubmit = async (paymentMethod: PaymentMethod) => {
    if (!selectedOutbound || !customerData) return;
    setSelectedPaymentMethod(paymentMethod);
    setIsSubmitting(true);
    try {
      const result = await createBooking(
        selectedOutbound.departure.id,
        customerData,
        paxAdult,
        paxChild,
        promoCode,
        []
      );
      setBookingResult({
        ...result,
        payment_method: paymentMethod,
        customer_name: customerData.full_name,
        customer_email: customerData.email,
      });
      setStep('finish');
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const languageSelector = <WidgetLanguageSelector primaryColor={primaryColor} />;

  return (
    <WidgetLanguageProvider>
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
            languageSelector={languageSelector}
            privateBoats={data?.private_boats || []}
            onPrivateBoatSearch={(selection) => {
              setPrivateBoatSelection(selection);
              setStep('details');
            }}
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
              languageSelector={languageSelector}
              privateBoats={data?.private_boats || []}
              onPrivateBoatSearch={(selection) => {
                setPrivateBoatSelection(selection);
                setStep('details');
              }}
            />
            <div className="mt-6">
              <WidgetTripResults
                outboundDepartures={getAvailableDepartures()}
                returnDepartures={tripType === 'round-trip' ? getReturnDepartures(returnDate) : []}
                returnDate={returnDate}
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
                onSelectOutbound={(d) => { 
                  handleSelectOutbound(d); 
                  // For one-way trips, go directly to cart
                  if (tripType === 'one-way') {
                    setStep('cart');
                  }
                  // For round-trip, wait for return selection
                }}
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
            ports={data?.ports || []}
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

        {/* Booking Details - Public Ferry */}
        {step === 'details' && selectedOutbound && !privateBoatSelection && (
          <WidgetBookingDetails
            outbound={{
              originName: getPort(selectedOutbound.route?.origin_port_id)?.name || '',
              destName: getPort(selectedOutbound.route?.destination_port_id)?.name || '',
              date: selectedOutbound.departure.departure_date,
              time: selectedOutbound.departure.departure_time?.slice(0, 5),
              arrivalTime: calculateArrivalTime(
                selectedOutbound.departure.departure_time,
                selectedOutbound.route?.duration_minutes
              ),
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
              arrivalTime: calculateArrivalTime(
                selectedReturn.departure.departure_time,
                selectedReturn.route?.duration_minutes
              ),
              paxAdult,
              paxChild,
              paxInfant,
              price: calculateTotal(cartItems[1]),
            } : undefined}
            pickups={selectedPickups}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            onSubmit={handleDetailsSubmit}
            onBack={() => setStep('cart')}
            isSubmitting={false}
            primaryColor={primaryColor}
          />
        )}

        {/* Booking Details - Private Boat */}
        {step === 'details' && privateBoatSelection && (
          <WidgetBookingDetails
            outbound={{
              originName: privateBoatSelection.route.from_port?.name || '',
              destName: privateBoatSelection.route.to_port?.name || '',
              date: privateBoatSelection.date,
              time: privateBoatSelection.time,
              paxAdult: privateBoatSelection.passengerCount,
              paxChild: 0,
              paxInfant: 0,
              price: privateBoatSelection.route.price,
            }}
            pickups={[]}
            paxAdult={privateBoatSelection.passengerCount}
            paxChild={0}
            paxInfant={0}
            onSubmit={handleDetailsSubmit}
            onBack={() => {
              setPrivateBoatSelection(null);
              setStep('search');
            }}
            isSubmitting={false}
            primaryColor={primaryColor}
            isPrivateBoat
            privateBoatName={privateBoatSelection.boat.name}
            pickupDropoffRules={data?.pickup_dropoff_rules || []}
            originPortId={privateBoatSelection.route.from_port_id}
            routeActivityAddons={privateBoatSelection.route.activity_addons || []}
          />
        )}

        {/* Payment Step */}
        {step === 'payment' && customerData && selectedOutbound && (
          <BookingStepPayment
            outbound={{
              originName: getPort(selectedOutbound.route?.origin_port_id)?.name || '',
              destName: getPort(selectedOutbound.route?.destination_port_id)?.name || '',
              date: selectedOutbound.departure.departure_date,
              time: selectedOutbound.departure.departure_time?.slice(0, 5),
            }}
            returnTrip={selectedReturn ? {
              originName: getPort(selectedReturn.route?.origin_port_id)?.name || '',
              destName: getPort(selectedReturn.route?.destination_port_id)?.name || '',
              date: selectedReturn.departure.departure_date,
              time: selectedReturn.departure.departure_time?.slice(0, 5),
            } : undefined}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            passengers={passengersData}
            customer={customerData}
            totalAmount={
              (cartItems[0] ? calculateTotal(cartItems[0]) : 0) + 
              (cartItems[1] ? calculateTotal(cartItems[1]) : 0) +
              selectedPickups.reduce((sum, p) => sum + (p.price || 0), 0)
            }
            primaryColor={primaryColor}
            isSubmitting={isSubmitting}
            onSubmit={handlePaymentSubmit}
            onBack={() => setStep('details')}
          />
        )}

        {/* Success */}
        {step === 'finish' && bookingResult && customerData && (
          <BookingSuccess
            bookingId={bookingResult.booking_id}
            qrToken={bookingResult.qr_token}
            departure={{
              route: `${getPort(selectedOutbound?.route?.origin_port_id)?.name} → ${getPort(selectedOutbound?.route?.destination_port_id)?.name}`,
              originName: getPort(selectedOutbound?.route?.origin_port_id)?.name || '',
              destName: getPort(selectedOutbound?.route?.destination_port_id)?.name || '',
              date: selectedOutbound?.departure.departure_date || '',
              time: selectedOutbound?.departure.departure_time?.slice(0, 5) || '',
              arrivalTime: calculateArrivalTime(
                selectedOutbound?.departure.departure_time,
                selectedOutbound?.route?.duration_minutes
              ),
              boatName: getBoat(selectedOutbound?.departure.boat_id)?.name,
              boatImage: getBoat(selectedOutbound?.departure.boat_id)?.image_url,
              price: cartItems[0] ? calculateTotal(cartItems[0]) : 0,
            }}
            returnTrip={selectedReturn ? {
              route: `${getPort(selectedReturn?.route?.origin_port_id)?.name} → ${getPort(selectedReturn?.route?.destination_port_id)?.name}`,
              originName: getPort(selectedReturn?.route?.origin_port_id)?.name || '',
              destName: getPort(selectedReturn?.route?.destination_port_id)?.name || '',
              date: selectedReturn?.departure.departure_date || '',
              time: selectedReturn?.departure.departure_time?.slice(0, 5) || '',
              arrivalTime: calculateArrivalTime(
                selectedReturn?.departure.departure_time,
                selectedReturn?.route?.duration_minutes
              ),
              boatName: getBoat(selectedReturn?.departure.boat_id)?.name,
              boatImage: getBoat(selectedReturn?.departure.boat_id)?.image_url,
              price: cartItems[1] ? calculateTotal(cartItems[1]) : 0,
            } : undefined}
            paxAdult={paxAdult}
            paxChild={paxChild}
            paxInfant={paxInfant}
            passengers={passengersData}
            customer={customerData}
            totalAmount={bookingResult.total_amount}
            subtotalAmount={bookingResult.subtotal_amount}
            pickups={selectedPickups.map(p => ({ name: p.cityName || '', details: p.hotelAddress || p.details || '', price: p.price || 0 }))}
            paymentMethod={selectedPaymentMethod}
            primaryColor={primaryColor}
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
    </WidgetLanguageProvider>
  );
};

export default WidgetBookingNew;
