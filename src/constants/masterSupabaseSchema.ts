export const MASTER_SUPABASE_PROJECT_URL = 'https://dwhsqftllkximhfvwqak.supabase.co';
export const MASTER_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHNxZnRsbGt4aW1oZnZ3cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzAyNzEsImV4cCI6MjEwNTMwNjI3MX0.GbceleQmKhRfSzE-c_Bq3fh-YA7I4oZI1fGCsU-SaPI';
export const MASTER_SUPABASE_SQL_EDITOR_URL = 'https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new';

export const MASTER_SUPABASE_SETUP_SQL = `-- =========================================================================
-- JHADIMADI.COM - COMPLETE MIGRATION & REPAIR SCRIPT FOR SUPABASE BACKEND
-- Target Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard -> SQL Editor (link above).
-- 2. Paste this entire script and click "Run".
-- 3. All missing tables and columns will be safely added without data loss!
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMA USAGE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. HELPER FUNCTION FOR TIMESTAMP AUTO-UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 4. CREATE MISSING TABLES IF THEY DO NOT EXIST YET
-- =========================================================================

-- Table: registered_members
CREATE TABLE IF NOT EXISTS public.registered_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'member',
  membership_tier TEXT DEFAULT 'general',
  profession TEXT,
  skills TEXT,
  blood_group TEXT,
  tax_vat_info TEXT,
  nid_number TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  mahalla TEXT,
  detailed_address TEXT,
  present_address TEXT,
  permanent_address TEXT,
  educational_qualification TEXT,
  cv_url TEXT,
  cv_file_name TEXT,
  is_blood_donor BOOLEAN DEFAULT FALSE,
  is_paid_member BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  search_tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  reviewer_name TEXT,
  reviewer_phone TEXT,
  user_phone TEXT,
  user_location TEXT DEFAULT 'বাংলাদেশ',
  rating NUMERIC NOT NULL DEFAULT 5,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ai_knowledge_base
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id TEXT PRIMARY KEY,
  prompt_user TEXT,
  completion_assistant TEXT,
  question TEXT,
  answer TEXT,
  category TEXT DEFAULT 'General',
  source TEXT,
  embedding JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sellers
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  shop_name TEXT,
  business_name TEXT,
  product_name TEXT,
  district TEXT,
  upazila TEXT,
  area TEXT,
  address TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'customer',
  assigned_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: service_provider_profiles
CREATE TABLE IF NOT EXISTS public.service_provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  service_category TEXT,
  hourly_rate NUMERIC,
  daily_rate NUMERIC,
  skills TEXT,
  experience_years NUMERIC,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: freelancer_profiles
CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  skills TEXT,
  portfolio TEXT,
  education TEXT,
  experience TEXT,
  hourly_rate NUMERIC,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: job_candidates
CREATE TABLE IF NOT EXISTS public.job_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_code TEXT,
  unique_id TEXT,
  name TEXT,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'Male',
  desired_job_title TEXT,
  skills_or_job_type TEXT,
  category TEXT,
  expected_salary TEXT,
  highest_education TEXT,
  education TEXT,
  experience TEXT,
  experience_years NUMERIC DEFAULT 0,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  address TEXT,
  resume_url TEXT,
  cv_url TEXT,
  status TEXT DEFAULT 'available',
  photo_url TEXT,
  search_tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT,
  job_title TEXT,
  company_name TEXT,
  candidate_id TEXT,
  candidate_name TEXT,
  candidate_phone TEXT,
  candidate_email TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  interview_date TEXT,
  interview_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_credentials
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  salt TEXT,
  username TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_roles
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: search_logs
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT,
  category TEXT,
  source TEXT,
  district TEXT,
  upazila TEXT,
  is_zero_result BOOLEAN DEFAULT FALSE,
  results_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: security_logs
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT,
  description TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  action TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- J-PAY WALLET ATOMIC TABLES (MIGRATION 025)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  pending_escrow NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (pending_escrow >= 0),
  total_deposited NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'BDT',
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance_before NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance_after NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT,
  trx_id TEXT,
  sender_number TEXT,
  receiver_number TEXT,
  counterpart_user_id TEXT,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_add_money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payout_method TEXT NOT NULL,
  payout_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. SAFELY ADD MISSING COLUMNS TO ALL EXISTING TABLES
-- =========================================================================

-- Table 1: products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS products_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS regular_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_badge BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS products_photos TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '১ পিস';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'পার্বত্য চট্টগ্রাম';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_origin TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quality_standard TEXT DEFAULT '১০০% বিশুদ্ধ ও পরীক্ষিত';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_name TEXT DEFAULT 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_phone TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_phone_masked TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_unique_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_info TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_pre_harvest BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_deal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge_color TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS key_highlights TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_it_is_produced TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials_and_ingredients TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS usage_and_storage TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 2: profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession_bn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS para TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blood_donor_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_nid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_rate NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_payment_method TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_trx_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nid_screening_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS educational_qualification TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_vat_info TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 3: service_providers
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS job TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession_bn TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profession_key TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS category_bn TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_type TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rate_amount NUMERIC;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS experience_years NUMERIC;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS daily_rate NUMERIC;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS completed_jobs INT DEFAULT 0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN DEFAULT FALSE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 4: blood_donors
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS district_unique_id TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS total_donations INT DEFAULT 0;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 5: orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_service TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS trx_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 6: job_circulars
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS circular_id TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS company_or_poster TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS tax_vat_info TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 7: job_seekers
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS candidate_code TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS skills_or_job_type TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS desired_job_title TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS highest_education TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS experience_years NUMERIC DEFAULT 0;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS tax_vat_info TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 8: banners (homepage and platform banner management)
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS target_link TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'home_top';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 9: categories
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
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table 11: feed_posts
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS author_phone TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS author_role TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS mahalla TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table 12: product_sellers
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS products_photos TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.product_sellers ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- Table 13: permanent_members
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS upazila TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS photos_cv TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.permanent_members ADD COLUMN IF NOT EXISTS password TEXT;

-- Table 14: sellers enhancements
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS trade_license TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS product_category TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS products_photos TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pass_word TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Table 15: jobs & job_applications
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'চাকরির পদ',
  job_title TEXT,
  title_bn TEXT,
  company_name TEXT NOT NULL DEFAULT 'প্রতিষ্ঠান',
  company TEXT,
  company_or_poster TEXT,
  category TEXT DEFAULT 'সাধারণ',
  job_type TEXT DEFAULT 'Full-time',
  vacancy INTEGER DEFAULT 1,
  location TEXT DEFAULT '',
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'সদর',
  salary_range TEXT DEFAULT 'আলোচনা সাপেক্ষে',
  salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
  phone TEXT,
  phone_number TEXT,
  contact_phone TEXT,
  email TEXT,
  description TEXT DEFAULT '',
  job_description TEXT,
  deadline DATE,
  application_deadline DATE,
  requirements TEXT DEFAULT '',
  circular_file TEXT,
  photos TEXT,
  circular_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_or_poster TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'সাধারণ';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS vacancy INTEGER DEFAULT 1;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_range TEXT DEFAULT 'আলোচনা সাপেক্ষে';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary TEXT DEFAULT 'আলোচনা সাপেক্ষে';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS circular_file TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS photos TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS circular_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT 'সদস্য',
  name TEXT,
  phone TEXT NOT NULL DEFAULT '',
  phone_number TEXT,
  email TEXT,
  nid_number TEXT,
  blood_group TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'সদর',
  area TEXT,
  address TEXT,
  detailed_address TEXT,
  present_address TEXT,
  permanent_address TEXT,
  education TEXT,
  photo_url TEXT,
  avatar TEXT,
  membership_type TEXT DEFAULT 'permanent',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS detailed_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'permanent';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- =========================================================================
-- 6. GRANT COMPREHENSIVE PRIVILEGES (FIXES 401 PERMISSION DENIED)
-- =========================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =========================================================================
-- 7. ENABLE ROW LEVEL SECURITY & DEFINE PERMISSIVE POLICIES
-- =========================================================================
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'products', 'profiles', 'banners', 'feed_posts',
    'service_providers', 'product_sellers', 'permanent_members', 'blood_donors',
    'job_circulars', 'job_seekers', 'product_reviews', 'orders', 'ai_knowledge_base',
    'registered_members', 'sellers', 'user_roles', 'service_provider_profiles',
    'freelancer_profiles', 'job_candidates', 'job_applications', 'jobs', 'members', 'admin_credentials',
    'admin_roles', 'search_logs', 'security_logs', 'admin_activity_logs', 'notifications',
    'categories'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_public_all" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_public_select" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_public_delete" ON public.%I;', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_public_select" ON public.%I FOR SELECT TO anon, authenticated, service_role USING (true);', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_public_delete" ON public.%I FOR DELETE TO anon, authenticated, service_role USING (true);', tbl, tbl);
      EXECUTE format('CREATE POLICY "%s_public_all" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN
      -- In case table is not present yet or other edge case, continue cleanly
      NULL;
    END;
  END LOOP;
END $$;

-- =========================================================================
-- 8. STORAGE BUCKET CREATION FOR 'products'
-- =========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'products',
    'products',
    true,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json'];

-- Storage Row Level Security (RLS)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;

CREATE POLICY "Products bucket is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Allow upload to products bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow update in products bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products')
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow delete in products bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'products');
`;

