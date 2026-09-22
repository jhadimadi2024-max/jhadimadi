-- ============================================================================
-- JHADIMADI.COM — MIGRATION 025: J-PAY WALLET ATOMIC LEDGER & SECURITY SCHEMA
-- Migration: 025_jpay_wallet_atomic.sql
-- Description:
--   1. Secure wallets table with non-negative balance constraint (CHECK balance >= 0)
--   2. Immutable double-entry transaction ledger (wallet_transactions)
--   3. Add-Money requests with admin approval flow (wallet_add_money_requests)
--   4. Cashout / Withdrawal requests (wallet_withdrawals)
--   5. Atomic PL/pgSQL RPC functions for concurrency-safe balance updates
--   6. Strict Row Level Security (RLS) policies
-- ============================================================================

-- 1. WALLETS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  pending_escrow NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (pending_escrow >= 0),
  total_deposited NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'BDT',
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant user wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_phone ON public.wallets(phone);

-- 2. IMMUTABLE TRANSACTION LEDGER
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'add_money', 
    'transfer_in', 
    'transfer_out', 
    'purchase', 
    'escrow_hold', 
    'escrow_release', 
    'earning', 
    'withdrawal', 
    'refund', 
    'fee'
  )),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance_before NUMERIC(14, 2) NOT NULL,
  balance_after NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'rejected')),
  payment_method TEXT,
  trx_id TEXT,
  sender_number TEXT,
  receiver_number TEXT,
  counterpart_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);

-- 3. ADD MONEY REQUESTS
CREATE TABLE IF NOT EXISTS public.wallet_add_money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_money_user_id ON public.wallet_add_money_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_add_money_status ON public.wallet_add_money_requests(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_add_money_unique_trx ON public.wallet_add_money_requests(trx_id, payment_method) WHERE status != 'rejected';

-- 4. WITHDRAWALS / CASHOUT REQUESTS
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payout_method TEXT NOT NULL,
  payout_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.wallet_withdrawals(status);

-- 5. TRIGGER: AUTO-CREATE WALLET ON USER CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, phone, balance)
  VALUES (NEW.id, NEW.phone, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 6. ATOMIC RPC FUNCTIONS

-- 6.1 Approve Add-Money Request
CREATE OR REPLACE FUNCTION public.wallet_add_money_approve(
  p_request_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_wallet RECORD;
  v_before NUMERIC;
  v_after NUMERIC;
  v_tx_id UUID;
BEGIN
  -- Lock the request row
  SELECT * INTO v_req FROM public.wallet_add_money_requests
  WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Add-money request not found');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Request has already been processed');
  END IF;

  -- Lock user wallet
  SELECT * INTO v_wallet FROM public.wallets
  WHERE user_id = v_req.user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (v_req.user_id, 0.00)
    RETURNING * INTO v_wallet;
  END IF;

  v_before := v_wallet.balance;
  v_after := v_before + v_req.amount;

  -- Update wallet
  UPDATE public.wallets
  SET balance = v_after,
      total_deposited = total_deposited + v_req.amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Insert ledger transaction
  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    status,
    payment_method,
    trx_id,
    sender_number,
    reference_id,
    note
  ) VALUES (
    v_wallet.id,
    v_req.user_id,
    'add_money',
    v_req.amount,
    v_before,
    v_after,
    'completed',
    v_req.payment_method,
    v_req.trx_id,
    v_req.sender_number,
    p_request_id::TEXT,
    'Add money approved by admin'
  ) RETURNING id INTO v_tx_id;

  -- Update request status
  UPDATE public.wallet_add_money_requests
  SET status = 'approved',
      approved_by = p_admin_id,
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Add money approved successfully',
    'balance_after', v_after,
    'transaction_id', v_tx_id
  );
END;
$$;

-- 6.2 Atomic P2P Transfer Between Users
CREATE OR REPLACE FUNCTION public.wallet_p2p_transfer(
  p_sender_id UUID,
  p_receiver_identifier TEXT,
  p_amount NUMERIC,
  p_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_wallet RECORD;
  v_receiver_wallet RECORD;
  v_receiver_user_id UUID;
  v_sender_before NUMERIC;
  v_sender_after NUMERIC;
  v_receiver_before NUMERIC;
  v_receiver_after NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid transfer amount');
  END IF;

  -- Find receiver by phone or auth user ID
  IF p_receiver_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_receiver_user_id := p_receiver_identifier::UUID;
  ELSE
    SELECT user_id INTO v_receiver_user_id
    FROM public.wallets
    WHERE phone = p_receiver_identifier
    LIMIT 1;

    IF v_receiver_user_id IS NULL THEN
      SELECT id INTO v_receiver_user_id
      FROM auth.users
      WHERE phone = p_receiver_identifier OR email = p_receiver_identifier
      LIMIT 1;
    END IF;
  END IF;

  IF v_receiver_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Receiver user not found');
  END IF;

  IF p_sender_id = v_receiver_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot transfer to own account');
  END IF;

  -- Lock sender wallet
  SELECT * INTO v_sender_wallet FROM public.wallets
  WHERE user_id = p_sender_id FOR UPDATE;

  IF NOT FOUND OR v_sender_wallet.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sender wallet unavailable or frozen');
  END IF;

  IF v_sender_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- Lock receiver wallet
  SELECT * INTO v_receiver_wallet FROM public.wallets
  WHERE user_id = v_receiver_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (v_receiver_user_id, 0.00)
    RETURNING * INTO v_receiver_wallet;
  END IF;

  v_sender_before := v_sender_wallet.balance;
  v_sender_after := v_sender_before - p_amount;
  v_receiver_before := v_receiver_wallet.balance;
  v_receiver_after := v_receiver_before + p_amount;

  -- Deduct from sender
  UPDATE public.wallets
  SET balance = v_sender_after,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE id = v_sender_wallet.id;

  -- Credit receiver
  UPDATE public.wallets
  SET balance = v_receiver_after,
      total_deposited = total_deposited + p_amount,
      updated_at = NOW()
  WHERE id = v_receiver_wallet.id;

  -- Record sender ledger debit
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    counterpart_user_id, note
  ) VALUES (
    v_sender_wallet.id, p_sender_id, 'transfer_out', p_amount, v_sender_before, v_sender_after,
    v_receiver_user_id, COALESCE(p_note, 'P2P Send Money')
  );

  -- Record receiver ledger credit
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    counterpart_user_id, note
  ) VALUES (
    v_receiver_wallet.id, v_receiver_user_id, 'transfer_in', p_amount, v_receiver_before, v_receiver_after,
    p_sender_id, COALESCE(p_note, 'P2P Received Money')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transfer completed successfully',
    'new_balance', v_sender_after
  );
