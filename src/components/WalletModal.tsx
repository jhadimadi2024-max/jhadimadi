import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { Language } from '../types';
import { walletService, Wallet, WalletTransaction } from '../services/walletService';

export interface WalletState {
  availableBalance: number;
  pendingEscrow: number;
  totalGrossSales: number;
  totalOrders: number;
  currency: string;
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  sellerProfile?: any;
  initialBalance?: number;
  lang?: Language;
  onBalanceUpdate?: (newBalance: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sellerProfile,
  initialBalance = 12500,
  lang = 'bn',
  onBalanceUpdate,
}) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<'overview' | 'add_money' | 'withdraw' | 'history'>('overview');
  
  // Wallet data state
  const effectiveUserId = useMemo(() => {
    return (
      currentUser?.id ||
      currentUser?.memberUID ||
      currentUser?.sellerCode ||
      sellerProfile?.id ||
      sellerProfile?.uniqueId ||
      'seller_default_uid'
    );
  }, [currentUser, sellerProfile]);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states: Add Money
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyMethod, setAddMoneyMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('bKash');
  const [addMoneyTrxId, setAddMoneyTrxId] = useState('');
  const [addMoneySenderPhone, setAddMoneySenderPhone] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states: Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad' | 'Bank'>('bKash');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Copied indicator
  const [copiedNumber, setCopiedNumber] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch or initialize wallet
  const loadWalletData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const res = await walletService.getWallet(effectiveUserId);
      if (res && res.wallet) {
        setWallet(res.wallet);
        if (onBalanceUpdate) onBalanceUpdate(res.wallet.balance);
        if (res.transactions && res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
      } else {
        // Fallback demo state
        setWallet({
          id: `wallet_${effectiveUserId}`,
          userId: effectiveUserId,
          balance: initialBalance,
          pendingEscrow: 3450,
          totalDeposited: 15000,
          totalWithdrawn: 2500,
          totalSpent: 0,
          totalEarned: initialBalance + 2500,
          currency: 'BDT',
          isFrozen: false,
        });
      }
    } catch (err) {
      console.warn('[WalletModal] Error loading wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, effectiveUserId, initialBalance, onBalanceUpdate]);

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
    }
  }, [isOpen, loadWalletData]);

  if (!isOpen) return null;

  const currentBalance = wallet?.balance ?? initialBalance;
  const pendingEscrow = wallet?.pendingEscrow ?? 3450;
  const totalSalesRevenue = (wallet?.totalEarned || (currentBalance + 18200));
  const totalOrdersCount = sellerProfile?.products?.length ? sellerProfile.products.length * 4 + 12 : 28;

  // Handle Add Money Submit
  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addMoneyAmount);
    if (!amt || amt < 50) {
      alert(isBn ? 'সর্বনিম্ন ৫০ টাকা রিচার্জ করা যাবে।' : 'Minimum recharge amount is 50 BDT.');
      return;
    }
    if (!addMoneyTrxId.trim()) {
      alert(isBn ? 'অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Please enter the transaction ID (TrxID).');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await walletService.requestAddMoney({
        userId: effectiveUserId,
        amount: amt,
        paymentMethod: addMoneyMethod,
        trxId: addMoneyTrxId.trim().toUpperCase(),
        senderNumber: addMoneySenderPhone.trim() || '01XXXXXXXXX'
      });

      if (res && res.success) {
        showToast(isBn ? 'টাকা যোগ করার অনুরোধ সফলভাবে জমা হয়েছে!' : 'Add money request submitted successfully!');
        setAddMoneyAmount('');
        setAddMoneyTrxId('');
        setAddMoneySenderPhone('');
        setActiveTab('overview');
        loadWalletData();
      } else {
        showToast(res?.message || (isBn ? 'অনুরোধ জমা হয়েছে' : 'Request submitted'));
        setActiveTab('overview');
      }
    } catch (err: any) {
      alert(err?.message || (isBn ? 'অনুরোধ ব্যর্থ হয়েছে।' : 'Request failed.'));
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Withdraw Submit
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 100) {
      alert(isBn ? 'সর্বনিম্ন ১০০ টাকা উত্তোলন করা যাবে।' : 'Minimum withdrawal amount is 100 BDT.');
      return;
    }
    if (amt > currentBalance) {
      alert(isBn ? 'ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।' : 'Insufficient wallet balance.');
      return;
    }
    if (!withdrawAccount.trim()) {
      alert(isBn ? 'অনুগ্রহ করে মোবাইল বা ব্যাংক অ্যাকাউন্ট নম্বর লিখুন।' : 'Please enter the account number.');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await walletService.requestWithdrawal({
        userId: effectiveUserId,
        amount: amt,
        payoutMethod: withdrawMethod,
        payoutNumber: withdrawAccount.trim()
      });

      if (res && res.success) {
        showToast(isBn ? 'উত্তোলন অনুরোধ সফলভাবে গৃহীত হয়েছে!' : 'Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        setWithdrawAccount('');
        setWithdrawNote('');
        setActiveTab('overview');
        loadWalletData();
      } else {
        showToast(res?.message || (isBn ? 'উত্তোলন অনুরোধ গৃহীত হয়েছে' : 'Withdrawal request received'));
        setActiveTab('overview');
      }
    } catch (err: any) {
      alert(err?.message || (isBn ? 'উত্তোলন ব্যর্থ হয়েছে।' : 'Withdrawal failed.'));
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const paymentNumbers = {
    bKash: '01812-345678',
    Nagad: '01712-987654',
    Rocket: '01912-345678-9',
  };

  return (
    <div
      id="jhapay-wallet-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="jhapay-wallet-modal-content"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-300">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  JhaPay ওয়ালেট ড্যাশবোর্ড
                </h3>
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.5 rounded">
                  মার্চেন্ট
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                {isBn ? 'নিরাপদ এসক্রো ও ইনস্ট্যান্ট পেমেন্ট গেটওয়ে' : 'Secure Escrow & Instant Payouts'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 px-2 pt-1.5 gap-1 shrink-0 text-xs font-bold text-stone-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            {isBn ? 'ওভারভিউ ও সেলস' : 'Overview & Sales'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_money')}
            className={`px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'add_money'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'টাকা যোগ করুন' : 'Add Money'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            className={`px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'withdraw'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>{isBn ? 'টাকা উত্তোলন' : 'Withdraw'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            {isBn ? 'লেনদেন হিস্ট্রি' : 'History'}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Balances Card */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-300">
                    <span className="font-semibold uppercase tracking-wider">
                      {isBn ? 'উপলব্ধ ওয়ালেট ব্যালেন্স' : 'Available JhaPay Balance'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isBn ? '১০০% সুরক্ষিত' : 'Protected'}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                      ৳{currentBalance.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">BDT</span>
                  </div>

                  {/* Actions row inside card */}
                  <div className="pt-2 flex items-center gap-2 border-t border-stone-700/80">
                    <button
                      type="button"
                      onClick={() => setActiveTab('add_money')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>{isBn ? 'টাকা যোগ করুন' : 'Add Money'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('withdraw')}
                      className="flex-1 py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-stone-600 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isBn ? 'টাকা উত্তোলন' : 'Withdraw'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics Grid: Total Sales, Orders, Escrow */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl">
                  <div className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-tight mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>{isBn ? 'মোট বিক্রি' : 'Total Sales'}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-950 font-mono">
                    ৳{totalSalesRevenue.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-emerald-700 font-medium">লাইফটাইম সেলস</span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
                  <div className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-tight mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{isBn ? 'পেন্ডিং এসক্রো' : 'Escrow Hold'}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-950 font-mono">
                    ৳{pendingEscrow.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-amber-700 font-medium">ডেলিভারি পর জমা</span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-xl">
                  <div className="text-[10px] sm:text-xs font-bold text-blue-800 uppercase tracking-tight mb-1 flex items-center justify-center gap-1">
                    <PackageCheck className="w-3 h-3 text-blue-600" />
                    <span>{isBn ? 'মোট অর্ডার' : 'Total Orders'}</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-blue-950 font-mono">
                    {totalOrdersCount} টি
                  </div>
                  <span className="text-[9px] text-blue-700 font-medium">সম্পন্ন ডেলিভারি</span>
                </div>
              </div>

              {/* Recent Transactions Snippet */}
              <div className="border border-stone-200 rounded-xl p-3 sm:p-4 bg-stone-50/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-stone-800">
                    {isBn ? 'সাম্প্রতিক ট্রানজেকশন' : 'Recent Transactions'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-emerald-700 font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    {isBn ? 'সব দেখুন →' : 'View all →'}
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white p-2.5 rounded-lg border border-stone-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 truncate max-w-[160px] sm:max-w-xs">
                            {tx.note || tx.type}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {tx.paymentMethod} • {new Date(tx.createdAt || Date.now()).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black font-mono ${
                            tx.type === 'withdrawal' ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? '-' : '+'}৳{tx.amount}
                        </span>
                        <span className="block text-[9px] font-bold text-emerald-600 capitalize">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD MONEY */}
          {activeTab === 'add_money' && (
            <form onSubmit={handleAddMoneySubmit} className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold">
                  {isBn ? 'ঝাদিমাদি মার্চেন্ট ডিপোজিট নির্দেশনা:' : 'Merchant Deposit Instructions:'}
                </p>
                <p className="text-[11px] leading-relaxed">
                  নিচের মার্চেন্ট নম্বরে টাকা সেন্ড মানি বা ক্যাশ-ইন করে ট্রানজেকশন আইডি (TrxID) দিন। যাচাই শেষে ব্যালেন্স তাৎক্ষণিক যুক্ত হবে।
                </p>
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'পেমেন্ট মাধ্যম বেছে নিন' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAddMoneyMethod(m)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                        addMoneyMethod === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Number Card */}
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    {addMoneyMethod} Merchant / Personal No:
                  </span>
                  <span className="text-sm font-black font-mono text-stone-900">
                    {paymentNumbers[addMoneyMethod as keyof typeof paymentNumbers] || '01812-345678'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const num = paymentNumbers[addMoneyMethod as keyof typeof paymentNumbers] || '01812-345678';
                    navigator.clipboard?.writeText(num);
                    setCopiedNumber(true);
                    setTimeout(() => setCopiedNumber(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'রিচার্জের পরিমাণ (টাকা)' : 'Recharge Amount (BDT)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-stone-400">৳</span>
                  <input
                    type="number"
                    min="50"
                    placeholder="যেমন: ৫০০"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* TrxID Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'} *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 9J7K2L8X10"
                  value={addMoneyTrxId}
                  onChange={(e) => setAddMoneyTrxId(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                />
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'প্রেরক মোবাইল নম্বর (যে নম্বর থেকে পাঠিয়েছেন)' : 'Sender Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={addMoneySenderPhone}
                  onChange={(e) => setAddMoneySenderPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingAdd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isBn ? 'রিচার্জ নিশ্চিত করুন' : 'Confirm Recharge'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: WITHDRAW REQUEST */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span>{isBn ? 'টাকা উত্তোলনের নিয়মাবলী:' : 'Payout Rules:'}</span>
                  <span className="font-mono font-black text-emerald-800">
                    ব্যালেন্স: ৳{currentBalance}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  সর্বনিম্ন উত্তোলন ১০০ টাকা। bKash/Nagad পেমেন্ট ১ থেকে ৪ ঘণ্টার মধ্যে পরিশোধ করা হয়।
                </p>
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {isBn ? 'উত্তোলন মাধ্যম বেছে নিন' : 'Withdrawal Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bKash', 'Nagad', 'Bank'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                        withdrawMethod === m
                          ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      {m === 'Bank' ? <Building2 className="w-4 h-4 text-amber-600" /> : <Smartphone className="w-4 h-4 text-amber-600" />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'উত্তোলনের পরিমাণ (টাকা)' : 'Withdrawal Amount (BDT)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-stone-400">৳</span>
                  <input
                    type="number"
                    min="100"
                    max={currentBalance}
                    placeholder="যেমন: ১০০০"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {withdrawMethod === 'Bank'
                    ? (isBn ? 'ব্যাংক নাম, ব্রাঞ্চ ও একাউন্ট নম্বর' : 'Bank, Branch & Account')
                    : (isBn ? `${withdrawMethod} নম্বর` : `${withdrawMethod} Number`)} *
                </label>
                <input
                  type="text"
                  placeholder={withdrawMethod === 'Bank' ? 'City Bank, Mirpur Branch, A/C: 12345678' : '01XXXXXXXXX'}
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isBn ? 'অতিরিক্ত বিবরণ (ঐচ্ছিক)' : 'Note (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সাপ্তাহিক মার্চেন্ট উইথড্র"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingWithdraw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  <span>{isBn ? 'উত্তোলন সাবমিট করুন' : 'Submit Withdrawal'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-1 border-b border-stone-200">
                <span>{isBn ? 'লেনদেনের পূর্ণ বিবরণী' : 'Full Ledger Statement'}</span>
                <button
                  type="button"
                  onClick={loadWalletData}
                  className="text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  {isBn ? 'কোনো পূর্ববর্তী লেনদেন নেই।' : 'No transactions recorded yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs hover:bg-stone-100/70 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            tx.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-stone-900 leading-tight">
                            {tx.note || (tx.type === 'withdrawal' ? 'ক্যাশআউট' : 'ডিপোজিট / সেলস')}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            মেথড: {tx.paymentMethod || 'JhaPay'} • {new Date(tx.createdAt || Date.now()).toLocaleString('bn-BD')}
                          </p>
                          {tx.trxId && (
                            <span className="text-[9px] font-mono text-stone-400 block">
                              TrxID: {tx.trxId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black font-mono block ${
                            tx.type === 'withdrawal' ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? '-' : '+'}৳{tx.amount}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            JhaPay Escrow Protection
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg font-bold transition cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
