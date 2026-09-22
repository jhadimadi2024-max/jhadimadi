-- =========================================================================
-- JHADIMADI.COM - MIGRATION 016: AUTHENTIC DYNAMIC PRODUCT REVIEWS SYSTEM
-- Target Supabase Project: https://dwhsqftllkximhfvwqak.supabase.co
--
-- Features:
--   1. Replaces hardcoded dummy reviews with genuine customer feedback
--   2. Enables star ratings (1 to 5) and feedback submission directly to Supabase
--   3. Calculates authentic product ratings and reviews count
--   4. Row Level Security (RLS) policies allowing public read and customer submissions
-- =========================================================================

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- =========================================================================
-- TABLE: product_reviews (Verified Buyer & Customer Product Reviews)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  user_location TEXT DEFAULT 'বাংলাদেশ',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_verified_buyer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid query and sorting
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: anyone can read product reviews
DROP POLICY IF EXISTS "Public can read product reviews" ON public.product_reviews;
CREATE POLICY "Public can read product reviews"
  ON public.product_reviews FOR SELECT
  USING (true);

-- 2. Customer Submission Policy: allow users to submit honest reviews
DROP POLICY IF EXISTS "Customers can submit product reviews" ON public.product_reviews;
CREATE POLICY "Customers can submit product reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (rating >= 1 AND rating <= 5 AND length(trim(comment)) > 0);

-- 3. Moderation & Update Policy: Admins or review owners can manage
DROP POLICY IF EXISTS "Admins and authors can manage reviews" ON public.product_reviews;
CREATE POLICY "Admins and authors can manage reviews"
  ON public.product_reviews FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin', 'moderator')
    ))
  );

-- Grants
GRANT SELECT, INSERT ON TABLE public.product_reviews TO anon, authenticated;
GRANT ALL ON TABLE public.product_reviews TO service_role;
