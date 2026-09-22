-- =========================================================================
-- JHADIMADI.COM - MIGRATION 014: COMPLETE PUBLIC ACCESS & MISSING TABLES FIX
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
--
-- Initializes & guarantees the 6 required core tables:
--   1. profiles          (General user & partner accounts)
--   2. products          (Product seller listings & marketplace inventory)
--   3. service_providers (Doctors, electricians, technicians & workers)
--   4. blood_donors      (Blood donor registry & blood groups)
--   5. job_seekers       (Candidate profiles & CV bio-data)
--   6. job_circulars     (Job circular postings & employment opportunities)
--
-- Applies 'ALLOW ALL' / Public Access RLS policies (SELECT, INSERT, UPDATE, DELETE)
-- Grants full privileges to 'anon', 'authenticated', and 'service_role' so public
-- registration forms and deep search engines can read and write without 42501 errors.
-- =========================================================================

-- 0. Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- =========================================================================
-- 1. TABLE: profiles (General User Accounts & Registered Members)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  profession TEXT,
  category TEXT,
  blood_group TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'খাগড়াছড়ি',
  upazila TEXT NOT NULL DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  mahalla TEXT,
  address TEXT,
  detailed_address TEXT,
  member_type TEXT DEFAULT 'general_user',
  role TEXT DEFAULT 'customer',
  photo_url TEXT,
  avatar_url TEXT,
  is_blood_donor BOOLEAN DEFAULT FALSE,
  is_blood_donor_available BOOLEAN DEFAULT TRUE,
  last_donation_date TEXT,
  is_nid_verified BOOLEAN DEFAULT FALSE,
  is_paid_member BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS detailed_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'general_user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_nid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid_member BOOLEAN DEFAULT FALSE;

-- =========================================================================
-- 2. TABLE: products (Product Seller Listings)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID,
  seller_name TEXT,
  seller_phone TEXT,
  name_bn TEXT NOT NULL,
  title TEXT,
  name_en TEXT,
  category TEXT NOT NULL DEFAULT 'অন্যান্য পাহাড়ি বা স্থানীয় সামগ্রী',
  price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'কেজি',
  stock INT NOT NULL DEFAULT 1,
  image_url TEXT,
  image TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  origin TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  is_organic BOOLEAN NOT NULL DEFAULT TRUE,
  is_pre_harvest BOOLEAN NOT NULL DEFAULT FALSE,
  harvest_date DATE,
  description_bn TEXT,
  description TEXT,
  description_en TEXT,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  reviews_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_phone TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'অন্যান্য পাহাড়ি বা স্থানীয় সামগ্রী';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'কেজি';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_pre_harvest BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS harvest_date DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;

-- =========================================================================
-- 2B. TABLE: sellers (Product Sellers & Merchants)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  unique_id TEXT UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  shop_name TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  address TEXT,
  description TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. TABLE: service_providers (Doctors, Electricians, Workers & Technicians)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  unique_code TEXT,
  unique_id TEXT,
  display_name TEXT NOT NULL,
  full_name TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar TEXT,
  profession_key TEXT NOT NULL DEFAULT 'সার্ভিস প্রোভাইডার',
  profession TEXT,
  category_bn TEXT NOT NULL DEFAULT 'সার্ভিস প্রোভাইডার',
  category_en TEXT,
  sub_category TEXT,
  rate_type TEXT NOT NULL DEFAULT 'Daily',
  rate_amount NUMERIC NOT NULL DEFAULT 0,
  daily_rate TEXT,
  bio_bn TEXT,
  bio_en TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  skills_details TEXT,
  experience_years NUMERIC DEFAULT 1,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  jobs_completed INT NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'খাগড়াছড়ি',
  upazila TEXT NOT NULL DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  mahalla TEXT,
  blood_group TEXT,
  service_details JSONB DEFAULT '{}',
  tax_vat_info TEXT,
  certificate_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  blue_tick_active BOOLEAN NOT NULL DEFAULT FALSE,
  search_tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession_key TEXT DEFAULT 'সার্ভিস প্রোভাইডার';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS category_bn TEXT DEFAULT 'সার্ভিস প্রোভাইডার';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS category_en TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT 'Daily';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_amount NUMERIC DEFAULT 0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS daily_rate TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS bio_bn TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS bio_en TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS skills_details TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS experience_years NUMERIC DEFAULT 1;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS jobs_completed INT DEFAULT 0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS service_details JSONB DEFAULT '{}';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS tax_vat_info TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS blue_tick_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- Remove any restrictive NOT NULL constraint on user_id if present
ALTER TABLE public.service_providers ALTER COLUMN user_id DROP NOT NULL;

-- =========================================================================
-- 4. TABLE: blood_donors (Blood Donor Information & Blood Groups)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  blood_group TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  profession TEXT DEFAULT 'রক্তদাতা',
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'খাগড়াছড়ি',
  upazila TEXT NOT NULL DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  mahalla TEXT,
  last_donation_date TEXT,
  total_donations INT NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_contact TEXT,
  age INT DEFAULT 25,
  tax_vat_info TEXT,
  search_tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'রক্তদাতা';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS total_donations INT DEFAULT 1;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS age INT DEFAULT 25;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS tax_vat_info TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- =========================================================================
