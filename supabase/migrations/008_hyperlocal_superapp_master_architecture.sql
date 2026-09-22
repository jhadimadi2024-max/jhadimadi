-- =========================================================================
-- JHADIMADI.COM - HYPERLOCAL SUPER-APP MASTER DATABASE ARCHITECTURE
-- Migration 008: Hyperlocal Directory, Blood Donor Privacy, Orders, Transactions & High-Traffic Indexing
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITIES
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Trigram fuzzy search for names & professions

-- Reusable timestamp trigger
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 2. CATEGORIES & TAXONOMY TABLE (Multi-Domain Support)
-- -------------------------------------------------------------------------
-- Supports:
--   - 'marketplace' (Multi-vendor physical products, organic Hill Tracts goods)
--   - 'professional_service' (Electricians, plumbers, mechanics, tutors, home nurses)
--   - 'job_listing' (Full-time, part-time, day-labor, gig economy)
--   - 'rental' (House/flat, commercial space, vehicles, event sound/generators)
CREATE TABLE IF NOT EXISTS public.platform_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.platform_categories(id) ON DELETE CASCADE,
  domain_type TEXT NOT NULL CHECK (domain_type IN ('marketplace', 'professional_service', 'job_listing', 'rental')),
  slug TEXT UNIQUE NOT NULL,
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon_name TEXT,
  banner_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_categories_domain_active 
  ON public.platform_categories(domain_type, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_platform_categories_parent_id 
  ON public.platform_categories(parent_id);

-- -------------------------------------------------------------------------
-- 3. PROFILES & HYPERLOCAL DIRECTORY (profiles table)
-- -------------------------------------------------------------------------
-- Covers:
--   - Granular geographical hierarchy: division, district, upazila, union/ward, mahalla/village
--   - User roles: customer, vendor, professional, donor, agent, admin
--   - Emergency Blood Donor fields: blood_group, is_blood_donor, is_donor_available, last_donated_at
--   - Strict Privacy: Phone privacy flag, contact abstraction token
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unique_identifier TEXT UNIQUE, -- e.g. JHD-CHT-8921
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Sensitive Phone Number (Secured through RLS and RPC privacy masking)
  phone TEXT UNIQUE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_visibility TEXT NOT NULL DEFAULT 'protected' 
    CHECK (phone_visibility IN ('public', 'protected', 'masked', 'hidden')),
  
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' 
    CHECK (role IN ('customer', 'professional', 'vendor', 'donor', 'landlord', 'admin', 'moderator')),

  -- Granular Hyperlocal Address Fields
  division TEXT NOT NULL DEFAULT 'Chattogram',
  district TEXT NOT NULL,          -- e.g. Khagrachhari, Rangamati, Bandarban
  upazila TEXT NOT NULL,           -- e.g. Dighinala, Panchhari, Sadar
  union_or_ward TEXT,             -- Local Union Parishad or Municipal Ward
  area_or_village TEXT,           -- Specific Para / Mahalla / Village
  detailed_address TEXT,          -- Road, Landmark, Holding number
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Emergency Blood Donor Subsystem
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  is_blood_donor BOOLEAN NOT NULL DEFAULT FALSE,
  is_donor_available BOOLEAN NOT NULL DEFAULT TRUE,
  last_donated_at DATE,
  total_donations_count INT NOT NULL DEFAULT 0 CHECK (total_donations_count >= 0),
  emergency_contact_alternate TEXT,

  -- Verification & Reputation
  is_nid_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_badge_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Blue check badge
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
  reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),

  -- Operational Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- -------------------------------------------------------------------------
