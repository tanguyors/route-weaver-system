import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useActivityPayoutsData } from '@/hooks/useActivityPayoutsData';
import { Loader2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
}

interface GeneratePayoutModalProps {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
}

const GeneratePayoutModal = ({ open, onClose, partners }: GeneratePayoutModalProps) => {
  const { toast } = useToast();
  const { generatePayout, isGenerating } = useActivityPayoutsData();
  
  const lastMonth = subMonths(new Date(), 1);
  const defaultStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

  const [partnerId, setPartnerId] = useState('');
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);

  const handleSubmit = async () => {
    if (!partnerId || !periodStart || !periodEnd) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await generatePayout({
        partnerId,
        periodStart,
        periodEnd,
      });

      if (result.success) {
        toast({
          title: 'Payout generated',
          description: `Net amount: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(result.net_amount || 0)}`,
        });
        onClose();
        setPartnerId('');
      } else {
        toast({
          title: 'Cannot generate payout',
          description: result.error || 'Payout already exists for this period',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Payout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePayoutModal;
