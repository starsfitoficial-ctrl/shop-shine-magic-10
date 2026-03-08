-- Create public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated store owners to upload
CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated store owners to update their files
CREATE POLICY "Store owners can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated store owners to delete their files
CREATE POLICY "Store owners can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');