-- =========================================================================
-- JHADIMADI.COM - MIGRATION 015: CORRECTIVE DATABASE SECURITY & RLS HARDENING
-- Replaces overly-permissive public access policies with strict Principle of
-- Least Privilege Row Level Security (RLS) policies and revokes dangerous global
-- anon grants introduced in previous migrations.
--
-- Security Rules Enforced:
--   1. Public users (anon): Read-only access to genuinely public catalog data
--      (products, active providers, verified donors, job seekers, circulars, banners).
--   2. Authenticated users: Access and manage only their own personal and private data.
--   3. Sellers & Service Providers: Create and manage only their own records.
--   4. Administrators: Oversee admin-controlled content and platform moderation.
--   5. Sensitive data (NID, KYC, orders, payment transactions, audit logs):
--      STRICTLY PRIVATE. Never publicly readable or writable by anon.
--   6. Privileges: No 'GRANT ALL' to anon for application tables.
-- =========================================================================

-- Ensure schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- =========================================================================
-- SECTION 1: REVOKE OVERLY-PERMISSIVE GLOBAL GRANTS FROM anon
-- =========================================================================
-- Strip excessive blanket privileges granted to 'anon' in Migration 014
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Reset default privileges so new tables do NOT auto-grant ALL to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;

-- =========================================================================
-- SECTION 2: DEFINE SAFE & SECURE RBAC HELPER FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN user_uuid IS NULL THEN FALSE 
    ELSE EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = user_uuid 
        AND is_active = TRUE 
        AND role IN ('super_admin', 'admin', 'moderator')
    ) 
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN user_uuid IS NULL THEN FALSE 
    ELSE EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = user_uuid 
        AND is_active = TRUE 
        AND role = 'super_admin'
    ) 
  END;
$$;

-- Ensure helper functions can be executed by authenticated and service_role
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, service_role;

-- =========================================================================
-- SECTION 3: ENSURE ROW LEVEL SECURITY IS ACTIVATED ON ALL TABLES
-- =========================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_private_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.puja_gift_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECTION 4: PURGE OVERLY-PERMISSIVE LEGACY POLICIES
-- =========================================================================

-- profiles
DROP POLICY IF EXISTS "Public full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON public.profiles;

-- products
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public select products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- sellers
DROP POLICY IF EXISTS "Public full access to sellers" ON public.sellers;

-- service_providers
DROP POLICY IF EXISTS "Public full access to service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public select service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public insert service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public update service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Allow public delete service_providers" ON public.service_providers;

-- blood_donors
DROP POLICY IF EXISTS "Public full access to blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor inserts" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor updates" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow blood donor deletes" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public select blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public insert blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public update blood_donors" ON public.blood_donors;
DROP POLICY IF EXISTS "Allow public delete blood_donors" ON public.blood_donors;

-- job_seekers
DROP POLICY IF EXISTS "Public full access to job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker inserts" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker updates" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow job seeker deletes" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public select job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public insert job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public update job_seekers" ON public.job_seekers;
DROP POLICY IF EXISTS "Allow public delete job_seekers" ON public.job_seekers;

-- job_circulars
DROP POLICY IF EXISTS "Public full access to job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular inserts" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular updates" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow job circular deletes" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public select job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public insert job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public update job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Allow public delete job_circulars" ON public.job_circulars;

-- banners
DROP POLICY IF EXISTS "Allow all write to banners" ON public.banners;
DROP POLICY IF EXISTS "Allow all write to platform_banners" ON public.platform_banners;
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
DROP POLICY IF EXISTS "Admins manage legacy banners" ON public.platform_banners;

-- =========================================================================
-- SECTION 5: STRICT LEAST-PRIVILEGE ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- -------------------------------------------------------------------------
-- 5.1 PROFILES (Public Directory Discovery vs. Self/Admin Management)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = id OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.2 USER_PRIVATE_KYC & VERIFICATIONS (STRICTLY PRIVATE: NID, Selfie, PII)
-- Sensitive KYC data must NEVER be publicly readable or writable!
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "kyc_select_owner_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_select_owner_admin"
  ON public.user_private_kyc FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "kyc_insert_owner" ON public.user_private_kyc;
CREATE POLICY "kyc_insert_owner"
  ON public.user_private_kyc FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND 
    verification_status = 'pending'
  );

