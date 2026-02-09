import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccommodationImage {
  id: string;
  accommodation_id: string;
  partner_id: string;
  image_url: string;
  file_path: string | null;
  display_order: number;
  created_at: string;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useAccommodationImagesData = (accommodationId: string | undefined, partnerId: string | undefined) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['accommodation-images', accommodationId],
    queryFn: async () => {
      if (!accommodationId) return [];
      const { data, error } = await supabase
        .from('accommodation_images')
        .select('*')
        .eq('accommodation_id', accommodationId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as AccommodationImage[];
    },
    enabled: !!accommodationId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!accommodationId || !partnerId) {
        throw new Error('Accommodation ID and Partner ID are required');
      }

      const currentCount = images.length;
      if (currentCount + files.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - currentCount} more.`);
      }

      const results: AccommodationImage[] = [];
      let currentOrder = images.length > 0
        ? Math.max(...images.map(img => img.display_order)) + 1
        : 1;

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP allowed.`);
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File too large: ${file.name}. Maximum 5MB allowed.`);
        }

        const fileId = crypto.randomUUID();
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${partnerId}/${accommodationId}/${fileId}.${fileExt}`;

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const { error: uploadError } = await supabase.storage
          .from('accommodation-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('accommodation-images')
          .getPublicUrl(filePath);

        const { data: imageData, error: dbError } = await supabase
          .from('accommodation_images')
          .insert({
            accommodation_id: accommodationId,
            partner_id: partnerId,
            image_url: urlData.publicUrl,
            file_path: filePath,
            display_order: currentOrder,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        results.push(imageData as AccommodationImage);
        currentOrder++;
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-images', accommodationId] });
      setUploadProgress({});
      toast.success('Images uploaded successfully');
    },
    onError: (error: Error) => {
      setUploadProgress({});
      toast.error(error.message || 'Failed to upload images');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedImages: { id: string; display_order: number }[]) => {
      if (!accommodationId) throw new Error('Accommodation ID is required');
      const { error } = await supabase.rpc('reorder_accommodation_images', {
        _accommodation_id: accommodationId,
        _orders: reorderedImages,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-images', accommodationId] });
      toast.success('Images reordered');
    },
    onError: () => {
      toast.error('Failed to reorder images');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (image: AccommodationImage) => {
      if (image.file_path) {
        await supabase.storage
          .from('accommodation-images')
          .remove([image.file_path]);
      }
      const { error } = await supabase
        .from('accommodation_images')
        .delete()
        .eq('id', image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-images', accommodationId] });
      toast.success('Image deleted');
    },
    onError: () => {
      toast.error('Failed to delete image');
    },
  });

  const setMainImage = async (imageId: string, currentImages: AccommodationImage[]) => {
    const targetImage = currentImages.find(img => img.id === imageId);
    if (!targetImage) return;

    const sortedImages = [...currentImages].sort((a, b) => a.display_order - b.display_order);
    if (sortedImages[0]?.id === imageId) return;

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
