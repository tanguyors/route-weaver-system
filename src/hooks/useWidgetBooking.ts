import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Port {
  id: string;
  name: string;
  area: string;
}

interface Route {
  id: string;
  route_name: string;
  origin_port_id: string;
  destination_port_id: string;
  duration_minutes: number | null;
}

interface Trip {
  id: string;
  route_id: string;
  trip_name: string;
  description: string | null;
}

interface PriceRule {
  id: string;
  trip_id: string;
  adult_price: number;
  child_price: number | null;
  rule_type: string;
  start_date: string | null;
  end_date: string | null;
}

interface Departure {
  id: string;
  trip_id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  status: string;
}

export interface PickupZone {
  id: string;
  addon_id: string;
  zone_name: string;
  price_override: number | null;
}

export interface WidgetAddon {
  id: string;
  name: string;
  description: string | null;
  type: 'pickup' | 'generic';
  pricing_model: 'per_person' | 'per_booking';
  price: number;
  is_mandatory: boolean | null;
  enable_pickup_zones: boolean | null;
  pickup_required_info: {
    hotel_name?: boolean;
    address?: boolean;
    pickup_note?: boolean;
  } | null;
  applicability: 'fastboat' | 'activities' | 'both';
  applicable_route_ids: string[] | null;
  applicable_trip_ids: string[] | null;
  applicable_schedule_ids: string[] | null;
  pickup_zones: PickupZone[];
}

export interface SelectedAddon {
  addon_id: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  pickup_zone_id?: string;
  pickup_zone_name?: string;
  pickup_info?: {
    hotel_name?: string;
    address?: string;
    pickup_note?: string;
  };
}

export interface WidgetData {
  partner_id: string;
  ports: Port[];
  routes: Route[];
  trips: Trip[];
  price_rules: PriceRule[];
  departures: Departure[];
  addons: WidgetAddon[];
}

export interface BookingDetails {
  departure: Departure | null;
  route: Route | null;
  trip: Trip | null;
  pax_adult: number;
  pax_child: number;
  adult_price: number;
  child_price: number;
  subtotal: number;
  discount: number;
  total: number;
  promo_code: string;
}

export const useWidgetBooking = (widgetKey: string | null) => {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Fetch data only once on mount - filter client-side for better UX
  const fetchData = useCallback(async () => {
    if (!widgetKey) {
      setError('No widget key provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-data?widget_key=${widgetKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to load widget data');
      }

      const widgetData = await response.json();
      setData(widgetData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  }, [widgetKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAvailableDestinations = () => {
    if (!data || !selectedOrigin) return [];
    const routeDestinations = data.routes
      .filter(r => r.origin_port_id === selectedOrigin)
      .map(r => r.destination_port_id);
    return data.ports.filter(p => routeDestinations.includes(p.id));
  };

  const getAvailableDepartures = () => {
    if (!data || !selectedOrigin || !selectedDestination) return [];
    
    const matchingRoutes = data.routes.filter(
      r => r.origin_port_id === selectedOrigin && r.destination_port_id === selectedDestination
    );
    const routeIds = matchingRoutes.map(r => r.id);
    
    // Filter by route and date client-side
    return data.departures.filter(d => {
      const matchesRoute = routeIds.includes(d.route_id);
      const matchesDate = !selectedDate || d.departure_date >= selectedDate;
      return matchesRoute && matchesDate;
    });
  };

  const getApplicableAddons = (routeId: string, tripId: string): WidgetAddon[] => {
    if (!data) return [];
    
    return data.addons.filter(addon => {
      // Check applicability to fastboat (widget type)
      if (addon.applicability !== 'both' && addon.applicability !== 'fastboat') {
        return false;
      }
      
      // If no specific routes/trips are set, addon applies to all
      const hasRouteRestriction = addon.applicable_route_ids && addon.applicable_route_ids.length > 0;
      const hasTripRestriction = addon.applicable_trip_ids && addon.applicable_trip_ids.length > 0;
      
      if (!hasRouteRestriction && !hasTripRestriction) {
        return true;
      }
      
      // Check if route matches
      if (hasRouteRestriction && addon.applicable_route_ids!.includes(routeId)) {
        return true;
      }
      
      // Check if trip matches
      if (hasTripRestriction && addon.applicable_trip_ids!.includes(tripId)) {
        return true;
      }
      
      return false;
    });
  };

  const getPricing = (tripId: string, date: string) => {
    if (!data) return { adult: 0, child: 0 };
    
    let adultPrice = 0;
    let childPrice = 0;

    const rules = data.price_rules.filter(r => r.trip_id === tripId);
    
    for (const rule of rules) {
      if (rule.rule_type === 'seasonal' && rule.start_date && rule.end_date) {
        if (date >= rule.start_date && date <= rule.end_date) {
          adultPrice = rule.adult_price;
          childPrice = rule.child_price || 0;
          break;
        }
      } else if (rule.rule_type === 'base') {
        adultPrice = rule.adult_price;
        childPrice = rule.child_price || 0;
      }
    }

    return { adult: adultPrice, child: childPrice };
  };

  const createBooking = async (
    departureId: string,
    customer: { full_name: string; phone?: string; email?: string; country?: string },
    paxAdult: number,
    paxChild: number,
    promoCode?: string,
    selectedAddons?: SelectedAddon[]
  ) => {
    if (!widgetKey) throw new Error('No widget key');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widget_key: widgetKey,
          departure_id: departureId,
          customer,
          pax_adult: paxAdult,
          pax_child: paxChild,
          promo_code: promoCode,
          addons: selectedAddons,
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
    selectedOrigin,
    setSelectedOrigin,
    selectedDestination,
    setSelectedDestination,
    selectedDate,
    setSelectedDate,
    getAvailableDestinations,
    getAvailableDepartures,
    getApplicableAddons,
    getPricing,
    createBooking,
    refetch: fetchData,
  };
};
