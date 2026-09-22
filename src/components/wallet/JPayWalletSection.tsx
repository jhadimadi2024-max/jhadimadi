import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  History,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Info,
  ChevronRight,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react';
import { UserProfile, Language } from '../../types';
import { walletService, Wallet, WalletTransaction, AddMoneyRequest, WithdrawalRequest } from '../../services/walletService';

export interface JPayWalletSectionProps {
  currentUser?: UserProfile | null;
  profileData?: any;
  roleName?: string; // e.g. "পণ্য বিক্রেতা", "সেবা বিক্রেতা", "পেশাজীবী সেবাদাতা", "স্থায়ী সদস্য"
  roleType?: 'product_seller' | 'service_seller' | 'service_provider' | 'permanent_member' | string;
  lang?: Language;
  onNavigateTab?: (tab: string) => void;
  className?: string;
  defaultAction?: 'none' | 'add' | 'send' | 'withdraw' | 'history';
}

const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

export const JPayWalletSection: React.FC<JPayWalletSectionProps> = ({
  currentUser,
  profileData,
  roleName,
  roleType = 'product_seller',
  lang = 'bn',
  onNavigateTab,
  className = '',
  defaultAction = 'none'
}) => {
  const isBn = lang === 'bn';

  // Resolve user identification
  const effectiveUserId = useMemo(() => {
    return (
      currentUser?.id ||
      currentUser?.memberUID ||
      currentUser?.sellerCode ||
      currentUser?.uniqueId ||
      profileData?.id ||
      profileData?.memberUID ||
      profileData?.sellerCode ||
      profileData?.uniqueId ||
      'anonymous_user'
    );
  }, [currentUser, profileData]);

  const userName = useMemo(() => {
    return (
      currentUser?.name ||
      currentUser?.fullName ||
      currentUser?.businessName ||
      profileData?.name ||
      profileData?.businessName ||
      (isBn ? 'সম্মানিত ইউজার' : 'Valued User')
    );
  }, [currentUser, profileData, isBn]);

  const userIdentifier = useMemo(() => {
    return (
      currentUser?.memberUID ||
      currentUser?.sellerCode ||
      currentUser?.uniqueId ||
      profileData?.memberUID ||
      profileData?.sellerCode ||
      currentUser?.phone ||
      profileData?.phone ||
      effectiveUserId
    );
  }, [currentUser, profileData, effectiveUserId]);

  const displayRoleTitle = useMemo(() => {
    if (roleName) return roleName;
    if (roleType === 'product_seller') return isBn ? 'পণ্য বিক্রেতা (মার্চেন্ট)' : 'Product Seller (Merchant)';
    if (roleType === 'service_seller') return isBn ? 'সেবা বিক্রেতা (ফ্রিল্যান্সার)' : 'Service Seller (Freelancer)';
    if (roleType === 'service_provider') return isBn ? 'পেশাজীবী সেবাদাতা' : 'Professional Service Provider';
    if (roleType === 'permanent_member') return isBn ? 'স্থায়ী সদস্য' : 'Permanent Member';
    return isBn ? 'প্রোফাইল ওয়ালেট' : 'Profile Wallet';
  }, [roleName, roleType, isBn]);

  // Wallet State
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [addMoneyRequests, setAddMoneyRequests] = useState<AddMoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active Sub-Action Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'send' | 'withdraw' | 'history'>(
    defaultAction === 'none' ? 'overview' : defaultAction
  );

  // Add Money Form State
  const [addForm, setAddForm] = useState({
    amount: '500',
    method: 'bKash',
    senderNumber: '',
    trxId: ''
  });

  // Send Money Form State
  const [sendForm, setSendForm] = useState({
    receiver: '',
    amount: '',
    note: ''
  });
  const [sendVerifyModalOpen, setSendVerifyModalOpen] = useState(false);

  // Withdraw Form State
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '500',
    payoutMethod: 'bKash',
    payoutNumber: ''
  });

  // History Filter
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit' | 'add_money' | 'transfer' | 'withdraw' | 'escrow'>('all');

  // Load Wallet Data
  const loadWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await walletService.getWallet(effectiveUserId);
      if (res.success && res.wallet) {
        setWallet(res.wallet);
        setTransactions(res.transactions || []);
      }

      // Load user past add-money requests
      const addReqs = await walletService.getUserAddMoneyRequests(effectiveUserId);
      setAddMoneyRequests(addReqs || []);

      // Load user past withdrawals
      const withReqs = await walletService.getUserWithdrawals(effectiveUserId);
      setWithdrawals(withReqs || []);
    } catch (err: any) {
      console.warn('[JPayWalletSection] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadWalletData();
    // Subscribe to realtime updates
    const unsubscribe = walletService.subscribeToWallet(effectiveUserId, (updated) => {
      setWallet(updated);
    });
    return () => {
      unsubscribe();
    };
  }, [effectiveUserId, loadWalletData]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Add Money Submission
  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(addForm.amount);
    if (!numAmount || numAmount < 50) {
      setNotice({ type: 'error', message: isBn ? 'ন্যূনতম রিচার্জ ৫০ টাকা হতে হবে।' : 'Minimum recharge is ৳50.' });
      return;
    }
    if (!addForm.senderNumber.trim() || addForm.senderNumber.length < 11) {
      setNotice({ type: 'error', message: isBn ? 'সঠিক ১১ ডিজিটের প্রেরক মোবাইল নম্বর দিন।' : 'Please enter valid 11-digit sender number.' });
      return;
    }
    if (!addForm.trxId.trim() || addForm.trxId.length < 6) {
      setNotice({ type: 'error', message: isBn ? 'সঠিক TrxID (ট্রানজেকশন আইডি) দিন।' : 'Please enter a valid TrxID.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await walletService.requestAddMoney({
        amount: numAmount,
        paymentMethod: addForm.method,
        senderNumber: addForm.senderNumber.trim(),
        trxId: addForm.trxId.trim(),
        userId: effectiveUserId
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: isBn
            ? `৳${numAmount} রিচার্জ রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে! অ্যাডমিন ভেরিফিকেশন সাপেক্ষে ওয়ালেটে যুক্ত হবে।`
            : `Recharge request for ৳${numAmount} submitted successfully! Balance will be credited upon verification.`
        });
        setAddForm({ amount: '500', method: 'bKash', senderNumber: '', trxId: '' });
        loadWalletData();
      } else {
        setNotice({ type: 'error', message: res.message || (isBn ? 'রিকোয়েস্ট ব্যর্থ হয়েছে।' : 'Request failed.') });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || (isBn ? 'অনুরোধ পাঠানো সম্ভব হয়নি।' : 'Could not send request.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Money Step 1: Open verification modal
  const handleInitiateSendMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(sendForm.amount);
    const currentBal = wallet?.balance || 0;

    if (!sendForm.receiver.trim()) {
      setNotice({ type: 'error', message: isBn ? 'প্রাপকের ফোন নম্বর অথবা আইডি দিন।' : 'Enter recipient phone or ID.' });
      return;
    }
    if (!numAmount || numAmount < 10) {
      setNotice({ type: 'error', message: isBn ? 'ন্যূনতম ট্রান্সফার পরিমাণ ১০ টাকা।' : 'Minimum transfer is ৳10.' });
      return;
    }
    if (numAmount > currentBal) {
      setNotice({
        type: 'error',
        message: isBn
          ? `অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${currentBal.toLocaleString()}।`
          : `Insufficient balance! Your current balance is ৳${currentBal.toLocaleString()}.`
      });
      return;
    }

    setSendVerifyModalOpen(true);
  };

  // Send Money Step 2: Confirmed execution
  const handleConfirmSendMoney = async () => {
    setSendVerifyModalOpen(false);
    setIsSubmitting(true);
    setNotice(null);

    const numAmount = Number(sendForm.amount);

    try {
      const res = await walletService.transferP2P({
        receiverIdentifier: sendForm.receiver.trim(),
        amount: numAmount,
        note: sendForm.note.trim() || undefined,
        senderId: effectiveUserId
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: isBn
            ? `🎉 সফলভাবে ৳${numAmount.toLocaleString()} ট্রান্সফার করা হয়েছে!`
            : `🎉 ৳${numAmount.toLocaleString()} transferred successfully!`
        });
        setSendForm({ receiver: '', amount: '', note: '' });
        loadWalletData();
      } else {
        setNotice({ type: 'error', message: res.message || (isBn ? 'ট্রান্সফার ব্যর্থ হয়েছে।' : 'Transfer failed.') });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || (isBn ? 'সার্ভার ত্রুটি।' : 'Server error.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdraw Submission (Enforcing Migration 025: Min Balance ৳600, Min Withdraw ৳500)
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentBal = wallet?.balance || 0;
    const numAmount = Number(withdrawForm.amount);

    // Business rule checks
    if (currentBal < 600) {
      setNotice({
        type: 'error',
        message: isBn
          ? `ক্যাশআউট করার জন্য ওয়ালেটে ন্যূনতম ৳৬০০ ব্যালেন্স থাকা আবশ্যক। আপনার বর্তমান ব্যালেন্স: ৳${currentBal.toLocaleString()}।`
          : `Minimum wallet balance of ৳600 required for cashout. Current balance: ৳${currentBal.toLocaleString()}.`
      });
      return;
    }

    if (!numAmount || numAmount < 100) {
      setNotice({ type: 'error', message: isBn ? 'ন্যূনতম উত্তোলনের পরিমাণ ১০০ টাকা।' : 'Minimum cashout is ৳100.' });
      return;
    }

    if (numAmount > currentBal) {
      setNotice({
        type: 'error',
        message: isBn
          ? `অপর্যাপ্ত ব্যালেন্স। আপনার বর্তমান ব্যালেন্স: ৳${currentBal.toLocaleString()}।`
          : `Insufficient balance. Current balance: ৳${currentBal.toLocaleString()}.`
      });
      return;
    }

    if (!withdrawForm.payoutNumber.trim() || withdrawForm.payoutNumber.length < 11) {
      setNotice({ type: 'error', message: isBn ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter valid 11-digit number.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await walletService.requestWithdrawal({
        amount: numAmount,
        payoutMethod: withdrawForm.payoutMethod,
        payoutNumber: withdrawForm.payoutNumber.trim(),
        userId: effectiveUserId
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: isBn
            ? `৳${numAmount.toLocaleString()} উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে! অ্যাডমিন যাচাইয়ের পর টাকা পাঠানো হবে।`
            : `Cashout request for ৳${numAmount.toLocaleString()} submitted! Admin will review and process payout.`
        });
        setWithdrawForm({ amount: '500', payoutMethod: 'bKash', payoutNumber: '' });
        loadWalletData();
      } else {
        setNotice({ type: 'error', message: res.message || (isBn ? 'উইথড্রয়াল ব্যর্থ হয়েছে।' : 'Withdrawal failed.') });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || (isBn ? 'অনুরোধ পাঠানো সম্ভব হয়নি।' : 'Could not process request.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (txFilter === 'all') return transactions;
    if (txFilter === 'credit') return transactions.filter((t) => (t.type as string) === 'credit' || t.type === 'add_money' || t.amount > 0);
    if (txFilter === 'debit') return transactions.filter((t) => (t.type as string) === 'debit' || (t.type as string) === 'withdraw' || t.type === 'withdrawal' || t.type === 'purchase');
    if (txFilter === 'add_money') return transactions.filter((t) => t.type === 'add_money');
    if (txFilter === 'transfer') return transactions.filter((t) => (t.type as string) === 'transfer' || (t.type as string) === 'p2p_transfer' || t.type === 'transfer_out' || t.type === 'transfer_in');
    if (txFilter === 'withdraw') return transactions.filter((t) => (t.type as string) === 'withdraw' || t.type === 'withdrawal');
    if (txFilter === 'escrow') return transactions.filter((t) => t.type === 'escrow_hold' || t.type === 'escrow_release');
    return transactions;
  }, [transactions, txFilter]);

  const currentBal = wallet?.balance || 0;
  const pendingEscrow = wallet?.pendingEscrow || 0;
  const totalDeposited = wallet?.totalDeposited || 0;
  const totalWithdrawn = wallet?.totalWithdrawn || 0;

  return (
    <div className={`space-y-4 font-sans ${className}`} id="jpay-wallet-container">
      {/* 1. Header / Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        {/* Background decorative accents */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-32 h-32 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shadow-inner">
              <WalletIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  J-Pay ডিজিটাল ওয়ালেট
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Migration 025 Live</span>
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 font-medium">
                {displayRoleTitle} • <span className="font-semibold text-white">{userName}</span> (UID: {userIdentifier})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadWalletData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold transition border border-white/15 cursor-pointer disabled:opacity-50"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-300' : ''}`} />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 4-Box Key Balance Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5">
          {/* Box 1: Available Balance */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <span className="text-[11px] font-semibold text-emerald-200/90 block mb-0.5">
              {isBn ? 'বর্তমান ওয়ালেট ব্যালেন্স' : 'Available Balance'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ৳ {isBn ? toBengaliNumber(currentBal.toLocaleString()) : currentBal.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-200/70 font-medium block mt-0.5">
              {isBn ? 'তাৎক্ষণিক ব্যবহারযোগ্য' : 'Ready for use'}
            </span>
          </div>

          {/* Box 2: Pending Escrow */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <span className="text-[11px] font-semibold text-amber-200/90 block mb-0.5">
              {isBn ? 'পেন্ডিং ব্যালেন্স / এসক্রো' : 'Pending Escrow'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
              ৳ {isBn ? toBengaliNumber(pendingEscrow.toLocaleString()) : pendingEscrow.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-200/70 font-medium block mt-0.5">
              {isBn ? 'কাজের বা অর্ডারের নিশ্চয়তা' : 'Order fulfillment hold'}
            </span>
          </div>

          {/* Box 3: Total Deposited */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <span className="text-[11px] font-semibold text-emerald-200/90 block mb-0.5">
              {isBn ? 'মোট ডিপোজিট / রিচার্জ' : 'Total Deposited'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ৳ {isBn ? toBengaliNumber(totalDeposited.toLocaleString()) : totalDeposited.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-200/70 font-medium block mt-0.5">
              {isBn ? 'লাইফটাইম যোগকৃত টাকা' : 'Lifetime recharged'}
            </span>
          </div>

          {/* Box 4: Total Withdrawn */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <span className="text-[11px] font-semibold text-purple-200/90 block mb-0.5">
              {isBn ? 'মোট উত্তোলন / ক্যাশআউট' : 'Total Withdrawn'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-300 tracking-tight">
              ৳ {isBn ? toBengaliNumber(totalWithdrawn.toLocaleString()) : totalWithdrawn.toLocaleString()}
            </div>
            <span className="text-[10px] text-purple-200/70 font-medium block mt-0.5">
              {isBn ? 'সফল ক্যাশআউট' : 'Successfully paid'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 transition-all shadow-2xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : notice.type === 'error'
              ? 'bg-red-50 text-red-900 border border-red-200'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Interactive Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <WalletIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isBn ? 'সারসংক্ষেপ' : 'Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'add'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
          <span>{isBn ? 'টাকা যোগ করুন' : 'Add Money'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'send'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-blue-200" />
          <span>{isBn ? 'টাকা পাঠান (P2P)' : 'Send Money'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-purple-200" />
          <span>{isBn ? 'ক্যাশআউট' : 'Withdraw'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-300" />
          <span>{isBn ? 'লেনদেন হিস্ট্রি' : 'History'}</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setActiveTab('add')}
              className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 p-3.5 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-emerald-950">
                  {isBn ? 'ওয়ালেট রিচার্জ করুন' : 'Recharge Wallet'}
                </h4>
                <p className="text-[11px] text-emerald-800/80 truncate">
                  {isBn ? 'বিকাশ, নগদ বা রকেটে ব্যালেন্স যোগ' : 'Add money via bKash/Nagad/Rocket'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition" />
            </div>

            <div
              onClick={() => setActiveTab('send')}
              className="bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 p-3.5 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-blue-950">
                  {isBn ? 'সরাসরি টাকা পাঠান' : 'P2P Send Money'}
                </h4>
                <p className="text-[11px] text-blue-800/80 truncate">
                  {isBn ? 'অন্য গ্রাহক বা সেবাদাতাকে ০% ফিতে' : 'Transfer to any user with 0% fee'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-700 shrink-0 group-hover:translate-x-0.5 transition" />
            </div>

            <div
              onClick={() => setActiveTab('withdraw')}
              className="bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 p-3.5 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-purple-950">
                  {isBn ? 'উত্তোলন বা ক্যাশআউট' : 'Cashout / Withdraw'}
                </h4>
                <p className="text-[11px] text-purple-800/80 truncate">
                  {isBn ? 'মিনিমাম ব্যালেন্স ৳৬০০ | উত্তোলন ৳৫০০' : 'Min balance ৳600 | Cashout ৳500'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-700 shrink-0 group-hover:translate-x-0.5 transition" />
            </div>
          </div>

          {/* Business Rule / Security Notice Card */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <span className="font-bold text-amber-900 block">
                {isBn ? 'J-Pay ওয়ালেট নীতিমালা ও নিরাপত্তা (Migration 025)' : 'J-Pay Wallet Policies & Security'}
              </span>
              <p className="text-amber-800/90">
                {isBn
                  ? '১. ওয়ালেটে রিচার্জ ও P2P সেন্ড মানি সম্পূর্ণ ফ্রি। ২. ক্যাশআউট বা টাকা উত্তোলনের জন্য একাউন্টে ন্যূনতম ৳৬০০ ব্যালেন্স থাকা প্রযোজ্য এবং সর্বনিম্ন ৳৫০০ উত্তোলনযোগ্য। ৩. সকল অর্ডার ও সার্ভিস ফি সুরক্ষিত ডাবল-এন্ট্রি লেজারে সংরক্ষিত।'
                  : '1. Recharges and P2P transfers are 100% free. 2. A minimum balance of ৳600 is required to request a cashout, with a minimum withdrawal amount of ৳500. 3. All transaction records are maintained in a secure atomic double-entry ledger.'}
              </p>
            </div>
          </div>

          {/* Recent Mini History Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-xs">
                {isBn ? 'এখনো কোনো লেনদেন রেকর্ড নেই।' : 'No transaction records found.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block capitalize">
                          {tx.type === 'add_money'
                            ? (isBn ? 'রিচার্জ' : 'Recharge')
                            : (tx.type as string) === 'transfer' || (tx.type as string) === 'transfer_out' || (tx.type as string) === 'transfer_in'
                            ? (isBn ? 'P2P ট্রান্সফার' : 'P2P Transfer')
                            : (tx.type as string) === 'withdraw' || (tx.type as string) === 'withdrawal'
                            ? (isBn ? 'ক্যাশআউট' : 'Cashout')
                            : tx.note || tx.type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {tx.trxId ? `TrxID: ${tx.trxId}` : new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black block ${
                          tx.amount > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}৳ {Math.abs(tx.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ADD MONEY (রিচার্জ) ================= */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'J-Pay ওয়ালেটে টাকা যোগ করুন (রিচার্জ)' : 'Add Money to J-Pay Wallet'}</span>
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {isBn
                ? 'নিচের বিকাশ, নগদ বা রকেট নম্বরে সেন্ড মানি করুন। এরপর প্রেরকের নম্বর ও প্রাপ্ত TrxID দিয়ে সাবমিট করুন।'
                : 'Send money to the official bKash, Nagad or Rocket number below, then submit sender number and TrxID.'}
            </p>
          </div>

          {/* Official Jhadimadi Numbers Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-emerald-900 block">
              {isBn ? 'ঝাদিমাদি অফিশিয়াল পেমেন্ট নম্বর (Personal / Send Money):' : 'Official Payment Numbers:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* bKash */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-pink-600 block">বিকাশ (bKash)</span>
                  <span className="font-mono font-bold text-gray-900">01886121415</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('01886121415', 'bKash')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                  title="কপি করুন"
                >
                  {copiedText === 'bKash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Nagad */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 block">নগদ (Nagad)</span>
                  <span className="font-mono font-bold text-gray-900">01886121415</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('01886121415', 'Nagad')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                  title="কপি করুন"
                >
                  {copiedText === 'Nagad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Rocket */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 block">রকেট (Rocket)</span>
                  <span className="font-mono font-bold text-gray-900">018861214158</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('018861214158', 'Rocket')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                  title="কপি করুন"
                >
                  {copiedText === 'Rocket' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddMoneySubmit} className="space-y-4">
            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                {isBn ? 'পেমেন্ট মাধ্যম নির্বাচন করুন' : 'Select Payment Method'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bKash', label: 'বিকাশ (bKash)', color: 'border-pink-500 text-pink-700 bg-pink-50/50' },
                  { id: 'Nagad', label: 'নগদ (Nagad)', color: 'border-orange-500 text-orange-700 bg-orange-50/50' },
                  { id: 'Rocket', label: 'রকেট (Rocket)', color: 'border-purple-500 text-purple-700 bg-purple-50/50' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, method: item.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      addForm.method === item.id
                        ? `${item.color} ring-2 ring-emerald-500 font-black shadow-xs`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Preset Chips */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                {isBn ? 'টাকার পরিমাণ (৳)' : 'Recharge Amount (৳)'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['100', '500', '1000', '2000', '5000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, amount: amt })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      addForm.amount === amt
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    ৳{isBn ? toBengaliNumber(amt) : amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="50"
                value={addForm.amount}
                onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                className="w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                placeholder="500"
                required
              />
            </div>

            {/* Sender Number and TrxID Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  {isBn ? 'প্রেরক মোবাইল নম্বর (Sender Phone)' : 'Sender Phone Number'}
                </label>
                <input
                  type="text"
                  value={addForm.senderNumber}
                  onChange={(e) => setAddForm({ ...addForm, senderNumber: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  {isBn ? 'TrxID / Transaction ID' : 'TrxID (Transaction ID)'}
                </label>
                <input
                  type="text"
                  value={addForm.trxId}
                  onChange={(e) => setAddForm({ ...addForm, trxId: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-xl uppercase font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. 9J283KD76"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'অনুরোধ যাচাই হচ্ছে...' : 'Submitting Request...'}</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{isBn ? 'অ্যাড মানি রিকোয়েস্ট পাঠান' : 'Submit Add Money Request'}</span>
                </>
              )}
            </button>
          </form>

          {/* Past Add Money Requests Status Table */}
          {addMoneyRequests.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h5 className="text-xs font-bold text-gray-900 mb-2.5">
                {isBn ? 'পূর্বে পাঠানো রিচার্জ রিকোয়েস্টের স্ট্যাটাস' : 'Past Recharge Requests'}
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2.5">{isBn ? 'তারিখ' : 'Date'}</th>
                      <th className="py-2 px-2.5">{isBn ? 'মাধ্যম' : 'Method'}</th>
                      <th className="py-2 px-2.5">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="py-2 px-2.5">TrxID</th>
                      <th className="py-2 px-2.5 text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {addMoneyRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="py-2 px-2.5 text-gray-600">
                          {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-gray-900">{req.paymentMethod}</td>
                        <td className="py-2 px-2.5 font-black text-emerald-700">৳{req.amount}</td>
                        <td className="py-2 px-2.5 font-mono text-gray-600">{req.trxId}</td>
                        <td className="py-2 px-2.5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status === 'approved'
                              ? (isBn ? 'অনুমোদিত' : 'Approved')
                              : req.status === 'rejected'
                              ? (isBn ? 'বাতিল' : 'Rejected')
                              : (isBn ? 'অপেক্ষমান' : 'Pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SEND MONEY (P2P) ================= */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'অন্য গ্রাহক বা সেবাদাতাকে টাকা পাঠান (P2P)' : 'Transfer Money (P2P)'}</span>
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {isBn
                ? 'যেকোনো ঝাদিমাদি ইউজার আইডি অথবা মোবাইল নম্বরে সরাসরি ব্যালেন্স পাঠান। কোনো ট্রান্সফার ফি কাটা হবে না।'
                : 'Send money instantly to any registered user or provider using their Phone or Member ID with zero fee.'}
            </p>
          </div>

          <form onSubmit={handleInitiateSendMoney} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                {isBn ? 'প্রাপকের ফোন নম্বর অথবা আইডি' : 'Recipient Phone Number or User ID'}
              </label>
              <input
                type="text"
                value={sendForm.receiver}
                onChange={(e) => setSendForm({ ...sendForm, receiver: e.target.value })}
                className="w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder={isBn ? 'যেমন: 017XXXXXXXX বা JH-P-01' : 'e.g. 017XXXXXXXX or JH-P-01'}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {isBn ? 'টাকার পরিমাণ (৳)' : 'Transfer Amount (৳)'}
                </label>
                <span className="text-[11px] text-gray-500 font-semibold">
                  {isBn ? 'উপলব্ধ ব্যালেন্স:' : 'Available:'} ৳{currentBal.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="10"
                max={currentBal}
                value={sendForm.amount}
                onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                className="w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                placeholder="100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                {isBn ? 'রেফারেন্স / নোট (ঐচ্ছিক)' : 'Reference / Note (Optional)'}
              </label>
              <input
                type="text"
                value={sendForm.note}
                onChange={(e) => setSendForm({ ...sendForm, note: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder={isBn ? 'যেমন: পণ্য ক্রয়ের বিল বা পারিশ্রমিক' : 'e.g. Service payment or purchase note'}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || currentBal <= 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isBn ? 'যাচাই ও কনফার্ম করুন' : 'Verify & Proceed'}</span>
            </button>
          </form>

          {/* Verification Modal / Confirmation Dialog */}
          {sendVerifyModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>{isBn ? 'প্রাপক ও পরিমাণ যাচাই করুন' : 'Confirm Transfer Details'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSendVerifyModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isBn ? 'প্রাপক:' : 'Recipient:'}</span>
                    <span className="font-bold text-gray-900">{sendForm.receiver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isBn ? 'টাকার পরিমাণ:' : 'Amount:'}</span>
                    <span className="font-black text-blue-700 text-sm">৳{Number(sendForm.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isBn ? 'ট্রান্সফার ফি:' : 'Fee:'}</span>
                    <span className="font-bold text-emerald-700">৳০ (ফ্রি)</span>
                  </div>
                  <div className="border-t border-blue-200/80 pt-1.5 flex justify-between">
                    <span className="font-bold text-gray-800">{isBn ? 'অবশিষ্ট থাকবে:' : 'Remaining:'}</span>
                    <span className="font-bold text-gray-900">
                      ৳{(currentBal - Number(sendForm.amount)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSendVerifyModalOpen(false)}
                    className="py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSendMoney}
                    disabled={isSubmitting}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'হ্যাঁ, পাঠান' : 'Yes, Send')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: WITHDRAW / CASHOUT ================= */}
      {activeTab === 'withdraw' && (
        <div className="bg-white rounded-2xl border border-purple-200 p-4 sm:p-5 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
              <span>{isBn ? 'টাকা উত্তোলন (ক্যাশআউট রিকোয়েস্ট)' : 'Cashout / Withdrawal'}</span>
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {isBn
                ? 'আপনার ওয়ালেট থেকে বিকাশ, নগদ বা রকেটে টাকা উত্তোলন করুন।'
                : 'Withdraw funds from your wallet directly to your bKash, Nagad or Rocket number.'}
            </p>
          </div>

          {/* Migration 025 Rule Card */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              currentBal >= 600
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${currentBal >= 600 ? 'text-emerald-700' : 'text-amber-700'}`} />
              <div className="space-y-1">
                <span className="font-bold block">
                  {isBn
                    ? 'ক্যাশআউট নীতি (Migration 025): সর্বনিম্ন ব্যালেন্স ৳৬০০ ও উত্তোলন ৳৫০০'
                    : 'Cashout Policy: Min Balance ৳600 & Min Cashout ৳500'}
                </span>
                <p>
                  {isBn
                    ? `বর্তমান ব্যালেন্স: ৳${currentBal.toLocaleString()}। সিস্টেম রুল অনুযায়ী ওয়ালেটে কমপক্ষে ৳৬০০ ব্যালেন্স থাকতে হবে যাতে নির্ধারিত ৳৫০০ উত্তোলন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়।`
                    : `Current balance: ৳${currentBal.toLocaleString()}. According to system rules, a minimum balance of ৳600 must be in your wallet to process a ৳500 cashout.`}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Payout Method */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                {isBn ? 'টাকা গ্রহণের মাধ্যম' : 'Payout Method'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bKash', label: 'বিকাশ (bKash)' },
                  { id: 'Nagad', label: 'নগদ (Nagad)' },
                  { id: 'Rocket', label: 'রকেট (Rocket)' },
                  { id: 'Bank', label: 'ব্যাংক ট্রান্সফার' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, payoutMethod: m.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      withdrawForm.payoutMethod === m.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  {isBn ? 'উত্তোলনের পরিমাণ (৳)' : 'Withdrawal Amount (৳)'}
                </label>
                <input
                  type="number"
                  min="100"
                  max={currentBal}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-bold"
                  placeholder="500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  {isBn ? 'পেমেন্ট গ্রহণের নম্বর / একাউন্ট' : 'Recipient Account Number'}
                </label>
                <input
                  type="text"
                  value={withdrawForm.payoutNumber}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, payoutNumber: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-normal">
              {isBn
                ? '* আবেদন করার পর ২৪ ঘণ্টার মধ্যে অ্যাডমিন রিভিউ সাপেক্ষে আপনার একাউন্টে টাকা পাঠিয়ে দেওয়া হবে।'
                : '* Payout will be dispatched to your account within 24 hours upon admin review.'}
            </p>

            <button
              type="submit"
              disabled={isSubmitting || currentBal < 600}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'আবেদন জমা হচ্ছে...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isBn ? 'উত্তোলন আবেদন জমা দিন' : 'Submit Cashout Request'}</span>
                </>
              )}
            </button>
          </form>

          {/* Past Withdrawals List */}
          {withdrawals.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h5 className="text-xs font-bold text-gray-900 mb-2.5">
                {isBn ? 'পূর্বে পাঠানো উত্তোলনের আবেদন' : 'Past Withdrawal Requests'}
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2.5">{isBn ? 'তারিখ' : 'Date'}</th>
                      <th className="py-2 px-2.5">{isBn ? 'মাধ্যম' : 'Method'}</th>
                      <th className="py-2 px-2.5">{isBn ? 'নম্বর' : 'Account'}</th>
                      <th className="py-2 px-2.5">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="py-2 px-2.5 text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="py-2 px-2.5 text-gray-600">
                          {new Date(w.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-gray-900">{w.payoutMethod}</td>
                        <td className="py-2 px-2.5 font-mono text-gray-600">{w.payoutNumber}</td>
                        <td className="py-2 px-2.5 font-black text-purple-700">৳{w.amount}</td>
                        <td className="py-2 px-2.5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (w.status as string) === 'approved' || (w.status as string) === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : (w.status as string) === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {(w.status as string) === 'approved' || (w.status as string) === 'completed'
                              ? (isBn ? 'অনুমোদিত' : 'Paid')
                              : (w.status as string) === 'rejected'
                              ? (isBn ? 'বাতিল' : 'Rejected')
                              : (isBn ? 'অপেক্ষমান' : 'Pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: TRANSACTION HISTORY / LEDGER ================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-gray-950 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'লেনদেন হিস্ট্রি ও লেজার' : 'Transaction History & Ledger'}</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {isBn ? 'ক্রেডিট, ডেবিট, রিচার্জ ও উত্তোলনের সার্বক্ষণিক বিবরণী' : 'Full atomic audit log of credits and debits'}
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: isBn ? 'সব' : 'All' },
                { id: 'credit', label: isBn ? 'জমা' : 'Credit' },
                { id: 'debit', label: isBn ? 'খরচ' : 'Debit' },
                { id: 'add_money', label: isBn ? 'রিচার্জ' : 'Recharge' },
                { id: 'transfer', label: isBn ? 'P2P' : 'P2P' },
                { id: 'withdraw', label: isBn ? 'ক্যাশআউট' : 'Cashout' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTxFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    txFilter === f.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <History className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-semibold">
                {isBn ? 'এই ক্যাটাগরিতে কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found in this category.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => {
                const isIncoming = tx.amount > 0;
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/80 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncoming ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {tx.type === 'add_money'
                              ? (isBn ? 'ওয়ালেট রিচার্জ (Add Money)' : 'Recharge')
                              : (tx.type as string) === 'transfer' || (tx.type as string) === 'p2p_transfer' || (tx.type as string) === 'transfer_out' || (tx.type as string) === 'transfer_in'
                              ? (isBn ? 'P2P সেন্ড মানি' : 'P2P Transfer')
                              : (tx.type as string) === 'withdraw' || (tx.type as string) === 'withdrawal'
                              ? (isBn ? 'টাকা উত্তোলন (Cashout)' : 'Cashout')
                              : tx.type === 'purchase'
                              ? (isBn ? 'পণ্য বা সেবা ক্রয়' : 'Purchase')
                              : tx.note || tx.type}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                              (tx.status as string) === 'completed' || (tx.status as string) === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : (tx.status as string) === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                          <span>{new Date(tx.createdAt || Date.now()).toLocaleString()}</span>
                          {tx.trxId && <span>• TrxID: {tx.trxId}</span>}
                          {tx.paymentMethod && <span>• {tx.paymentMethod}</span>}
                        </div>
                        {tx.note && <p className="text-[11px] text-gray-600 mt-0.5">{tx.note}</p>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm sm:text-base font-black tracking-tight ${
                          isIncoming ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncoming ? '+' : ''}৳ {Math.abs(tx.amount).toLocaleString()}
                      </span>
                      {tx.balanceAfter !== undefined && (
                        <span className="text-[10px] text-gray-400 block font-mono">
                          {isBn ? 'অবশিষ্ট:' : 'Bal:'} ৳{tx.balanceAfter.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JPayWalletSection;
