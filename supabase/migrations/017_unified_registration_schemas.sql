-- =========================================================================
-- JHADIMADI.COM - MIGRATION 017: UNIFIED REGISTRATION SCHEMAS ALIGNMENT
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
--
-- Guarantees exact database table schemas and column names for the 7 tables:
--   1. service_providers
--   2. profiles
--   3. products
--   4. product_sellers
--   5. permanent_members
--   6. job_seekers
--   7. job_circulars
-- =========================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 1. TABLE: service_providers
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  service_type TEXT,
  phone TEXT,
  location TEXT,
  display_name TEXT,
  profession_key TEXT,
  category_bn TEXT,
  rate_type TEXT DEFAULT 'Daily',
  rate_amount NUMERIC DEFAULT 600,
  skills TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on service_providers
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession_key TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS category_bn TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT 'Daily';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_amount NUMERIC DEFAULT 600;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- 2. TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone TEXT,
  address TEXT,
  category TEXT,
  unique_id TEXT UNIQUE,
  name TEXT,
  profession TEXT,
  blood_group TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  member_type TEXT DEFAULT 'general_user',
  photo_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  mahalla TEXT,
  detailed_address TEXT,
  is_blood_donor BOOLEAN DEFAULT FALSE,
  is_blood_donor_available BOOLEAN DEFAULT TRUE,
  last_donation_date TEXT,
  is_nid_verified BOOLEAN DEFAULT FALSE,
  is_paid_member BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'general_user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS detailed_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_nid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid_member BOOLEAN DEFAULT FALSE;

-- 3. TABLE: products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  products_name TEXT,
  products_photos TEXT,
  regular_price NUMERIC DEFAULT 0,
  discount_price NUMERIC,
  discount_badge TEXT,
  short_description TEXT,
  description TEXT,
  sku TEXT,
  category TEXT DEFAULT 'পাহাড়ি ও সাধারণ পণ্য',
  unit TEXT DEFAULT 'পিস',
  origin TEXT,
  quality_standard TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  seller_name TEXT,
  product_reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS products_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS products_photos TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS regular_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'পাহাড়ি ও সাধারণ পণ্য';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'পিস';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quality_standard TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_reviews JSONB DEFAULT '[]'::jsonb;

-- 4. TABLE: product_sellers
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on product_sellers
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS products_name TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS products_photos TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- 5. TABLE: permanent_members
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on permanent_members
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS photos_cv TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- 6. TABLE: job_seekers
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone_number TEXT,
  desired_post TEXT,
  gender TEXT,
  present_address TEXT,
  permanent_address TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  education TEXT,
  work_experience TEXT,
  special_skills TEXT,
  expected_salary TEXT,
  photos_cv TEXT,
  personal_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on job_seekers
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS desired_post TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS work_experience TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS special_skills TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS photos_cv TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS personal_note TEXT;

-- 7. TABLE: job_circulars
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT,
  company_name TEXT,
  job_type TEXT,
  category TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  basic_salary TEXT,
  application_deadline TEXT,
  phone_number TEXT,
  email_website TEXT,
  circular_file TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on job_circulars
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS basic_salary TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS application_deadline TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS email_website TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS circular_file TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS description TEXT;

-- RLS & Grants for all 7 tables
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permanent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;

-- Allow public insert & read
DO $$
BEGIN
  -- service_providers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_providers' AND policyname = 'service_providers_public_insert') THEN
    CREATE POLICY "service_providers_public_insert" ON public.service_providers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_providers' AND policyname = 'service_providers_public_select') THEN
    CREATE POLICY "service_providers_public_select" ON public.service_providers FOR SELECT USING (true);
  END IF;

  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_public_insert') THEN
    CREATE POLICY "profiles_public_insert" ON public.profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_public_select') THEN
    CREATE POLICY "profiles_public_select" ON public.profiles FOR SELECT USING (true);
  END IF;

  -- products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_public_insert') THEN
    CREATE POLICY "products_public_insert" ON public.products FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_public_select') THEN
    CREATE POLICY "products_public_select" ON public.products FOR SELECT USING (true);
  END IF;

  -- product_sellers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_sellers' AND policyname = 'product_sellers_public_insert') THEN
    CREATE POLICY "product_sellers_public_insert" ON public.product_sellers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_sellers' AND policyname = 'product_sellers_public_select') THEN
    CREATE POLICY "product_sellers_public_select" ON public.product_sellers FOR SELECT USING (true);
  END IF;

  -- permanent_members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permanent_members' AND policyname = 'permanent_members_public_insert') THEN
    CREATE POLICY "permanent_members_public_insert" ON public.permanent_members FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permanent_members' AND policyname = 'permanent_members_public_select') THEN
    CREATE POLICY "permanent_members_public_select" ON public.permanent_members FOR SELECT USING (true);
  END IF;

  -- job_seekers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_seekers' AND policyname = 'job_seekers_public_insert') THEN
    CREATE POLICY "job_seekers_public_insert" ON public.job_seekers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_seekers' AND policyname = 'job_seekers_public_select') THEN
    CREATE POLICY "job_seekers_public_select" ON public.job_seekers FOR SELECT USING (true);
  END IF;

  -- job_circulars
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_circulars' AND policyname = 'job_circulars_public_insert') THEN
    CREATE POLICY "job_circulars_public_insert" ON public.job_circulars FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_circulars' AND policyname = 'job_circulars_public_select') THEN
    CREATE POLICY "job_circulars_public_select" ON public.job_circulars FOR SELECT USING (true);
  END IF;
END $$;

GRANT ALL ON public.service_providers TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.product_sellers TO anon, authenticated, service_role;
GRANT ALL ON public.permanent_members TO anon, authenticated, service_role;
GRANT ALL ON public.job_seekers TO anon, authenticated, service_role;
GRANT ALL ON public.job_circulars TO anon, authenticated, service_role;
