import { useState, useEffect } from 'react';
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
import { 
  User, Mail, Phone, Calendar, Shield, Building2, Key, Smartphone, Copy, 
  Route, Ship, Ticket, Percent, Save, TrendingUp, Compass, Check, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PartnerModule {
  id?: string;
  module_type: 'boat' | 'activity';
  status: 'active' | 'pending' | 'disabled';
}

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role: 'admin' | 'partner_owner' | 'partner_staff' | null;
  partnerUser: {
    role: string;
    created_at: string;
    partner_id: string;
    partners: { name: string; id: string; commission_percent: number } | null;
  } | null;
  modules?: PartnerModule[];
}

interface PartnerStats {
  routesCount: number;
  tripsCount: number;
  ticketsToday: number;
  ticketsMonth: number;
  ticketsYear: number;
  salesDay: number;
  salesMonth: number;
  salesYear: number;
}

interface UserDetailModalProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailModal = ({ user, open, onOpenChange }: UserDetailModalProps) => {
  const queryClient = useQueryClient();
  const [commission, setCommission] = useState<number>(7);

  const partnerId = user?.partnerUser?.partner_id || user?.partnerUser?.partners?.id;

  // Fetch partner stats
  const { data: stats } = useQuery({
    queryKey: ['partner-stats', partnerId],
    queryFn: async (): Promise<PartnerStats> => {
      if (!partnerId) {
        return { routesCount: 0, tripsCount: 0, ticketsToday: 0, ticketsMonth: 0, ticketsYear: 0, salesDay: 0, salesMonth: 0, salesYear: 0 };
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      // Get routes count
      const { count: routesCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      // Get trips count
      const { count: tripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      // Get bookings for different periods
      const { data: bookingsDay } = await supabase
        .from('bookings')
        .select('total_amount, pax_adult, pax_child')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .gte('created_at', startOfDay);

      const { data: bookingsMonth } = await supabase
        .from('bookings')
        .select('total_amount, pax_adult, pax_child')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth);

      const { data: bookingsYear } = await supabase
        .from('bookings')
        .select('total_amount, pax_adult, pax_child')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .gte('created_at', startOfYear);

      const ticketsToday = bookingsDay?.reduce((acc, b) => acc + b.pax_adult + b.pax_child, 0) || 0;
      const ticketsMonth = bookingsMonth?.reduce((acc, b) => acc + b.pax_adult + b.pax_child, 0) || 0;
      const ticketsYear = bookingsYear?.reduce((acc, b) => acc + b.pax_adult + b.pax_child, 0) || 0;

      const salesDay = bookingsDay?.reduce((acc, b) => acc + Number(b.total_amount), 0) || 0;
      const salesMonth = bookingsMonth?.reduce((acc, b) => acc + Number(b.total_amount), 0) || 0;
      const salesYear = bookingsYear?.reduce((acc, b) => acc + Number(b.total_amount), 0) || 0;

      return {
        routesCount: routesCount || 0,
        tripsCount: tripsCount || 0,
        ticketsToday,
        ticketsMonth,
        ticketsYear,
        salesDay,
        salesMonth,
        salesYear,
      };
    },
    enabled: open && !!partnerId,
  });

  // Update commission on user change
  useEffect(() => {
    if (user?.partnerUser?.partners?.commission_percent !== undefined) {
      setCommission(user.partnerUser.partners.commission_percent);
    }
  }, [user]);

  // Save commission mutation
  const saveCommissionMutation = useMutation({
    mutationFn: async (newCommission: number) => {
      if (!partnerId) throw new Error('No partner ID');
      const { error } = await supabase
        .from('partners')
        .update({ commission_percent: newCommission })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Commission updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Error updating commission');
    },
  });

  // Update module status mutation
  const updateModuleStatusMutation = useMutation({
    mutationFn: async ({ moduleId, newStatus }: { moduleId: string; newStatus: 'active' | 'disabled' }) => {
      const { error } = await supabase
        .from('partner_modules')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', moduleId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Module ${variables.newStatus === 'active' ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Error updating module status');
    },
  });

  if (!user) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleResetPassword = () => {
    toast.info('Feature to implement: send password reset email');
  };

  const handleDisable2FA = () => {
    toast.info('Feature to implement: disable 2FA');
  };

  const handleSaveCommission = () => {
    saveCommissionMutation.mutate(commission);
  };

  const getRoleBadge = () => {
    if (user.role === 'admin') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    if (user.partnerUser?.role === 'PARTNER_OWNER') {
      return (
        <Badge variant="default" className="gap-1">
          <Building2 className="w-3 h-3" />
          Partner Owner
        </Badge>
      );
    }
    if (user.partnerUser?.role === 'PARTNER_STAFF') {
      return <Badge variant="secondary">Staff</Badge>;
    }
    return <Badge variant="outline">User</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            View and manage user information and partner settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User & Role */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">{user.full_name || 'No name'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {getRoleBadge()}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{user.full_name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="text-sm font-medium">{user.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </p>
                <p className="text-sm font-medium">-</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date of Birth
                </p>
                <p className="text-sm font-medium">-</p>
              </div>
            </div>
          </div>

          {/* Partner Information */}
          {user.partnerUser && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Partner Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Partner</p>
                    <p className="text-sm font-medium">{user.partnerUser.partners?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Partner Role</p>
                    <p className="text-sm font-medium">
                      {user.partnerUser.role === 'PARTNER_OWNER' ? 'Owner' : 'Staff'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Activated On</p>
                    <p className="text-sm font-medium">
                      {new Date(user.partnerUser.created_at).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {/* Commission Setting */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Platform Commission
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission}
                        onChange={(e) => setCommission(Number(e.target.value))}
                        className="w-20 h-8"
                      />
                      <span className="text-sm">%</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSaveCommission}
                        disabled={saveCommissionMutation.isPending}
                        className="h-8"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                  {/* Modules */}
                  {user.modules && user.modules.length > 0 && (
                    <div className="space-y-2 col-span-2">
                      <p className="text-xs text-muted-foreground">Modules</p>
                      <div className="space-y-2">
                        {user.modules.map((module, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                            <Badge 
                              variant={module.status === 'active' ? 'default' : module.status === 'pending' ? 'secondary' : 'outline'}
                              className={`gap-1 ${
                                module.module_type === 'boat' 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {module.module_type === 'boat' ? <Ship className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                              {module.module_type === 'boat' ? 'Boat' : 'Activity'}
                              <span className="opacity-70">({module.status})</span>
                            </Badge>
                            
                            {/* Action buttons for pending modules */}
                            {module.status === 'pending' && module.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => updateModuleStatusMutation.mutate({ moduleId: module.id!, newStatus: 'active' })}
                                  disabled={updateModuleStatusMutation.isPending}
                                >
                                  {updateModuleStatusMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2"
                                  onClick={() => updateModuleStatusMutation.mutate({ moduleId: module.id!, newStatus: 'disabled' })}
                                  disabled={updateModuleStatusMutation.isPending}
                                >
                                  {updateModuleStatusMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="w-3 h-3 mr-1" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            {/* Action button for active/disabled modules */}
                            {module.status !== 'pending' && module.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() => updateModuleStatusMutation.mutate({ 
                                  moduleId: module.id!, 
                                  newStatus: module.status === 'active' ? 'disabled' : 'active' 
                                })}
                                disabled={updateModuleStatusMutation.isPending}
                              >
                                {updateModuleStatusMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : module.status === 'active' ? (
                                  'Disable'
                                ) : (
                                  'Enable'
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Partner Stats */}
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Partner Statistics
                </h4>

                {/* Routes & Trips */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Route className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.routesCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Routes</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ship className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.tripsCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Trips</p>
                    </div>
                  </div>
                </div>

                {/* Tickets Stats */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> Tickets Sold
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{stats?.ticketsToday || 0}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{stats?.ticketsMonth || 0}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{stats?.ticketsYear || 0}</p>
                      <p className="text-xs text-muted-foreground">This Year</p>
                    </div>
                  </div>
                </div>

                {/* Sales Stats */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold truncate">{formatCurrency(stats?.salesDay || 0)}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold truncate">{formatCurrency(stats?.salesMonth || 0)}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold truncate">{formatCurrency(stats?.salesYear || 0)}</p>
                      <p className="text-xs text-muted-foreground">This Year</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Admin Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleResetPassword}>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisable2FA}>
                <Smartphone className="w-4 h-4 mr-2" />
                Disable 2FA
              </Button>
            </div>
          </div>

          <Separator />

          {/* System Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              System Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Registration Date</p>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">User ID</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono truncate max-w-[120px]">{user.user_id}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(user.user_id)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
