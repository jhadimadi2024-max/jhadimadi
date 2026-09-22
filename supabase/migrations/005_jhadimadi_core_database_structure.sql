-- =========================================================================
-- JHADIMADI.COM - SUPABASE POSTGRESQL CORE DATABASE STRUCTURE
-- Migration 005: Comprehensive Schema, Relationships, Constraints & Indexes
-- =========================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Generic Trigger Function for Auto-Updating updated_at Columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- TABLE 1: PROFILES (User Profiles linked to auth.users)
-- =========================================================================
-- Purpose: Public & operational user profile data linked directly to Supabase Auth.
-- Passwords are NEVER stored here (managed by Supabase Auth in auth.users).
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'professional', 'vendor', 'admin', 'moderator')),
  avatar_url TEXT,
  division TEXT,
  district TEXT,
  upazila TEXT,
  mahalla TEXT,
  detailed_address TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  is_blood_donor BOOLEAN NOT NULL DEFAULT FALSE,
  is_blood_donor_available BOOLEAN NOT NULL DEFAULT TRUE,
  last_donation_date DATE,
  is_nid_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid_member BOOLEAN NOT NULL DEFAULT FALSE,
  membership_expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(district, upazila);
CREATE INDEX IF NOT EXISTS idx_profiles_blood_donor ON public.profiles(blood_group, is_blood_donor, is_blood_donor_available);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 2: USER_PRIVATE_KYC (Sensitive Verification & Identity Data)
-- =========================================================================
-- Purpose: Strict separation of sensitive PII (NID numbers, identity cards, trade licenses) from public view.
CREATE TABLE IF NOT EXISTS public.user_private_kyc (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nid_number TEXT UNIQUE,
  father_name TEXT,
  mother_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'পুরুষ', 'নারী', 'অন্যান্য')),
  nid_front_url TEXT,
  nid_back_url TEXT,
  selfie_url TEXT,
  trade_license TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'revision_requested')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_kyc_status ON public.user_private_kyc(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_kyc_nid ON public.user_private_kyc(nid_number);

DROP TRIGGER IF EXISTS trg_user_private_kyc_updated_at ON public.user_private_kyc;
CREATE TRIGGER trg_user_private_kyc_updated_at
  BEFORE UPDATE ON public.user_private_kyc
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 3: SERVICE_PROVIDERS (Professionals & Freelancers Directory)
-- =========================================================================
-- Purpose: Directory of skilled technicians, healthcare providers, plumbers, electricians, tutors.
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unique_code TEXT UNIQUE, -- e.g. S-RNG-001
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  profession_key TEXT NOT NULL,
  category_bn TEXT NOT NULL,
  category_en TEXT,
  sub_category TEXT,
  rate_type TEXT NOT NULL DEFAULT 'Daily' CHECK (rate_type IN ('Hourly', 'Daily', 'Fixed')),
  rate_amount NUMERIC NOT NULL DEFAULT 0 CHECK (rate_amount >= 0),
  bio_bn TEXT,
  bio_en TEXT,
  skills TEXT[] DEFAULT '{}',
  skills_details TEXT,
  experience_years NUMERIC DEFAULT 0 CHECK (experience_years >= 0),
  rating NUMERIC NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  jobs_completed INT NOT NULL DEFAULT 0 CHECK (jobs_completed >= 0),
  reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  division TEXT,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  mahalla TEXT,
  covered_areas TEXT[] DEFAULT '{}',
  coverage_radius_km NUMERIC DEFAULT 10,
  latitude NUMERIC,
  longitude NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  blue_tick_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_profession ON public.service_providers(profession_key);
CREATE INDEX IF NOT EXISTS idx_providers_location ON public.service_providers(district, upazila);
CREATE INDEX IF NOT EXISTS idx_providers_availability ON public.service_providers(is_available, blue_tick_active);

DROP TRIGGER IF EXISTS trg_service_providers_updated_at ON public.service_providers;
CREATE TRIGGER trg_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 4: PROVIDER_PORTFOLIOS (Work Portfolio & Gallery)
-- =========================================================================
-- Purpose: Showcase past work, photos, and project samples for service providers.
CREATE TABLE IF NOT EXISTS public.provider_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  project_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_portfolios_provider_id ON public.provider_portfolios(provider_id);

-- =========================================================================
-- TABLE 5: PRODUCTS (E-Commerce Store & Organic Farm Products)
-- =========================================================================
-- Purpose: Catalog of Hill Tracts organic shutki, spices, fruits, handicrafts, and agro products.
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'কেজি',
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  origin TEXT,
  is_organic BOOLEAN NOT NULL DEFAULT TRUE,
  is_pre_harvest BOOLEAN NOT NULL DEFAULT FALSE,
  harvest_date DATE,
  description_bn TEXT,
  description_en TEXT,
  rating NUMERIC NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 6: ORDERS (Customer Orders for Products)
-- =========================================================================
-- Purpose: E-commerce order placement, tracking, total calculation, and status.
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'bKash', 'Nagad', 'Upay')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  trx_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Delivered', 'Cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 7: ORDER_ITEMS (Normalized Order Line Items)
-- =========================================================================
-- Purpose: Normalized relational lines for each ordered product item.
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- =========================================================================
-- TABLE 8: SERVICE_BOOKINGS (Service Bookings & Escrow)
-- =========================================================================
-- Purpose: Service dispatch, booking lifecycle, escrow holding, and 10% platform commission.
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_module_id TEXT NOT NULL,
  service_title_bn TEXT NOT NULL,
  service_title_en TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'EnRoute', 'InProgress', 'Completed', 'Cancelled')),
  total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  contact_unlock_fee NUMERIC NOT NULL DEFAULT 0 CHECK (contact_unlock_fee >= 0),
  escrow_status TEXT NOT NULL DEFAULT 'HeldInEscrow' CHECK (escrow_status IN ('HeldInEscrow', 'ReleasedToWorker', 'Refunded')),
  platform_commission NUMERIC NOT NULL DEFAULT 0 CHECK (platform_commission >= 0),
  worker_net_earning NUMERIC NOT NULL DEFAULT 0 CHECK (worker_net_earning >= 0),
  notes TEXT,
  is_contact_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.service_bookings(status);

