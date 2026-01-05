import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, Users, QrCode, Download, Ship, Package, MapPin, Baby, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { SelectedAddon } from '@/hooks/useWidgetBooking';

interface TripInfo {
  route: string;
  date: string;
  time: string;
}

interface BookingSuccessProps {
  bookingId: string;
  qrToken: string;
  departure: TripInfo;
  returnTrip?: TripInfo;
  paxAdult?: number;
  paxChild?: number;
  paxInfant?: number;
  totalAmount: number;
  subtotalAmount?: number;
  addonsAmount?: number;
  discountAmount?: number;
  addons?: SelectedAddon[];
  customer: {
    full_name: string;
    email: string;
  };
}

export const BookingSuccess = ({
  bookingId,
  qrToken,
  departure,
  returnTrip,
  paxAdult = 1,
  paxChild = 0,
  paxInfant = 0,
  totalAmount,
  subtotalAmount,
  addonsAmount,
  discountAmount,
  addons = [],
  customer,
}: BookingSuccessProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Generate QR code URL (using a free QR code API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`;

  const isRoundTrip = !!returnTrip;

  return (
    <Card className="overflow-hidden">
      {/* Success Header */}
      <div className="bg-emerald-500 text-white p-6 text-center">
        <CheckCircle className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-emerald-100">
          {isRoundTrip ? 'Your round trip tickets have been generated' : 'Your ticket has been generated'}
        </p>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Booking ID */}
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Booking Reference</p>
          <p className="font-mono font-bold text-lg">{bookingId.slice(0, 8).toUpperCase()}</p>
          {isRoundTrip && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
              <ArrowLeftRight className="h-3 w-3" />
              Round Trip
            </span>
          )}
        </div>

        {/* Trip Details */}
        <div className="space-y-4">
          {/* Outbound */}
          <div className="border-l-2 border-primary pl-3 space-y-2">
            <p className="text-xs font-medium text-primary uppercase">
              {isRoundTrip ? 'Outbound Trip' : 'Trip Details'}
            </p>
            <div className="flex items-center gap-3">
              <Ship className="h-5 w-5 text-primary" />
              <p className="font-medium">{departure.route}</p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p>{format(new Date(departure.date), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p>{departure.time.slice(0, 5)}</p>
            </div>
          </div>

          {/* Return Trip */}
          {returnTrip && (
            <div className="border-l-2 border-emerald-500 pl-3 space-y-2">
              <p className="text-xs font-medium text-emerald-600 uppercase">Return Trip</p>
              <div className="flex items-center gap-3">
                <Ship className="h-5 w-5 text-emerald-500" />
                <p className="font-medium">{returnTrip.route}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p>{format(new Date(returnTrip.date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p>{returnTrip.time.slice(0, 5)}</p>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p>
              {paxAdult} Adult{paxAdult > 1 ? 's' : ''}
              {paxChild > 0 && `, ${paxChild} Child${paxChild > 1 ? 'ren' : ''}`}
            </p>
          </div>
          
          {paxInfant > 0 && (
            <div className="flex items-center gap-3 text-emerald-600">
              <Baby className="h-5 w-5" />
              <p>{paxInfant} Infant{paxInfant > 1 ? 's' : ''} (Free)</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p>{customer.full_name}</p>
          </div>
        </div>

        {/* Add-ons Section */}
        {addons && addons.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Selected Add-ons
            </h3>
            <div className="space-y-2">
              {addons.map((addon, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {addon.pickup_zone_name ? (
                        <MapPin className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Package className="h-3 w-3 text-purple-500" />
                      )}
                      <span className="font-medium">{addon.name}</span>
                      {addon.qty > 1 && (
                        <span className="text-muted-foreground">x{addon.qty}</span>
                      )}
                    </div>
                    {addon.pickup_zone_name && (
                      <p className="text-xs text-muted-foreground ml-5">
                        Zone: {addon.pickup_zone_name}
                      </p>
                    )}
                    {addon.pickup_info && (
                      <div className="text-xs text-muted-foreground ml-5 mt-1">
                        {addon.pickup_info.hotel_name && (
                          <p>Hotel: {addon.pickup_info.hotel_name}</p>
                        )}
                        {addon.pickup_info.address && (
                          <p>Address: {addon.pickup_info.address}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-muted-foreground">
                    {formatPrice(addon.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="text-center p-6 border rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-5 w-5" />
            <span className="font-medium">Your Ticket{isRoundTrip ? 's' : ''}</span>
          </div>
          <img 
            src={qrCodeUrl} 
            alt="QR Ticket" 
            className="mx-auto rounded-lg border"
            width={200}
            height={200}
          />
          <p className="text-xs text-muted-foreground mt-4">
            Show this QR code when boarding
          </p>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 text-sm">
          {subtotalAmount !== undefined && subtotalAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Ticket Price {isRoundTrip && '(Round Trip)'}
              </span>
              <span>{formatPrice(subtotalAmount)}</span>
            </div>
          )}
          {addonsAmount !== undefined && addonsAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-ons</span>
              <span>{formatPrice(addonsAmount)}</span>
            </div>
          )}
          {discountAmount !== undefined && discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
          <span className="font-medium">Total Paid</span>
          <span className="text-xl font-bold text-primary">{formatPrice(totalAmount)}</span>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>✓ Please arrive at the port at least 30 minutes before departure</p>
          <p>✓ Bring a valid ID for check-in</p>
          {paxInfant > 0 && (
            <p>✓ Infants (0-2 years) travel free but must be accompanied by an adult</p>
          )}
          <p>✓ Screenshot this ticket for offline access</p>
        </div>

        {customer.email && (
          <p className="text-sm text-center text-muted-foreground">
            A confirmation has been sent to {customer.email}
          </p>
        )}

        <Button variant="outline" className="w-full" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Save Ticket{isRoundTrip ? 's' : ''}
        </Button>
      </CardContent>
    </Card>
  );
};
