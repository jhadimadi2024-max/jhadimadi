-- ============================================================================
-- JHADIMADI.COM — MIGRATION 029: FIX IS_STAFF SCHEMA MISMATCH & STORAGE RLS
-- Target Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- Objective:
-- 1. Eliminate Supabase Storage REST upload failed (400) error caused by:
--    "There is a database schema mismatch in a trigger or RLS policy: SQL function 'is_staff' during startup"
-- 2. Ensure public.user_roles table exists so is_staff() never throws "relation does not exist"
-- 3. Replace public.is_staff(UUID) with bulletproof PL/pgSQL function with exception handling
-- 4. Clean up and replace all broken storage.objects RLS policies
-- 5. Guarantee public / authenticated uploads to 'products' and 'banners' buckets
-- ============================================================================

-- 1. Ensure public.user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.user_roles TO anon, authenticated, service_role, postgres;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_allow_read" ON public.user_roles;
CREATE POLICY "user_roles_allow_read" ON public.user_roles
  FOR SELECT TO anon, authenticated, service_role
  USING (true);

-- 2. Bulletproof is_staff function (Never crashes, handles missing tables & null parameters)
CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_is_staff BOOLEAN := false;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = user_uuid AND role IN ('moderator', 'admin', 'super_admin')
    ) INTO v_is_staff;
  ELSE
    v_is_staff := false;
  END IF;

  RETURN COALESCE(v_is_staff, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO anon, authenticated, service_role, postgres;

-- 3. Ensure Storage Buckets 'products' and 'banners' exist and are public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']),
  ('banners', 'banners', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('product-images', 'product-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'];

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role, postgres;

-- 4. Drop all legacy/broken storage policies that reference is_staff or block uploads
DROP POLICY IF EXISTS "Staff or Owner Update Assets" ON storage.objects;
DROP POLICY IF EXISTS "Staff or Owner Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "Staff Full Access to Storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Read for Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Storage public access" ON storage.objects;
DROP POLICY IF EXISTS "Public Select on Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Update to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public banners read" ON storage.objects;
DROP POLICY IF EXISTS "Public banners insert" ON storage.objects;
DROP POLICY IF EXISTS "Public banners update" ON storage.objects;
DROP POLICY IF EXISTS "Public banners delete" ON storage.objects;

-- 5. Create Simple, Robust, Non-Breaking RLS Policies for Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5.1 Public Read (SELECT) for products and banners
CREATE POLICY "Public Select on Public Buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 5.2 Public & Authenticated Upload (INSERT) to products and banners
CREATE POLICY "Public Insert to Public Buckets"
  ON storage.objects FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 5.3 Public & Authenticated Update (UPDATE) for products and banners
CREATE POLICY "Public Update to Public Buckets"
  ON storage.objects FOR UPDATE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'))
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 5.4 Public & Authenticated Delete (DELETE) for products and banners
CREATE POLICY "Public Delete to Public Buckets"
  ON storage.objects FOR DELETE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 6. Also ensure banners table exists in public schema
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  tag TEXT DEFAULT 'স্পেশাল অফার',
  image_url TEXT NOT NULL,
  target_link TEXT DEFAULT 'auto_directory',
  link_url TEXT,
  placement TEXT DEFAULT 'homepage_hero',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  sort_order INT DEFAULT 1,
  alt_text TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role, postgres;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_universal_all" ON public.banners;
CREATE POLICY "banners_universal_all" ON public.banners
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

-- 7. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
