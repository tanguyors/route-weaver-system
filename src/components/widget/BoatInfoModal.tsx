import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Ship, Clock, MapPin, Users, X } from 'lucide-react';

interface Boat {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  image_url: string | null;
  images?: string[] | null;
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
  if (!boat) return null;

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = pricing 
    ? (paxAdult * pricing.adult) + (paxChild * pricing.child) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" style={{ color: primaryColor }} />
            {boat.name}
          </DialogTitle>
        </DialogHeader>

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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className={hideSelectButton ? "w-full" : "flex-1"}
          >
            Close
          </Button>
          {!hideSelectButton && (
            <Button 
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
      </DialogContent>
    </Dialog>
  );
};