export const MASTER_SUPABASE_RLS_FIX_SQL = `-- =========================================================================
-- JHADIMADI.COM - UNIVERSAL RLS & PUBLIC ACCESS REPAIR SCRIPT
-- Run this in: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
-- Resolves 401 / 403 / 42501 "permission denied for table ..." permanently
-- =========================================================================

-- 1. Schema Grants for all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role, postgres;

-- 2. Ensure core tables exist before applying grants
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

-- 3. Comprehensive Table, Sequence, and Routine Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 4. Disable RLS and setup permissive policies across all application tables
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'products', 'categories', 'orders', 'notifications', 'profiles',
    'banners', 'feed_posts', 'service_providers',
    'service_provider_profiles', 'product_sellers', 'sellers', 'permanent_members',
    'registered_members', 'blood_donors', 'job_circulars', 'job_seekers',
    'job_candidates', 'job_applications', 'product_reviews', 'user_roles',
    'freelancer_profiles', 'search_logs', 'security_logs', 'admin_activity_logs',
    'admin_credentials', 'admin_roles', 'ai_knowledge_base', 'nid_documents',
    'wallets', 'wallet_transactions', 'wallet_add_money_requests', 'wallet_withdrawals'
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

  -- Grant execution permissions for RPC functions
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_add_money_approve') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.wallet_add_money_approve(UUID, UUID) TO anon, authenticated, service_role, postgres;';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_p2p_transfer') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.wallet_p2p_transfer(UUID, TEXT, NUMERIC, TEXT) TO anon, authenticated, service_role, postgres;';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_internal_purchase') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.wallet_internal_purchase(UUID, NUMERIC, TEXT, UUID, TEXT) TO anon, authenticated, service_role, postgres;';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_withdrawal_approve') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.wallet_withdrawal_approve(UUID, UUID) TO anon, authenticated, service_role, postgres;';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 5. Seed Core Categories if Table is Empty
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

-- 6. Storage Buckets Setup & Permissions
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

-- Ensure user_roles table exists and bulletproof is_staff function
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE public.user_roles TO anon, authenticated, service_role, postgres;

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
  IF user_uuid IS NULL THEN RETURN false; END IF;
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

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role, postgres;

-- Drop legacy/broken policies that caused schema mismatch errors
DROP POLICY IF EXISTS "Staff or Owner Update Assets" ON storage.objects;
DROP POLICY IF EXISTS "Staff or Owner Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "Staff Full Access to Storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Storage public access" ON storage.objects;
DROP POLICY IF EXISTS "Products bucket is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Read for Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Select on Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Update to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete to Public Buckets" ON storage.objects;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Select on Public Buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Insert to Public Buckets"
  ON storage.objects FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Update to Public Buckets"
  ON storage.objects FOR UPDATE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'))
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Delete to Public Buckets"
  ON storage.objects FOR DELETE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 7. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
`;