DROP POLICY IF EXISTS "kyc_update_owner_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_update_owner_admin"
  ON public.user_private_kyc FOR UPDATE
  USING (
    (auth.uid() = user_id AND verification_status IN ('unverified', 'revision_requested', 'pending')) OR 
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = user_id AND verification_status = 'pending') OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "kyc_delete_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_delete_admin"
  ON public.user_private_kyc FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Verifications table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "verifications_select_owner_admin" ON public.verifications';
    EXECUTE 'CREATE POLICY "verifications_select_owner_admin" ON public.verifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "verifications_insert_owner" ON public.verifications';
    EXECUTE 'CREATE POLICY "verifications_insert_owner" ON public.verifications FOR INSERT WITH CHECK (auth.role() = ''authenticated'' AND auth.uid() = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "verifications_update_admin" ON public.verifications';
    EXECUTE 'CREATE POLICY "verifications_update_admin" ON public.verifications FOR UPDATE USING (public.is_admin(auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "verifications_delete_admin" ON public.verifications';
    EXECUTE 'CREATE POLICY "verifications_delete_admin" ON public.verifications FOR DELETE USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5.3 PRODUCTS (Public Active View vs. Seller/Admin Management)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_public_active" ON public.products;
CREATE POLICY "products_select_public_active"
  ON public.products FOR SELECT
  USING (
    is_active = TRUE OR 
    auth.uid() = seller_id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
CREATE POLICY "products_insert_seller"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = seller_id OR 
      seller_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "products_update_seller_admin" ON public.products;
CREATE POLICY "products_update_seller_admin"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = seller_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "products_delete_seller_admin" ON public.products;
CREATE POLICY "products_delete_seller_admin"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.4 SELLERS (Public Active Directory vs. Seller/Admin Management)
-- -------------------------------------------------------------------------
-- Ensure user_id column exists on sellers
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "sellers_select_public_active" ON public.sellers;
CREATE POLICY "sellers_select_public_active"
  ON public.sellers FOR SELECT
  USING (
    is_active = TRUE OR 
    auth.uid() = user_id OR 
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "sellers_insert_own" ON public.sellers;
CREATE POLICY "sellers_insert_own"
  ON public.sellers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "sellers_update_own_admin" ON public.sellers;
CREATE POLICY "sellers_update_own_admin"
  ON public.sellers FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sellers_delete_own_admin" ON public.sellers;
CREATE POLICY "sellers_delete_own_admin"
  ON public.sellers FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.5 SERVICE_PROVIDERS & PORTFOLIOS (Public Discovery vs. Provider/Admin Management)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_providers_select_public_available" ON public.service_providers;
CREATE POLICY "service_providers_select_public_available"
  ON public.service_providers FOR SELECT
  USING (
    is_available = TRUE OR 
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "service_providers_insert_owner" ON public.service_providers;
CREATE POLICY "service_providers_insert_owner"
  ON public.service_providers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "service_providers_update_owner_admin" ON public.service_providers;
CREATE POLICY "service_providers_update_owner_admin"
  ON public.service_providers FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "service_providers_delete_owner_admin" ON public.service_providers;
CREATE POLICY "service_providers_delete_owner_admin"
  ON public.service_providers FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Portfolios
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_portfolios') THEN
    EXECUTE 'DROP POLICY IF EXISTS "portfolios_select_public" ON public.provider_portfolios';
    EXECUTE 'CREATE POLICY "portfolios_select_public" ON public.provider_portfolios FOR SELECT USING (true)';

    EXECUTE 'DROP POLICY IF EXISTS "portfolios_insert_owner" ON public.provider_portfolios';
    EXECUTE 'CREATE POLICY "portfolios_insert_owner" ON public.provider_portfolios FOR INSERT WITH CHECK (
      auth.role() = ''authenticated'' AND (
        EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()) OR 
        public.is_admin(auth.uid())
      )
    )';

    EXECUTE 'DROP POLICY IF EXISTS "portfolios_update_owner" ON public.provider_portfolios';
    EXECUTE 'CREATE POLICY "portfolios_update_owner" ON public.provider_portfolios FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()) OR 
      public.is_admin(auth.uid())
    )';

    EXECUTE 'DROP POLICY IF EXISTS "portfolios_delete_owner" ON public.provider_portfolios';
    EXECUTE 'CREATE POLICY "portfolios_delete_owner" ON public.provider_portfolios FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()) OR 
      public.is_admin(auth.uid())
    )';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5.6 BLOOD_DONORS (Public Donor Search vs. Donor/Admin Management)
