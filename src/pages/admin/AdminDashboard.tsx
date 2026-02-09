import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BookOpen, DollarSign, Users, Loader2, BookMarked, UserPlus, Wallet, Home } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'booking':
      return <BookMarked className="w-4 h-4 text-primary" />;
    case 'partner':
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case 'withdrawal':
      return <Wallet className="w-4 h-4 text-orange-500" />;
    case 'accommodation_booking':
      return <Home className="w-4 h-4 text-blue-500" />;
    default:
      return <BookMarked className="w-4 h-4 text-muted-foreground" />;
  }
};

const AdminDashboard = () => {
  const { loading, stats, recentActivity } = useAdminDashboardData();

  const statCards = [
    { label: 'Total Partners', value: stats.totalPartners.toString(), icon: Building2 },
    { label: 'Total Bookings', value: stats.totalBookings.toString(), icon: BookOpen },
    { label: 'Platform Revenue', value: formatCurrency(stats.platformRevenue), icon: DollarSign },
    { label: 'Active Users', value: stats.activeUsers.toString(), icon: Users },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <ActivityIcon type={activity.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
