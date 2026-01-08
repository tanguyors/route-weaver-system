import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Search, MapPin, CalendarDays, Users, Loader2, Baby, Ship, Anchor, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Port {
  id: string;
  name: string;
}

interface PrivateBoatRoute {
  id: string;
  private_boat_id: string;
  from_port_id: string;
  to_port_id: string;
  price: number;
  duration_minutes: number | null;
  from_port: { id: string; name: string; area: string } | null;
  to_port: { id: string; name: string; area: string } | null;
}

interface PickupDropoffRule {
  id: string;
  from_port_id: string;
  service_type: 'pickup' | 'dropoff';
  city_name: string;
  price: number;
  car_price: number;
  bus_price: number;
  before_departure_minutes: number;
}

type VehicleType = 'car' | 'bus';

interface PrivateBoat {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  min_capacity: number;
  max_capacity: number | null;
  image_url: string | null;
  min_departure_time: string | null;
  max_departure_time: string | null;
  routes: PrivateBoatRoute[];
  pickup_dropoff_rules: PickupDropoffRule[];
}

export interface PrivateBoatBarSelection {
  boat: PrivateBoat;
  route: PrivateBoatRoute;
  date: string;
  time: string;
  passengerCount: number;
  pickup?: { rule: PickupDropoffRule; details: string; vehicleType: VehicleType };
  dropoff?: { rule: PickupDropoffRule; details: string; vehicleType: VehicleType };
}

interface BarSelectionState {
  tripType: 'one-way' | 'round-trip';
  returnDate: string | null;
  paxInfant: number;
}

interface WidgetBarViewProps {
  ports: Port[];
  selectedOrigin: string | null;
  selectedDestination: string | null;
  selectedDate: string | null;
  paxAdult: number;
  paxChild: number;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDateChange: (date: string) => void;
  onPaxChange: (adult: number, child: number) => void;
  availableDestinations: Port[];
  onSearch: () => void;
  isSearching?: boolean;
  themeConfig?: {
    primary_color?: string;
    background_color?: string;
    text_color?: string;
    button_text_color?: string;
    border_color?: string;
  };
  barSelection?: BarSelectionState;
  onBarSelectionChange?: (selection: BarSelectionState) => void;
  // Private boat props
  privateBoats?: PrivateBoat[];
  onPrivateBoatSearch?: (selection: PrivateBoatBarSelection) => void;
}

type ServiceType = 'public-ferry' | 'private-boat';

