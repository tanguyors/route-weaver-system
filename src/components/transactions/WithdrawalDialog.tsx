import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSubmit: (amount: number) => Promise<boolean>;
  formatCurrency: (amount: number, currency: string) => string;
}

const WithdrawalDialog = ({
  open,
  onOpenChange,
  availableBalance,
  onSubmit,
  formatCurrency,
}: WithdrawalDialogProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await onSubmit(parseFloat(amount));
    
    if (success) {
      setAmount('');
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const requestedAmount = parseFloat(amount) || 0;
  const isValid = requestedAmount > 0 && requestedAmount <= availableBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to withdraw from your available balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">
              {formatCurrency(availableBalance, 'IDR')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (IDR)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              max={availableBalance}
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            {requestedAmount > availableBalance && (
              <p className="text-sm text-destructive">
                Amount exceeds available balance
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setAmount((availableBalance / 2).toString())}
            >
              50%
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setAmount(availableBalance.toString())}
            >
              Max
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Request Withdrawal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
