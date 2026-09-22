-- =========================================================================
-- JHADIMADI.COM - QUICK FIX: PUBLIC RLS FOR BANNERS, POSTS & PRODUCTS
-- Run this directly in Supabase SQL Editor (https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new)
-- =========================================================================

-- 1. Grant schema usage to public roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Ensure tables exist
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

-- 3. Grant table permissions
GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.platform_banners TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.feed_posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;

-- 4. Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive public policies
DROP POLICY IF EXISTS "banners_public_all" ON public.banners;
DROP POLICY IF EXISTS "banners_public_select" ON public.banners;
CREATE POLICY "banners_public_all" ON public.banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "platform_banners_public_all" ON public.platform_banners;
DROP POLICY IF EXISTS "platform_banners_public_select" ON public.platform_banners;
CREATE POLICY "platform_banners_public_all" ON public.platform_banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "feed_posts_public_all" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_public_select" ON public.feed_posts;
CREATE POLICY "feed_posts_public_all" ON public.feed_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "products_public_all" ON public.products;
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_all" ON public.products FOR ALL USING (true) WITH CHECK (true);