-- -------------------------------------------------------------------------
ALTER TABLE public.blood_donors ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "blood_donors_select_public" ON public.blood_donors;
CREATE POLICY "blood_donors_select_public"
  ON public.blood_donors FOR SELECT
  USING (
    is_available = TRUE OR 
    verified = TRUE OR 
    auth.uid() = user_id OR 
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "blood_donors_insert_authenticated" ON public.blood_donors;
CREATE POLICY "blood_donors_insert_authenticated"
  ON public.blood_donors FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      auth.uid() = id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "blood_donors_update_owner_admin" ON public.blood_donors;
CREATE POLICY "blood_donors_update_owner_admin"
  ON public.blood_donors FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "blood_donors_delete_owner_admin" ON public.blood_donors;
CREATE POLICY "blood_donors_delete_owner_admin"
  ON public.blood_donors FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.7 JOB_SEEKERS (Public Candidate Discovery vs. Seeker/Admin Management)
-- -------------------------------------------------------------------------
ALTER TABLE public.job_seekers ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "job_seekers_select_public" ON public.job_seekers;
CREATE POLICY "job_seekers_select_public"
  ON public.job_seekers FOR SELECT
  USING (
    status = 'available' OR 
    auth.uid() = user_id OR 
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "job_seekers_insert_authenticated" ON public.job_seekers;
CREATE POLICY "job_seekers_insert_authenticated"
  ON public.job_seekers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      auth.uid() = id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "job_seekers_update_owner_admin" ON public.job_seekers;
CREATE POLICY "job_seekers_update_owner_admin"
  ON public.job_seekers FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "job_seekers_delete_owner_admin" ON public.job_seekers;
CREATE POLICY "job_seekers_delete_owner_admin"
  ON public.job_seekers FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = id OR public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.8 JOB_CIRCULARS (Public Vacancies vs. Employer/Admin Management)
-- -------------------------------------------------------------------------
ALTER TABLE public.job_circulars ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "job_circulars_select_public" ON public.job_circulars;
CREATE POLICY "job_circulars_select_public"
  ON public.job_circulars FOR SELECT
  USING (
    status = 'active' OR 
    public.is_admin(auth.uid()) OR 
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "job_circulars_insert_authenticated" ON public.job_circulars;
CREATE POLICY "job_circulars_insert_authenticated"
  ON public.job_circulars FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "job_circulars_update_owner_admin" ON public.job_circulars;
CREATE POLICY "job_circulars_update_owner_admin"
  ON public.job_circulars FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "job_circulars_delete_owner_admin" ON public.job_circulars;
CREATE POLICY "job_circulars_delete_owner_admin"
  ON public.job_circulars FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.9 BANNERS & PLATFORM_BANNERS (Public View vs. Admin-Only Management)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "banners_select_public" ON public.banners;
CREATE POLICY "banners_select_public"
  ON public.banners FOR SELECT
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "banners_manage_admin" ON public.banners;
CREATE POLICY "banners_manage_admin"
  ON public.banners FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "platform_banners_select_public" ON public.platform_banners;
CREATE POLICY "platform_banners_select_public"
  ON public.platform_banners FOR SELECT
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "platform_banners_manage_admin" ON public.platform_banners;
CREATE POLICY "platform_banners_manage_admin"
  ON public.platform_banners FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.10 ORDERS & ORDER_ITEMS (STRICTLY PRIVATE: Customer & Admin Only)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_select_owner_admin" ON public.orders;
CREATE POLICY "orders_select_owner_admin"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
CREATE POLICY "orders_insert_customer"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = customer_id
  );

DROP POLICY IF EXISTS "orders_update_customer_cancel" ON public.orders;
CREATE POLICY "orders_update_customer_cancel"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'Pending')
  WITH CHECK (auth.uid() = customer_id AND status = 'Cancelled');

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Order Items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "order_items_select" ON public.order_items';
    EXECUTE 'CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.is_admin(auth.uid())))
    )';

    EXECUTE 'DROP POLICY IF EXISTS "order_items_insert" ON public.order_items';
    EXECUTE 'CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
    )';

    EXECUTE 'DROP POLICY IF EXISTS "order_items_manage_admin" ON public.order_items';
    EXECUTE 'CREATE POLICY "order_items_manage_admin" ON public.order_items FOR ALL USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5.11 SERVICE_BOOKINGS (STRICTLY PRIVATE: Customer, Provider & Admin Only)
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "bookings_select_participants" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_select_participants" ON public.service_bookings FOR SELECT USING (
      auth.uid() = customer_id OR 
      auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id) OR 
      public.is_admin(auth.uid())
    )';

    EXECUTE 'DROP POLICY IF EXISTS "bookings_insert_customer" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_insert_customer" ON public.service_bookings FOR INSERT WITH CHECK (
      auth.role() = ''authenticated'' AND 
      auth.uid() = customer_id
    )';

    EXECUTE 'DROP POLICY IF EXISTS "bookings_update_customer_cancel" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_update_customer_cancel" ON public.service_bookings FOR UPDATE USING (
      auth.uid() = customer_id AND status = ''Pending''
    ) WITH CHECK (
      auth.uid() = customer_id AND status = ''Cancelled''
    )';

    EXECUTE 'DROP POLICY IF EXISTS "bookings_update_provider_progress" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_update_provider_progress" ON public.service_bookings FOR UPDATE USING (
      auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id)
    )';

    EXECUTE 'DROP POLICY IF EXISTS "bookings_update_admin" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_update_admin" ON public.service_bookings FOR UPDATE USING (public.is_admin(auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "bookings_delete_admin" ON public.service_bookings';
    EXECUTE 'CREATE POLICY "bookings_delete_admin" ON public.service_bookings FOR DELETE USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5.12 ADMIN_ROLES & ADMIN_ACTIVITY_LOGS (STRICTLY PRIVATE: RBAC & Audit Trail)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_roles_select" ON public.admin_roles;
