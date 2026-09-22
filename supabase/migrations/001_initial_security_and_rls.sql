-- ====================================================
-- JHADIMADI.COM SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Production Security Hardening Migration
-- ====================================================

-- 1. Enable RLS on Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  division TEXT,
  district TEXT,
  upazila TEXT,
  mahalla TEXT,
  avatar_url TEXT,
  is_nid_verified BOOLEAN DEFAULT FALSE,
  is_paid_member BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Orders Table RLS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'COD',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can view and manage all orders" ON public.orders;
CREATE POLICY "Admins can view and manage all orders" 
  ON public.orders FOR ALL 
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- 3. Freelancer Directory & Verification Requests Table RLS
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  profession TEXT,
  nid_number TEXT,
  nid_front_url TEXT,
  nid_back_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own verifications" ON public.verifications;
CREATE POLICY "Users can view their own verifications" 
  ON public.verifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit their own verification" ON public.verifications;
CREATE POLICY "Users can submit their own verification" 
  ON public.verifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.verifications;
CREATE POLICY "Admins can manage all verifications" 
  ON public.verifications FOR ALL 
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- 4. Products Table RLS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INT DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Sellers can manage own products" ON public.products;
CREATE POLICY "Sellers can manage own products" 
  ON public.products FOR ALL 
  USING (auth.uid() = seller_id);

-- 5. Supabase Storage Security Policies
-- Secures the 'documents' and 'avatars' storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('nid_documents', 'nid_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: Public read, owner-only upload
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- NID Documents: Private, readable only by document owner and admin
DROP POLICY IF EXISTS "NID documents only accessible by owner and admin" ON storage.objects;
CREATE POLICY "NID documents only accessible by owner and admin" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can upload their own NID documents" ON storage.objects;
CREATE POLICY "Users can upload their own NID documents" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'nid_documents' AND 
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
