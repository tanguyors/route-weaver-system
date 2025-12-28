import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  MapPin,
  Clock,
  CreditCard,
} from 'lucide-react';

interface PaymentLinkData {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  expires_at: string | null;
  booking?: {
    id: string;
    pax_adult: number;
    pax_child: number;
    total_amount: number;
    customer?: {
      full_name: string;
      email: string | null;
      phone: string | null;
    };
    departure?: {
      departure_date: string;
      departure_time: string;
      trip?: { trip_name: string };
      route?: {
        origin?: { name: string };
        destination?: { name: string };
      };
    };
  };
  partner?: {
    name: string;
    logo_url: string | null;
  };
}

const PaymentPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPaymentLink = async () => {
      if (!token) {
        setError('Invalid payment link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke(
          `process-payment/${token}`,
          { method: 'GET' }
        );

        if (fetchError) throw fetchError;

        if (data.error) {
          setError(data.error);
        } else {
          setPaymentLink(data.data);
        }
      } catch (err: any) {
        console.error('Error fetching payment link:', err);
        setError(err.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentLink();
  }, [token]);

  const handlePayment = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      const { data, error: processError } = await supabase.functions.invoke(
        'process-payment',
        {
          method: 'POST',
          body: { payment_link_token: token },
        }
      );

      if (processError) throw processError;

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your payment has been processed successfully.
            </p>
            {paymentLink?.booking && (
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email with your ticket shortly.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This payment link is invalid or no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Partner Logo/Name */}
        {paymentLink.partner && (
          <div className="text-center mb-6">
            {paymentLink.partner.logo_url ? (
              <img
                src={paymentLink.partner.logo_url}
                alt={paymentLink.partner.name}
                className="h-12 mx-auto mb-2"
              />
            ) : (
              <h1 className="text-xl font-bold">{paymentLink.partner.name}</h1>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
              <p className="text-4xl font-bold">
                {formatCurrency(paymentLink.amount, paymentLink.currency)}
              </p>
            </div>

            {/* Booking Details */}
            {paymentLink.booking && (
              <>
                <Separator />
                <div className="space-y-3">
                  {/* Customer */}
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {paymentLink.booking.customer?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {paymentLink.booking.pax_adult} Adult
                        {paymentLink.booking.pax_child > 0 &&
                          `, ${paymentLink.booking.pax_child} Child`}
                      </p>
                    </div>
                  </div>

                  {/* Trip */}
                  {paymentLink.booking.departure?.trip && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {paymentLink.booking.departure.trip.trip_name}
                        </p>
                        {paymentLink.booking.departure.route && (
                          <p className="text-sm text-muted-foreground">
                            {paymentLink.booking.departure.route.origin?.name} →{' '}
                            {paymentLink.booking.departure.route.destination?.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  {paymentLink.booking.departure && (
                    <>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <p>
                          {format(
                            new Date(paymentLink.booking.departure.departure_date),
                            'EEEE, dd MMMM yyyy'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <p>{paymentLink.booking.departure.departure_time}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Expiration Warning */}
            {paymentLink.expires_at && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-sm text-yellow-800">
                  This payment link expires on{' '}
                  {format(new Date(paymentLink.expires_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
            )}

            <Separator />

            {/* Pay Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by {paymentLink.provider.charAt(0).toUpperCase() + paymentLink.provider.slice(1)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
