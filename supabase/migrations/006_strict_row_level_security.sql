-- =========================================================================
-- JHADIMADI.COM - SUPABASE ROW LEVEL SECURITY (RLS) HARDENING
-- Migration 006: Comprehensive Principle of Least Privilege Enforcement
-- =========================================================================

-- Ensure Row Level Security is explicitly activated on every single table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
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

-- =========================================================================
-- 1. PROFILES & CITIZEN DIRECTORY
-- =========================================================================
-- Public read of non-sensitive display profile for marketplace & blood donor discovery
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Authenticated user can ONLY insert their own matching profile
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can ONLY update their own profile; Users CANNOT elevate their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (
    -- If non-admin user is updating, their role must remain unchanged
    (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- Only Super Admin can delete profiles
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" 
  ON public.profiles FOR DELETE 
  USING (public.is_super_admin(auth.uid()));

-- =========================================================================
-- 2. USER_PRIVATE_KYC (Sensitive NID, Father/Mother Name, Selfie & PII)
-- =========================================================================
-- STRICTLY PRIVATE: Only the document owner OR authorized admin can view
DROP POLICY IF EXISTS "Owner and Admin view private KYC" ON public.user_private_kyc;
DROP POLICY IF EXISTS "kyc_select_owner_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_select_owner_admin" 
  ON public.user_private_kyc FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Only authenticated users can submit their own KYC
DROP POLICY IF EXISTS "Owner submit private KYC" ON public.user_private_kyc;
DROP POLICY IF EXISTS "kyc_insert_owner" ON public.user_private_kyc;
CREATE POLICY "kyc_insert_owner" 
  ON public.user_private_kyc FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND 
    verification_status = 'pending'
  );

-- Owner can update their KYC only while status is 'unverified' or 'revision_requested'
-- Admins can update status (verify, reject)
DROP POLICY IF EXISTS "Owner and Admin update private KYC" ON public.user_private_kyc;
DROP POLICY IF EXISTS "kyc_update_owner_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_update_owner_admin" 
  ON public.user_private_kyc FOR UPDATE 
  USING (
    (auth.uid() = user_id AND verification_status IN ('unverified', 'revision_requested', 'pending')) OR 
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    -- Users cannot self-approve their verification status
    (auth.uid() = user_id AND verification_status = 'pending') OR 
    public.is_admin(auth.uid())
  );

-- Only Super Admin can delete KYC records
DROP POLICY IF EXISTS "kyc_delete_admin" ON public.user_private_kyc;
CREATE POLICY "kyc_delete_admin" 
  ON public.user_private_kyc FOR DELETE 
  USING (public.is_super_admin(auth.uid()));

-- =========================================================================
-- 3. PRODUCTS (E-Commerce Catalog)
-- =========================================================================
-- Public can only view ACTIVE products; Sellers can view their own; Admins view all
DROP POLICY IF EXISTS "Public view products" ON public.products;
DROP POLICY IF EXISTS "products_select_public_seller" ON public.products;
CREATE POLICY "products_select_public_seller" 
  ON public.products FOR SELECT 
  USING (
    is_active = TRUE OR 
    auth.uid() = seller_id OR 
    public.is_admin(auth.uid())
  );

-- Only authenticated sellers can create products linked to their user_id
DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
CREATE POLICY "products_insert_seller" 
  ON public.products FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    (auth.uid() = seller_id OR public.is_admin(auth.uid()))
  );

-- Only the product owner or administrator can modify products
DROP POLICY IF EXISTS "Sellers manage own products" ON public.products;
DROP POLICY IF EXISTS "products_update_seller_admin" ON public.products;
CREATE POLICY "products_update_seller_admin" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = seller_id OR public.is_admin(auth.uid()));

-- Only seller owner or admin can delete products
DROP POLICY IF EXISTS "products_delete_seller_admin" ON public.products;
CREATE POLICY "products_delete_seller_admin" 
  ON public.products FOR DELETE 
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

