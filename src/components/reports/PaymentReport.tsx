import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Wallet, Building2, Banknote, Link } from 'lucide-react';

interface PaymentMetrics {
  byMethod: Record<string, { count: number; amount: number }>;
  paid: number;
  unpaid: number;
  refunded: number;
  totalRefundAmount: number;
}

interface PaymentReportProps {
  metrics: PaymentMetrics;
  formatCurrency: (amount: number) => string;
}

const methodIcons: Record<string, typeof CreditCard> = {
  card: CreditCard,
  qris: Wallet,
  transfer: Building2,
  cash: Banknote,
  payment_link: Link,
};

const methodLabels: Record<string, string> = {
  card: 'Credit/Debit Card',
  qris: 'QRIS',
  transfer: 'Bank Transfer',
  cash: 'Cash',
  payment_link: 'Payment Link',
};

const PaymentReport = ({ metrics, formatCurrency }: PaymentReportProps) => {
  const methods = Object.entries(metrics.byMethod).sort((a, b) => b[1].amount - a[1].amount);
  const totalAmount = Object.values(metrics.byMethod).reduce((sum, m) => sum + m.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status Summary */}
        <div className="grid sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(metrics.paid)}
            </p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(metrics.unpaid)}
            </p>
            <p className="text-sm text-muted-foreground">Unpaid</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(metrics.refunded)}
            </p>
            <p className="text-sm text-muted-foreground">Refunded</p>
          </div>
        </div>

        {/* Methods Breakdown */}
        <div className="space-y-3">
          {methods.map(([method, data]) => {
            const Icon = methodIcons[method] || Wallet;
            const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;

            return (
              <div key={method} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{methodLabels[method] || method}</p>
                    <p className="font-bold">{formatCurrency(data.amount)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{data.count} transactions</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {methods.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mb-4 opacity-50" />
              <p>No payment data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentReport;
