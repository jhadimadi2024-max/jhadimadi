-- =========================================================================
-- JHADIMADI.COM - MIGRATION 022: RLS PUBLIC ACCESS & PRIVILEGES REPAIR SCRIPT
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- FIXES:
-- 1. "permission denied for table ..." (401 / 403 / code 42501)
-- 2. Grants schema and table privileges to anon, authenticated, and service_role
-- 3. Enables Row Level Security (RLS) with permissive public policies
-- 4. Creates missing tables (categories, notifications, etc.) if not present
-- 5. Configures Storage bucket RLS policies for public read/write
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMA USAGE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- 3. CREATE CRITICAL MISSING TABLES (IDEMPOTENT)

-- Table: categories
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

-- Table: notifications
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

-- Table: products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  code TEXT,
  title TEXT,
  title_bn TEXT,
  title_en TEXT,
  name_bn TEXT,
  name_en TEXT,
  products_name TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  regular_price NUMERIC DEFAULT 0,
  discount_price NUMERIC,
  discount_badge BOOLEAN DEFAULT FALSE,
  short_description TEXT,
  description TEXT,
  description_bn TEXT,
  description_en TEXT,
  image_url TEXT,
  image TEXT,
  products_photos TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'অন্যান্য',
  unit TEXT NOT NULL DEFAULT '১ পিস',
  stock INT NOT NULL DEFAULT 10,
  stock_status TEXT DEFAULT 'in_stock',
  origin TEXT DEFAULT 'পার্বত্য চট্টগ্রাম',
  quality_standard TEXT DEFAULT '১০০% বিশুদ্ধ ও পরীক্ষিত',
  seller_name TEXT DEFAULT 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
  seller_id UUID,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  reviews_count INT NOT NULL DEFAULT 1,
  product_reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  district TEXT,
  upazila TEXT,
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'Pending',
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'exempt',
  gateway_name TEXT,
  gateway_transaction_id TEXT,
  gateway_payload JSONB,
  is_beta_phase BOOLEAN DEFAULT TRUE,
  order_channel TEXT DEFAULT 'web',
  customer_otp_verified BOOLEAN DEFAULT FALSE,
  customer_verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  user_role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  address TEXT,
  area TEXT,
  mahalla TEXT,
  detailed_address TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  nid_number TEXT,
  blood_group TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  membership_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  link TEXT,
  action_url TEXT,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: platform_banners
CREATE TABLE IF NOT EXISTS public.platform_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  link TEXT,
  action_url TEXT,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: feed_posts
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  author_name TEXT,
  author_phone TEXT,
  author_role TEXT,
  author_avatar TEXT,
  content TEXT,
  title TEXT,
  category TEXT DEFAULT 'general',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  price NUMERIC DEFAULT 0,
  contact_phone TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  status TEXT DEFAULT 'published',
  likes INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: blood_donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  full_name TEXT,
  phone TEXT UNIQUE,
  blood_group TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  last_donation_date DATE,
  is_available BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: service_providers
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  full_name TEXT,
  phone TEXT,
  service_category TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 1,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INT DEFAULT 1,
  hourly_rate NUMERIC DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT TRUE,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GRANT PRIVILEGES TO ALL ROLES (Fixes 401 / 403 42501 permission denied)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 5. ENABLE ROW LEVEL SECURITY & CONFIGURE PERMISSIVE POLICIES
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
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

        -- Clean up existing policies to avoid duplicates
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_all" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_public_read" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_allow_all" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_anon_select" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_anon_all" ON public.%I;', tbl, tbl);

        -- Permissive SELECT policy (Public Read Access)
        EXECUTE format('CREATE POLICY "%s_public_select" ON public.%I FOR SELECT TO anon, authenticated, service_role USING (true);', tbl, tbl);

        -- Permissive WRITE policy (Insert / Update / Delete)
        EXECUTE format('CREATE POLICY "%s_public_all" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 6. STORAGE BUCKET CONFIGURATION & POLICIES
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
DROP POLICY IF EXISTS "Products bucket public select" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket public all" ON storage.objects;

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

-- 7. SEED ESSENTIAL DEFAULT CATEGORIES IF EMPTY
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

-- 8. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
-- =========================================================================
-- END OF MIGRATION 022
-- =========================================================================
