-- ============================================================================
-- JHADIMADI.COM — SUPABASE SQL DATABASE & SECURITY SCHEMA (COMPACT VERSION)
-- Single Backend: Supabase Only (Auth, PostgreSQL, RLS, Storage)
-- Architecture: Strictly Enforced RBAC, Server-Side Validation, and Secure RLS
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'inactive', 'suspended', 'pending', 'deleted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'seller', 'freelancer', 'service_provider', 'member', 'moderator', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: REUSABLE UTILITIES & TRIGGER FUNCTIONS
-- ============================================================================

-- 3.1 Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: CORE TABLES (profiles & user_roles)
-- ============================================================================

-- 4.1 Master Profiles Table (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  district TEXT,
  upazila TEXT,
  address TEXT,
  bio TEXT,
  account_status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 4.2 User Roles Table (1 User -> Multiple Roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- STEP 5: CONDITIONAL ROLE PROFILE TABLES
-- ============================================================================

-- 5.1 Seller Profiles
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_phone TEXT,
  business_address TEXT,
  district TEXT,
  upazila TEXT,
  business_logo TEXT,
  business_cover TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 Freelancer Profiles
CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_title TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(10,2),
  bio TEXT,
  portfolio_url TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.3 Service Provider Profiles
CREATE TABLE IF NOT EXISTS public.service_provider_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  service_areas TEXT[] DEFAULT '{}',
  phone TEXT,
  nid_verified BOOLEAN DEFAULT FALSE,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.4 Member Profiles
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id TEXT UNIQUE,
  membership_tier TEXT DEFAULT 'general',
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: MARKETPLACE & BUSINESS TABLES
-- ============================================================================

-- 6.1 Products Table (Price, Stock & Status strictly enforced)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(12,2) CHECK (discount_price >= 0 AND discount_price <= price),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit TEXT DEFAULT 'piece',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);

-- 6.2 Product Images Table (Multiple images per product)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- 6.3 Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- 6.4 Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_number TEXT UNIQUE NOT NULL DEFAULT ('ORD-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'unpaid', 'paid', 'cod_unpaid', 'partially_paid', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'COD',
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
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 6.5 Order Items Table (Server-side price snapshot and stock check)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- 6.6 Security Logs Table (Auditing without storing passwords/secrets)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- ============================================================================
-- STEP 7: SECURITY HELPER FUNCTIONS
-- ============================================================================

-- 7.1 Check if a user possesses a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, required_role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = required_role
  );
$$;

-- 7.2 Check if user is an admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role IN ('admin', 'super_admin')
  );
$$;

-- 7.3 Check if user is staff (moderator, admin, or super_admin)
CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role IN ('moderator', 'admin', 'super_admin')
  );
$$;

-- 7.4 Check if user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
$$;

