-- Migration 013: High-Performance Global Query Engine & pg_trgm Text Search Indexes
-- Optimizes cross-table sub-second searches for Products, Service Providers, Blood Donors, Job Circulars, and Job Seekers.

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure Table: blood_donors
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

-- 2. Ensure Table: job_circulars
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT,
  category TEXT NOT NULL DEFAULT 'সাধারণ',
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  salary TEXT,
  division TEXT,
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
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  submission_type TEXT DEFAULT 'detailed',
  circular_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ensure Table: job_seekers
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_code TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'Male',
  desired_job_title TEXT,
  skills_or_job_type TEXT,
  category TEXT DEFAULT 'সাধারণ',
  expected_salary TEXT,
  experience_years TEXT DEFAULT '১ বছর',
  highest_education TEXT,
  skills TEXT[] DEFAULT '{}',
  division TEXT,
  district TEXT NOT NULL DEFAULT 'বাংলাদেশ',
  upazila TEXT,
  address TEXT,
  bio TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_seekers ENABLE ROW LEVEL SECURITY;

-- Read policies: Open search access for public directory discovery
DROP POLICY IF EXISTS "Public can view blood donors" ON public.blood_donors;
CREATE POLICY "Public can view blood donors" ON public.blood_donors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view job circulars" ON public.job_circulars;
CREATE POLICY "Public can view job circulars" ON public.job_circulars FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view job seekers" ON public.job_seekers;
CREATE POLICY "Public can view job seekers" ON public.job_seekers FOR SELECT USING (true);

-- Insert & update policies
DROP POLICY IF EXISTS "Allow blood donor inserts" ON public.blood_donors;
CREATE POLICY "Allow blood donor inserts" ON public.blood_donors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow blood donor updates" ON public.blood_donors;
CREATE POLICY "Allow blood donor updates" ON public.blood_donors FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow job circular inserts" ON public.job_circulars;
CREATE POLICY "Allow job circular inserts" ON public.job_circulars FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow job circular updates" ON public.job_circulars;
CREATE POLICY "Allow job circular updates" ON public.job_circulars FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow job seeker inserts" ON public.job_seekers;
CREATE POLICY "Allow job seeker inserts" ON public.job_seekers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow job seeker updates" ON public.job_seekers;
CREATE POLICY "Allow job seeker updates" ON public.job_seekers FOR UPDATE USING (true);

-- =========================================================================
-- TRGM GIN INDEXES FOR FAST SUB-SECOND TEXT SEARCH
-- =========================================================================

-- Products: Title, Category, Origin, District, Description
CREATE INDEX IF NOT EXISTS idx_products_name_bn_trgm ON public.products USING gin (name_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_en_trgm ON public.products USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON public.products USING gin (category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_origin_trgm ON public.products USING gin (origin gin_trgm_ops);

-- Service Providers: Display Name, Profession, Category, Skills, Location
CREATE INDEX IF NOT EXISTS idx_service_providers_name_trgm ON public.service_providers USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_profession_trgm ON public.service_providers USING gin (profession_key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_category_trgm ON public.service_providers USING gin (category_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_skills_trgm ON public.service_providers USING gin (skills_details gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_district_trgm ON public.service_providers USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_upazila_trgm ON public.service_providers USING gin (upazila gin_trgm_ops);

-- Blood Donors: Name, Blood Group, District, Upazila
CREATE INDEX IF NOT EXISTS idx_blood_donors_name_trgm ON public.blood_donors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_blood_donors_group_btree ON public.blood_donors (blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_donors_district_trgm ON public.blood_donors USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_blood_donors_upazila_trgm ON public.blood_donors USING gin (upazila gin_trgm_ops);

-- Job Circulars: Title, Category, Job Type, District, Upazila
CREATE INDEX IF NOT EXISTS idx_job_circulars_title_trgm ON public.job_circulars USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_circulars_category_btree ON public.job_circulars (category);
CREATE INDEX IF NOT EXISTS idx_job_circulars_job_type_btree ON public.job_circulars (job_type);
CREATE INDEX IF NOT EXISTS idx_job_circulars_district_trgm ON public.job_circulars USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_circulars_upazila_trgm ON public.job_circulars USING gin (upazila gin_trgm_ops);

-- Job Seekers: Name, Skills, Desired Title, District, Upazila
CREATE INDEX IF NOT EXISTS idx_job_seekers_name_trgm ON public.job_seekers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_skills_trgm ON public.job_seekers USING gin (skills_or_job_type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_desired_title_trgm ON public.job_seekers USING gin (desired_job_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_district_trgm ON public.job_seekers USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_seekers_upazila_trgm ON public.job_seekers USING gin (upazila gin_trgm_ops);

-- Profiles: Full Name, District, Upazila, Blood Group
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_district_trgm ON public.profiles USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_upazila_trgm ON public.profiles USING gin (upazila gin_trgm_ops);
