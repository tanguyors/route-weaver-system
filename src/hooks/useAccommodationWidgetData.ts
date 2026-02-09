import { useState, useEffect, useCallback, useRef } from 'react';

// In-memory cache
const accWidgetCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface AccommodationImage {
  id: string;
  image_url: string;
  display_order: number;
}

export interface PriceTierItem {
  min_nights: number;
  price_per_night: number;
}

export interface RoomItem {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  bed_type: string;
  quantity: number;
  price_per_night: number;
  currency: string;
  minimum_nights: number;
  amenities: any;
  images: AccommodationImage[];
  blocked_dates: string[];
  price_tiers: PriceTierItem[];
}

export interface AccommodationItem {
  id: string;
  name: string;
  type: string;
  description: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: any;
  city: string | null;
  country: string | null;
  price_per_night: number;
  currency: string;
  minimum_nights: number;
  checkin_time: string | null;
  checkout_time: string | null;
  images: AccommodationImage[];
  blocked_dates: string[];
  rooms: RoomItem[];
  price_tiers: PriceTierItem[];
}

export interface AccWidgetThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  button_text_color?: string;
  border_color?: string;
  logo_url?: string;
  partner_name?: string;
}

export interface AutomaticDiscount {
  id: string;
  category: string;
  discount_value: number;
  discount_value_type: string;
  min_nights: number | null;
  early_bird_days: number | null;
  last_minute_days: number | null;
  applicable_accommodation_ids: string[] | null;
}

export interface AccWidgetData {
  partner_id: string;
  theme_config: AccWidgetThemeConfig | null;
  accommodations: AccommodationItem[];
  automatic_discounts: AutomaticDiscount[];
}

function getEffectivePrice(tiers: PriceTierItem[], nights: number, basePrice: number): number {
  if (!tiers || tiers.length === 0) return basePrice;
  const applicable = tiers
    .filter(t => t.min_nights <= nights)
    .sort((a, b) => b.min_nights - a.min_nights);
  return applicable.length > 0 ? applicable[0].price_per_night : basePrice;
}

export const useAccommodationWidgetData = (widgetKey: string | null) => {
  const [data, setData] = useState<AccWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!widgetKey) {
      setError('No widget key provided');
      setLoading(false);
      return;
    }

    // Check cache
    const cached = accWidgetCache.get(widgetKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accommodation-widget-data?widget_key=${widgetKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend returned an unexpected response. Please try again later.');
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to load widget data');
      }

      const widgetData = await response.json();
      accWidgetCache.set(widgetKey, { data: widgetData, timestamp: Date.now() });
      setData(widgetData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [widgetKey]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [fetchData]);

  const isDateAvailable = useCallback(
    (accommodationId: string, date: string, roomId?: string): boolean => {
      if (!data) return false;
      const acc = data.accommodations.find((a) => a.id === accommodationId);
      if (!acc) return false;
      const today = new Date().toISOString().split('T')[0];
      if (date < today) return false;

      if (roomId) {
        const room = acc.rooms.find(r => r.id === roomId);
        if (!room) return false;
        return !room.blocked_dates.includes(date);
      }

      return !acc.blocked_dates.includes(date);
    },
    [data]
  );

  const isRangeAvailable = useCallback(
    (accommodationId: string, checkin: string, checkout: string, roomId?: string): boolean => {
      const dates = getDatesInRange(checkin, checkout);
      return dates.every((d) => isDateAvailable(accommodationId, d, roomId));
    },
    [isDateAvailable]
  );

  const calculatePrice = useCallback(
    (accommodationId: string, checkin: string, checkout: string, roomId?: string) => {
      if (!data) return { nights: 0, pricePerNight: 0, originalPricePerNight: 0, baseTotal: 0, currency: 'USD', tierApplied: false };
      const acc = data.accommodations.find((a) => a.id === accommodationId);
      if (!acc) return { nights: 0, pricePerNight: 0, originalPricePerNight: 0, baseTotal: 0, currency: 'USD', tierApplied: false };

      const nights = Math.round(
        (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
      );

      let basePrice = acc.price_per_night;
      let currency = acc.currency;
      let tiers = acc.price_tiers;

      if (roomId) {
        const room = acc.rooms.find(r => r.id === roomId);
        if (room) {
          basePrice = room.price_per_night;
          currency = room.currency;
          if (room.price_tiers && room.price_tiers.length > 0) {
            tiers = room.price_tiers;
          }
        }
      }

      const effectivePrice = getEffectivePrice(tiers, nights, basePrice);
      const tierApplied = effectivePrice !== basePrice;

      return {
        nights,
        pricePerNight: effectivePrice,
        originalPricePerNight: basePrice,
        baseTotal: effectivePrice * nights,
        currency,
        tierApplied,
      };
    },
    [data]
  );

  const createBooking = async (params: {
    accommodation_id: string;
    room_id?: string;
    checkin_date: string;
    checkout_date: string;
    guests_count: number;
    customer: { name: string; email?: string; phone?: string; country?: string };
    promo_code?: string;
  }) => {
    if (!widgetKey) throw new Error('No widget key');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-accommodation-booking`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widget_key: widgetKey,
          ...params,
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Booking failed');
    }
    return result;
  };

  return {
    data,
    loading,
    error,
    isDateAvailable,
    isRangeAvailable,
    calculatePrice,
    createBooking,
    refetch: fetchData,
  };
};

function getDatesInRange(checkin: string, checkout: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkin);
  const end = new Date(checkout);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