-- =========================================================================
-- 4. ORDERS & ORDER ITEMS (Customer Purchase Privacy)
-- =========================================================================
-- Customers view ONLY their own orders; Admins view all
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_admin" ON public.orders;
CREATE POLICY "orders_select_owner_admin" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));

-- Authenticated customers can create orders for themselves
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

-- Customers can ONLY cancel an order if status is still 'Pending'
-- Sensitive order status transitions (Processing, Delivered) are strictly ADMIN ONLY
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

-- Order Items: Viewable and insertable only for authorized order owner
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

-- =========================================================================
-- 5. SERVICE PROVIDERS & PORTFOLIOS (Sellers & Technicians)
-- =========================================================================
-- Public can browse active service providers
DROP POLICY IF EXISTS "Public view active providers" ON public.service_providers;
DROP POLICY IF EXISTS "providers_select_public" ON public.service_providers;
CREATE POLICY "providers_select_public" 
  ON public.service_providers FOR SELECT 
  USING (is_available = TRUE OR auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Authenticated technicians create their own provider record
DROP POLICY IF EXISTS "providers_insert_owner" ON public.service_providers;
CREATE POLICY "providers_insert_owner" 
  ON public.service_providers FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

-- Technicians update their own rate, bio & skills; Admins can update verification
DROP POLICY IF EXISTS "Providers manage own profile" ON public.service_providers;
DROP POLICY IF EXISTS "providers_update_owner_admin" ON public.service_providers;
CREATE POLICY "providers_update_owner_admin" 
  ON public.service_providers FOR UPDATE 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (
    -- Technicians cannot self-assign blueTickActive
    (auth.uid() = user_id AND blue_tick_active = (SELECT sp.blue_tick_active FROM public.service_providers sp WHERE sp.id = id)) OR 
    public.is_admin(auth.uid())
  );

-- Provider Portfolios
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

-- =========================================================================
-- 6. SERVICE BOOKINGS & ESCROW
-- =========================================================================
-- Only customer, assigned provider, or admin can view booking details
DROP POLICY IF EXISTS "Participants view bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "bookings_select_participants" ON public.service_bookings;
CREATE POLICY "bookings_select_participants" 
  ON public.service_bookings FOR SELECT 
  USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id) OR 
    public.is_admin(auth.uid())
  );

-- Customer creates booking with initial Pending state
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

-- Customer can cancel before acceptance
DROP POLICY IF EXISTS "bookings_update_customer_cancel" ON public.service_bookings;
CREATE POLICY "bookings_update_customer_cancel" 
  ON public.service_bookings FOR UPDATE 
  USING (auth.uid() = customer_id AND status = 'Pending')
  WITH CHECK (auth.uid() = customer_id AND status = 'Cancelled');

-- Provider can accept or update task progress
DROP POLICY IF EXISTS "bookings_update_provider_progress" ON public.service_bookings;
CREATE POLICY "bookings_update_provider_progress" 
  ON public.service_bookings FOR UPDATE 
  USING (
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id)
  )
  WITH CHECK (
    -- Providers CANNOT touch escrow status directly (only Admin/Automated webhook)
    auth.uid() IN (SELECT sp.user_id FROM public.service_providers sp WHERE sp.id = provider_id) AND
    escrow_status = (SELECT sb.escrow_status FROM public.service_bookings sb WHERE sb.id = id)
  );

-- Admin can manage all bookings and release/refund escrow
DROP POLICY IF EXISTS "Admins manage bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "bookings_all_admin" ON public.service_bookings;
CREATE POLICY "bookings_all_admin" 
  ON public.service_bookings FOR ALL 
  USING (public.is_admin(auth.uid()));

-- =========================================================================
-- 7. ADMIN ROLES & ADMIN ACTIVITY LOGS (RBAC & Audit Trail)
-- =========================================================================
-- Users view their own role; Admins view all roles
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_select" ON public.admin_roles;
CREATE POLICY "admin_roles_select" 
  ON public.admin_roles FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- ONLY Super Admin can insert, update, or delete admin roles
DROP POLICY IF EXISTS "Only Super Admin can insert admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_insert_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_insert_super_admin" 
  ON public.admin_roles FOR INSERT 
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

