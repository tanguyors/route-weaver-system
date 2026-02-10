import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Car, Bus, Gift } from 'lucide-react';
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

  // Departure passengers
  const [departurePassengers, setDeparturePassengers] = useState<PassengerInfo[]>(
    Array.from({ length: totalPassengers }, () => ({
      name: '',
      age: '',
      idNumber: '',
    }))
  );
  // Return passengers (only used when returnTrip exists and samePassengers is false)
  const [returnPassengers, setReturnPassengers] = useState<PassengerInfo[]>(
    Array.from({ length: totalPassengers }, () => ({
      name: '',
      age: '',
      idNumber: '',
    }))
  );
  // Passenger selector (single form shown at a time)
  const [expandedDeparturePassenger, setExpandedDeparturePassenger] = useState<number>(0);
  const [expandedReturnPassenger, setExpandedReturnPassenger] = useState<number>(0);
  const [bookerIsPassenger, setBookerIsPassenger] = useState(false);
  const [samePassengers, setSamePassengers] = useState(true);
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

  const updateDeparturePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setDeparturePassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateReturnPassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setReturnPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Sync booker info to departure passenger 1
  const handleBookerIsPassengerChange = (checked: boolean) => {
    setBookerIsPassenger(checked);
    if (checked) {
      setDeparturePassengers(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], name: customer.full_name };
        return updated;
      });
    }
  };

  // Keep passenger 1 synced with customer name when bookerIsPassenger is on
  const handleCustomerNameChange = (name: string) => {
    setCustomer(prev => ({ ...prev, full_name: name }));
    if (bookerIsPassenger) {
      setDeparturePassengers(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], name };
        return updated;
      });
    }
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

    // Validate departure passengers
    for (let i = 0; i < departurePassengers.length; i++) {
      const p = departurePassengers[i];
      if (!p.name.trim()) {
        setErrors({ [`dep_passenger_${i}_name`]: `Departure Passenger ${i + 1}: Name is required` });
        setExpandedDeparturePassenger(i);
        return;
      }
      if (!p.age.trim()) {
        setErrors({ [`dep_passenger_${i}_age`]: `Departure Passenger ${i + 1}: Age is required` });
        setExpandedDeparturePassenger(i);
        return;
      }
      if (!p.idNumber.trim()) {
        setErrors({ [`dep_passenger_${i}_idNumber`]: `Departure Passenger ${i + 1}: ID Number is required` });
        setExpandedDeparturePassenger(i);
        return;
      }
    }

    // Validate return passengers if separate
    if (returnTrip && !samePassengers) {
      for (let i = 0; i < returnPassengers.length; i++) {
        const p = returnPassengers[i];
        if (!p.name.trim()) {
          setErrors({ [`ret_passenger_${i}_name`]: `Return Passenger ${i + 1}: Name is required` });
          setExpandedReturnPassenger(i);
          return;
        }
        if (!p.age.trim()) {
          setErrors({ [`ret_passenger_${i}_age`]: `Return Passenger ${i + 1}: Age is required` });
          setExpandedReturnPassenger(i);
          return;
        }
        if (!p.idNumber.trim()) {
          setErrors({ [`ret_passenger_${i}_idNumber`]: `Return Passenger ${i + 1}: ID Number is required` });
          setExpandedReturnPassenger(i);
          return;
        }
      }
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
    // Use departure passengers as the main passengers list
    const finalPassengers = samePassengers ? departurePassengers : departurePassengers;
    onSubmit({
      customer: {
        full_name: customer.full_name,
        email: customer.email,
        phone: `${customer.phoneCode}${customer.phoneNumber}`,
        country: customer.country,
      },
      passengers: finalPassengers,
    });
  };

  // Trip info grouped for display
  const trips = [
    { ...outbound, isReturn: false },
    ...(returnTrip ? [{ ...returnTrip, isReturn: true }] : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
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
                onChange={(e) => handleCustomerNameChange(e.target.value)}
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

        {/* Passengers Section (single, shared for outbound + return) */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-2">Passenger(s)</h2>

          {/* Trip summaries */}
          <div className="space-y-4">
            {trips.map((trip, idx) => (
              <div
                key={`${trip.isReturn ? 'return' : 'outbound'}-${idx}`}
                className={cn(idx > 0 && 'pt-4 border-t')}
              >
                <div className="flex items-center gap-2 mb-2">
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

                <div className="text-sm text-gray-500">
                  📅 {format(new Date(trip.date), 'EEE, dd MMM yyyy')}
                  {trip.time && <span className="ml-2">🕐 {trip.time}</span>}
                  {trip.arrivalTime && <span className="text-gray-400"> → {trip.arrivalTime}</span>}
                  <span className="ml-2">
                    (Adult x {trip.paxAdult}, Child x {trip.paxChild}, Infants x {trip.paxInfant})
                  </span>
                </div>
              </div>
            ))}
          </div>


          {/* Passenger selector: 3 per row */}
          {passengers.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                {passengers.map((passenger, index) => {
                  const isActive = expandedPassenger === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setExpandedPassenger(index)}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-left transition-colors min-w-0',
                        isActive
                          ? 'bg-gray-50'
                          : 'bg-white hover:bg-gray-50'
                      )}
                      style={isActive ? { borderColor: primaryColor } : undefined}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">Passenger {index + 1}</span>
                        {passenger.name ? (
                          <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                            ✓
                          </span>
                        ) : null}
                      </div>
                      {passenger.name ? (
                        <div className="text-xs text-gray-500 truncate">{passenger.name}</div>
                      ) : (
                        <div className="text-xs text-gray-400 truncate">Details</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active passenger form */}
              <div className="mt-4 rounded-lg border p-4 space-y-4">
                {(() => {
                  const passenger = passengers[expandedPassenger];
                  if (!passenger) return null;
                  const index = expandedPassenger;
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>* Name</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Full Name"
                              value={passenger.name}
                              onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                              className={errors[`passenger_${index}_name`] ? 'border-red-500' : ''}
                            />
                            <select className="p-2 border rounded-md">
                              <option>Gender</option>
                              <option>Male</option>
                              <option>Female</option>
                            </select>
                          </div>
                          {errors[`passenger_${index}_name`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`passenger_${index}_name`]}</p>
                          )}
                        </div>
                        <div>
                          <Label>* Age</Label>
                          <Input
                            placeholder="Age"
                            type="number"
                            value={passenger.age}
                            onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                            className={cn("mt-1", errors[`passenger_${index}_age`] && 'border-red-500')}
                          />
                          {errors[`passenger_${index}_age`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`passenger_${index}_age`]}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>* ID number of Passport/ Kitas/ KTP</Label>
                        <Input
                          placeholder="ID Number"
                          value={passenger.idNumber}
                          onChange={(e) => updatePassenger(index, 'idNumber', e.target.value)}
                          className={cn("mt-1", errors[`passenger_${index}_idNumber`] && 'border-red-500')}
                        />
                        {errors[`passenger_${index}_idNumber`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`passenger_${index}_idNumber`]}</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

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
