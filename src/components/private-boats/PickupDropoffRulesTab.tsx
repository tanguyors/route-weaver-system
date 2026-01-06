import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, MapPin, Loader2, Car, ArrowDownToLine } from 'lucide-react';
import { usePickupDropoffRulesData, ServiceType, PickupDropoffRule } from '@/hooks/usePickupDropoffRulesData';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const PickupDropoffRulesTab = () => {
  const [selectedPortId, setSelectedPortId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ServiceType>('pickup');
  
  const { rules, ports, loading, isAdmin, createRule, updateRule, deleteRule } = usePickupDropoffRulesData(
    selectedPortId || undefined,
    activeTab
  );

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PickupDropoffRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formPortId, setFormPortId] = useState('');
  const [cityName, setCityName] = useState('');
  const [formServiceType, setFormServiceType] = useState<ServiceType>('pickup');
  const [price, setPrice] = useState('');
  const [constraintMinutes, setConstraintMinutes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [sortOrder, setSortOrder] = useState('0');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setFormPortId(selectedPortId || '');
    setCityName('');
    setFormServiceType(activeTab);
    setPrice('');
    setConstraintMinutes('');
    setStatus('active');
    setSortOrder('0');
    setEditingRule(null);
    setFormError('');
  };

  const handleOpenForm = (rule?: PickupDropoffRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormPortId(rule.from_port_id);
      setCityName(rule.city_name);
      setFormServiceType(rule.service_type);
      setPrice(rule.price.toString());
      setConstraintMinutes(
        rule.service_type === 'pickup'
          ? rule.pickup_before_departure_minutes?.toString() || ''
          : rule.dropoff_after_arrival_minutes?.toString() || ''
      );
      setStatus(rule.status);
      setSortOrder(rule.sort_order.toString());
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formPortId) {
      setFormError('Port is required');
      return;
    }

    if (!cityName.trim()) {
      setFormError('City name is required');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a positive number');
      return;
    }

    setSaving(true);

    const data = {
      from_port_id: formPortId,
      city_name: cityName.trim(),
      service_type: formServiceType,
      price: priceNum,
      pickup_before_departure_minutes: formServiceType === 'pickup' && constraintMinutes ? parseInt(constraintMinutes) : undefined,
      dropoff_after_arrival_minutes: formServiceType === 'dropoff' && constraintMinutes ? parseInt(constraintMinutes) : undefined,
      status,
      sort_order: parseInt(sortOrder) || 0,
    };

    let result;
    if (editingRule) {
      result = await updateRule(editingRule.id, data);
    } else {
      result = await createRule(data);
    }

    setSaving(false);

    if (!result.error) {
      handleCloseForm();
    } else {
      setFormError(result.error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteRuleId) return;
    await deleteRule(deleteRuleId);
    setDeleteRuleId(null);
  };

  const filteredRules = rules.filter(r => r.service_type === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={selectedPortId || "all"} onValueChange={(v) => setSelectedPortId(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Ports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ports</SelectItem>
                {ports.map((port) => (
                  <SelectItem key={port.id} value={port.id}>
                    {port.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isAdmin && (
          <Button onClick={() => handleOpenForm()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceType)}>
        <TabsList>
          <TabsTrigger value="pickup" className="gap-2">
            <Car className="h-4 w-4" />
            Pickup
          </TabsTrigger>
          <TabsTrigger value="dropoff" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Dropoff
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No {activeTab} rules configured
              </p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => handleOpenForm()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Rule
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Port</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>
                    {activeTab === 'pickup' ? 'Before Departure' : 'After Arrival'}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.port?.name || '-'}
                    </TableCell>
                    <TableCell>{rule.city_name}</TableCell>
                    <TableCell>{formatCurrency(rule.price)}</TableCell>
                    <TableCell>
                      {activeTab === 'pickup'
                        ? rule.pickup_before_departure_minutes
                          ? `${rule.pickup_before_departure_minutes} min`
                          : '-'
                        : rule.dropoff_after_arrival_minutes
                          ? `${rule.dropoff_after_arrival_minutes} min`
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRuleId(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Rule' : 'Add Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Port *</Label>
              <Select value={formPortId} onValueChange={setFormPortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityName">City Name *</Label>
              <Input
                id="cityName"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Ubud, Seminyak, Kuta"
              />
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={formServiceType} onValueChange={(v: ServiceType) => setFormServiceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="dropoff">Dropoff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (IDR) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraint">
                  {formServiceType === 'pickup' ? 'Before Departure (min)' : 'After Arrival (min)'}
                </Label>
                <Input
                  id="constraint"
                  type="number"
                  value={constraintMinutes}
                  onChange={(e) => setConstraintMinutes(e.target.value)}
                  placeholder="e.g. 60"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: 'active' | 'inactive') => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min={0}
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PickupDropoffRulesTab;
