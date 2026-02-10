import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWidgetBooking, SelectedAddon, PrivateBoat } from '@/hooks/useWidgetBooking';
import { useIframeHeightMessenger } from '@/hooks/useIframeHeightMessenger';
import { WidgetStepIndicator, WidgetStep } from '@/components/widget/WidgetStepIndicator';
import { WidgetSearchForm, PrivateBoatSelection } from '@/components/widget/WidgetSearchForm';
import { WidgetTripResults } from '@/components/widget/WidgetTripResults';
import { WidgetShoppingCart, SelectedPickupInfo } from '@/components/widget/WidgetShoppingCart';
import { WidgetBookingDetails } from '@/components/widget/WidgetBookingDetails';
import { BookingStepPayment, PaymentMethod } from '@/components/widget/BookingStepPayment';
import { BookingSuccess } from '@/components/widget/BookingSuccess';
import { WidgetLanguageSelector } from '@/components/widget/WidgetLanguageSelector';
import { WidgetLanguageProvider } from '@/contexts/WidgetLanguageContext';
import WidgetDebugPanel from '@/components/widget/WidgetDebugPanel';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Enable iframe height communication
  useIframeHeightMessenger();
  
  // Read prefill params from URL (from pre-widget redirect)
  const prefillFrom = searchParams.get('from') || '';
  const prefillTo = searchParams.get('to') || '';
  const prefillDepart = searchParams.get('depart') || '';
  const prefillReturn = searchParams.get('return') || '';
  const prefillAdults = parseInt(searchParams.get('ad') || '1', 10) || 1;
  const prefillChildren = parseInt(searchParams.get('ch') || '0', 10) || 0;
  const prefillInfants = parseInt(searchParams.get('inf') || '0', 10) || 0;
  const prefillTrip = searchParams.get('trip'); // 'round' or 'oneway'
  
  const [step, setStep] = useState<WidgetStep>('search');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(
    prefillTrip === 'round' ? 'round-trip' : 'one-way'
  );
  const [departureDate, setDepartureDate] = useState(prefillDepart);
  const [returnDate, setReturnDate] = useState(prefillReturn);
  const [paxAdult, setPaxAdult] = useState(prefillAdults);
  const [paxChild, setPaxChild] = useState(prefillChildren);
  const [paxInfant, setPaxInfant] = useState(prefillInfants);
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
  
  // Track if we've done auto-prefill
  const [hasPrefilled, setHasPrefilled] = useState(false);

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

  // Poll booking status after online payment
  const pollBookingStatus = useCallback(async (pollBookingId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      attempts++;
      try {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('id, status, total_amount')
          .eq('id', pollBookingId)
          .single();

        if (bookingData?.status === 'confirmed') {
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('id, qr_token')
            .eq('booking_id', pollBookingId)
            .single();

          setBookingResult((prev: any) => ({
            ...prev,
            booking_id: pollBookingId,
            ticket_id: ticketData?.id,
            qr_token: ticketData?.qr_token,
            total_amount: bookingData.total_amount,
          }));
          setStep('finish');
          toast.success('Payment confirmed! Your booking is ready.');
          return;
        }

        if (attempts >= maxAttempts) {
          toast.error('Payment verification timed out. Please contact support.');
          setStep('payment');
          return;
        }

        setTimeout(poll, 2000);
      } catch {
        if (attempts >= maxAttempts) {
          toast.error('Unable to verify payment. Please contact support.');
          setStep('payment');
          return;
        }
        setTimeout(poll, 2000);
      }
    };

    poll();
  }, []);

  // Handle return from payment platform (URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const returnBookingId = params.get('booking_id');

    if (paymentStatus && returnBookingId) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('payment_status');
      cleanUrl.searchParams.delete('booking_id');
      window.history.replaceState({}, '', cleanUrl.toString());

      if (paymentStatus === 'success') {
        setStep('payment-pending');
        pollBookingStatus(returnBookingId);
      } else {
        toast.error('Payment was not completed. Please select another payment method.');
        setStep('payment');
      }
    }
  }, [pollBookingStatus]);

  // Auto-prefill origin/destination from URL params after data loads
  useEffect(() => {
    if (!data || hasPrefilled) return;
    
    // Set origin if valid
    if (prefillFrom && data.ports.some(p => p.id === prefillFrom)) {
      setSelectedOrigin(prefillFrom);
    }
    
    // Set destination if valid (will be validated against available destinations)
    if (prefillTo && data.ports.some(p => p.id === prefillTo)) {
      setSelectedDestination(prefillTo);
    }
    
    // Set departure date for search
    if (prefillDepart) {
      setSelectedDate(prefillDepart);
    }
    
    // If we have complete search params, auto-search
    if (prefillFrom && prefillTo && prefillDepart) {
      // Give a tiny delay for state to propagate
      setTimeout(() => {
        setStep('select-trip');
      }, 100);
    }
    
    setHasPrefilled(true);
  }, [data, hasPrefilled, prefillFrom, prefillTo, prefillDepart, setSelectedOrigin, setSelectedDestination, setSelectedDate]);

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
      // Persist pickup selections into the booking as booking_addons (addon_id = null)
      const pickupAddons: SelectedAddon[] = selectedPickups
        .filter(p => (p.price || 0) > 0)
        .map((p) => ({
          addon_id: null,
          name: `Pickup - ${p.cityName}${p.vehicleType ? ` (${p.vehicleType})` : ''}`,
          price: p.price || 0,
          qty: 1,
          total: p.price || 0,
          pickup_info: {
            address: p.hotelAddress || p.details || undefined,
            pickup_note: p.beforeDepartureMinutes
              ? `Vehicle: ${p.vehicleType}. ${p.beforeDepartureMinutes} min before departure.`
              : `Vehicle: ${p.vehicleType}.`,
          },
        }));

      // Build redirect URLs for online payment
      const currentUrl = window.location.href.split('?')[0];
      const baseParams = new URLSearchParams(window.location.search);
      const successUrl = `${currentUrl}?${baseParams.toString()}&payment_status=success&booking_id=`;
      const failureUrl = `${currentUrl}?${baseParams.toString()}&payment_status=failed&booking_id=`;

      const result = await createBooking(
        selectedOutbound.departure.id,
        customerData,
        paxAdult,
        paxChild,
        promoCode,
        pickupAddons,
        selectedReturn?.departure?.id || null,
        paymentMethod,
        successUrl,
        failureUrl
      );

      setBookingResult({
        ...result,
        payment_method: paymentMethod,
        customer_name: customerData.full_name,
        customer_email: customerData.email,
      });

      // If online payment: open payment gateway in a popup window
      if (result.requires_payment && result.payment_redirect_url) {
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          result.payment_redirect_url,
          'sribooking_payment',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        setStep('payment-pending');
        pollBookingStatus(result.booking_id);

        if (popup) {
          const popupCheck = setInterval(() => {
            if (popup.closed) {
              clearInterval(popupCheck);
            }
          }, 1000);
        }
        return;
      }

      if (result.requires_payment && !result.payment_redirect_url) {
        toast.error('Payment gateway unavailable. Please select another payment method.');
        setStep('payment');
        return;
      }

      // For cash/bank_transfer: go directly to success
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
      <div className="min-h-screen pb-6">
        <WidgetDebugPanel />
        {/* Step Indicator */}
        <WidgetStepIndicator currentStep={step} primaryColor={primaryColor} />

      <div className="max-w-6xl mx-auto px-4 py-6 overflow-visible">
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
            pickups={selectedPickups.map(p => {
              // Calculate pickup time: departure time - before_departure_minutes - 60 (arrive 1h before)
              let pickupTime: string | undefined;
              if (p.beforeDepartureMinutes && selectedOutbound?.departure.departure_time) {
                const depTime = selectedOutbound.departure.departure_time;
                const [hours, minutes] = depTime.split(':').map(Number);
                const totalMins = hours * 60 + minutes - p.beforeDepartureMinutes - 60;
                const pickupHours = Math.floor((totalMins + 1440) % 1440 / 60);
                const pickupMins = (totalMins + 1440) % 60;
                pickupTime = `${pickupHours.toString().padStart(2, '0')}:${pickupMins.toString().padStart(2, '0')}`;
              }
              return { 
                name: p.cityName || '', 
                details: p.hotelAddress || p.details || '', 
                price: p.price || 0,
                pickupTime,
                cityName: p.cityName,
              };
            })}
            paymentMethod={selectedPaymentMethod}
            partnerName={data?.theme_config?.partner_name}
            partnerLogo={data?.theme_config?.logo_url}
            primaryColor={primaryColor}
          />
        )}
      </div>
      </div>
    </WidgetLanguageProvider>
  );
};

export default WidgetBookingNew;
