-- ==============================================================================
-- FIX RLS & PUBLIC ANONYMOUS ACCESS FOR JHADIMADI SUPABASE DATABASE
-- ==============================================================================
-- Run this SQL in your Supabase Project -> SQL Editor to ensure anonymous (guest)
-- users and public web forms can insert, select, and delete data without 42501 errors.

-- 1. Grant table access to anon and authenticated roles
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.blood_donors TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_circulars TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_seekers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.service_providers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_sellers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.permanent_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

-- Grant sequence access for auto-incrementing serial IDs
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Disable Row Level Security on public submission tables (simplest & most reliable for public forms)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permanent_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 3. If you prefer to keep RLS ENABLED instead of disabled, use these permissive policies:
/*
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on products" ON public.products;
CREATE POLICY "Public full access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on blood_donors" ON public.blood_donors;
CREATE POLICY "Public full access on blood_donors" ON public.blood_donors FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on job_circulars" ON public.job_circulars;
CREATE POLICY "Public full access on job_circulars" ON public.job_circulars FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on job_seekers" ON public.job_seekers;
CREATE POLICY "Public full access on job_seekers" ON public.job_seekers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on service_providers" ON public.service_providers;
CREATE POLICY "Public full access on service_providers" ON public.service_providers FOR ALL USING (true) WITH CHECK (true);
*/

-- 4. Supabase Storage: Allow public uploads & downloads for 'products', 'avatars', 'documents' buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for public upload and select
DROP POLICY IF EXISTS "Public storage upload products" ON storage.objects;
CREATE POLICY "Public storage upload products" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id IN ('products', 'avatars', 'documents'));

DROP POLICY IF EXISTS "Public storage select products" ON storage.objects;
CREATE POLICY "Public storage select products" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id IN ('products', 'avatars', 'documents'));

DROP POLICY IF EXISTS "Public storage delete products" ON storage.objects;
CREATE POLICY "Public storage delete products" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id IN ('products', 'avatars', 'documents'));
