import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface AdminDashboardStats {
  totalPartners: number;
  totalBookings: number;
  platformRevenue: number; // Total commission earned
  activeUsers: number;
}

export interface AdminRecentActivity {
  id: string;
  type: "booking" | "partner" | "withdrawal";
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
      // Fetch all stats in parallel
      const [
        { count: partnersCount },
        { count: bookingsCount },
        { data: commissionData },
        { count: usersCount },
        { data: recentBookings },
        { data: recentPartners },
        { data: recentWithdrawals },
      ] = await Promise.all([
        // Total partners
        supabase
          .from("partners")
          .select("id", { count: "exact", head: true }),
        
        // Total bookings
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true }),
        
        // Platform revenue (sum of platform_fee_amount from commission_records)
        supabase
          .from("commission_records")
          .select("platform_fee_amount"),
        
        // Active users (partner_users with active status)
        supabase
          .from("partner_users")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        
        // Recent bookings for activity
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
        
        // Recent partners for activity
        supabase
          .from("partners")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
        
        // Recent withdrawals for activity
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
      ]);

      const platformRevenue = commissionData?.reduce(
        (sum, r) => sum + Number(r.platform_fee_amount || 0),
        0
      ) || 0;

      setStats({
        totalPartners: partnersCount ?? 0,
        totalBookings: bookingsCount ?? 0,
        platformRevenue,
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

      setRecentActivity(activities.slice(0, 5));
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
