import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Anchor, Calendar, Clock, MapPin, Users, ArrowLeft, Loader2, Car } from 'lucide-react';
import { PrivateBoatSelection } from './BookingStepPrivateBoat';

interface BookingStepPrivateConfirmProps {
  selection: PrivateBoatSelection;
  isSubmitting: boolean;
  onSubmit: (customer: CustomerInfo) => void;
  onBack: () => void;
}

interface CustomerInfo {
  full_name: string;
  phone: string;
  email: string;
  country: string;
}

export const BookingStepPrivateConfirm = ({
  selection,
  isSubmitting,
  onSubmit,
  onBack,
}: BookingStepPrivateConfirmProps) => {
  const [customer, setCustomer] = useState<CustomerInfo>({
    full_name: '',
    phone: '',
    email: '',
    country: '',
  });

  const calculateTotal = () => {
    let total = selection.route.price;
    if (selection.pickup) total += selection.pickup.rule.price;
    if (selection.dropoff) total += selection.dropoff.rule.price;
    return total;
  };

  const canSubmit = customer.full_name.trim() && customer.phone.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(customer);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-amber-600" />
          Confirm Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Booking Summary
            </h3>
            
            <div className="flex items-center gap-3">
              <Anchor className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold">{selection.boat.name}</p>
                <p className="text-sm text-muted-foreground">Private Charter</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {selection.route.from_port?.name} → {selection.route.to_port?.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selection.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{selection.time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Passengers</p>
                  <p className="font-medium">{selection.passengerCount}</p>
                </div>
              </div>
            </div>

            {/* Pickup/Dropoff */}
            {(selection.pickup || selection.dropoff) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {selection.pickup && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-green-600" />
                      <span>Pickup: {selection.pickup.rule.city_name}</span>
                      <span className="text-muted-foreground ml-auto">
                        +IDR {selection.pickup.rule.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selection.dropoff && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-blue-600" />
                      <span>Dropoff: {selection.dropoff.rule.city_name}</span>
                      <span className="text-muted-foreground ml-auto">
                        +IDR {selection.dropoff.rule.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Boat Charter</span>
                <span>IDR {selection.route.price.toLocaleString()}</span>
              </div>
              {selection.pickup && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Pickup Service</span>
                  <span>IDR {selection.pickup.rule.price.toLocaleString()}</span>
                </div>
              )}
              {selection.dropoff && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Dropoff Service</span>
                  <span>IDR {selection.dropoff.rule.price.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">IDR {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Information</h3>
            
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={customer.full_name}
                onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="+62 xxx xxxx xxxx"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={customer.country}
                onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                placeholder="e.g., Indonesia"
                className="mt-1"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
