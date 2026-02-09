import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, MoreHorizontal, Shield, Building2, Ship, Compass, Filter, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import UserDetailModal from '@/components/admin/UserDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PartnerModule {
  module_type: 'boat' | 'activity' | 'accommodation';
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
  modules: PartnerModule[];
}

const AdminUsersPage = () => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [moduleStatusFilter, setModuleStatusFilter] = useState<string>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get roles for each user
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      // Get partner associations with commission
      const { data: partnerUsers } = await supabase
        .from('partner_users')
        .select('*, partners(id, name, commission_percent)')
        .in('user_id', userIds);

      // Get partner modules
      const partnerIds = partnerUsers?.map(pu => pu.partner_id).filter(Boolean) || [];
      const { data: partnerModules } = await supabase
        .from('partner_modules')
        .select('*')
        .in('partner_id', partnerIds);

      return profiles?.map(profile => {
        const partnerUser = partnerUsers?.find(pu => pu.user_id === profile.user_id) || null;
        const modules = partnerUser 
          ? (partnerModules?.filter(pm => pm.partner_id === partnerUser.partner_id) || []).map(m => ({
              id: m.id,
              module_type: m.module_type as 'boat' | 'activity' | 'accommodation',
              status: m.status as 'active' | 'pending' | 'disabled'
            }))
          : [];
        
        return {
          ...profile,
          role: roles?.find(r => r.user_id === profile.user_id)?.role || null,
          partnerUser,
          modules,
        };
      });
    },
  });

  // Filter users based on search and module filters
  const filteredUsers = users?.filter(user => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.partnerUser?.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Module type filter
    if (moduleFilter !== 'all') {
      const hasBoat = user.modules.some(m => m.module_type === 'boat');
      const hasActivity = user.modules.some(m => m.module_type === 'activity');
      const hasAccommodation = user.modules.some(m => m.module_type === 'accommodation');
      
      if (moduleFilter === 'boat' && !hasBoat) return false;
      if (moduleFilter === 'activity' && !hasActivity) return false;
      if (moduleFilter === 'accommodation' && !hasAccommodation) return false;
      if (moduleFilter === 'none' && user.modules.length > 0) return false;
    }

    // Module status filter
    if (moduleStatusFilter !== 'all' && user.modules.length > 0) {
      const hasModuleWithStatus = user.modules.some(m => m.status === moduleStatusFilter);
      if (!hasModuleWithStatus) return false;
    }

    return true;
  });

  const getModuleBadges = (modules: PartnerModule[]) => {
    if (modules.length === 0) return null;
    
    return (
      <div className="flex gap-1 flex-wrap">
        {modules.map((module, idx) => (
          <Badge 
            key={idx}
            variant={module.status === 'active' ? 'default' : module.status === 'pending' ? 'secondary' : 'outline'}
            className={`gap-1 text-xs ${
              module.module_type === 'boat' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                : module.module_type === 'activity'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
            }`}
          >
            {module.module_type === 'boat' ? (
              <Ship className="w-3 h-3" />
            ) : module.module_type === 'activity' ? (
              <Compass className="w-3 h-3" />
            ) : (
              <Home className="w-3 h-3" />
            )}
            {module.module_type === 'boat' ? 'Boat' : module.module_type === 'activity' ? 'Activity' : 'Accommodation'}
            {module.status !== 'active' && (
              <span className="ml-1 opacity-70">({module.status})</span>
            )}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage all platform users</p>
          </div>
          <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Add User</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Module Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="boat">Boat Only</SelectItem>
                    <SelectItem value="activity">Activity Only</SelectItem>
                    <SelectItem value="both">Boat + Activity</SelectItem>
                    <SelectItem value="none">No Modules</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={moduleStatusFilter} onValueChange={setModuleStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </Badge>
                        ) : user.partnerUser?.role === 'PARTNER_OWNER' ? (
                          <Badge variant="default" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            Partner Owner
                          </Badge>
                        ) : user.partnerUser?.role === 'PARTNER_STAFF' ? (
                          <Badge variant="secondary">Staff</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.partnerUser?.partners?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {getModuleBadges(user.modules) || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {users && users.length > 0 ? 'No users match filters' : 'No users yet'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </DashboardLayout>
  );
};

export default AdminUsersPage;
