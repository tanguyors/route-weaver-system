import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Anchor, MapPin, Clock, Calendar, ArrowRight, ArrowLeft, Users } from 'lucide-react';

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

interface BookingStepPrivateBoatProps {
  privateBoats: PrivateBoat[];
  onSelect: (selection: PrivateBoatSelection) => void;
  onBack: () => void;
}

export interface SelectedActivityAddon {
  addon_id: string;
  name: string;
  price: number;
  pricing_type: 'included' | 'normal';
}

export interface PrivateBoatSelection {
  boat: PrivateBoat;
  route: PrivateBoatRoute;
  date: string;
  time: string;
  passengerCount: number;
  pickup?: {
    rule: PickupDropoffRule;
    details: string;
    vehicleType: VehicleType;
  };
  dropoff?: {
    rule: PickupDropoffRule;
    details: string;
    vehicleType: VehicleType;
  };
  activityAddons?: SelectedActivityAddon[];
}

export const BookingStepPrivateBoat = ({
  privateBoats,
  onSelect,
  onBack,
}: BookingStepPrivateBoatProps) => {
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [selectedPickupId, setSelectedPickupId] = useState<string>('');
  const [pickupDetails, setPickupDetails] = useState<string>('');
  const [pickupVehicleType, setPickupVehicleType] = useState<VehicleType>('car');
  const [selectedDropoffId, setSelectedDropoffId] = useState<string>('');
  const [dropoffDetails, setDropoffDetails] = useState<string>('');
  const [dropoffVehicleType, setDropoffVehicleType] = useState<VehicleType>('car');

  const selectedBoat = privateBoats.find(b => b.id === selectedBoatId);
  const selectedRoute = selectedBoat?.routes.find(r => r.id === selectedRouteId);

  // Get unique from ports from selected boat's routes
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

  // Get available routes based on selected from port
  const [selectedFromPortId, setSelectedFromPortId] = useState<string>('');
  const availableRoutes = selectedBoat?.routes.filter(r => r.from_port_id === selectedFromPortId) || [];

  // Get pickup rules for selected route's from port
  const availablePickups = selectedBoat?.pickup_dropoff_rules.filter(
    r => r.from_port_id === selectedFromPortId && r.service_type === 'pickup'
  ) || [];

  // Get dropoff rules for selected route's to port
  const availableDropoffs = selectedRoute 
    ? selectedBoat?.pickup_dropoff_rules.filter(
        r => r.from_port_id === selectedRoute.to_port_id && r.service_type === 'dropoff'
      ) || []
    : [];

  const minDate = new Date().toISOString().split('T')[0];

  // Generate time slots based on boat's min/max departure time
  const getTimeSlots = () => {
    if (!selectedBoat) return [];
    const minTime = selectedBoat.min_departure_time || '06:00';
    const maxTime = selectedBoat.max_departure_time || '18:00';
    
    const slots: string[] = [];
    const [minHour] = minTime.split(':').map(Number);
    const [maxHour] = maxTime.split(':').map(Number);
    
    for (let hour = minHour; hour <= maxHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < maxHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const calculateTotal = () => {
    if (!selectedRoute) return 0;
    let total = selectedRoute.price;
    
    if (selectedPickupId) {
      const pickupRule = availablePickups.find(p => p.id === selectedPickupId);
      if (pickupRule) {
        total += pickupVehicleType === 'car' ? pickupRule.car_price : pickupRule.bus_price;
      }
    }
    
    if (selectedDropoffId) {
      const dropoffRule = availableDropoffs.find(d => d.id === selectedDropoffId);
      if (dropoffRule) {
        total += dropoffVehicleType === 'car' ? dropoffRule.car_price : dropoffRule.bus_price;
      }
    }
    
    return total;
  };

  const canContinue = selectedBoat && selectedRoute && selectedDate && selectedTime && passengerCount > 0;

  const handleContinue = () => {
    if (!selectedBoat || !selectedRoute) return;

    const selection: PrivateBoatSelection = {
      boat: selectedBoat,
      route: selectedRoute,
      date: selectedDate,
      time: selectedTime,
      passengerCount,
    };

    if (selectedPickupId) {
      const pickupRule = availablePickups.find(p => p.id === selectedPickupId);
      if (pickupRule) {
        selection.pickup = { rule: pickupRule, details: pickupDetails, vehicleType: pickupVehicleType };
      }
    }

    if (selectedDropoffId) {
      const dropoffRule = availableDropoffs.find(d => d.id === selectedDropoffId);
      if (dropoffRule) {
        selection.dropoff = { rule: dropoffRule, details: dropoffDetails, vehicleType: dropoffVehicleType };
      }
    }

    onSelect(selection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-amber-600" />
          Private Boat Charter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Boat */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Your Boat</Label>
          <div className="grid gap-3">
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
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedBoatId === boat.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {boat.image_url ? (
                    <img 
                      src={boat.image_url} 
                      alt={boat.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Anchor className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold">{boat.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Up to {boat.capacity} passengers
                    </p>
                    {boat.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {boat.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Route */}
        {selectedBoat && (
          <>
            <div>
              <Label htmlFor="fromPort">From Port</Label>
              <Select 
                value={selectedFromPortId} 
                onValueChange={(v) => {
                  setSelectedFromPortId(v);
                  setSelectedRouteId('');
                  setSelectedPickupId('');
                }}
              >
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
                <Label htmlFor="route">Destination</Label>
                <Select 
                  value={selectedRouteId} 
                  onValueChange={(v) => {
                    setSelectedRouteId(v);
                    setSelectedDropoffId('');
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoutes.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{route.to_port?.name} {route.to_port?.area && `(${route.to_port.area})`}</span>
                          <span className="text-muted-foreground ml-4">
                            IDR {route.price.toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Step 3: Date & Time */}
        {selectedRoute && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Departure Time
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
        )}

        {/* Passenger Count */}
        {selectedRoute && (
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Passengers
            </Label>
            <Select 
              value={passengerCount.toString()} 
              onValueChange={(v) => setPassengerCount(Number(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: selectedBoat?.capacity || 10 }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n} passenger{n > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pickup Option */}
        {selectedRoute && availablePickups.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="font-medium">Pickup Service (Optional)</Label>
            <Select value={selectedPickupId} onValueChange={(v) => {
              setSelectedPickupId(v);
              if (!v) setPickupVehicleType('car');
            }}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="No pickup needed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No pickup needed</SelectItem>
                {availablePickups.map(pickup => (
                  <SelectItem key={pickup.id} value={pickup.id}>
                    {pickup.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPickupId && (
              <>
                {/* Vehicle Type Selection */}
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Number of passengers</Label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPickupVehicleType('car')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        pickupVehicleType === 'car'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      Less than 4
                      {availablePickups.find(p => p.id === selectedPickupId) && (
                        <span className="block text-xs opacity-75">
                          +IDR {availablePickups.find(p => p.id === selectedPickupId)?.car_price.toLocaleString()}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupVehicleType('bus')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        pickupVehicleType === 'bus'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      4 or more
                      {availablePickups.find(p => p.id === selectedPickupId) && (
                        <span className="block text-xs opacity-75">
                          +IDR {availablePickups.find(p => p.id === selectedPickupId)?.bus_price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                <Input
                  className="mt-2"
                  placeholder="Hotel name / pickup address"
                  value={pickupDetails}
                  onChange={(e) => setPickupDetails(e.target.value)}
                />
              </>
            )}
          </div>
        )}

        {/* Dropoff Option */}
        {selectedRoute && availableDropoffs.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="font-medium">Dropoff Service (Optional)</Label>
            <Select value={selectedDropoffId} onValueChange={(v) => {
              setSelectedDropoffId(v);
              if (!v) setDropoffVehicleType('car');
            }}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="No dropoff needed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No dropoff needed</SelectItem>
                {availableDropoffs.map(dropoff => (
                  <SelectItem key={dropoff.id} value={dropoff.id}>
                    {dropoff.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDropoffId && (
              <>
                {/* Vehicle Type Selection */}
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Number of passengers</Label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setDropoffVehicleType('car')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        dropoffVehicleType === 'car'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      Less than 4
                      {availableDropoffs.find(d => d.id === selectedDropoffId) && (
                        <span className="block text-xs opacity-75">
                          +IDR {availableDropoffs.find(d => d.id === selectedDropoffId)?.car_price.toLocaleString()}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropoffVehicleType('bus')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        dropoffVehicleType === 'bus'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      4 or more
                      {availableDropoffs.find(d => d.id === selectedDropoffId) && (
                        <span className="block text-xs opacity-75">
                          +IDR {availableDropoffs.find(d => d.id === selectedDropoffId)?.bus_price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                <Input
                  className="mt-2"
                  placeholder="Hotel name / dropoff address"
                  value={dropoffDetails}
                  onChange={(e) => setDropoffDetails(e.target.value)}
                />
              </>
            )}
          </div>
        )}

        {/* Price Summary */}
        {selectedRoute && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Price</span>
              <span className="text-primary">IDR {calculateTotal().toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              *Price is for the entire boat, not per person
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!canContinue}
            className="flex-1"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