END;
$$;

-- 6.3 Internal Purchase / Escrow Payment
CREATE OR REPLACE FUNCTION public.wallet_internal_purchase(
  p_buyer_id UUID,
  p_seller_id UUID,
  p_amount NUMERIC,
  p_order_ref TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_wallet RECORD;
  v_seller_wallet RECORD;
  v_before NUMERIC;
  v_after NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid purchase amount');
  END IF;

  -- Lock buyer wallet
  SELECT * INTO v_buyer_wallet FROM public.wallets
  WHERE user_id = p_buyer_id FOR UPDATE;

  IF NOT FOUND OR v_buyer_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance');
  END IF;

  v_before := v_buyer_wallet.balance;
  v_after := v_before - p_amount;

  -- Deduct from buyer
  UPDATE public.wallets
  SET balance = v_after,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE id = v_buyer_wallet.id;

  -- Record buyer transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    counterpart_user_id, reference_id, note
  ) VALUES (
    v_buyer_wallet.id, p_buyer_id, 'purchase', p_amount, v_before, v_after,
    p_seller_id, p_order_ref, COALESCE(p_description, 'Order purchase payment')
  );

  -- Credit seller if provided
  IF p_seller_id IS NOT NULL AND p_seller_id != p_buyer_id THEN
    SELECT * INTO v_seller_wallet FROM public.wallets
    WHERE user_id = p_seller_id FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.wallets (user_id, balance) VALUES (p_seller_id, 0.00)
      RETURNING * INTO v_seller_wallet;
    END IF;

    UPDATE public.wallets
    SET balance = balance + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE id = v_seller_wallet.id;

    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, type, amount, balance_before, balance_after,
      counterpart_user_id, reference_id, note
    ) VALUES (
      v_seller_wallet.id, p_seller_id, 'earning', p_amount,
      v_seller_wallet.balance, v_seller_wallet.balance + p_amount,
      p_buyer_id, p_order_ref, 'Sale revenue credited'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Purchase paid successfully with J-Pay wallet',
    'new_balance', v_after
  );
END;
$$;

-- 6.4 Withdrawal Approval
CREATE OR REPLACE FUNCTION public.wallet_withdrawal_approve(
  p_withdrawal_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_w RECORD;
  v_wallet RECORD;
  v_before NUMERIC;
  v_after NUMERIC;
BEGIN
  SELECT * INTO v_w FROM public.wallet_withdrawals
  WHERE id = p_withdrawal_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Withdrawal request not found');
  END IF;

  IF v_w.status != 'pending' AND v_w.status != 'processing' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Withdrawal already completed or rejected');
  END IF;

  SELECT * INTO v_wallet FROM public.wallets
  WHERE user_id = v_w.user_id FOR UPDATE;

  IF NOT FOUND OR v_wallet.balance < v_w.amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'User does not have sufficient balance for withdrawal');
  END IF;

  v_before := v_wallet.balance;
  v_after := v_before - v_w.amount;

  UPDATE public.wallets
  SET balance = v_after,
      total_withdrawn = total_withdrawn + v_w.amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    payment_method, receiver_number, reference_id, note
  ) VALUES (
    v_wallet.id, v_w.user_id, 'withdrawal', v_w.amount, v_before, v_after,
    v_w.payout_method, v_w.payout_number, p_withdrawal_id::TEXT, 'Cashout completed'
  );

  UPDATE public.wallet_withdrawals
  SET status = 'approved',
      processed_by = p_admin_id,
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Withdrawal approved and balance debited',
    'new_balance', v_after
  );
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_add_money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

-- Wallets RLS
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Transactions RLS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Add Money Requests RLS
DROP POLICY IF EXISTS "Users can view own add money requests" ON public.wallet_add_money_requests;
CREATE POLICY "Users can view own add money requests"
  ON public.wallet_add_money_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create add money requests" ON public.wallet_add_money_requests;
CREATE POLICY "Users can create add money requests"
  ON public.wallet_add_money_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Withdrawals RLS
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.wallet_withdrawals;
CREATE POLICY "Users can view own withdrawals"
  ON public.wallet_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON public.wallet_withdrawals;
CREATE POLICY "Users can create withdrawals"
  ON public.wallet_withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
