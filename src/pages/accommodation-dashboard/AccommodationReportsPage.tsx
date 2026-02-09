import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, CalendarDays, Home, Percent, TrendingUp } from 'lucide-react';
import { useAccommodationReportsData } from '@/hooks/useAccommodationReportsData';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 173 58% 39%))',
  'hsl(var(--chart-3, 197 37% 24%))',
  'hsl(var(--chart-4, 43 74% 66%))',
  'hsl(var(--chart-5, 27 87% 67%))',
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'hsl(142, 71%, 45%)',
  completed: 'hsl(var(--primary))',
  cancelled: 'hsl(0, 84%, 60%)',
  draft: 'hsl(var(--muted-foreground))',
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
};

const AccommodationReportsPage = () => {
  const {
    loading,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    summary,
    revenueByAccommodation,
    bookingsByChannel,
    bookingsByStatus,
  } = useAccommodationReportsData();

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance reports</p>
        </div>

        {/* Date Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={format(dateFrom, 'yyyy-MM-dd')}
                  onChange={(e) => e.target.value && setDateFrom(new Date(e.target.value))}
                  className="mt-1 w-44"
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={format(dateTo, 'yyyy-MM-dd')}
                  onChange={(e) => e.target.value && setDateTo(new Date(e.target.value))}
                  className="mt-1 w-44"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue, summary.currency)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-medium">Bookings</span>
                  </div>
                  <p className="text-2xl font-bold">{summary.confirmedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Home className="w-4 h-4" />
                    <span className="text-xs font-medium">Nights Booked</span>
                  </div>
                  <p className="text-2xl font-bold">{summary.totalNights}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Percent className="w-4 h-4" />
                    <span className="text-xs font-medium">Occupancy</span>
                  </div>
                  <p className="text-2xl font-bold">{summary.occupancyRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Avg Value</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(summary.avgBookingValue, summary.currency)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Properties Table */}
            {revenueByAccommodation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Nights</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueByAccommodation.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.bookings}</TableCell>
                          <TableCell className="text-right">{row.nights}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.revenue, summary.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bookings by Channel */}
              {bookingsByChannel.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingsByChannel}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {bookingsByChannel.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bookings by Status */}
              {bookingsByStatus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingsByStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {bookingsByStatus.map((entry, i) => (
                            <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Empty state */}
            {bookingsByChannel.length === 0 && bookingsByStatus.length === 0 && revenueByAccommodation.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No booking data found for the selected period</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationReportsPage;
