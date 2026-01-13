import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Ship, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BoatInfoModal } from './BoatInfoModal';

interface Boat {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  image_url: string | null;
  images?: string[] | null;
}

interface Departure {
  id: string;
  trip_id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  status: string;
  boat_id: string | null;
}

interface Trip {
  id: string;
  route_id: string;
  trip_name: string;
  description: string | null;
}

interface Port {
  id: string;
  name: string;
}

interface Route {
  id: string;
  origin_port_id: string;
  destination_port_id: string;
  duration_minutes: number | null;
}

interface SelectedTrip {
  departure: Departure;
  trip: Trip | undefined;
  route: Route | undefined;
  pricing: { adult: number; child: number };
  direction: 'outbound' | 'return';
}

interface WidgetTripResultsProps {
  outboundDepartures: Departure[];
  returnDepartures?: Departure[];
  trips: Trip[];
  boats: Boat[];
  routes: Route[];
  ports: Port[];
  selectedOrigin: string;
  selectedDestination: string;
  departureDate: string;
  returnDate?: string;
  tripType: 'one-way' | 'round-trip';
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  getPricing: (tripId: string, date: string) => { adult: number; child: number };
  selectedOutbound: SelectedTrip | null;
  selectedReturn: SelectedTrip | null;
  onSelectOutbound: (departure: Departure) => void;
  onSelectReturn: (departure: Departure) => void;
  onBack: () => void;
  primaryColor?: string;
}

