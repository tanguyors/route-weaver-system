import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductImage {
  id: string;
  product_id: string;
  partner_id: string;
  image_url: string;
  file_path: string | null;
  display_order: number;
  created_at: string;
}

interface UploadProgress {
  [key: string]: number;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useProductImagesData = (productId: string | undefined, partnerId: string | undefined) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  // Fetch images for a product
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('activity_product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });

  // Upload images
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!productId || !partnerId) {
        throw new Error('Product ID and Partner ID are required');
      }

      const currentCount = images.length;
      if (currentCount + files.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - currentCount} more.`);
      }

      const results: ProductImage[] = [];
      let currentOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) + 1 
        : 1;

      for (const file of files) {
        // Validate file
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP allowed.`);
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File too large: ${file.name}. Maximum 5MB allowed.`);
        }

        const fileId = crypto.randomUUID();
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${partnerId}/${productId}/${fileId}.${fileExt}`;

        // Upload to storage
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const { error: uploadError } = await supabase.storage
          .from('activity-products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('activity-products')
          .getPublicUrl(filePath);

        // Save to database - trigger will set partner_id from product
        // Need to cast to bypass strict typing since trigger handles partner_id
        const insertData = {
          product_id: productId,
          partner_id: partnerId, // Will be overwritten by trigger but needed for types
          image_url: urlData.publicUrl,
          file_path: filePath,
          display_order: currentOrder,
        };
        
        const { data: imageData, error: dbError } = await supabase
          .from('activity_product_images')
          .insert(insertData)
          .select()
          .single();

        if (dbError) throw dbError;

        results.push(imageData as ProductImage);
        currentOrder++;
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      setUploadProgress({});
      toast.success('Images uploaded successfully');
    },
    onError: (error: Error) => {
      setUploadProgress({});
      toast.error(error.message || 'Failed to upload images');
    },
  });

  // Reorder images using atomic RPC
  const reorderMutation = useMutation({
    mutationFn: async (reorderedImages: { id: string; display_order: number }[]) => {
      if (!productId) throw new Error('Product ID is required');
      
      const { error } = await supabase.rpc('reorder_product_images', {
        _product_id: productId,
        _orders: reorderedImages,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast.success('Images reordered');
    },
    onError: () => {
      toast.error('Failed to reorder images');
    },
  });

  // Delete image using file_path
  const deleteMutation = useMutation({
    mutationFn: async (image: ProductImage) => {
      // Delete from storage using file_path (reliable)
      if (image.file_path) {
        await supabase.storage
          .from('activity-products')
          .remove([image.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('activity_product_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Image deleted');
    },
    onError: () => {
      toast.error('Failed to delete image');
    },
  });

  // Set as main image - normalize all orders to contiguous sequence
  const setMainImage = async (imageId: string, currentImages: ProductImage[]) => {
    const targetImage = currentImages.find(img => img.id === imageId);
    if (!targetImage) return;
    
    // Already first? No-op
    const sortedImages = [...currentImages].sort((a, b) => a.display_order - b.display_order);
    if (sortedImages[0]?.id === imageId) return;

    // Move target to front, then normalize all to 1, 2, 3...
    const reordered = [
      targetImage,
      ...sortedImages.filter(img => img.id !== imageId),
    ].map((img, index) => ({
      id: img.id,
      display_order: index + 1,
    }));

    await reorderMutation.mutateAsync(reordered);
  };

  return {
    images,
    isLoading,
    error,
    uploadProgress,
    uploadImages: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    reorderImages: reorderMutation.mutateAsync,
    isReordering: reorderMutation.isPending,
    deleteImage: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setMainImage,
    maxImages: MAX_IMAGES,
    canAddMore: images.length < MAX_IMAGES,
    remainingSlots: MAX_IMAGES - images.length,
  };
};
