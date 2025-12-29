import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarDeparture } from "@/hooks/useCalendarData";

export interface DashboardRecentBooking {
  id: string;
  created_at: string;
  status: string;
  channel: string;
  pax_adult: number;
  pax_child: number;
  total_amount: number;
  customer_name: string;
  route_name: string;
  departure_date: string;
  departure_time: string;
}

export interface DashboardStats {
  bookingsThisMonth: number;
  bookingsChangePct: number | null;
  passengersToday: number;
  passengersChangePct: number | null;
  revenueThisMonth: number;
  revenueChangePct: number | null;
  pendingCheckins: number;
  pendingCheckinsChangePct: number | null;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export const useDashboardData = (params: {
  partnerId: string | null;
  isAdmin?: boolean;
}) => {
  const { partnerId, isAdmin = false } = params;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    bookingsThisMonth: 0,
    bookingsChangePct: 0,
    passengersToday: 0,
    passengersChangePct: 0,
    revenueThisMonth: 0,
    revenueChangePct: 0,
    pendingCheckins: 0,
    pendingCheckinsChangePct: 0,
  });
  const [recentBookings, setRecentBookings] = useState<DashboardRecentBooking[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<CalendarDeparture[]>([]);

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return format(d, "yyyy-MM-dd");
  }, []);

  const monthBounds = useMemo(() => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      startThisMonth: startThisMonth.toISOString(),
      startNextMonth: startNextMonth.toISOString(),
      startLastMonth: startLastMonth.toISOString(),
    };
  }, []);

  const basePartnerFilter = useCallback(
    <T extends { eq: (...args: any[]) => T }>(query: T) => {
      if (!isAdmin && partnerId) return query.eq("partner_id", partnerId);
      return query;
    },
    [isAdmin, partnerId]
  );

  const refetch = useCallback(async () => {
    if (!partnerId && !isAdmin) return;

    setLoading(true);
    try {
      // 1) Bookings this month vs last month
      let bookingsThisMonthQuery = supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthBounds.startThisMonth)
        .lt("created_at", monthBounds.startNextMonth);

      let bookingsLastMonthQuery = supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthBounds.startLastMonth)
        .lt("created_at", monthBounds.startThisMonth);

      bookingsThisMonthQuery = basePartnerFilter(bookingsThisMonthQuery as any) as any;
      bookingsLastMonthQuery = basePartnerFilter(bookingsLastMonthQuery as any) as any;

      const [{ count: bookingsThisMonthCount }, { count: bookingsLastMonthCount }] = await Promise.all([
        bookingsThisMonthQuery,
        bookingsLastMonthQuery,
      ]);

      const bookingsThisMonth = bookingsThisMonthCount ?? 0;
      const bookingsLastMonth = bookingsLastMonthCount ?? 0;

      // 2) Revenue (gross) from commission_records (one record per booking) this month vs last month
      let revenueThisMonthQuery = supabase
        .from("commission_records")
        .select("gross_amount, created_at")
        .gte("created_at", monthBounds.startThisMonth)
        .lt("created_at", monthBounds.startNextMonth);

      let revenueLastMonthQuery = supabase
        .from("commission_records")
        .select("gross_amount, created_at")
        .gte("created_at", monthBounds.startLastMonth)
        .lt("created_at", monthBounds.startThisMonth);

      revenueThisMonthQuery = basePartnerFilter(revenueThisMonthQuery as any) as any;
      revenueLastMonthQuery = basePartnerFilter(revenueLastMonthQuery as any) as any;

      const [{ data: revenueThisMonthRows }, { data: revenueLastMonthRows }] = await Promise.all([
        revenueThisMonthQuery,
        revenueLastMonthQuery,
      ]);

      const revenueThisMonth =
        revenueThisMonthRows?.reduce((sum, r: any) => sum + Number(r.gross_amount), 0) || 0;
      const revenueLastMonth =
        revenueLastMonthRows?.reduce((sum, r: any) => sum + Number(r.gross_amount), 0) || 0;

      // 3) Today's departures
      let departuresTodayQuery = supabase
        .from("departures")
        .select(
          `
          *,
          trip:trips(
            id,
            trip_name,
            route:routes(
              id,
              route_name,
              origin_port:ports!routes_origin_port_id_fkey(name),
              destination_port:ports!routes_destination_port_id_fkey(name)
            )
          )
        `
        )
        .eq("departure_date", today)
        .order("departure_time", { ascending: true });

      departuresTodayQuery = basePartnerFilter(departuresTodayQuery as any) as any;

      const { data: departuresTodayRows } = await departuresTodayQuery;
      const todayDeparturesData = (departuresTodayRows || []) as CalendarDeparture[];
      setTodayDepartures(todayDeparturesData);

      // 4) Passenger counts today vs yesterday
      const todayDepartureIds = todayDeparturesData.map((d) => d.id);

      const fetchPassengersForDepartures = async (departureIds: string[]) => {
        if (departureIds.length === 0) return 0;
        let q = supabase
          .from("bookings")
          .select("pax_adult, pax_child, status")
          .in("departure_id", departureIds)
          .not("status", "in", "(cancelled,refunded)");
        q = basePartnerFilter(q as any) as any;
        const { data } = await q;
        return (
          data?.reduce((sum: number, b: any) => sum + Number(b.pax_adult || 0) + Number(b.pax_child || 0), 0) ||
          0
        );
      };

      const fetchDepartureIdsForDate = async (date: string) => {
        let q = supabase.from("departures").select("id").eq("departure_date", date);
        q = basePartnerFilter(q as any) as any;
        const { data } = await q;
        return (data || []).map((r: any) => r.id) as string[];
      };

      const [yDepartureIds, passengersToday] = await Promise.all([
        fetchDepartureIdsForDate(yesterday),
        fetchPassengersForDepartures(todayDepartureIds),
      ]);

      const passengersYesterday = await fetchPassengersForDepartures(yDepartureIds);

      // 5) Pending check-ins today vs yesterday (tickets pending)
      const fetchPendingCheckins = async (date: string) => {
        const depIds = date === today ? todayDepartureIds : await fetchDepartureIdsForDate(date);
        if (depIds.length === 0) return 0;

        let bookingsQ = supabase
          .from("bookings")
          .select("id")
          .in("departure_id", depIds)
          .not("status", "in", "(cancelled,refunded)");
        bookingsQ = basePartnerFilter(bookingsQ as any) as any;
        const { data: bookingsRows } = await bookingsQ;
        const bookingIds = (bookingsRows || []).map((b: any) => b.id);
        if (bookingIds.length === 0) return 0;

        let ticketsQ = supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .in("booking_id", bookingIds)
          .eq("status", "pending");

        // tickets RLS is via booking, but partner_id is not on tickets; keep as-is.
        const { count } = await ticketsQ;
        return count ?? 0;
      };

      const [pendingToday, pendingYesterday] = await Promise.all([
        fetchPendingCheckins(today),
        fetchPendingCheckins(yesterday),
      ]);

      // 6) Recent bookings
      let recentBookingsQ = supabase
        .from("bookings")
        .select(
          `
          id,
          created_at,
          status,
          channel,
          pax_adult,
          pax_child,
          total_amount,
          customer:customers(full_name),
          departure:departures(
            departure_date,
            departure_time,
            trip:trips(
              trip_name,
              route:routes(route_name)
            )
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      recentBookingsQ = basePartnerFilter(recentBookingsQ as any) as any;

      const { data: recentBookingsRows } = await recentBookingsQ;

      const normalizedRecent = (recentBookingsRows || []).map((b: any) => {
        const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
        const departure = Array.isArray(b.departure) ? b.departure[0] : b.departure;
        const routeName =
          departure?.trip?.route?.route_name || departure?.trip?.trip_name || "Unknown route";

        return {
          id: b.id,
          created_at: b.created_at,
          status: b.status,
          channel: b.channel,
          pax_adult: b.pax_adult,
          pax_child: b.pax_child,
          total_amount: Number(b.total_amount),
          customer_name: customer?.full_name || "-",
          route_name: routeName,
          departure_date: departure?.departure_date || "-",
          departure_time: departure?.departure_time || "-",
        } satisfies DashboardRecentBooking;
      });

      setRecentBookings(normalizedRecent);

      setStats({
        bookingsThisMonth,
        bookingsChangePct: pctChange(bookingsThisMonth, bookingsLastMonth),
        passengersToday,
        passengersChangePct: pctChange(passengersToday, passengersYesterday),
        revenueThisMonth,
        revenueChangePct: pctChange(revenueThisMonth, revenueLastMonth),
        pendingCheckins: pendingToday,
        pendingCheckinsChangePct: pctChange(pendingToday, pendingYesterday),
      });
    } finally {
      setLoading(false);
    }
  }, [basePartnerFilter, isAdmin, monthBounds, partnerId, today, yesterday]);

  useEffect(() => {
    if (partnerId || isAdmin) {
      refetch();
    }
  }, [partnerId, isAdmin, refetch]);

  return {
    loading,
    stats,
    recentBookings,
    todayDepartures,
    refetch,
  };
};
