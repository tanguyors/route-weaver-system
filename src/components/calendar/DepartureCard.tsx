import { cn } from '@/lib/utils';
import { CalendarDeparture } from '@/hooks/useCalendarData';
import { Ship, Users, Clock } from 'lucide-react';

interface DepartureCardProps {
  departure: CalendarDeparture;
  compact?: boolean;
  onClick?: () => void;
}

export const DepartureCard = ({ departure, compact = false, onClick }: DepartureCardProps) => {
  const available = departure.capacity_total - departure.capacity_reserved;
  const utilizationPercent = (departure.capacity_reserved / departure.capacity_total) * 100;
  
  const getStatusColor = () => {
    switch (departure.status) {
      case 'open':
        if (utilizationPercent >= 80) return 'bg-orange-500/10 border-orange-500/50 text-orange-700 dark:text-orange-400';
        return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400';
      case 'sold_out':
        return 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400';
      case 'closed':
        return 'bg-muted border-muted-foreground/30 text-muted-foreground';
      case 'cancelled':
        return 'bg-zinc-900/10 border-zinc-900/50 text-zinc-600 dark:bg-zinc-100/10 dark:text-zinc-400 line-through';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusBadge = () => {
    switch (departure.status) {
      case 'open':
        return utilizationPercent >= 80 ? 'Limited' : 'Open';
      case 'sold_out':
        return 'Sold Out';
      case 'closed':
        return 'Closed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const routeName = departure.trip?.route?.route_name || 
    `${departure.trip?.route?.origin_port?.name || ''} → ${departure.trip?.route?.destination_port?.name || ''}`;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'px-2 py-1 rounded text-xs border cursor-pointer transition-all hover:shadow-md',
          getStatusColor()
        )}
      >
        <div className="font-medium truncate">{departure.departure_time.slice(0, 5)}</div>
        <div className="truncate opacity-80">{available}/{departure.capacity_total}</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
        getStatusColor()
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 opacity-70" />
          <span className="font-semibold">{departure.departure_time.slice(0, 5)}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 font-medium">
          {getStatusBadge()}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Ship className="h-4 w-4 opacity-70" />
        <span className="text-sm font-medium truncate">{routeName}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 opacity-70" />
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span>{departure.capacity_reserved} booked</span>
            <span>{available} left</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current opacity-50 rounded-full transition-all"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
