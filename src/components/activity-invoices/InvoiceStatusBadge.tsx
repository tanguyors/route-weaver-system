import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { ActivityInvoiceStatus } from '@/hooks/useActivityInvoicesData';

interface InvoiceStatusBadgeProps {
  status: ActivityInvoiceStatus;
}

const statusConfig: Record<ActivityInvoiceStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
  icon: typeof FileText;
  className: string;
}> = {
  draft: { 
    label: 'Draft', 
    variant: 'secondary', 
    icon: FileText,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  },
  issued: { 
    label: 'Issued', 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  void: { 
    label: 'Void', 
    variant: 'destructive', 
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
};

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <StatusIcon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;
