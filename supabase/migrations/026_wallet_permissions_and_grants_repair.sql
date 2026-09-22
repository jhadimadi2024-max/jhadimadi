-- ============================================================================
-- JHADIMADI.COM — MIGRATION 026: J-PAY WALLET PERMISSIONS & RLS REPAIR SCRIPT
-- Migration: 026_wallet_permissions_and_grants_repair.sql
-- Target Project: https://dwhsqftllkximhfvwqak.supabase.co
-- SQL Editor: https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
--
-- Description:
--   Grants full table and execution permissions on wallets, wallet_transactions,
--   wallet_add_money_requests, and wallet_withdrawals to anon and authenticated roles.
--   Permanently fixes Supabase 42501 ("permission denied for table wallets") errors.
-- ============================================================================

-- 1. Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;

-- 2. Table Ownership & Grants
ALTER TABLE IF EXISTS public.wallets OWNER TO postgres;
ALTER TABLE IF EXISTS public.wallet_transactions OWNER TO postgres;
ALTER TABLE IF EXISTS public.wallet_add_money_requests OWNER TO postgres;
ALTER TABLE IF EXISTS public.wallet_withdrawals OWNER TO postgres;

GRANT ALL ON TABLE public.wallets TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_transactions TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_add_money_requests TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.wallet_withdrawals TO anon, authenticated, service_role, postgres;

-- 3. Sequence Grants
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- 4. RPC Function Execution Grants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_add_money_approve') THEN
    GRANT EXECUTE ON FUNCTION public.wallet_add_money_approve(UUID, UUID) TO anon, authenticated, service_role, postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_p2p_transfer') THEN
    GRANT EXECUTE ON FUNCTION public.wallet_p2p_transfer(UUID, TEXT, NUMERIC, TEXT) TO anon, authenticated, service_role, postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_internal_purchase') THEN
    GRANT EXECUTE ON FUNCTION public.wallet_internal_purchase(UUID, NUMERIC, TEXT, UUID, TEXT) TO anon, authenticated, service_role, postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wallet_withdrawal_approve') THEN
    GRANT EXECUTE ON FUNCTION public.wallet_withdrawal_approve(UUID, UUID) TO anon, authenticated, service_role, postgres;
  END IF;
END $$;

-- 5. RLS Policies Configuration
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_add_money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_universal_access" ON public.wallets;
CREATE POLICY "wallets_universal_access" ON public.wallets
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_transactions_universal_access" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_universal_access" ON public.wallet_transactions
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_add_money_requests_universal_access" ON public.wallet_add_money_requests;
CREATE POLICY "wallet_add_money_requests_universal_access" ON public.wallet_add_money_requests
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_withdrawals_universal_access" ON public.wallet_withdrawals;
CREATE POLICY "wallet_withdrawals_universal_access" ON public.wallet_withdrawals
  FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
