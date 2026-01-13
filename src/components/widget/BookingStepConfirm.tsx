import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, ChevronLeft, Calendar, Clock, Users, Loader2, Baby, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { countries, phoneCodes } from '@/lib/countries';
import { useWidgetCurrency } from '@/contexts/WidgetLanguageContext';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(8, 'Phone must be at least 8 digits').max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  country: z.string().max(50).optional().or(z.literal('')),
});

interface TripBooking {
  routeName: string;
  tripName: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  adultPrice: number;
  childPrice: number;
}

interface BookingState {
  departureId: string;
  routeName: string;
  tripName: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string;
  paxAdult: number;
  paxChild: number;
  paxInfant?: number;
  adultPrice: number;
  childPrice: number;
  subtotal: number;
  promoCode: string;
  returnTrip?: TripBooking | null;
}

interface BookingStepConfirmProps {
  booking: BookingState;
  isSubmitting: boolean;
  onSubmit: (customer: { full_name: string; phone: string; email: string; country: string }) => void;
  onBack: () => void;
}

export const BookingStepConfirm = ({
  booking,
  isSubmitting,
  onSubmit,
  onBack,
}: BookingStepConfirmProps) => {
  const [customer, setCustomer] = useState({
    full_name: '',
    phoneCode: '+62',
    phoneNumber: '',
    email: '',
    country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formatPrice } = useWidgetCurrency();

  const handleSubmit = () => {
    const fullPhone = `${customer.phoneCode}${customer.phoneNumber}`;
    const result = customerSchema.safeParse({
      full_name: customer.full_name,
      phone: fullPhone,
      email: customer.email,
      country: customer.country,
    });
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
    
    setErrors({});
    onSubmit({
      full_name: customer.full_name,
      phone: fullPhone,
      email: customer.email,
      country: customer.country,
    });
  };

  const isRoundTrip = !!booking.returnTrip;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} disabled={isSubmitting}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Details
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            Booking Summary
            {isRoundTrip && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Round Trip
              </span>
            )}
          </h3>
          
          {/* Outbound Trip */}
          <div className="border-l-2 border-primary pl-3">
            <p className="text-xs font-medium text-primary uppercase">Outbound</p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(booking.departureDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{booking.departureTime.slice(0, 5)}</span>
                {booking.arrivalTime && (
                  <span className="text-muted-foreground/70">→ {booking.arrivalTime.slice(0, 5)}</span>
                )}
              </div>
            </div>
            <div className="text-sm font-medium">{booking.routeName}</div>
          </div>

          {/* Return Trip */}
          {booking.returnTrip && (
            <div className="border-l-2 border-emerald-500 pl-3">
              <p className="text-xs font-medium text-emerald-600 uppercase">Return</p>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(booking.returnTrip.departureDate), 'MMM d, yyyy')}</span>
                </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{booking.returnTrip.departureTime.slice(0, 5)}</span>
                {booking.returnTrip.arrivalTime && (
                  <span className="text-muted-foreground/70">→ {booking.returnTrip.arrivalTime.slice(0, 5)}</span>
                )}
              </div>
              </div>
              <div className="text-sm font-medium">{booking.returnTrip.routeName}</div>
            </div>
          )}

          {/* Passengers */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {booking.paxAdult} adult{booking.paxAdult > 1 ? 's' : ''}
              {booking.paxChild > 0 && `, ${booking.paxChild} child${booking.paxChild > 1 ? 'ren' : ''}`}
              {(booking.paxInfant || 0) > 0 && (
                <span className="text-emerald-600">
                  , {booking.paxInfant} infant{(booking.paxInfant || 0) > 1 ? 's' : ''} (free)
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatPrice(booking.subtotal)}</span>
          </div>
          {booking.promoCode && (
            <p className="text-xs text-muted-foreground">
              Promo code "{booking.promoCode}" will be applied
            </p>
          )}
        </div>

        {/* Customer Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={customer.full_name}
              onChange={(e) => setCustomer(prev => ({ ...prev, full_name: e.target.value }))}
              className="mt-1"
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={customer.phoneCode}
                onValueChange={(value) => setCustomer(prev => ({ ...prev, phoneCode: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-background z-50">
                  {phoneCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="812345678"
                value={customer.phoneNumber}
                onChange={(e) => setCustomer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="flex-1"
                disabled={isSubmitting}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={customer.email}
              onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={customer.country}
              onValueChange={(value) => setCustomer(prev => ({ ...prev, country: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-background z-50">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