CREATE POLICY "admin_roles_select"
  ON public.admin_roles FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "admin_roles_insert_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_insert_super_admin"
  ON public.admin_roles FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_roles_update_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_update_super_admin"
  ON public.admin_roles FOR UPDATE
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_roles_delete_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_delete_super_admin"
  ON public.admin_roles FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Activity Logs: Admins view; immutable logs (no update or delete)
DROP POLICY IF EXISTS "activity_logs_select_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_select_admin"
  ON public.admin_activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "activity_logs_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_insert_admin"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = admin_user_id OR 
      public.is_admin(auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- 5.13 PAYMENT_TRANSACTIONS (STRICTLY PRIVATE: Ledger Data)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "transactions_select_user_admin" ON public.payment_transactions;
CREATE POLICY "transactions_select_user_admin"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "transactions_insert_user" ON public.payment_transactions;
CREATE POLICY "transactions_insert_user"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "transactions_update_admin" ON public.payment_transactions;
CREATE POLICY "transactions_update_admin"
  ON public.payment_transactions FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- -------------------------------------------------------------------------
-- 5.14 AI_CHAT_LOGS (Secure Lead Capture & Admin Inspection)
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow chat logging" ON public.ai_chat_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage chat logs" ON public.ai_chat_logs';
    EXECUTE 'DROP POLICY IF EXISTS "ai_chat_logs_insert" ON public.ai_chat_logs';
    EXECUTE 'DROP POLICY IF EXISTS "ai_chat_logs_admin" ON public.ai_chat_logs';

    -- Anyone can insert chat logs (for customer AI assistance & lead capture)
    EXECUTE 'CREATE POLICY "ai_chat_logs_insert_public" ON public.ai_chat_logs FOR INSERT WITH CHECK (true)';

    -- Only admins and lead managers can view, search, or update chat logs
    EXECUTE 'CREATE POLICY "ai_chat_logs_view_admin" ON public.ai_chat_logs FOR SELECT USING (
      public.is_admin(auth.uid()) OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    )';

    EXECUTE 'CREATE POLICY "ai_chat_logs_manage_admin" ON public.ai_chat_logs FOR UPDATE USING (
      public.is_admin(auth.uid())
    ) WITH CHECK (
      public.is_admin(auth.uid())
    )';

    EXECUTE 'CREATE POLICY "ai_chat_logs_delete_admin" ON public.ai_chat_logs FOR DELETE USING (
      public.is_admin(auth.uid())
    )';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5.15 COMPLAINTS_REVIEWS & PUJA_GIFT_APPLICATIONS (Private Applications)
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints_reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS "complaints_select_owner_admin" ON public.complaints_reviews';
    EXECUTE 'CREATE POLICY "complaints_select_owner_admin" ON public.complaints_reviews FOR SELECT USING (auth.uid() = complainant_id OR public.is_admin(auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "complaints_insert_authenticated" ON public.complaints_reviews';
    EXECUTE 'CREATE POLICY "complaints_insert_authenticated" ON public.complaints_reviews FOR INSERT WITH CHECK (auth.role() = ''authenticated'' AND auth.uid() = complainant_id)';

    EXECUTE 'DROP POLICY IF EXISTS "complaints_update_admin" ON public.complaints_reviews';
    EXECUTE 'CREATE POLICY "complaints_update_admin" ON public.complaints_reviews FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puja_gift_applications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "puja_select_applicant_admin" ON public.puja_gift_applications';
    EXECUTE 'CREATE POLICY "puja_select_applicant_admin" ON public.puja_gift_applications FOR SELECT USING (auth.uid() = applicant_uid OR public.is_admin(auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS "puja_insert_applicant" ON public.puja_gift_applications';
    EXECUTE 'CREATE POLICY "puja_insert_applicant" ON public.puja_gift_applications FOR INSERT WITH CHECK (auth.role() = ''authenticated'' AND auth.uid() = applicant_uid)';

    EXECUTE 'DROP POLICY IF EXISTS "puja_update_admin" ON public.puja_gift_applications';
    EXECUTE 'CREATE POLICY "puja_update_admin" ON public.puja_gift_applications FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- =========================================================================
