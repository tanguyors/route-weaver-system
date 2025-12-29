import { Card, CardContent } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { PartnerInfo, PartnerSettings } from '@/hooks/useSettingsData';

interface TicketPreviewProps {
  partnerInfo: PartnerInfo | null;
  settings: PartnerSettings | null;
}

const TicketPreview = ({ partnerInfo, settings }: TicketPreviewProps) => {
  // Sample data for preview
  const sampleData = {
    bookingRef: 'BK-2024-001234',
    customerName: 'John Doe',
    customerEmail: 'john.doe@email.com',
    customerPhone: '+62 812 3456 7890',
    route: 'Sanur → Nusa Penida',
    departureDate: new Date(),
    departureTime: '08:30',
    paxAdult: 2,
    paxChild: 1,
    totalAmount: 750000,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: settings?.currency || 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="bg-white border-2 border-dashed border-muted-foreground/30">
      <CardContent className="p-0">
        {/* Ticket Container */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {/* Header with Logo */}
          <div className="bg-primary text-primary-foreground p-4 text-center">
            {partnerInfo?.logo_url ? (
              <img 
                src={partnerInfo.logo_url} 
                alt={partnerInfo.name} 
                className="h-12 mx-auto mb-2 object-contain"
              />
            ) : (
              <div className="h-12 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">{partnerInfo?.name || 'Your Company'}</span>
              </div>
            )}
            <p className="text-sm opacity-90">{partnerInfo?.website || 'www.yourcompany.com'}</p>
          </div>

          {/* Ticket Title */}
          <div className="bg-secondary/50 py-2 px-4 text-center border-b">
            <h3 className="text-lg font-semibold text-foreground">E-TICKET / BOARDING PASS</h3>
          </div>

          {/* Booking Reference & QR Code */}
          <div className="p-4 flex justify-between items-start border-b">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Booking Reference</p>
              <p className="text-xl font-bold font-mono text-primary">{sampleData.bookingRef}</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm border">
              <QRCodeSVG 
                value={`TICKET:${sampleData.bookingRef}`}
                size={80}
                level="M"
              />
            </div>
          </div>

          {/* Route & Date Info */}
          <div className="p-4 bg-muted/30 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">FROM</p>
                <p className="font-semibold">Sanur</p>
              </div>
              <div className="px-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">TO</p>
                <p className="font-semibold">Nusa Penida</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">DATE</p>
                <p className="font-semibold">{format(sampleData.departureDate, 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TIME</p>
                <p className="font-semibold">{sampleData.departureTime}</p>
              </div>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="p-4 border-b">
            <p className="text-xs text-muted-foreground uppercase mb-2">Passenger Details</p>
            <div className="space-y-1">
              <p className="font-semibold">{sampleData.customerName}</p>
              <p className="text-sm text-muted-foreground">{sampleData.customerEmail}</p>
              <p className="text-sm text-muted-foreground">{sampleData.customerPhone}</p>
            </div>
            <div className="flex gap-4 mt-3">
              <div className="bg-secondary/50 px-3 py-1 rounded text-sm">
                <span className="text-muted-foreground">Adults:</span> <span className="font-semibold">{sampleData.paxAdult}</span>
              </div>
              <div className="bg-secondary/50 px-3 py-1 rounded text-sm">
                <span className="text-muted-foreground">Children:</span> <span className="font-semibold">{sampleData.paxChild}</span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-primary/5 border-b">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="text-xl font-bold text-primary">{formatPrice(sampleData.totalAmount)}</span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="p-4 bg-muted/20">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Terms & Conditions</p>
            <div className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
              {settings?.terms_booking ? (
                <p className="whitespace-pre-line">{settings.terms_booking}</p>
              ) : (
                <>
                  <p>• Please arrive at the port 30 minutes before departure</p>
                  <p>• Present this e-ticket (printed or on mobile) at check-in</p>
                  <p>• Valid ID required for all passengers</p>
                  <p>• Non-refundable unless cancelled within policy terms</p>
                </>
              )}
            </div>
          </div>

          {/* Footer with Contact */}
          <div className="p-3 bg-secondary/30 text-center border-t">
            <p className="text-xs text-muted-foreground">
              {partnerInfo?.contact_phone && `📞 ${partnerInfo.contact_phone}`}
              {partnerInfo?.contact_phone && partnerInfo?.contact_email && ' | '}
              {partnerInfo?.contact_email && `✉️ ${partnerInfo.contact_email}`}
            </p>
            {!partnerInfo?.contact_phone && !partnerInfo?.contact_email && (
              <p className="text-xs text-muted-foreground">Contact: +62 xxx xxxx xxxx | info@company.com</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketPreview;
