import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Banknote } from 'lucide-react';
import { ActivityPayoutStatus } from '@/hooks/useActivityPayoutsData';

interface PayoutStatusBadgeProps {
  status: ActivityPayoutStatus;
}

const statusConfig: Record<ActivityPayoutStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'outline'; 
  icon: typeof Clock;
  className: string;
}> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary', 
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  approved: { 
    label: 'Approved', 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  paid: { 
    label: 'Paid', 
    variant: 'outline', 
    icon: Banknote,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
};

const PayoutStatusBadge = ({ status }: PayoutStatusBadgeProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <StatusIcon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default PayoutStatusBadge;
