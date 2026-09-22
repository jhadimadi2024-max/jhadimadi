-- =========================================================================
-- JHADIMADI.COM - MIGRATION 020: ENFORCE UNIQUE SKU & CLEAN UP PRODUCT DUPLICATES
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new)
-- =========================================================================

-- 1. Deduplicate products with the same SKU (keep row with maximum id/latest record)
DELETE FROM public.products a
USING public.products b
WHERE a.id < b.id 
  AND a.sku IS NOT NULL 
  AND a.sku != '' 
  AND a.sku = b.sku;

-- 2. Deduplicate products with identical products_name (keep row with maximum id/latest record)
DELETE FROM public.products a
USING public.products b
WHERE a.id < b.id 
  AND a.products_name IS NOT NULL 
  AND a.products_name != '' 
  AND a.products_name = b.products_name;

-- 3. Add UNIQUE constraint on sku to strictly prevent duplicate entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_unique'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
END $$;

-- 4. Create an index on sku and products_name for ultra-fast lookup
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(products_name);

-- 5. Refresh RLS policies to allow authenticated and anon to perform clean upserts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_public_update') THEN
    CREATE POLICY "products_public_update" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_public_delete') THEN
    CREATE POLICY "products_public_delete" ON public.products FOR DELETE USING (true);
  END IF;
END $$;

GRANT ALL ON public.products TO anon, authenticated, service_role;
