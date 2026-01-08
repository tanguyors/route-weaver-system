import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Trash2, Ship, Car, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WidgetOrderSummary } from './WidgetOrderSummary';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Boat {
  id: string;
  name: string;
  image_url: string | null;
}

interface Trip {
  id: string;
  route_id: string;
  trip_name: string;
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

type VehicleType = 'car' | 'bus';

const NONE = '__none__';

interface CartItem {
  id: string;
  departure: {
    id: string;
    trip_id: string;
    route_id: string;
    departure_date: string;
    departure_time: string;
    boat_id: string | null;
  };
  trip: Trip | undefined;
  originName: string;
  destName: string;
  originPortId: string;
  destPortId: string;
  pricing: { adult: number; child: number };
  direction: 'outbound' | 'return';
}

export interface SelectedPickupInfo {
  cityName: string;
  vehicleType: 'car' | 'bus';
  price: number;
  details?: string;
  beforeDepartureMinutes?: number;
}

interface WidgetShoppingCartProps {
  items: CartItem[];
  boats: Boat[];
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  onRemoveItem: (id: string) => void;
  onProceed: () => void;
  onBack: () => void;
  pickupDropoffRules?: PickupDropoffRule[];
  onPickupsChange?: (pickups: SelectedPickupInfo[]) => void;
  primaryColor?: string;
}

export const WidgetShoppingCart = ({
  items,
  boats,
  paxAdult,
  paxChild,
  paxInfant,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  onRemoveItem,
  onProceed,
  onBack,
  pickupDropoffRules = [],
  onPickupsChange,
  primaryColor = '#22c55e',
}: WidgetShoppingCartProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getBoat = (boatId: string | null) => {
    if (!boatId) return null;
    return boats.find(b => b.id === boatId);
  };

  const calculateItemTotal = (item: CartItem) => {
    return (paxAdult * item.pricing.adult) + (paxChild * item.pricing.child);
  };

  const pickupRulesByPort = useMemo(() => {
    const map = new Map<string, PickupDropoffRule[]>();
    for (const rule of pickupDropoffRules) {
      if (rule.service_type !== 'pickup') continue;
      const list = map.get(rule.from_port_id) || [];
      list.push(rule);
      map.set(rule.from_port_id, list);
    }
    return map;
  }, [pickupDropoffRules]);

  const [pickupEnabledByItem, setPickupEnabledByItem] = useState<Record<string, boolean>>({});
  const [pickupRuleIdByItem, setPickupRuleIdByItem] = useState<Record<string, string>>({});
  const [pickupVehicleTypeByItem, setPickupVehicleTypeByItem] = useState<Record<string, VehicleType>>({});
  const [pickupDetailsByItem, setPickupDetailsByItem] = useState<Record<string, string>>({});

  const CartItemCard = ({ item }: { item: CartItem }) => {
    const boat = getBoat(item.departure.boat_id);
    const total = calculateItemTotal(item);

    const pickupEnabled = pickupEnabledByItem[item.id] ?? false;
    const pickupRuleId = pickupRuleIdByItem[item.id] ?? NONE;
    const pickupVehicleType = pickupVehicleTypeByItem[item.id] ?? 'car';
    const pickupDetails = pickupDetailsByItem[item.id] ?? '';

    const availablePickups = pickupRulesByPort.get(item.originPortId) || [];
    const selectedPickupRule = pickupRuleId !== NONE
      ? availablePickups.find(r => r.id === pickupRuleId)
      : undefined;

    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-4">
        {/* Date Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-0 h-0 border-l-[12px] border-t-[12px] border-b-[12px] border-l-transparent border-b-transparent"
              style={{ borderTopColor: item.direction === 'outbound' ? primaryColor : '#3b82f6' }}
            />
            <div className="flex items-center gap-2" style={{ color: primaryColor }}>
              <CalendarDays className="w-4 h-4" />
              <span className="font-medium">
                {format(new Date(item.departure.departure_date), 'EEE, dd MMM yyyy')}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(item.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>

        <div className="flex gap-4">
          {/* Boat Image */}
          <div className="w-44 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {boat?.image_url ? (
              <img 
                src={boat.image_url} 
                alt={boat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Ship className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Trip Info */}
          <div className="flex-1">
            <h3 
              className="font-bold text-lg mb-2"
              style={{ color: primaryColor }}
            >
              {item.trip?.trip_name || 'Trip'}
            </h3>

            {/* Times */}
            <div className="flex items-center gap-6 mb-2">
              <div>
                <div className="text-xl font-bold">{item.departure.departure_time.slice(0, 5)}</div>
                <div style={{ color: primaryColor }} className="text-sm">{item.originName}</div>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              <div className="text-right">
                <div className="text-xl font-bold">--:--</div>
                <div style={{ color: primaryColor }} className="text-sm">{item.destName}</div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Adult X {paxAdult}, Child X {paxChild}, Infants X {paxInfant}
              </span>
              <span className="font-bold" style={{ color: primaryColor }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shuttle option */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-end gap-4">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs">i</span>
              Shuttle Rates
            </span>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              style={{ borderColor: primaryColor, color: primaryColor }}
              onClick={() => {
                const next = !pickupEnabled;
                setPickupEnabledByItem(prev => ({ ...prev, [item.id]: next }));
                if (!next) {
                  setPickupRuleIdByItem(prev => ({ ...prev, [item.id]: NONE }));
                  setPickupVehicleTypeByItem(prev => ({ ...prev, [item.id]: 'car' }));
                  setPickupDetailsByItem(prev => ({ ...prev, [item.id]: '' }));
                }
              }}
              disabled={availablePickups.length === 0}
            >
              <input
                type="checkbox"
                checked={pickupEnabled}
                readOnly
                className="w-4 h-4"
              />
              Pick Up
            </Button>
          </div>

          {/* Pickup options (shown when enabled) */}
          {pickupEnabled && availablePickups.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                Pickup options
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Pickup area</div>
                  <Select
                    value={pickupRuleId}
                    onValueChange={(v) => {
                      setPickupRuleIdByItem(prev => ({ ...prev, [item.id]: v }));
                      if (v === NONE) {
                        setPickupVehicleTypeByItem(prev => ({ ...prev, [item.id]: 'car' }));
                        setPickupDetailsByItem(prev => ({ ...prev, [item.id]: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select pickup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Select pickup</SelectItem>
                      {availablePickups.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.city_name} {r.before_departure_minutes ? `(${r.before_departure_minutes} min before)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Hotel / Address</div>
                  <Input
                    placeholder="Enter your hotel or address"
                    value={pickupDetails}
                    onChange={(e) => setPickupDetailsByItem(prev => ({ ...prev, [item.id]: e.target.value }))}
                    disabled={pickupRuleId === NONE}
                  />
                </div>
              </div>

              {selectedPickupRule && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">Number of passengers</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPickupVehicleTypeByItem(prev => ({ ...prev, [item.id]: 'car' }))}
                      className={cn(
                        'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                        pickupVehicleType === 'car'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Car className="h-5 w-5" />
                      <span>Car (max 4 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedPickupRule.car_price ?? 0).toLocaleString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupVehicleTypeByItem(prev => ({ ...prev, [item.id]: 'bus' }))}
                      className={cn(
                        'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                        pickupVehicleType === 'bus'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Bus className="h-5 w-5" />
                      <span>Minibus (max 10 pax)</span>
                      <span className="text-xs opacity-75">
                        +IDR {Number(selectedPickupRule.bus_price ?? 0).toLocaleString()}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate totals for order summary
  const outboundItem = items.find(i => i.direction === 'outbound');
  const returnItem = items.find(i => i.direction === 'return');

  const outboundSummary = outboundItem ? {
    routeName: `${outboundItem.originName} - ${outboundItem.destName}`,
    originName: outboundItem.originName,
    destName: outboundItem.destName,
    date: outboundItem.departure.departure_date,
    time: outboundItem.departure.departure_time?.slice(0, 5),
    paxAdult,
    paxChild,
    paxInfant,
    price: calculateItemTotal(outboundItem),
  } : undefined;

  const returnSummary = returnItem ? {
    routeName: `${returnItem.originName} - ${returnItem.destName}`,
    originName: returnItem.originName,
    destName: returnItem.destName,
    date: returnItem.departure.departure_date,
    time: returnItem.departure.departure_time?.slice(0, 5),
    paxAdult,
    paxChild,
    paxInfant,
    price: calculateItemTotal(returnItem),
  } : undefined;

  // Collect selected pickups for order summary
  const selectedPickups = useMemo(() => {
    const result: SelectedPickupInfo[] = [];
    for (const item of items) {
      const enabled = pickupEnabledByItem[item.id];
      const ruleId = pickupRuleIdByItem[item.id];
      if (enabled && ruleId && ruleId !== NONE) {
        const availablePickups = pickupRulesByPort.get(item.originPortId) || [];
        const rule = availablePickups.find(r => r.id === ruleId);
        if (rule) {
          const vehicleType = pickupVehicleTypeByItem[item.id] || 'car';
          const price = vehicleType === 'car' ? rule.car_price : rule.bus_price;
          result.push({
            cityName: rule.city_name,
            vehicleType,
            price,
            details: pickupDetailsByItem[item.id] || undefined,
            beforeDepartureMinutes: rule.before_departure_minutes,
          });
        }
      }
    }
    return result;
  }, [items, pickupEnabledByItem, pickupRuleIdByItem, pickupVehicleTypeByItem, pickupDetailsByItem, pickupRulesByPort]);

  // Notify parent when pickups change
  useEffect(() => {
    onPickupsChange?.(selectedPickups);
  }, [selectedPickups, onPickupsChange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <Ship className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm mt-1">Select trips to add them to your cart</p>
          </div>
        ) : (
          items.map(item => (
            <CartItemCard key={item.id} item={item} />
          ))
        )}

        {/* Promo Code */}
        <div className="bg-white rounded-lg border p-4 mt-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Promotional Code</span>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                onClick={onApplyPromo}
                className="text-white"
                style={{ backgroundColor: '#0ea5e9' }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 py-6 text-lg"
          >
            Book other trip
          </Button>
          <Button
            onClick={onProceed}
            disabled={items.length === 0}
            className="flex-1 py-6 text-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <WidgetOrderSummary
          outbound={outboundSummary}
          returnTrip={returnSummary}
          pickups={selectedPickups}
          primaryColor={primaryColor}
        />
      </div>
    </div>
  );
};