export const WidgetTripResults = ({
  outboundDepartures,
  returnDepartures = [],
  trips,
  boats,
  routes,
  ports,
  selectedOrigin,
  selectedDestination,
  departureDate,
  returnDate,
  tripType,
  paxAdult,
  paxChild,
  paxInfant,
  getPricing,
  selectedOutbound,
  selectedReturn,
  onSelectOutbound,
  onSelectReturn,
  onBack,
  primaryColor = '#1B5E3B',
}: WidgetTripResultsProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getBoat = (boatId: string | null) => {
    if (!boatId) return null;
    return boats.find(b => b.id === boatId);
  };

  const getRoute = (routeId: string) => routes.find(r => r.id === routeId);
  const getTrip = (tripId: string) => trips.find(t => t.id === tripId);
  const getPort = (portId: string) => ports.find(p => p.id === portId);

  const originPort = getPort(selectedOrigin);
  const destPort = getPort(selectedDestination);

  // Group departures by date
  const groupByDate = (departures: Departure[]) => {
    return departures.reduce((acc, dep) => {
      if (!acc[dep.departure_date]) {
        acc[dep.departure_date] = [];
      }
      acc[dep.departure_date].push(dep);
      return acc;
    }, {} as Record<string, Departure[]>);
  };

  // Calculate arrival time based on departure time and duration
  const calculateArrivalTime = (departureTime: string, durationMinutes: number | null): string => {
    if (!durationMinutes) return '--:--';
    
    const [hours, minutes] = departureTime.slice(0, 5).split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(hours, minutes, 0, 0);
    
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);
    const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
    const arrivalMinutes = arrivalDate.getMinutes().toString().padStart(2, '0');
    
    return `${arrivalHours}:${arrivalMinutes}`;
  };

  const [boatInfoModal, setBoatInfoModal] = useState<{
    open: boolean;
    boat: Boat | null;
    trip: Trip | undefined;
    route: Route | undefined;
    departure: Departure | null;
    pricing: { adult: number; child: number };
    onSelect: () => void;
  } | null>(null);

  const TripCard = ({ 
    departure, 
    isSelected,
    onSelect,
    direction
  }: { 
    departure: Departure; 
    isSelected: boolean;
    onSelect: () => void;
    direction: 'outbound' | 'return';
  }) => {
    const trip = getTrip(departure.trip_id);
    const route = getRoute(departure.route_id);
    const boat = getBoat(departure.boat_id);
    const pricing = getPricing(departure.trip_id, departure.departure_date);
    const available = departure.capacity_total - departure.capacity_reserved;
    
    const origin = route ? getPort(route.origin_port_id) : null;
    const dest = route ? getPort(route.destination_port_id) : null;

    // Calculate arrival time from departure time + route duration
    const arrivalTime = calculateArrivalTime(departure.departure_time, route?.duration_minutes ?? null);

    // Calculate total price
    const totalPrice = (paxAdult * pricing.adult) + (paxChild * pricing.child);

    const handleOpenBoatInfo = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (boat) {
        setBoatInfoModal({
          open: true,
          boat,
          trip,
          route,
          departure,
          pricing,
          onSelect,
        });
      }
    };

    return (
      <div 
        className={cn(
          "bg-white rounded-lg border-2 p-4 transition-all",
          isSelected ? "border-green-500 shadow-md" : "border-gray-200 hover:border-gray-300"
        )}
      >
        <div className="flex gap-4">
          {/* Boat Image & Name */}
          <div className="w-40 flex-shrink-0">
            <div className="h-28 rounded-lg overflow-hidden bg-gray-100">
              {boat?.image_url ? (
                <img 
                  src={boat.image_url} 
                  alt={boat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Ship className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            {/* Boat Name */}
            <p className="text-center text-sm font-medium text-gray-700 mt-2 truncate">
              {boat?.name || 'Boat'}
            </p>
            {/* Boat Info Button */}
            {boat && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBoatInfo}
                className="w-full mt-2 text-xs"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Info className="h-3 w-3 mr-1" />
                Boat Info
              </Button>
            )}
          </div>

          {/* Trip Info */}
          <div className="flex-1 min-w-0">
            {/* Trip Name */}
            <h3 
              className="font-bold text-lg mb-2"
              style={{ color: primaryColor }}
            >
              {trip?.trip_name || 'Trip'}
            </h3>

            {/* Times and Route */}
            <div className="flex items-center gap-8 mb-2">
              <div>
                <div className="text-xl font-bold">
                  {departure.departure_time.slice(0, 5)}
                </div>
                <div style={{ color: primaryColor }} className="text-sm font-medium">
                  {origin?.name}
                </div>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {arrivalTime}
                </div>
                <div style={{ color: primaryColor }} className="text-sm font-medium">
                  {dest?.name}
                </div>
              </div>
            </div>

            {/* Price and Passengers */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Adult X {paxAdult}, Child X {paxChild}, Infants X {paxInfant}
              </div>
              <div className="flex items-center gap-4">
                <span 
                  className="text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(totalPrice)}
                </span>
                <Button
                  onClick={onSelect}
                  className="text-white font-semibold px-6"
                  style={{ backgroundColor: isSelected ? '#22c55e' : primaryColor }}
                >
                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DateSection = ({ 
    date, 
    departures, 
    direction,
    selectedDeparture,
    onSelect
  }: { 
    date: string; 
    departures: Departure[];
    direction: 'outbound' | 'return';
    selectedDeparture: SelectedTrip | null;
    onSelect: (dep: Departure) => void;
  }) => (
    <div className="mb-8">
      {/* Date Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-0 h-0 border-t-[20px] border-r-[15px] border-t-transparent border-r-transparent"
          style={{ borderTopColor: primaryColor, borderRightColor: primaryColor }}
        />
        <div className="flex items-center gap-2" style={{ color: primaryColor }}>
          <CalendarDays className="w-4 h-4" />
          <span className="font-medium">
            {format(new Date(date), 'EEE, dd MMM yyyy')}
          </span>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {departures.map(dep => (
          <TripCard
            key={dep.id}
            departure={dep}
            isSelected={selectedDeparture?.departure.id === dep.id}
            onSelect={() => onSelect(dep)}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );

  const outboundByDate = groupByDate(outboundDepartures);
  const returnByDate = tripType === 'round-trip' ? groupByDate(returnDepartures) : {};

  return (
    <>
    <div className="space-y-6">
      {/* Results Grid for Round Trip */}
      {tripType === 'round-trip' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outbound Column */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
              Outbound: {originPort?.name} → {destPort?.name}
            </h2>
            {Object.keys(outboundByDate).length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No departures available</p>
              </div>
            ) : (
              Object.entries(outboundByDate).map(([date, deps]) => (
                <DateSection
                  key={date}
                  date={date}
                  departures={deps}
                  direction="outbound"
                  selectedDeparture={selectedOutbound}
                  onSelect={onSelectOutbound}
                />
              ))
            )}
          </div>

          {/* Return Column */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              Return: {destPort?.name} → {originPort?.name}
            </h2>
            {Object.keys(returnByDate).length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No return departures available</p>
              </div>
            ) : (
              Object.entries(returnByDate).map(([date, deps]) => (
                <DateSection
                  key={date}
                  date={date}
                  departures={deps}
                  direction="return"
                  selectedDeparture={selectedReturn}
                  onSelect={onSelectReturn}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* One-Way: Single Column */
        <div>
          {Object.keys(outboundByDate).length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No departures available for this route</p>
              <p className="text-sm mt-1">Try selecting a different date</p>
            </div>
          ) : (
            Object.entries(outboundByDate).map(([date, deps]) => (
              <DateSection
                key={date}
                date={date}
                departures={deps}
                direction="outbound"
                selectedDeparture={selectedOutbound}
                onSelect={onSelectOutbound}
              />
            ))
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-500">
          🏠 Home | Booking
        </div>
      </div>
    </div>

    {/* Boat Info Modal */}
    {boatInfoModal && (
      <BoatInfoModal
        open={boatInfoModal.open}
        onClose={() => setBoatInfoModal(null)}
        onSelectTrip={boatInfoModal.onSelect}
        boat={boatInfoModal.boat}
        trip={boatInfoModal.trip}
        route={boatInfoModal.route}
        originPort={boatInfoModal.route ? getPort(boatInfoModal.route.origin_port_id) : null}
        destPort={boatInfoModal.route ? getPort(boatInfoModal.route.destination_port_id) : null}
        departureTime={boatInfoModal.departure?.departure_time}
        departureDate={boatInfoModal.departure?.departure_date}
        pricing={boatInfoModal.pricing}
        paxAdult={paxAdult}
        paxChild={paxChild}
        primaryColor={primaryColor}
      />
    )}
    </>
  );
};
