-- ============================================================================
-- JHADIMADI.COM — SUPABASE ENHANCED SCHEMA MIGRATION
-- Created: 2026-09-19
-- Tables: products (enhanced), sellers, service_providers, jobs, job_applications, members, banners
-- ============================================================================

-- 1. PRODUCTS TABLE ENHANCEMENTS
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS products_name_en text,
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS key_highlights jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS production_process text,
ADD COLUMN IF NOT EXISTS ingredients text,
ADD COLUMN IF NOT EXISTS usage_instructions text;

-- 2. SELLERS REGISTRATION TABLE
CREATE TABLE IF NOT EXISTS public.sellers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text NOT NULL,
    shop_name text,
    phone text NOT NULL,
    email text,
    address text,
    nid_number text,
    trade_license text,
    product_category text,
    status text DEFAULT 'pending'
);

-- 3. SERVICE PROVIDERS REGISTRATION TABLE
CREATE TABLE IF NOT EXISTS public.service_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text NOT NULL,
    service_type text NOT NULL,
    phone text NOT NULL,
    email text,
    district text,
    upazila text,
    address text,
    experience_years text,
    nid_number text,
    status text DEFAULT 'pending'
);

-- Also add columns if table already existed previously
ALTER TABLE IF EXISTS public.service_providers
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS service_type text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS experience_years text,
ADD COLUMN IF NOT EXISTS nid_number text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 4. JOBS & JOB APPLICATIONS TABLES
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    company_name text NOT NULL,
    job_type text,
    vacancy integer DEFAULT 1,
    location text,
    salary_range text,
    deadline date,
    description text,
    requirements text,
    status text DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_name text NOT NULL,
    phone text NOT NULL,
    email text,
    resume_url text,
    experience_summary text,
    status text DEFAULT 'applied'
);

-- 5. PERMANENT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    nid_number text,
    blood_group text,
    address text,
    photo_url text,
    membership_type text DEFAULT 'permanent',
    status text DEFAULT 'pending'
);

-- 6. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text,
    image_url text NOT NULL,
    target_link text,
    position text DEFAULT 'home_top',
    is_active boolean DEFAULT true
);

-- Ensure position column exists if banners table was created previously
ALTER TABLE IF EXISTS public.banners
ADD COLUMN IF NOT EXISTS position text DEFAULT 'home_top';

-- ============================================================================
-- 7. ROBUST ROLE PERMISSIONS & ROW LEVEL SECURITY (RLS) FOR INSTANT FORM ACTIONS
-- ============================================================================

-- Grant permissions to public (anon) and authenticated roles
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sellers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.service_providers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.jobs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_applications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Disable RLS for frictionless public forms & operations
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