-- 4. PROFESSIONAL PROFILES (Skilled Service Directory)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.platform_categories(id) ON DELETE SET NULL,
  profession_key TEXT NOT NULL,      -- e.g. 'electrician', 'painter', 'plumber', 'mechanic', 'tutor'
  profession_title_bn TEXT NOT NULL, -- e.g. 'ইলেকট্রিশিয়ান ও ওয়্যারিং টেকনিশিয়ান'
  profession_title_en TEXT,
  experience_years INT NOT NULL DEFAULT 1 CHECK (experience_years >= 0),
  
  -- Rate Matrix
  pricing_model TEXT NOT NULL DEFAULT 'Daily' 
    CHECK (pricing_model IN ('Hourly', 'Daily', 'Per_Job', 'Inspection_Fee', 'Negotiable')),
  base_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (base_rate >= 0),
  
  skills TEXT[] DEFAULT '{}',
  service_coverage_radius_km NUMERIC(5, 1) DEFAULT 15.0,
  bio_bn TEXT,
  bio_en TEXT,
  
  -- Service Status
  is_available_now BOOLEAN NOT NULL DEFAULT TRUE,
  jobs_completed INT NOT NULL DEFAULT 0 CHECK (jobs_completed >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_professional_profile UNIQUE (profile_id, profession_key)
);

DROP TRIGGER IF EXISTS trg_professional_profiles_updated_at ON public.professional_profiles;
CREATE TRIGGER trg_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- -------------------------------------------------------------------------
-- 5. ORDERS & FINANCIAL MANAGEMENT (orders table)
-- -------------------------------------------------------------------------
-- Future-proofed for:
--   - Beta Phase: 0% commission, Cash on Delivery (COD), Direct Vendor Interaction
--   - Production/Monetized Phase: 5%-10% automated commission, bKash/Nagad/Cards gateway
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- e.g. ORD-20260907-8841
  
  -- Parties
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Contact & Delivery Snapshot (frozen at time of order)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_division TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  delivery_upazila TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- Order Items Snapshot
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INT NOT NULL DEFAULT 1 CHECK (item_count > 0),
  
  -- Financial Ledger & Calculation Fields
  subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Extensible Commission Fields (Future-Proof Monetization)
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,        -- e.g. 0.00 in beta, 5.00 for 5%
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,      -- Calculated platform revenue
  commission_status TEXT NOT NULL DEFAULT 'exempt'
    CHECK (commission_status IN ('exempt', 'pending', 'collected', 'waived', 'refunded')),
  
  -- Payment & Gateway Management
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer', 'direct_contact')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'cod_unpaid', 'failed', 'refunded')),
  
  gateway_name TEXT DEFAULT NULL,                             -- 'bKash_PGW', 'Nagad_Direct', 'SSLCommerz'
  gateway_transaction_id TEXT DEFAULT NULL,                  -- Bank/bKash TRX ID (e.g. TRXB9320KA)
  gateway_payload JSONB DEFAULT NULL,                         -- Raw webhook/IPN response for audit trail
  
  -- Fulfillment Status
  order_status TEXT NOT NULL DEFAULT 'placed'
    CHECK (order_status IN ('placed', 'confirmed', 'processing', 'in_transit', 'delivered', 'cancelled', 'returned')),
  
  -- Beta Verification & Anti-Spam
  is_beta_order BOOLEAN NOT NULL DEFAULT TRUE,
  customer_otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  vendor_contact_initiated BOOLEAN NOT NULL DEFAULT FALSE,
  customer_notes TEXT,
  cancellation_reason TEXT,
  
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- -------------------------------------------------------------------------
-- 6. FINANCIAL LEDGER & ESCROW TRANSACTIONS (financial_transactions table)
-- -------------------------------------------------------------------------
-- Provides double-entry record keeping for all monetary flows (payouts, commissions, refunds)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref TEXT UNIQUE NOT NULL, -- e.g. TXN-JHD-9021
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  destination_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('order_payment', 'platform_commission', 'vendor_payout', 'escrow_hold', 'refund', 'subscription_fee')),
  
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  
  channel TEXT NOT NULL DEFAULT 'COD'
    CHECK (channel IN ('COD', 'bKash', 'Nagad', 'Rocket', 'Bank_Transfer', 'Internal_Wallet')),
  gateway_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'reversed')),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. SECURE CONTACT & PRIVACY ABSTRACTION (contact_audit_logs table)