DROP TRIGGER IF EXISTS trg_service_bookings_updated_at ON public.service_bookings;
CREATE TRIGGER trg_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 9: PROPERTY_LISTINGS (Rent & Real Estate Marketplace)
-- =========================================================================
-- Purpose: Regional rental houses, apartments, lands, and commercial spaces.
CREATE TABLE IF NOT EXISTS public.property_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title_bn TEXT NOT NULL,
  title_en TEXT,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('Rent', 'Sale')),
  property_category TEXT NOT NULL CHECK (property_category IN ('House', 'Apartment', 'Land', 'Commercial')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  price_unit_bn TEXT NOT NULL DEFAULT 'টাকা/মাস',
  price_unit_en TEXT,
  division TEXT,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  area TEXT NOT NULL,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  size_sqft NUMERIC,
  land_decimal NUMERIC,
  images TEXT[] DEFAULT '{}',
  owner_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  is_verified_property BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description_bn TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_location ON public.property_listings(district, upazila);
CREATE INDEX IF NOT EXISTS idx_property_category ON public.property_listings(property_category, listing_type);

DROP TRIGGER IF EXISTS trg_property_listings_updated_at ON public.property_listings;
CREATE TRIGGER trg_property_listings_updated_at
  BEFORE UPDATE ON public.property_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 10: FEED_POSTS (Community Feed & Classifieds)
-- =========================================================================
-- Purpose: Hyperlocal social wall, local job queries, and community announcements.
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'User',
  author_avatar TEXT,
  post_type TEXT NOT NULL DEFAULT 'General' CHECK (post_type IN ('Service', 'Property', 'ECommerce', 'NeedWork', 'General')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  division TEXT,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  mahalla TEXT,
  category TEXT,
  price NUMERIC,
  contact_phone TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_location ON public.feed_posts(district, upazila);
CREATE INDEX IF NOT EXISTS idx_feed_post_type ON public.feed_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_feed_created_at ON public.feed_posts(created_at DESC);

DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON public.feed_posts;
CREATE TRIGGER trg_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 11: COMPLAINTS_REVIEWS (Customer Grievance & Moderation)
-- =========================================================================
-- Purpose: Public consumer complaints and feedback moderation.
CREATE TABLE IF NOT EXISTS public.complaints_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('service', 'product', 'seller', 'rider')),
  target_name TEXT NOT NULL,
  target_id UUID,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Resolved', 'Dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints_reviews(status);
CREATE INDEX IF NOT EXISTS idx_complaints_target ON public.complaints_reviews(target_type, target_name);

-- =========================================================================
-- TABLE 12: PUJA_GIFT_APPLICATIONS (Festive Gift Distribution Registry)
-- =========================================================================
-- Purpose: Community welfare gift registration and status tracking.
CREATE TABLE IF NOT EXISTS public.puja_gift_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application_code TEXT UNIQUE NOT NULL, -- e.g. PUJA-2026-89234
  full_name TEXT NOT NULL,
  father_or_husband_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  nid_or_birth_certificate TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  passport_photo_url TEXT NOT NULL,
  present_village_area TEXT NOT NULL,
  present_thana_upazila TEXT NOT NULL,
  present_district TEXT NOT NULL,
  permanent_village_area TEXT NOT NULL,
  permanent_thana_upazila TEXT NOT NULL,
  permanent_district TEXT NOT NULL,
  declaration_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Delivered', 'Rejected')),
  admin_notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_puja_code ON public.puja_gift_applications(application_code);
CREATE INDEX IF NOT EXISTS idx_puja_status ON public.puja_gift_applications(status);
CREATE INDEX IF NOT EXISTS idx_puja_nid ON public.puja_gift_applications(nid_or_birth_certificate);

DROP TRIGGER IF EXISTS trg_puja_gift_applications_updated_at ON public.puja_gift_applications;
CREATE TRIGGER trg_puja_gift_applications_updated_at
  BEFORE UPDATE ON public.puja_gift_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- TABLE 13: PAYMENT_TRANSACTIONS (Ledger & Financial Audit Trail)
-- =========================================================================
-- Purpose: Audit log of BDT 100 registration fees, platform commissions, and cashouts.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trx_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bKash', 'Nagad', 'Rocket', 'Upay', 'Card', 'Cash', 'AdminApproval')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  purpose TEXT NOT NULL CHECK (purpose IN ('100_REGISTRATION_FEE', 'COMMISSION', 'CONTACT_UNLOCK', 'ORDER_PAYMENT', 'MEMBERSHIP_FEE')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Success', 'Pending', 'Failed', 'Refunded')),
  reference_id TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_trx_id ON public.payment_transactions(trx_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.payment_transactions(status);

-- =========================================================================
-- TABLE 14: PLATFORM_BANNERS (CMS & Promotional Banners)
-- =========================================================================
-- Purpose: Dynamic banners and seasonal campaigns across homepage & directory.
CREATE TABLE IF NOT EXISTS public.platform_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  tag TEXT,
  image_url TEXT NOT NULL,
  target_link TEXT,
  placement TEXT NOT NULL DEFAULT 'homepage_hero' CHECK (placement IN ('homepage_hero', 'directory_top', 'vendor_spotlight', 'popup_ad')),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_placement ON public.platform_banners(placement, is_active);

-- =========================================================================
-- TABLE 15: PLATFORM_LOCATIONS (Administrative Geo Reference)
-- =========================================================================
-- Purpose: Validated Bangladesh districts and upazilas for hyperlocal matching.
CREATE TABLE IF NOT EXISTS public.platform_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_bn TEXT NOT NULL UNIQUE,
  district_en TEXT NOT NULL UNIQUE,
  upazilas_bn TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVATION ON ALL NEW TABLES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_gift_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_locations ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
CREATE POLICY "Users can insert their profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Private KYC: Owner & Admin only
DROP POLICY IF EXISTS "Owner and Admin view private KYC" ON public.user_private_kyc;
CREATE POLICY "Owner and Admin view private KYC" ON public.user_private_kyc FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner submit private KYC" ON public.user_private_kyc;
CREATE POLICY "Owner submit private KYC" ON public.user_private_kyc FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner and Admin update private KYC" ON public.user_private_kyc;
CREATE POLICY "Owner and Admin update private KYC" ON public.user_private_kyc FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Service Providers: Public read, provider & admin manage
DROP POLICY IF EXISTS "Public view active providers" ON public.service_providers;
CREATE POLICY "Public view active providers" ON public.service_providers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Providers manage own profile" ON public.service_providers;
CREATE POLICY "Providers manage own profile" ON public.service_providers FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Products: Public view, seller & admin manage
DROP POLICY IF EXISTS "Public view products" ON public.products;
CREATE POLICY "Public view products" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers manage own products" ON public.products;
CREATE POLICY "Sellers manage own products" ON public.products FOR ALL
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

-- Orders: Owner & admin view, authenticated create
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users create orders" ON public.orders;
CREATE POLICY "Users create orders" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL
  USING (public.is_admin(auth.uid()));

-- Service Bookings: Participant & admin view
DROP POLICY IF EXISTS "Participants view bookings" ON public.service_bookings;
CREATE POLICY "Participants view bookings" ON public.service_bookings FOR SELECT
  USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (SELECT user_id FROM public.service_providers WHERE id = provider_id) OR
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Customers create bookings" ON public.service_bookings;
CREATE POLICY "Customers create bookings" ON public.service_bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins manage bookings" ON public.service_bookings;
CREATE POLICY "Admins manage bookings" ON public.service_bookings FOR ALL
  USING (public.is_admin(auth.uid()));

-- Banners & Locations: Public read, admin manage
DROP POLICY IF EXISTS "Public view banners" ON public.platform_banners;
CREATE POLICY "Public view banners" ON public.platform_banners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage banners" ON public.platform_banners;
CREATE POLICY "Admins manage banners" ON public.platform_banners FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public view locations" ON public.platform_locations;
CREATE POLICY "Public view locations" ON public.platform_locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage locations" ON public.platform_locations;
CREATE POLICY "Admins manage locations" ON public.platform_locations FOR ALL USING (public.is_admin(auth.uid()));
