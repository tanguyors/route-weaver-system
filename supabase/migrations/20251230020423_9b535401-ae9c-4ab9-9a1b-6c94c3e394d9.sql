-- Create storage bucket for activity product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-products', 'activity-products', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for activity-products bucket

-- Public read access (for widget & listings)
CREATE POLICY "Public read access for activity-products"
ON storage.objects FOR SELECT
USING (bucket_id = 'activity-products');

-- Partner owners with active activity module can upload
CREATE POLICY "Partner owners can upload activity product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'activity-products'
  AND (
    is_admin(auth.uid())
    OR (
      -- Extract partner_id from path: activity-products/{partner_id}/{product_id}/...
      EXISTS (
        SELECT 1 FROM public.partner_users pu
        JOIN public.partner_modules pm ON pm.partner_id = pu.partner_id
        WHERE pu.user_id = auth.uid()
        AND pu.status = 'active'
        AND pm.module_type = 'activity'
        AND pm.status = 'active'
        AND pu.partner_id::text = (storage.foldername(name))[1]
      )
    )
  )
);

-- Partner owners can update their own images
CREATE POLICY "Partner owners can update activity product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'activity-products'
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.partner_users pu
      JOIN public.partner_modules pm ON pm.partner_id = pu.partner_id
      WHERE pu.user_id = auth.uid()
      AND pu.status = 'active'
      AND pm.module_type = 'activity'
      AND pm.status = 'active'
      AND pu.partner_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Partner owners can delete their own images
CREATE POLICY "Partner owners can delete activity product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'activity-products'
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.partner_users pu
      JOIN public.partner_modules pm ON pm.partner_id = pu.partner_id
      WHERE pu.user_id = auth.uid()
      AND pu.status = 'active'
      AND pm.module_type = 'activity'
      AND pm.status = 'active'
      AND pu.partner_id::text = (storage.foldername(name))[1]
    )
  )
);