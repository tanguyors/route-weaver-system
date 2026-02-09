import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Plus, Search, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { toast } from 'sonner';

const AccommodationListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { accommodations, loading, updateAccommodation, deleteAccommodation } = useAccommodationsData();

  const filtered = accommodations.filter(acc => {
    const matchesSearch = !search || acc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || acc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateAccommodation(id, { status: newStatus });
    toast.success(`Accommodation ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this accommodation?')) {
      await deleteAccommodation(id);
      toast.success('Accommodation deleted');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Active</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'inactive': return <Badge variant="outline">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      villa: 'Villa', hotel: 'Hotel', guesthouse: 'Guesthouse',
      homestay: 'Homestay', apartment: 'Apartment',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accommodations</h1>
            <p className="text-muted-foreground">Manage your properties</p>
          </div>
          <Button onClick={() => navigate('/accommodation-dashboard/accommodations/new')} className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Add Accommodation
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search accommodations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="guesthouse">Guesthouse</SelectItem>
                  <SelectItem value="homestay">Homestay</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filtered.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Price / Night</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(acc => (
                    <TableRow key={acc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/accommodation-dashboard/accommodations/${acc.id}`)}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell>{getTypeBadge(acc.type)}</TableCell>
                      <TableCell>{acc.capacity} guests</TableCell>
                      <TableCell>{acc.currency} {Number(acc.price_per_night).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(acc.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/accommodation-dashboard/accommodations/${acc.id}`); }}>
                              <Pencil className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleStatus(acc.id, acc.status); }}>
                              {acc.status === 'active' ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />}
                              {acc.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(acc.id); }} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Home className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No accommodations yet</p>
                  <Button variant="link" onClick={() => navigate('/accommodation-dashboard/accommodations/new')}>Add your first property</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationListPage;
