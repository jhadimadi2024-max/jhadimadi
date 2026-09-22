-- =========================================================================
-- JHADIMADI.COM - COMPLETE SUPABASE POSTGRESQL MASTER DATABASE SCHEMA
-- Production Schema: Tables, Relationships, Security RBAC, Indexes & RLS
-- =========================================================================

-- =========================================================================
-- SECTION 1: EXTENSIONS & HELPER FUNCTIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic Trigger Function for Auto-Updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Storage path sanitization & validation
CREATE OR REPLACE FUNCTION public.storage_is_safe_path(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    file_path IS NOT NULL AND
    file_path NOT LIKE '%..%' AND
    file_path NOT LIKE '%//%' AND
    file_path NOT LIKE '/%' AND
    file_path NOT LIKE '%\%' AND
    file_path ~ '^[a-zA-Z0-9_\-\./]+$';
$$;

CREATE OR REPLACE FUNCTION public.storage_is_valid_image(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(storage.extension(file_path)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif');
$$;

CREATE OR REPLACE FUNCTION public.storage_is_valid_doc(file_path text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(storage.extension(file_path)) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
$$;

-- =========================================================================
-- SECTION 2: ADMIN ROLES & ACTIVITY LOGS (RBAC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON public.admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.admin_roles 
  WHERE user_id = user_uuid AND is_active = TRUE 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid 
      AND is_active = TRUE 
      AND role IN ('super_admin', 'admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid 
      AND is_active = TRUE 
      AND role = 'super_admin'
  );
$$;

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.admin_activity_logs(action_type);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECTION 3: USER PROFILES & PRIVATE KYC (Strict PII Separation)
-- =========================================================================

-- 3.1 Public & Operational Profiles
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

-- 3.2 Private Citizen & Worker KYC Data
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
-- SECTION 4: SERVICE PROVIDERS & FREELANCER DIRECTORY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unique_code TEXT UNIQUE,
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
-- SECTION 5: E-COMMERCE PRODUCTS, ORDERS & ORDER ITEMS
-- =========================================================================
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

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'Direct_Contact', 'bKash', 'Nagad', 'Upay')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cod_unpaid', 'failed', 'refunded')),
  trx_id TEXT,
  -- Future-Proofing for Commission & Payment Gateways (Beta Phase: 0% Commission & COD/Direct Contact)
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'exempt' CHECK (commission_status IN ('exempt', 'pending', 'collected', 'waived')),
  gateway_name TEXT DEFAULT NULL,
  gateway_transaction_id TEXT DEFAULT NULL,
  gateway_payload JSONB DEFAULT NULL,
  is_beta_phase BOOLEAN DEFAULT TRUE,
  order_channel TEXT DEFAULT 'COD' CHECK (order_channel IN ('COD', 'Direct_Contact', 'WhatsApp', 'Phone', 'Online_Gateway')),
  customer_otp_verified BOOLEAN DEFAULT FALSE,
  customer_verification_code TEXT DEFAULT NULL,
  vendor_phone TEXT DEFAULT NULL,
  direct_contact_timestamp TIMESTAMPTZ DEFAULT NULL,
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
-- SECTION 6: SERVICE BOOKINGS & ESCROW
-- =========================================================================
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
-- SECTION 7: RENTAL & REAL ESTATE LISTINGS
-- =========================================================================
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
-- SECTION 8: COMMUNITY FEED & CLASSIFIEDS
-- =========================================================================
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
-- SECTION 9: COMPLAINTS & GRIEVANCE MODERATION
-- =========================================================================
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
-- SECTION 10: PUJA GIFT WELFARE REGISTRY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.puja_gift_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application_code TEXT UNIQUE NOT NULL,
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
-- SECTION 11: FINANCIAL LEDGER & PAYMENT TRANSACTIONS
-- =========================================================================
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
-- SECTION 12: PLATFORM CMS BANNERS & GEOGRAPHIC BOUNDARIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  target_link TEXT DEFAULT 'auto_directory',
  action_url TEXT DEFAULT 'auto_directory',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  "order" INT NOT NULL DEFAULT 0,
  subtitle TEXT DEFAULT '',
  tag TEXT DEFAULT 'স্পেশাল অফার',
  placement TEXT NOT NULL DEFAULT 'homepage_hero',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active_order ON public.banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_banners_hero_placement ON public.banners(placement, is_active);

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

CREATE TABLE IF NOT EXISTS public.platform_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_bn TEXT NOT NULL UNIQUE,
  district_en TEXT NOT NULL UNIQUE,
  upazilas_bn TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- SECTION 13: ROW LEVEL SECURITY (RLS) POLICIES
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

-- 13.1 Profiles RLS
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Public full access to profiles" ON public.profiles;
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

-- 13.2 Private KYC RLS (Strict Separation & Confidentiality)
DROP POLICY IF EXISTS "Owner and Admin view private KYC" ON public.user_private_kyc;
DROP POLICY IF EXISTS "kyc_select_owner_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_select_owner_admin" 
  ON public.user_private_kyc FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner submit private KYC" ON public.user_private_kyc;
DROP POLICY IF EXISTS "kyc_insert_owner" ON public.user_private_kyc;
CREATE POLICY "kyc_insert_owner" 
  ON public.user_private_kyc FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND 
    verification_status = 'pending'
  );

DROP POLICY IF EXISTS "Owner and Admin update private KYC" ON public.user_private_kyc;
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
  USING (public.is_super_admin(auth.uid()));

-- 13.3 Service Providers & Portfolios RLS
DROP POLICY IF EXISTS "Public view active providers" ON public.service_providers;
DROP POLICY IF EXISTS "providers_select_public" ON public.service_providers;
DROP POLICY IF EXISTS "providers_insert_owner" ON public.service_providers;
DROP POLICY IF EXISTS "Providers manage own profile" ON public.service_providers;
DROP POLICY IF EXISTS "providers_update_owner_admin" ON public.service_providers;
DROP POLICY IF EXISTS "Public full access to service_providers" ON public.service_providers;
CREATE POLICY "service_providers_select_public_available" 
  ON public.service_providers FOR SELECT 
  USING (is_available = TRUE OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "service_providers_insert_owner" 
  ON public.service_providers FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

CREATE POLICY "service_providers_update_owner_admin" 
  ON public.service_providers FOR UPDATE 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "service_providers_delete_owner_admin" 
  ON public.service_providers FOR DELETE 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public view provider portfolios" ON public.provider_portfolios;
DROP POLICY IF EXISTS "portfolios_select_public" ON public.provider_portfolios;
CREATE POLICY "portfolios_select_public" 
  ON public.provider_portfolios FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Providers manage own portfolios" ON public.provider_portfolios;
DROP POLICY IF EXISTS "portfolios_insert_owner" ON public.provider_portfolios;
CREATE POLICY "portfolios_insert_owner" 
  ON public.provider_portfolios FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()) OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "portfolios_update_delete_owner" ON public.provider_portfolios;
CREATE POLICY "portfolios_update_delete_owner" 
  ON public.provider_portfolios FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid()) OR 
    public.is_admin(auth.uid())
  );

-- 13.4 Products & Orders RLS
DROP POLICY IF EXISTS "Public view products" ON public.products;
DROP POLICY IF EXISTS "products_select_public_seller" ON public.products;
DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
DROP POLICY IF EXISTS "Sellers manage own products" ON public.products;
DROP POLICY IF EXISTS "products_update_seller_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_seller_admin" ON public.products;
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
CREATE POLICY "products_select_public_active" 
  ON public.products FOR SELECT 
  USING (is_active = TRUE OR auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "products_insert_seller" 
  ON public.products FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = seller_id OR 
      seller_id IS NULL OR 
      public.is_admin(auth.uid())
    )
  );