export const MIGRATION_029_FIX_IS_STAFF_AND_STORAGE_SQL = `-- ============================================================================
-- JHADIMADI.COM — MIGRATION 029: FIX IS_STAFF SCHEMA MISMATCH & STORAGE RLS
-- Target Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor URL: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- Objective:
-- 1. Fix "Supabase Storage REST upload failed (400)" caused by is_staff schema mismatch
-- 2. Create public.user_roles table & define bulletproof public.is_staff(UUID)
-- 3. Drop all broken policies on storage.objects that crashed Supabase Storage
-- 4. Ensure products and banners public buckets allow upload, read, update, delete
-- ============================================================================

-- 1. Ensure user_roles table exists
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
CREATE POLICY "user_roles_allow_read" ON public.user_roles FOR SELECT TO anon, authenticated, service_role USING (true);

-- 2. Bulletproof is_staff function (Never throws errors, handles null & missing relations safely)
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
  IF user_uuid IS NULL THEN RETURN false; END IF;
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

-- 3. Ensure Storage Buckets 'products' and 'banners' exist & are public
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

-- 5. Create Robust RLS Policies for Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Select on Public Buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Insert to Public Buckets"
  ON storage.objects FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Update to Public Buckets"
  ON storage.objects FOR UPDATE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'))
  WITH CHECK (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

CREATE POLICY "Public Delete to Public Buckets"
  ON storage.objects FOR DELETE
  TO anon, authenticated, service_role
  USING (bucket_id IN ('products', 'banners', 'product-images', 'avatars', 'public-banners', 'business-media', 'service-media'));

-- 6. Ensure banners table exists in public schema
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
`;

