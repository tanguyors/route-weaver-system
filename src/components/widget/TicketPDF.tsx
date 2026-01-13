import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Ship, Calendar, Clock, Users, Baby, MapPin, CreditCard, Phone, Mail } from 'lucide-react';
import { PaymentMethod } from './BookingStepPayment';

interface PassengerInfo {
  name: string;
  age: string;
  idNumber: string;
}

interface TripInfo {
  route: string;
  originName: string;
  destName: string;
  date: string;
  time: string;
  price: number;
}

interface PickupInfo {
  name: string;
  details?: string;
  price: number;
}

interface TicketPDFProps {
  bookingId: string;
  qrToken: string;
  outbound: TripInfo;
  returnTrip?: TripInfo;
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  passengers: PassengerInfo[];
  customer: {
    full_name: string;
    email: string;
    phone: string;
    country: string;
  };
  totalAmount: number;
  subtotalAmount?: number;
  addonsAmount?: number;
  discountAmount?: number;
  pickups?: PickupInfo[];
  paymentMethod: PaymentMethod;
  partnerName?: string;
  partnerLogo?: string;
  primaryColor?: string;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash at Partner Office',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit/Debit Card',
  xendit: 'Online Payment (Xendit)',
};

export const TicketPDF = forwardRef<HTMLDivElement, TicketPDFProps>(({
  bookingId,
  qrToken,
  outbound,
  returnTrip,
  paxAdult,
  paxChild,
  paxInfant,
  passengers,
  customer,
  totalAmount,
  subtotalAmount,
  addonsAmount,
  discountAmount,
  pickups = [],
  paymentMethod,
  partnerName = 'Fast Boat Operator',
  partnerLogo,
  primaryColor = '#1B5E3B',
}, ref) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isRoundTrip = !!returnTrip;
  const bookingRef = bookingId.slice(0, 8).toUpperCase();

  return (
    <div 
      ref={ref}
      className="bg-white p-6 max-w-[800px] mx-auto print:p-4 print:max-w-full"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div 
        className="text-center p-4 rounded-t-lg text-white mb-0"
        style={{ backgroundColor: primaryColor }}
      >
        {partnerLogo ? (
          <img src={partnerLogo} alt={partnerName} className="h-12 mx-auto mb-2" />
        ) : (
          <h1 className="text-2xl font-bold">{partnerName}</h1>
        )}
        <p className="text-sm opacity-90">E-TICKET / BOARDING PASS</p>
      </div>

      {/* Booking Reference & QR */}
      <div className="border border-t-0 p-4 flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase">Booking Reference</p>
          <p className="text-2xl font-bold font-mono" style={{ color: primaryColor }}>
            {bookingRef}
          </p>
          {isRoundTrip && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Round Trip
            </span>
          )}
        </div>
        <div className="text-center">
          <QRCodeSVG 
            value={qrToken}
            size={100}
            level="H"
            includeMargin={true}
            className="border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">Scan for check-in</p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="border border-t-0 p-4 space-y-4">
        {/* Outbound */}
        <div className="flex items-start gap-4">
          <div 
            className="w-1 self-stretch rounded"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase mb-2" style={{ color: primaryColor }}>
              {isRoundTrip ? 'OUTBOUND TRIP' : 'TRIP DETAILS'}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Ship className="h-5 w-5" style={{ color: primaryColor }} />
              <span className="font-bold text-lg">{outbound.route}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{format(new Date(outbound.date), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{outbound.time}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold" style={{ color: primaryColor }}>
              {formatPrice(outbound.price)}
            </p>
          </div>
        </div>

        {/* Return */}
        {returnTrip && (
          <div className="flex items-start gap-4 pt-4 border-t">
            <div className="w-1 self-stretch rounded bg-emerald-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-emerald-600 uppercase mb-2">
                RETURN TRIP
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-lg">{returnTrip.route}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(returnTrip.date), 'EEEE, dd MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{returnTrip.time}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600">
                {formatPrice(returnTrip.price)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Passenger Details */}
      <div className="border border-t-0 p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Passenger Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {/* Summary */}
          <div className="bg-gray-50 rounded p-2">
            <span className="text-gray-600">Adults:</span>{' '}
            <span className="font-medium">{paxAdult}</span>
            {paxChild > 0 && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-gray-600">Children:</span>{' '}
                <span className="font-medium">{paxChild}</span>
              </>
            )}
            {paxInfant > 0 && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-emerald-600 flex items-center gap-1 inline-flex">
                  <Baby className="h-3 w-3" />
                  Infants: {paxInfant} (Free)
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Passenger List */}
        <div className="mt-3 space-y-1">
          {passengers.filter(p => p.name).map((passenger, index) => (
            <div key={index} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
              <span>
                <span className="text-gray-500 mr-2">{index + 1}.</span>
                {passenger.name}
                {passenger.age && <span className="text-gray-400 ml-2">({passenger.age} yrs)</span>}
              </span>
              {passenger.idNumber && (
                <span className="text-gray-500 text-xs">ID: {passenger.idNumber}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pickups */}
      {pickups.length > 0 && (
        <div className="border border-t-0 p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pickup Services
          </h3>
          {pickups.map((pickup, index) => (
            <div key={index} className="flex justify-between text-sm py-1">
              <span>{pickup.name} {pickup.details && `- ${pickup.details}`}</span>
              <span className="font-medium">{formatPrice(pickup.price)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Customer Contact */}
      <div className="border border-t-0 p-4">
        <h3 className="font-bold mb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{' '}
            <span className="font-medium">{customer.full_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-gray-400" />
            <span>{customer.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
        </div>
      </div>

      {/* Payment & Total */}
      <div className="border border-t-0 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Payment Method:</span>
            <span className="font-medium">{paymentMethodLabels[paymentMethod]}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-1 text-sm border-t pt-3">
          {subtotalAmount !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Price</span>
              <span>{formatPrice(subtotalAmount)}</span>
            </div>
          )}
          {addonsAmount !== undefined && addonsAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Add-ons & Services</span>
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

        <div 
          className="flex justify-between items-center mt-3 pt-3 border-t-2"
          style={{ borderColor: primaryColor }}
        >
          <span className="font-bold text-lg">TOTAL</span>
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Terms */}
      <div className="border border-t-0 p-4 bg-gray-50 rounded-b-lg">
        <h4 className="font-medium text-sm mb-2">Important Information</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Please arrive at the port at least 30 minutes before departure</li>
          <li>• Present this e-ticket (printed or on mobile) at check-in counter</li>
          <li>• Valid ID (Passport/KTP) required for all passengers</li>
          {paxInfant > 0 && (
            <li>• Infants (0-2 years) travel free but must be accompanied by an adult</li>
          )}
          <li>• This ticket is non-transferable</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-400">
        <p>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
        <p>Powered by SriBooking.com</p>
      </div>
    </div>
  );
});

TicketPDF.displayName = 'TicketPDF';
