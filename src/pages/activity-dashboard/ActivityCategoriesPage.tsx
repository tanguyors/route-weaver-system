import { useState } from 'react';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { useActivityCategoriesData, ActivityCategory } from '@/hooks/useActivityCategoriesData';

const ActivityCategoriesPage = () => {
  const { 
    categories, 
    isLoading, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useActivityCategoriesData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ActivityCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ActivityCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', status: 'active' });
    setDialogOpen(true);
  };

  const openEditDialog = (category: ActivityCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (category: ActivityCategory) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingCategory) {
      updateCategory({
        id: editingCategory.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
      });
    } else {
      createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id);
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    }
  };

  const activeCount = categories.filter(c => c.status === 'active').length;

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">Organize your activities into categories</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">No categories yet</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  Create your first category to organize activities
                </p>
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.status === 'active' ? 'default' : 'secondary'}
                          className={category.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}
                        >
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(category)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(category)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category details below.'
                : 'Create a new category to organize your activities.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Water Sports, Tours, Wellness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name.trim() || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              This action cannot be undone. Products in this category will be uncategorized.
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

export default ActivityCategoriesPage;