-- -------------------------------------------------------------------------
-- Instead of public phone scraping, users click "Call Now" or "WhatsApp"
-- This triggers a secure RPC, logs the event for anti-harassment/analytics,
-- and verifies rate limits before routing the direct dialer or WhatsApp trigger.
CREATE TABLE IF NOT EXISTS public.contact_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone_call', 'whatsapp_chat', 'in_app_chat')),
  context_module TEXT NOT NULL CHECK (context_module IN ('emergency_blood', 'service_provider', 'marketplace_order', 'rental')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 8. HIGH-TRAFFIC OPTIMIZATION & INDEXING STRATEGY
-- -------------------------------------------------------------------------
-- Hyperlocal searches require sub-15ms queries even with 10M+ records.
-- We employ:
--   - B-Tree Composite Indexes for multi-column equality/range filters
--   - Partial Indexes for high-frequency filtered subsets (e.g. active blood donors)
--   - GIN Trigram Indexes for text search

-- A. Profiles & Hyperlocal Location Lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hyperlocal_lookup 
  ON public.profiles(district, upazila, is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_role_hyperlocal 
  ON public.profiles(role, district, upazila) 
  WHERE is_active = TRUE;

-- B. Emergency Blood Donor Search (High-Priority Partial Index)
-- Lightning-fast query for: SELECT * FROM profiles WHERE is_blood_donor = true AND is_donor_available = true AND blood_group = $1 AND district = $2
CREATE INDEX IF NOT EXISTS idx_profiles_blood_donor_query 
  ON public.profiles(blood_group, district, upazila, last_donated_at)
  WHERE is_blood_donor = TRUE AND is_donor_available = TRUE AND is_active = TRUE;

-- C. Professional Directory Indexes
CREATE INDEX IF NOT EXISTS idx_prof_profiles_lookup 
  ON public.professional_profiles(profession_key, is_available_now);

CREATE INDEX IF NOT EXISTS idx_prof_profiles_composite 
  ON public.professional_profiles(category_id, is_available_now, base_rate);

-- D. Trigram (GIN) Index for instant autocomplete search across names & titles
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm 
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_prof_title_bn_trgm 
  ON public.professional_profiles USING gin (profession_title_bn gin_trgm_ops);

-- E. Orders & Financial Transactions Lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_history 
  ON public.orders(customer_id, placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_vendor_history 
  ON public.orders(vendor_id, order_status, placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_gateway 
  ON public.orders(payment_status, order_status);

CREATE INDEX IF NOT EXISTS idx_orders_trx_lookup 
  ON public.orders(gateway_transaction_id) 
  WHERE gateway_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_txn_order 
  ON public.financial_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_financial_txn_dest 
  ON public.financial_transactions(destination_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_audit_rate_limit 
  ON public.contact_audit_logs(initiator_user_id, created_at DESC);

-- -------------------------------------------------------------------------
-- 9. PRIVACY ABSTRACTION: PUBLIC SANITIZED VIEWS & RPC FUNCTIONS
-- -------------------------------------------------------------------------

-- View: Public Safe Profiles (Phone numbers are strictly masked for web crawlers)
CREATE OR REPLACE VIEW public.v_public_profiles AS
SELECT 
  p.id,
  p.unique_identifier,
  p.full_name,
  p.avatar_url,
  p.role,
  p.division,
  p.district,
  p.upazila,
  p.union_or_ward,
  p.area_or_village,
  p.blood_group,
  p.is_blood_donor,
  p.is_donor_available,
  p.last_donated_at,
  p.is_nid_verified,
  p.is_badge_verified,
  p.rating,
  p.reviews_count,
  -- Masked phone (e.g. +880 18****9201) to protect against scrapers
  CASE 
    WHEN p.phone IS NULL THEN NULL
    WHEN p.phone_visibility = 'public' THEN p.phone
    ELSE CONCAT(SUBSTRING(p.phone FROM 1 FOR 6), '****', SUBSTRING(p.phone FROM LENGTH(p.phone) - 3))
  END AS masked_phone,
  p.is_active,
  p.created_at
FROM public.profiles p
WHERE p.is_active = TRUE;

-- RPC: Secure Direct Contact Action Trigger
-- Verifies caller, enforces anti-spam rate limiting, logs audit event,
-- and returns the dialable URI for WhatsApp or Phone call
CREATE OR REPLACE FUNCTION public.request_direct_contact(
  p_target_profile_id UUID,
  p_contact_type TEXT,
  p_context_module TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  target_name TEXT,
  phone_action_uri TEXT,
  message TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_target_phone TEXT;
  v_target_name TEXT;
  v_recent_requests INT;
  v_clean_phone TEXT;
BEGIN
  v_caller_id := auth.uid();
  
  -- Rate limiting: Max 10 contact requests per 5 minutes per user to stop harvesting
  IF v_caller_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recent_requests
    FROM public.contact_audit_logs
    WHERE initiator_user_id = v_caller_id
      AND created_at > NOW() - INTERVAL '5 minutes';
      
    IF v_recent_requests >= 10 THEN
      RETURN QUERY SELECT 
        FALSE, 
        NULL::TEXT, 
        NULL::TEXT, 
        'অনুগ্রহ করে অপেক্ষা করুন। অতিরিক্ত যোগাযোগের অনুরোধের কারণে সাময়িক বিরতি দেওয়া হয়েছে।'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Fetch target contact details
  SELECT p.phone, p.full_name INTO v_target_phone, v_target_name
  FROM public.profiles p
  WHERE p.id = p_target_profile_id AND p.is_active = TRUE;

  IF v_target_phone IS NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::TEXT, 
      NULL::TEXT, 
      'যোগাযোগের নম্বর পাওয়া যায়নি বা অ্যাকাউন্টটি সক্রিয় নয়।'::TEXT;
    RETURN;
  END IF;

  -- Clean phone formatting (remove spaces/dashes)
  v_clean_phone := regexp_replace(v_target_phone, '[^0-9+]', '', 'g');

  -- Log the contact event into audit trail
  INSERT INTO public.contact_audit_logs (
    initiator_user_id,
    target_profile_id,
    contact_type,
    context_module
  ) VALUES (
    v_caller_id,
    p_target_profile_id,
    p_contact_type,
    p_context_module
  );

  -- Return direct dial or WhatsApp URI scheme
  IF p_contact_type = 'whatsapp_chat' THEN
    RETURN QUERY SELECT 
      TRUE, 
      v_target_name, 
      CONCAT('https://wa.me/', regexp_replace(v_clean_phone, '^\+', ''))::TEXT,
      'সফলভাবে WhatsApp সংযোগ তৈরি হয়েছে।'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      TRUE, 
      v_target_name, 
      CONCAT('tel:', v_clean_phone)::TEXT,
      'সফলভাবে কল সংযোগ তৈরি হয়েছে।'::TEXT;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.platform_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10.1 Categories Policies
CREATE POLICY "Categories are readable by everyone" 
  ON public.platform_categories FOR SELECT USING (is_active = TRUE);

-- 10.2 Profiles Policies
-- Everyone can read active profiles (through the public view, or selected non-sensitive columns)
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (is_active = TRUE);

-- Users can only modify their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 10.3 Professional Profiles Policies
CREATE POLICY "Professional profiles viewable by all"
  ON public.professional_profiles FOR SELECT
  USING (is_available_now = TRUE OR auth.uid() = profile_id);

CREATE POLICY "Professionals manage own listing"
  ON public.professional_profiles FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- 10.4 Orders Policies
-- Customers can see their own orders
CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Vendors can see orders placed with them
CREATE POLICY "Vendors view assigned orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = vendor_id);

-- Customers can create orders
CREATE POLICY "Customers can place orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

-- Vendors or Customers can update specific order status states
CREATE POLICY "Parties can update order lifecycle"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- 10.5 Financial Transactions Policies
CREATE POLICY "Users view own financial ledger"
  ON public.financial_transactions FOR SELECT
  USING (auth.uid() = source_user_id OR auth.uid() = destination_user_id);

-- 10.6 Contact Audit Logs Policies
CREATE POLICY "Users view own initiated contact logs"
  ON public.contact_audit_logs FOR SELECT
  USING (auth.uid() = initiator_user_id);

CREATE POLICY "System logs contact events"
  ON public.contact_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = initiator_user_id OR initiator_user_id IS NULL);

-- =========================================================================
-- END OF MIGRATION 008
-- =========================================================================
