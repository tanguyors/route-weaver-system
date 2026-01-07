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
import { Upload, X, Anchor, Loader2 } from 'lucide-react';
import { PrivateBoat, PrivateBoatStatus } from '@/hooks/usePrivateBoatsData';

interface PrivateBoatFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    capacity: number;
    min_capacity: number;
    max_capacity: number;
    image_url?: string;
    status: PrivateBoatStatus;
    min_departure_time: string;
    max_departure_time: string;
  }) => Promise<{ error: Error | null }>;
  onUploadImage: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  initialData?: PrivateBoat;
  isEdit?: boolean;
}

const PrivateBoatForm = ({ open, onClose, onSubmit, onUploadImage, initialData, isEdit }: PrivateBoatFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minCapacity, setMinCapacity] = useState(8);
  const [maxCapacity, setMaxCapacity] = useState(12);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<PrivateBoatStatus>('draft');
  const [minDepartureTime, setMinDepartureTime] = useState('06:00');
  const [maxDepartureTime, setMaxDepartureTime] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setMinCapacity(initialData.min_capacity || 1);
      setMaxCapacity(initialData.max_capacity || initialData.capacity);
      setImageUrl(initialData.image_url || '');
      setStatus(initialData.status);
      setMinDepartureTime(initialData.min_departure_time.slice(0, 5));
      setMaxDepartureTime(initialData.max_departure_time.slice(0, 5));
    } else {
      setName('');
      setDescription('');
      setMinCapacity(8);
      setMaxCapacity(12);
      setImageUrl('');
      setStatus('draft');
      setMinDepartureTime('06:00');
      setMaxDepartureTime('18:00');
    }
  }, [initialData, open]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    const result = await onUploadImage(acceptedFiles[0]);
    setUploading(false);
    
    if (result.url) {
      setImageUrl(result.url);
    }
  }, [onUploadImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (minCapacity < 1 || maxCapacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    if (minCapacity > maxCapacity) {
      setError('Min capacity cannot be greater than max capacity');
      return;
    }

    if (minDepartureTime >= maxDepartureTime) {
      setError('Min departure time must be before max departure time');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      capacity: maxCapacity,
      min_capacity: minCapacity,
      max_capacity: maxCapacity,
      image_url: imageUrl || undefined,
      status,
      min_departure_time: minDepartureTime,
      max_departure_time: maxDepartureTime,
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
            <Anchor className="h-5 w-5" />
            {isEdit ? 'Edit Private Boat' : 'Add Private Boat'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Boat Photo</Label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Boat"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop an image here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP up to 5MB
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
              placeholder="e.g. Luxury Yacht"
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

          <div className="space-y-2">
            <Label>Capacity (passengers) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="minCapacity"
                type="number"
                value={minCapacity}
                onChange={(e) => setMinCapacity(parseInt(e.target.value) || 1)}
                min={1}
                placeholder="Min"
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                id="maxCapacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                min={1}
                placeholder="Max"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">pax</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: PrivateBoatStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTime">Min Departure Time *</Label>
              <Input
                id="minTime"
                type="time"
                value={minDepartureTime}
                onChange={(e) => setMinDepartureTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTime">Max Departure Time *</Label>
              <Input
                id="maxTime"
                type="time"
                value={maxDepartureTime}
                onChange={(e) => setMaxDepartureTime(e.target.value)}
              />
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

export default PrivateBoatForm;
