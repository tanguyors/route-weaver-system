import { useMemo, useState, useEffect } from 'react';
import { Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WidgetOrderSummary } from './WidgetOrderSummary';
import { BoatInfoModal } from './BoatInfoModal';
import { CartItemCard, CartItem } from './CartItemCard';

interface Boat {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  image_url: string | null;
  images?: string[] | null;
}

interface Trip {
  id: string;
  route_id: string;
  trip_name: string;
  description?: string | null;
}

interface Route {
  id: string;
  origin_port_id: string;
  destination_port_id: string;
  duration_minutes: number | null;
}

interface Port {
  id: string;
  name: string;
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
  ports?: Port[];
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
  ports = [],
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
  primaryColor = '#1B5E3B',
}: WidgetShoppingCartProps) => {

  const getBoat = (boatId: string | null) => {
    if (!boatId) return null;
    return boats.find(b => b.id === boatId) || null;
  };

  const calculateItemTotal = (item: CartItem) => {
    return (paxAdult * item.pricing.adult) + (paxChild * item.pricing.child);
  };

  const getPort = (portId: string) => ports.find(p => p.id === portId);

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

  // Boat info modal state
  const [boatInfoModal, setBoatInfoModal] = useState<{
    open: boolean;
    boat: Boat | null;
    trip: Trip | undefined;
    route: Route | undefined;
    departure: CartItem['departure'] | null;
    pricing: { adult: number; child: number };
  } | null>(null);

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
        const originPortId = item.route?.origin_port_id || item.originPortId;
        const availablePickups = pickupRulesByPort.get(originPortId) || [];
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

  const handleTogglePickup = (itemId: string) => {
    const current = pickupEnabledByItem[itemId] ?? false;
    const next = !current;
    setPickupEnabledByItem(prev => ({ ...prev, [itemId]: next }));
    if (!next) {
      setPickupRuleIdByItem(prev => ({ ...prev, [itemId]: NONE }));
      setPickupVehicleTypeByItem(prev => ({ ...prev, [itemId]: 'car' }));
      setPickupDetailsByItem(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const handlePickupRuleChange = (itemId: string, ruleId: string) => {
    setPickupRuleIdByItem(prev => ({ ...prev, [itemId]: ruleId }));
    if (ruleId === NONE) {
      setPickupVehicleTypeByItem(prev => ({ ...prev, [itemId]: 'car' }));
      setPickupDetailsByItem(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const handleVehicleTypeChange = (itemId: string, type: VehicleType) => {
    setPickupVehicleTypeByItem(prev => ({ ...prev, [itemId]: type }));
  };

  const handlePickupDetailsChange = (itemId: string, details: string) => {
    setPickupDetailsByItem(prev => ({ ...prev, [itemId]: details }));
  };

  const handleOpenBoatInfo = (item: CartItem, boat: Boat) => {
    setBoatInfoModal({
      open: true,
      boat,
      trip: item.trip,
      route: item.route,
      departure: item.departure,
      pricing: item.pricing,
    });
  };

  return (
    <>
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
            items.map(item => {
              const originPortId = item.route?.origin_port_id || item.originPortId;
              const availablePickups = pickupRulesByPort.get(originPortId) || [];

              return (
                <CartItemCard
                  key={item.id}
                  item={item}
                  boat={getBoat(item.departure.boat_id)}
                  paxAdult={paxAdult}
                  paxChild={paxChild}
                  paxInfant={paxInfant}
                  primaryColor={primaryColor}
                  availablePickups={availablePickups}
                  pickupEnabled={pickupEnabledByItem[item.id] ?? false}
                  pickupRuleId={pickupRuleIdByItem[item.id] ?? NONE}
                  pickupVehicleType={pickupVehicleTypeByItem[item.id] ?? 'car'}
                  pickupDetails={pickupDetailsByItem[item.id] ?? ''}
                  onRemoveItem={onRemoveItem}
                  onOpenBoatInfo={(boat) => handleOpenBoatInfo(item, boat)}
                  onTogglePickup={() => handleTogglePickup(item.id)}
                  onPickupRuleChange={(ruleId) => handlePickupRuleChange(item.id, ruleId)}
                  onVehicleTypeChange={(type) => handleVehicleTypeChange(item.id, type)}
                  onPickupDetailsChange={(details) => handlePickupDetailsChange(item.id, details)}
                />
              );
            })
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
                  type="button"
                  onClick={onApplyPromo}
                  className="text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 py-6 text-lg"
            >
              Book other trip
            </Button>
            <Button
              type="button"
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

      {/* Boat Info Modal */}
      {boatInfoModal && (
        <BoatInfoModal
          open={boatInfoModal.open}
          onClose={() => setBoatInfoModal(null)}
          onSelectTrip={() => setBoatInfoModal(null)}
          boat={boatInfoModal.boat}
          trip={boatInfoModal.trip}
          route={boatInfoModal.route}
          originPort={boatInfoModal.route ? getPort(boatInfoModal.route.origin_port_id) : null}
          destPort={boatInfoModal.route ? getPort(boatInfoModal.route.destination_port_id) : null}
          departureTime={boatInfoModal.departure?.departure_time}
          departureDate={boatInfoModal.departure?.departure_date}
          pricing={boatInfoModal.pricing}
          paxAdult={paxAdult}
          paxChild={paxChild}
          primaryColor={primaryColor}
          hideSelectButton
        />
      )}
    </>
  );
};
