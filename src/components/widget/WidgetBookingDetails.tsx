import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Plus, Minus, Car, Bus, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WidgetOrderSummary } from './WidgetOrderSummary';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { countries, phoneCodes } from '@/lib/countries';
import { GooglePlacesAutocomplete } from './GooglePlacesAutocomplete';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  email_confirm: z.string().email('Invalid email address'),
  phoneCode: z.string().min(1, 'Phone code is required'),
  phoneNumber: z.string().min(6, 'Phone must be at least 6 digits'),
  country: z.string().min(2, 'Country is required'),
}).refine((data) => data.email === data.email_confirm, {
  message: "Emails don't match",
  path: ["email_confirm"],
});

interface PassengerInfo {
  name: string;
  age: string;
  idNumber: string;
}

interface TripInfo {
  originName: string;
  destName: string;
  date: string;
  time?: string;
  arrivalTime?: string;
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  price: number;
}

interface PickupInfo {
  cityName: string;
  vehicleType: 'car' | 'bus';
  price: number;
  details?: string;
  beforeDepartureMinutes?: number;
}

interface PickupDropoffRule {
  id: string;
  from_port_id: string;
  service_type: 'pickup' | 'dropoff';
  city_name: string;
  car_price: number;
  bus_price: number;
  before_departure_minutes?: number;
}

interface RouteActivityAddon {
  id: string;
  activity_addon_id: string;
  pricing_type: 'included' | 'normal';
  activity_addon: {
    id: string;
    name: string;
    description: string | null;
    price: number;
  };
}

interface SelectedActivityAddon {
  addon_id: string;
  name: string;
  price: number;
  pricing_type: 'included' | 'normal';
}

interface WidgetBookingDetailsProps {
  outbound: TripInfo;
  returnTrip?: TripInfo;
  pickups?: PickupInfo[];
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  onSubmit: (data: {
    customer: { full_name: string; email: string; phone: string; country: string };
    passengers: PassengerInfo[];
  }) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  primaryColor?: string;
  isPrivateBoat?: boolean;
  privateBoatName?: string;
  pickupDropoffRules?: PickupDropoffRule[];
  originPortId?: string;
  routeActivityAddons?: RouteActivityAddon[];
  onActivityAddonsChange?: (addons: SelectedActivityAddon[]) => void;
}

