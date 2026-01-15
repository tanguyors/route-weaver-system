import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle, Users, MapPin, Clock, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ValidationResult {
  success: boolean;
  message: string;
  leg?: 'outbound' | 'return';
  reason?: 'already_used' | 'cancelled' | 'refunded' | 'expired' | 'invalid' | 'wrong_departure';
  warning?: string;
  remainingLegs?: {
    outbound: 'validated' | 'pending' | 'just_validated';
    return: 'validated' | 'pending' | 'just_validated' | null;
  };
  ticket?: {
    id: string;
    route?: string;
    departure_time?: string;
    departure_date?: string;
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
      return_departure?: {
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
  const leg = result.leg;

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

      {/* Leg Badge */}
      {leg && isSuccess && (
        <Badge 
          variant="outline" 
          className={`mb-2 ${leg === 'outbound' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-purple-100 text-purple-700 border-purple-300'}`}
        >
          <ArrowRight className="w-3 h-3 mr-1" />
          {leg === 'outbound' ? 'Outbound Trip' : 'Return Trip'}
        </Badge>
      )}

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

      {/* Warning */}
      {result.warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{result.warning}</span>
        </div>
      )}

      {/* Ticket Details (if available) */}
      {ticket && (
        <div className="bg-white rounded-lg p-4 mt-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">
                {ticket.booking.customer?.full_name || 'Unknown'}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.booking.pax_adult} Adult
                {ticket.booking.pax_child > 0 &&
                  `, ${ticket.booking.pax_child} Child`}
              </p>
            </div>
          </div>

          {/* Show validated leg route info */}
          {ticket.route && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{ticket.route}</p>
                {ticket.departure_date && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(ticket.departure_date), 'EEEE, dd MMM yyyy')} at {ticket.departure_time?.slice(0, 5)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fallback to booking departure info if route not provided */}
          {!ticket.route && ticket.booking.departure && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{ticket.booking.departure.trip?.trip_name}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.booking.departure.route?.origin?.name} →{' '}
                  {ticket.booking.departure.route?.destination?.name}
                </p>
              </div>
            </div>
          )}

          {!ticket.route && ticket.booking.departure && (
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
                  {ticket.booking.departure.departure_time?.slice(0, 5)}
                </p>
              </div>
            </div>
          )}

          {/* Remaining Legs Status */}
          {result.remainingLegs && result.remainingLegs.return !== null && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                Ticket Status
              </p>
              <div className="flex gap-2">
                <Badge 
                  variant="outline" 
                  className={
                    result.remainingLegs.outbound === 'just_validated' 
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : result.remainingLegs.outbound === 'validated'
                      ? 'bg-gray-100 text-gray-600 border-gray-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                  }
                >
                  Outbound: {result.remainingLegs.outbound === 'just_validated' ? '✓ Just validated' : result.remainingLegs.outbound === 'validated' ? '✓ Validated' : 'Pending'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={
                    result.remainingLegs.return === 'just_validated' 
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : result.remainingLegs.return === 'validated'
                      ? 'bg-gray-100 text-gray-600 border-gray-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                  }
                >
                  Return: {result.remainingLegs.return === 'just_validated' ? '✓ Just validated' : result.remainingLegs.return === 'validated' ? '✓ Validated' : 'Pending'}
                </Badge>
              </div>
            </div>
          )}
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
