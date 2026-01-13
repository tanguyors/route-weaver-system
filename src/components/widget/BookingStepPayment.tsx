import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2, Wallet, Building, CreditCard, Landmark } from 'lucide-react';
import { format } from 'date-fns';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'xendit';

interface PassengerInfo {
  name: string;
  age: string;
  idNumber: string;
}

interface TripSummary {
  originName: string;
  destName: string;
  date: string;
  time?: string;
}

interface BookingStepPaymentProps {
  outbound: TripSummary;
  returnTrip?: TripSummary;
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  passengers: PassengerInfo[];
  customer: {
    full_name: string;
    email: string;
    phone: string;
    country: string;
  };
  totalAmount: number;
  primaryColor?: string;
  isSubmitting?: boolean;
  onSubmit: (paymentMethod: PaymentMethod) => void;
  onBack: () => void;
}

const paymentMethods = [
  {
    id: 'cash' as PaymentMethod,
    name: 'Cash at Partner Office',
    description: 'Pay in cash at the partner agency counter',
    icon: Wallet,
  },
  {
    id: 'bank_transfer' as PaymentMethod,
    name: 'Bank Transfer',
    description: 'Transfer to our bank account',
    icon: Landmark,
  },
  {
    id: 'credit_card' as PaymentMethod,
    name: 'Credit/Debit Card',
    description: 'Pay with Visa, Mastercard, or other cards',
    icon: CreditCard,
    comingSoon: true,
  },
  {
    id: 'xendit' as PaymentMethod,
    name: 'Online Payment (Xendit)',
    description: 'Pay via e-wallet, virtual account, or QRIS',
    icon: Building,
    comingSoon: true,
  },
];

export const BookingStepPayment = ({
  outbound,
  returnTrip,
  paxAdult,
  paxChild,
  paxInfant,
  passengers,
  customer,
  totalAmount,
  primaryColor = '#1B5E3B',
  isSubmitting = false,
  onSubmit,
  onBack,
}: BookingStepPaymentProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = () => {
    onSubmit(selectedMethod);
  };

  const isRoundTrip = !!returnTrip;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Payment Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack} disabled={isSubmitting}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
              Select Payment Method
            </h2>
          </div>

          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isDisabled = method.comingSoon;
              
              return (
                <div
                  key={method.id}
                  className={`relative flex items-center space-x-4 rounded-lg border-2 p-4 transition-all ${
                    selectedMethod === method.id && !isDisabled
                      ? 'border-primary bg-primary/5'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={isDisabled}
                    className="mt-0"
                  />
                  <Icon className="h-6 w-6 text-gray-600" />
                  <div className="flex-1">
                    <Label
                      htmlFor={method.id}
                      className={`font-medium cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                    >
                      {method.name}
                      {method.comingSoon && (
                        <span className="ml-2 text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-6 text-lg"
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-6 text-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm & Generate Ticket'
            )}
          </Button>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border p-4 sticky top-4 space-y-4">
          <h3 className="font-bold text-lg" style={{ color: primaryColor }}>
            Booking Summary
          </h3>

          {/* Trips */}
          <div className="space-y-3">
            <div className="border-l-2 pl-3" style={{ borderColor: primaryColor }}>
              <p className="text-xs font-medium uppercase" style={{ color: primaryColor }}>
                {isRoundTrip ? 'Outbound' : 'Trip'}
              </p>
              <p className="font-medium">{outbound.originName} → {outbound.destName}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(outbound.date), 'EEE, dd MMM yyyy')} - {outbound.time}
              </p>
            </div>

            {returnTrip && (
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-xs font-medium text-emerald-600 uppercase">Return</p>
                <p className="font-medium">{returnTrip.originName} → {returnTrip.destName}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(returnTrip.date), 'EEE, dd MMM yyyy')} - {returnTrip.time}
                </p>
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Passengers</p>
            <p className="text-sm text-gray-600">
              {paxAdult} Adult{paxAdult > 1 ? 's' : ''}
              {paxChild > 0 && `, ${paxChild} Child${paxChild > 1 ? 'ren' : ''}`}
              {paxInfant > 0 && (
                <span className="text-emerald-600"> + {paxInfant} Infant{paxInfant > 1 ? 's' : ''} (free)</span>
              )}
            </p>
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              {passengers.filter(p => p.name).map((p, i) => (
                <p key={i}>• {p.name}</p>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">Contact</p>
            <p className="text-sm text-gray-600">{customer.full_name}</p>
            <p className="text-xs text-gray-500">{customer.email}</p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Selected Payment Method */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
            <p className="font-medium text-sm">
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
