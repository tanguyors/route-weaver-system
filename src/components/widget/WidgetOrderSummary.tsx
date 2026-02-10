import { MapPin, CalendarDays, Car, Bus, Gift, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useWidgetCurrency } from '@/contexts/WidgetLanguageContext';
interface TripInfo {
  routeName: string;
  originName: string;
  destName: string;
  date: string;
  time?: string;
  arrivalTime?: string;
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  price: number;
  departureTime?: string;
}

interface PickupInfo {
  cityName: string;
  vehicleType: 'car' | 'bus';
  price: number;
  details?: string;
  hotelAddress?: string;
  beforeDepartureMinutes?: number;
  serviceType?: 'pickup' | 'dropoff';
}

interface ActivityAddonInfo {
  addon_id: string;
  name: string;
  price: number;
  pricing_type: 'included' | 'normal';
}

interface WidgetOrderSummaryProps {
  outbound?: TripInfo;
  returnTrip?: TripInfo;
  pickups?: PickupInfo[];
  activityAddons?: ActivityAddonInfo[];
  addonsTotal?: number;
  discountAmount?: number;
  promoCode?: string;
  primaryColor?: string;
  isPrivateBoat?: boolean;
}

export const WidgetOrderSummary = ({
  outbound,
  returnTrip,
  pickups = [],
  activityAddons = [],
  addonsTotal = 0,
  discountAmount = 0,
  promoCode,
  primaryColor = '#1B5E3B',
  isPrivateBoat = false,
}: WidgetOrderSummaryProps) => {
  const { formatPrice } = useWidgetCurrency();

  // Calculate pickup time: departure time - beforeDepartureMinutes
  const calcPickupTime = (departureTime: string | undefined, beforeMinutes: number | undefined): string | null => {
    if (!departureTime || !beforeMinutes) return null;
    const [hours, minutes] = departureTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const totalMin = hours * 60 + minutes - beforeMinutes;
    const h = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60);
    const m = ((totalMin % 1440) + 1440) % 1440 % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // For private boats, pickups are included (price = 0 in total)
  const pickupsTotal = isPrivateBoat ? 0 : pickups.reduce((sum, p) => sum + p.price, 0);
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
        <span>
          {format(new Date(trip.date), 'dd MMM yyyy')}
          {trip.time ? ` - ${trip.time}` : ''}
          {trip.arrivalTime ? ` → ${trip.arrivalTime}` : ''}
        </span>
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

        {/* Activity Add-ons */}
        {activityAddons.length > 0 && (
          <div className="mt-2 space-y-2">
            {activityAddons.map((addon) => (
              <div 
                key={addon.addon_id} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/10 text-white text-sm"
              >
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">{addon.name}</span>
                </div>
                {addon.pricing_type === 'included' ? (
                  <div className="text-right">
                    <span className="line-through text-white/50 text-xs mr-2">
                      {formatPrice(addon.price)}
                    </span>
                    <span className="font-bold text-yellow-400">Included</span>
                  </div>
                ) : (
                  <span className="font-bold">{formatPrice(addon.price)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pickup/Dropoff services */}
        {pickups.length > 0 && (
          <div className="mt-2 space-y-2">
            {pickups.map((pickup, idx) => {
              const isPickup = pickup.serviceType !== 'dropoff';
              const pickupTime = isPickup
                ? calcPickupTime(outbound?.time, pickup.beforeDepartureMinutes)
                : null;
              const timeLabel = isPickup
                ? pickupTime ? `at: ${pickupTime}` : ''
                : 'at: arrival time';

              return (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg bg-white/15 text-white"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {pickup.vehicleType === 'car' ? (
                        <Car className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Bus className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-bold text-base">
                        {isPickup ? 'Pickup' : 'DropOff'}: {pickup.cityName}
                        {timeLabel && (
                          <span className="font-normal text-white/90 ml-1">
                            ( {timeLabel} )
                          </span>
                        )}
                      </span>
                    </div>
                    {isPrivateBoat ? (
                      <div className="text-right">
                        <span className="line-through text-white/50 text-xs mr-2">
                          {formatPrice(pickup.price)}
                        </span>
                        <span className="font-bold text-yellow-400">Included</span>
                      </div>
                    ) : (
                      <span className="font-bold text-base">{formatPrice(pickup.price)}</span>
                    )}
                  </div>
                  <div className="text-sm text-white/70 italic ml-7">
                    {isPickup
                      ? 'Noted: Check-in 1 Hour before Departure time'
                      : 'Noted: Driver with your full name plate at arrival port'}
                  </div>
                  {pickup.hotelAddress && (
                    <div className="text-xs text-white/70 mt-1 ml-7">
                      📍 {pickup.hotelAddress}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div 
        className="p-4 flex items-center justify-between text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="font-bold text-lg">Grand Total</span>
        <span className="font-bold text-xl">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );
};
