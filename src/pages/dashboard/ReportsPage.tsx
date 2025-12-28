import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportsData } from '@/hooks/useReportsData';
import ReportFilters from '@/components/reports/ReportFilters';
import ChannelComparison from '@/components/reports/ChannelComparison';
import CapacityReport from '@/components/reports/CapacityReport';
import PaymentReport from '@/components/reports/PaymentReport';
import BookingStatusReport from '@/components/reports/BookingStatusReport';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Loader2,
  CreditCard,
  PieChart,
  Calendar,
} from 'lucide-react';

const ReportsPage = () => {
  const {
    loading,
    filters,
    setFilters,
    salesMetrics,
    channelMetrics,
    capacityMetrics,
    paymentMetrics,
    bookingStatusMetrics,
    routes,
    exportSalesCSV,
    exportCapacityCSV,
  } = useReportsData(false);

  const [channel, setChannel] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleChannelChange = (newChannel: string) => {
    setChannel(newChannel);
    setFilters({ ...filters, channel: newChannel });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and business performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSalesCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export Sales
            </Button>
            <Button variant="outline" onClick={exportCapacityCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export Capacity
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          dateRange={filters.dateRange}
          onDateRangeChange={(range) => setFilters({ ...filters, dateRange: range })}
          channel={channel}
          onChannelChange={handleChannelChange}
          routes={routes}
          showChannelFilter={true}
          showRouteFilter={false}
        />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold">{salesMetrics.totalBookings}</p>
                      <p className="text-xs text-muted-foreground">
                        {salesMetrics.confirmedBookings} confirmed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(salesMetrics.totalGross)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission (7%)</p>
                      <p className="text-2xl font-bold text-destructive">
                        -{formatCurrency(salesMetrics.totalCommission)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(salesMetrics.totalNet)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <Users className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Passengers</p>
                      <p className="text-2xl font-bold">{salesMetrics.totalPax}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(salesMetrics.avgBookingValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold">{capacityMetrics.occupancyRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports Tabs */}
            <Tabs defaultValue="channels" className="space-y-4">
              <TabsList>
                <TabsTrigger value="channels" className="gap-2">
                  <PieChart className="w-4 h-4" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="capacity" className="gap-2">
                  <Users className="w-4 h-4" />
                  Capacity
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="status" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="channels">
                <ChannelComparison metrics={channelMetrics} formatCurrency={formatCurrency} />
              </TabsContent>

              <TabsContent value="capacity">
                <CapacityReport metrics={capacityMetrics} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentReport metrics={paymentMetrics} formatCurrency={formatCurrency} />
              </TabsContent>

              <TabsContent value="status">
                <BookingStatusReport metrics={bookingStatusMetrics} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
