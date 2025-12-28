import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface ReportFiltersProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  channel?: string;
  onChannelChange?: (channel: string) => void;
  routes?: Array<{ id: string; route_name: string }>;
  routeId?: string;
  onRouteChange?: (routeId: string) => void;
  showChannelFilter?: boolean;
  showRouteFilter?: boolean;
}

const ReportFilters = ({
  dateRange,
  onDateRangeChange,
  channel = 'all',
  onChannelChange,
  routes = [],
  routeId = 'all',
  onRouteChange,
  showChannelFilter = true,
  showRouteFilter = false,
}: ReportFiltersProps) => {
  const presetRanges = [
    { label: 'This Month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Last Month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'Last 3 Months', from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) },
    { label: 'Year to Date', from: startOfYear(new Date()), to: new Date() },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
      {/* Date Range */}
      <div className="space-y-1">
        <Label className="text-xs">Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[260px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
                </>
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => onDateRangeChange({ from: preset.from, to: preset.to })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range: DateRange | undefined) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Channel Filter */}
      {showChannelFilter && onChannelChange && (
        <div className="space-y-1">
          <Label className="text-xs">Channel</Label>
          <Select value={channel} onValueChange={onChannelChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Route Filter */}
      {showRouteFilter && onRouteChange && routes.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Route</Label>
          <Select value={routeId} onValueChange={onRouteChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.route_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;