DROP POLICY IF EXISTS "Only Super Admin can update admin roles" ON public.admin_roles;
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

DROP POLICY IF EXISTS "Only Super Admin can delete admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_delete_super_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_delete_super_admin" 
  ON public.admin_roles FOR DELETE 
  USING (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- Activity Logs: ONLY Admins can view
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "activity_logs_select_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_select_admin" 
  ON public.admin_activity_logs FOR SELECT 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- Authenticated admins insert activity logs
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_insert_admin" 
  ON public.admin_activity_logs FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = admin_user_id OR 
      public.is_admin(auth.uid())
    )
  );

-- Logs are IMMUTABLE: NO UPDATE OR DELETE POLICIES CREATED (guarantees tamper-proof audit trail)

-- =========================================================================
-- 8. PAYMENT TRANSACTIONS (Financial Ledger)
-- =========================================================================
-- Users view only their own transactions; Admins view all
DROP POLICY IF EXISTS "Users view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "transactions_select_user_admin" ON public.payment_transactions;
CREATE POLICY "transactions_select_user_admin" 
  ON public.payment_transactions FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Authenticated users insert transactions for their own account
DROP POLICY IF EXISTS "Authenticated users insert transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "transactions_insert_user" ON public.payment_transactions;
CREATE POLICY "transactions_insert_user" 
  ON public.payment_transactions FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND 
    status = 'Pending'
  );

-- ONLY Admins can verify, reconcile, or update transaction status
DROP POLICY IF EXISTS "transactions_update_admin" ON public.payment_transactions;
CREATE POLICY "transactions_update_admin" 
  ON public.payment_transactions FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 9. COMPLAINTS & REVIEWS
-- =========================================================================
-- Complainants and admins view complaints
DROP POLICY IF EXISTS "Complainants and admins view complaints" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_select_owner_admin" ON public.complaints_reviews;
CREATE POLICY "complaints_select_owner_admin" 
  ON public.complaints_reviews FOR SELECT 
  USING (auth.uid() = complainant_id OR public.is_admin(auth.uid()));

-- Authenticated users submit complaints
DROP POLICY IF EXISTS "Anyone can submit a complaint" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_insert_authenticated" ON public.complaints_reviews;
CREATE POLICY "complaints_insert_authenticated" 
  ON public.complaints_reviews FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = complainant_id AND 
    status = 'Pending'
  );

-- ONLY Admins can update status, add resolution notes, or dismiss complaints
DROP POLICY IF EXISTS "Admins moderate complaints" ON public.complaints_reviews;
DROP POLICY IF EXISTS "complaints_update_admin" ON public.complaints_reviews;
CREATE POLICY "complaints_update_admin" 
  ON public.complaints_reviews FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 10. PUJA GIFT WELFARE APPLICATIONS
-- =========================================================================
-- Applicants view their own application; Admins view all
DROP POLICY IF EXISTS "Applicants and admins view applications" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_select_applicant_admin" ON public.puja_gift_applications;
CREATE POLICY "puja_select_applicant_admin" 
  ON public.puja_gift_applications FOR SELECT 
  USING (auth.uid() = applicant_uid OR public.is_admin(auth.uid()));

-- Authenticated applicants submit application with initial 'Pending' status
DROP POLICY IF EXISTS "Anyone can submit puja gift application" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_insert_applicant" ON public.puja_gift_applications;
CREATE POLICY "puja_insert_applicant" 
  ON public.puja_gift_applications FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = applicant_uid AND 
    status = 'Pending'
  );

-- ONLY Admins can approve, reject, or mark delivered
DROP POLICY IF EXISTS "Admins manage puja gift applications" ON public.puja_gift_applications;
DROP POLICY IF EXISTS "puja_update_admin" ON public.puja_gift_applications;
CREATE POLICY "puja_update_admin" 
  ON public.puja_gift_applications FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================================
-- 11. PROPERTY LISTINGS & COMMUNITY FEED
-- =========================================================================
-- Property: Public view active, owner & admin manage
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

-- Community Feed: Public view approved, authors & admin manage
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