-- 5. TABLE: job_seekers (Candidate Profiles & CV Resume Database)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  candidate_code TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'Male',
  desired_job_title TEXT,
  skills_or_job_type TEXT,
  category TEXT DEFAULT 'সাধারণ',
  expected_salary TEXT,
  experience_years TEXT DEFAULT '১ বছর',
  experience TEXT DEFAULT '১ বছর',
  highest_education TEXT,
  education TEXT,
  skills TEXT[] DEFAULT '{}',
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'বাংলাদেশ',
  upazila TEXT,
  area TEXT,
  address TEXT,
  bio TEXT,
  photo_url TEXT,
  resume_url TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS candidate_code TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS desired_job_title TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS skills_or_job_type TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'সাধারণ';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS experience_years TEXT DEFAULT '১ বছর';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '১ বছর';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS highest_education TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'বাংলাদেশ';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS upazila TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- =========================================================================
-- 6. TABLE: job_circulars (Job Circular Listings & Postings)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'নিয়োগ বিজ্ঞপ্তি',
  job_title TEXT,
  company_name TEXT,
  company_or_poster TEXT,
  category TEXT NOT NULL DEFAULT 'সাধারণ',
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  salary TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'বাংলাদেশ',
  upazila TEXT,
  area TEXT,
  vacancies_count INT DEFAULT 1,
  education TEXT,
  experience TEXT,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  deadline TEXT,
  contact_phone TEXT,
  phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  submission_type TEXT DEFAULT 'detailed',
  circular_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on existing table
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'নিয়োগ বিজ্ঞপ্তি';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS company_or_poster TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'সাধারণ';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'বাংলাদেশ';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS upazila TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS vacancies_count INT DEFAULT 1;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'detailed';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS circular_url TEXT;

-- =========================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES (ALLOW ALL / PUBLIC ACCESS)
-- Enables Public SELECT, INSERT, UPDATE, and DELETE operations for all 6 tables
-- =========================================================================

-- Enable RLS on all 6 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- Clean up all existing restrictive policies
-- -------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "Public full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON public.profiles;

-- products
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
DROP POLICY IF EXISTS "Public view products" ON public.products;
DROP POLICY IF EXISTS "products_select_public_seller" ON public.products;
DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
DROP POLICY IF EXISTS "Sellers manage own products" ON public.products;
DROP POLICY IF EXISTS "products_update_seller_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_seller_admin" ON public.products;
DROP POLICY IF EXISTS "Allow public select products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- service_providers
DROP POLICY IF EXISTS "Public full access to service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Public view active providers" ON public.service_providers;
DROP POLICY IF EXISTS "providers_select_public" ON public.service_providers;
DROP POLICY IF EXISTS "providers_insert_owner" ON public.service_providers;
DROP POLICY IF EXISTS "Providers manage own profile" ON public.service_providers;
DROP POLICY IF EXISTS "providers_update_owner_admin" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public select service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public insert service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public update service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public delete service_providers" ON public.service_providers;

-- blood_donors
DROP POLICY IF EXISTS "Public full access to blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Public can view blood donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor inserts" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor updates" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor deletes" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public select blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public insert blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public update blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public delete blood_donors" ON public.blood_donors;

-- job_seekers
DROP POLICY IF EXISTS "Public full access to job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Public can view job seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker inserts" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker updates" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker deletes" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public select job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public insert job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public update job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public delete job_seekers" ON public.job_seekers;

-- job_circulars
DROP POLICY IF EXISTS "Public full access to job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Public can view job circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular inserts" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular updates" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular deletes" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public select job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public insert job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public update job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public delete job_circulars" ON public.job_circulars;

-- -------------------------------------------------------------------------
-- CREATE COMPREHENSIVE 'ALLOW ALL' POLICIES (FOR ALL, SELECT, INSERT, UPDATE, DELETE)
-- -------------------------------------------------------------------------

-- 1. profiles
CREATE POLICY "Public full access to profiles"
  ON public.profiles FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 2. products
CREATE POLICY "Public full access to products"
  ON public.products FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 2B. sellers
CREATE POLICY "Public full access to sellers"
  ON public.sellers FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 3. service_providers
CREATE POLICY "Public full access to service_providers"
  ON public.service_providers FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. blood_donors
CREATE POLICY "Public full access to blood_donors"
  ON public.blood_donors FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. job_seekers
CREATE POLICY "Public full access to job_seekers"
  ON public.job_seekers FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 6. job_circulars
CREATE POLICY "Public full access to job_circulars"
  ON public.job_circulars FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =========================================================================
-- SECTION 8: GRANT FULL PRIVILEGES TO anon, authenticated, AND service_role
-- Eliminates error 42501 (permission denied for table ...)
-- =========================================================================
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sellers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.service_providers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.blood_donors TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_seekers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_circulars TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Future table defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =========================================================================
-- SECTION 9: HIGH-PERFORMANCE TRGM INDEXES (SUB-SECOND SEARCH ENGINE ACCELERATION)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON public.profiles(district, upazila);

CREATE INDEX IF NOT EXISTS idx_products_name_bn_trgm ON public.products USING gin (name_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(district, upazila);

CREATE INDEX IF NOT EXISTS idx_service_providers_name_trgm ON public.service_providers USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_profession ON public.service_providers(profession_key);
CREATE INDEX IF NOT EXISTS idx_service_providers_location ON public.service_providers(district, upazila);

CREATE INDEX IF NOT EXISTS idx_blood_donors_name_trgm ON public.blood_donors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_blood_donors_group_location ON public.blood_donors(blood_group, district, upazila);

CREATE INDEX IF NOT EXISTS idx_job_seekers_name_trgm ON public.job_seekers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_skills_trgm ON public.job_seekers USING gin (skills_or_job_type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_location ON public.job_seekers(district, upazila);

CREATE INDEX IF NOT EXISTS idx_job_circulars_title_trgm ON public.job_circulars USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_circulars_location ON public.job_circulars(district, upazila);
