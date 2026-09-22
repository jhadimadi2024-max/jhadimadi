-- Migration: 20260920_allow_delete_rls_banners_products.sql
-- Purpose: Ensure Supabase RLS DELETE policies explicitly allow deletion for authorized admin/anon roles on banners, platform_banners, and products.

GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.platform_banners TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role, postgres;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. BANNERS DELETE & ALL POLICIES
DROP POLICY IF EXISTS "banners_delete_policy" ON public.banners;
DROP POLICY IF EXISTS "allow_all_banners_delete" ON public.banners;
DROP POLICY IF EXISTS "banners_universal_delete" ON public.banners;
DROP POLICY IF EXISTS "banners_universal_all" ON public.banners;

CREATE POLICY "banners_universal_delete" ON public.banners
FOR DELETE TO anon, authenticated, service_role USING (true);

CREATE POLICY "banners_universal_all" ON public.banners
FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 2. PLATFORM BANNERS DELETE & ALL POLICIES
DROP POLICY IF EXISTS "platform_banners_delete_policy" ON public.platform_banners;
DROP POLICY IF EXISTS "allow_all_platform_banners_delete" ON public.platform_banners;
DROP POLICY IF EXISTS "platform_banners_universal_delete" ON public.platform_banners;
DROP POLICY IF EXISTS "platform_banners_universal_all" ON public.platform_banners;

CREATE POLICY "platform_banners_universal_delete" ON public.platform_banners
FOR DELETE TO anon, authenticated, service_role USING (true);

CREATE POLICY "platform_banners_universal_all" ON public.platform_banners
FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 3. PRODUCTS DELETE & ALL POLICIES
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "allow_all_products_delete" ON public.products;
DROP POLICY IF EXISTS "products_universal_delete" ON public.products;
DROP POLICY IF EXISTS "products_universal_all" ON public.products;

CREATE POLICY "products_universal_delete" ON public.products
FOR DELETE TO anon, authenticated, service_role USING (true);

CREATE POLICY "products_universal_all" ON public.products
FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
