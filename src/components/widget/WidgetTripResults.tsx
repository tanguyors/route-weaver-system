import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Ship, Info, ChevronDown, ChevronUp, Users, icons } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BoatInfoModal } from './BoatInfoModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWidgetCurrency } from '@/contexts/WidgetLanguageContext';
import type { BoatFacility } from '@/hooks/useWidgetBooking';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Boat {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  image_url: string | null;
  images?: string[] | null;
  boat_facilities?: BoatFacility[];
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
  const isMobile = useIsMobile();
  const [outboundExpanded, setOutboundExpanded] = useState(true);
  const { formatPrice } = useWidgetCurrency();

  const getBoat = (boatId: string | null) => {
    if (!boatId) return null;
    return boats.find(b => b.id === boatId);
  };

  const getRoute = (routeId: string) => routes.find(r => r.id === routeId);
  const getTrip = (tripId: string) => trips.find(t => t.id === tripId);
  const getPort = (portId: string) => ports.find(p => p.id === portId);

  const originPort = getPort(selectedOrigin);
  const destPort = getPort(selectedDestination);

  // Helper to render facility icon dynamically
  const renderFacilityIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const pascalName = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const IconComponent = (icons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
  };

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

  // Handle outbound selection - on mobile, collapse outbound section
  const handleSelectOutbound = (departure: Departure) => {
    onSelectOutbound(departure);
    if (isMobile && tripType === 'round-trip') {
      setOutboundExpanded(false);
    }
  };

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
      e.preventDefault();
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
          "bg-white rounded-lg border-2 p-3 sm:p-4 transition-all",
          isSelected ? "border-green-500 shadow-md" : "border-gray-200 hover:border-gray-300"
        )}
      >
        {/* Mobile Layout */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Boat Image & Name */}
          <div className="flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 sm:w-40 flex-shrink-0">
            <div className="w-20 h-16 sm:w-full sm:h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {boat?.image_url ? (
                <img 
                  src={boat.image_url} 
                  alt={boat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Ship className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 sm:flex-none">
              {/* Boat Name */}
              <p className="text-sm font-medium text-gray-700 sm:mt-2 sm:text-center truncate">
                {boat?.name || 'Boat'}
              </p>
              {/* Available Places Badge - Desktop */}
              <div className="hidden sm:flex justify-center mt-2">
                <Badge 
                  variant={available <= 5 ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5"
                >
                  <Users className="h-2.5 w-2.5 mr-1" />
                  {available} left
                </Badge>
              </div>
              
              {/* Facilities - Desktop */}
              {boat?.boat_facilities && boat.boat_facilities.length > 0 && (
                <TooltipProvider>
                  <div className="hidden sm:flex flex-wrap justify-center gap-1 mt-2">
                    {boat.boat_facilities.slice(0, 4).map((bf) => (
                      <Tooltip key={bf.facility_id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "flex items-center justify-center w-5 h-5 rounded border",
                              bf.is_free 
                                ? "bg-green-50 border-green-200 text-green-600" 
                                : "bg-amber-50 border-amber-200 text-amber-600"
                            )}
                          >
                            {renderFacilityIcon(bf.facility?.icon ?? null)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p>{bf.facility?.name}{bf.is_free ? ' (Free)' : ' (Paid)'}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {boat.boat_facilities.length > 4 && (
                      <div className="flex items-center justify-center w-5 h-5 rounded border bg-gray-50 border-gray-200 text-gray-500 text-[10px] font-medium">
                        +{boat.boat_facilities.length - 4}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              )}
              
              {/* Boat Info Button - visible only on desktop */}
              {boat && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenBoatInfo}
                  className="hidden sm:flex w-full mt-2 text-xs"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Boat Info
                </Button>
              )}
            </div>
          </div>

          {/* Trip Info */}
          <div className="flex-1 min-w-0">
            {/* Trip Name */}
            <h3 
              className="font-bold text-base sm:text-lg mb-2"
              style={{ color: primaryColor }}
            >
              {trip?.trip_name || 'Trip'}
            </h3>

            {/* Times and Route - Responsive */}
            <div className="flex items-center gap-2 sm:gap-8 mb-2">
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-bold">
                  {departure.departure_time.slice(0, 5)}
                </div>
                <div style={{ color: primaryColor }} className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">
                  {origin?.name}
                </div>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-300 relative min-w-[30px]">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <div className="text-center sm:text-right">
                <div className="text-lg sm:text-xl font-bold">
                  {arrivalTime}
                </div>
                <div style={{ color: primaryColor }} className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">
                  {dest?.name}
                </div>
              </div>
            </div>

            {/* Price and Passengers - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs sm:text-sm text-gray-500">
                Adult X {paxAdult}, Child X {paxChild}, Infants X {paxInfant}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                <span 
                  className="text-base sm:text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(totalPrice)}
                </span>
                <Button
                  onClick={onSelect}
                  className="text-white font-semibold px-3 sm:px-6 text-sm sm:text-base"
                  style={{ backgroundColor: isSelected ? '#22c55e' : primaryColor }}
                  size={isMobile ? "sm" : "default"}
                >
                  {isSelected ? '✓' : 'SELECT'}
                </Button>
              </div>
            </div>

            {/* Mobile: Boat Info button */}
            {/* Mobile: Available Places, Facilities & Boat Info */}
            {isMobile && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  {/* Available Places */}
                  <Badge 
                    variant={available <= 5 ? "destructive" : "secondary"}
                    className="text-[10px] px-1.5"
                  >
                    <Users className="h-2.5 w-2.5 mr-1" />
                    {available} left
                  </Badge>
                  
                  {/* Facilities */}
                  {boat?.boat_facilities && boat.boat_facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {boat.boat_facilities.slice(0, 3).map((bf) => (
                        <div 
                          key={bf.facility_id}
                          className={cn(
                            "flex items-center justify-center w-5 h-5 rounded border",
                            bf.is_free 
                              ? "bg-green-50 border-green-200 text-green-600" 
                              : "bg-amber-50 border-amber-200 text-amber-600"
                          )}
                          title={`${bf.facility?.name}${bf.is_free ? ' (Free)' : ' (Paid)'}`}
                        >
                          {renderFacilityIcon(bf.facility?.icon ?? null)}
                        </div>
                      ))}
                      {boat.boat_facilities.length > 3 && (
                        <div className="flex items-center justify-center w-5 h-5 rounded border bg-gray-50 border-gray-200 text-gray-500 text-[10px] font-medium">
                          +{boat.boat_facilities.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Boat Info Button */}
                  {boat && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenBoatInfo}
                      className="text-xs h-6 px-2"
                      style={{ color: primaryColor }}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Info
                    </Button>
                  )}
                </div>
              </div>
            )}
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
    <div className="mb-6 sm:mb-8">
      {/* Date Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div 
          className="w-0 h-0 border-t-[16px] sm:border-t-[20px] border-r-[12px] sm:border-r-[15px] border-t-transparent border-r-transparent"
          style={{ borderTopColor: primaryColor, borderRightColor: primaryColor }}
        />
        <div className="flex items-center gap-2" style={{ color: primaryColor }}>
          <CalendarDays className="w-4 h-4" />
          <span className="font-medium text-sm sm:text-base">
            {format(new Date(date), 'EEE, dd MMM yyyy')}
          </span>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-3 sm:space-y-4">
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

  // Selected outbound summary for mobile collapsed view
  const SelectedOutboundSummary = () => {
    if (!selectedOutbound) return null;
    const trip = getTrip(selectedOutbound.departure.trip_id);
    const route = getRoute(selectedOutbound.departure.route_id);
    const origin = route ? getPort(route.origin_port_id) : null;
    const dest = route ? getPort(route.destination_port_id) : null;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-green-800 text-sm truncate">{trip?.trip_name}</div>
          <div className="text-xs text-green-600">
            {origin?.name} → {dest?.name} • {selectedOutbound.departure.departure_time.slice(0, 5)}
          </div>
        </div>
        <div className="text-green-600 text-sm font-bold">✓ Selected</div>
      </div>
    );
  };

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      {/* Results Grid for Round Trip */}
      {tripType === 'round-trip' ? (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Outbound Column */}
          <div>
            {isMobile && selectedOutbound ? (
              <Collapsible open={outboundExpanded} onOpenChange={setOutboundExpanded}>
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left mb-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                        Outbound: {originPort?.name} → {destPort?.name}
                      </h2>
                      {outboundExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                
                {!outboundExpanded && <SelectedOutboundSummary />}
                
                <CollapsibleContent>
                  {Object.keys(outboundByDate).length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center text-gray-500">
                      <Ship className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm sm:text-base">No departures available</p>
                    </div>
                  ) : (
                    Object.entries(outboundByDate).map(([date, deps]) => (
                      <DateSection
                        key={date}
                        date={date}
                        departures={deps}
                        direction="outbound"
                        selectedDeparture={selectedOutbound}
                        onSelect={handleSelectOutbound}
                      />
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Outbound: {originPort?.name} → {destPort?.name}
                </h2>
                {Object.keys(outboundByDate).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center text-gray-500">
                    <Ship className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm sm:text-base">No departures available</p>
                  </div>
                ) : (
                  Object.entries(outboundByDate).map(([date, deps]) => (
                    <DateSection
                      key={date}
                      date={date}
                      departures={deps}
                      direction="outbound"
                      selectedDeparture={selectedOutbound}
                      onSelect={handleSelectOutbound}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Return Column */}
          <div>
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              Return: {destPort?.name} → {originPort?.name}
            </h2>
            {Object.keys(returnByDate).length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center text-gray-500">
                <Ship className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No return departures available</p>
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
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center text-gray-500">
              <Ship className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No departures available for this route</p>
              <p className="text-xs sm:text-sm mt-1">Try selecting a different date</p>
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
        <div className="text-xs sm:text-sm text-gray-500">
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
