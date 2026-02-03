-- Create storage bucket for tickets
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read tickets (needed for Fonnte to fetch)
CREATE POLICY "Public can read tickets"
ON storage.objects FOR SELECT
USING (bucket_id = 'tickets');

-- Allow service role to upload tickets
CREATE POLICY "Service role can upload tickets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tickets');

-- Allow service role to delete tickets
CREATE POLICY "Service role can delete tickets"
ON storage.objects FOR DELETE
USING (bucket_id = 'tickets');