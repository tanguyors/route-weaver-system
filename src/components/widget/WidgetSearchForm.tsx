import { useState } from 'react';
import { MapPin, CalendarDays, Users, Baby, Search, Ship, Anchor, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWidgetLanguage } from '@/contexts/WidgetLanguageContext';

interface Port {
  id: string;
  name: string;
  area?: string;
}

interface RouteActivityAddon {
  id: string;
  route_id: string;
  activity_addon_id: string;
  pricing_type: 'included' | 'normal';
  activity_addon: {
    id: string;
    name: string;
    description: string | null;
    price: number;
  };
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
  activity_addons?: RouteActivityAddon[];
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

export type ServiceType = 'public-ferry' | 'private-boat';

export interface PrivateBoatSelection {
  boat: PrivateBoat;
  route: PrivateBoatRoute;
  date: string;
  time: string;
  passengerCount: number;
  pickup?: { rule: PickupDropoffRule; details: string; vehicleType: 'car' | 'bus' };
  dropoff?: { rule: PickupDropoffRule; details: string; vehicleType: 'car' | 'bus' };
}

interface WidgetSearchFormProps {
  ports: Port[];
  availableDestinations: Port[];
  selectedOrigin: string;
  selectedDestination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDepartureDateChange: (date: string) => void;
  onReturnDateChange: (date: string) => void;
  onTripTypeChange: (type: 'one-way' | 'round-trip') => void;
  onPaxChange: (adult: number, child: number, infant: number) => void;
  onSearch: () => void;
  isLoading?: boolean;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
  languageSelector?: React.ReactNode;
  // Private boat props
  privateBoats?: PrivateBoat[];
  onPrivateBoatSearch?: (selection: PrivateBoatSelection) => void;
}

export const WidgetSearchForm = ({
  ports,
  availableDestinations,
  selectedOrigin,
  selectedDestination,
  departureDate,
  returnDate,
  tripType,
  paxAdult,
  paxChild,
  paxInfant,
  onOriginChange,
  onDestinationChange,
  onDepartureDateChange,
  onReturnDateChange,
  onTripTypeChange,
  onPaxChange,
  onSearch,
  isLoading = false,
  primaryColor = '#1B5E3B',
  logoUrl,
  tagline,
  languageSelector,
  privateBoats = [],
  onPrivateBoatSearch,
}: WidgetSearchFormProps) => {
  const { t } = useWidgetLanguage();
  const [departureDateOpen, setDepartureDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  
  // Service type toggle
  const hasPrivateBoats = privateBoats.length > 0;
  const hasPublicFerry = ports.length > 0;
  const [serviceType, setServiceType] = useState<ServiceType>('public-ferry');
  
  // Private boat state
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [selectedFromPortId, setSelectedFromPortId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [privateDate, setPrivateDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [privateDateOpen, setPrivateDateOpen] = useState(false);

  const parsedDepartureDate = departureDate ? new Date(departureDate) : null;
  const parsedReturnDate = returnDate ? new Date(returnDate) : null;
  const parsedPrivateDate = privateDate ? new Date(privateDate) : null;

  const selectedBoat = privateBoats.find(b => b.id === selectedBoatId);
  const selectedRoute = selectedBoat?.routes.find(r => r.id === selectedRouteId);

  // Get available from ports from selected boat's routes
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

  const availableRoutes = selectedBoat?.routes.filter(r => r.from_port_id === selectedFromPortId) || [];

  // Generate time slots
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

  const canSearch = selectedOrigin && selectedDestination && departureDate && 
    (tripType === 'one-way' || returnDate);
  
  const canSearchPrivate = selectedBoat && selectedRoute && privateDate && selectedTime && passengerCount > 0;

  const handlePrivateSearch = () => {
    if (!selectedBoat || !selectedRoute || !onPrivateBoatSearch) return;
    
    const selection: PrivateBoatSelection = {
      boat: selectedBoat,
      route: selectedRoute,
      date: privateDate,
      time: selectedTime,
      passengerCount,
    };
    onPrivateBoatSearch(selection);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Field wrapper component
  const FieldWrapper = ({ 
    label, 
    icon: Icon, 
    children,
    className
  }: { 
    label: string; 
    icon: any; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("relative", className)}>
      <div className="border rounded-lg bg-white hover:border-gray-400 transition-colors">
        <div className="flex items-start gap-3 p-3">
          <Icon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with optional banner */}
      <div 
        className="py-3 sm:py-4 px-4 sm:px-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="shrink-0">▸ {t('bookTickets')}</span>
            {tagline && (
              <span className="italic text-white/90 font-normal text-sm sm:text-base">{tagline}</span>
            )}
          </h2>
          {languageSelector}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Service Type Toggle - Show only if both options available */}
        {hasPrivateBoats && (
          <div className="flex gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg mb-4 sm:mb-6">
            <button
              onClick={() => hasPublicFerry && setServiceType('public-ferry')}
              disabled={!hasPublicFerry}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all",
                serviceType === 'public-ferry'
                  ? "bg-white shadow-sm"
                  : !hasPublicFerry
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700"
              )}
              style={serviceType === 'public-ferry' ? { color: primaryColor } : {}}
            >
              <Ship className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('sharedBoat')}</span>
            </button>
            <button
              onClick={() => setServiceType('private-boat')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all",
                serviceType === 'private-boat'
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Anchor className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('privateBoat')}</span>
            </button>
          </div>
        )}

        {/* PUBLIC FERRY FIELDS */}
        {serviceType === 'public-ferry' && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => onTripTypeChange('one-way')}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all border",
                  tripType === 'one-way' 
                    ? "text-gray-700 bg-gray-100 border-gray-300" 
                    : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                {t('oneWay')}
              </button>
              <button
                onClick={() => onTripTypeChange('round-trip')}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                  tripType === 'round-trip' 
                    ? "text-white shadow-md" 
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
                )}
                style={tripType === 'round-trip' ? { backgroundColor: primaryColor } : {}}
              >
                {t('roundTrip')}
              </button>
              <span className="hidden sm:flex text-sm text-gray-500 items-center gap-1">
                <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs">i</span>
                {t('selectVoyage')}
              </span>
            </div>

            {/* Row 1: From, To, Dates */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
              {/* From */}
              <FieldWrapper label={t('from')} icon={MapPin}>
                <select
                  value={selectedOrigin}
                  onChange={(e) => onOriginChange(e.target.value)}
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="">{t('selectOrigin')}</option>
                  {ports.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name} {port.area ? `(${port.area})` : ''}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              {/* To */}
              <FieldWrapper label={t('to')} icon={MapPin}>
                <select
                  value={selectedDestination}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  disabled={!selectedOrigin}
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none disabled:text-gray-400"
                >
                  <option value="">{t('selectDestination')}</option>
                  {availableDestinations.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name} {port.area ? `(${port.area})` : ''}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              {/* Depart Date */}
              <FieldWrapper label={t('departureDate')} icon={CalendarDays}>
                <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full text-left text-gray-900 font-medium focus:outline-none">
                      {parsedDepartureDate ? format(parsedDepartureDate, 'd MMM yyyy') : t('selectDate')}
                    </button>
                  </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parsedDepartureDate || undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Use local date format to avoid timezone issues
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          onDepartureDateChange(`${year}-${month}-${day}`);
                        }
                        setDepartureDateOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </FieldWrapper>

              {/* Return Date */}
              <FieldWrapper label={t('returnDate')} icon={CalendarDays}>
                <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      className={cn(
                        "w-full text-left font-medium focus:outline-none",
                        tripType === 'one-way' ? "text-gray-400 cursor-not-allowed" : "text-gray-900"
                      )}
                      disabled={tripType === 'one-way'}
                    >
                      {parsedReturnDate ? format(parsedReturnDate, 'd MMM yyyy') : t('selectDate')}
                    </button>
                  </PopoverTrigger>
                  {tripType === 'round-trip' && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parsedReturnDate || undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Use local date format to avoid timezone issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            onReturnDateChange(`${year}-${month}-${day}`);
                          }
                          setReturnDateOpen(false);
                        }}
                        disabled={(date) => {
                          const minDate = parsedDepartureDate || new Date(new Date().setHours(0, 0, 0, 0));
                          return date < minDate;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </FieldWrapper>
            </div>

            {/* Row 2: Passengers */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {/* Adult */}
              <FieldWrapper label={t('adultAge')} icon={Users}>
                <select
                  value={paxAdult}
                  onChange={(e) => onPaxChange(Number(e.target.value), paxChild, paxInfant)}
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none text-sm sm:text-base"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FieldWrapper>

              {/* Child */}
              <FieldWrapper label={t('child')} icon={Users}>
                <select
                  value={paxChild}
                  onChange={(e) => onPaxChange(paxAdult, Number(e.target.value), paxInfant)}
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none text-sm sm:text-base"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FieldWrapper>

              {/* Infants */}
              <FieldWrapper label={t('infantAge')} icon={Baby}>
                <select
                  value={paxInfant}
                  onChange={(e) => onPaxChange(paxAdult, paxChild, Number(e.target.value))}
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none text-sm sm:text-base"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FieldWrapper>

              {/* Search Button - Full width on mobile when 3-col grid */}
              <button
                onClick={onSearch}
                disabled={!canSearch || isLoading}
                className="col-span-3 md:col-span-1 h-full min-h-[50px] sm:min-h-[60px] rounded-lg text-white font-semibold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#374151' }}
              >
                {isLoading ? t('loading') : t('searchTrips')}
              </button>
            </div>
          </>
        )}

        {/* PRIVATE BOAT FIELDS */}
        {serviceType === 'private-boat' && (
          <div className="space-y-4">
            {/* Boat Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">{t('selectBoat')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {privateBoats.map(boat => (
                  <button
                    key={boat.id}
                    onClick={() => {
                      setSelectedBoatId(boat.id);
                      setSelectedFromPortId('');
                      setSelectedRouteId('');
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      selectedBoatId === boat.id
                        ? "border-amber-600 bg-amber-50"
                        : "border-gray-200 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {boat.image_url ? (
                        <img src={boat.image_url} alt={boat.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Anchor className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">{boat.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {boat.min_capacity || 1}-{boat.max_capacity || boat.capacity} pax
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedBoat && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldWrapper label={t('from')} icon={MapPin}>
                    <select
                      value={selectedFromPortId}
                      onChange={(e) => {
                        setSelectedFromPortId(e.target.value);
                        setSelectedRouteId('');
                      }}
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="">{t('selectOrigin')}</option>
                      {getAvailableFromPorts().map(port => (
                        <option key={port.id} value={port.id}>
                          {port.name} {port.area && `(${port.area})`}
                        </option>
                      ))}
                    </select>
                  </FieldWrapper>

                  <FieldWrapper label={t('to')} icon={MapPin}>
                    <select
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      disabled={!selectedFromPortId}
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none disabled:text-gray-400"
                    >
                      <option value="">{t('selectDestination')}</option>
                      {availableRoutes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.to_port?.name} - {formatPrice(route.price)}
                        </option>
                      ))}
                    </select>
                  </FieldWrapper>
                </div>

                {/* Date, Time, Passengers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldWrapper label="Date" icon={CalendarDays}>
                    <Popover open={privateDateOpen} onOpenChange={setPrivateDateOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-full text-left text-gray-900 font-medium focus:outline-none">
                          {parsedPrivateDate ? format(parsedPrivateDate, 'd MMM yyyy') : 'Select date'}
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
                  </FieldWrapper>

                  <FieldWrapper label="Time" icon={Clock}>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="">Select time</option>
                      {getTimeSlots().map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </FieldWrapper>

                  <FieldWrapper label="Passengers" icon={Users}>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Number(e.target.value))}
                      className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
                    >
                      {Array.from({ length: (selectedBoat.max_capacity || selectedBoat.capacity) - (selectedBoat.min_capacity || 1) + 1 }, (_, i) => i + (selectedBoat.min_capacity || 1)).map(n => (
                        <option key={n} value={n}>{n} pax</option>
                      ))}
                    </select>
                  </FieldWrapper>
                </div>

                {/* Price Summary & Search */}
                {selectedRoute && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <p className="text-sm text-gray-600">Charter Price</p>
                      <p className="text-2xl font-bold text-amber-700">{formatPrice(selectedRoute.price)}</p>
                    </div>
                    <button
                      onClick={handlePrivateSearch}
                      disabled={!canSearchPrivate || isLoading}
                      className="px-8 py-3 rounded-lg text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 bg-amber-600"
                    >
                      {isLoading ? 'Loading...' : 'Book Now'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
