-- ============================================================================
-- JHADIMADI.COM — UNIFIED MASTER SUPABASE DATABASE SCHEMA & MIGRATION SCRIPT
-- Generated: 2026-09-19
-- Complete 100% Zero-Loss Schema for all Forms, Entities, and Cloud Storage
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMA USAGE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. TIMESTAMP HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TABLE DEFINITIONS (CREATE IF NOT EXISTS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Products Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'পণ্য',
    products_name TEXT,
    name_bn TEXT,
    products_name_en TEXT,
    name_en TEXT,
    title TEXT,
    title_bn TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    regular_price NUMERIC DEFAULT 0,
    discount_price NUMERIC DEFAULT 0,
    discount_badge TEXT DEFAULT '',
    unit TEXT DEFAULT '১ পিস',
    origin TEXT DEFAULT 'খাগড়াছড়ি',
    category TEXT NOT NULL DEFAULT 'অন্যান্য',
    category_bn TEXT,
    description TEXT DEFAULT '',
    description_bn TEXT,
    short_description TEXT DEFAULT '',
    image_url TEXT,
    products_photos TEXT,
    image TEXT,
    photo TEXT,
    stock_quantity INTEGER DEFAULT 1,
    stock INTEGER DEFAULT 1,
    stock_status TEXT DEFAULT 'in_stock',
    seller_name TEXT DEFAULT 'ঝাদিমাদি মার্চেন্ট',
    seller_phone TEXT,
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    badges JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    key_highlights JSONB DEFAULT '[]'::jsonb,
    production_process TEXT,
    ingredients TEXT,
    usage_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all product columns exist if table already existed
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS products_name TEXT,
ADD COLUMN IF NOT EXISTS name_bn TEXT,
ADD COLUMN IF NOT EXISTS products_name_en TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS title_bn TEXT,
ADD COLUMN IF NOT EXISTS regular_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_badge TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '১ পিস',
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS category_bn TEXT,
ADD COLUMN IF NOT EXISTS description_bn TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS products_photos TEXT,
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock',
ADD COLUMN IF NOT EXISTS seller_name TEXT DEFAULT 'ঝাদিমাদি মার্চেন্ট',
ADD COLUMN IF NOT EXISTS seller_phone TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS key_highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS production_process TEXT,
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS usage_instructions TEXT;

-- ----------------------------------------------------------------------------
-- Sellers Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL DEFAULT 'বিক্রেতা',
    name TEXT,
    shop_name TEXT,
    business_name TEXT,
    owner_name TEXT,
    product_name TEXT,
    phone TEXT NOT NULL DEFAULT '',
    phone_number TEXT,
    email TEXT,
    address TEXT,
    detailed_address TEXT,
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    area TEXT,
    mahalla TEXT,
    nid_number TEXT,
    trade_license TEXT,
    product_category TEXT DEFAULT 'Food',
    business_category TEXT DEFAULT 'food_grocery',
    description TEXT DEFAULT '',
    image_url TEXT,
    products_photos TEXT,
    shop_banner_url TEXT,
    pass_word TEXT,
    password TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.sellers
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS shop_name TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS detailed_address TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS mahalla TEXT,
ADD COLUMN IF NOT EXISTS nid_number TEXT,
ADD COLUMN IF NOT EXISTS trade_license TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT DEFAULT 'Food',
ADD COLUMN IF NOT EXISTS business_category TEXT DEFAULT 'food_grocery',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS products_photos TEXT,
ADD COLUMN IF NOT EXISTS shop_banner_url TEXT,
ADD COLUMN IF NOT EXISTS pass_word TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- ----------------------------------------------------------------------------
-- Product Sellers Table (Alternate schema table for sellers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    products_name TEXT,
    product_name TEXT,
    phone_number TEXT NOT NULL DEFAULT '',
    phone TEXT,
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    pass_word TEXT,
    password TEXT,
    products_photos TEXT,
    image_url TEXT,
    description TEXT,
    blood_group TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.product_sellers
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS pass_word TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS products_photos TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- ----------------------------------------------------------------------------
-- Service Providers Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'কারিগর',
    full_name TEXT,
    display_name TEXT,
    service_type TEXT NOT NULL DEFAULT 'পেশাজীবী সেবাদাতা',
    profession TEXT,
    profession_key TEXT,
    category_bn TEXT,
    phone TEXT NOT NULL DEFAULT '',
    phone_number TEXT,
    email TEXT,
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    area TEXT,
    mahalla TEXT,
    address TEXT,
    detailed_address TEXT,
    experience_years TEXT DEFAULT '৩',
    experience TEXT,
    rate_amount NUMERIC DEFAULT 600,
    rate_type TEXT DEFAULT 'দৈনিক',
    daily_wage TEXT DEFAULT '৬০০',
    rate TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    skills_or_job_type TEXT,
    skills_details TEXT,
    bio TEXT DEFAULT '',
    bio_text TEXT,
    service_description TEXT,
    blood_group TEXT DEFAULT 'O+',
    avatar_url TEXT,
    photo_url TEXT,
    profile_pic TEXT,
    service_provider_photo_url TEXT,
    nid_number TEXT,
    is_nid_verified BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.service_providers
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS profession_key TEXT,
ADD COLUMN IF NOT EXISTS category_bn TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS mahalla TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS detailed_address TEXT,
ADD COLUMN IF NOT EXISTS experience_years TEXT DEFAULT '৩',
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS rate_amount NUMERIC DEFAULT 600,
ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT 'দৈনিক',
ADD COLUMN IF NOT EXISTS daily_wage TEXT DEFAULT '৬০০',
ADD COLUMN IF NOT EXISTS rate TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills_or_job_type TEXT,
ADD COLUMN IF NOT EXISTS skills_details TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bio_text TEXT,
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'O+',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_pic TEXT,
ADD COLUMN IF NOT EXISTS service_provider_photo_url TEXT,
ADD COLUMN IF NOT EXISTS nid_number TEXT,
ADD COLUMN IF NOT EXISTS is_nid_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ----------------------------------------------------------------------------
-- Jobs Table
-- ----------------------------------------------------------------------------
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
    basic_salary TEXT,
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
    submission_type TEXT DEFAULT 'form',
    employer_id TEXT,
    employer_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS title_bn TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS company_or_poster TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'সাধারণ',
ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS vacancy INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS salary_range TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS basic_salary TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS requirements TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS circular_file TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT,
ADD COLUMN IF NOT EXISTS circular_url TEXT,
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'form',
ADD COLUMN IF NOT EXISTS employer_id TEXT,
ADD COLUMN IF NOT EXISTS employer_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ----------------------------------------------------------------------------
-- Job Circulars Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_circulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT 'চাকরির সার্কুলার',
    job_title TEXT,
    company TEXT DEFAULT 'প্রতিষ্ঠান',
    company_name TEXT,
    company_or_poster TEXT,
    description TEXT DEFAULT '',
    job_description TEXT,
    category TEXT DEFAULT 'সাধারণ',
    job_type TEXT DEFAULT 'Full-time',
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    phone TEXT,
    phone_number TEXT,
    contact_phone TEXT,
    salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
    salary_range TEXT DEFAULT 'আলোচনা সাপেক্ষে',
    deadline DATE,
    application_deadline DATE,
    requirements TEXT,
    circular_file TEXT,
    photos TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.job_circulars
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'চাকরির সার্কুলার',
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'প্রতিষ্ঠান',
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_or_poster TEXT,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'সাধারণ',
ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS salary_range TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS circular_file TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ----------------------------------------------------------------------------
-- Job Seekers Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_seekers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'চাকরিপ্রার্থী',
    full_name TEXT,
    candidate_code TEXT,
    unique_id TEXT,
    phone TEXT NOT NULL DEFAULT '',
    phone_number TEXT,
    email TEXT,
    skills_or_job_type TEXT DEFAULT 'সাধারণ কর্মী',
    desired_job_title TEXT,
    desired_post TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    highest_education TEXT DEFAULT 'স্নাতক (Bachelor)',
    education TEXT DEFAULT 'স্নাতক (Bachelor)',
    experience TEXT DEFAULT '১-২ বছর',
    experience_years TEXT,
    gender TEXT DEFAULT 'পুরুষ',
    division TEXT DEFAULT 'চট্টগ্রাম',
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    area TEXT,
    mahalla TEXT,
    selary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
    expected_salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
    photo_url TEXT,
    photo TEXT,
    cv_url TEXT,
    resume_url TEXT,
    photos_cv TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.job_seekers
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS candidate_code TEXT,
ADD COLUMN IF NOT EXISTS unique_id TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS skills_or_job_type TEXT DEFAULT 'সাধারণ কর্মী',
ADD COLUMN IF NOT EXISTS desired_job_title TEXT,
ADD COLUMN IF NOT EXISTS desired_post TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS highest_education TEXT DEFAULT 'স্নাতক (Bachelor)',
ADD COLUMN IF NOT EXISTS education TEXT DEFAULT 'স্নাতক (Bachelor)',
ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '১-২ বছর',
ADD COLUMN IF NOT EXISTS experience_years TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'পুরুষ',
ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম',
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS mahalla TEXT,
ADD COLUMN IF NOT EXISTS selary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS expected_salary TEXT DEFAULT 'আলোচনা সাপেক্ষে',
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS photos_cv TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- ----------------------------------------------------------------------------
-- Job Applications Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT,
    candidate_id TEXT,
    applicant_name TEXT NOT NULL DEFAULT 'আবেদনকারী',
    job_title TEXT,
    company_name TEXT,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    experience_summary TEXT,
    status TEXT DEFAULT 'applied',
    interview_note TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.job_applications
ADD COLUMN IF NOT EXISTS candidate_id TEXT,
ADD COLUMN IF NOT EXISTS applicant_name TEXT DEFAULT 'আবেদনকারী',
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS experience_summary TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'applied',
ADD COLUMN IF NOT EXISTS interview_note TEXT,
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- Members Table
-- ----------------------------------------------------------------------------
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

ALTER TABLE IF EXISTS public.members
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS nid_number TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS detailed_address TEXT,
ADD COLUMN IF NOT EXISTS present_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'permanent',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ----------------------------------------------------------------------------
-- Permanent Members Table (Form-specific legacy table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permanent_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'স্থায়ী সদস্য',
    phone_number TEXT NOT NULL DEFAULT '',
    phone TEXT,
    blood_group TEXT,
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    present_address TEXT,
    permanent_address TEXT,
    education TEXT,
    nid_number TEXT,
    photos_cv TEXT,
    photo_url TEXT,
    pass_word TEXT,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.permanent_members
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি',
ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'সদর',
ADD COLUMN IF NOT EXISTS present_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS nid_number TEXT,
ADD COLUMN IF NOT EXISTS photos_cv TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS pass_word TEXT,
ADD COLUMN IF NOT EXISTS password TEXT;

-- ----------------------------------------------------------------------------
-- Registered Members Table
-- ----------------------------------------------------------------------------
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
    is_blood_donor BOOLEAN DEFAULT FALSE,
    is_paid_member BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Blood Donors Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'স্বেচ্ছাসেবী রক্তদাতা',
    full_name TEXT,
    blood_group TEXT NOT NULL DEFAULT 'O+',
    phone TEXT NOT NULL DEFAULT '',
    phone_number TEXT,
    district TEXT NOT NULL DEFAULT 'খাগড়াছড়ি',
    upazila TEXT NOT NULL DEFAULT 'সদর',
    division TEXT DEFAULT 'চট্টগ্রাম',
    area TEXT DEFAULT 'সদর এলাকা',
    mahalla TEXT,
    pass_word TEXT DEFAULT '123456',
    password TEXT DEFAULT '123456',
    is_available BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE,
    profession TEXT DEFAULT 'রক্তদাতা',
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 1,
    unique_id TEXT,
    verified BOOLEAN DEFAULT TRUE,
    is_nid_verified BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.blood_donors
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম',
ADD COLUMN IF NOT EXISTS area TEXT DEFAULT 'সদর এলাকা',
ADD COLUMN IF NOT EXISTS mahalla TEXT,
ADD COLUMN IF NOT EXISTS pass_word TEXT DEFAULT '123456',
ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456',
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'রক্তদাতা',
ADD COLUMN IF NOT EXISTS last_donation_date DATE,
ADD COLUMN IF NOT EXISTS total_donations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unique_id TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_nid_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ----------------------------------------------------------------------------
-- Banners & Platform Banners Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '',
    alt_text TEXT,
    subtitle TEXT DEFAULT '',
    tag TEXT DEFAULT 'স্পেশাল অফার',
    image_url TEXT NOT NULL DEFAULT '',
    target_link TEXT DEFAULT 'auto_directory',
    action_url TEXT DEFAULT 'auto_directory',
    position TEXT DEFAULT 'homepage_hero',
    placement TEXT DEFAULT 'homepage_hero',
    "order" INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.banners
ADD COLUMN IF NOT EXISTS alt_text TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'স্পেশাল অফার',
ADD COLUMN IF NOT EXISTS target_link TEXT DEFAULT 'auto_directory',
ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT 'auto_directory',
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'homepage_hero',
ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'homepage_hero',
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.platform_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '',
    alt_text TEXT,
    subtitle TEXT DEFAULT '',
    tag TEXT DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    target_link TEXT DEFAULT 'auto_directory',
    action_url TEXT DEFAULT 'auto_directory',
    position TEXT DEFAULT 'homepage_hero',
    placement TEXT DEFAULT 'homepage_hero',
    "order" INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id TEXT,
    full_name TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    member_type TEXT DEFAULT 'user',
    profession TEXT,
    blood_group TEXT,
    division TEXT DEFAULT 'চট্টগ্রাম',
    district TEXT DEFAULT 'খাগড়াছড়ি',
    upazila TEXT DEFAULT 'সদর',
    area TEXT,
    mahalla TEXT,
    detailed_address TEXT,
    avatar TEXT,
    avatar_url TEXT,
    photo_url TEXT,
    nid_number TEXT,
    is_nid_verified BOOLEAN DEFAULT FALSE,
    is_blood_donor BOOLEAN DEFAULT FALSE,
    is_blood_donor_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Grant full table permissions to anon, authenticated, service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for any future tables created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Enable RLS and add fully permissive public policies for app entities
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'products', 'sellers', 'product_sellers', 'service_providers', 
        'jobs', 'job_circulars', 'job_seekers', 'job_applications', 
        'members', 'permanent_members', 'registered_members', 
        'blood_donors', 'banners', 'platform_banners', 'profiles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Drop old policies to avoid collision
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'public_select_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'public_insert_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'public_update_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'public_delete_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'allow_all_' || tbl, tbl);
        
        -- Create unified public access policy
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
            'allow_all_' || tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================================================
-- 6. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('products', 'products', true, 20971520, NULL),
    ('product-images', 'product-images', true, 20971520, NULL),
    ('avatars', 'avatars', true, 20971520, NULL),
    ('documents', 'documents', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit;

-- Enable storage RLS policies for seamless uploads & downloads
DROP POLICY IF EXISTS "public_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "public_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "public_storage_delete" ON storage.objects;

CREATE POLICY "public_storage_select" ON storage.objects FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "public_storage_insert" ON storage.objects FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "public_storage_update" ON storage.objects FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_storage_delete" ON storage.objects FOR DELETE TO anon, authenticated, service_role USING (true);

-- ============================================================================
-- END OF UNIFIED SCHEMA SCRIPT
-- ============================================================================
