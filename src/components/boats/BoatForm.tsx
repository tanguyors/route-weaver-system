import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Ship, Loader2, Plus } from 'lucide-react';
import { Boat } from '@/hooks/useBoatsData';

interface BoatFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    capacity: number;
    image_url?: string;
    images?: string[];
    status: 'active' | 'inactive';
  }) => Promise<{ error: Error | null }>;
  onUploadImage: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  initialData?: Boat & { images?: string[] };
  isEdit?: boolean;
}

const MAX_IMAGES = 5;

const BoatForm = ({ open, onClose, onSubmit, onUploadImage, initialData, isEdit }: BoatFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setCapacity(initialData.capacity || 50);
      // Use images array if available, otherwise use image_url
      const existingImages = initialData.images?.length 
        ? initialData.images.filter(Boolean) 
        : initialData.image_url 
          ? [initialData.image_url] 
          : [];
      setImages(existingImages);
      setStatus(initialData.status || 'active');
    } else {
      // Reset to defaults
      setName('');
      setDescription('');
      setCapacity(50);
      setImages([]);
      setStatus('active');
    }
    setError('');
  }, [initialData, open]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    
    setUploading(true);
    setError('');
    
    // Upload files one by one (up to remaining slots)
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      const result = await onUploadImage(file);
      if (result.url) {
        setImages(prev => [...prev, result.url!]);
      }
    }
    
    setUploading(false);
  }, [onUploadImage, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: MAX_IMAGES - images.length,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: images.length >= MAX_IMAGES,
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (capacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      capacity,
      image_url: images[0] || undefined, // First image as main image
      images: images,
      status,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {isEdit ? 'Edit Boat' : 'Add Boat'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Boat Photos ({images.length}/{MAX_IMAGES})</Label>
            
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Boat ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Area */}
            {images.length < MAX_IMAGES && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                } ${images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {images.length === 0 
                        ? 'Drop images here or click to upload' 
                        : `Add more photos (${MAX_IMAGES - images.length} remaining)`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP up to 5MB each
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Boat Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sea Explorer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the boat features..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>

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
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Saving...' : isEdit ? 'Update Boat' : 'Add Boat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BoatForm;