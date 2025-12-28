import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PaymentLink, PaymentLinkStatus } from '@/hooks/usePaymentLinksData';
import {
  Copy,
  ExternalLink,
  MessageCircle,
  Mail,
  XCircle,
  Calendar,
  User,
  CreditCard,
  Clock,
} from 'lucide-react';

interface PaymentLinkDetailModalProps {
  link: PaymentLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (url: string) => void;
  onCancel: (id: string) => Promise<boolean>;
}

const statusConfig: Record<PaymentLinkStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paid: { label: 'Paid', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const PaymentLinkDetailModal = ({
  link,
  open,
  onOpenChange,
  onCopy,
  onCancel,
}: PaymentLinkDetailModalProps) => {
  if (!link) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date() && link.status === 'active';
  const status = statusConfig[isExpired ? 'expired' : link.status];

  const handleSendWhatsApp = () => {
    const phone = link.booking?.customer?.phone;
    const message = `Hi! Here's your payment link:\n\n${link.url}\n\nAmount: ${formatCurrency(link.amount, link.currency)}`;
    const url = phone
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const email = link.booking?.customer?.email || '';
    const subject = 'Your Payment Link';
    const body = `Hi,\n\nHere's your payment link:\n${link.url}\n\nAmount: ${formatCurrency(link.amount, link.currency)}\n\nThank you!`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCancel = async () => {
    const success = await onCancel(link.id);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Link Details</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-3xl font-bold">
              {formatCurrency(link.amount, link.currency)}
            </p>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              via {link.provider}
            </p>
          </div>

          {/* Booking Info */}
          {link.booking && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Linked Booking</h4>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {link.booking.customer?.full_name || 'Unknown Customer'}
                    </p>
                    {link.booking.customer?.email && (
                      <p className="text-sm text-muted-foreground">
                        {link.booking.customer.email}
                      </p>
                    )}
                    {link.booking.customer?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {link.booking.customer.phone}
                      </p>
                    )}
                  </div>
                </div>
                {link.booking.departure && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {link.booking.departure.trip?.trip_name || 'Trip'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(link.booking.departure.departure_date),
                          'EEEE, dd MMMM yyyy'
                        )}{' '}
                        at {link.booking.departure.departure_time}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dates */}
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Created
              </span>
              <span>{format(new Date(link.created_at), 'dd MMM yyyy HH:mm')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Expires
              </span>
              <span>
                {link.expires_at
                  ? format(new Date(link.expires_at), 'dd MMM yyyy HH:mm')
                  : 'Never'}
              </span>
            </div>
          </div>

          {/* URL */}
          {link.url && link.status === 'active' && !isExpired && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment URL</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs break-all">
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {link.url}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {link.status === 'active' && !isExpired && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(link.url!)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDetailModal;
