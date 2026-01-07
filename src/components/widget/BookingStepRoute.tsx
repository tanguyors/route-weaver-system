import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, ArrowRight, Edit, ArrowLeftRight, ArrowRightCircle, Anchor, Ship, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Port {
  id: string;
  name: string;
  area: string;
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
  private_boat_id: string;
  from_port_id: string;
  service_type: 'pickup' | 'dropoff';
  city_name: string;
  price: number;
  before_departure_minutes: number;
}

interface PrivateBoat {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
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
  pickup?: { rule: PickupDropoffRule; details: string };
  dropoff?: { rule: PickupDropoffRule; details: string };
}

interface BookingStepRouteProps {
  ports: Port[];
  selectedOrigin: string;
  selectedDestination: string;
  selectedDate: string;
  onOriginChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  onDateChange: (date: string) => void;
  availableDestinations: Port[];
  onContinue: () => void;
  // Round trip props
  tripType?: 'one-way' | 'round-trip';
  returnDate?: string;
  onTripTypeChange?: (type: 'one-way' | 'round-trip') => void;
  onReturnDateChange?: (date: string) => void;
  // Private boat props
  privateBoats?: PrivateBoat[];
  onPrivateBoatContinue?: (selection: PrivateBoatSelection) => void;
}

export const BookingStepRoute = ({
  ports,
  selectedOrigin,
  selectedDestination,
  selectedDate,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  availableDestinations,
  onContinue,
  tripType = 'one-way',
  returnDate = '',
  onTripTypeChange,
  onReturnDateChange,
  privateBoats = [],
  onPrivateBoatContinue,
}: BookingStepRouteProps) => {
  const navigate = useNavigate();
  
  // Service type toggle
  const hasPrivateBoats = privateBoats.length > 0;
  const hasPublicFerry = ports.length > 0;
  const [serviceType, setServiceType] = useState<ServiceType>(hasPublicFerry ? 'public-ferry' : 'private-boat');
  
  // Private boat state
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [selectedFromPortId, setSelectedFromPortId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [privateDate, setPrivateDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [selectedPickupId, setSelectedPickupId] = useState<string>('');
  const [pickupDetails, setPickupDetails] = useState<string>('');
  const [selectedDropoffId, setSelectedDropoffId] = useState<string>('');
  const [dropoffDetails, setDropoffDetails] = useState<string>('');

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
  const availablePickups = selectedBoat?.pickup_dropoff_rules.filter(
    r => r.from_port_id === selectedFromPortId && r.service_type === 'pickup'
  ) || [];
  const availableDropoffs = selectedRoute 
    ? selectedBoat?.pickup_dropoff_rules.filter(
        r => r.from_port_id === selectedRoute.to_port_id && r.service_type === 'dropoff'
      ) || []
    : [];

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

  const calculatePrivateTotal = () => {
    if (!selectedRoute) return 0;
    let total = selectedRoute.price;
    if (selectedPickupId) {
      const pickup = availablePickups.find(p => p.id === selectedPickupId);
      if (pickup) total += pickup.price;
    }
    if (selectedDropoffId) {
      const dropoff = availableDropoffs.find(d => d.id === selectedDropoffId);
      if (dropoff) total += dropoff.price;
    }
    return total;
  };

  const canContinuePublic = selectedOrigin && selectedDestination && selectedDate && 
    (tripType === 'one-way' || (tripType === 'round-trip' && returnDate));
  
  const canContinuePrivate = selectedBoat && selectedRoute && privateDate && selectedTime && passengerCount > 0;

  const minDate = new Date().toISOString().split('T')[0];

  const handlePrivateContinue = () => {
    if (!selectedBoat || !selectedRoute || !onPrivateBoatContinue) return;
    
    const selection: PrivateBoatSelection = {
      boat: selectedBoat,
      route: selectedRoute,
      date: privateDate,
      time: selectedTime,
      passengerCount,
    };

    if (selectedPickupId) {
      const pickupRule = availablePickups.find(p => p.id === selectedPickupId);
      if (pickupRule) selection.pickup = { rule: pickupRule, details: pickupDetails };
    }
    if (selectedDropoffId) {
      const dropoffRule = availableDropoffs.find(d => d.id === selectedDropoffId);
      if (dropoffRule) selection.dropoff = { rule: dropoffRule, details: dropoffDetails };
    }

    onPrivateBoatContinue(selection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Book Your Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Type Toggle - Only show if both options available */}
        {hasPrivateBoats && hasPublicFerry && (
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setServiceType('public-ferry')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                serviceType === 'public-ferry'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Ship className="h-4 w-4" />
              Public Fast Ferry
            </button>
            <button
              onClick={() => setServiceType('private-boat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                serviceType === 'private-boat'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Anchor className="h-4 w-4" />
              Private Boat
            </button>
          </div>
        )}

        {/* PUBLIC FERRY FIELDS */}
        {serviceType === 'public-ferry' && (
          <>
            {/* Trip Type Toggle */}
            {onTripTypeChange && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => onTripTypeChange('one-way')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    tripType === 'one-way'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowRightCircle className="h-4 w-4" />
                  One Way
                </button>
                <button
                  onClick={() => onTripTypeChange('round-trip')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    tripType === 'round-trip'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Round Trip
                </button>
              </div>
            )}

            <div>
              <Label htmlFor="origin">From</Label>
              <Select value={selectedOrigin} onValueChange={onOriginChange}>
                <SelectTrigger id="origin" className="mt-1">
                  <SelectValue placeholder="Select departure port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(port => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destination">To</Label>
              <Select 
                value={selectedDestination} 
                onValueChange={onDestinationChange}
                disabled={!selectedOrigin}
              >
                <SelectTrigger id="destination" className="mt-1">
                  <SelectValue placeholder={selectedOrigin ? "Select destination" : "Select origin first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map(port => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name} {port.area && `(${port.area})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={tripType === 'round-trip' ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {tripType === 'round-trip' ? 'Departure Date' : 'Travel Date'}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  min={minDate}
                  className="mt-1"
                />
              </div>

              {tripType === 'round-trip' && onReturnDateChange && (
                <div>
                  <Label htmlFor="returnDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Return Date
                  </Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={returnDate}
                    onChange={(e) => onReturnDateChange(e.target.value)}
                    min={selectedDate || minDate}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={onContinue}
              disabled={!canContinuePublic}
            >
              Find Departures
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}

        {/* PRIVATE BOAT FIELDS */}
        {serviceType === 'private-boat' && (
          <>
            {/* Select Boat */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Your Boat</Label>
              <div className="grid gap-2">
                {privateBoats.map(boat => (
                  <button
                    key={boat.id}
                    onClick={() => {
                      setSelectedBoatId(boat.id);
                      setSelectedFromPortId('');
                      setSelectedRouteId('');
                      setSelectedPickupId('');
                      setSelectedDropoffId('');
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedBoatId === boat.id
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-muted hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {boat.image_url ? (
                        <img src={boat.image_url} alt={boat.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Anchor className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">{boat.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> Up to {boat.capacity} pax
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedBoat && (
              <>
                <div>
                  <Label>From Port</Label>
                  <Select value={selectedFromPortId} onValueChange={(v) => {
                    setSelectedFromPortId(v);
                    setSelectedRouteId('');
                    setSelectedPickupId('');
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select departure port" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFromPorts().map(port => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name} {port.area && `(${port.area})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFromPortId && (
                  <div>
                    <Label>Destination</Label>
                    <Select value={selectedRouteId} onValueChange={(v) => {
                      setSelectedRouteId(v);
                      setSelectedDropoffId('');
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoutes.map(route => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.to_port?.name} - IDR {route.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {selectedRoute && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date
                    </Label>
                    <Input
                      type="date"
                      value={privateDate}
                      onChange={(e) => setPrivateDate(e.target.value)}
                      min={minDate}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Time
                    </Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimeSlots().map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Passengers
                  </Label>
                  <Select value={passengerCount.toString()} onValueChange={(v) => setPassengerCount(Number(v))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedBoat?.capacity || 10 }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} pax</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pickup Option */}
                {availablePickups.length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <Label className="text-sm font-medium">Pickup (Optional)</Label>
                    <Select value={selectedPickupId} onValueChange={setSelectedPickupId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No pickup needed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No pickup</SelectItem>
                        {availablePickups.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.city_name} +IDR {p.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPickupId && (
                      <Input
                        className="mt-2"
                        placeholder="Hotel / pickup address"
                        value={pickupDetails}
                        onChange={(e) => setPickupDetails(e.target.value)}
                      />
                    )}
                  </div>
                )}

                {/* Dropoff Option */}
                {availableDropoffs.length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <Label className="text-sm font-medium">Dropoff (Optional)</Label>
                    <Select value={selectedDropoffId} onValueChange={setSelectedDropoffId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No dropoff needed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No dropoff</SelectItem>
                        {availableDropoffs.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.city_name} +IDR {d.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDropoffId && (
                      <Input
                        className="mt-2"
                        placeholder="Hotel / dropoff address"
                        value={dropoffDetails}
                        onChange={(e) => setDropoffDetails(e.target.value)}
                      />
                    )}
                  </div>
                )}

                {/* Price Summary */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span className="text-amber-600">IDR {calculatePrivateTotal().toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">*Price for entire boat charter</p>
                </div>

                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700" 
                  size="lg"
                  onClick={handlePrivateContinue}
                  disabled={!canContinuePrivate}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
          </>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full" 
          size="lg"
          onClick={() => navigate('/modify-ticket')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modify My Ticket
        </Button>
      </CardContent>
    </Card>
  );
};
