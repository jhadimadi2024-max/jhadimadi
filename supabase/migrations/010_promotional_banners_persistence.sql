-- Migration 010: Dedicated Supabase Banners Table & Public Storage Buckets
-- Schema: id (UUID, Primary Key, default gen_random_uuid()), image_url, title, alt_text, target_link, action_url, is_active, display_order, created_at
-- Storage: 'banners' and 'public-banners' public buckets

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  target_link TEXT DEFAULT 'auto_directory',
  action_url TEXT DEFAULT 'auto_directory',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  subtitle TEXT DEFAULT '',
  tag TEXT DEFAULT 'স্পেশাল অফার',
  placement TEXT DEFAULT 'homepage_hero',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all requested columns exist if table was already created
DO $$
BEGIN
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS alt_text TEXT DEFAULT '';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS target_link TEXT DEFAULT 'auto_directory';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT 'auto_directory';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'স্পেশাল অফার';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'homepage_hero';
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

-- Create indexes for ultra-fast ordering and filtering
CREATE INDEX IF NOT EXISTS idx_banners_active_order ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON public.banners(placement, is_active);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public Read Policy
DROP POLICY IF EXISTS "Public banners read" ON public.banners;
CREATE POLICY "Public banners read" ON public.banners FOR SELECT USING (true);

-- Allow authenticated / service / admin write
DROP POLICY IF EXISTS "Allow all write to banners" ON public.banners;
CREATE POLICY "Allow all write to banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- Also maintain legacy platform_banners table compatibility
CREATE TABLE IF NOT EXISTS public.platform_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  tag TEXT DEFAULT 'স্পেশাল অফার',
  target_link TEXT DEFAULT 'auto_directory',
  placement TEXT DEFAULT 'homepage_hero',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public platform_banners read" ON public.platform_banners;
CREATE POLICY "Public platform_banners read" ON public.platform_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write to platform_banners" ON public.platform_banners;
CREATE POLICY "Allow all write to platform_banners" ON public.platform_banners FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- Supabase Storage Buckets Configuration ('banners' & 'public-banners')
-- =========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('banners', 'banners', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('public-banners', 'public-banners', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public banners read" ON storage.objects;
CREATE POLICY "Public banners read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('banners', 'public-banners', 'products'));

DROP POLICY IF EXISTS "Public banners insert" ON storage.objects;
CREATE POLICY "Public banners insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('banners', 'public-banners', 'products'));

DROP POLICY IF EXISTS "Public banners update" ON storage.objects;
CREATE POLICY "Public banners update" ON storage.objects FOR UPDATE
  USING (bucket_id IN ('banners', 'public-banners', 'products'));

DROP POLICY IF EXISTS "Public banners delete" ON storage.objects;
CREATE POLICY "Public banners delete" ON storage.objects FOR DELETE
  USING (bucket_id IN ('banners', 'public-banners', 'products'));

