-- Create storage bucket for boat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-images', 'boat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload boat images
CREATE POLICY "Partners can upload boat images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'boat-images' AND auth.uid() IS NOT NULL);

-- Allow public to view boat images
CREATE POLICY "Public can view boat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'boat-images');

-- Allow partners to delete their own boat images
CREATE POLICY "Partners can delete own boat images"
ON storage.objects FOR DELETE
USING (bucket_id = 'boat-images' AND auth.uid() IS NOT NULL);