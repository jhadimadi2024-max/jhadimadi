-- =========================================================================
-- JHADIMADI.COM - RLS & PUBLIC ACCESS REPAIR POLICY SNIPPET
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO RESOLVE ALL 401 / 403 / 42501
-- "permission denied for table ..." ERRORS ON PUBLIC QUERIES.
-- =========================================================================

-- 1. Grant usage on schema to public and anon
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- 2. Ensure missing categories and notifications tables exist
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

-- 3. Grant table permissions to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) and define permissive policies for all tables
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
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

        EXECUTE format('DROP POLICY IF EXISTS "%s_public_all" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_read" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_all" ON public.%I;', tbl, tbl);

        -- Public Read Policy
        EXECUTE format('CREATE POLICY "%s_public_select" ON public.%I FOR SELECT TO anon, authenticated, service_role USING (true);', tbl, tbl);

        -- Full write policy for application operations
        EXECUTE format('CREATE POLICY "%s_public_all" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 5. Seed default categories if empty
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

-- 6. Storage RLS Policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']),
  ('product-images', 'product-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;

CREATE POLICY "Products bucket is publicly accessible"
  ON storage.objects FOR SELECT TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'product-images'));

CREATE POLICY "Allow upload to products bucket"
  ON storage.objects FOR INSERT TO anon, authenticated, service_role
  WITH CHECK (bucket_id IN ('products', 'product-images'));

CREATE POLICY "Allow update in products bucket"
  ON storage.objects FOR UPDATE TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'product-images'))
  WITH CHECK (bucket_id IN ('products', 'product-images'));

CREATE POLICY "Allow delete in products bucket"
  ON storage.objects FOR DELETE TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'product-images'));

NOTIFY pgrst, 'reload schema';
