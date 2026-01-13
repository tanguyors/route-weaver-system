import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Printer } from 'lucide-react';
import { TicketPDF } from './TicketPDF';
import { PaymentMethod } from './BookingStepPayment';

interface PassengerInfo {
  name: string;
  age: string;
  idNumber: string;
}

interface TripInfo {
  route: string;
  originName?: string;
  destName?: string;
  date: string;
  time: string;
  price?: number;
}

interface PickupInfo {
  name: string;
  details?: string;
  price: number;
}

interface BookingSuccessProps {
  bookingId: string;
  qrToken: string;
  departure: TripInfo;
  returnTrip?: TripInfo;
  paxAdult?: number;
  paxChild?: number;
  paxInfant?: number;
  passengers?: PassengerInfo[];
  customer: {
    full_name: string;
    email: string;
    phone?: string;
    country?: string;
  };
  totalAmount: number;
  subtotalAmount?: number;
  addonsAmount?: number;
  discountAmount?: number;
  pickups?: PickupInfo[];
  paymentMethod?: PaymentMethod;
  partnerName?: string;
  partnerLogo?: string;
  primaryColor?: string;
  // Legacy props for backward compatibility
  addons?: any[];
}

export const BookingSuccess = ({
  bookingId,
  qrToken,
  departure,
  returnTrip,
  paxAdult = 1,
  paxChild = 0,
  paxInfant = 0,
  passengers = [],
  customer,
  totalAmount,
  subtotalAmount,
  addonsAmount,
  discountAmount,
  pickups = [],
  paymentMethod = 'cash',
  partnerName,
  partnerLogo,
  primaryColor = '#1B5E3B',
}: BookingSuccessProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger browser print dialog which can save as PDF
    window.print();
  };

  const isRoundTrip = !!returnTrip;

  // Build TripInfo for TicketPDF
  const outboundForTicket = {
    route: departure.route,
    originName: departure.originName || departure.route.split(' → ')[0] || '',
    destName: departure.destName || departure.route.split(' → ')[1] || '',
    date: departure.date,
    time: departure.time?.slice(0, 5) || '',
    price: departure.price || (subtotalAmount ? (isRoundTrip ? subtotalAmount / 2 : subtotalAmount) : 0),
  };

  const returnForTicket = returnTrip ? {
    route: returnTrip.route,
    originName: returnTrip.originName || returnTrip.route.split(' → ')[0] || '',
    destName: returnTrip.destName || returnTrip.route.split(' → ')[1] || '',
    date: returnTrip.date,
    time: returnTrip.time?.slice(0, 5) || '',
    price: returnTrip.price || (subtotalAmount ? subtotalAmount / 2 : 0),
  } : undefined;

  // Ensure customer has required fields
  const customerForTicket = {
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone || '',
    country: customer.country || '',
  };

  return (
    <div className="space-y-6">
      {/* Success Header Card */}
      <Card className="overflow-hidden">
        <div 
          className="text-white p-6 text-center"
          style={{ backgroundColor: '#10b981' }}
        >
          <CheckCircle className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-emerald-100">
            {isRoundTrip ? 'Your round trip tickets have been generated' : 'Your ticket has been generated'}
          </p>
          <p className="text-sm mt-2 opacity-90">
            Reference: <span className="font-mono font-bold">{bookingId.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        <CardContent className="p-6">
          <div className="flex gap-4 justify-center">
            <Button onClick={handlePrint} variant="outline" className="flex-1 max-w-xs">
              <Printer className="h-4 w-4 mr-2" />
              Print Ticket
            </Button>
            <Button 
              onClick={handleDownload} 
              className="flex-1 max-w-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {customer.email && (
            <p className="text-center text-sm text-gray-500 mt-4">
              A confirmation email has been sent to {customer.email}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Printable Ticket */}
      <div className="print:block">
        <TicketPDF
          ref={ticketRef}
          bookingId={bookingId}
          qrToken={qrToken}
          outbound={outboundForTicket}
          returnTrip={returnForTicket}
          paxAdult={paxAdult}
          paxChild={paxChild}
          paxInfant={paxInfant}
          passengers={passengers}
          customer={customerForTicket}
          totalAmount={totalAmount}
          subtotalAmount={subtotalAmount}
          addonsAmount={addonsAmount}
          discountAmount={discountAmount}
          pickups={pickups}
          paymentMethod={paymentMethod}
          partnerName={partnerName}
          partnerLogo={partnerLogo}
          primaryColor={primaryColor}
        />
      </div>

      {/* Instructions */}
      <Card className="print:hidden">
        <CardContent className="p-6">
          <h3 className="font-bold mb-3">What's Next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Save or print your ticket before your trip</li>
            <li>✓ Arrive at the port at least 30 minutes before departure</li>
            <li>✓ Present your QR code and valid ID at check-in</li>
            <li>✓ Keep your ticket safe until boarding is complete</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
