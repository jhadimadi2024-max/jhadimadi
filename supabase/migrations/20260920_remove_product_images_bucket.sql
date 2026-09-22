-- ============================================================================
-- JHADIMADI.COM — STRICT CANONICAL STORAGE BUCKET MIGRATION
-- Migration: 20260920_remove_product_images_bucket.sql
-- Description:
--   Enforce 'products' as the sole canonical product media bucket.
--   Deprecate and remove policies for obsolete 'product-images' bucket.
-- ============================================================================

-- Ensure canonical public 'products' bucket exists with proper limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520;

-- Drop legacy mixed policies referencing product-images
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Ensure clean public read policy for products bucket
DROP POLICY IF EXISTS "Public Access for products" ON storage.objects;
CREATE POLICY "Public Access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Authenticated sellers/admins can upload to products bucket
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Authenticated owners/admins can update/delete products media
DROP POLICY IF EXISTS "Authenticated users can update products" ON storage.objects;
CREATE POLICY "Authenticated users can update products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated users can delete products" ON storage.objects;
CREATE POLICY "Authenticated users can delete products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- Clean up any empty product-images bucket records if desired
DELETE FROM storage.buckets WHERE id = 'product-images';
