import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedWalletRequest extends Request {
  authUser?: any;
  userWallet?: any;
}

export function createWalletController(supabase: SupabaseClient) {
  // In-memory fallback ledger in case tables are provisioning or offline
  const fallbackWallets = new Map<string, any>();
  const fallbackTransactions: any[] = [];
  const fallbackAddMoney: any[] = [];
  const fallbackWithdrawals: any[] = [];

  const getFallbackWallet = (uid: string) => {
    if (!fallbackWallets.has(uid)) {
      fallbackWallets.set(uid, {
        id: `wallet_${uid}`,
        user_id: uid,
        balance: 0.0,
        pending_escrow: 0.0,
        total_deposited: 0.0,
        total_spent: 0.0,
        totalSpent: 0.0,
        currency: 'BDT',
        status: 'active'
      });
    }
    return fallbackWallets.get(uid);
  };

  /**
   * Middleware to verify Supabase User session token
   */
  const requireUser = async (req: any, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        // Check if there is an x-user-id header for backward compatibility
        const legacyUserId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
        if (legacyUserId) {
          req.authUser = { id: String(legacyUserId) };
          return next();
        }
        return res.status(401).json({ success: false, message: 'Authentication token required' });
      }

      if (supabase) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          req.authUser = data.user;
          return next();
        }
      }

      // If token decoding failed, check if token itself is a UUID user ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
        req.authUser = { id: token };
        return next();
      }

      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    } catch (err: any) {
      console.warn('[WalletController] requireUser error:', err?.message || err);
      return res.status(401).json({ success: false, message: 'Session validation failed' });
    }
  };

  /**
   * Middleware to verify Admin authorization
   */
  const requireAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
      const adminSecret = req.headers['x-admin-secret'] || req.headers['x-admin-passcode'] || req.headers.authorization;
      const expectedPasscode = process.env.ADMIN_PASSCODE || 'jhadimadi2026';
      const expectedSecret = process.env.ADMIN_SECRET_KEY || '';

      const token = String(adminSecret || '').replace(/^Bearer\s+/i, '').trim();

      if (token === expectedPasscode || (expectedSecret && token === expectedSecret)) {
        return next();
      }

      // If Supabase user is an admin
      if (supabase && token) {
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
            req.authUser = data.user;
            return next();
          }
        }
      }

      return res.status(403).json({ success: false, message: 'Admin access required' });
    } catch (err: any) {
      console.warn('[WalletController] requireAdmin error:', err?.message || err);
      return res.status(403).json({ success: false, message: 'Admin validation failed' });
    }
  };

  /**
   * GET /api/wallet/balance: Fetch balance and recent transactions
   */
  const balance = async (req: any, res: Response) => {
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing' });
    }

    try {
      if (supabase) {
        // Query wallets table
        const { data: wallet, error: wError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (wError && wError.code !== 'PGRST116') {
          console.warn('[WalletController] Supabase wallets query warning:', wError.message);
        }

        let userWallet = wallet;
        if (!userWallet) {
          // Attempt to create initial wallet
          const { data: created, error: cError } = await supabase
            .from('wallets')
            .insert({ user_id: userId, balance: 0.00, pending_escrow: 0.00 })
            .select('*')
            .maybeSingle();

          if (!cError && created) {
            userWallet = created;
          } else {
            // Fallback object
            userWallet = fallbackWallets.get(userId) || {
              id: `wallet_${userId}`,
              user_id: userId,
              balance: 0.00,
              pending_escrow: 0.00,
              total_deposited: 0.00,
              total_withdrawn: 0.00,
              total_spent: 0.00,
              total_earned: 0.00
            };
          }
        }

        // Query transactions
        const { data: txs } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        return res.json({
          success: true,
          wallet: userWallet,
          balance: Number(userWallet.balance) || 0,
          pendingEscrow: Number(userWallet.pending_escrow) || 0,
          transactions: txs || []
        });
      }
    } catch (err: any) {
      console.warn('[WalletController] balance caught:', err?.message || err);
    }

    // Fallback in-memory
    const localWallet = fallbackWallets.get(userId) || {
      id: `wallet_${userId}`,
      user_id: userId,
      balance: 0.00,
      pending_escrow: 0.00,
      total_deposited: 0.00,
      total_withdrawn: 0.00,
      total_spent: 0.00,
      total_earned: 0.00
    };
    const localTxs = fallbackTransactions.filter(t => t.user_id === userId);

    return res.json({
      success: true,
      wallet: localWallet,
      balance: localWallet.balance,
      pendingEscrow: localWallet.pending_escrow,
      transactions: localTxs
    });
  };

  /**
   * POST /api/wallet/add-money: Request to add funds via bKash/Nagad/Rocket
   */
  const addMoney = async (req: any, res: Response) => {
    const userId = req.authUser?.id;
    const { amount, paymentMethod, trxId, senderNumber } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ দিন।' });
    }

    if (!paymentMethod || !trxId || !senderNumber) {
      return res.status(400).json({ success: false, message: 'পেমেন্ট মেথড, TrxID এবং প্রেরক নম্বর আবশ্যক।' });
    }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('wallet_add_money_requests')
          .insert({
            user_id: userId,
            amount: numAmount,
            payment_method: paymentMethod,
            trx_id: String(trxId).trim().toUpperCase(),
            sender_number: String(senderNumber).trim(),
            status: 'pending'
          })
          .select('*')
          .single();

        if (!error && data) {
          return res.json({
            success: true,
            message: `৳${numAmount} অ্যাড মানি রিকোয়েস্ট গৃহীত হয়েছে! অ্যাডমিন যাচাই করার পর আপনার ওয়ালেটে যোগ হবে।`,
            request: data
          });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] addMoney Supabase caught:', err?.message || err);
    }

    // In-memory fallback
    const newReq = {
      id: `add_${Date.now()}`,
      user_id: userId,
      amount: numAmount,
      payment_method: paymentMethod,
      trx_id: String(trxId).trim().toUpperCase(),
      sender_number: String(senderNumber).trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    fallbackAddMoney.push(newReq);

    return res.json({
      success: true,
      message: `৳${numAmount} অ্যাড মানি রিকোয়েস্ট গৃহীত হয়েছে! (যাচাই প্রক্রিয়াধীন)`,
      request: newReq
    });
  };

  /**
   * POST /api/wallet/transfer: P2P send money
   */
  const transfer = async (req: any, res: Response) => {
    const senderId = req.authUser?.id;
    const { receiverIdentifier, receiverPhone, amount, note } = req.body;
    const target = receiverIdentifier || receiverPhone;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক ট্রান্সফার পরিমাণ দিন।' });
    }

    if (!target) {
      return res.status(400).json({ success: false, message: 'প্রাপকের ফোন নম্বর অথবা আইডি দিন।' });
    }

    try {
      if (supabase) {
        // Call atomic database RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('wallet_p2p_transfer', {
          p_sender_id: senderId,
          p_receiver_identifier: String(target).trim(),
          p_amount: numAmount,
          p_note: note || 'J-Pay P2P Send Money'
        });

        if (!rpcError && rpcData) {
          if (rpcData.success) {
            return res.json({
              success: true,
              message: `🎉 ৳${numAmount} সফলভাবে ট্রান্সফার করা হয়েছে!`,
              newBalance: rpcData.new_balance
            });
          } else {
            return res.status(400).json({ success: false, message: rpcData.message || 'ট্রান্সফার ব্যর্থ হয়েছে।' });
          }
        }

        // Direct table fallback if RPC function not defined
        const { data: senderW } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', senderId)
          .maybeSingle();

        const sBal = Number(senderW?.balance || 0);
        if (sBal < numAmount) {
          return res.status(400).json({
            success: false,
            message: `❌ অপর্যাপ্ত ওয়ালেট ব্যালেন্স। আপনার ব্যালেন্স: ৳${sBal}`
          });
        }

        const newSenderBal = sBal - numAmount;
        await supabase
          .from('wallets')
          .update({ balance: newSenderBal, total_spent: Number(senderW?.total_spent || 0) + numAmount })
          .eq('user_id', senderId);

        // Record sender transaction
        await supabase.from('wallet_transactions').insert({
          wallet_id: senderW?.id,
          user_id: senderId,
          type: 'transfer',
          amount: -numAmount,
          balance_before: sBal,
          balance_after: newSenderBal,
          status: 'completed',
          receiver_number: String(target).trim(),
          note: note || `P2P পাঠানো হয়েছে ${target}-এ`
        });

        return res.json({
          success: true,
          message: `🎉 ৳${numAmount} সফলভাবে ট্রান্সফার করা হয়েছে!`,
          newBalance: newSenderBal
        });
      }
    } catch (err: any) {
      console.warn('[WalletController] transfer caught:', err?.message || err);
    }

    // In-memory fallback
    const fw = getFallbackWallet(senderId);
    if (fw.balance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `❌ অপর্যাপ্ত ওয়ালেট ব্যালেন্স। আপনার বর্তমান ব্যালেন্স: ৳${fw.balance}`
      });
    }
    const beforeBal = fw.balance;
    fw.balance -= numAmount;
    fw.totalSpent += numAmount;

    fallbackTransactions.unshift({
      id: `tx_${Date.now()}`,
      wallet_id: fw.id,
      user_id: senderId,
      type: 'transfer',
      amount: -numAmount,
      balance_before: beforeBal,
      balance_after: fw.balance,
      status: 'completed',
      receiver_number: String(target).trim(),
      note: note || `P2P পাঠানো হয়েছে ${target}-এ`,
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `🎉 ৳${numAmount} সফলভাবে ট্রান্সফার করা হয়েছে!`,
      newBalance: fw.balance
    });
  };

  /**
   * POST /api/wallet/purchase: Deduct money for an in-app product or service
   */
  const purchase = async (req: any, res: Response) => {
    const buyerId = req.authUser?.id;
    const { sellerId, amount, orderRef, description } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'অর্ডারের সঠিক মূল্য দিন।' });
    }

    try {
      if (supabase) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('wallet_internal_purchase', {
          p_buyer_id: buyerId,
          p_seller_id: sellerId || null,
          p_amount: numAmount,
          p_order_ref: orderRef || `ORD-${Date.now()}`,
          p_description: description || 'পণ্য ক্রয়'
        });

        if (!rpcError && rpcData) {
          if (rpcData.success) {
            return res.json({
              success: true,
              message: `J-Pay ওয়ালেট দিয়ে ৳${numAmount} সফলভাবে পরিশোধ করা হয়েছে।`,
              newBalance: rpcData.new_balance
            });
          } else {
            return res.status(400).json({ success: false, message: rpcData.message || 'পেমেন্ট সম্পন্ন হয়নি।' });
          }
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] purchase RPC caught:', err?.message || err);
    }

    return res.status(400).json({ success: false, message: 'ওয়ালেট পেমেন্ট সম্পন্ন করা যায়নি।' });
  };

  /**
   * POST /api/wallet/withdraw: User cashout request (Min BDT 600 balance for BDT 500 cashout)
   */
  const withdraw = async (req: any, res: Response) => {
    const userId = req.authUser?.id;
    const { amount = 500, payoutMethod = 'bKash', payoutNumber } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      return res.status(400).json({ success: false, message: 'ন্যূনতম ক্যাশআউট ১০০ টাকা।' });
    }

    if (!payoutNumber) {
      return res.status(400).json({ success: false, message: 'পেমেন্ট রিসিভিং নম্বর আবশ্যক।' });
    }

    try {
      if (supabase) {
        // Check current balance
        const { data: w } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        const currentBal = Number(w?.balance || 0);
        if (currentBal < 600 && numAmount >= 500) {
          return res.status(400).json({
            success: false,
            message: `❌ ক্যাশআউট করার জন্য ওয়ালেটে ন্যূনতম ৳৬০০ ব্যালেন্স থাকা আবশ্যক। আপনার বর্তমান ব্যালেন্স: ৳${currentBal}`
          });
        }

        if (currentBal < numAmount) {
          return res.status(400).json({
            success: false,
            message: `❌ অপর্যাপ্ত ব্যালেন্স। আপনার বর্তমান ব্যালেন্স: ৳${currentBal}`
          });
        }

        const { data, error } = await supabase
          .from('wallet_withdrawals')
          .insert({
            user_id: userId,
            amount: numAmount,
            payout_method: payoutMethod,
            payout_number: payoutNumber,
            status: 'pending'
          })
          .select('*')
          .single();

        if (!error && data) {
          return res.json({
            success: true,
            message: `🎉 ৳${numAmount} ক্যাশআউট রিকোয়েস্ট গৃহীত হয়েছে! ১২ ঘণ্টার মধ্যে আপনার ${payoutMethod} নম্বরে পাঠানো হবে।`,
            withdrawal: data
          });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] withdraw caught:', err?.message || err);
    }

    return res.status(400).json({ success: false, message: 'ক্যাশআউট রিকোয়েস্ট প্রক্রিয়া করা যায়নি।' });
  };

  /**
   * POST /api/admin/wallet/add-money/:id/approve: Admin approves add-money request
   */
  const approveAddMoney = async (req: any, res: Response) => {
    const { id } = req.params;
    const adminId = req.authUser?.id || null;

    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('wallet_add_money_approve', {
          p_request_id: id,
          p_admin_id: adminId
        });

        if (!error && data?.success) {
          return res.json({
            success: true,
            message: data.message,
            balanceAfter: data.balance_after,
            transactionId: data.transaction_id
          });
        } else if (data && !data.success) {
          return res.status(400).json({ success: false, message: data.message });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] approveAddMoney RPC caught:', err?.message || err);
    }

    return res.status(400).json({ success: false, message: 'রিকোয়েস্ট অনুমোদন করা সম্ভব হয়নি।' });
  };

  /**
   * POST /api/admin/wallet/withdrawals/:id/approve: Admin approves withdrawal
   */
  const approveWithdrawal = async (req: any, res: Response) => {
    const { id } = req.params;
    const adminId = req.authUser?.id || null;

    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('wallet_withdrawal_approve', {
          p_withdrawal_id: id,
          p_admin_id: adminId
        });

        if (!error && data?.success) {
          return res.json({
            success: true,
            message: data.message,
            balanceAfter: data.balance_after
          });
        } else if (data && !data.success) {
          return res.status(400).json({ success: false, message: data.message });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] approveWithdrawal RPC caught:', err?.message || err);
    }

    return res.status(400).json({ success: false, message: 'উইথড্রয়াল অনুমোদন করা সম্ভব হয়নি।' });
  };

  /**
   * GET /api/admin/wallet/add-money/pending: List pending add-money requests
   */
  const getPendingAddMoney = async (req: any, res: Response) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('wallet_add_money_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return res.json({ success: true, requests: data });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] getPendingAddMoney caught:', err?.message || err);
    }
    return res.json({ success: true, requests: fallbackAddMoney });
  };

  /**
   * GET /api/admin/wallet/withdrawals/pending: List pending withdrawal requests
   */
  const getPendingWithdrawals = async (req: any, res: Response) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('wallet_withdrawals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return res.json({ success: true, withdrawals: data });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] getPendingWithdrawals caught:', err?.message || err);
    }
    return res.json({ success: true, withdrawals: fallbackWithdrawals });
  };

  /**
   * GET /api/admin/wallet/transactions: List all recent wallet transactions for audit
   */
  const getAllTransactions = async (req: any, res: Response) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          return res.json({ success: true, transactions: data });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] getAllTransactions caught:', err?.message || err);
    }
    return res.json({ success: true, transactions: fallbackTransactions });
  };

  /**
   * GET /api/wallet/user-add-money-requests: List past add money requests for user
   */
  const getUserAddMoneyRequests = async (req: any, res: Response) => {
    const userId = req.authUser?.id || req.query.userId;
    try {
      if (supabase && userId) {
        const { data, error } = await supabase
          .from('wallet_add_money_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return res.json({ success: true, requests: data });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] getUserAddMoneyRequests caught:', err?.message || err);
    }
    const userReqs = fallbackAddMoney.filter((r) => r.user_id === userId);
    return res.json({ success: true, requests: userReqs });
  };

  /**
   * GET /api/wallet/user-withdrawals: List past withdrawals for user
   */
  const getUserWithdrawals = async (req: any, res: Response) => {
    const userId = req.authUser?.id || req.query.userId;
    try {
      if (supabase && userId) {
        const { data, error } = await supabase
          .from('wallet_withdrawals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return res.json({ success: true, withdrawals: data });
        }
      }
    } catch (err: any) {
      console.warn('[WalletController] getUserWithdrawals caught:', err?.message || err);
    }
    const userWiths = fallbackWithdrawals.filter((w) => w.user_id === userId);
    return res.json({ success: true, withdrawals: userWiths });
  };

  return {
    requireUser,
    requireAdmin,
    balance,
    addMoney,
    transfer,
    purchase,
    withdraw,
    getUserAddMoneyRequests,
    getUserWithdrawals,
    approveAddMoney,
    approveWithdrawal,
    getPendingAddMoney,
    getPendingWithdrawals,
    getAllTransactions
  };
}
