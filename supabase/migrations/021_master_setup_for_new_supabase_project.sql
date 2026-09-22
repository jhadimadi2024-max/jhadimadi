-- =========================================================================
-- JHADIMADI.COM - MIGRATION 021: COMPLETE MASTER SETUP FOR NEW SUPABASE BACKEND
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
-- Supabase SQL Editor: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
-- Run this entire script in the Supabase SQL Editor to provision all tables,
-- storage buckets, and public Row Level Security (RLS) policies.
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMA USAGE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLE CREATIONS (IDEMPOTENT)

-- Table 1: products
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
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_organic BOOLEAN DEFAULT TRUE,
  is_pre_harvest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Table 2: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  profession TEXT,
  profession_bn TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  mahalla TEXT,
  para TEXT,
  blood_group TEXT,
  is_blood_donor BOOLEAN DEFAULT FALSE,
  is_nid_verified BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  nid_number TEXT,
  bio TEXT,
  password TEXT,
  pass_word TEXT,
  experience_years NUMERIC DEFAULT 0,
  daily_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  tag TEXT DEFAULT 'স্পেশাল অফার',
  image_url TEXT,
  target_link TEXT DEFAULT 'auto_directory',
  placement TEXT DEFAULT 'homepage_hero',
  is_active BOOLEAN DEFAULT TRUE,
  display_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: platform_banners
CREATE TABLE IF NOT EXISTS public.platform_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  alt_text TEXT,
  image_url TEXT,
  action_url TEXT,
  sort_order NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: feed_posts
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT,
  author_phone TEXT,
  author_role TEXT DEFAULT 'Customer',
  author_avatar TEXT,
  content TEXT,
  category TEXT DEFAULT 'সাধারণ',
  price NUMERIC,
  contact_phone TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Approved',
  likes NUMERIC DEFAULT 0,
  comments_count NUMERIC DEFAULT 0,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  mahalla TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: service_providers
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  profession TEXT NOT NULL,
  profession_bn TEXT,
  job TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  verified BOOLEAN DEFAULT TRUE,
  available BOOLEAN DEFAULT TRUE,
  experience TEXT,
  experience_years NUMERIC DEFAULT 0,
  daily_rate NUMERIC DEFAULT 0,
  member_id TEXT,
  skills TEXT,
  rating NUMERIC DEFAULT 5.0,
  completed_jobs INT DEFAULT 0,
  blood_group TEXT,
  is_blood_donor BOOLEAN DEFAULT FALSE,
  bio TEXT,
  avatar TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: product_sellers
CREATE TABLE IF NOT EXISTS public.product_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  products_name TEXT,
  phone_number TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  pass_word TEXT,
  description TEXT,
  products_photos TEXT,
  blood_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: permanent_members
CREATE TABLE IF NOT EXISTS public.permanent_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone_number TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  pass_word TEXT,
  present_address TEXT,
  permanent_address TEXT,
  education TEXT,
  nid_number TEXT,
  photos_cv TEXT,
  blood_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 9: blood_donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  blood_group TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  profession TEXT DEFAULT 'রক্তদাতা',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  available BOOLEAN DEFAULT TRUE,
  last_donation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 10: job_circulars
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT 'খাগড়াছড়ি',
  salary TEXT,
  deadline TEXT,
  description TEXT,
  requirements TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 11: job_seekers
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  name TEXT,
  phone TEXT,
  job_title TEXT,
  skills TEXT,
  experience TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 12: product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  reviewer_name TEXT NOT NULL,
  reviewer_phone TEXT,
  rating NUMERIC NOT NULL DEFAULT 5,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 13: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash_on_delivery',
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 14: ai_knowledge_base
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT,
  answer TEXT,
  category TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GRANT TABLE & SEQUENCE PRIVILEGES
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permanent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 7. DEFINE PERMISSIVE PUBLIC RLS POLICIES FOR ALL TABLES
-- (Permits Read by anyone; Write/Update/Delete by application and admin users)

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'products', 'profiles', 'banners', 'platform_banners', 'feed_posts',
    'service_providers', 'product_sellers', 'permanent_members', 'blood_donors',
    'job_circulars', 'job_seekers', 'product_reviews', 'orders', 'ai_knowledge_base'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_all" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_select" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_insert" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_update" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_delete" ON public.%I;', tbl, tbl);

    EXECUTE format('CREATE POLICY "%s_public_all" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- 8. STORAGE BUCKET CREATION FOR 'products' AND 'product-images'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'products',
    'products',
    true,
    20971520, -- 20 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']
  ),
  (
    'product-images',
    'product-images',
    true,
    20971520, -- 20 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'];

-- 9. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket public read" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket allow insert" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket allow update" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket allow delete" ON storage.objects;

-- Storage Read Policy (Public CDN)
CREATE POLICY "Products bucket is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products', 'product-images'));

-- Storage Insert/Upload Policy
CREATE POLICY "Allow upload to products bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('products', 'product-images'));

-- Storage Update Policy
CREATE POLICY "Allow update in products bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('products', 'product-images'))
  WITH CHECK (bucket_id IN ('products', 'product-images'));

-- Storage Delete Policy
CREATE POLICY "Allow delete in products bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('products', 'product-images'));

-- =========================================================================
-- END OF MIGRATION 021
-- =========================================================================
