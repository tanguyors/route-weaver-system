import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Percent, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDiscountsData, DiscountRule } from '@/hooks/useDiscountsData';
import { useTripsData } from '@/hooks/useTripsData';
import DiscountForm from '@/components/discounts/DiscountForm';
import DiscountList from '@/components/discounts/DiscountList';
import DiscountUsageModal from '@/components/discounts/DiscountUsageModal';

const DiscountsPage = () => {
  const { discounts, loading, canEdit, createDiscount, updateDiscount, deleteDiscount, toggleStatus, fetchUsage } = useDiscountsData();
  const { trips, routes } = useTripsData();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [viewingDiscount, setViewingDiscount] = useState<DiscountRule | null>(null);

  const promoCodes = discounts.filter(d => d.type === 'promo_code');
  const automaticDiscounts = discounts.filter(d => d.type === 'automatic');

  const handleCreate = async (data: Parameters<typeof createDiscount>[0]) => {
    const result = await createDiscount(data);
    if (!result.error) {
      toast.success('Discount created successfully');
    } else {
      toast.error('Failed to create discount: ' + result.error.message);
    }
    return result;
  };

  const handleUpdate = async (data: Parameters<typeof createDiscount>[0]) => {
    if (!editingDiscount) return { error: new Error('No discount selected') };
    const result = await updateDiscount(editingDiscount.id, data);
    if (!result.error) {
      toast.success('Discount updated successfully');
    } else {
      toast.error('Failed to update discount: ' + result.error.message);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteDiscount(deleteConfirm);
    if (!result.error) {
      toast.success('Discount deleted successfully');
    } else {
      toast.error('Failed to delete discount: ' + result.error.message);
    }
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleStatus(id);
    if (!result.error) {
      toast.success('Status updated');
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (discount: DiscountRule) => {
    setEditingDiscount(discount);
    setFormOpen(true);
  };

  const handleViewUsage = (discount: DiscountRule) => {
    setViewingDiscount(discount);
    setUsageModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingDiscount(null);
  };

  // Summary stats
  const activeCount = discounts.filter(d => d.status === 'active').length;
  const totalUsage = discounts.reduce((sum, d) => sum + (d.usage_count || 0), 0);
  const totalDiscounted = discounts.reduce((sum, d) => sum + (d.total_discounted_amount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Discount Rules</h1>
            <p className="text-muted-foreground mt-1">
              Manage promo codes and automatic discounts
            </p>
          </div>
          {canEdit && (
            <Button variant="hero" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Discount
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{discounts.length}</div>
              <div className="text-sm text-muted-foreground">Total Discounts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalUsage}</div>
              <div className="text-sm text-muted-foreground">Total Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">IDR {totalDiscounted.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Discounted</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Promo Codes vs Automatic */}
        <Tabs defaultValue="promo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Promo Codes ({promoCodes.length})
            </TabsTrigger>
            <TabsTrigger value="automatic" className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Automatic ({automaticDiscounts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="promo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Promo Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DiscountList
                  discounts={promoCodes}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleStatus={handleToggleStatus}
                  onViewUsage={handleViewUsage}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automatic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Automatic Discounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DiscountList
                  discounts={automaticDiscounts}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                  onToggleStatus={handleToggleStatus}
                  onViewUsage={handleViewUsage}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Form */}
      <DiscountForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={editingDiscount ? handleUpdate : handleCreate}
        initialData={editingDiscount}
        isEdit={!!editingDiscount}
        trips={trips.map(t => ({ id: t.id, trip_name: t.trip_name }))}
        routes={routes.map(r => ({ id: r.id, route_name: r.route_name }))}
      />

      {/* Usage Modal */}
      <DiscountUsageModal
        open={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
        discount={viewingDiscount}
        fetchUsage={fetchUsage}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the discount rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DiscountsPage;