-- ============================================================================
-- STEP 8: AUTOMATIC USER CREATION & ROLE ASSIGNMENT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Insert Profile from Auth Metadata
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    avatar_url,
    account_status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'active'::public.account_status
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();

  -- 2. Default Role: 'customer'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Audit log user creation
  INSERT INTO public.security_logs (user_id, action, details)
  VALUES (NEW.id, 'USER_REGISTERED', jsonb_build_object('email', NEW.email, 'provider', NEW.raw_app_meta_data->>'provider'));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 9: SECURE SERVER-SIDE ROLE ASSIGNMENT (Super Admin Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role public.user_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only super_admin may execute this function
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can change user roles.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Security log the privilege alteration
  INSERT INTO public.security_logs (user_id, action, details)
  VALUES (
    auth.uid(),
    'ROLE_ASSIGNED',
    jsonb_build_object('target_user', target_user_id, 'assigned_role', new_role)
  );
END;
$$;

-- ============================================================================
-- STEP 10: SERVER-SIDE PRICE, STOCK & ORDER INTEGRITY TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_order_item_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_real_price NUMERIC(12,2);
  v_real_stock INTEGER;
  v_seller_id UUID;
BEGIN
  -- Fetch actual price and stock from products table directly to avoid frontend tampering
  SELECT 
    COALESCE(discount_price, price), 
    stock, 
    seller_id 
  INTO 
    v_real_price, 
    v_real_stock, 
    v_seller_id
  FROM public.products
  WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  IF v_real_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient product stock.';
  END IF;

  -- Overwrite price with database authoritative values
  NEW.unit_price := v_real_price;
  NEW.subtotal := v_real_price * NEW.quantity;
  NEW.seller_id := v_seller_id;

  -- Atomically deduct stock
  UPDATE public.products
  SET stock = stock - NEW.quantity, updated_at = NOW()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_integrity ON public.order_items;
CREATE TRIGGER trg_order_item_integrity
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_integrity();

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_seller_updated_at ON public.seller_profiles;
CREATE TRIGGER trg_seller_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_freelancer_updated_at ON public.freelancer_profiles;
CREATE TRIGGER trg_freelancer_updated_at BEFORE UPDATE ON public.freelancer_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sp_updated_at ON public.service_provider_profiles;
CREATE TRIGGER trg_sp_updated_at BEFORE UPDATE ON public.service_provider_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_member_updated_at ON public.member_profiles;
CREATE TRIGGER trg_member_updated_at BEFORE UPDATE ON public.member_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- STEP 11: ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 11.1 Profiles Policies
CREATE POLICY "Public can view basic active profiles"
  ON public.profiles FOR SELECT
  USING (account_status = 'active');

CREATE POLICY "Users can view and update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view and manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_staff(auth.uid()));

-- 11.2 User Roles Policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Only Super Admins can alter roles directly"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 11.3 Role Profiles Policies (Seller, Freelancer, Service Provider, Member)
-- Seller
CREATE POLICY "Public can view approved seller profiles"
  ON public.seller_profiles FOR SELECT
  USING (verification_status = 'approved' OR auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can insert own seller profile"
  ON public.seller_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own seller profile"
  ON public.seller_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can manage all seller profiles"
  ON public.seller_profiles FOR ALL
  USING (public.is_staff(auth.uid()));

-- Freelancer
CREATE POLICY "Public can view approved freelancer profiles"
  ON public.freelancer_profiles FOR SELECT
  USING (verification_status = 'approved' OR auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can insert own freelancer profile"
  ON public.freelancer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own freelancer profile"
  ON public.freelancer_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can manage all freelancer profiles"
  ON public.freelancer_profiles FOR ALL
  USING (public.is_staff(auth.uid()));

-- Service Provider
CREATE POLICY "Public can view approved service provider profiles"
  ON public.service_provider_profiles FOR SELECT
  USING (verification_status = 'approved' OR auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can insert own service provider profile"
  ON public.service_provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own service provider profile"
  ON public.service_provider_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can manage all service provider profiles"
  ON public.service_provider_profiles FOR ALL
  USING (public.is_staff(auth.uid()));

-- Member
CREATE POLICY "Public can view approved member profiles"
  ON public.member_profiles FOR SELECT
  USING (verification_status = 'approved' OR auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can insert own member profile"
  ON public.member_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own member profile"
  ON public.member_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can manage all member profiles"
  ON public.member_profiles FOR ALL
  USING (public.is_staff(auth.uid()));

-- 11.4 Products & Product Images Policies
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (is_published = TRUE OR auth.uid() = seller_id OR public.is_staff(auth.uid()));

CREATE POLICY "Sellers can manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = seller_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = seller_id OR public.is_staff(auth.uid()));

CREATE POLICY "Public can view product images"
  ON public.product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage product images"
  ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
        AND (products.seller_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

-- 11.5 Services Policies
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (is_active = TRUE OR auth.uid() = provider_id OR public.is_staff(auth.uid()));

CREATE POLICY "Providers can manage own services"
  ON public.services FOR ALL
  USING (auth.uid() = provider_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = provider_id OR public.is_staff(auth.uid()));

-- 11.6 Orders Policies
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()));

CREATE POLICY "Customers can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Staff can update and manage orders"
  ON public.orders FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- 11.7 Order Items Policies
CREATE POLICY "Customers and Sellers can view their order items"
  ON public.order_items FOR SELECT
  USING (
    auth.uid() = seller_id
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
    OR public.is_staff(auth.uid())
  );

CREATE POLICY "Customers can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

-- 11.8 Security Logs Policies (Append-only for users, read own logs)
CREATE POLICY "Users can view only own security logs"
  ON public.security_logs FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Authenticated users can create security log"
  ON public.security_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Prevent any UPDATE or DELETE on security logs (Immutability guarantee)
-- Note: No UPDATE or DELETE policies are granted to anyone.

-- ============================================================================
-- STEP 12: SUPABASE STORAGE BUCKETS & ISOLATION POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('business-media', 'business-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('service-media', 'service-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('portfolio-files', 'portfolio-files', false, 20971520, NULL),
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Public reading of public buckets
CREATE POLICY "Public Read for Public Buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'business-media', 'product-images', 'service-media'));

-- Storage RLS: Users can only upload and modify within their own user_id folder
CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own files"
  ON storage.objects FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own files"
  ON storage.objects FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff can access and manage all files across all buckets
CREATE POLICY "Staff Full Access to Storage"
  ON storage.objects FOR ALL
  USING (public.is_staff(auth.uid()));
