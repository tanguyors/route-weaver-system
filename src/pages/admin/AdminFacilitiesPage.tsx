 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
 import { Plus, Pencil, Trash2, Ship, Loader2 } from 'lucide-react';
 import { icons } from 'lucide-react';
 import { toast } from 'sonner';
 
 interface Facility {
   id: string;
   name: string;
   description: string | null;
   icon: string | null;
   created_at: string;
 }
 
 const AdminFacilitiesPage = () => {
   const [facilities, setFacilities] = useState<Facility[]>([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);
   const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
   const [deleteFacilityId, setDeleteFacilityId] = useState<string | null>(null);
   const [saving, setSaving] = useState(false);
 
   const [formData, setFormData] = useState({
     name: '',
     description: '',
     icon: ''
   });
 
   const fetchFacilities = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('facilities')
       .select('*')
       .order('name');
 
     if (error) {
       toast.error('Failed to load facilities');
       console.error(error);
     } else {
       setFacilities(data || []);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchFacilities();
   }, []);
 
   const resetForm = () => {
     setFormData({ name: '', description: '', icon: '' });
     setEditingFacility(null);
   };
 
   const handleOpenForm = (facility?: Facility) => {
     if (facility) {
       setEditingFacility(facility);
       setFormData({
         name: facility.name,
         description: facility.description || '',
         icon: facility.icon || ''
       });
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
     if (!formData.name.trim()) {
       toast.error('Facility name is required');
       return;
     }
 
     setSaving(true);
 
     const facilityData = {
       name: formData.name.trim(),
       description: formData.description.trim() || null,
       icon: formData.icon.trim() || null
     };
 
     if (editingFacility) {
       const { error } = await supabase
         .from('facilities')
         .update(facilityData)
         .eq('id', editingFacility.id);
 
       if (error) {
         toast.error('Failed to update facility');
         console.error(error);
       } else {
         toast.success('Facility updated successfully');
         handleCloseForm();
         fetchFacilities();
       }
     } else {
       const { error } = await supabase
         .from('facilities')
         .insert(facilityData);
 
       if (error) {
         toast.error('Failed to create facility');
         console.error(error);
       } else {
         toast.success('Facility created successfully');
         handleCloseForm();
         fetchFacilities();
       }
     }
 
     setSaving(false);
   };
 
   const handleDelete = async () => {
     if (!deleteFacilityId) return;
 
     const { error } = await supabase
       .from('facilities')
       .delete()
       .eq('id', deleteFacilityId);
 
     if (error) {
       toast.error('Failed to delete facility');
       console.error(error);
     } else {
       toast.success('Facility deleted successfully');
       fetchFacilities();
     }
 
     setDeleteFacilityId(null);
   };
 
   if (loading) {
     return (
       <DashboardLayout>
         <div className="flex items-center justify-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-bold text-foreground">Facilities Management</h1>
             <p className="text-muted-foreground mt-1">
               Manage boat services and amenities available on board
             </p>
           </div>
           <Button onClick={() => handleOpenForm()}>
             <Plus className="h-4 w-4 mr-2" />
             Add Facility
           </Button>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Ship className="h-5 w-5" />
               All Facilities ({facilities.length})
             </CardTitle>
           </CardHeader>
           <CardContent>
             {facilities.length === 0 ? (
               <div className="text-center py-12">
                 <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">No facilities yet</p>
                 <Button className="mt-4" onClick={() => handleOpenForm()}>
                   <Plus className="h-4 w-4 mr-2" />
                   Add First Facility
                 </Button>
               </div>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Description</TableHead>
                     <TableHead>Icon</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {facilities.map((facility) => (
                     <TableRow key={facility.id}>
                       <TableCell className="font-medium">{facility.name}</TableCell>
                       <TableCell className="max-w-xs truncate">{facility.description || '-'}</TableCell>
                       <TableCell>
                         {facility.icon ? (
                           (() => {
                             const iconName = facility.icon
                               .split('-')
                               .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                               .join('');
                             const IconComponent = icons[iconName as keyof typeof icons];
                             return IconComponent ? <IconComponent className="h-5 w-5 text-muted-foreground" /> : facility.icon;
                           })()
                         ) : '-'}
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleOpenForm(facility)}
                           >
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setDeleteFacilityId(facility.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
           </CardContent>
         </Card>
       </div>
 
       {/* Add/Edit Facility Dialog */}
       <Dialog open={showForm} onOpenChange={setShowForm}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {editingFacility ? 'Edit Facility' : 'Add New Facility'}
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="name">Facility Name *</Label>
               <Input
                 id="name"
                 placeholder="e.g., Air Conditioning"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 placeholder="e.g., Full climate control throughout the boat"
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 rows={3}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="icon">Icon (lucide icon name)</Label>
               <Input
                 id="icon"
                 placeholder="e.g., wifi, coffee, anchor"
                 value={formData.icon}
                 onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={handleCloseForm}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={saving}>
               {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {editingFacility ? 'Update Facility' : 'Create Facility'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deleteFacilityId} onOpenChange={() => setDeleteFacilityId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Facility?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. The facility will be permanently deleted.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </DashboardLayout>
   );
 };
 
 export default AdminFacilitiesPage;