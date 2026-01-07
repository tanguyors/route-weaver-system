import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Anchor } from 'lucide-react';

export type ServiceType = 'public-ferry' | 'private-boat';

interface BookingStepServiceTypeProps {
  onSelect: (type: ServiceType) => void;
  hasPrivateBoats: boolean;
  hasPublicFerry: boolean;
}

export const BookingStepServiceType = ({
  onSelect,
  hasPrivateBoats,
  hasPublicFerry,
}: BookingStepServiceTypeProps) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Choose Your Service</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select the type of boat service you need
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Fast Ferry Option */}
        {hasPublicFerry && (
          <button
            onClick={() => onSelect('public-ferry')}
            className="w-full p-6 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Ship className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  Public Fast Ferry
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Scheduled departures with fixed routes and prices. Share the boat with other passengers.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">Fixed Schedule</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">Shared Boat</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">Per Person Pricing</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Private Boat Option */}
        {hasPrivateBoats && (
          <button
            onClick={() => onSelect('private-boat')}
            className="w-full p-6 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Anchor className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  Private Boat Charter
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Book the entire boat for your group. Choose your own departure time and route.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">Flexible Time</span>
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">Exclusive Boat</span>
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">Fixed Price</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* If only one option is available, show a message */}
        {!hasPrivateBoats && !hasPublicFerry && (
          <div className="text-center text-muted-foreground py-8">
            <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No boat services available at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