export const WidgetBookingDetails = ({
  outbound,
  returnTrip,
  pickups = [],
  paxAdult,
  paxChild,
  paxInfant,
  onSubmit,
  onBack,
  isSubmitting = false,
  primaryColor = '#1B5E3B',
  isPrivateBoat = false,
  privateBoatName,
  pickupDropoffRules = [],
  originPortId,
  routeActivityAddons = [],
  onActivityAddonsChange,
}: WidgetBookingDetailsProps) => {
  const totalPassengers = paxAdult + paxChild + paxInfant;

  // Customer info
  const [customer, setCustomer] = useState({
    full_name: '',
    gender: '',
    email: '',
    email_confirm: '',
    phoneCode: '+62',
    phoneNumber: '',
    country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Passengers
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array.from({ length: totalPassengers }, () => ({
      name: '',
      age: '',
      idNumber: '',
    }))
  );
  const [expandedPassenger, setExpandedPassenger] = useState<number | null>(0);
  const [useCustomerAsFirstPassenger, setUseCustomerAsFirstPassenger] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Private boat pickup selection
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [selectedPickupRuleId, setSelectedPickupRuleId] = useState<string>('');
  const [pickupVehicleType, setPickupVehicleType] = useState<'car' | 'bus'>('car');
  const [pickupDetails, setPickupDetails] = useState('');

  // Activity addons selection
  const [selectedActivityAddons, setSelectedActivityAddons] = useState<Set<string>>(new Set());

  // Filter pickup rules for private boat (based on origin port)
  const availablePickupRules = useMemo(() => {
    if (!isPrivateBoat || !originPortId) return [];
    return pickupDropoffRules.filter(
      r => r.service_type === 'pickup' && r.from_port_id === originPortId
    );
  }, [isPrivateBoat, originPortId, pickupDropoffRules]);

  const selectedPickupRule = useMemo(() => {
    return availablePickupRules.find(r => r.id === selectedPickupRuleId);
  }, [availablePickupRules, selectedPickupRuleId]);

  // Build combined pickups (passed from parent + local private boat selection)
  const combinedPickups = useMemo(() => {
    if (!isPrivateBoat || !pickupEnabled || !selectedPickupRule) {
      return pickups;
    }
    const price = pickupVehicleType === 'car' ? selectedPickupRule.car_price : selectedPickupRule.bus_price;
    return [
      ...pickups,
      {
        cityName: selectedPickupRule.city_name,
        vehicleType: pickupVehicleType,
        price,
        details: pickupDetails || undefined,
        beforeDepartureMinutes: selectedPickupRule.before_departure_minutes,
      },
    ];
  }, [isPrivateBoat, pickupEnabled, selectedPickupRule, pickupVehicleType, pickupDetails, pickups]);

  // Build selected activity addons for order summary
  const activityAddonsForSummary = useMemo(() => {
    return routeActivityAddons
      .filter(ra => selectedActivityAddons.has(ra.activity_addon_id))
      .map(ra => ({
        addon_id: ra.activity_addon_id,
        name: ra.activity_addon.name,
        price: ra.activity_addon.price,
        pricing_type: ra.pricing_type,
      }));
  }, [routeActivityAddons, selectedActivityAddons]);

  // Calculate activity addons total (only non-included ones)
  const activityAddonsTotal = useMemo(() => {
    return activityAddonsForSummary
      .filter(a => a.pricing_type === 'normal')
      .reduce((sum, a) => sum + a.price, 0);
  }, [activityAddonsForSummary]);

  const handleToggleActivityAddon = (addonId: string) => {
    setSelectedActivityAddons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      
      // Notify parent of change
      if (onActivityAddonsChange) {
        const selected = routeActivityAddons
          .filter(ra => newSet.has(ra.activity_addon_id))
          .map(ra => ({
            addon_id: ra.activity_addon_id,
            name: ra.activity_addon.name,
            price: ra.activity_addon.price,
            pricing_type: ra.pricing_type,
          }));
        onActivityAddonsChange(selected);
      }
      
      return newSet;
    });
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = () => {
    // Validate customer
    const result = customerSchema.safeParse(customer);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Validate pickup address if pickup is enabled
    if (isPrivateBoat && pickupEnabled && selectedPickupRuleId && !pickupDetails.trim()) {
      setErrors({ pickupDetails: 'Please enter your hotel or pickup address' });
      return;
    }

    if (!termsAccepted) {
      setErrors({ terms: 'You must accept the terms and conditions' });
      return;
    }

    setErrors({});
    onSubmit({
      customer: {
        full_name: customer.full_name,
        email: customer.email,
        phone: `${customer.phoneCode}${customer.phoneNumber}`,
        country: customer.country,
      },
      passengers,
    });
  };

  // Trip info grouped for display
  const trips = [
    { ...outbound, isReturn: false },
    ...(returnTrip ? [{ ...returnTrip, isReturn: true }] : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
      {/* Main Form - scrollable container */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto max-h-none">
        {/* Booked By Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: primaryColor }}>
            Booked By
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>* Name (English Only*)</Label>
              <Input
                placeholder="Name"
                value={customer.full_name}
                onChange={(e) => setCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
              />
              {errors.full_name && (
                <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
              )}
            </div>
            <div>
              <Label>Gender</Label>
              <select
                value={customer.gender}
                onChange={(e) => setCustomer(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <Label>* E-Mail</Label>
            <Input
              type="email"
              placeholder="E-Mail"
              value={customer.email}
              onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <Label>* Retype Email Address</Label>
            <Input
              type="email"
              placeholder="E-Mail"
              value={customer.email_confirm}
              onChange={(e) => setCustomer(prev => ({ ...prev, email_confirm: e.target.value }))}
              className="mt-1"
            />
            {errors.email_confirm && (
              <p className="text-sm text-red-500 mt-1">{errors.email_confirm}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>* Phone</Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={customer.phoneCode}
                  onValueChange={(value) => setCustomer(prev => ({ ...prev, phoneCode: value }))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-white z-50">
                    {phoneCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Phone number"
                  value={customer.phoneNumber}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="flex-1"
                />
              </div>
              {(errors.phoneCode || errors.phoneNumber) && (
                <p className="text-sm text-red-500 mt-1">{errors.phoneCode || errors.phoneNumber}</p>
              )}
            </div>
            <div>
              <Label>* Country</Label>
              <Select
                value={customer.country}
                onValueChange={(value) => setCustomer(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white z-50">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-500 mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        </div>

        {/* Passengers Section - Per Trip */}
        {trips.map((trip, tripIndex) => (
          <div key={tripIndex} className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-2">Passenger(s)</h2>
            
            {/* Trip Header */}
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-0 h-0 border-l-[12px] border-t-[12px] border-b-[12px] border-l-transparent border-b-transparent"
                style={{ borderTopColor: primaryColor }}
              />
              <span style={{ color: primaryColor }} className="font-medium">
                {trip.originName}
              </span>
              <span className="text-gray-400">—</span>
              <span style={{ color: primaryColor }} className="font-medium">
                {trip.destName}
              </span>
            </div>
            
            <div className="text-sm text-gray-500 mb-4">
              📅 {format(new Date(trip.date), 'EEE, dd MMM yyyy')} 
              {trip.time && <span className="ml-2">🕐 {trip.time}</span>}
              {trip.arrivalTime && <span className="text-gray-400"> → {trip.arrivalTime}</span>}
              <span className="ml-2">(Adult x {trip.paxAdult}, Child x {trip.paxChild}, Infants x {trip.paxInfant})</span>
            </div>

            {tripIndex === 0 && trips.length > 1 && (
              <div className="flex items-center gap-2 mb-4 justify-end">
                <Checkbox
                  id="sameInfo"
                  checked={useCustomerAsFirstPassenger}
                  onCheckedChange={(checked) => setUseCustomerAsFirstPassenger(!!checked)}
                />
                <Label htmlFor="sameInfo" className="text-sm cursor-pointer">
                  Same As Above Information
                </Label>
              </div>
            )}

            {/* Passenger Accordions */}
            <div className="space-y-2">
              {passengers.map((passenger, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedPassenger(expandedPassenger === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {expandedPassenger === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                      <span className="font-medium">
                        Passenger {index + 1}
                        {passenger.name && ` - ${passenger.name}`}
                      </span>
                    </div>
                    {expandedPassenger === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedPassenger === index && (
                    <div className="p-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>* Name</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Full Name"
                              value={passenger.name}
                              onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                            />
                            <select className="p-2 border rounded-md">
                              <option>Gender</option>
                              <option>Male</option>
                              <option>Female</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label>* Age</Label>
                          <Input
                            placeholder="Age"
                            type="number"
                            value={passenger.age}
                            onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>* ID number of Passport/ Kitas/ KTP</Label>
                        <Input
                          placeholder="ID Number"
                          value={passenger.idNumber}
                          onChange={(e) => updatePassenger(index, 'idNumber', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Private Boat Activity Add-ons Selection */}
        {isPrivateBoat && routeActivityAddons.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: primaryColor }}>
              <Gift className="h-5 w-5" />
              Activity Add-ons
            </h2>
            
            <div className="space-y-3">
              {routeActivityAddons.map(ra => {
                const isSelected = selectedActivityAddons.has(ra.activity_addon_id);
                const isIncluded = ra.pricing_type === 'included';
                
                return (
                  <div 
                    key={ra.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => handleToggleActivityAddon(ra.activity_addon_id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleActivityAddon(ra.activity_addon_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ra.activity_addon.name}</span>
                          {isIncluded ? (
                            <span className="flex items-center gap-2">
                              <span className="line-through text-gray-400 text-sm">
                                IDR {Number(ra.activity_addon.price).toLocaleString()}
                              </span>
                              <span className="text-green-600 font-bold text-sm">Included</span>
                            </span>
                          ) : (
                            <span className="font-bold text-sm" style={{ color: primaryColor }}>
                              IDR {Number(ra.activity_addon.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {ra.activity_addon.description && (
                          <p className="text-sm text-gray-500 mt-1">{ra.activity_addon.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Private Boat Pickup Selection */}
        {isPrivateBoat && availablePickupRules.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
              Pickup Service
              <span className="ml-2 text-sm font-normal text-green-600">(Included with Private Boat)</span>
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <Checkbox
                id="enablePickup"
                checked={pickupEnabled}
                onCheckedChange={(checked) => {
                  setPickupEnabled(!!checked);
                  if (!checked) {
                    setSelectedPickupRuleId('');
                    setPickupVehicleType('car');
                    setPickupDetails('');
                  }
                }}
              />
              <Label htmlFor="enablePickup" className="cursor-pointer">
                Add pickup service (free)
              </Label>
            </div>

            {pickupEnabled && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1">Pickup area</Label>
                    <Select
                      value={selectedPickupRuleId}
                      onValueChange={setSelectedPickupRuleId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePickupRules.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.city_name} {r.before_departure_minutes ? `(${r.before_departure_minutes} min before)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600 mb-1">* Hotel / Address</Label>
                    <GooglePlacesAutocomplete
                      value={pickupDetails}
                      onChange={(v) => setPickupDetails(v)}
                      placeholder="Enter your hotel or address"
                      disabled={!selectedPickupRuleId}
                      country="id"
                      className={errors.pickupDetails ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.pickupDetails && (
                      <p className="text-sm text-red-500 mt-1">{errors.pickupDetails}</p>
                    )}
                  </div>
                </div>

                {selectedPickupRule && (
                  <div>
                    <Label className="text-sm text-gray-600 mb-2">Vehicle type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPickupVehicleType('car')}
                        className={cn(
                          'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                          pickupVehicleType === 'car'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Car className="h-5 w-5" />
                        <span>Car (max 4 pax)</span>
                        <span className="text-xs">
                          <span className="line-through text-gray-400 mr-1">
                            IDR {Number(selectedPickupRule.car_price ?? 0).toLocaleString()}
                          </span>
                          <span className="text-green-600 font-bold">Included</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickupVehicleType('bus')}
                        className={cn(
                          'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                          pickupVehicleType === 'bus'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Bus className="h-5 w-5" />
                        <span>Minibus (max 10 pax)</span>
                        <span className="text-xs">
                          <span className="line-through text-gray-400 mr-1">
                            IDR {Number(selectedPickupRule.bus_price ?? 0).toLocaleString()}
                          </span>
                          <span className="text-green-600 font-bold">Included</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* Terms & Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I agree to the <a href="#" className="text-blue-500 underline">Terms And Conditions.</a>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms}</p>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 py-6 text-lg"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-6 text-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? 'Processing...' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <WidgetOrderSummary
          outbound={{
            ...outbound,
            routeName: `${outbound.originName} - ${outbound.destName}`,
          }}
          returnTrip={returnTrip ? {
            ...returnTrip,
            routeName: `${returnTrip.originName} - ${returnTrip.destName}`,
          } : undefined}
          pickups={combinedPickups}
          activityAddons={activityAddonsForSummary}
          addonsTotal={activityAddonsTotal}
          primaryColor={primaryColor}
          isPrivateBoat={isPrivateBoat}
        />
      </div>
    </div>
  );
};
