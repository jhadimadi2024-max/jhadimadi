-- Migration 011: Harden Storage and Row Level Security
-- Revokes anonymous UPDATE and DELETE permissions on public asset buckets.
-- Preserves public READ access for storefront products, banners, and catalogs.
-- Restricts mutations to authenticated accounts and verified staff members.

-- 1. Ensure RLS is active on storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly permissive legacy anonymous policies if they exist
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Products Bucket" ON storage.objects;

-- 3. Public Read Policy: Anyone can view public product, banner, and catalog assets
CREATE POLICY "Public Read Assets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products', 'product-images', 'banners', 'public-banners', 'avatars'));

-- 4. Authenticated Insert Policy: Only authenticated users or backend service role can upload
CREATE POLICY "Authenticated Upload Assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('products', 'product-images', 'banners', 'public-banners', 'avatars')
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- 5. Restrictive Update Policy: Only staff or asset owner can update
CREATE POLICY "Staff or Owner Update Assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('products', 'product-images', 'banners', 'public-banners', 'avatars')
    AND (
      auth.role() = 'service_role' 
      OR (EXISTS (SELECT 1 FROM public.is_staff(auth.uid()) WHERE is_staff = true))
      OR (owner = auth.uid()::text)
    )
  );

-- 6. Restrictive Delete Policy: Only staff or asset owner can delete
CREATE POLICY "Staff or Owner Delete Assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('products', 'product-images', 'banners', 'public-banners', 'avatars')
    AND (
      auth.role() = 'service_role'
      OR (EXISTS (SELECT 1 FROM public.is_staff(auth.uid()) WHERE is_staff = true))
      OR (owner = auth.uid()::text)
    )
  );

-- 7. Additive audit log comment
COMMENT ON TABLE storage.objects IS 'Storage objects secured with authenticated upload and staff-guarded deletion (Migration 011).';
