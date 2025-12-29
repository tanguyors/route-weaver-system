import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWidgetBooking, SelectedAddon } from '@/hooks/useWidgetBooking';
import { BookingStepRoute } from '@/components/widget/BookingStepRoute';
import { BookingStepDeparture } from '@/components/widget/BookingStepDeparture';
import { BookingStepPassengers } from '@/components/widget/BookingStepPassengers';
import { BookingStepAddons } from '@/components/widget/BookingStepAddons';
import { BookingStepConfirm } from '@/components/widget/BookingStepConfirm';
import { BookingSuccess } from '@/components/widget/BookingSuccess';
import WidgetBarView from '@/components/widget/WidgetBarView';
import { Card } from '@/components/ui/card';
import { Loader2, Ship, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type BookingStep = 'route' | 'departure' | 'passengers' | 'addons' | 'confirm' | 'success';
type WidgetStyle = 'block' | 'bar';

interface BookingState {
  departureId: string;
  routeId: string;
  tripId: string;
  routeName: string;
  tripName: string;
  departureDate: string;
  departureTime: string;
  paxAdult: number;
  paxChild: number;
  adultPrice: number;
  childPrice: number;
  subtotal: number;
  addonsTotal: number;
  discount: number;
  total: number;
  promoCode: string;
  selectedAddons: SelectedAddon[];
  customer: {
    full_name: string;
    phone: string;
    email: string;
    country: string;
  };
}

const WidgetBooking = () => {
  const [searchParams] = useSearchParams();
  const widgetKey = searchParams.get('key');
  const styleParam = searchParams.get('style') as WidgetStyle | null;
  const widgetStyle: WidgetStyle = styleParam === 'bar' ? 'bar' : 'block';
  
  const [barPaxAdult, setBarPaxAdult] = useState(1);
  const [barPaxChild, setBarPaxChild] = useState(0);
  
  const [step, setStep] = useState<BookingStep>('route');
  const [booking, setBooking] = useState<BookingState>({
    departureId: '',
    routeId: '',
    tripId: '',
    routeName: '',
    tripName: '',
    departureDate: '',
    departureTime: '',
    paxAdult: 1,
    paxChild: 0,
    adultPrice: 0,
    childPrice: 0,
    subtotal: 0,
    addonsTotal: 0,
    discount: 0,
    total: 0,
    promoCode: '',
    selectedAddons: [],
    customer: { full_name: '', phone: '', email: '', country: '' },
  });
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    setBooking(prev => ({
      ...prev,
      departureId: departure.id,
      routeId: departure.route_id,
      tripId: departure.trip_id,
      routeName: route?.route_name || '',
      tripName: trip?.trip_name || '',
      departureDate: departure.departure_date,
      departureTime: departure.departure_time,
      adultPrice: pricing.adult,
      childPrice: pricing.child,
    }));
    setStep('passengers');
  };

  const handlePassengersConfirm = (paxAdult: number, paxChild: number, promoCode: string) => {
    const subtotal = (paxAdult * booking.adultPrice) + (paxChild * booking.childPrice);
    setBooking(prev => ({
      ...prev,
      paxAdult,
      paxChild,
      promoCode,
      subtotal,
      total: subtotal,
    }));
    
    // Check if there are applicable add-ons
    const applicableAddons = getApplicableAddons(booking.routeId, booking.tripId);
    if (applicableAddons.length > 0) {
      setStep('addons');
    } else {
      setStep('confirm');
    }
  };

  const handleAddonsConfirm = (selectedAddons: SelectedAddon[]) => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.total, 0);
    setBooking(prev => ({
      ...prev,
      selectedAddons,
      addonsTotal,
      total: prev.subtotal + addonsTotal,
    }));
    setStep('confirm');
  };

  const handleCustomerSubmit = async (customer: typeof booking.customer) => {
    setIsSubmitting(true);
    try {
      const result = await createBooking(
        booking.departureId,
        customer,
        booking.paxAdult,
        booking.paxChild,
        booking.promoCode,
        booking.selectedAddons
      );
      
      setBookingResult(result);
      setBooking(prev => ({ ...prev, customer, total: result.total_amount }));
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
      case 'passengers':
        setStep('departure');
        break;
      case 'addons':
        setStep('passengers');
        break;
      case 'confirm':
        const applicableAddons = getApplicableAddons(booking.routeId, booking.tripId);
        if (applicableAddons.length > 0) {
          setStep('addons');
        } else {
          setStep('passengers');
        }
        break;
    }
  };

  // BAR WIDGET VIEW
  if (widgetStyle === 'bar' && step === 'route') {
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
          setSelectedDestination(''); // Reset destination when origin changes
        }}
        onDestinationChange={setSelectedDestination}
        onDateChange={setSelectedDate}
        onPaxChange={(adult, child) => {
          setBarPaxAdult(adult);
          setBarPaxChild(child);
        }}
        availableDestinations={getAvailableDestinations()}
        onSearch={handleBarSearch}
      />
    );
  }

  // Get steps for progress indicator
  const getSteps = () => {
    const applicableAddons = booking.routeId ? getApplicableAddons(booking.routeId, booking.tripId) : [];
    const baseSteps = ['route', 'departure', 'passengers'];
    if (applicableAddons.length > 0) {
      baseSteps.push('addons');
    }
    baseSteps.push('confirm');
    return baseSteps;
  };

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
        {step === 'route' && (
          <BookingStepRoute
            ports={data?.ports || []}
            selectedOrigin={selectedOrigin}
            selectedDestination={selectedDestination}
            selectedDate={selectedDate}
            onOriginChange={(origin) => {
              setSelectedOrigin(origin);
              setSelectedDestination(''); // Reset destination when origin changes
            }}
            onDestinationChange={setSelectedDestination}
            onDateChange={setSelectedDate}
            availableDestinations={getAvailableDestinations()}
            onContinue={handleRouteSelect}
          />
        )}

        {step === 'departure' && (
          <BookingStepDeparture
            departures={getAvailableDepartures()}
            trips={data?.trips || []}
            getPricing={getPricing}
            onSelect={handleDepartureSelect}
            onBack={goBack}
          />
        )}

        {step === 'passengers' && (
          <BookingStepPassengers
            adultPrice={booking.adultPrice}
            childPrice={booking.childPrice}
            maxSeats={
              (data?.departures.find(d => d.id === booking.departureId)?.capacity_total || 0) -
              (data?.departures.find(d => d.id === booking.departureId)?.capacity_reserved || 0)
            }
            onConfirm={handlePassengersConfirm}
            onBack={goBack}
          />
        )}

        {step === 'addons' && (
          <BookingStepAddons
            addons={getApplicableAddons(booking.routeId, booking.tripId)}
            paxTotal={booking.paxAdult + booking.paxChild}
            onConfirm={handleAddonsConfirm}
            onBack={goBack}
          />
        )}

        {step === 'confirm' && (
          <BookingStepConfirm
            booking={{
              ...booking,
              subtotal: booking.subtotal + booking.addonsTotal,
            }}
            isSubmitting={isSubmitting}
            onSubmit={handleCustomerSubmit}
            onBack={goBack}
          />
        )}

        {step === 'success' && bookingResult && (
          <BookingSuccess
            bookingId={bookingResult.booking_id}
            qrToken={bookingResult.qr_token}
            departure={{
              route: booking.routeName,
              date: booking.departureDate,
              time: booking.departureTime,
            }}
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
