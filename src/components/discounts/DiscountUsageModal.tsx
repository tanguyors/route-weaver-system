import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DiscountRule, DiscountUsage } from '@/hooks/useDiscountsData';

interface DiscountUsageModalProps {
  open: boolean;
  onClose: () => void;
  discount: DiscountRule | null;
  fetchUsage: (discountRuleId: string) => Promise<DiscountUsage[]>;
}

const DiscountUsageModal = ({ open, onClose, discount, fetchUsage }: DiscountUsageModalProps) => {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<DiscountUsage[]>([]);

  useEffect(() => {
    if (open && discount) {
      setLoading(true);
      fetchUsage(discount.id).then((data) => {
        setUsage(data);
        setLoading(false);
      });
    }
  }, [open, discount, fetchUsage]);

  if (!discount) return null;

  const totalDiscounted = usage.reduce((sum, u) => sum + u.discounted_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Usage Statistics: {discount.code || 'Automatic Discount'}
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{discount.usage_count}</div>
              <div className="text-sm text-muted-foreground">Total Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {discount.usage_limit ? `${discount.usage_limit - discount.usage_count}` : '∞'}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                IDR {totalDiscounted.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Discounted</div>
            </CardContent>
          </Card>
        </div>

        {/* Usage History */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : usage.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No usage history yet</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {format(new Date(u.used_at), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {u.customer_email || u.customer_phone || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      IDR {u.discounted_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DiscountUsageModal;
