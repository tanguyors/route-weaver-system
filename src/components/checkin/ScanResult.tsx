import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle, Users, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ValidationResult {
  success: boolean;
  message: string;
  reason?: 'already_used' | 'cancelled' | 'refunded' | 'expired' | 'invalid' | 'wrong_departure';
  ticket?: {
    id: string;
    booking: {
      id: string;
      pax_adult: number;
      pax_child: number;
      customer: {
        full_name: string;
      };
      departure: {
        departure_date: string;
        departure_time: string;
        trip: {
          trip_name: string;
        };
        route: {
          origin: { name: string };
          destination: { name: string };
        };
      };
    };
  };
}

interface ScanResultProps {
  result: ValidationResult;
  onContinue: () => void;
}

const ScanResult = ({ result, onContinue }: ScanResultProps) => {
  const isSuccess = result.success;
  const ticket = result.ticket;

  return (
    <div
      className={`p-6 rounded-xl text-center ${
        isSuccess
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-red-50 border-2 border-red-500'
      }`}
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">
        {isSuccess ? (
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        )}
      </div>

      {/* Message */}
      <h2
        className={`text-2xl font-bold mb-2 ${
          isSuccess ? 'text-green-700' : 'text-red-700'
        }`}
      >
        {isSuccess ? 'Valid Ticket' : 'Invalid Ticket'}
      </h2>
      <p
        className={`text-lg mb-4 ${
          isSuccess ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {result.message}
      </p>

      {/* Ticket Details (if available) */}
      {ticket && (
        <div className="bg-white rounded-lg p-4 mt-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">
                {ticket.booking.customer.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.booking.pax_adult} Adult
                {ticket.booking.pax_child > 0 &&
                  `, ${ticket.booking.pax_child} Child`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{ticket.booking.departure.trip.trip_name}</p>
              <p className="text-sm text-muted-foreground">
                {ticket.booking.departure.route.origin.name} →{' '}
                {ticket.booking.departure.route.destination.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {format(
                  new Date(ticket.booking.departure.departure_date),
                  'EEEE, dd MMMM yyyy'
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.booking.departure.departure_time}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Reason */}
      {!isSuccess && result.reason && (
        <div className="flex items-center justify-center gap-2 mt-4 text-amber-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="capitalize">{result.reason.replace('_', ' ')}</span>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        size="lg"
        className="mt-6 w-full"
        variant={isSuccess ? 'default' : 'outline'}
      >
        Scan Next Ticket
      </Button>
    </div>
  );
};

export default ScanResult;