-- SECTION 6: TARGETED & LEAST-PRIVILEGE ROLE PERMISSIONS (NO BLANKET anon GRANTS)
-- =========================================================================

-- 1. Public catalog tables: 'anon' is granted SELECT ONLY
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.sellers TO anon;
GRANT SELECT ON TABLE public.service_providers TO anon;
GRANT SELECT ON TABLE public.blood_donors TO anon;
GRANT SELECT ON TABLE public.job_seekers TO anon;
GRANT SELECT ON TABLE public.job_circulars TO anon;
GRANT SELECT ON TABLE public.banners TO anon;
GRANT SELECT ON TABLE public.platform_banners TO anon;

-- Conditional public catalog grants (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_portfolios') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.provider_portfolios TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_categories') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.platform_categories TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.categories TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_locations') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.platform_locations TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_listings') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.property_listings TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_posts') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.feed_posts TO anon';
  END IF;
  -- Guest AI chat lead logging (INSERT ONLY, NO SELECT OR DELETE)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_logs') THEN
    EXECUTE 'GRANT INSERT ON TABLE public.ai_chat_logs TO anon';
  END IF;
END $$;

-- 2. Sensitive tables: Explicitly REVOKE ALL from 'anon' (Zero access to PII, KYC, financials, orders)
REVOKE ALL ON TABLE public.user_private_kyc FROM anon;
REVOKE ALL ON TABLE public.admin_roles FROM anon;
REVOKE ALL ON TABLE public.admin_activity_logs FROM anon;
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.payment_transactions FROM anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verifications') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.verifications FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.order_items FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.service_bookings FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_transactions') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.financial_transactions FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints_reviews') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.complaints_reviews FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puja_gift_applications') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.puja_gift_applications FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.user_roles FROM anon';
  END IF;
END $$;

-- 3. Authenticated role permissions: Access strictly filtered and governed by RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sellers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_donors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_seekers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_circulars TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_private_kyc TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_transactions TO authenticated;
GRANT SELECT ON TABLE public.banners TO authenticated;
GRANT SELECT ON TABLE public.platform_banners TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_portfolios') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.provider_portfolios TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.order_items TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_bookings') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.service_bookings TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verifications') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.verifications TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints_reviews') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.complaints_reviews TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puja_gift_applications') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.puja_gift_applications TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_listings') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_listings TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_posts') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feed_posts TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_logs') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.ai_chat_logs TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_roles') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.admin_roles TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_activity_logs') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.admin_activity_logs TO authenticated';
  END IF;
END $$;

-- 4. Service Role retains full administrative maintenance privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Add informative security status comment
COMMENT ON SCHEMA public IS 'Jhadimadi Public Schema - Hardened with strict Principle of Least Privilege RLS and revoked anonymous blanket permissions (Migration 015).';
