import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WidgetOrderSummary } from './WidgetOrderSummary';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  email_confirm: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone must be at least 8 digits'),
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
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  price: number;
}

interface WidgetBookingDetailsProps {
  outbound: TripInfo;
  returnTrip?: TripInfo;
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
}

export const WidgetBookingDetails = ({
  outbound,
  returnTrip,
  paxAdult,
  paxChild,
  paxInfant,
  onSubmit,
  onBack,
  isSubmitting = false,
  primaryColor = '#22c55e',
}: WidgetBookingDetailsProps) => {
  const totalPassengers = paxAdult + paxChild + paxInfant;

  // Customer info
  const [customer, setCustomer] = useState({
    full_name: '',
    gender: '',
    email: '',
    email_confirm: '',
    phone: '',
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

    if (!termsAccepted) {
      setErrors({ terms: 'You must accept the terms and conditions' });
      return;
    }

    setErrors({});
    onSubmit({
      customer: {
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
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
              <Input
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <Label>* Country</Label>
              <Input
                placeholder="Country"
                value={customer.country}
                onChange={(e) => setCustomer(prev => ({ ...prev, country: e.target.value }))}
                className="mt-1"
              />
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
                style={{ borderTopColor: trip.isReturn ? '#3b82f6' : primaryColor }}
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
              (Adult x {trip.paxAdult}, Child x {trip.paxChild}, Infants x {trip.paxInfant})
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
                        style={{ backgroundColor: '#0ea5e9' }}
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

        {/* Payment Type */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Payment Type</span>
            <select className="flex-1 p-2 border rounded-md">
              <option>Payment</option>
              <option>Full Payment</option>
              <option>Deposit</option>
            </select>
          </div>
        </div>

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
          primaryColor={primaryColor}
        />
      </div>
    </div>
  );
};
