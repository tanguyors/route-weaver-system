import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Trash2, Ship, Car, Bus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWidgetLanguage, useWidgetCurrency } from '@/contexts/WidgetLanguageContext';
import { GooglePlacesAutocomplete, PlaceResult } from './GooglePlacesAutocomplete';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

export interface CartItem {
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
  route?: Route;
  originName: string;
  destName: string;
  originPortId: string;
  destPortId: string;
  pricing: { adult: number; child: number };
  direction: 'outbound' | 'return';
}

interface CartItemCardProps {
  item: CartItem;
  boat: Boat | null;
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  primaryColor: string;
  availablePickups: PickupDropoffRule[];
  pickupEnabled: boolean;
  pickupRuleId: string;
  pickupVehicleType: VehicleType;
  pickupDetails: string;
  isDropoff?: boolean;
  onRemoveItem: (id: string) => void;
  onOpenBoatInfo: (boat: Boat) => void;
  onTogglePickup: () => void;
  onPickupRuleChange: (ruleId: string) => void;
  onVehicleTypeChange: (type: VehicleType) => void;
  onPickupDetailsChange: (details: string) => void;
}

export const CartItemCard = ({
  item,
  boat,
  paxAdult,
  paxChild,
  paxInfant,
  primaryColor,
  availablePickups,
  pickupEnabled,
  pickupRuleId,
  pickupVehicleType,
  pickupDetails,
  isDropoff = false,
  onRemoveItem,
  onOpenBoatInfo,
  onTogglePickup,
  onPickupRuleChange,
  onVehicleTypeChange,
  onPickupDetailsChange,
}: CartItemCardProps) => {
  const { t } = useWidgetLanguage();
  const { formatPrice } = useWidgetCurrency();

  const calculateItemTotal = () => {
    return (paxAdult * item.pricing.adult) + (paxChild * item.pricing.child);
  };

  const calculateArrivalTime = (departureTime: string, durationMinutes: number | null): string => {
    if (!durationMinutes) return '--:--';
    
    const [hours, minutes] = departureTime.slice(0, 5).split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(hours, minutes, 0, 0);
    
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);
    const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
    const arrivalMinutes = arrivalDate.getMinutes().toString().padStart(2, '0');
    
    return `${arrivalHours}:${arrivalMinutes}`;
  };

  const total = calculateItemTotal();
  const arrivalTime = calculateArrivalTime(item.departure.departure_time, item.route?.duration_minutes ?? null);

  const selectedPickupRule = pickupRuleId !== NONE
    ? availablePickups.find(r => r.id === pickupRuleId)
    : undefined;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-3 sm:p-4 mb-4 overflow-hidden">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div 
            className="w-0 h-0 border-l-[10px] sm:border-l-[12px] border-t-[10px] sm:border-t-[12px] border-b-[10px] sm:border-b-[12px] border-l-transparent border-b-transparent shrink-0"
            style={{ borderTopColor: primaryColor }}
          />
          <div className="flex items-center gap-1 sm:gap-2 min-w-0" style={{ color: primaryColor }}>
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">
              {format(new Date(item.departure.departure_date), 'EEE, dd MMM yyyy')}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(item.id)}
          className="text-gray-700 hover:text-red-600 shrink-0 px-2 sm:px-3"
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('delete')}</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Boat Image & Info */}
        <div className="w-full sm:w-32 md:w-44 shrink-0">
          <div className="h-24 sm:h-28 rounded-lg overflow-hidden bg-gray-100">
            {boat?.image_url ? (
              <img 
                src={boat.image_url} 
                alt={boat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Ship className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
              </div>
            )}
          </div>
          {/* Boat Name */}
          <p className="text-center text-xs sm:text-sm font-medium text-gray-700 mt-2 truncate">
            {boat?.name || 'Boat'}
          </p>
          {/* Boat Info Button */}
          {boat && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenBoatInfo(boat)}
              className="w-full mt-2 text-xs"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Info className="h-3 w-3 mr-1" />
              {t('boatInfo')}
            </Button>
          )}
        </div>

        {/* Trip Info */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-bold text-sm sm:text-lg mb-2 truncate"
            style={{ color: primaryColor }}
          >
            {item.trip?.trip_name || 'Trip'}
          </h3>

          {/* Times */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 mb-2">
            <div className="shrink-0">
              <div className="text-base sm:text-xl font-bold">{item.departure.departure_time.slice(0, 5)}</div>
              <div style={{ color: primaryColor }} className="text-xs sm:text-sm truncate max-w-[70px] sm:max-w-none">{item.originName}</div>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-gray-300 relative min-w-[30px]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
            </div>
            <div className="text-right shrink-0">
              <div className="text-base sm:text-xl font-bold">{arrivalTime}</div>
              <div style={{ color: primaryColor }} className="text-xs sm:text-sm truncate max-w-[70px] sm:max-w-none">{item.destName}</div>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-xs sm:text-sm text-gray-500 truncate">
              Adult X {paxAdult}, Child X {paxChild}, Infants X {paxInfant}
            </span>
            <span className="font-bold text-sm sm:text-base" style={{ color: primaryColor }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Shuttle option */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] sm:text-xs shrink-0">i</span>
            <span className="truncate">{isDropoff ? t('privateDropoff') : t('privatePickup')}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            style={{ borderColor: primaryColor, color: primaryColor }}
            onClick={onTogglePickup}
            disabled={availablePickups.length === 0}
          >
            <span
              aria-hidden="true"
              className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 rounded border flex items-center justify-center shrink-0",
                pickupEnabled ? "border-transparent" : "border-gray-300"
              )}
              style={pickupEnabled ? { backgroundColor: primaryColor } : undefined}
            >
              {pickupEnabled && (
                <span className="text-white text-[8px] sm:text-[10px] leading-none">✓</span>
              )}
            </span>
            {isDropoff ? t('dropoff') : t('pickup')}
          </Button>
        </div>

        {/* Pickup/Dropoff options (shown when enabled) */}
        {pickupEnabled && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold mb-2" style={{ color: primaryColor }}>
              {isDropoff ? t('dropoffOptions') : t('pickupOptions')}
            </div>
            {availablePickups.length === 0 ? (
              <p className="text-sm text-gray-500">{isDropoff ? t('noDropoffAvailable') : t('noPickupAvailable')}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">{isDropoff ? t('dropoffArea') : t('pickupArea')}</div>
                    <Select
                      value={pickupRuleId}
                      onValueChange={(v) => {
                        onPickupRuleChange(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isDropoff ? t('selectDropoff') : t('selectPickup')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>{isDropoff ? t('selectDropoff') : t('selectPickup')}</SelectItem>
                        {availablePickups.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.city_name} {!isDropoff && r.before_departure_minutes ? `(${r.before_departure_minutes} min before)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">{t('hotelAddress')}</div>
                    {GOOGLE_MAPS_API_KEY ? (
                      <GooglePlacesAutocomplete
                        value={pickupDetails}
                        onChange={(value) => onPickupDetailsChange(value)}
                        placeholder={t('enterHotelAddress')}
                        apiKey={GOOGLE_MAPS_API_KEY}
                        country="id"
                        disabled={pickupRuleId === NONE}
                      />
                    ) : (
                      <Input
                        placeholder={t('enterHotelAddress')}
                        value={pickupDetails}
                        onChange={(e) => onPickupDetailsChange(e.target.value)}
                        disabled={pickupRuleId === NONE}
                      />
                    )}
                  </div>
                </div>

                {selectedPickupRule && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-2">{t('numberOfPassengers')}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => onVehicleTypeChange('car')}
                        className={cn(
                          'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                          pickupVehicleType === 'car'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Car className="h-5 w-5" />
                        <span>{t('car')} ({t('maxPax', { count: 4 })})</span>
                        <span className="text-xs opacity-75">
                          IDR {Number(selectedPickupRule.car_price ?? 0).toLocaleString()} {t('forOneWay')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onVehicleTypeChange('bus')}
                        className={cn(
                          'rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all flex flex-col items-center gap-1',
                          pickupVehicleType === 'bus'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Bus className="h-5 w-5" />
                        <span>{t('minibus')} ({t('maxPax', { count: 10 })})</span>
                        <span className="text-xs opacity-75">
                          IDR {Number(selectedPickupRule.bus_price ?? 0).toLocaleString()} {t('forOneWay')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
