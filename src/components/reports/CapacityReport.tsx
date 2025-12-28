import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';

interface CapacityMetrics {
  totalCapacity: number;
  totalSold: number;
  occupancyRate: number;
  departures: Array<{
    id: string;
    date: string;
    time: string;
    tripName: string;
    routeName: string;
    capacity: number;
    sold: number;
    occupancy: number;
  }>;
}

interface CapacityReportProps {
  metrics: CapacityMetrics;
}

const CapacityReport = ({ metrics }: CapacityReportProps) => {
  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'text-green-600';
    if (occupancy >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyBadge = (occupancy: number) => {
    if (occupancy >= 90) return { label: 'Full', variant: 'default' as const };
    if (occupancy >= 70) return { label: 'High', variant: 'secondary' as const };
    if (occupancy >= 40) return { label: 'Medium', variant: 'outline' as const };
    return { label: 'Low', variant: 'destructive' as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Capacity & Occupancy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold">{metrics.totalCapacity}</p>
            <p className="text-sm text-muted-foreground">Total Seats</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{metrics.totalSold}</p>
            <p className="text-sm text-muted-foreground">Seats Sold</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${getOccupancyColor(metrics.occupancyRate)}`}>
              {metrics.occupancyRate.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
          </div>
        </div>

        {/* Departures Table */}
        {metrics.departures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>No departures in selected period</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Occupancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.departures.slice(0, 10).map((departure) => {
                const badge = getOccupancyBadge(departure.occupancy);
                return (
                  <TableRow key={departure.id}>
                    <TableCell>{departure.date}</TableCell>
                    <TableCell>{departure.time}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{departure.tripName}</p>
                        <p className="text-xs text-muted-foreground">{departure.routeName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{departure.capacity}</TableCell>
                    <TableCell>{departure.sold}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={departure.occupancy} className="w-16 h-2" />
                        <Badge variant={badge.variant} className="text-xs">
                          {departure.occupancy.toFixed(0)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacityReport;
