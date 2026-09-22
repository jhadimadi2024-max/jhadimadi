-- =========================================================================
-- JHADIMADI.COM - MIGRATION 018: PUBLIC RLS POLICIES & GRANTS FOR ALL TABLES
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
--
-- This migration grants full public SELECT, INSERT, and UPDATE permissions
-- to the 'anon' and 'authenticated' roles across all 11 application tables:
--   1. banners
--   2. platform_banners
--   3. feed_posts
--   4. products
--   5. service_providers
--   6. profiles
--   7. product_sellers
--   8. permanent_members
--   9. job_seekers
--  10. job_circulars
--  11. blood_donors
--
-- Execute this entire script once in the Supabase SQL Editor.
-- =========================================================================

-- 1. Grant schema usage to public roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Ensure all tables exist (idempotent creation if not already present)
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

CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  blood_group TEXT,
  phone TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Grant table permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.platform_banners TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.feed_posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.service_providers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_sellers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.permanent_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_seekers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_circulars TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.blood_donors TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permanent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing conflicting policies and establish public access policies

-- banners
DROP POLICY IF EXISTS "banners_public_all" ON public.banners;
DROP POLICY IF EXISTS "banners_public_select" ON public.banners;
DROP POLICY IF EXISTS "banners_public_insert" ON public.banners;
CREATE POLICY "banners_public_all" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- platform_banners
DROP POLICY IF EXISTS "platform_banners_public_all" ON public.platform_banners;
DROP POLICY IF EXISTS "platform_banners_public_select" ON public.platform_banners;
DROP POLICY IF EXISTS "platform_banners_public_insert" ON public.platform_banners;
CREATE POLICY "platform_banners_public_all" ON public.platform_banners FOR ALL USING (true) WITH CHECK (true);

-- feed_posts
DROP POLICY IF EXISTS "feed_posts_public_all" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_public_select" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_public_insert" ON public.feed_posts;
CREATE POLICY "feed_posts_public_all" ON public.feed_posts FOR ALL USING (true) WITH CHECK (true);

-- products
DROP POLICY IF EXISTS "products_public_all" ON public.products;
DROP POLICY IF EXISTS "products_public_select" ON public.products;
DROP POLICY IF EXISTS "products_public_insert" ON public.products;
CREATE POLICY "products_public_all" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- service_providers
DROP POLICY IF EXISTS "service_providers_public_all" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_select" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_insert" ON public.service_providers;
CREATE POLICY "service_providers_public_all" ON public.service_providers FOR ALL USING (true) WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "profiles_public_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_insert" ON public.profiles;
CREATE POLICY "profiles_public_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- product_sellers
DROP POLICY IF EXISTS "product_sellers_public_all" ON public.product_sellers;
DROP POLICY IF EXISTS "product_sellers_public_select" ON public.product_sellers;
DROP POLICY IF EXISTS "product_sellers_public_insert" ON public.product_sellers;
CREATE POLICY "product_sellers_public_all" ON public.product_sellers FOR ALL USING (true) WITH CHECK (true);

-- permanent_members
DROP POLICY IF EXISTS "permanent_members_public_all" ON public.permanent_members;
DROP POLICY IF EXISTS "permanent_members_public_select" ON public.permanent_members;
DROP POLICY IF EXISTS "permanent_members_public_insert" ON public.permanent_members;
CREATE POLICY "permanent_members_public_all" ON public.permanent_members FOR ALL USING (true) WITH CHECK (true);

-- job_seekers
DROP POLICY IF EXISTS "job_seekers_public_all" ON public.job_seekers;
DROP POLICY IF EXISTS "job_seekers_public_select" ON public.job_seekers;
DROP POLICY IF EXISTS "job_seekers_public_insert" ON public.job_seekers;
CREATE POLICY "job_seekers_public_all" ON public.job_seekers FOR ALL USING (true) WITH CHECK (true);

-- job_circulars
DROP POLICY IF EXISTS "job_circulars_public_all" ON public.job_circulars;
DROP POLICY IF EXISTS "job_circulars_public_select" ON public.job_circulars;
DROP POLICY IF EXISTS "job_circulars_public_insert" ON public.job_circulars;
CREATE POLICY "job_circulars_public_all" ON public.job_circulars FOR ALL USING (true) WITH CHECK (true);

-- blood_donors
DROP POLICY IF EXISTS "blood_donors_public_all" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_public_select" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_public_insert" ON public.blood_donors;
CREATE POLICY "blood_donors_public_all" ON public.blood_donors FOR ALL USING (true) WITH CHECK (true);
