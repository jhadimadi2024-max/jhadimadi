-- =========================================================================
-- MIGRATION 030: BLOOD DONORS & FORM SUBMISSION TABLES AND POLICIES
-- Ensures public.blood_donors has all columns used by form submissions
-- Grants permissions and sets permissive RLS for seamless registration
-- =========================================================================

-- 1. Create or alter public.blood_donors table
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id TEXT PRIMARY KEY DEFAULT ('bld_' || floor(random() * 1000000000)::text),
  full_name TEXT,
  name TEXT,
  phone_number TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  blood_group TEXT,
  district TEXT DEFAULT 'খাগড়াছড়ি',
  upazila TEXT DEFAULT 'খাগড়াছড়ি সদর',
  division TEXT DEFAULT 'চট্টগ্রাম',
  area TEXT,
  latitude NUMERIC DEFAULT 0,
  longitude NUMERIC DEFAULT 0,
  consent_given BOOLEAN DEFAULT TRUE,
  profession TEXT DEFAULT 'রক্তদাতা',
  password TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  available BOOLEAN DEFAULT TRUE,
  last_donation_date TEXT,
  total_donations INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  district_unique_id TEXT,
  unique_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if table was created previously
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'খাগড়াছড়ি';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS upazila TEXT DEFAULT 'খাগড়াছড়ি সদর';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'চট্টগ্রাম';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT 0;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT 0;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'রক্তদাতা';
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS last_donation_date TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS total_donations INT DEFAULT 0;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS district_unique_id TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Grants for blood_donors
GRANT ALL ON TABLE public.blood_donors TO anon, authenticated, service_role, postgres;

-- 3. RLS policy for blood_donors
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blood_donors_all_public" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_select_public" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_insert_public" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_update_public" ON public.blood_donors;
DROP POLICY IF EXISTS "blood_donors_delete_public" ON public.blood_donors;

CREATE POLICY "blood_donors_all_public" ON public.blood_donors
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. Also ensure banners, products, sellers, product_sellers have full permissions & RLS
GRANT ALL ON TABLE public.banners TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.sellers TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.product_sellers TO anon, authenticated, service_role, postgres;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "banners_all_public" ON public.banners;
CREATE POLICY "banners_all_public" ON public.banners
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_all_public" ON public.products;
CREATE POLICY "products_all_public" ON public.products
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sellers_all_public" ON public.sellers;
CREATE POLICY "sellers_all_public" ON public.sellers
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_sellers_all_public" ON public.product_sellers;
CREATE POLICY "product_sellers_all_public" ON public.product_sellers
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);
