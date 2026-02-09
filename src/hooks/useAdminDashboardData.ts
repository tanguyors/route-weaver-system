import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminDashboardStats {
  totalPartners: number;
  totalBookings: number;
  platformRevenue: number;
  activeUsers: number;
}

export interface AdminRecentActivity {
  id: string;
  type: "booking" | "partner" | "withdrawal" | "accommodation_booking";
  description: string;
  created_at: string;
}

export const useAdminDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalPartners: 0,
    totalBookings: 0,
    platformRevenue: 0,
    activeUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AdminRecentActivity[]>([]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: partnersCount },
        { count: boatBookingsCount },
        { data: boatCommissionData },
        { count: usersCount },
        { data: recentBookings },
        { data: recentPartners },
        { data: recentWithdrawals },
        // Accommodation data
        { count: accomBookingsCount },
        { data: accomCommissionData },
        { data: recentAccomBookings },
      ] = await Promise.all([
        // Total partners
        supabase
          .from("partners")
          .select("id", { count: "exact", head: true }),
        
        // Boat bookings count
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true }),
        
        // Boat commissions
        supabase
          .from("commission_records")
          .select("platform_fee_amount"),
        
        // Active users
        supabase
          .from("partner_users")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        
        // Recent boat bookings
        supabase
          .from("bookings")
          .select(`
            id,
            created_at,
            total_amount,
            customer:customers(full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(3),
        
        // Recent partners
        supabase
          .from("partners")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
        
        // Recent withdrawals
        supabase
          .from("withdrawal_requests")
          .select(`
            id,
            amount,
            requested_at,
            partner:partners(name)
          `)
          .order("requested_at", { ascending: false })
          .limit(2),

        // Accommodation bookings count
        supabase
          .from("accommodation_bookings")
          .select("id", { count: "exact", head: true }),

        // Accommodation commissions
        supabase
          .from("accommodation_commission_records")
          .select("platform_fee_amount"),

        // Recent accommodation bookings
        supabase
          .from("accommodation_bookings")
          .select(`
            id,
            created_at,
            total_amount,
            guest_name,
            accommodation:accommodations(name)
          `)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const boatRevenue = boatCommissionData?.reduce(
        (sum, r) => sum + Number(r.platform_fee_amount || 0),
        0
      ) || 0;

      const accomRevenue = accomCommissionData?.reduce(
        (sum, r) => sum + Number(r.platform_fee_amount || 0),
        0
      ) || 0;

      setStats({
        totalPartners: partnersCount ?? 0,
        totalBookings: (boatBookingsCount ?? 0) + (accomBookingsCount ?? 0),
        platformRevenue: boatRevenue + accomRevenue,
        activeUsers: usersCount ?? 0,
      });

      // Build recent activity list
      const activities: AdminRecentActivity[] = [];

      recentBookings?.forEach((b: any) => {
        const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
        activities.push({
          id: b.id,
          type: "booking",
          description: `New booking from ${customer?.full_name || "Customer"} - Rp ${Number(b.total_amount).toLocaleString()}`,
          created_at: b.created_at,
        });
      });

      recentAccomBookings?.forEach((b: any) => {
        const accommodation = Array.isArray(b.accommodation) ? b.accommodation[0] : b.accommodation;
        activities.push({
          id: b.id,
          type: "accommodation_booking",
          description: `Accommodation booking: ${b.guest_name} at ${accommodation?.name || "Property"} - Rp ${Number(b.total_amount).toLocaleString()}`,
          created_at: b.created_at,
        });
      });

      recentPartners?.forEach((p: any) => {
        activities.push({
          id: p.id,
          type: "partner",
          description: `New partner registered: ${p.name}`,
          created_at: p.created_at,
        });
      });

      recentWithdrawals?.forEach((w: any) => {
        const partner = Array.isArray(w.partner) ? w.partner[0] : w.partner;
        activities.push({
          id: w.id,
          type: "withdrawal",
          description: `Withdrawal request from ${partner?.name || "Partner"} - Rp ${Number(w.amount).toLocaleString()}`,
          created_at: w.requested_at,
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentActivity(activities.slice(0, 7));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    loading,
    stats,
    recentActivity,
    refetch,
  };
};
