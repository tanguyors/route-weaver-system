import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, ChevronLeft, Minus, Plus, Tag } from 'lucide-react';

interface BookingStepPassengersProps {
  adultPrice: number;
  childPrice: number;
  maxSeats: number;
  onConfirm: (paxAdult: number, paxChild: number, promoCode: string) => void;
  onBack: () => void;
}

export const BookingStepPassengers = ({
  adultPrice,
  childPrice,
  maxSeats,
  onConfirm,
  onBack,
}: BookingStepPassengersProps) => {
  const [paxAdult, setPaxAdult] = useState(1);
  const [paxChild, setPaxChild] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  const totalPax = paxAdult + paxChild;
  const subtotal = (paxAdult * adultPrice) + (paxChild * childPrice);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAdultChange = (delta: number) => {
    const newValue = paxAdult + delta;
    if (newValue >= 1 && newValue + paxChild <= maxSeats) {
      setPaxAdult(newValue);
    }
  };

  const handleChildChange = (delta: number) => {
    const newValue = paxChild + delta;
    if (newValue >= 0 && paxAdult + newValue <= maxSeats) {
      setPaxChild(newValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Passengers
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adult Counter */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Adults</div>
            <div className="text-sm text-muted-foreground">
              {formatPrice(adultPrice)} per person
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAdultChange(-1)}
              disabled={paxAdult <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold text-lg">{paxAdult}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAdultChange(1)}
              disabled={totalPax >= maxSeats}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Child Counter */}
        {childPrice > 0 && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Children</div>
              <div className="text-sm text-muted-foreground">
                {formatPrice(childPrice)} per child
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleChildChange(-1)}
                disabled={paxChild <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{paxChild}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleChildChange(1)}
                disabled={totalPax >= maxSeats}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Promo Code */}
        <div>
          <Label htmlFor="promo" className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4" />
            Promo Code (optional)
          </Label>
          <Input
            id="promo"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          />
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between mb-2">
            <span>{paxAdult} Adult(s)</span>
            <span>{formatPrice(paxAdult * adultPrice)}</span>
          </div>
          {paxChild > 0 && (
            <div className="flex justify-between mb-2">
              <span>{paxChild} Child(ren)</span>
              <span>{formatPrice(paxChild * childPrice)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Subtotal</span>
            <span className="text-primary">{formatPrice(subtotal)}</span>
          </div>
          {promoCode && (
            <p className="text-xs text-muted-foreground mt-2">
              Promo code will be applied at checkout
            </p>
          )}
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={() => onConfirm(paxAdult, paxChild, promoCode)}
        >
          Continue to Details
        </Button>
      </CardContent>
    </Card>
  );
};
