import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Ship, Clock, MapPin, Users, X, icons } from 'lucide-react';
import { useWidgetCurrency } from '@/contexts/WidgetLanguageContext';
import type { BoatFacility } from '@/hooks/useWidgetBooking';
import { cn } from '@/lib/utils';

interface Boat {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  image_url: string | null;
  images?: string[] | null;
  boat_facilities?: BoatFacility[];
}

interface Trip {
  id: string;
  trip_name: string;
  description?: string | null;
}

interface Route {
  id: string;
  origin_port_id: string;
  destination_port_id: string;
  duration_minutes: number | null;
}

interface Port {
  id: string;
  name: string;
}

interface BoatInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTrip: () => void;
  boat: Boat | null;
  trip?: Trip | null;
  route?: Route | null;
  originPort?: Port | null;
  destPort?: Port | null;
  departureTime?: string;
  departureDate?: string;
  pricing?: { adult: number; child: number };
  paxAdult?: number;
  paxChild?: number;
  primaryColor?: string;
  hideSelectButton?: boolean;
}

export const BoatInfoModal = ({
  open,
  onClose,
  onSelectTrip,
  boat,
  trip,
  route,
  originPort,
  destPort,
  departureTime,
  departureDate,
  pricing,
  paxAdult = 0,
  paxChild = 0,
  primaryColor = '#1B5E3B',
  hideSelectButton = false,
}: BoatInfoModalProps) => {
  if (!boat || !open) return null;

  // Combine image_url and images array for carousel
  const allImages: string[] = [];
  if (boat.image_url) {
    allImages.push(boat.image_url);
  }
  if (boat.images && Array.isArray(boat.images)) {
    boat.images.forEach(img => {
      if (img && !allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }

  const { formatPrice } = useWidgetCurrency();

  const totalPrice = pricing 
    ? (paxAdult * pricing.adult) + (paxChild * pricing.child) 
    : 0;

  // Helper to render facility icon dynamically
  const renderFacilityIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const pascalName = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const IconComponent = (icons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      
      {/* Modal Content - Using absolute positioning relative to viewport */}
      <div 
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-white rounded-lg shadow-xl z-[101] flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Ship className="h-5 w-5" style={{ color: primaryColor }} />
            {boat.name}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Boat Images Carousel */}
          <div className="relative">
            {allImages.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {allImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image}
                          alt={`${boat.name} - Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                <Ship className="w-16 h-16 text-gray-300" />
              </div>
            )}
            
            {/* Image counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {allImages.length} photos
              </div>
            )}
          </div>

          {/* Boat Description */}
          {boat.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">About this boat</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {boat.description}
              </p>
            </div>
          )}

          {/* Boat Capacity */}
          {boat.capacity && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Capacity: {boat.capacity} passengers</span>
            </div>
          )}

          {/* Boat Facilities */}
          {boat.boat_facilities && boat.boat_facilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">Facilities & Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {boat.boat_facilities.map((bf) => (
                  <div
                    key={bf.facility_id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-sm",
                      bf.is_free 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    {renderFacilityIcon(bf.facility?.icon ?? null)}
                    <span className="flex-1 truncate">{bf.facility?.name}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/50">
                      {bf.is_free ? 'Free' : 'Paid'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trip Information */}
          {trip && (
            <div 
              className="p-4 rounded-lg border-2"
              style={{ borderColor: primaryColor + '40', backgroundColor: primaryColor + '08' }}
            >
              <h3 
                className="font-bold text-lg mb-3"
                style={{ color: primaryColor }}
              >
                Trip Information
              </h3>
              
              <div className="space-y-3">
                {/* Trip Name */}
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{trip.trip_name}</span>
                </div>
                
                {/* Route */}
                {originPort && destPort && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{originPort.name} → {destPort.name}</span>
                  </div>
                )}

                {/* Departure Time */}
                {departureTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      Departure: {departureTime.slice(0, 5)}
                      {departureDate && ` - ${new Date(departureDate).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}`}
                    </span>
                  </div>
                )}

                {/* Duration */}
                {route?.duration_minutes && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Duration: {route.duration_minutes} minutes</span>
                  </div>
                )}

                {/* Trip Description */}
                {trip.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {trip.description}
                  </p>
                )}

                {/* Pricing */}
                {pricing && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span>Adult × {paxAdult}</span>
                      <span>{formatPrice(pricing.adult * paxAdult)}</span>
                    </div>
                    {paxChild > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Child × {paxChild}</span>
                        <span>{formatPrice(pricing.child * paxChild)}</span>
                      </div>
                    )}
                    <div 
                      className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"
                      style={{ color: primaryColor }}
                    >
                      <span>Total</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex gap-3 p-4 border-t shrink-0 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={hideSelectButton ? "w-full" : "flex-1"}
          >
            Close
          </Button>
          {!hideSelectButton && (
            <Button
              type="button"
              onClick={() => {
                onSelectTrip();
                onClose();
              }}
              className="flex-1 text-white font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              Select This Trip
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
