import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Copy,
  Search,
  Package,
  Clock,
  Key,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useActivityProductsData, ActivityProduct, ProductFilters } from '@/hooks/useActivityProductsData';
import { useActivityCategoriesData } from '@/hooks/useActivityCategoriesData';

const ActivityProductsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ActivityProduct | null>(null);

  const { 
    products, 
    isLoading, 
    deleteProduct, 
    duplicateProduct, 
    toggleStatus,
    isDeleting,
    isDuplicating,
  } = useActivityProductsData(filters);

  const { categories } = useActivityCategoriesData();

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDeleteDialog = (product: ActivityProduct) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'time_slot':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'rental':
        return <Key className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'activity':
        return 'Activity';
      case 'time_slot':
        return 'Time Slot';
      case 'rental':
        return 'Rental';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <EyeOff className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLowestPrice = (product: ActivityProduct) => {
    if (product.product_type === 'rental' && product.rental_options?.length) {
      const prices = product.rental_options.map(o => o.price);
      return Math.min(...prices);
    }
    if (product.pricing?.length) {
      const prices = product.pricing.map(p => p.price);
      return Math.min(...prices);
    }
    return 0;
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
  };

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your activities, time slots, and rentals</p>
          </div>
          <Button onClick={() => navigate('/activity-dashboard/products/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category_id: value === 'all' ? undefined : value }))
                }
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.product_type || 'all'}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    product_type: value === 'all' ? undefined : value as ProductFilters['product_type']
                  }))
                }
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="time_slot">Time Slot</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : value as ProductFilters['status']
                  }))
                }
              >
                <SelectTrigger className="w-full md:w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">No products yet</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  Create your first product to start selling
                </p>
                <Button onClick={() => navigate('/activity-dashboard/products/new')} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Price (from)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] ? (
                            <img 
                              src={product.images[0].image_url} 
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              {getProductTypeIcon(product.product_type)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.short_description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {product.short_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getProductTypeIcon(product.product_type)}
                          <span className="text-sm">{getProductTypeLabel(product.product_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.category?.name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-medium">
                          IDR {getLowestPrice(product).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/activity-dashboard/products/${product.id}`)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => duplicateProduct(product.id)}
                              disabled={isDuplicating}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {product.status !== 'active' && (
                              <DropdownMenuItem 
                                onClick={() => toggleStatus({ id: product.id, status: 'active' })}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {product.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => toggleStatus({ id: product.id, status: 'inactive' })}
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? 
              This will set the product to inactive (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ActivityDashboardLayout>
  );
};

export default ActivityProductsPage;
