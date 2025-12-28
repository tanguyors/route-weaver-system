import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentLink, PaymentLinkStatus } from '@/hooks/usePaymentLinksData';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  XCircle,
  Eye,
  MessageCircle,
  Mail,
} from 'lucide-react';
import PaymentLinkDetailModal from './PaymentLinkDetailModal';

interface PaymentLinkListProps {
  paymentLinks: PaymentLink[];
  onCopy: (url: string) => void;
  onCancel: (id: string) => Promise<boolean>;
}

const statusConfig: Record<PaymentLinkStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paid: { label: 'Paid', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const PaymentLinkList = ({ paymentLinks, onCopy, onCancel }: PaymentLinkListProps) => {
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendWhatsApp = (link: PaymentLink) => {
    const phone = link.booking?.customer?.phone;
    const message = `Hi! Here's your payment link:\n\n${link.url}\n\nAmount: ${formatCurrency(link.amount, link.currency)}`;
    const url = phone
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = (link: PaymentLink) => {
    const email = link.booking?.customer?.email || '';
    const subject = 'Your Payment Link';
    const body = `Hi,\n\nHere's your payment link:\n${link.url}\n\nAmount: ${formatCurrency(link.amount, link.currency)}\n\nThank you!`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (paymentLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ExternalLink className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-2">No payment links yet</p>
        <p className="text-muted-foreground text-sm">
          Create payment links to send to customers
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentLinks.map((link) => {
              const status = statusConfig[link.status];
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date() && link.status === 'active';
              
              return (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">
                    {formatCurrency(link.amount, link.currency)}
                    <div className="text-xs text-muted-foreground capitalize">
                      {link.provider}
                    </div>
                  </TableCell>
                  <TableCell>
                    {link.booking ? (
                      <div>
                        <div className="font-medium">
                          {link.booking.customer?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.booking.departure?.trip?.trip_name} •{' '}
                          {link.booking.departure?.departure_date}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Standalone</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isExpired ? 'outline' : status.variant}>
                      {isExpired ? 'Expired' : status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {link.expires_at ? (
                      <span className={isExpired ? 'text-muted-foreground' : ''}>
                        {format(new Date(link.expires_at), 'dd MMM yyyy HH:mm')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(link.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedLink(link)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {link.url && link.status === 'active' && (
                          <>
                            <DropdownMenuItem onClick={() => onCopy(link.url!)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendWhatsApp(link)}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Send via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(link)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send via Email
                            </DropdownMenuItem>
                          </>
                        )}
                        {link.status === 'active' && (
                          <DropdownMenuItem
                            onClick={() => onCancel(link.id)}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Link
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PaymentLinkDetailModal
        link={selectedLink}
        open={!!selectedLink}
        onOpenChange={(open) => !open && setSelectedLink(null)}
        onCopy={onCopy}
        onCancel={onCancel}
      />
    </>
  );
};

export default PaymentLinkList;
