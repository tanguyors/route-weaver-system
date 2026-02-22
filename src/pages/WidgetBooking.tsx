import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWidgetBooking, SelectedAddon } from '@/hooks/useWidgetBooking';
import { useIframeHeightMessenger } from '@/hooks/useIframeHeightMessenger';
import { BookingStepRoute, PrivateBoatSelection, ServiceType } from '@/components/widget/BookingStepRoute';
import { BookingStepDeparture } from '@/components/widget/BookingStepDeparture';
import { BookingStepPassengers } from '@/components/widget/BookingStepPassengers';
import { BookingStepPickupDropoff, PickupDropoffSelection } from '@/components/widget/BookingStepPickupDropoff';
import { BookingStepConfirm } from '@/components/widget/BookingStepConfirm';
import { BookingStepPayment, PaymentMethod } from '@/components/widget/BookingStepPayment';
import { BookingSuccess } from '@/components/widget/BookingSuccess';
import WidgetBarView from '@/components/widget/WidgetBarView';
import { BookingStepPrivateConfirm } from '@/components/widget/BookingStepPrivateConfirm';
import { Card } from '@/components/ui/card';
import { Loader2, Ship, AlertCircle, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type BookingStep = 'route' | 'departure' | 'return-route' | 'return-departure' | 'passengers' | 'pickup-dropoff' | 'confirm' | 'payment' | 'payment-pending' | 'success' | 'private-confirm' | 'private-success';
type WidgetStyle = 'block' | 'bar';

interface BarSelectionState {
  tripType: 'one-way' | 'round-trip';
  returnDate: string | null;
  paxInfant: number;
}

interface TripBooking {
  departureId: string;
  routeId: string;
  tripId: string;
  routeName: string;
  tripName: string;
  departureDate: string;
  departureTime: string;
  adultPrice: number;
  childPrice: number;
}

interface BookingState {
  // Outbound trip
  outbound: TripBooking;
  // Return trip (for round-trip)
  returnTrip: TripBooking | null;
  // Passengers
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  // Pricing
  subtotal: number;
  transportTotal: number;
  discount: number;
  total: number;
  promoCode: string;
  selectedAddons: SelectedAddon[];
  pickupDropoff: PickupDropoffSelection | null;
  customer: {
    full_name: string;
    phone: string;
    email: string;
    country: string;
  };
}

const emptyTrip: TripBooking = {
  departureId: '',
  routeId: '',
  tripId: '',
  routeName: '',
  tripName: '',
  departureDate: '',
  departureTime: '',
  adultPrice: 0,
  childPrice: 0,
};

const WidgetBooking = () => {
  const [searchParams] = useSearchParams();
  const widgetKey = searchParams.get('key');
  const styleParam = searchParams.get('style') as WidgetStyle | null;
  const widgetStyle: WidgetStyle = styleParam === 'bar' ? 'bar' : 'block';
  
  // Enable iframe height communication
  useIframeHeightMessenger();
  
  const [barPaxAdult, setBarPaxAdult] = useState(1);
  const [barPaxChild, setBarPaxChild] = useState(0);
  const [barSelection, setBarSelection] = useState<BarSelectionState>({
    tripType: 'one-way',
    returnDate: null,
    paxInfant: 0,
  });
  
  // Block widget trip type state
  const [blockTripType, setBlockTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [blockReturnDate, setBlockReturnDate] = useState('');
  
  // Return trip route selection
  const [returnOrigin, setReturnOrigin] = useState('');
  const [returnDestination, setReturnDestination] = useState('');
  
  // Service type selection (Private Boat vs Public Ferry)
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [privateBoatSelection, setPrivateBoatSelection] = useState<PrivateBoatSelection | null>(null);
  
  const [step, setStep] = useState<BookingStep>('route');
  const [booking, setBooking] = useState<BookingState>({
    outbound: { ...emptyTrip },
    returnTrip: null,
    paxAdult: 1,
    paxChild: 0,
    paxInfant: 0,
    subtotal: 0,
    transportTotal: 0,
    discount: 0,
    total: 0,
    promoCode: '',
    selectedAddons: [],
    pickupDropoff: null,
    customer: { full_name: '', phone: '', email: '', country: '' },
  });
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const paymentPopupRef = useRef<Window | null>(null);

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
    getApplicableAddons,
    getPricing,
    createBooking,
  } = useWidgetBooking(widgetKey);

  // Handle return from payment platform (check URL params) - must be before early returns
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
  }, []);

  const pollBookingStatus = async (pollBookingId: string) => {
    let attempts = 0;
    const maxAttempts = 150; // 150 x 2s = 5 minutes timeout

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

          setBookingResult({
            booking_id: pollBookingId,
            ticket_id: ticketData?.id,
            qr_token: ticketData?.qr_token,
            total_amount: bookingData.total_amount,
            subtotal_amount: booking.subtotal,
            addons_amount: booking.transportTotal,
            discount_amount: 0,
            addons: booking.selectedAddons,
          });
          setStep('success');
          toast.success('Payment confirmed! Your booking is ready.');
          return;
        }

        if (attempts >= maxAttempts) {
          if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
            paymentPopupRef.current.close();
            paymentPopupRef.current = null;
          }
          toast.error('Payment verification timed out. Please contact support.');
          setStep('payment');
          return;
        }

        setTimeout(poll, 2000);
      } catch (err) {
        if (attempts >= maxAttempts) {
          if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
            paymentPopupRef.current.close();
            paymentPopupRef.current = null;
          }
          toast.error('Unable to verify payment. Please contact support.');
          setStep('payment');
          return;
        }
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Get current trip type based on widget style
  const currentTripType = widgetStyle === 'bar' ? barSelection.tripType : blockTripType;
  const currentReturnDate = widgetStyle === 'bar' ? barSelection.returnDate : blockReturnDate;
  const currentPaxInfant = widgetStyle === 'bar' ? barSelection.paxInfant : booking.paxInfant;

  // Get available destinations for return trip (from the arrival port of outbound)
  const getReturnAvailableDestinations = () => {
    if (!data || !returnOrigin) return [];
    const routeDestinations = data.routes
      .filter(r => r.origin_port_id === returnOrigin)
      .map(r => r.destination_port_id);
    return data.ports.filter(p => routeDestinations.includes(p.id));
  };

  // Get return departures (from returnOrigin to returnDestination)
  const getReturnDepartures = () => {
    if (!data || !returnOrigin || !returnDestination || !currentReturnDate) return [];
    
    // Find routes from return origin to return destination
    const returnRoutes = data.routes.filter(
      r => r.origin_port_id === returnOrigin && r.destination_port_id === returnDestination
    );
    const routeIds = returnRoutes.map(r => r.id);
    
    // Filter departures for return date
    return data.departures.filter(d => {
      const matchesRoute = routeIds.includes(d.route_id);
      const matchesDate = d.departure_date >= currentReturnDate;
      return matchesRoute && matchesDate;
    });
  };

  // Invalid widget key
  if (!widgetKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Booking Link</h1>
          <p className="text-muted-foreground">
            This booking link is invalid or has expired. Please contact the operator for a valid link.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading booking options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Booking Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  const handleRouteSelect = () => {
    if (selectedOrigin && selectedDestination) {
      // For bar widget, pre-fill pax from bar selection
      if (widgetStyle === 'bar') {
        setBooking(prev => ({
          ...prev,
          paxAdult: barPaxAdult,
          paxChild: barPaxChild,
          paxInfant: barSelection.paxInfant,
        }));
      }
      setStep('departure');
    }
  };

  const handleBarSearch = () => {
    if (selectedOrigin && selectedDestination && selectedDate) {
      handleRouteSelect();
    }
  };

  const handleDepartureSelect = (departure: any) => {
    const route = data?.routes.find(r => r.id === departure.route_id);
    const trip = data?.trips.find(t => t.id === departure.trip_id);
    const pricing = getPricing(departure.trip_id, departure.departure_date);
    
    const tripBooking: TripBooking = {
      departureId: departure.id,
      routeId: departure.route_id,
      tripId: departure.trip_id,
      routeName: route?.route_name || '',
      tripName: trip?.trip_name || '',
      departureDate: departure.departure_date,
      departureTime: departure.departure_time,
      adultPrice: pricing.adult,
      childPrice: pricing.child,
    };

    setBooking(prev => ({
      ...prev,
      outbound: tripBooking,
    }));
    
    // If round-trip, go to return route selection (choose destination for return)
    if (currentTripType === 'round-trip' && currentReturnDate) {
      // Set the return origin to the outbound destination
      setReturnOrigin(selectedDestination);
      setReturnDestination(''); // Reset return destination so user can choose
      setStep('return-route');
    } else {
      setStep('passengers');
    }
  };

  const handleReturnDepartureSelect = (departure: any) => {
    const route = data?.routes.find(r => r.id === departure.route_id);
    const trip = data?.trips.find(t => t.id === departure.trip_id);
    const pricing = getPricing(departure.trip_id, departure.departure_date);
    
    const returnTripBooking: TripBooking = {
      departureId: departure.id,
      routeId: departure.route_id,
      tripId: departure.trip_id,
      routeName: route?.route_name || '',
      tripName: trip?.trip_name || '',
      departureDate: departure.departure_date,
      departureTime: departure.departure_time,
      adultPrice: pricing.adult,
      childPrice: pricing.child,
    };

    setBooking(prev => ({
      ...prev,
      returnTrip: returnTripBooking,
    }));
    setStep('passengers');
  };

  const handlePassengersConfirm = (paxAdult: number, paxChild: number, paxInfant: number, promoCode: string) => {
    // Calculate subtotal including return trip if applicable
    let subtotal = (paxAdult * booking.outbound.adultPrice) + (paxChild * booking.outbound.childPrice);
    
    if (booking.returnTrip) {
      subtotal += (paxAdult * booking.returnTrip.adultPrice) + (paxChild * booking.returnTrip.childPrice);
    }

    setBooking(prev => ({
      ...prev,
      paxAdult,
      paxChild,
      paxInfant,
      promoCode,
      subtotal,
      total: subtotal,
    }));
    
    // Go to pickup/dropoff step
    setStep('pickup-dropoff');
  };

  const handlePickupDropoffConfirm = (selection: PickupDropoffSelection) => {
    setBooking(prev => ({
      ...prev,
      pickupDropoff: selection,
      transportTotal: selection.total,
      total: prev.subtotal + selection.total,
    }));
    setStep('confirm');
  };

  const handleCustomerSubmit = async (customer: typeof booking.customer) => {
    // Save customer info and move to payment step
    setBooking(prev => ({ ...prev, customer }));
    setStep('payment');
  };

  const handlePaymentSubmit = async (paymentMethod: PaymentMethod) => {
    console.log('[WidgetBooking] handlePaymentSubmit called with:', paymentMethod);
    setIsSubmitting(true);
    try {
      const transportAddons: SelectedAddon[] = [];

      if (booking.pickupDropoff?.pickup) {
        const p = booking.pickupDropoff.pickup;
        const price = p.vehicleType === 'bus' ? p.rule.bus_price : p.rule.car_price;
        transportAddons.push({
          addon_id: null,
          name: `Pickup - ${p.rule.city_name} (${p.vehicleType})`,
          price,
          qty: 1,
          total: price,
          pickup_info: {
            address: p.details || undefined,
            pickup_note: `${p.rule.before_departure_minutes} min before departure.`,
          },
        });
      }

      if (booking.pickupDropoff?.dropoff) {
        const d = booking.pickupDropoff.dropoff;
        const price = d.vehicleType === 'bus' ? d.rule.bus_price : d.rule.car_price;
        transportAddons.push({
          addon_id: null,
          name: `Dropoff - ${d.rule.city_name} (${d.vehicleType})`,
          price,
          qty: 1,
          total: price,
          pickup_info: {
            address: d.details || undefined,
            pickup_note: `${d.rule.before_departure_minutes} min after arrival.`,
          },
        });
      }

      // Build short redirect URLs (DOKU has 255 char limit)
      const currentUrl = window.location.href.split('?')[0];
      const widgetKey = new URLSearchParams(window.location.search).get('key') || '';
      const successUrl = `${currentUrl}?key=${widgetKey}&payment_status=success&booking_id=`;
      const failureUrl = `${currentUrl}?key=${widgetKey}&payment_status=failed&booking_id=`;

      const result = await createBooking(
        booking.outbound.departureId,
        booking.customer,
        booking.paxAdult,
        booking.paxChild,
        booking.promoCode,
        [...(booking.selectedAddons || []), ...transportAddons],
        booking.returnTrip?.departureId || null,
        paymentMethod,
        successUrl,
        failureUrl
      );

      setBookingResult(result);
      setBooking(prev => ({ ...prev, total: result.total_amount }));

      // If online payment: redirect within the iframe (popups are blocked on mobile in cross-origin iframes)
      if (result.requires_payment && result.payment_redirect_url) {
        window.location.href = result.payment_redirect_url;
        return;
      }

      if (result.requires_payment && !result.payment_redirect_url) {
        // Payment creation failed - go back to payment selection
        toast.error('Payment gateway unavailable. Please select another payment method.');
        setStep('payment');
        return;
      }

      // For cash/bank_transfer: go directly to success
      setStep('success');
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'departure':
        setStep('route');
        break;
      case 'return-route':
        setStep('departure');
        break;
      case 'return-departure':
        setStep('return-route');
        break;
      case 'passengers':
        if (currentTripType === 'round-trip' && booking.returnTrip) {
          setStep('return-departure');
        } else {
          setStep('departure');
        }
        break;
      case 'pickup-dropoff':
        setStep('passengers');
        break;
      case 'confirm':
        setStep('pickup-dropoff');
        break;
      case 'payment':
        setStep('confirm');
        break;
    }
  };

  const originPort = data?.ports.find(p => p.id === selectedOrigin);
  const destPort = data?.ports.find(p => p.id === selectedDestination);
  const returnOriginPort = data?.ports.find(p => p.id === returnOrigin);
  const returnDestPort = data?.ports.find(p => p.id === returnDestination);

  // Get steps for progress indicator
  const getSteps = () => {
    const baseSteps: BookingStep[] = ['route', 'departure'];
    if (currentTripType === 'round-trip') {
      baseSteps.push('return-route');
      baseSteps.push('return-departure');
    }
    baseSteps.push('passengers');
    baseSteps.push('pickup-dropoff');
    baseSteps.push('confirm');
    baseSteps.push('payment');
    return baseSteps;
  };

  // Handle return route selection
  const handleReturnRouteSelect = () => {
    if (returnOrigin && returnDestination) {
      setStep('return-departure');
    }
  };

  // BAR WIDGET VIEW
  if (widgetStyle === 'bar') {
    // Initial search state
    if (step === 'route') {
      return (
        <WidgetBarView
          ports={data?.ports || []}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          selectedDate={selectedDate}
          paxAdult={barPaxAdult}
          paxChild={barPaxChild}
          onOriginChange={(origin) => {
            setSelectedOrigin(origin);
            setSelectedDestination('');
          }}
          onDestinationChange={setSelectedDestination}
          onDateChange={setSelectedDate}
          onPaxChange={(adult, child) => {
            setBarPaxAdult(adult);
            setBarPaxChild(child);
          }}
          availableDestinations={getAvailableDestinations()}
          onSearch={handleBarSearch}
          onBarSelectionChange={setBarSelection}
          barSelection={barSelection}
          privateBoats={data?.private_boats || []}
          onPrivateBoatSearch={(selection) => {
            setPrivateBoatSelection(selection);
            setServiceType('private-boat');
            setStep('private-confirm');
          }}
        />
      );
    }

    // After search - show summary header + step content
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Summary Header */}
        <div className="bg-white shadow-md p-4 border-b">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('route')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Modify Search
              </Button>
              
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-800">Outbound:</span>
                  <span>{originPort?.name} → {destPort?.name}</span>
                </div>
                {barSelection.tripType === 'round-trip' && returnDestination && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-800">Return:</span>
                    <span>{returnOriginPort?.name} → {returnDestPort?.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-800">Date:</span>
                  <span>{selectedDate}</span>
                </div>
                {barSelection.tripType === 'round-trip' && barSelection.returnDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-800">Return Date:</span>
                    <span>{barSelection.returnDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-800">Passengers:</span>
                  <span>
                    {barPaxAdult} Adult{barPaxAdult > 1 ? 's' : ''}
                    {barPaxChild > 0 && `, ${barPaxChild} Child${barPaxChild > 1 ? 'ren' : ''}`}
                    {barSelection.paxInfant > 0 && `, ${barSelection.paxInfant} Infant${barSelection.paxInfant > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4">
          <div className="max-w-lg mx-auto">
            {/* Progress indicator */}
            {step !== 'success' && (
              <div className="flex justify-center gap-2 mb-6">
                {getSteps().map((s, i) => (
                  <div
                    key={s}
                    className={`h-2 w-12 rounded-full transition-colors ${
                      getSteps().indexOf(step) >= i
                        ? 'bg-purple-600'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}

            {step === 'private-confirm' && privateBoatSelection && (
              <BookingStepPrivateConfirm
                selection={privateBoatSelection}
                isSubmitting={isSubmitting}
                onSubmit={async (customer) => {
                  toast.success('Private boat booking submitted! We will contact you shortly.');
                  setStep('route');
                }}
                onBack={() => setStep('route')}
              />
            )}

            {step === 'departure' && (
              <BookingStepDeparture
                departures={getAvailableDepartures()}
                trips={data?.trips || []}
                boats={data?.boats || []}
                getPricing={getPricing}
                onSelect={handleDepartureSelect}
                onBack={goBack}
              />
            )}

            {step === 'return-route' && (
              <Card className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-4 text-purple-700">
                  <ArrowLeftRight className="h-5 w-5" />
                  <span className="font-semibold">Select Return Destination</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  From: <span className="font-medium">{returnOriginPort?.name}</span>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Where do you want to return to?</label>
                    <select
                      value={returnDestination}
                      onChange={(e) => setReturnDestination(e.target.value)}
                      className="w-full p-3 border rounded-lg bg-background"
                    >
                      <option value="">Select destination</option>
                      {getReturnAvailableDestinations().map((port) => (
                        <option key={port.id} value={port.id}>
                          {port.name} ({port.area})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={goBack} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={handleReturnRouteSelect} 
                      disabled={!returnDestination}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {step === 'return-departure' && (
              <Card className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-4 text-purple-700">
                  <ArrowLeftRight className="h-5 w-5" />
                  <span className="font-semibold">Select Return Trip</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {returnOriginPort?.name} → {returnDestPort?.name}
                </p>
                <BookingStepDeparture
                  departures={getReturnDepartures()}
                  trips={data?.trips || []}
                  boats={data?.boats || []}
                  getPricing={getPricing}
                  onSelect={handleReturnDepartureSelect}
                  onBack={goBack}
                />
              </Card>
            )}

            {step === 'passengers' && (
              <BookingStepPassengers
                adultPrice={booking.outbound.adultPrice + (booking.returnTrip?.adultPrice || 0)}
                childPrice={booking.outbound.childPrice + (booking.returnTrip?.childPrice || 0)}
                maxSeats={
                  (data?.departures.find(d => d.id === booking.outbound.departureId)?.capacity_total || 0) -
                  (data?.departures.find(d => d.id === booking.outbound.departureId)?.capacity_reserved || 0)
                }
                initialAdult={barPaxAdult}
                initialChild={barPaxChild}
                initialInfant={barSelection.paxInfant}
                onConfirm={handlePassengersConfirm}
                onBack={goBack}
              />
            )}

            {step === 'pickup-dropoff' && (
              <BookingStepPickupDropoff
                pickupRules={data?.pickup_dropoff_rules || []}
                dropoffRules={data?.pickup_dropoff_rules || []}
                originPortId={selectedOrigin}
                destinationPortId={selectedDestination}
                onConfirm={handlePickupDropoffConfirm}
                onBack={goBack}
              />
            )}

            {step === 'confirm' && (
              <BookingStepConfirm
                booking={{
                  departureId: booking.outbound.departureId,
                  routeName: booking.outbound.routeName,
                  tripName: booking.outbound.tripName,
                  departureDate: booking.outbound.departureDate,
                  departureTime: booking.outbound.departureTime,
                  paxAdult: booking.paxAdult,
                  paxChild: booking.paxChild,
                  paxInfant: booking.paxInfant,
                  adultPrice: booking.outbound.adultPrice,
                  childPrice: booking.outbound.childPrice,
                  subtotal: booking.subtotal + booking.transportTotal,
                  promoCode: booking.promoCode,
                  returnTrip: booking.returnTrip,
                }}
                isSubmitting={isSubmitting}
                onSubmit={handleCustomerSubmit}
                onBack={goBack}
              />
            )}

            {step === 'payment' && (
              <BookingStepPayment
                outbound={{
                  originName: originPort?.name || '',
                  destName: destPort?.name || '',
                  date: booking.outbound.departureDate,
                  time: booking.outbound.departureTime,
                }}
                returnTrip={booking.returnTrip ? {
                  originName: destPort?.name || '',
                  destName: originPort?.name || '',
                  date: booking.returnTrip.departureDate,
                  time: booking.returnTrip.departureTime,
                } : undefined}
                paxAdult={booking.paxAdult}
                paxChild={booking.paxChild}
                paxInfant={booking.paxInfant}
                passengers={[]}
                customer={booking.customer}
                totalAmount={booking.total}
                isSubmitting={isSubmitting}
                onSubmit={handlePaymentSubmit}
                onBack={goBack}
              />
            )}

            {step === 'payment-pending' && (
              <Card className="p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment. This may take a few moments.
                </p>
              </Card>
            )}

            {step === 'success' && bookingResult && (
              <BookingSuccess
                bookingId={bookingResult.booking_id}
                qrToken={bookingResult.qr_token}
                departure={{
                  route: booking.outbound.routeName,
                  date: booking.outbound.departureDate,
                  time: booking.outbound.departureTime,
                }}
                returnTrip={booking.returnTrip ? {
                  route: booking.returnTrip.routeName,
                  date: booking.returnTrip.departureDate,
                  time: booking.returnTrip.departureTime,
                } : undefined}
                paxAdult={booking.paxAdult}
                paxChild={booking.paxChild}
                paxInfant={booking.paxInfant}
                totalAmount={bookingResult.total_amount}
                subtotalAmount={bookingResult.subtotal_amount}
                addonsAmount={bookingResult.addons_amount}
                discountAmount={bookingResult.discount_amount}
                addons={bookingResult.addons}
                customer={booking.customer}
              />
            )}
          </div>
        </div>

        {/* Powered By Tag */}
        <div className="fixed bottom-2 right-4">
          <span className="text-xs text-gray-400">
            By <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-600">SriBooking.com</a>
          </span>
        </div>
      </div>
    );
  }

  // BLOCK WIDGET VIEW (default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Ship className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Your Trip</h1>
          </div>
          
          {/* Progress indicator */}
          {step !== 'success' && (
            <div className="flex justify-center gap-2 mt-4">
              {getSteps().map((s, i) => (
                <div
                  key={s}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    getSteps().indexOf(step) >= i
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        {step === 'private-confirm' && privateBoatSelection && (
          <BookingStepPrivateConfirm
            selection={privateBoatSelection}
            isSubmitting={isSubmitting}
            onSubmit={async (customer) => {
              toast.success('Private boat booking submitted! We will contact you shortly.');
              setStep('route');
            }}
            onBack={() => setStep('route')}
          />
        )}

        {step === 'route' && (
          <BookingStepRoute
            ports={data?.ports || []}
            selectedOrigin={selectedOrigin}
            selectedDestination={selectedDestination}
            selectedDate={selectedDate}
            onOriginChange={(origin) => {
              setSelectedOrigin(origin);
              setSelectedDestination('');
            }}
            onDestinationChange={setSelectedDestination}
            onDateChange={setSelectedDate}
            availableDestinations={getAvailableDestinations()}
            onContinue={handleRouteSelect}
            tripType={blockTripType}
            returnDate={blockReturnDate}
            onTripTypeChange={setBlockTripType}
            onReturnDateChange={setBlockReturnDate}
            privateBoats={data?.private_boats || []}
            onPrivateBoatContinue={(selection) => {
              setPrivateBoatSelection(selection);
              setStep('private-confirm');
            }}
          />
        )}

        {step === 'departure' && (
          <BookingStepDeparture
            departures={getAvailableDepartures()}
            trips={data?.trips || []}
            boats={data?.boats || []}
            getPricing={getPricing}
            onSelect={handleDepartureSelect}
            onBack={goBack}
          />
        )}

        {step === 'return-route' && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <ArrowLeftRight className="h-5 w-5" />
              <span className="font-semibold">Select Return Destination</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              From: <span className="font-medium">{returnOriginPort?.name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Where do you want to return to?</label>
                <select
                  value={returnDestination}
                  onChange={(e) => setReturnDestination(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background"
                >
                  <option value="">Select destination</option>
                  {getReturnAvailableDestinations().map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name} ({port.area})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleReturnRouteSelect} 
                  disabled={!returnDestination}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 'return-departure' && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <ArrowLeftRight className="h-5 w-5" />
              <span className="font-semibold">Select Return Trip</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {returnOriginPort?.name} → {returnDestPort?.name}
            </p>
            <BookingStepDeparture
              departures={getReturnDepartures()}
              trips={data?.trips || []}
              boats={data?.boats || []}
              getPricing={getPricing}
              onSelect={handleReturnDepartureSelect}
              onBack={goBack}
            />
          </Card>
        )}

        {step === 'passengers' && (
          <BookingStepPassengers
            adultPrice={booking.outbound.adultPrice + (booking.returnTrip?.adultPrice || 0)}
            childPrice={booking.outbound.childPrice + (booking.returnTrip?.childPrice || 0)}
            maxSeats={
              (data?.departures.find(d => d.id === booking.outbound.departureId)?.capacity_total || 0) -
              (data?.departures.find(d => d.id === booking.outbound.departureId)?.capacity_reserved || 0)
            }
            onConfirm={handlePassengersConfirm}
            onBack={goBack}
          />
        )}

        {step === 'pickup-dropoff' && (
          <BookingStepPickupDropoff
            pickupRules={data?.pickup_dropoff_rules || []}
            dropoffRules={data?.pickup_dropoff_rules || []}
            originPortId={selectedOrigin}
            destinationPortId={selectedDestination}
            onConfirm={handlePickupDropoffConfirm}
            onBack={goBack}
          />
        )}

        {step === 'confirm' && (
          <BookingStepConfirm
            booking={{
              departureId: booking.outbound.departureId,
              routeName: booking.outbound.routeName,
              tripName: booking.outbound.tripName,
              departureDate: booking.outbound.departureDate,
              departureTime: booking.outbound.departureTime,
              paxAdult: booking.paxAdult,
              paxChild: booking.paxChild,
              paxInfant: booking.paxInfant,
              adultPrice: booking.outbound.adultPrice,
              childPrice: booking.outbound.childPrice,
              subtotal: booking.subtotal + booking.transportTotal,
              promoCode: booking.promoCode,
              returnTrip: booking.returnTrip,
            }}
            isSubmitting={isSubmitting}
            onSubmit={handleCustomerSubmit}
            onBack={goBack}
          />
        )}

        {step === 'payment' && (
          <BookingStepPayment
            outbound={{
              originName: originPort?.name || '',
              destName: destPort?.name || '',
              date: booking.outbound.departureDate,
              time: booking.outbound.departureTime,
            }}
            returnTrip={booking.returnTrip ? {
              originName: destPort?.name || '',
              destName: originPort?.name || '',
              date: booking.returnTrip.departureDate,
              time: booking.returnTrip.departureTime,
            } : undefined}
            paxAdult={booking.paxAdult}
            paxChild={booking.paxChild}
            paxInfant={booking.paxInfant}
            passengers={[]}
            customer={booking.customer}
            totalAmount={booking.total}
            isSubmitting={isSubmitting}
            onSubmit={handlePaymentSubmit}
            onBack={goBack}
          />
        )}

        {step === 'payment-pending' && (
          <Card className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment. This may take a few moments.
            </p>
          </Card>
        )}

        {step === 'success' && bookingResult && (
          <BookingSuccess
            bookingId={bookingResult.booking_id}
            qrToken={bookingResult.qr_token}
            departure={{
              route: booking.outbound.routeName,
              date: booking.outbound.departureDate,
              time: booking.outbound.departureTime,
            }}
            returnTrip={booking.returnTrip ? {
              route: booking.returnTrip.routeName,
              date: booking.returnTrip.departureDate,
              time: booking.returnTrip.departureTime,
            } : undefined}
            paxAdult={booking.paxAdult}
            paxChild={booking.paxChild}
            paxInfant={booking.paxInfant}
            totalAmount={bookingResult.total_amount}
            subtotalAmount={bookingResult.subtotal_amount}
            addonsAmount={bookingResult.addons_amount}
            discountAmount={bookingResult.discount_amount}
            addons={bookingResult.addons}
            customer={booking.customer}
          />
        )}
      </div>
    </div>
  );
};

export default WidgetBooking;
