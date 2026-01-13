import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Port {
  id: string;
  name: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Route {
  id: string;
  partner_id: string;
  origin_port_id: string;
  destination_port_id: string;
  route_name: string;
  duration_minutes: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  origin_port?: Port;
  destination_port?: Port;
}

export interface Trip {
  id: string;
  partner_id: string;
  route_id: string;
  trip_name: string;
  description: string | null;
  capacity_default: number;
  status: 'active' | 'inactive';
  created_at: string;
  route?: Route;
  adult_price?: number;
  child_price?: number;
}

export interface DepartureTemplate {
  id: string;
  partner_id: string;
  trip_id: string;
  departure_time: string;
  days_of_week: number[];
  seasonal_start_date: string | null;
  seasonal_end_date: string | null;
  status: 'active' | 'inactive';
  boat_id: string | null;
  created_at: string;
  trip?: Trip;
}

export interface Departure {
  id: string;
  partner_id: string;
  trip_id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  status: 'open' | 'closed' | 'sold_out' | 'cancelled';
  boat_id: string | null;
}

export const useTripsData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [ports, setPorts] = useState<Port[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [schedules, setSchedules] = useState<DepartureTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchPorts = async () => {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .order('name');
    if (!error && data) setPorts(data);
  };

  const fetchRoutes = async () => {
    let query = supabase.from('routes').select('*');
    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      // Enrich with port names
      const enriched = data.map(route => ({
        ...route,
        origin_port: ports.find(p => p.id === route.origin_port_id),
        destination_port: ports.find(p => p.id === route.destination_port_id),
      }));
      setRoutes(enriched as Route[]);
    }
  };

  const fetchTrips = async () => {
    let query = supabase.from('trips').select('*');
    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      // Fetch base prices for all trips
      const tripIds = data.map(t => t.id);
      const { data: priceRules } = await supabase
        .from('price_rules')
        .select('trip_id, adult_price, child_price')
        .in('trip_id', tripIds)
        .eq('rule_type', 'base')
        .eq('status', 'active');

      const priceMap = new Map<string, { adult_price: number; child_price: number | null }>();
      for (const rule of priceRules || []) {
        priceMap.set(rule.trip_id, { adult_price: rule.adult_price, child_price: rule.child_price });
      }

      const enriched = data.map(trip => ({
        ...trip,
        route: routes.find(r => r.id === trip.route_id),
        adult_price: priceMap.get(trip.id)?.adult_price,
        child_price: priceMap.get(trip.id)?.child_price,
      }));
      setTrips(enriched as Trip[]);
    }
  };

  const fetchSchedules = async () => {
    let query = supabase.from('departure_templates').select('*');
    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }
    const { data, error } = await query.order('departure_time');
    if (!error && data) {
      const enriched = data.map(schedule => ({
        ...schedule,
        trip: trips.find(t => t.id === schedule.trip_id),
      }));
      setSchedules(enriched as DepartureTemplate[]);
    }
  };

  const createRoute = async (data: {
    origin_port_id: string;
    destination_port_id: string;
    duration_minutes?: number;
    status?: 'active' | 'inactive';
  }) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };
    
    const originPort = ports.find(p => p.id === data.origin_port_id);
    const destPort = ports.find(p => p.id === data.destination_port_id);
    const routeName = `${originPort?.name || ''} → ${destPort?.name || ''}`;

    const { error } = await supabase.from('routes').insert({
      partner_id: partnerId,
      origin_port_id: data.origin_port_id,
      destination_port_id: data.destination_port_id,
      route_name: routeName,
      duration_minutes: data.duration_minutes || null,
      status: data.status || 'active',
    });
    
    if (!error) await fetchRoutes();
    return { error };
  };

  const updateRoute = async (id: string, data: Partial<Route>) => {
    // Auto-update route name if ports changed
    let updateData = { ...data };
    if (data.origin_port_id || data.destination_port_id) {
      const route = routes.find(r => r.id === id);
      const originId = data.origin_port_id || route?.origin_port_id;
      const destId = data.destination_port_id || route?.destination_port_id;
      const originPort = ports.find(p => p.id === originId);
      const destPort = ports.find(p => p.id === destId);
      updateData.route_name = `${originPort?.name || ''} → ${destPort?.name || ''}`;
    }
    
    const { error } = await supabase.from('routes').update(updateData).eq('id', id);
    if (!error) await fetchRoutes();
    return { error };
  };

  const deleteRoute = async (id: string) => {
    // First delete all departures for trips on this route
    const routeTrips = trips.filter(t => t.route_id === id);
    for (const trip of routeTrips) {
      await supabase.from('departures').delete().eq('trip_id', trip.id);
      await supabase.from('departure_templates').delete().eq('trip_id', trip.id);
    }
    // Then delete trips on this route
    await supabase.from('trips').delete().eq('route_id', id);
    // Finally delete the route
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (!error) await fetchRoutes();
    return { error };
  };

  const createTrip = async (data: {
    route_id: string;
    trip_name: string;
    description?: string;
    capacity_default: number;
    status?: 'active' | 'inactive';
    adult_price: number;
    child_price?: number;
  }) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };
    
    // Create the trip first
    const { data: newTrip, error: tripError } = await supabase.from('trips').insert({
      partner_id: partnerId,
      route_id: data.route_id,
      trip_name: data.trip_name,
      description: data.description || null,
      capacity_default: data.capacity_default,
      status: data.status || 'active',
    }).select().single();
    
    if (tripError) {
      return { error: tripError };
    }

    // Create the base price rule for this trip
    const { error: priceError } = await supabase.from('price_rules').insert({
      partner_id: partnerId,
      trip_id: newTrip.id,
      adult_price: data.adult_price,
      child_price: data.child_price || null,
      rule_type: 'base',
      status: 'active',
    });

    if (priceError) {
      console.error('Error creating price rule:', priceError);
      // Trip was created but price rule failed - still refresh
    }
    
    await fetchTrips();
    return { error: null };
  };

  const updateTrip = async (id: string, data: Partial<Trip> & { adult_price?: number; child_price?: number }) => {
    // Separate price fields from trip fields
    const { adult_price, child_price, route, ...tripData } = data;
    
    // Update trip table (only trip fields)
    const { error } = await supabase.from('trips').update(tripData).eq('id', id);
    
    if (!error) {
      // Update price_rules if prices were provided
      if (adult_price !== undefined) {
        // Check if a base price rule exists
        const { data: existingRule } = await supabase
          .from('price_rules')
          .select('id')
          .eq('trip_id', id)
          .eq('rule_type', 'base')
          .single();

        if (existingRule) {
          // Update existing rule
          await supabase
            .from('price_rules')
            .update({ adult_price, child_price: child_price || null })
            .eq('id', existingRule.id);
        } else {
          // Create new base price rule
          const trip = trips.find(t => t.id === id);
          await supabase.from('price_rules').insert({
            partner_id: trip?.partner_id || partnerId,
            trip_id: id,
            adult_price,
            child_price: child_price || null,
            rule_type: 'base',
            status: 'active',
          });
        }
      }
      
      await fetchTrips();
    }
    return { error };
  };

  const deleteTrip = async (id: string) => {
    // First delete all departures for this trip
    await supabase.from('departures').delete().eq('trip_id', id);
    // Then delete all schedules for this trip
    await supabase.from('departure_templates').delete().eq('trip_id', id);
    // Finally delete the trip
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) await fetchTrips();
    return { error };
  };

  const createSchedule = async (data: {
    trip_id: string;
    departure_times: string[];
    days_of_week: number[];
    seasonal_start_date?: string;
    seasonal_end_date?: string;
    status?: 'active' | 'inactive';
    boat_id?: string;
  }) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };
    
    // Create multiple schedules for each departure time
    const schedulesToCreate = data.departure_times.map(time => ({
      partner_id: partnerId,
      trip_id: data.trip_id,
      departure_time: time,
      days_of_week: data.days_of_week,
      seasonal_start_date: data.seasonal_start_date || null,
      seasonal_end_date: data.seasonal_end_date || null,
      status: data.status || 'active',
      boat_id: data.boat_id || null,
    }));

    const { error } = await supabase.from('departure_templates').insert(schedulesToCreate);
    
    if (!error) await fetchSchedules();
    return { error };
  };

  const updateSchedule = async (id: string, data: Partial<DepartureTemplate>) => {
    const { error } = await supabase.from('departure_templates').update(data).eq('id', id);
    if (!error) await fetchSchedules();
    return { error };
  };

  const deleteSchedule = async (id: string) => {
    // Get the schedule to find its trip_id and departure_time
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      // Delete departures that match this schedule's trip and departure time
      await supabase.from('departures')
        .delete()
        .eq('trip_id', schedule.trip_id)
        .eq('departure_time', schedule.departure_time);
    }
    // Then delete the schedule
    const { error } = await supabase.from('departure_templates').delete().eq('id', id);
    if (!error) await fetchSchedules();
    return { error };
  };

  const generateDepartures = async (tripId: string, startDate: string, endDate: string) => {
    // Get trip and its schedules
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return { error: new Error('Trip not found') };

    const tripSchedules = schedules.filter(s => s.trip_id === tripId && s.status === 'active');
    if (tripSchedules.length === 0) return { error: new Error('No active schedules') };

    const departuresToCreate: Omit<Departure, 'id'>[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dateStr = d.toISOString().split('T')[0];

      for (const schedule of tripSchedules) {
        // Check if this day is active
        if (!schedule.days_of_week.includes(dayOfWeek)) continue;

        // Check seasonal dates
        if (schedule.seasonal_start_date && dateStr < schedule.seasonal_start_date) continue;
        if (schedule.seasonal_end_date && dateStr > schedule.seasonal_end_date) continue;

        departuresToCreate.push({
          partner_id: trip.partner_id,
          trip_id: tripId,
          route_id: trip.route_id,
          departure_date: dateStr,
          departure_time: schedule.departure_time,
          capacity_total: trip.capacity_default,
          capacity_reserved: 0,
          status: 'open',
          boat_id: schedule.boat_id || null,
        });
      }
    }

    if (departuresToCreate.length === 0) {
      return { error: new Error('No departures to generate') };
    }

    // Use upsert to avoid duplicates
    const { error } = await supabase.from('departures').upsert(
      departuresToCreate,
      { onConflict: 'trip_id,departure_date,departure_time', ignoreDuplicates: true }
    );

    return { error, count: departuresToCreate.length };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPorts();
    };
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (ports.length > 0) {
      fetchRoutes();
    }
  }, [ports, partnerId]);

  useEffect(() => {
    if (routes.length >= 0) {
      fetchTrips();
    }
  }, [routes]);

  useEffect(() => {
    if (trips.length >= 0) {
      fetchSchedules();
      setLoading(false);
    }
  }, [trips]);

  return {
    ports,
    routes,
    trips,
    schedules,
    loading,
    canEdit,
    createRoute,
    updateRoute,
    deleteRoute,
    createTrip,
    updateTrip,
    deleteTrip,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    generateDepartures,
    refetch: async () => {
      await fetchPorts();
    },
  };
};
