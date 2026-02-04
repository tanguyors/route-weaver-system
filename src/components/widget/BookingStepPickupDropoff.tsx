import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, MapPin, Car, Bus } from 'lucide-react';
import { GooglePlacesAutocomplete, PlaceResult } from './GooglePlacesAutocomplete';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

const NONE = '__none__';

export interface PickupDropoffSelection {
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
  total: number;
}

interface BookingStepPickupDropoffProps {
  pickupRules: PickupDropoffRule[];
  dropoffRules: PickupDropoffRule[];
  originPortId: string;
  destinationPortId: string;
  onConfirm: (selection: PickupDropoffSelection) => void;
  onBack: () => void;
}

export const BookingStepPickupDropoff = ({
  pickupRules,
  dropoffRules,
  originPortId,
  destinationPortId,
  onConfirm,
  onBack,
}: BookingStepPickupDropoffProps) => {
  // Filter rules by port
  const availablePickups = pickupRules.filter(
    r => r.from_port_id === originPortId && r.service_type === 'pickup'
  );
  const availableDropoffs = dropoffRules.filter(
    r => r.from_port_id === destinationPortId && r.service_type === 'dropoff'
  );

  const [selectedPickupId, setSelectedPickupId] = useState<string>(NONE);
  const [pickupDetails, setPickupDetails] = useState<string>('');
  const [pickupVehicleType, setPickupVehicleType] = useState<VehicleType>('car');

  const [selectedDropoffId, setSelectedDropoffId] = useState<string>(NONE);
  const [dropoffDetails, setDropoffDetails] = useState<string>('');
  const [dropoffVehicleType, setDropoffVehicleType] = useState<VehicleType>('car');

  const selectedPickup = selectedPickupId !== NONE
    ? availablePickups.find(p => p.id === selectedPickupId)
    : undefined;
  const selectedDropoff = selectedDropoffId !== NONE
    ? availableDropoffs.find(d => d.id === selectedDropoffId)
    : undefined;

  const calculateTotal = (): number => {
    let total = 0;
    if (selectedPickup) {
      total += pickupVehicleType === 'car' ? selectedPickup.car_price : selectedPickup.bus_price;
    }
    if (selectedDropoff) {
      total += dropoffVehicleType === 'car' ? selectedDropoff.car_price : selectedDropoff.bus_price;
    }
    return total;
  };

  const handleConfirm = () => {
    const selection: PickupDropoffSelection = {
      total: calculateTotal(),
    };

    if (selectedPickup) {
      selection.pickup = {
        rule: selectedPickup,
        details: pickupDetails,
        vehicleType: pickupVehicleType,
      };
    }

    if (selectedDropoff) {
      selection.dropoff = {
        rule: selectedDropoff,
        details: dropoffDetails,
        vehicleType: dropoffVehicleType,
      };
    }

    onConfirm(selection);
  };

  const hasNoOptions = availablePickups.length === 0 && availableDropoffs.length === 0;

  // Show message if no options available
  if (hasNoOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pickup & Dropoff
          </CardTitle>
          <CardDescription>
            No transport services available for this route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => onConfirm({ total: 0 })} className="flex-1">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Pickup & Dropoff
        </CardTitle>
        <CardDescription>
          Add optional transport services to your trip
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickup Section */}
        {availablePickups.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="font-medium text-base">Pickup Service (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              We'll pick you up from your hotel before departure
            </p>
            
            <Select 
              value={selectedPickupId} 
              onValueChange={(v) => {
                setSelectedPickupId(v);
                if (v === NONE) {
                  setPickupVehicleType('car');
                  setPickupDetails('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No pickup needed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No pickup needed</SelectItem>
                {availablePickups.map(pickup => (
                  <SelectItem key={pickup.id} value={pickup.id}>
                    {pickup.city_name} ({pickup.before_departure_minutes} min before departure)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPickup && (
              <div className="mt-4 space-y-4">
                {/* Vehicle Type Selection */}
                <div>
                  <Label className="text-sm text-muted-foreground">Number of passengers</Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setPickupVehicleType('car')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                        pickupVehicleType === 'car'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <Car className="h-5 w-5" />
                      <span>PRIVATE Car (max 4 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedPickup.car_price ?? 0).toLocaleString()} for one way
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupVehicleType('bus')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                        pickupVehicleType === 'bus'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <Bus className="h-5 w-5" />
                      <span>PRIVATE Minibus (max 10 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedPickup.bus_price ?? 0).toLocaleString()} for one way
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Pickup Address / Hotel Name</Label>
                  {GOOGLE_MAPS_API_KEY ? (
                    <GooglePlacesAutocomplete
                      value={pickupDetails}
                      onChange={(value) => setPickupDetails(value)}
                      placeholder="Search hotel or address..."
                      apiKey={GOOGLE_MAPS_API_KEY}
                      country="id"
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      placeholder="Enter your hotel name or pickup address"
                      value={pickupDetails}
                      onChange={(e) => setPickupDetails(e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dropoff Section */}
        {availableDropoffs.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="font-medium text-base">Dropoff Service (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              We'll drop you off at your destination after arrival
            </p>
            
            <Select 
              value={selectedDropoffId} 
              onValueChange={(v) => {
                setSelectedDropoffId(v);
                if (v === NONE) {
                  setDropoffVehicleType('car');
                  setDropoffDetails('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No dropoff needed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No dropoff needed</SelectItem>
                {availableDropoffs.map(dropoff => (
                  <SelectItem key={dropoff.id} value={dropoff.id}>
                    {dropoff.city_name} ({dropoff.before_departure_minutes} min after arrival)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDropoff && (
              <div className="mt-4 space-y-4">
                {/* Vehicle Type Selection */}
                <div>
                  <Label className="text-sm text-muted-foreground">Number of passengers</Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setDropoffVehicleType('car')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                        dropoffVehicleType === 'car'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <Car className="h-5 w-5" />
                      <span>PRIVATE Car (max 4 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedDropoff.car_price ?? 0).toLocaleString()} for one way
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropoffVehicleType('bus')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                        dropoffVehicleType === 'bus'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <Bus className="h-5 w-5" />
                      <span>PRIVATE Minibus (max 10 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedDropoff.bus_price ?? 0).toLocaleString()} for one way
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Dropoff Address / Hotel Name</Label>
                  {GOOGLE_MAPS_API_KEY ? (
                    <GooglePlacesAutocomplete
                      value={dropoffDetails}
                      onChange={(value) => setDropoffDetails(value)}
                      placeholder="Search destination hotel or address..."
                      apiKey={GOOGLE_MAPS_API_KEY}
                      country="id"
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      placeholder="Enter your destination hotel or address"
                      value={dropoffDetails}
                      onChange={(e) => setDropoffDetails(e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        {calculateTotal() > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Transport Total</span>
              <span className="text-primary">IDR {calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
