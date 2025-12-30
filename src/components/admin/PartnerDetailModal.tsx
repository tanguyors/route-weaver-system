import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, Mail, Phone, Calendar, Ship, Compass, 
  CheckCircle, XCircle, Clock, Save, Percent, Globe, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface PartnerModule {
  id: string;
  module_type: 'boat' | 'activity';
  status: 'active' | 'pending' | 'disabled';
  created_at: string;
  updated_at: string;
  admin_note: string | null;
}

interface PartnerData {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'pending' | 'active' | 'suspended';
  commission_percent: number;
  created_at: string;
  modules: PartnerModule[];
}

interface PartnerDetailModalProps {
  partner: PartnerData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerUpdated: () => void;
}

type ModuleStatus = 'active' | 'pending' | 'disabled';

const PartnerDetailModal = ({ partner, open, onOpenChange, onPartnerUpdated }: PartnerDetailModalProps) => {
  const queryClient = useQueryClient();
  const [commission, setCommission] = useState<number>(partner?.commission_percent || 7);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    module: PartnerModule;
    newStatus: ModuleStatus;
  } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Update commission when partner changes
  useState(() => {
    if (partner) {
      setCommission(partner.commission_percent);
    }
  });

  // Save commission mutation
  const saveCommissionMutation = useMutation({
    mutationFn: async (newCommission: number) => {
      if (!partner) throw new Error('No partner');
      const { error } = await supabase
        .from('partners')
        .update({ commission_percent: newCommission })
        .eq('id', partner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Commission updated');
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      onPartnerUpdated();
    },
    onError: () => {
      toast.error('Error updating commission');
    },
  });

  // Update module status mutation
  const updateModuleStatusMutation = useMutation({
    mutationFn: async ({ moduleId, status, note }: { moduleId: string; status: ModuleStatus; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('partner_modules')
        .update({ 
          status, 
          admin_note: note || null,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moduleId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const statusText = variables.status === 'active' ? 'approved' : variables.status === 'disabled' ? 'disabled' : 'set to pending';
      toast.success(`Module ${statusText}`);
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      onPartnerUpdated();
      setStatusChangeDialog(null);
      setAdminNote('');
    },
    onError: () => {
      toast.error('Error updating module status');
    },
  });

  // Approve all pending modules
  const approveAllMutation = useMutation({
    mutationFn: async () => {
      if (!partner) throw new Error('No partner');
      const { data: { user } } = await supabase.auth.getUser();
      const pendingModules = partner.modules.filter(m => m.status === 'pending');
      
      for (const module of pendingModules) {
        const { error } = await supabase
          .from('partner_modules')
          .update({ 
            status: 'active', 
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', module.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('All modules approved');
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      onPartnerUpdated();
    },
    onError: () => {
      toast.error('Error approving modules');
    },
  });

  if (!partner) return null;

  const pendingModulesCount = partner.modules.filter(m => m.status === 'pending').length;

  const handleStatusChange = (module: PartnerModule, newStatus: ModuleStatus) => {
    setStatusChangeDialog({ module, newStatus });
    setAdminNote('');
  };

  const confirmStatusChange = () => {
    if (!statusChangeDialog) return;
    updateModuleStatusMutation.mutate({
      moduleId: statusChangeDialog.module.id,
      status: statusChangeDialog.newStatus,
      note: adminNote,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 gap-1"><CheckCircle className="w-3 h-3" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="gap-1 text-muted-foreground"><XCircle className="w-3 h-3" />Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPartnerStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Partner Details
            </DialogTitle>
            <DialogDescription>
              View and manage partner information and modules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Partner Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">Partner ID: {partner.id.slice(0, 8)}...</p>
              </div>
              {getPartnerStatusBadge(partner.status)}
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Contact Name
                  </p>
                  <p className="text-sm font-medium">{partner.contact_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm font-medium">{partner.contact_email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="text-sm font-medium">{partner.contact_phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Registered
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(partner.created_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Commission */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Commission Settings
              </h4>
              <div className="flex items-center gap-3">
                <Label className="text-sm flex items-center gap-1">
                  <Percent className="w-4 h-4" /> Platform Commission
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm">%</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => saveCommissionMutation.mutate(commission)}
                  disabled={saveCommissionMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <Separator />

            {/* Modules Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Partner Modules
                </h4>
                {pendingModulesCount > 0 && (
                  <Button 
                    size="sm" 
                    onClick={() => approveAllMutation.mutate()}
                    disabled={approveAllMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve All ({pendingModulesCount})
                  </Button>
                )}
              </div>

              {partner.modules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">No modules requested</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Admin Note</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {module.module_type === 'boat' ? (
                              <Ship className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Compass className="w-4 h-4 text-emerald-600" />
                            )}
                            <span className="font-medium">
                              {module.module_type === 'boat' ? 'Boat' : 'Activity'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(module.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(module.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(module.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {module.admin_note || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Change Status
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {module.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(module, 'active')}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Approve (Active)
                                </DropdownMenuItem>
                              )}
                              {module.status !== 'pending' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(module, 'pending')}>
                                  <Clock className="w-4 h-4 mr-2 text-amber-600" />
                                  Set Pending
                                </DropdownMenuItem>
                              )}
                              {module.status !== 'disabled' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(module, 'disabled')}>
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                  Disable
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeDialog} onOpenChange={(open) => !open && setStatusChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusChangeDialog?.newStatus === 'active' && 'Approve Module'}
              {statusChangeDialog?.newStatus === 'pending' && 'Set Module to Pending'}
              {statusChangeDialog?.newStatus === 'disabled' && 'Disable Module'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeDialog?.newStatus === 'active' && 
                `This will activate the ${statusChangeDialog.module.module_type === 'boat' ? 'Boat' : 'Activity'} module for this partner. They will immediately gain access to the corresponding dashboard.`
              }
              {statusChangeDialog?.newStatus === 'pending' && 
                `This will set the ${statusChangeDialog?.module.module_type === 'boat' ? 'Boat' : 'Activity'} module back to pending status.`
              }
              {statusChangeDialog?.newStatus === 'disabled' && 
                `This will disable the ${statusChangeDialog?.module.module_type === 'boat' ? 'Boat' : 'Activity'} module. The partner will lose access to the corresponding dashboard.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-2">
            <Label htmlFor="admin-note">Admin Note (optional)</Label>
            <Textarea
              id="admin-note"
              placeholder="Add a note about this status change..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              disabled={updateModuleStatusMutation.isPending}
              className={
                statusChangeDialog?.newStatus === 'active' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : statusChangeDialog?.newStatus === 'disabled'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {updateModuleStatusMutation.isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartnerDetailModal;
