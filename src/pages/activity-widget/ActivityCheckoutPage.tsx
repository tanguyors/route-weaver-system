import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Timer,
} from 'lucide-react';
import { useActivityBookingData, LineItem } from '@/hooks/useActivityWidgetData';
import { toast } from 'sonner';

const ActivityCheckoutPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { booking, isLoading, confirmBooking, isConfirming, refetch } = useActivityBookingData(bookingId);
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Update countdown timer
  useEffect(() => {
    if (!booking || booking.is_expired || booking.status !== 'draft') return;
    
    const updateTimer = () => {
      const expiresAt = parseISO(booking.expires_at);
      const seconds = Math.max(0, differenceInSeconds(expiresAt, new Date()));
      setTimeLeft(seconds);
      
      if (seconds === 0) {
        refetch();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking, refetch]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleConfirm = async () => {
    try {
      await confirmBooking();
      toast.success('Booking confirmed!');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to confirm booking');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-4">This booking does not exist or has been removed.</p>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Expired state
  if (booking.is_expired || booking.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Booking Expired</h2>
              <p className="text-muted-foreground mb-4">
                Your reservation has expired. Please start a new booking.
              </p>
              <Button asChild>
                <Link to={`/widget/activity/${booking.product_id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Book Again
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Confirmed state
  if (booking.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-4">
                Your reservation has been confirmed. You will receive a confirmation email shortly.
              </p>
              <Badge variant="outline" className="text-lg px-4 py-2">
                #{booking.id.slice(0, 8).toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{booking.product_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              {booking.slot_time && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.slot_time.slice(0, 5)}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{booking.total_qty} {booking.total_qty === 1 ? 'person' : 'people'}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {(booking.line_items as LineItem[]).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.tier_name || `${item.duration_value} ${item.duration_unit}${(item.duration_value || 1) > 1 ? 's' : ''}`} x {item.qty}
                    </span>
                    <span>IDR {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>IDR {booking.subtotal_amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Draft state - show checkout
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Timer Warning */}
        <Card className={timeLeft < 300 ? 'border-amber-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span className="text-sm">Reservation expires in</span>
              </div>
              <Badge variant={timeLeft < 300 ? 'destructive' : 'secondary'} className="text-lg px-3">
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{booking.product_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            {booking.slot_time && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.slot_time.slice(0, 5)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.total_qty} {booking.total_qty === 1 ? 'person' : 'people'}</span>
            </div>
            
            <Separator />
            
            {/* Line Items */}
            <div className="space-y-2">
              {(booking.line_items as LineItem[]).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.tier_name || `${item.duration_value} ${item.duration_unit}${(item.duration_value || 1) > 1 ? 's' : ''}`} x {item.qty}
                  </span>
                  <span>IDR {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>IDR {booking.subtotal_amount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Customer Info */}
        {booking.customer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Name:</strong> {(booking.customer as { name?: string }).name}</p>
              <p><strong>Email:</strong> {(booking.customer as { email?: string }).email}</p>
              {(booking.customer as { phone?: string }).phone && (
                <p><strong>Phone:</strong> {(booking.customer as { phone?: string }).phone}</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Participants */}
        {booking.participants && booking.participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.participants.map((p, i) => (
                <div key={p.id} className="text-sm p-2 rounded bg-muted/50">
                  <p className="font-medium">Participant {i + 1}</p>
                  {p.name && <p>Name: {p.name}</p>}
                  {p.phone && <p>Phone: {p.phone}</p>}
                  {p.age && <p>Age: {p.age}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Actions */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Booking
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              asChild
            >
              <Link to={`/widget/activity/${booking.product_id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modify Booking
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityCheckoutPage;
