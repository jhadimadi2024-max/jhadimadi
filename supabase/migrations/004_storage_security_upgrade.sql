-- =========================================================================
-- JHADIMADI.COM - SUPABASE STORAGE SECURITY AUDIT & HARDENING MIGRATION
-- Migration 004: Comprehensive Storage Hardening & Enterprise RLS Policies
-- =========================================================================

-- Ensure the storage schema and extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. BUCKET CONFIGURATION & ENFORCEMENT
-- Configures all 5 application buckets with strict public/private settings,
-- explicit file size quotas, and whitelisted MIME types.
-- -------------------------------------------------------------------------

-- 1.1 Avatars (Public): User, Service Provider & Merchant profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 1.2 Products (Public): Merchant & Admin product gallery images & thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'products', 
  'products', 
  true, 
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 1.3 Banners (Public): Platform homepage hero banners & seasonal campaign artwork
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'banners', 
  'banners', 
  true, 
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 1.4 NID Documents (Private - Critical KYC/PII): NID cards, trade licenses, birth certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'nid_documents', 
  'nid_documents', 
  false, -- STRICTLY PRIVATE! Never accessible without authenticated RLS / signed URL
  15728640, -- 15 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 1.5 Order Attachments (Private): bKash/Nagad trx receipts, dispute evidence & invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'order_attachments', 
  'order_attachments', 
  false, -- STRICTLY PRIVATE
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];


-- -------------------------------------------------------------------------
-- 2. SECURITY HELPER FUNCTIONS
-- Validates safe path tokens, prevents path traversal, and verifies extensions.
-- -------------------------------------------------------------------------

-- Validates that the file path is clean, without path traversal attacks (../)
CREATE OR REPLACE FUNCTION public.storage_is_safe_path(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    file_path IS NOT NULL AND
    file_path NOT LIKE '%..%' AND
    file_path NOT LIKE '%//%' AND
    file_path NOT LIKE '/%' AND
    file_path NOT LIKE '%\%' AND
    file_path ~ '^[a-zA-Z0-9_\-\./]+$';
$$;

-- Validates allowed raster image extensions (bans executable or script files)
CREATE OR REPLACE FUNCTION public.storage_is_valid_image(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(storage.extension(file_path)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif');
$$;

-- Validates allowed document extensions (images + PDF)
CREATE OR REPLACE FUNCTION public.storage_is_valid_doc(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(storage.extension(file_path)) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
$$;


-- -------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES ON storage.objects
-- -------------------------------------------------------------------------

-- Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up older or ambiguous storage policies to avoid conflicting permissions
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Products are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Sellers and admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers and admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers and admins can delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Banners are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete banners" ON storage.objects;

DROP POLICY IF EXISTS "NID documents only accessible by owner and admin" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own NID documents" ON storage.objects;
DROP POLICY IF EXISTS "NID documents accessible only by owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own NID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own NID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own NID documents" ON storage.objects;

DROP POLICY IF EXISTS "Order attachments accessible only by owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload order attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update order attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete order attachments" ON storage.objects;


-- =========================================================================
-- BUCKET A: AVATARS (Public Read, Owner / Admin Write)
-- =========================================================================

-- A.1 Public Download / Read
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- A.2 Authenticated User Upload into their isolated personal folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- A.3 Owner / Admin Update (needed for avatar replacement / upsert)
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- A.4 Owner / Admin Delete
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    )
  );


-- =========================================================================
-- BUCKET B: PRODUCTS (Public Read, Seller / Admin Write)
-- =========================================================================

-- B.1 Public Download / Read (Catalog browsing)
CREATE POLICY "Products are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- B.2 Authenticated Sellers & Admins Upload
CREATE POLICY "Sellers and admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- B.3 Seller / Admin Update
CREATE POLICY "Sellers and admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'products' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- B.4 Seller / Admin Delete
CREATE POLICY "Sellers and admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    )
  );


-- =========================================================================
-- BUCKET C: BANNERS (Public Read, STRICTLY ADMIN ONLY Write)
-- =========================================================================

-- C.1 Public Download / Read (Website banners)
CREATE POLICY "Banners are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- C.2 Strictly Admin Upload
CREATE POLICY "Only admins can upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners' AND
    (
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- C.3 Strictly Admin Update
CREATE POLICY "Only admins can update banners"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners' AND (
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    bucket_id = 'banners' AND (
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_image(name)
  );

-- C.4 Strictly Admin Delete
CREATE POLICY "Only admins can delete banners"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners' AND (
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );


-- =========================================================================
-- BUCKET D: NID_DOCUMENTS (STRICTLY PRIVATE - KYC / PII PROTECTION)
-- =========================================================================

-- D.1 Strictly Private Read: Only Document Owner or Admin
CREATE POLICY "NID documents accessible only by owner or admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );

-- D.2 Authenticated User Upload into their isolated user folder
CREATE POLICY "Users can upload own NID documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nid_documents' AND
    auth.role() = 'authenticated' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_doc(name)
  );

-- D.3 Document Owner / Admin Update
CREATE POLICY "Users can update own NID documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_doc(name)
  );

-- D.4 Document Owner / Admin Delete (Prevents unauthorized deletion)
CREATE POLICY "Users can delete own NID documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );


-- =========================================================================
-- BUCKET E: ORDER_ATTACHMENTS (STRICTLY PRIVATE - Payment Slips & Evidence)
-- =========================================================================

-- E.1 Strictly Private Read: Only Order Owner or Admin
CREATE POLICY "Order attachments accessible only by owner or admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'order_attachments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );

-- E.2 Authenticated User Upload to their isolated folder
CREATE POLICY "Users can upload order attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'order_attachments' AND
    auth.role() = 'authenticated' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid())
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_doc(name)
  );

-- E.3 Owner / Admin Update
CREATE POLICY "Users can update order attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'order_attachments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    bucket_id = 'order_attachments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    ) AND
    public.storage_is_safe_path(name) AND
    public.storage_is_valid_doc(name)
  );

-- E.4 Owner / Admin Delete
CREATE POLICY "Users can delete order attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'order_attachments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );
