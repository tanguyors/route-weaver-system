import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Search, MoreHorizontal, Ship, Compass, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PartnerDetailModal from '@/components/admin/PartnerDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const AdminPartnersPage = () => {
  const [selectedPartner, setSelectedPartner] = useState<PartnerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [moduleStatusFilter, setModuleStatusFilter] = useState<string>('all');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<string>('all');

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data: partnersData, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get all partner modules
      const partnerIds = partnersData?.map(p => p.id) || [];
      const { data: modules } = await supabase
        .from('partner_modules')
        .select('*')
        .in('partner_id', partnerIds);

      return partnersData?.map(partner => ({
        ...partner,
        modules: (modules?.filter(m => m.partner_id === partner.id) || []).map(m => ({
          id: m.id,
          module_type: m.module_type as 'boat' | 'activity',
          status: m.status as 'active' | 'pending' | 'disabled',
          created_at: m.created_at,
          updated_at: m.updated_at,
          admin_note: m.admin_note,
        })),
      })) as PartnerData[];
    },
  });

  // Filter partners
  const filteredPartners = partners?.filter(partner => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Partner status filter
    if (partnerStatusFilter !== 'all' && partner.status !== partnerStatusFilter) {
      return false;
    }

    // Module type filter
    if (moduleFilter !== 'all') {
      const hasBoat = partner.modules.some(m => m.module_type === 'boat');
      const hasActivity = partner.modules.some(m => m.module_type === 'activity');
      
      if (moduleFilter === 'boat' && !hasBoat) return false;
      if (moduleFilter === 'activity' && !hasActivity) return false;
      if (moduleFilter === 'both' && !(hasBoat && hasActivity)) return false;
      if (moduleFilter === 'none' && partner.modules.length > 0) return false;
    }

    // Module status filter
    if (moduleStatusFilter !== 'all' && partner.modules.length > 0) {
      const hasModuleWithStatus = partner.modules.some(m => m.status === moduleStatusFilter);
      if (!hasModuleWithStatus) return false;
    }

    return true;
  });

  const getModuleBadges = (modules: PartnerModule[]) => {
    if (modules.length === 0) return <span className="text-muted-foreground">-</span>;
    
    return (
      <div className="flex gap-1 flex-wrap">
        {modules.map((module) => (
          <Badge 
            key={module.id}
            variant={module.status === 'active' ? 'default' : module.status === 'pending' ? 'secondary' : 'outline'}
            className={`gap-1 text-xs ${
              module.module_type === 'boat' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {module.module_type === 'boat' ? (
              <Ship className="w-3 h-3" />
            ) : (
              <Compass className="w-3 h-3" />
            )}
            {module.module_type === 'boat' ? 'Boat' : 'Activity'}
            {module.status !== 'active' && (
              <span className="ml-1 opacity-70">({module.status})</span>
            )}
          </Badge>
        ))}
      </div>
    );
  };

  const getPartnerStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePartnerUpdated = () => {
    refetch();
    // Refresh the selected partner data
    if (selectedPartner) {
      const updated = partners?.find(p => p.id === selectedPartner.id);
      if (updated) setSelectedPartner(updated);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Partners</h1>
            <p className="text-muted-foreground">Manage all partner accounts and modules</p>
          </div>
          <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Add Partner</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search partners..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                
                <Select value={partnerStatusFilter} onValueChange={setPartnerStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Partner Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Module Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="boat">Boat</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="none">No Modules</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={moduleStatusFilter} onValueChange={setModuleStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Module Status" />
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
            ) : filteredPartners && filteredPartners.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow 
                      key={partner.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{partner.contact_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{partner.contact_email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPartnerStatusBadge(partner.status)}</TableCell>
                      <TableCell>{getModuleBadges(partner.modules)}</TableCell>
                      <TableCell>{partner.commission_percent}%</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(partner.created_at).toLocaleDateString()}
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
                  <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {partners && partners.length > 0 ? 'No partners match filters' : 'No partners yet'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PartnerDetailModal
        partner={selectedPartner}
        open={!!selectedPartner}
        onOpenChange={(open) => !open && setSelectedPartner(null)}
        onPartnerUpdated={handlePartnerUpdated}
      />
    </DashboardLayout>
  );
};

export default AdminPartnersPage;