CREATE POLICY "products_update_seller_admin" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE POLICY "products_delete_seller_admin" 
  ON public.products FOR DELETE 
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_admin" ON public.orders;
CREATE POLICY "orders_select_owner_admin" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users create orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
CREATE POLICY "orders_insert_customer" 
  ON public.orders FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = customer_id AND
    status = 'Pending' AND
    payment_status = 'pending'
  );

-- Customers can only cancel while status is 'Pending'
-- Sensitive order status changes (Processing, Delivered) are ADMIN ONLY
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
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

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users insert order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" 
  ON public.order_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

-- 13.5 Service Bookings RLS
DROP POLICY IF EXISTS "Participants view bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "bookings_select_participants" ON public.service_bookings;
CREATE POLICY "bookings_select_participants" 
  ON public.service_bookings FOR SELECT 
  USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id) OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Customers create bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "bookings_insert_customer" ON public.service_bookings;
CREATE POLICY "bookings_insert_customer" 
  ON public.service_bookings FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = customer_id AND
    status = 'Pending' AND
    escrow_status = 'HeldInEscrow'
  );

DROP POLICY IF EXISTS "bookings_update_customer_cancel" ON public.service_bookings;
CREATE POLICY "bookings_update_customer_cancel" 
  ON public.service_bookings FOR UPDATE 
  USING (auth.uid() = customer_id AND status = 'Pending')
  WITH CHECK (auth.uid() = customer_id AND status = 'Cancelled');

