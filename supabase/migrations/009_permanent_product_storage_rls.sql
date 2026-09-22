-- =========================================================================
-- JHADIMADI.COM - PERMANENT PUBLIC PRODUCT STORAGE BUCKET & RLS POLICIES
-- Migration 009: Dedicated Public 'products' Storage Bucket & Permissions
-- Ensures product images are permanently accessible publicly and uploads succeed
-- =========================================================================

-- 1. Ensure 'products' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  15728640, -- 15 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Also ensure 'product-images' exists as a compatible public bucket alias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remove conflicting or overly restrictive policies on products bucket
DROP POLICY IF EXISTS "Products are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on products" ON storage.objects;
DROP POLICY IF EXISTS "Sellers and admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to products" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;

-- 4. PUBLIC READ POLICY: Anyone can view and download product images without authentication (Public CDN)
CREATE POLICY "Products bucket is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products', 'product-images'));

-- 5. UPLOAD POLICY: Authenticated users, admins, and app clients can upload product images
CREATE POLICY "Allow upload to products bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('products', 'product-images'));

-- 6. UPDATE POLICY: Allow updating/replacing product images
CREATE POLICY "Allow update in products bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('products', 'product-images'))
  WITH CHECK (bucket_id IN ('products', 'product-images'));

-- 7. DELETE POLICY: Allow deleting product images
CREATE POLICY "Allow delete in products bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('products', 'product-images'));

