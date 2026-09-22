-- =========================================================================
-- JHADIMADI.COM - SUPABASE POSTGRESQL DATABASE MIGRATION 007
-- Future-Proof Orders, Users, and Service Bookings Schema
-- Phase: Promotional / Beta Phase (0% Commission, COD & Direct Contact)
-- =========================================================================
-- This migration pre-defines all optional fields for future payment gateway
-- integration (bKash, Nagad, Rocket, Upay, Cards) and platform commission (5%-10%)
-- so the database will never need a destructive redesign when monetized.

-- 1. FUTURE-PROOFING ORDERS TABLE (E-Commerce & Food/Grocery)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'exempt' CHECK (commission_status IN ('exempt', 'pending', 'collected', 'waived')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cod_unpaid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS gateway_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gateway_payload JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_beta_phase BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS order_channel TEXT DEFAULT 'COD' CHECK (order_channel IN ('COD', 'Direct_Contact', 'WhatsApp', 'Phone', 'Online_Gateway')),
  ADD COLUMN IF NOT EXISTS customer_otp_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_verification_code TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vendor_phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS direct_contact_timestamp TIMESTAMPTZ DEFAULT NULL;

-- Indexes for efficient querying by channel, payment status and beta auditing
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_channel ON public.orders(order_channel);
CREATE INDEX IF NOT EXISTS idx_orders_is_beta_phase ON public.orders(is_beta_phase);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_trx ON public.orders(gateway_transaction_id);

-- 2. FUTURE-PROOFING PROFILES / USERS TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS commission_rate_discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_payout_gateway TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_payout_account TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_commission_due NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_beta_tester ON public.profiles(is_beta_tester);

-- 3. FUTURE-PROOFING SERVICE_BOOKINGS TABLE
ALTER TABLE public.service_bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cod_unpaid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS gateway_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_beta_phase BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS booking_channel TEXT DEFAULT 'Direct_Contact' CHECK (booking_channel IN ('Direct_Contact', 'WhatsApp', 'Phone', 'InApp_Booking')),
  ADD COLUMN IF NOT EXISTS customer_otp_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_service_bookings_channel ON public.service_bookings(booking_channel);
CREATE INDEX IF NOT EXISTS idx_service_bookings_beta ON public.service_bookings(is_beta_phase);

-- 4. BETA PHASE COMMENT AUDIT & DOCUMENTATION
COMMENT ON TABLE public.orders IS 'Store customer orders. In current Beta Phase, commission is 0% (exempt) and payments are strictly COD or Direct Contact.';
COMMENT ON COLUMN public.orders.commission_amount IS 'Future platform commission (5%-10%). Currently 0 during Beta promotional phase.';
COMMENT ON COLUMN public.orders.gateway_transaction_id IS 'Pre-defined for future bKash/Nagad/Rocket gateway TRX IDs.';
COMMENT ON COLUMN public.orders.customer_otp_verified IS 'Phone number verified via SMS OTP to prevent spam and fake orders.';
