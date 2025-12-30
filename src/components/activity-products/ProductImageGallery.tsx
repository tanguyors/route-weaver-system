import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Image, 
  Upload, 
  X, 
  Star, 
  GripVertical, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductImagesData, ProductImage } from '@/hooks/useProductImagesData';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface ProductImageGalleryProps {
  productId: string | undefined;
  partnerId: string | undefined;
}

interface SortableImageProps {
  image: ProductImage;
  isFirst: boolean;
  onDelete: (image: ProductImage) => void;
  onSetMain: (id: string) => void;
  isDeleting: boolean;
}

const SortableImage = ({ image, isFirst, onDelete, onSetMain, isDeleting }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
    >
      <img
        src={image.image_url}
        alt={`Product image ${image.display_order}`}
        className="w-full h-full object-cover"
      />
      
      {/* Main image badge */}
      {isFirst && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <Star className="h-3 w-3" />
          Main
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 bg-background/80 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Actions overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!isFirst && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSetMain(image.id)}
            className="h-8"
          >
            <Star className="h-3 w-3 mr-1" />
            Set Main
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(image)}
          disabled={isDeleting}
          className="h-8"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
};

export const ProductImageGallery = ({ productId, partnerId }: ProductImageGalleryProps) => {
  const {
    images,
    isLoading,
    uploadImages,
    isUploading,
    reorderImages,
    deleteImage,
    isDeleting,
    setMainImage,
    canAddMore,
    remainingSlots,
    maxImages,
  } = useProductImagesData(productId, partnerId);

  const [deleteConfirm, setDeleteConfirm] = useState<ProductImage | null>(null);
  const [localImages, setLocalImages] = useState<ProductImage[]>([]);

  // Sync local images with fetched images
  const displayImages = localImages.length > 0 ? localImages : images;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await uploadImages(acceptedFiles);
    }
  }, [uploadImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    maxFiles: remainingSlots,
    disabled: !canAddMore || isUploading || !productId,
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Use displayImages for correct indices
      const oldIndex = displayImages.findIndex(img => img.id === active.id);
      const newIndex = displayImages.findIndex(img => img.id === over.id);
      
      const newOrder = arrayMove(displayImages, oldIndex, newIndex);
      setLocalImages(newOrder);
      
      // Normalize to contiguous order 1, 2, 3...
      const reordered = newOrder.map((img, index) => ({
        id: img.id,
        display_order: index + 1,
      }));
      
      await reorderImages(reordered);
      setLocalImages([]);
    }
  };

  const handleSetMainImage = (imageId: string) => {
    setMainImage(imageId, displayImages);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteImage(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (!productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p>Save the product first to add images.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Images
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} / {maxImages}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        {canAddMore && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm text-primary font-medium">Drop images here</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop images, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP • Max 5MB • {remainingSlots} slots remaining
                </p>
              </div>
            )}
          </div>
        )}

        {/* Image grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No images yet</p>
            <p className="text-sm">Upload images to showcase your product</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={displayImages.map(img => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayImages.map((image, index) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    isFirst={index === 0}
                    onDelete={setDeleteConfirm}
                    onSetMain={handleSetMainImage}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this image? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