DROP POLICY IF EXISTS "bookings_update_provider_progress" ON public.service_bookings;
CREATE POLICY "bookings_update_provider_progress" 
  ON public.service_bookings FOR UPDATE 
  USING (
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id) AND
    escrow_status = (SELECT sb.escrow_status FROM public.service_bookings sb WHERE sb.id = id)
  );

DROP POLICY IF EXISTS "Admins manage bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "bookings_all_admin" ON public.service_bookings;
CREATE POLICY "bookings_all_admin" 
  ON public.service_bookings FOR ALL 
  USING (public.is_admin(auth.uid()));

-- 13.6 Admin Roles & Activity Logs RLS
DROP POLICY IF EXISTS "admin_roles_select" ON public.admin_roles;
CREATE POLICY "admin_roles_select" 
  ON public.admin_roles FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

DROP POLICY IF EXISTS "admin_roles_insert_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_insert_super_admin" 
  ON public.admin_roles FOR INSERT 
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

DROP POLICY IF EXISTS "admin_roles_update_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_update_super_admin" 
  ON public.admin_roles FOR UPDATE 
  USING (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  )
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

DROP POLICY IF EXISTS "admin_roles_delete_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_delete_super_admin" 
  ON public.admin_roles FOR DELETE 
  USING (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

DROP POLICY IF EXISTS "activity_logs_select_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_select_admin" 
  ON public.admin_activity_logs FOR SELECT 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

DROP POLICY IF EXISTS "activity_logs_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_insert_admin" 
  ON public.admin_activity_logs FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = admin_user_id OR 
      public.is_admin(auth.uid())
    )
  );

-- 13.7 Payment Transactions RLS
DROP POLICY IF EXISTS "Users view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "transactions_select_user_admin" ON public.payment_transactions;
CREATE POLICY "transactions_select_user_admin" 
  ON public.payment_transactions FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users insert transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "transactions_insert_user" ON public.payment_transactions;
CREATE POLICY "transactions_insert_user" 
  ON public.payment_transactions FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND 
    status = 'Pending'
  );

DROP POLICY IF EXISTS "transactions_update_admin" ON public.payment_transactions;
CREATE POLICY "transactions_update_admin" 
  ON public.payment_transactions FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 13.8 Complaints & Reviews RLS
DROP POLICY IF EXISTS "Complainants and admins view complaints" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_select_owner_admin" ON public.complaints_reviews;
CREATE POLICY "complaints_select_owner_admin" 
  ON public.complaints_reviews FOR SELECT 
  USING (auth.uid() = complainant_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit a complaint" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_insert_authenticated" ON public.complaints_reviews;
CREATE POLICY "complaints_insert_authenticated" 
  ON public.complaints_reviews FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = complainant_id AND 
    status = 'Pending'
  );

DROP POLICY IF EXISTS "Admins moderate complaints" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_update_admin" ON public.complaints_reviews;
CREATE POLICY "complaints_update_admin" 
  ON public.complaints_reviews FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 13.9 Puja Gift Applications RLS
DROP POLICY IF EXISTS "Applicants and admins view applications" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_select_applicant_admin" ON public.puja_gift_applications;
CREATE POLICY "puja_select_applicant_admin" 
  ON public.puja_gift_applications FOR SELECT 
  USING (auth.uid() = applicant_uid OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit puja gift application" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_insert_applicant" ON public.puja_gift_applications;
CREATE POLICY "puja_insert_applicant" 
  ON public.puja_gift_applications FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = applicant_uid AND 
    status = 'Pending'
  );

DROP POLICY IF EXISTS "Admins manage puja gift applications" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_update_admin" ON public.puja_gift_applications;
CREATE POLICY "puja_update_admin" 
  ON public.puja_gift_applications FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 13.10 Property Listings & Community Feed RLS