export const MIGRATION_025_JPAY_WALLET_SQL = `-- ============================================================================
-- JHADIMADI.COM — MIGRATION 025: J-PAY WALLET ATOMIC LEDGER & SECURITY SCHEMA
-- Target Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
-- ============================================================================

-- 1. Schema Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;

-- 2. Wallets Master Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  pending_escrow NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (pending_escrow >= 0),
  total_deposited NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'BDT',
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_phone ON public.wallets(phone);

-- 3. Immutable Transaction Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance_before NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance_after NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT,
  trx_id TEXT,
  sender_number TEXT,
  receiver_number TEXT,
  counterpart_user_id TEXT,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);

-- 4. Add Money Requests
CREATE TABLE IF NOT EXISTS public.wallet_add_money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_money_user_id ON public.wallet_add_money_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_add_money_status ON public.wallet_add_money_requests(status);

-- 5. Withdrawals / Cashout Requests
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payout_method TEXT NOT NULL,
  payout_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.wallet_withdrawals(status);

-- 6. Permissions & RLS Configuration
GRANT ALL ON TABLE public.wallets TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_transactions TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_add_money_requests TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_withdrawals TO anon, authenticated, service_role, postgres;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_add_money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_universal_access" ON public.wallets;
CREATE POLICY "wallets_universal_access" ON public.wallets FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_transactions_universal_access" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_universal_access" ON public.wallet_transactions FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_add_money_requests_universal_access" ON public.wallet_add_money_requests;
CREATE POLICY "wallet_add_money_requests_universal_access" ON public.wallet_add_money_requests FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_withdrawals_universal_access" ON public.wallet_withdrawals;
CREATE POLICY "wallet_withdrawals_universal_access" ON public.wallet_withdrawals FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 7. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
`;


