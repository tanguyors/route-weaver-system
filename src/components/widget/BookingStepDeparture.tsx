import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, ChevronLeft, Ship, Sailboat, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BoatInfoModal } from './BoatInfoModal';
import { useWidgetCurrency } from '@/contexts/WidgetLanguageContext';

interface Boat {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  image_url: string | null;
  images?: string[] | null;
}

interface Departure {
  id: string;
  trip_id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  status: string;
  boat_id: string | null;
}

interface Trip {
  id: string;
  route_id: string;
  trip_name: string;
  description: string | null;
}

interface BookingStepDepartureProps {
  departures: Departure[];
  trips: Trip[];
  boats: Boat[];
  getPricing: (tripId: string, date: string) => { adult: number; child: number };
  onSelect: (departure: Departure) => void;
  onBack: () => void;
}

export const BookingStepDeparture = ({
  departures,
  trips,
  boats,
  getPricing,
  onSelect,
  onBack,
}: BookingStepDepartureProps) => {
  const [boatInfoModal, setBoatInfoModal] = useState<{
    open: boolean;
    boat: Boat | null;
    trip: Trip | undefined;
    departure: Departure;
    pricing: { adult: number; child: number };
  } | null>(null);

  // Group departures by date
  const departuresByDate = departures.reduce((acc, dep) => {
    if (!acc[dep.departure_date]) {
      acc[dep.departure_date] = [];
    }
    acc[dep.departure_date].push(dep);
    return acc;
  }, {} as Record<string, Departure[]>);

  const { formatPrice } = useWidgetCurrency();

  const getBoat = (boatId: string | null) => {
    if (!boatId) return null;
    return boats.find(b => b.id === boatId);
  };

  const handleOpenBoatInfo = (e: React.MouseEvent, dep: Departure, boat: Boat, trip: Trip | undefined, pricing: { adult: number; child: number }) => {
    e.stopPropagation();
    setBoatInfoModal({
      open: true,
      boat,
      trip,
      departure: dep,
      pricing,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Departure
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(departuresByDate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No departures available for this route.</p>
              <p className="text-sm">Try selecting a different date.</p>
            </div>
          ) : (
            Object.entries(departuresByDate).map(([date, deps]) => (
              <div key={date}>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2">
                  {deps.map(dep => {
                    const trip = trips.find(t => t.id === dep.trip_id);
                    const boat = getBoat(dep.boat_id);
                    const available = dep.capacity_total - dep.capacity_reserved;
                    const pricing = getPricing(dep.trip_id, dep.departure_date);
                    const isLimited = available <= 5;
                    
                    return (
                      <div
                        key={dep.id}
                        className={cn(
                          'w-full p-4 rounded-lg border text-left transition-all hover:shadow-md cursor-pointer',
                          isLimited 
                            ? 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        )}
                        onClick={() => onSelect(dep)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-lg font-bold">
                              {dep.departure_time.slice(0, 5)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {trip?.trip_name}
                            </div>
                            {/* Boat Info */}
                            {boat && (
                              <div className="flex items-center gap-2 mt-2">
                                {boat.image_url ? (
                                  <img 
                                    src={boat.image_url} 
                                    alt={boat.name} 
                                    className="w-10 h-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-8 bg-muted rounded flex items-center justify-center">
                                    <Sailboat className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-foreground">
                                  {boat.name}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleOpenBoatInfo(e, dep, boat, trip, pricing)}
                                  className="ml-2 h-7 text-xs"
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  Boat Info
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {formatPrice(pricing.adult)}
                            </div>
                            <div className="text-xs text-muted-foreground">per adult</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className={cn(isLimited && 'text-orange-600 font-medium')}>
                              {available} seats left
                            </span>
                          </div>
                          {pricing.child > 0 && (
                            <div className="text-muted-foreground">
                              Child: {formatPrice(pricing.child)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Boat Info Modal */}
      {boatInfoModal && (
        <BoatInfoModal
          open={boatInfoModal.open}
          onClose={() => setBoatInfoModal(null)}
          onSelectTrip={() => onSelect(boatInfoModal.departure)}
          boat={boatInfoModal.boat}
          trip={boatInfoModal.trip}
          departureTime={boatInfoModal.departure.departure_time}
          departureDate={boatInfoModal.departure.departure_date}
          pricing={boatInfoModal.pricing}
        />
      )}
    </>
  );
};
