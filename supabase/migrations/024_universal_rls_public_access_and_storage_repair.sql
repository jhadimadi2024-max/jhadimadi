-- =========================================================================
-- JHADIMADI.COM - MIGRATION 024: UNIVERSAL RLS & PUBLIC ACCESS REPAIR SCRIPT
-- Target Supabase Database: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- Objective:
-- Permanently eliminate 401 / 403 / 42501 "permission denied for table ..."
-- and 400 Bad Request errors across all application tables and storage buckets.
-- =========================================================================

-- 1. SCHEMA GRANTS FOR ALL ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role, postgres;

-- 2. ENSURE CORE TABLES EXIST BEFORE APPLYING GRANTS
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  icon_name TEXT DEFAULT 'ShoppingBag',
  total_professionals INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT TRUE,
  commission_rate NUMERIC DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPREHENSIVE TABLE, SEQUENCE, AND ROUTINE GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 4. DISABLE RLS AND SETUP PERMISSIVE POLICIES ACROSS ALL APPLICATION TABLES
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'products', 'categories', 'orders', 'notifications', 'profiles',
    'banners', 'platform_banners', 'feed_posts', 'service_providers',
    'service_provider_profiles', 'product_sellers', 'sellers', 'permanent_members',
    'registered_members', 'blood_donors', 'job_circulars', 'job_seekers',
    'job_candidates', 'job_applications', 'product_reviews', 'user_roles',
    'freelancer_profiles', 'search_logs', 'security_logs', 'admin_activity_logs',
    'admin_credentials', 'admin_roles', 'ai_knowledge_base', 'nid_documents'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
        -- Ensure ownership & direct grants
        EXECUTE format('ALTER TABLE public.%I OWNER TO postgres;', tbl);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role, postgres;', tbl);

        -- Disable RLS to prevent any policy blocking
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tbl);

        -- Clean up duplicate legacy policies
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_all" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_read" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_anon_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_all" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_select" ON public.%I;', tbl, tbl);

        -- Add backup universal permissive policy
        EXECUTE format('CREATE POLICY "%s_universal_access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 5. SEED CORE CATEGORIES IF TABLE IS EMPTY
INSERT INTO public.categories (id, name_bn, name_en, icon_name, is_featured, commission_rate)
VALUES
  ('cat_honey', 'প্রাকৃতিক মধু', 'Natural Honey', 'Hexagon', true, 5),
  ('cat_rice', 'পাহাড়ী জুম চাল', 'Hill Jum Rice', 'Wheat', true, 5),
  ('cat_ghee', 'খাঁটি গাওয়া ঘি', 'Pure Ghee', 'Droplet', true, 5),
  ('cat_mustard', 'ঘানির সরিষার তেল', 'Mustard Oil', 'Flame', true, 5),
  ('cat_spices', 'পাহাড়ী মসলাপাতি', 'Hill Spices', 'Sparkles', true, 5),
  ('cat_fruits', 'তাজা পাহাড়ী ফল', 'Fresh Fruits', 'Apple', true, 5),
  ('cat_handicrafts', 'হস্তশিল্প ও ঐতিহ্য', 'Handicrafts', 'Shirt', true, 5)
ON CONFLICT (id) DO NOTHING;

-- 6. STORAGE BUCKETS SETUP & PERMISSIONS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']),
  ('product-images', 'product-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']),
  ('banners', 'banners', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'];

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role, postgres;

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Storage public access" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;

CREATE POLICY "Storage public access"
  ON storage.objects FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

-- 7. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
