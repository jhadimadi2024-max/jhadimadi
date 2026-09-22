/**
 * JHADIMADI.COM — J-PAY WALLET ATOMIC SERVICE (MIGRATION 025)
 * Connects frontend clients to Supabase wallets, wallet_transactions,
 * wallet_add_money_requests, wallet_withdrawals, and atomic backend endpoints.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export interface Wallet {
  id: string;
  userId: string;
  phone?: string;
  balance: number;
  pendingEscrow: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalSpent: number;
  totalEarned: number;
  currency: string;
  isFrozen: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId?: string;
  userId: string;
  type: 'add_money' | 'transfer_in' | 'transfer_out' | 'purchase' | 'escrow_hold' | 'escrow_release' | 'earning' | 'withdrawal' | 'refund' | 'fee';
  amount: number;
  fee?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'rejected';
  paymentMethod?: string;
  trxId?: string;
  senderNumber?: string;
  receiverNumber?: string;
  counterpartUserId?: string;
  referenceId?: string;
  note?: string;
  createdAt?: string;
}

export interface AddMoneyRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  senderNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  payoutMethod: string;
  payoutNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt?: string;
}

const LOCAL_STORAGE_WALLET_KEY = 'jhadimadi_jpay_wallet_v1';

class WalletService {
  /**
   * Helper to construct auth headers for backend endpoints
   */
  private async getAuthHeaders(userId?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      }
    } catch (_) {}

    const adminToken = typeof window !== 'undefined'
      ? (sessionStorage.getItem('jhadimadi_admin_token') || localStorage.getItem('jhadimadi_admin_token'))
      : null;
    if (adminToken) {
      headers['x-admin-secret'] = adminToken;
    }

    if (userId) {
      headers['x-user-id'] = String(userId);
    }

    return headers;
  }

  /**
   * Fetch live wallet for a user
   */
  async getWallet(userId?: string): Promise<{ success: boolean; wallet: Wallet; transactions: WalletTransaction[] }> {
    const effectiveUserId = userId || 'anonymous_user';

    // 1. Try direct Supabase query if configured
    if (isSupabaseConfigured && effectiveUserId && effectiveUserId !== 'anonymous_user') {
      try {
        const { data: sw, error: wErr } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (!wErr && sw) {
          const { data: stxs } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', effectiveUserId)
            .order('created_at', { ascending: false })
            .limit(30);

          const mappedWallet: Wallet = {
            id: sw.id,
            userId: sw.user_id,
            phone: sw.phone || '',
            balance: Number(sw.balance) || 0,
            pendingEscrow: Number(sw.pending_escrow) || 0,
            totalDeposited: Number(sw.total_deposited) || 0,
            totalWithdrawn: Number(sw.total_withdrawn) || 0,
            totalSpent: Number(sw.total_spent) || 0,
            totalEarned: Number(sw.total_earned) || 0,
            currency: sw.currency || 'BDT',
            isFrozen: Boolean(sw.is_frozen),
            createdAt: sw.created_at,
            updatedAt: sw.updated_at
          };

          const mappedTxs: WalletTransaction[] = (stxs || []).map((t: any) => ({
            id: t.id,
            walletId: t.wallet_id,
            userId: t.user_id,
            type: t.type,
            amount: Number(t.amount) || 0,
            fee: Number(t.fee) || 0,
            balanceBefore: Number(t.balance_before) || 0,
            balanceAfter: Number(t.balance_after) || 0,
            status: t.status,
            paymentMethod: t.payment_method,
            trxId: t.trx_id,
            senderNumber: t.sender_number,
            receiverNumber: t.receiver_number,
            counterpartUserId: t.counterpart_user_id,
            referenceId: t.reference_id,
            note: t.note,
            createdAt: t.created_at
          }));

          return { success: true, wallet: mappedWallet, transactions: mappedTxs };
        }
      } catch (sbErr) {
        console.warn('[WalletService] Supabase direct read warning, trying API route:', sbErr);
      }
    }

    // 2. Fetch via Backend Server API Route (/api/wallet/balance)
    try {
      const headers = await this.getAuthHeaders(effectiveUserId);
      const res = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(effectiveUserId)}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.wallet) {
          const w = json.wallet;
          const mappedWallet: Wallet = {
            id: w.id || `wallet_${effectiveUserId}`,
            userId: w.user_id || effectiveUserId,
            phone: w.phone || '',
            balance: Number(w.balance) || 0,
            pendingEscrow: Number(w.pending_escrow || json.pendingEscrow) || 0,
            totalDeposited: Number(w.total_deposited) || 0,
            totalWithdrawn: Number(w.total_withdrawn) || 0,
            totalSpent: Number(w.total_spent) || 0,
            totalEarned: Number(w.total_earned) || 0,
            currency: w.currency || 'BDT',
            isFrozen: Boolean(w.is_frozen),
            createdAt: w.created_at,
            updatedAt: w.updated_at
          };

          const mappedTxs: WalletTransaction[] = (json.transactions || []).map((t: any) => ({
            id: t.id,
            walletId: t.wallet_id,
            userId: t.user_id,
            type: t.type,
            amount: Number(t.amount) || 0,
            fee: Number(t.fee) || 0,
            balanceBefore: Number(t.balance_before) || 0,
            balanceAfter: Number(t.balance_after) || 0,
            status: t.status,
            paymentMethod: t.payment_method,
            trxId: t.trx_id,
            senderNumber: t.sender_number,
            receiverNumber: t.receiver_number,
            counterpartUserId: t.counterpart_user_id,
            referenceId: t.reference_id,
            note: t.note,
            createdAt: t.created_at
          }));

          return { success: true, wallet: mappedWallet, transactions: mappedTxs };
        }
      }
    } catch (apiErr) {
      console.warn('[WalletService] API route balance fetch note:', apiErr);
    }

    // 3. Fallback clean client wallet
    const fallback: Wallet = {
      id: `wallet_${effectiveUserId}`,
      userId: effectiveUserId,
      balance: 0,
      pendingEscrow: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalSpent: 0,
      totalEarned: 0,
      currency: 'BDT',
      isFrozen: false
    };
    return { success: true, wallet: fallback, transactions: [] };
  }

  /**
   * Request to Add Money via bKash / Nagad / Rocket
   */
  async requestAddMoney(params: {
    amount: number;
    paymentMethod: string;
    trxId: string;
    senderNumber: string;
    userId?: string;
  }): Promise<{ success: boolean; message: string; request?: any }> {
    const headers = await this.getAuthHeaders(params.userId);

    // Try server endpoint
    try {
      const res = await fetch('/api/wallet/add-money', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: params.amount,
          paymentMethod: params.paymentMethod,
          trxId: params.trxId,
          senderNumber: params.senderNumber,
          userId: params.userId
        })
      });

      const json = await res.json();
      if (json.success) {
        // Cache locally for immediate UI display
        try {
          const cacheKey = `wallet_add_reqs_${params.userId || 'anonymous_user'}`;
          const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const newReqItem = json.request || {
            id: `req_${Date.now()}`,
            userId: params.userId,
            amount: params.amount,
            paymentMethod: params.paymentMethod,
            trxId: params.trxId.toUpperCase(),
            senderNumber: params.senderNumber,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(cacheKey, JSON.stringify([newReqItem, ...existing].slice(0, 30)));
        } catch (_) {}
        return { success: true, message: json.message, request: json.request };
      } else {
        return { success: false, message: json.message || 'অ্যাড মানি সম্পন্ন হয়নি।' };
      }
    } catch (err: any) {
      // Direct Supabase fallback
      if (isSupabaseConfigured && params.userId) {
        try {
          const { data, error } = await supabase
            .from('wallet_add_money_requests')
            .insert({
              user_id: params.userId,
              amount: params.amount,
              payment_method: params.paymentMethod,
              trx_id: params.trxId.trim().toUpperCase(),
              sender_number: params.senderNumber.trim(),
              status: 'pending'
            })
            .select('*')
            .single();

          if (!error && data) {
            return {
              success: true,
              message: `৳${params.amount} অ্যাড মানি রিকোয়েস্ট সফল হয়েছে! অ্যাডমিন যাচাই করার পর আপনার ওয়ালেটে জমা হবে।`,
              request: data
            };
          }
        } catch (_) {}
      }

      return {
        success: false,
        message: err?.message || 'অ্যাড মানি রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      };
    }
  }

  /**
   * P2P Send Money to another user
   */
  async transferP2P(params: {
    receiverIdentifier: string;
    amount: number;
    note?: string;
    senderId?: string;
  }): Promise<{ success: boolean; message: string; newBalance?: number }> {
    const headers = await this.getAuthHeaders(params.senderId);

    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receiverIdentifier: params.receiverIdentifier,
          amount: params.amount,
          note: params.note,
          userId: params.senderId
        })
      });

      const json = await res.json();
      return {
        success: json.success,
        message: json.message || (json.success ? 'টাকা সফলভাবে ট্রান্সফার হয়েছে!' : 'ট্রান্সফার ব্যর্থ হয়েছে।'),
        newBalance: json.newBalance
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'ট্রান্সফার প্রক্রিয়া সম্পন্ন করা যায়নি।'
      };
    }
  }

  /**
   * Pay for purchase or service booking with J-Pay wallet
   */
  async purchase(params: {
    amount: number;
    orderRef: string;
    sellerId?: string;
    description?: string;
    buyerId?: string;
  }): Promise<{ success: boolean; message: string; newBalance?: number }> {
    const headers = await this.getAuthHeaders(params.buyerId);

    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: params.amount,
          orderRef: params.orderRef,
          sellerId: params.sellerId,
          description: params.description,
          userId: params.buyerId
        })
      });

      const json = await res.json();
      return {
        success: json.success,
        message: json.message || (json.success ? 'J-Pay ওয়ালেট দিয়ে সফলভাবে পরিশোধিত হয়েছে।' : 'পেমেন্ট সম্পন্ন হয়নি।'),
        newBalance: json.newBalance
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'পেমেন্ট ব্যর্থ হয়েছে।'
      };
    }
  }

  /**
   * Cashout / Withdrawal request (Min ৳600 balance for ৳500 cashout)
   */
  async requestWithdrawal(params: {
    amount: number;
    payoutMethod: string;
    payoutNumber: string;
    userId?: string;
  }): Promise<{ success: boolean; message: string; withdrawal?: any }> {
    const headers = await this.getAuthHeaders(params.userId);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: params.amount,
          payoutMethod: params.payoutMethod,
          payoutNumber: params.payoutNumber,
          userId: params.userId
        })
      });

      const json = await res.json();
      if (json.success) {
        try {
          const cacheKey = `wallet_withdraw_reqs_${params.userId || 'anonymous_user'}`;
          const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const newWithItem = json.withdrawal || {
            id: `with_${Date.now()}`,
            userId: params.userId,
            amount: params.amount,
            payoutMethod: params.payoutMethod,
            payoutNumber: params.payoutNumber,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(cacheKey, JSON.stringify([newWithItem, ...existing].slice(0, 30)));
        } catch (_) {}
      }
      return {
        success: json.success,
        message: json.message || (json.success ? 'উইথড্রয়াল রিকোয়েস্ট গৃহীত হয়েছে!' : 'উইথড্রয়াল ব্যর্থ হয়েছে।'),
        withdrawal: json.withdrawal
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'উইথড্রয়াল রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে।'
      };
    }
  }

  /**
   * Fetch past Add Money requests submitted by this user
   */
  async getUserAddMoneyRequests(userId?: string): Promise<AddMoneyRequest[]> {
    const effectiveUserId = userId || 'anonymous_user';
    if (isSupabaseConfigured && effectiveUserId && effectiveUserId !== 'anonymous_user') {
      try {
        const { data, error } = await supabase
          .from('wallet_add_money_requests')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            amount: Number(r.amount) || 0,
            paymentMethod: r.payment_method,
            trxId: r.trx_id,
            senderNumber: r.sender_number,
            status: r.status,
            adminNote: r.admin_note,
            reviewedAt: r.reviewed_at,
            reviewedBy: r.reviewed_by,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[WalletService] getUserAddMoneyRequests supabase warn:', err);
      }
    }

    // Try server endpoint
    try {
      const headers = await this.getAuthHeaders(effectiveUserId);
      const res = await fetch(`/api/wallet/user-add-money-requests?userId=${encodeURIComponent(effectiveUserId)}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.requests) {
          return json.requests;
        }
      }
    } catch (_) {}

    // Fallback to local cache
    try {
      const cacheKey = `wallet_add_reqs_${effectiveUserId}`;
      const stored = localStorage.getItem(cacheKey);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [];
  }

  /**
   * Fetch past Withdrawal requests submitted by this user
   */
  async getUserWithdrawals(userId?: string): Promise<WithdrawalRequest[]> {
    const effectiveUserId = userId || 'anonymous_user';
    if (isSupabaseConfigured && effectiveUserId && effectiveUserId !== 'anonymous_user') {
      try {
        const { data, error } = await supabase
          .from('wallet_withdrawals')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            amount: Number(w.amount) || 0,
            fee: Number(w.fee) || 0,
            payoutMethod: w.payout_method,
            payoutNumber: w.payout_number,
            payoutDetails: w.payout_details,
            status: w.status,
            adminNote: w.admin_note,
            reviewedAt: w.reviewed_at,
            reviewedBy: w.reviewed_by,
            createdAt: w.created_at
          }));
        }
      } catch (err) {
        console.warn('[WalletService] getUserWithdrawals supabase warn:', err);
      }
    }

    // Try server endpoint
    try {
      const headers = await this.getAuthHeaders(effectiveUserId);
      const res = await fetch(`/api/wallet/user-withdrawals?userId=${encodeURIComponent(effectiveUserId)}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.withdrawals) {
          return json.withdrawals;
        }
      }
    } catch (_) {}

    // Fallback to local cache
    try {
      const cacheKey = `wallet_withdraw_reqs_${effectiveUserId}`;
      const stored = localStorage.getItem(cacheKey);
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return [];
  }

  /**
   * Realtime subscription for live wallet balance and transactions
   */
  subscribeToWallet(userId: string, onUpdate: (wallet: Wallet) => void): () => void {
    if (!isSupabaseConfigured || !userId) return () => {};

    try {
      const channel = supabase
        .channel(`wallet_user_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            if (payload.new) {
              const sw = payload.new;
              onUpdate({
                id: sw.id,
                userId: sw.user_id,
                phone: sw.phone || '',
                balance: Number(sw.balance) || 0,
                pendingEscrow: Number(sw.pending_escrow) || 0,
                totalDeposited: Number(sw.total_deposited) || 0,
                totalWithdrawn: Number(sw.total_withdrawn) || 0,
                totalSpent: Number(sw.total_spent) || 0,
                totalEarned: Number(sw.total_earned) || 0,
                currency: sw.currency || 'BDT',
                isFrozen: Boolean(sw.is_frozen),
                createdAt: sw.created_at,
                updatedAt: sw.updated_at
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[WalletService] Realtime subscription error:', err);
      return () => {};
    }
  }

  // ================= ADMIN FUNCTIONS =================

  /**
   * Fetch all pending Add-Money requests for Admin Review
   */
  async getPendingAddMoneyRequests(): Promise<AddMoneyRequest[]> {
    const headers = await this.getAuthHeaders();
    try {
      const res = await fetch('/api/admin/wallet/add-money/pending', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.requests) {
          return json.requests.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            amount: Number(r.amount) || 0,
            paymentMethod: r.payment_method,
            trxId: r.trx_id,
            senderNumber: r.sender_number,
            status: r.status,
            adminNote: r.admin_note,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            createdAt: r.created_at
          }));
        }
      }
    } catch (err) {
      console.warn('[WalletService] getPendingAddMoneyRequests note:', err);
    }
    return [];
  }

  /**
   * Admin approves Add-Money request
   */
  async approveAddMoney(requestId: string): Promise<{ success: boolean; message: string; balanceAfter?: number }> {
    const headers = await this.getAuthHeaders();
    try {
      const res = await fetch(`/api/admin/wallet/add-money/${encodeURIComponent(requestId)}/approve`, {
        method: 'POST',
        headers
      });
      const json = await res.json();
      return {
        success: json.success,
        message: json.message || (json.success ? 'অ্যাড মানি অনুমোদিত হয়েছে!' : 'অনুমোদন ব্যর্থ হয়েছে।'),
        balanceAfter: json.balanceAfter
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'অনুমোদন প্রক্রিয়া ব্যর্থ হয়েছে।' };
    }
  }

  /**
   * Fetch all pending Withdrawals for Admin Review
   */
  async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
    const headers = await this.getAuthHeaders();
    try {
      const res = await fetch('/api/admin/wallet/withdrawals/pending', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.withdrawals) {
          return json.withdrawals.map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            amount: Number(w.amount) || 0,
            payoutMethod: w.payout_method,
            payoutNumber: w.payout_number,
            status: w.status,
            adminNote: w.admin_note,
            processedBy: w.processed_by,
            processedAt: w.processed_at,
            createdAt: w.created_at
          }));
        }
      }
    } catch (err) {
      console.warn('[WalletService] getPendingWithdrawals note:', err);
    }
    return [];
  }

  /**
   * Admin approves Withdrawal request
   */
  async approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; message: string; balanceAfter?: number }> {
    const headers = await this.getAuthHeaders();
    try {
      const res = await fetch(`/api/admin/wallet/withdrawals/${encodeURIComponent(withdrawalId)}/approve`, {
        method: 'POST',
        headers
      });
      const json = await res.json();
      return {
        success: json.success,
        message: json.message || (json.success ? 'উইথড্রয়াল অনুমোদিত হয়েছে!' : 'অনুমোদন ব্যর্থ হয়েছে।'),
        balanceAfter: json.balanceAfter
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'অনুমোদন প্রক্রিয়া ব্যর্থ হয়েছে।' };
    }
  }

  /**
   * Fetch all system transactions for Admin Audit
   */
  async getAllTransactions(): Promise<WalletTransaction[]> {
    const headers = await this.getAuthHeaders();
    try {
      const res = await fetch('/api/admin/wallet/transactions', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.transactions) {
          return json.transactions.map((t: any) => ({
            id: t.id,
            walletId: t.wallet_id,
            userId: t.user_id,
            type: t.type,
            amount: Number(t.amount) || 0,
            fee: Number(t.fee) || 0,
            balanceBefore: Number(t.balance_before) || 0,
            balanceAfter: Number(t.balance_after) || 0,
            status: t.status,
            paymentMethod: t.payment_method,
            trxId: t.trx_id,
            senderNumber: t.sender_number,
            receiverNumber: t.receiver_number,
            counterpartUserId: t.counterpart_user_id,
            referenceId: t.reference_id,
            note: t.note,
            createdAt: t.created_at
          }));
        }
      }
    } catch (err) {
      console.warn('[WalletService] getAllTransactions note:', err);
    }
    return [];
  }
}

export const walletService = new WalletService();
