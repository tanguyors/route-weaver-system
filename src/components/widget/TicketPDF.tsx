import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Ship, Calendar, Clock, Users, MapPin, CreditCard, Phone, Mail, Anchor } from 'lucide-react';
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
  arrivalTime?: string;
  boatName?: string;
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

  // Calculate ticket price for display
  const ticketPrice = subtotalAmount || (outbound.price + (returnTrip?.price || 0));
  const pickupsTotal = pickups.reduce((sum, p) => sum + p.price, 0);

  return (
    <div 
      ref={ref}
      className="bg-white max-w-[800px] mx-auto print:max-w-full"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div 
        className="text-center py-4 px-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {partnerLogo ? (
          <img src={partnerLogo} alt={partnerName} className="h-10 mx-auto mb-1" />
        ) : (
          <h1 className="text-2xl font-bold">{partnerName}</h1>
        )}
        <p className="text-sm opacity-90">E-TICKET / BOARDING PASS</p>
      </div>

      {/* Booking Reference & QR */}
      <div className="border-x border-b p-6 flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">BOOKING REFERENCE</p>
          <p className="text-3xl font-bold font-mono mt-1" style={{ color: primaryColor }}>
            {bookingRef}
          </p>
        </div>
        <div className="text-right">
          <QRCodeSVG 
            value={qrToken}
            size={90}
            level="H"
            includeMargin={false}
          />
          <p className="text-xs text-gray-400 mt-2">Scan for check-in</p>
        </div>
      </div>

      {/* Trip Details - Outbound */}
      <div className="border-x border-b p-6">
        <div className="flex items-start gap-3">
          <div 
            className="w-1 self-stretch rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="flex-1">
            <p 
              className="text-xs font-medium uppercase tracking-wide mb-3"
              style={{ color: primaryColor }}
            >
              {isRoundTrip ? 'OUTBOUND TRIP' : 'TRIP DETAILS'}
            </p>
            
            <div className="flex items-center gap-2 mb-2">
              <Ship className="h-5 w-5" style={{ color: primaryColor }} />
              <span className="font-bold text-lg">{outbound.originName} → {outbound.destName}</span>
            </div>

            {outbound.boatName && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <Anchor className="h-4 w-4" />
                <span>Boat: <span className="font-medium">{outbound.boatName}</span></span>
              </div>
            )}
            
            <div className="flex items-center gap-6 text-sm mt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{format(new Date(outbound.date), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{outbound.time}</span>
                {outbound.arrivalTime && (
                  <span className="text-gray-500">→ {outbound.arrivalTime}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg" style={{ color: primaryColor }}>
              {formatPrice(outbound.price)}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Details - Return */}
      {returnTrip && (
        <div className="border-x border-b p-6">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full bg-emerald-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-3">
                RETURN TRIP
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-lg">{returnTrip.originName} → {returnTrip.destName}</span>
              </div>

              {returnTrip.boatName && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <Anchor className="h-4 w-4" />
                  <span>Boat: <span className="font-medium">{returnTrip.boatName}</span></span>
                </div>
              )}
              
              <div className="flex items-center gap-6 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{format(new Date(returnTrip.date), 'EEEE, dd MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{returnTrip.time}</span>
                  {returnTrip.arrivalTime && (
                    <span className="text-gray-500">→ {returnTrip.arrivalTime}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-emerald-600">
                {formatPrice(returnTrip.price)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Details */}
      <div className="border-x border-b p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Passenger Details
        </h3>
        
        <div className="bg-gray-50 rounded-lg px-4 py-2 mb-4 inline-block">
          <span className="text-gray-600">Adults: </span>
          <span className="font-medium">{paxAdult}</span>
          {paxChild > 0 && (
            <>
              <span className="mx-3 text-gray-300">|</span>
              <span className="text-gray-600">Children: </span>
              <span className="font-medium">{paxChild}</span>
            </>
          )}
          {paxInfant > 0 && (
            <>
              <span className="mx-3 text-gray-300">|</span>
              <span className="text-gray-600">Infants: </span>
              <span className="font-medium">{paxInfant}</span>
              <span className="text-emerald-600 ml-1">(Free)</span>
            </>
          )}
        </div>
        
        {/* Passenger List */}
        {passengers.filter(p => p.name).length > 0 && (
          <div className="space-y-2 mt-4">
            {passengers.filter(p => p.name).map((passenger, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="text-gray-500 mr-2">{index + 1}.</span>
                  <span className="font-medium">{passenger.name}</span>
                  {passenger.age && (
                    <span className="text-gray-400 ml-2">({passenger.age} yrs)</span>
                  )}
                </div>
                {passenger.idNumber && (
                  <span className="text-gray-500 text-sm">ID: {passenger.idNumber}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickup Services */}
      {pickups.length > 0 && (
        <div className="border-x border-b p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pickup Services
          </h3>
          {pickups.map((pickup, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>
                {pickup.name}
                {pickup.details && <span className="text-gray-500"> - {pickup.details}</span>}
              </span>
              <span className="font-medium">{formatPrice(pickup.price)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contact Information */}
      <div className="border-x border-b p-6">
        <h3 className="font-bold mb-3">Contact Information</h3>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Name: </span>
            <span className="font-medium">{customer.full_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-x border-b p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Payment Method:</span>
          <span className="font-bold">{paymentMethodLabels[paymentMethod]}</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-x border-b p-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ticket Price</span>
          <span>{formatPrice(ticketPrice)}</span>
        </div>
        {pickupsTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pickup Services</span>
            <span>{formatPrice(pickupsTotal)}</span>
          </div>
        )}
        {addonsAmount !== undefined && addonsAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Add-ons</span>
            <span>{formatPrice(addonsAmount)}</span>
          </div>
        )}
        {discountAmount !== undefined && discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        
        {/* Total */}
        <div 
          className="flex justify-between items-center pt-3 mt-3 border-t-2"
          style={{ borderColor: primaryColor }}
        >
          <span className="font-bold text-lg">TOTAL</span>
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Important Information */}
      <div className="border-x border-b p-6 bg-gray-50">
        <h4 className="font-bold text-sm mb-3">Important Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
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
      <div className="border-x border-b rounded-b-lg text-center py-4 text-sm text-gray-400">
        <p>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
        <p>Powered by SriBooking.com</p>
      </div>
    </div>
  );
});

TicketPDF.displayName = 'TicketPDF';
