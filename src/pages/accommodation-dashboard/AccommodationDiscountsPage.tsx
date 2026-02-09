import { useState } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAccommodationDiscountsData, AccommodationDiscount, AccomDiscountFormData, AccomDiscountUsage, ACCOM_DISCOUNT_CATEGORIES } from '@/hooks/useAccommodationDiscountsData';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { toast } from '@/hooks/use-toast';
import { Plus, Percent, Tag, MoreHorizontal, Edit, Trash2, Power, PowerOff, BarChart3, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';

const emptyForm: AccomDiscountFormData = {
  type: 'promo_code',
  category: 'booking_percent',
  discount_value: 0,
  discount_value_type: 'percent',
  code: '',
  book_start_date: '',
  book_end_date: '',
  checkin_start_date: '',
  checkin_end_date: '',
  minimum_spend: 0,
  min_nights: undefined,
  early_bird_days: undefined,
  last_minute_days: undefined,
  applicable_accommodation_ids: [],
  individual_use_only: false,
  usage_limit: undefined,
  limit_per_customer: 1,
  status: 'active',
};

const AccommodationDiscountsPage = () => {
  const { discounts, loading, canEdit, createDiscount, updateDiscount, deleteDiscount, toggleStatus, fetchUsage } = useAccommodationDiscountsData();
  const { accommodations } = useAccommodationsData();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<AccommodationDiscount | null>(null);
  const [form, setForm] = useState<AccomDiscountFormData>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Usage modal
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [viewingDiscount, setViewingDiscount] = useState<AccommodationDiscount | null>(null);
  const [usageData, setUsageData] = useState<AccomDiscountUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const promoCodes = discounts.filter(d => d.type === 'promo_code');
  const automaticDiscounts = discounts.filter(d => d.type === 'automatic');

  const activeCount = discounts.filter(d => d.status === 'active').length;
  const totalUsage = discounts.reduce((sum, d) => sum + (d.usage_count || 0), 0);
  const totalDiscounted = discounts.reduce((sum, d) => sum + (d.total_discounted_amount || 0), 0);

  const openCreateForm = () => {
    setEditingDiscount(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEditForm = (discount: AccommodationDiscount) => {
    setEditingDiscount(discount);
    setForm({
      type: discount.type,
      category: discount.category,
      discount_value: discount.discount_value,
      discount_value_type: discount.discount_value_type,
      code: discount.code || '',
      book_start_date: discount.book_start_date || '',
      book_end_date: discount.book_end_date || '',
      checkin_start_date: discount.checkin_start_date || '',
      checkin_end_date: discount.checkin_end_date || '',
      minimum_spend: discount.minimum_spend || 0,
      min_nights: discount.min_nights || undefined,
      early_bird_days: discount.early_bird_days || undefined,
      last_minute_days: discount.last_minute_days || undefined,
      applicable_accommodation_ids: discount.applicable_accommodation_ids || [],
      individual_use_only: discount.individual_use_only,
      usage_limit: discount.usage_limit || undefined,
      limit_per_customer: discount.limit_per_customer || 1,
      status: discount.status,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (form.discount_value <= 0) {
      toast({ title: 'Discount value must be greater than 0', variant: 'destructive' });
      return;
    }
    if (form.type === 'promo_code' && !form.code?.trim()) {
      toast({ title: 'Promo code is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const result = editingDiscount
        ? await updateDiscount(editingDiscount.id, form)
        : await createDiscount(form);

      if (result.error) {
        toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
      } else {
        toast({ title: editingDiscount ? 'Discount updated' : 'Discount created' });
        setFormOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteDiscount(deleteConfirm);
    if (!result.error) {
      toast({ title: 'Discount deleted' });
    } else {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    }
    setDeleteConfirm(null);
  };

  const handleToggle = async (id: string) => {
    const result = await toggleStatus(id);
    if (!result.error) {
      toast({ title: 'Status updated' });
    }
  };

  const openUsageModal = (discount: AccommodationDiscount) => {
    setViewingDiscount(discount);
    setUsageModalOpen(true);
  };

  useEffect(() => {
    if (usageModalOpen && viewingDiscount) {
      setUsageLoading(true);
      fetchUsage(viewingDiscount.id).then(data => {
        setUsageData(data);
        setUsageLoading(false);
      });
    }
  }, [usageModalOpen, viewingDiscount, fetchUsage]);

  const getCategoryLabel = (cat: string) => ACCOM_DISCOUNT_CATEGORIES.find(c => c.value === cat)?.label || cat;

  const formatValue = (d: AccommodationDiscount) => {
    if (d.discount_value_type === 'percent') return `${d.discount_value}%`;
    return d.discount_value.toLocaleString();
  };

  const showCategoryFields = (category: string) => {
    return {
      showEarlyBirdDays: category === 'early_bird',
      showLastMinuteDays: category === 'last_minute',
      showMinNights: category === 'long_stay',
    };
  };

  const renderDiscountTable = (items: AccommodationDiscount[]) => {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No discounts found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code / Category</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            {canEdit && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(d => (
            <TableRow key={d.id}>
              <TableCell>
                <div className="font-medium">{d.code || <span className="text-muted-foreground italic">Auto</span>}</div>
                <div className="text-xs text-muted-foreground">{getCategoryLabel(d.category)}</div>
              </TableCell>
              <TableCell className="font-mono">{formatValue(d)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {d.book_start_date && d.book_end_date ? (
                    <>{format(new Date(d.book_start_date), 'dd MMM')} - {format(new Date(d.book_end_date), 'dd MMM yyyy')}</>
                  ) : (
                    <span className="text-muted-foreground">No limit</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{d.usage_count || 0} / {d.usage_limit || '∞'}</div>
                {d.total_discounted_amount > 0 && (
                  <div className="text-xs text-muted-foreground">{d.total_discounted_amount.toLocaleString()} discounted</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>{d.status}</Badge>
              </TableCell>
              {canEdit && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openUsageModal(d)}><BarChart3 className="w-4 h-4 mr-2" />View Usage</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditForm(d)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(d.id)}>
                        {d.status === 'active' ? <><PowerOff className="w-4 h-4 mr-2" />Deactivate</> : <><Power className="w-4 h-4 mr-2" />Activate</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteConfirm(d.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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

  if (loading) {
    return (
      <AccommodationDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AccommodationDashboardLayout>
    );
  }

  const categoryFields = showCategoryFields(form.category);

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Discounts</h1>
            <p className="text-muted-foreground">Manage promo codes and automatic discounts</p>
          </div>
          {canEdit && (
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4 mr-2" /> Create Discount
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{discounts.length}</div><div className="text-sm text-muted-foreground">Total Discounts</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{activeCount}</div><div className="text-sm text-muted-foreground">Active</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totalUsage}</div><div className="text-sm text-muted-foreground">Total Uses</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totalDiscounted.toLocaleString()}</div><div className="text-sm text-muted-foreground">Total Discounted</div></CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="promo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="promo" className="flex items-center gap-2"><Tag className="w-4 h-4" />Promo Codes ({promoCodes.length})</TabsTrigger>
            <TabsTrigger value="automatic" className="flex items-center gap-2"><Percent className="w-4 h-4" />Automatic ({automaticDiscounts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="promo">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Promo Codes</CardTitle></CardHeader>
              <CardContent>{renderDiscountTable(promoCodes)}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="automatic">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5" />Automatic Discounts</CardTitle></CardHeader>
              <CardContent>{renderDiscountTable(automaticDiscounts)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
            <DialogDescription>Configure the discount rules for accommodation bookings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promo_code">Promo Code</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOM_DISCOUNT_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'promo_code' && (
              <div>
                <Label>Promo Code *</Label>
                <Input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER20" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Value</Label>
                <Input type="number" min={0} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Value Type</Label>
                <Select value={form.discount_value_type} onValueChange={v => setForm(f => ({ ...f, discount_value_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category-specific fields */}
            {categoryFields.showEarlyBirdDays && (
              <div>
                <Label>Days Before Check-in (Early Bird)</Label>
                <Input type="number" min={1} value={form.early_bird_days || ''} onChange={e => setForm(f => ({ ...f, early_bird_days: parseInt(e.target.value) || undefined }))} placeholder="e.g. 30" />
                <p className="text-xs text-muted-foreground mt-1">Guest must book at least X days before check-in</p>
              </div>
            )}
            {categoryFields.showLastMinuteDays && (
              <div>
                <Label>Days Before Check-in (Last Minute)</Label>
                <Input type="number" min={1} value={form.last_minute_days || ''} onChange={e => setForm(f => ({ ...f, last_minute_days: parseInt(e.target.value) || undefined }))} placeholder="e.g. 3" />
                <p className="text-xs text-muted-foreground mt-1">Guest must book within X days of check-in</p>
              </div>
            )}
            {categoryFields.showMinNights && (
              <div>
                <Label>Minimum Nights (Long Stay)</Label>
                <Input type="number" min={1} value={form.min_nights || ''} onChange={e => setForm(f => ({ ...f, min_nights: parseInt(e.target.value) || undefined }))} placeholder="e.g. 7" />
                <p className="text-xs text-muted-foreground mt-1">Minimum stay duration to qualify</p>
              </div>
            )}

            {/* Date ranges */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Booking Start</Label>
                <Input type="date" value={form.book_start_date || ''} onChange={e => setForm(f => ({ ...f, book_start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Booking End</Label>
                <Input type="date" value={form.book_end_date || ''} onChange={e => setForm(f => ({ ...f, book_end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-in Start</Label>
                <Input type="date" value={form.checkin_start_date || ''} onChange={e => setForm(f => ({ ...f, checkin_start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Check-in End</Label>
                <Input type="date" value={form.checkin_end_date || ''} onChange={e => setForm(f => ({ ...f, checkin_end_date: e.target.value }))} />
              </div>
            </div>

            {/* Restrictions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min. Spend</Label>
                <Input type="number" min={0} value={form.minimum_spend || 0} onChange={e => setForm(f => ({ ...f, minimum_spend: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Usage Limit</Label>
                <Input type="number" min={0} value={form.usage_limit || ''} onChange={e => setForm(f => ({ ...f, usage_limit: parseInt(e.target.value) || undefined }))} placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limit per Customer</Label>
                <Input type="number" min={1} value={form.limit_per_customer || 1} onChange={e => setForm(f => ({ ...f, limit_per_customer: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.individual_use_only || false} onCheckedChange={v => setForm(f => ({ ...f, individual_use_only: v }))} />
                <Label>Individual use only</Label>
              </div>
            </div>

            {/* Filter by accommodation */}
            {accommodations.length > 0 && (
              <div>
                <Label>Applicable Accommodations</Label>
                <p className="text-xs text-muted-foreground mb-2">Leave empty to apply to all</p>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {accommodations.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(form.applicable_accommodation_ids || []).includes(a.id)}
                        onChange={e => {
                          const ids = form.applicable_accommodation_ids || [];
                          setForm(f => ({
                            ...f,
                            applicable_accommodation_ids: e.target.checked
                              ? [...ids, a.id]
                              : ids.filter(id => id !== a.id),
                          }));
                        }}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingDiscount ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Modal */}
      <Dialog open={usageModalOpen} onOpenChange={setUsageModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Usage: {viewingDiscount?.code || 'Automatic Discount'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{viewingDiscount?.usage_count || 0}</div><div className="text-sm text-muted-foreground">Uses</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{viewingDiscount?.usage_limit ? (viewingDiscount.usage_limit - (viewingDiscount.usage_count || 0)) : '∞'}</div><div className="text-sm text-muted-foreground">Remaining</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{(viewingDiscount?.total_discounted_amount || 0).toLocaleString()}</div><div className="text-sm text-muted-foreground">Total Discounted</div></CardContent></Card>
          </div>
          {usageLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : usageData.length === 0 ? (
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
                  {usageData.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>{format(new Date(u.used_at), 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell>{u.customer_email || u.customer_phone || 'Unknown'}</TableCell>
                      <TableCell className="text-right font-mono">{u.discounted_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationDiscountsPage;
