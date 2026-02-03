import { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, MapPin, Loader2, Car, ArrowDownToLine, X } from 'lucide-react';
import { usePickupDropoffRulesData, ServiceType, PickupDropoffRule } from '@/hooks/usePickupDropoffRulesData';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

interface RuleRow {
  id?: string;
  city_name: string;
  car_price: string;
  bus_price: string;
  constraint_minutes: string;
  status: 'active' | 'inactive';
  sort_order: number;
  isNew?: boolean;
  toDelete?: boolean;
}

const PickupDropoffRulesTab = () => {
  const [selectedPortId, setSelectedPortId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ServiceType>('pickup');
  
  const { rules, ports, loading, canManage, createRule, updateRule, deleteRule, fetchRules } = usePickupDropoffRulesData();

  const [showForm, setShowForm] = useState(false);
  const [formPortId, setFormPortId] = useState('');
  const [formServiceType, setFormServiceType] = useState<ServiceType>('pickup');
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Only show pickup rules - dropoff is auto-managed
  const filteredRules = rules.filter(r => {
    const matchesType = r.service_type === 'pickup';
    const matchesPort = !selectedPortId || r.from_port_id === selectedPortId;
    return matchesType && matchesPort;
  });

  // Group rules by port for display
  const rulesByPort = filteredRules.reduce((acc, rule) => {
    const portId = rule.from_port_id;
    if (!acc[portId]) {
      acc[portId] = {
        portName: rule.port?.name || 'Unknown',
        rules: []
      };
    }
    acc[portId].rules.push(rule);
    return acc;
  }, {} as Record<string, { portName: string; rules: PickupDropoffRule[] }>);

  const handleOpenForm = (portId?: string) => {
    const targetPortId = portId || '';
    
    setFormPortId(targetPortId);
    setFormServiceType('pickup'); // Always pickup, dropoff is auto-created
    
    // Load existing pickup rules for this port
    const existingRules = rules.filter(
      r => r.from_port_id === targetPortId && r.service_type === 'pickup'
    );
    
    if (existingRules.length > 0) {
      setRows(existingRules.map(r => ({
        id: r.id,
        city_name: r.city_name,
        car_price: r.car_price.toString(),
        bus_price: r.bus_price.toString(),
        constraint_minutes: r.pickup_before_departure_minutes?.toString() || '',
        status: r.status,
        sort_order: r.sort_order,
      })));
    } else {
      // Start with one empty row
      setRows([{
        city_name: '',
        car_price: '',
        bus_price: '',
        constraint_minutes: '',
        status: 'active',
        sort_order: 0,
        isNew: true,
      }]);
    }
    
    setFormError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setRows([]);
    setFormPortId('');
    setFormError('');
  };

  const addRow = () => {
    setRows([...rows, {
      city_name: '',
      car_price: '',
      bus_price: '',
      constraint_minutes: '',
      status: 'active',
      sort_order: rows.length,
      isNew: true,
    }]);
  };

  const removeRow = (index: number) => {
    const row = rows[index];
    if (row.id) {
      // Mark existing row for deletion
      setRows(rows.map((r, i) => i === index ? { ...r, toDelete: true } : r));
    } else {
      // Remove new row directly
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: keyof RuleRow, value: string | number) => {
    setRows(rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formPortId) {
      setFormError('Please select a port');
      return;
    }

    const activeRows = rows.filter(r => !r.toDelete);
    
    // Validate all rows
    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      if (!row.city_name.trim()) {
        setFormError(`Row ${i + 1}: City name is required`);
        return;
      }
      const carPrice = parseFloat(row.car_price);
      if (isNaN(carPrice) || carPrice < 0) {
        setFormError(`Row ${i + 1}: Car price must be a valid positive number`);
        return;
      }
      const busPrice = parseFloat(row.bus_price);
      if (isNaN(busPrice) || busPrice < 0) {
        setFormError(`Row ${i + 1}: Bus price must be a valid positive number`);
        return;
      }
    }

    setSaving(true);

    try {
      // Delete marked rows (both pickup and corresponding dropoff)
      const toDelete = rows.filter(r => r.toDelete && r.id);
      for (const row of toDelete) {
        await deleteRule(row.id!);
        // Find and delete corresponding dropoff rule
        const correspondingDropoff = rules.find(
          r => r.from_port_id === formPortId && 
               r.service_type === 'dropoff' && 
               r.city_name === row.city_name
        );
        if (correspondingDropoff) {
          await deleteRule(correspondingDropoff.id);
        }
      }

      // Create or update pickup rows AND auto-create/update dropoff rows
      for (let i = 0; i < activeRows.length; i++) {
        const row = activeRows[i];
        
        // Pickup data
        const pickupData = {
          from_port_id: formPortId,
          city_name: row.city_name.trim(),
          service_type: 'pickup' as const,
          car_price: parseFloat(row.car_price) || 0,
          bus_price: parseFloat(row.bus_price) || 0,
          pickup_before_departure_minutes: row.constraint_minutes 
            ? parseInt(row.constraint_minutes) 
            : undefined,
          status: row.status,
          sort_order: i,
        };

        // Dropoff data (same prices, no timing constraint)
        const dropoffData = {
          from_port_id: formPortId,
          city_name: row.city_name.trim(),
          service_type: 'dropoff' as const,
          car_price: parseFloat(row.car_price) || 0,
          bus_price: parseFloat(row.bus_price) || 0,
          status: row.status,
          sort_order: i,
        };

        if (row.id) {
          // Update existing pickup
          await updateRule(row.id, pickupData);
          
          // Find and update corresponding dropoff, or create if doesn't exist
          const existingDropoff = rules.find(
            r => r.from_port_id === formPortId && 
                 r.service_type === 'dropoff' && 
                 r.city_name === row.city_name
          );
          if (existingDropoff) {
            await updateRule(existingDropoff.id, dropoffData);
          } else {
            await createRule(dropoffData);
          }
        } else {
          // Create new pickup and dropoff
          await createRule(pickupData);
          await createRule(dropoffData);
        }
      }

      await fetchRules();
      handleCloseForm();
    } catch (error: any) {
      setFormError(error.message || 'Failed to save rules');
    }

    setSaving(false);
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    await deleteRule(deleteRuleId);
    setDeleteRuleId(null);
  };

  const visibleRows = rows.filter(r => !r.toDelete);

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

        {canManage && (
          <Button onClick={() => handleOpenForm()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Configure Port Rules
          </Button>
        )}
      </div>

      {/* Display only pickup rules - dropoff is auto-created */}
      <div className="mt-4">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(rulesByPort).length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No {activeTab} rules configured
              </p>
              {canManage && (
                <Button className="mt-4" onClick={() => handleOpenForm()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Rules
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(rulesByPort).map(([portId, { portName, rules: portRules }]) => (
                <div key={portId} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {portName}
                    </h3>
                    {canManage && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenForm(portId)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>Car Price</TableHead>
                        <TableHead>Bus Price</TableHead>
                        <TableHead>Before Departure</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.city_name}</TableCell>
                          <TableCell>{formatCurrency(rule.car_price)}</TableCell>
                          <TableCell>{formatCurrency(rule.bus_price)}</TableCell>
                          <TableCell>
                            {rule.pickup_before_departure_minutes
                              ? `${rule.pickup_before_departure_minutes} min`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                              {rule.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Configure Port Rules Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Configure {formServiceType === 'pickup' ? 'Pickup' : 'Dropoff'} Rules
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Service Type</Label>
                <div className="flex items-center gap-2 h-10 px-3 bg-muted rounded-md text-sm">
                  <Car className="h-4 w-4" />
                  Pickup (Dropoff auto-created)
                </div>
              </div>
            </div>

            {/* Editable Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">City *</TableHead>
                    <TableHead className="w-[130px]">Car Price (IDR) *</TableHead>
                    <TableHead className="w-[130px]">Bus Price (IDR) *</TableHead>
                    <TableHead className="w-[120px]">Before Dep. (min)</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No cities added yet. Click "Add City" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, index) => {
                      const actualIndex = rows.findIndex(r => r === row || (r.id && r.id === row.id));
                      return (
                        <TableRow key={row.id || `new-${index}`}>
                          <TableCell className="p-2">
                            <Input
                              value={row.city_name}
                              onChange={(e) => updateRow(actualIndex, 'city_name', e.target.value)}
                              placeholder="e.g. Ubud"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={row.car_price}
                              onChange={(e) => updateRow(actualIndex, 'car_price', e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={row.bus_price}
                              onChange={(e) => updateRow(actualIndex, 'bus_price', e.target.value)}
                              placeholder="0"
                              min={0}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={row.constraint_minutes}
                              onChange={(e) => updateRow(actualIndex, 'constraint_minutes', e.target.value)}
                              placeholder="60"
                              min={0}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.status} 
                              onValueChange={(v: 'active' | 'inactive') => updateRow(actualIndex, 'status', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(actualIndex)}
                              className="h-9 w-9 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" size="sm" onClick={addRow} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save All
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
            <AlertDialogAction onClick={handleDeleteRule}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PickupDropoffRulesTab;
