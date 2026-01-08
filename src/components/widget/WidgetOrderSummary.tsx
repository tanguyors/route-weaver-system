import { MapPin, CalendarDays, Car, Bus } from 'lucide-react';
import { format } from 'date-fns';

interface TripInfo {
  routeName: string;
  originName: string;
  destName: string;
  date: string;
  time?: string;
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

interface WidgetOrderSummaryProps {
  outbound?: TripInfo;
  returnTrip?: TripInfo;
  pickups?: PickupInfo[];
  addonsTotal?: number;
  discountAmount?: number;
  promoCode?: string;
  primaryColor?: string;
}

export const WidgetOrderSummary = ({
  outbound,
  returnTrip,
  pickups = [],
  addonsTotal = 0,
  discountAmount = 0,
  promoCode,
  primaryColor = '#22c55e',
}: WidgetOrderSummaryProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const pickupsTotal = pickups.reduce((sum, p) => sum + p.price, 0);
  const subtotal = (outbound?.price || 0) + (returnTrip?.price || 0) + addonsTotal + pickupsTotal;
  const grandTotal = subtotal - discountAmount;

  const TripCard = ({ trip, isReturn }: { trip: TripInfo; isReturn?: boolean }) => (
    <div className="p-4 rounded-lg mb-3 text-white relative" style={{ backgroundColor: primaryColor }}>
      {/* Route header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-400" />
          <span className="font-bold">{trip.originName}</span>
        </div>
        <div className="flex-1 mx-3 border-t border-dashed border-white/50" />
        <span className="font-bold">{trip.destName}</span>
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-yellow-400" />
      </div>

      {/* Route details */}
      <div className="text-sm text-white/90 mb-1">
        {trip.originName} - {trip.destName}
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <CalendarDays className="w-3 h-3 text-yellow-400" />
        <span>{format(new Date(trip.date), 'dd MMM yyyy')}{trip.time ? ` - ${trip.time}` : ''}</span>
      </div>

      {/* Passengers */}
      <div className="text-sm mb-2">
        Adult x {trip.paxAdult}, Child x {trip.paxChild}, Infants x {trip.paxInfant}
      </div>

      {/* Price */}
      <div className="text-right">
        <span className="border border-white/30 px-3 py-1 rounded text-sm font-bold">
          {formatPrice(trip.price)}
        </span>
      </div>
    </div>
  );

  if (!outbound) {
    return (
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="text-center py-4 text-white font-bold text-lg">
          Tickets
        </div>
        <div className="p-4 text-center text-white/70">
          Select a trip to see summary
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div 
        className="text-center py-3 text-white font-bold text-lg"
        style={{ backgroundColor: primaryColor }}
      >
        Tickets
      </div>

      {/* Content */}
      <div className="p-4" style={{ backgroundColor: primaryColor, opacity: 0.9 }}>
        {outbound && <TripCard trip={outbound} />}
        {returnTrip && <TripCard trip={returnTrip} isReturn />}

        {/* Pickup/Dropoff services */}
        {pickups.length > 0 && (
          <div className="mt-2 space-y-2">
            {pickups.map((pickup, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/10 text-white text-sm"
              >
                <div className="flex items-center gap-2">
                  {pickup.vehicleType === 'car' ? (
                    <Car className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Bus className="w-4 h-4 text-yellow-400" />
                  )}
                  <div>
                    <div className="font-medium">
                      Pickup: {pickup.cityName}
                      {pickup.beforeDepartureMinutes && (
                        <span className="text-white/70 text-xs ml-1">
                          ({pickup.beforeDepartureMinutes} min before)
                        </span>
                      )}
                    </div>
                    {pickup.details && (
                      <div className="text-xs text-white/70">{pickup.details}</div>
                    )}
                  </div>
                </div>
                <span className="font-bold">{formatPrice(pickup.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div 
        className="p-4 flex items-center justify-between text-white"
        style={{ backgroundColor: '#0ea5e9' }}
      >
        <span className="font-bold text-lg">Grand Total</span>
        <span className="font-bold text-xl">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );
};