const WidgetBarView = ({
  ports,
  selectedOrigin,
  selectedDestination,
  selectedDate,
  paxAdult,
  paxChild,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onPaxChange,
  availableDestinations,
  onSearch,
  isSearching = false,
  themeConfig,
  barSelection,
  onBarSelectionChange,
  privateBoats = [],
  onPrivateBoatSearch,
}: WidgetBarViewProps) => {
  const [departureDateOpen, setDepartureDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  
  // Service type toggle
  const hasPrivateBoats = privateBoats.length > 0;
  const hasPublicFerry = ports.length > 0;
  const [serviceType, setServiceType] = useState<ServiceType>(hasPublicFerry ? 'public-ferry' : 'private-boat');
  
  // Private boat state
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [privateDate, setPrivateDate] = useState<string>('');
  const [privateDateOpen, setPrivateDateOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(8);

  const tripType = barSelection?.tripType || 'one-way';
  const returnDate = barSelection?.returnDate || null;
  const paxInfant = barSelection?.paxInfant || 0;

  const setTripType = (type: 'one-way' | 'round-trip') => {
    onBarSelectionChange?.({ tripType: type, returnDate, paxInfant });
  };
  const setReturnDate = (date: string | null) => {
    onBarSelectionChange?.({ tripType, returnDate: date, paxInfant });
  };
  const setPaxInfant = (count: number) => {
    onBarSelectionChange?.({ tripType, returnDate, paxInfant: count });
  };

  const primaryColor = themeConfig?.primary_color || '#6b21a8';
  const backgroundColor = themeConfig?.background_color || '#f8fafc';
  const textColor = themeConfig?.text_color || '#1e1b4b';
  const buttonTextColor = themeConfig?.button_text_color || '#ffffff';
  const borderColor = themeConfig?.border_color || '#e2e8f0';

  const selectedOriginPort = ports.find(p => p.id === selectedOrigin);
  const selectedDestPort = availableDestinations.find(p => p.id === selectedDestination);
  const parsedDate = selectedDate ? new Date(selectedDate) : null;
  const parsedReturnDate = returnDate ? new Date(returnDate) : null;
  const parsedPrivateDate = privateDate ? new Date(privateDate) : null;

  const canSearch = selectedOrigin && selectedDestination && selectedDate && (tripType === 'one-way' || returnDate);

  // Private boat helpers
  const selectedBoat = privateBoats.find(b => b.id === selectedBoatId);
  const selectedRoute = selectedBoat?.routes.find(r => r.id === selectedRouteId);
  
  const getAvailableFromPorts = () => {
    if (!selectedBoat) return [];
    const uniquePorts = new Map<string, { id: string; name: string; area: string }>();
    selectedBoat.routes.forEach(route => {
      if (route.from_port) {
        uniquePorts.set(route.from_port.id, route.from_port);
      }
    });
    return Array.from(uniquePorts.values());
  };

  const getTimeSlots = () => {
    if (!selectedBoat) return [];
    const minTime = selectedBoat.min_departure_time || '06:00';
    const maxTime = selectedBoat.max_departure_time || '18:00';
    const slots: string[] = [];
    const [minHour] = minTime.split(':').map(Number);
    const [maxHour] = maxTime.split(':').map(Number);
    for (let hour = minHour; hour <= maxHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < maxHour) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const canSearchPrivate = selectedBoat && selectedRoute && privateDate && selectedTime && passengerCount > 0;

  const handlePrivateSearch = () => {
    if (!selectedBoat || !selectedRoute || !onPrivateBoatSearch) return;
    onPrivateBoatSearch({
      boat: selectedBoat,
      route: selectedRoute,
      date: privateDate,
      time: selectedTime,
      passengerCount,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div 
      className="w-full p-6 rounded-2xl shadow-lg relative"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <h2 
        className="text-2xl font-bold mb-4"
        style={{ color: primaryColor }}
      >
        Book Your Trip!
      </h2>

      {/* Service Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => hasPublicFerry && setServiceType('public-ferry')}
          disabled={!hasPublicFerry}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            serviceType === 'public-ferry' 
              ? 'text-white shadow-md' 
              : !hasPublicFerry
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
          style={serviceType === 'public-ferry' ? { backgroundColor: primaryColor } : { borderColor }}
        >
          <Ship className="h-4 w-4" />
          Public Ferry
        </button>
        <button
          onClick={() => hasPrivateBoats && setServiceType('private-boat')}
          disabled={!hasPrivateBoats}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            serviceType === 'private-boat' 
              ? 'text-white shadow-md' 
              : !hasPrivateBoats
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
          style={serviceType === 'private-boat' ? { backgroundColor: '#d97706' } : { borderColor }}
        >
          <Anchor className="h-4 w-4" />
          Private Boat
        </button>
      </div>

      {/* PUBLIC FERRY VIEW */}
      {serviceType === 'public-ferry' && (
        <>
          {/* Trip Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTripType('one-way')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tripType === 'one-way' 
                  ? 'text-white shadow-md' 
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
              style={tripType === 'one-way' ? { backgroundColor: primaryColor } : { borderColor }}
            >
              One Way
            </button>
            <button
              onClick={() => setTripType('round-trip')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tripType === 'round-trip' 
                  ? 'text-white shadow-md' 
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
              style={tripType === 'round-trip' ? { backgroundColor: primaryColor } : { borderColor }}
            >
              Round Trip
            </button>
          </div>

          {/* Row 1: Departure + Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Departure Field */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                Departure
              </label>
              <Select value={selectedOrigin || ''} onValueChange={onOriginChange}>
                <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                    <SelectValue placeholder="Choose Departure">
                      {selectedOriginPort?.name || 'Choose Departure'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id}>{port.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                Departure Date
              </label>
              <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-12 bg-white rounded-lg border flex items-center gap-2 px-3 text-left" style={{ borderColor }}>
                    <CalendarDays className="w-5 h-5" style={{ color: primaryColor }} />
                    <span style={{ color: parsedDate ? textColor : '#94a3b8' }}>
                      {parsedDate ? format(parsedDate, 'd MMM yyyy') : 'Select Date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parsedDate || undefined}
                    onSelect={(date) => {
                      if (date) onDateChange(date.toISOString().split('T')[0]);
                      setDepartureDateOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                Return Date
              </label>
              <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className={`w-full h-12 bg-white rounded-lg border flex items-center gap-2 px-3 text-left ${tripType === 'one-way' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ borderColor }}
                    disabled={tripType === 'one-way'}
                  >
                    <CalendarDays className="w-5 h-5" style={{ color: primaryColor }} />
                    <span style={{ color: parsedReturnDate ? textColor : '#94a3b8' }}>
                      {parsedReturnDate ? format(parsedReturnDate, 'd MMM yyyy') : 'Select Date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parsedReturnDate || undefined}
                    onSelect={(date) => {
                      if (date) setReturnDate(date.toISOString().split('T')[0]);
                      setReturnDateOpen(false);
                    }}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      const departureMin = parsedDate || today;
                      return date < departureMin;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 2: Destination + Passengers + Search */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Destination */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>Destination</label>
                <Select value={selectedDestination || ''} onValueChange={onDestinationChange} disabled={!selectedOrigin}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                      <SelectValue placeholder="Choose Destination">{selectedDestPort?.name || 'Choose Destination'}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDestinations.map((port) => (
                      <SelectItem key={port.id} value={port.id}>{port.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adult */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>Adult</label>
                <Select value={String(paxAdult)} onValueChange={(v) => onPaxChange(Number(v), paxChild)}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" style={{ color: primaryColor }} />
                      <SelectValue>{paxAdult}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Child */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>Child</label>
                <Select value={String(paxChild)} onValueChange={(v) => onPaxChange(paxAdult, Number(v))}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: primaryColor }} />
                      <SelectValue>{paxChild}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Infants */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: primaryColor }}>Infants</label>
                <Select value={String(paxInfant)} onValueChange={(v) => setPaxInfant(Number(v))}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                    <div className="flex items-center gap-2">
                      <Baby className="w-5 h-5" style={{ color: primaryColor }} />
                      <SelectValue>{paxInfant}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="h-12 px-8 rounded-lg shadow-md font-semibold gap-2"
              style={{ backgroundColor: primaryColor, color: buttonTextColor }}
              onClick={onSearch}
              disabled={!canSearch || isSearching}
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-5 w-5" /> Search</>}
            </Button>
          </div>
        </>
      )}

      {/* PRIVATE BOAT VIEW */}
      {serviceType === 'private-boat' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Select Boat */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#d97706' }}>Select Boat</label>
              <Select value={selectedBoatId} onValueChange={(v) => {
                setSelectedBoatId(v);
                setSelectedRouteId('');
                const boat = privateBoats.find(b => b.id === v);
                if (boat) setPassengerCount(boat.min_capacity || 1);
              }}>
                <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5" style={{ color: '#d97706' }} />
                    <SelectValue placeholder="Choose Boat">
                      {selectedBoat?.name || 'Choose Boat'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {privateBoats.map((boat) => (
                    <SelectItem key={boat.id} value={boat.id}>
                      {boat.name} ({boat.min_capacity || 1}-{boat.max_capacity || boat.capacity} pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Route */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#d97706' }}>Route</label>
              <Select 
                value={selectedRouteId} 
                onValueChange={setSelectedRouteId}
                disabled={!selectedBoat}
              >
                <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" style={{ color: '#d97706' }} />
                    <SelectValue placeholder="Choose Route">
                      {selectedRoute ? `${selectedRoute.from_port?.name} → ${selectedRoute.to_port?.name}` : 'Choose Route'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {selectedBoat?.routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.from_port?.name} → {route.to_port?.name} - IDR {route.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#d97706' }}>Date</label>
              <Popover open={privateDateOpen} onOpenChange={setPrivateDateOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-12 bg-white rounded-lg border flex items-center gap-2 px-3 text-left" style={{ borderColor }}>
                    <CalendarDays className="w-5 h-5" style={{ color: '#d97706' }} />
                    <span style={{ color: parsedPrivateDate ? textColor : '#94a3b8' }}>
                      {parsedPrivateDate ? format(parsedPrivateDate, 'd MMM yyyy') : 'Select Date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parsedPrivateDate || undefined}
                    onSelect={(date) => {
                      if (date) setPrivateDate(date.toISOString().split('T')[0]);
                      setPrivateDateOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#d97706' }}>Time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedBoat}>
                <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: '#d97706' }} />
                    <SelectValue placeholder="Select Time">{selectedTime || 'Select Time'}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {getTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Passengers + Price + Search */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Passengers */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#d97706' }}>Passengers</label>
              <Select 
                value={String(passengerCount)} 
                onValueChange={(v) => setPassengerCount(Number(v))}
                disabled={!selectedBoat}
              >
                <SelectTrigger className="w-full h-12 bg-white rounded-lg border" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: '#d97706' }} />
                    <SelectValue>{passengerCount} pax</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {selectedBoat && Array.from(
                    { length: (selectedBoat.max_capacity || selectedBoat.capacity) - (selectedBoat.min_capacity || 1) + 1 },
                    (_, i) => (selectedBoat.min_capacity || 1) + i
                  ).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} pax</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Display */}
            {selectedRoute && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-sm text-amber-800">Charter Price:</span>
                <span className="font-bold text-amber-600">IDR {selectedRoute.price.toLocaleString()}</span>
              </div>
            )}

            <Button
              className="h-12 px-8 rounded-lg shadow-md font-semibold gap-2"
              style={{ backgroundColor: '#d97706', color: buttonTextColor }}
              onClick={handlePrivateSearch}
              disabled={!canSearchPrivate || isSearching}
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-5 w-5" /> Book Now</>}
            </Button>
          </div>
        </>
      )}

      {/* Powered By Tag */}
      <div className="absolute bottom-2 right-4">
        <span className="text-xs text-gray-400">
          By <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>SriBooking.com</a>
        </span>
      </div>
    </div>
  );
};

export default WidgetBarView;
