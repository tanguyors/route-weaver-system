import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Power, PowerOff, BarChart3 } from 'lucide-react';
import { DiscountRule, DISCOUNT_CATEGORIES } from '@/hooks/useDiscountsData';

interface DiscountListProps {
  discounts: DiscountRule[];
  onEdit: (discount: DiscountRule) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onViewUsage: (discount: DiscountRule) => void;
  canEdit: boolean;
}

const DiscountList = ({ discounts, onEdit, onDelete, onToggleStatus, onViewUsage, canEdit }: DiscountListProps) => {
  const getCategoryLabel = (category: string) => {
    const cat = DISCOUNT_CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  const formatValue = (discount: DiscountRule) => {
    if (discount.discount_value_type === 'percent') {
      return `${discount.discount_value}%`;
    }
    return `IDR ${discount.discount_value.toLocaleString()}`;
  };

  const getUsageText = (discount: DiscountRule) => {
    const used = discount.usage_count || 0;
    const limit = discount.usage_limit;
    if (limit) {
      return `${used} / ${limit}`;
    }
    return `${used} / ∞`;
  };

  if (discounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">No discounts found</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Status</TableHead>
          {canEdit && <TableHead className="w-12"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {discounts.map((discount) => (
          <TableRow key={discount.id}>
            <TableCell>
              <div>
                <div className="font-medium">
                  {discount.code || <span className="text-muted-foreground italic">Auto</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getCategoryLabel(discount.category)}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={discount.type === 'promo_code' ? 'default' : 'secondary'}>
                {discount.type === 'promo_code' ? 'Promo Code' : 'Automatic'}
              </Badge>
            </TableCell>
            <TableCell className="font-mono">
              {formatValue(discount)}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {discount.book_start_date && discount.book_end_date ? (
                  <>
                    {format(new Date(discount.book_start_date), 'dd MMM')} - {format(new Date(discount.book_end_date), 'dd MMM yyyy')}
                  </>
                ) : (
                  <span className="text-muted-foreground">No limit</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {getUsageText(discount)}
              </div>
              {discount.total_discounted_amount > 0 && (
                <div className="text-xs text-muted-foreground">
                  IDR {discount.total_discounted_amount.toLocaleString()}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={discount.status === 'active' ? 'default' : 'secondary'}>
                {discount.status}
              </Badge>
            </TableCell>
            {canEdit && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewUsage(discount)}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Usage
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(discount)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStatus(discount.id)}>
                      {discount.status === 'active' ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(discount.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DiscountList;