DROP POLICY IF EXISTS "Public view properties" ON public.property_listings;
DROP POLICY IF EXISTS "property_select_public" ON public.property_listings;
CREATE POLICY "property_select_public" 
  ON public.property_listings FOR SELECT 
  USING (is_active = TRUE OR auth.uid() = owner_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "property_insert_owner" ON public.property_listings;
CREATE POLICY "property_insert_owner" 
  ON public.property_listings FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners manage own property listings" ON public.property_listings;
DROP POLICY IF EXISTS "property_update_delete_owner" ON public.property_listings;
CREATE POLICY "property_update_delete_owner" 
  ON public.property_listings FOR UPDATE 
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = owner_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "property_delete_owner" ON public.property_listings;
CREATE POLICY "property_delete_owner" 
  ON public.property_listings FOR DELETE 
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public view approved feed posts" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_select_public" ON public.feed_posts;
CREATE POLICY "feed_select_public" 
  ON public.feed_posts FOR SELECT 
  USING (status = 'Approved' OR auth.uid() = author_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "feed_insert_author" ON public.feed_posts;
CREATE POLICY "feed_insert_author" 
  ON public.feed_posts FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors manage own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_update_author_admin" ON public.feed_posts;
CREATE POLICY "feed_update_author_admin" 
  ON public.feed_posts FOR UPDATE 
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "feed_delete_author_admin" ON public.feed_posts;
CREATE POLICY "feed_delete_author_admin" 
  ON public.feed_posts FOR DELETE 
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- 13.11 Banners & Locations RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view banners" ON public.banners;
CREATE POLICY "Public view banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public view legacy banners" ON public.platform_banners;
CREATE POLICY "Public view legacy banners" ON public.platform_banners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage legacy banners" ON public.platform_banners;
CREATE POLICY "Admins manage legacy banners" ON public.platform_banners FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public view locations" ON public.platform_locations;
CREATE POLICY "Public view locations" ON public.platform_locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage locations" ON public.platform_locations;
CREATE POLICY "Admins manage locations" ON public.platform_locations FOR ALL USING (public.is_admin(auth.uid()));

-- =========================================================================
-- SECTION 14: MISSING TABLES & COMPREHENSIVE PUBLIC RLS POLICIES
-- Ensures profiles, products, service_providers, blood_donors, job_seekers,
-- and job_circulars are initialized with full Public Access (ALLOW ALL).
-- =========================================================================

-- 14.1 blood_donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  blood_group TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  profession TEXT DEFAULT 'রক্তদাতা',
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'খাগড়াছড়ি',
  upazila TEXT NOT NULL DEFAULT 'খাগড়াছড়ি সদর',
  area TEXT,
  mahalla TEXT,
  last_donation_date TEXT,
  total_donations INT NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_contact TEXT,
  age INT DEFAULT 25,
  tax_vat_info TEXT,
  search_tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14.2 job_seekers
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT,
  candidate_code TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'Male',
  desired_job_title TEXT,
  skills_or_job_type TEXT,
  category TEXT DEFAULT 'সাধারণ',
  expected_salary TEXT,
  experience_years TEXT DEFAULT '১ বছর',
  experience TEXT DEFAULT '১ বছর',
  highest_education TEXT,
  education TEXT,
  skills TEXT[] DEFAULT '{}',
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'বাংলাদেশ',
  upazila TEXT,
  area TEXT,
  address TEXT,
  bio TEXT,
  photo_url TEXT,
  resume_url TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14.3 job_circulars
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'নিয়োগ বিজ্ঞপ্তি',
  job_title TEXT,
  company_name TEXT,
  company_or_poster TEXT,
  category TEXT NOT NULL DEFAULT 'সাধারণ',
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  salary TEXT,
  division TEXT DEFAULT 'চট্টগ্রাম',
  district TEXT NOT NULL DEFAULT 'বাংলাদেশ',
  upazila TEXT,
  area TEXT,
  vacancies_count INT DEFAULT 1,
  education TEXT,
  experience TEXT,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  deadline TEXT,
  contact_phone TEXT,
  phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  submission_type TEXT DEFAULT 'detailed',
  circular_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14.4 Enable RLS & Least-Privilege Row Level Security Policies
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;

-- blood_donors
DROP POLICY IF EXISTS "Public full access to blood_donors" ON public.blood_donors;
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

-- job_seekers
DROP POLICY IF EXISTS "Public full access to job_seekers" ON public.job_seekers;
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

-- job_circulars
DROP POLICY IF EXISTS "Public full access to job_circulars" ON public.job_circulars;
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

-- 14.5 Target & Least-Privilege Role Grants (No Blanket anon Grants)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Public users (anon): read only genuinely public catalog tables
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.sellers TO anon;
GRANT SELECT ON TABLE public.service_providers TO anon;
GRANT SELECT ON TABLE public.blood_donors TO anon;
GRANT SELECT ON TABLE public.job_seekers TO anon;
GRANT SELECT ON TABLE public.job_circulars TO anon;
GRANT SELECT ON TABLE public.banners TO anon;
GRANT SELECT ON TABLE public.platform_banners TO anon;

-- Sensitive tables: Explicitly revoking from anon
REVOKE ALL ON TABLE public.user_private_kyc FROM anon;
REVOKE ALL ON TABLE public.admin_roles FROM anon;
REVOKE ALL ON TABLE public.admin_activity_logs FROM anon;
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.payment_transactions FROM anon;

-- Authenticated users: Governed strictly by RLS policies
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

-- Service role: Administrative access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

