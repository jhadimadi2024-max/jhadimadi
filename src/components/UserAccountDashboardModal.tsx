import React, { useState, useMemo } from 'react';
import { 
  X, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  Trash2, 
  Wallet, 
  Briefcase, 
  Star, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  Phone, 
  Check, 
  AlertCircle,
  ShoppingBag,
  Wrench,
  ChevronRight,
  Sparkles,
  Award,
  ArrowDownLeft,
  Send,
  History,
  RefreshCw
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { walletService, Wallet as JPayWallet, WalletTransaction } from '../services/walletService';

export interface UserAccountDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  lang?: Language;
  onEditProfile?: (user: UserProfile) => void;
  onSignOut?: () => void;
  onDeleteProfile?: () => void;
  initialTab?: 'dashboard' | 'edit' | 'account_control';
}

export const UserAccountDashboardModal: React.FC<UserAccountDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lang = 'bn',
  onEditProfile,
  onSignOut,
  onDeleteProfile,
  initialTab = 'dashboard'
}) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'account_control'>(
    initialTab === 'account_control' ? 'account_control' : 'dashboard'
  );

  // Delete Profile Safeguard state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCheckboxAccepted, setDeleteCheckboxAccepted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live J-Pay Wallet State (Migration 025)
  const effectiveUserId = String(currentUser?.id || currentUser?.memberUID || currentUser?.phone || '');
  const [liveWallet, setLiveWallet] = useState<JPayWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [walletAction, setWalletAction] = useState<'none' | 'add' | 'send' | 'withdraw' | 'history'>('none');
  const [walletNotice, setWalletNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);

  // Forms
  const [addMoneyForm, setAddMoneyForm] = useState({
    amount: '500',
    method: 'bKash',
    trxId: '',
    senderNumber: currentUser?.phone || ''
  });
  const [sendMoneyForm, setSendMoneyForm] = useState({
    receiver: '',
    amount: '100',
    note: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '500',
    method: 'bKash',
    payoutNumber: currentUser?.phone || ''
  });

  const refreshWallet = async () => {
    if (!effectiveUserId) return;
    setIsWalletLoading(true);
    try {
      const res = await walletService.getWallet(effectiveUserId);
      if (res.success) {
        setLiveWallet(res.wallet);
        setTransactions(res.transactions);
      }
    } catch (e) {
      console.warn('[UserAccountDashboardModal] Wallet load note:', e);
    } finally {
      setIsWalletLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && effectiveUserId) {
      refreshWallet();
      const unsub = walletService.subscribeToWallet(effectiveUserId, (updated) => {
        setLiveWallet(updated);
      });
      return () => unsub();
    }
  }, [isOpen, effectiveUserId]);

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(addMoneyForm.amount);
    if (!amt || amt <= 0) {
      setWalletNotice({ type: 'error', message: 'সঠিক টাকার পরিমাণ উল্লেখ করুন (সর্বনিম্ন ৳৫০)' });
      return;
    }
    if (!addMoneyForm.trxId.trim()) {
      setWalletNotice({ type: 'error', message: 'অনুগ্রহ করে TrxID (ট্রানজেকশন আইডি) লিখুন' });
      return;
    }
    if (!addMoneyForm.senderNumber.trim()) {
      setWalletNotice({ type: 'error', message: 'যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন' });
      return;
    }

    setIsSubmittingWallet(true);
    setWalletNotice(null);
    try {
      const res = await walletService.requestAddMoney({
        amount: amt,
        paymentMethod: addMoneyForm.method,
        trxId: addMoneyForm.trxId,
        senderNumber: addMoneyForm.senderNumber,
        userId: effectiveUserId
      });
      if (res.success) {
        setWalletNotice({ type: 'success', message: res.message });
        setAddMoneyForm({ amount: '500', method: 'bKash', trxId: '', senderNumber: currentUser?.phone || '' });
        await refreshWallet();
      } else {
        setWalletNotice({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'রিকোয়েস্ট ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const handleSendMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(sendMoneyForm.amount);
    const currBal = liveWallet ? liveWallet.balance : 0;
    if (!amt || amt <= 0) {
      setWalletNotice({ type: 'error', message: 'সঠিক টাকার পরিমাণ উল্লেখ করুন' });
      return;
    }
    if (amt > currBal) {
      setWalletNotice({ type: 'error', message: `অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${currBal}।` });
      return;
    }
    if (!sendMoneyForm.receiver.trim()) {
      setWalletNotice({ type: 'error', message: 'প্রাপকের মোবাইল নম্বর বা ইউজার আইডি লিখুন' });
      return;
    }

    setIsSubmittingWallet(true);
    setWalletNotice(null);
    try {
      const res = await walletService.transferP2P({
        senderId: effectiveUserId,
        receiverIdentifier: sendMoneyForm.receiver,
        amount: amt,
        note: sendMoneyForm.note
      });
      if (res.success) {
        setWalletNotice({ type: 'success', message: res.message });
        setSendMoneyForm({ receiver: '', amount: '100', note: '' });
        await refreshWallet();
      } else {
        setWalletNotice({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'ট্রান্সফার ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawForm.amount);
    const currBal = liveWallet ? liveWallet.balance : 0;
    if (!amt || amt <= 0) {
      setWalletNotice({ type: 'error', message: 'সঠিক উত্তোলনের পরিমাণ উল্লেখ করুন' });
      return;
    }
    if (currBal < 600) {
      setWalletNotice({
        type: 'error',
        message: `টাকা উত্তোলনের জন্য অ্যাকাউন্টে সর্বনিম্ন ৳৬০০ থাকতে হবে। আপনার ব্যালেন্স ৳${currBal}।`
      });
      return;
    }
    if (currBal - amt < 100) {
      setWalletNotice({
        type: 'error',
        message: `উত্তোলনের পর অ্যাকাউন্টে নূন্যতম ৳১০০ রিজার্ভ থাকতে হবে। আপনি সর্বোচ্চ ৳${Math.max(0, currBal - 100)} উত্তোলন করতে পারবেন।`
      });
      return;
    }
    if (!withdrawForm.payoutNumber.trim()) {
      setWalletNotice({ type: 'error', message: 'পেমেন্ট গ্রহণের মোবাইল নম্বর দিন' });
      return;
    }

    setIsSubmittingWallet(true);
    setWalletNotice(null);
    try {
      const res = await walletService.requestWithdrawal({
        amount: amt,
        payoutMethod: withdrawForm.method,
        payoutNumber: withdrawForm.payoutNumber,
        userId: effectiveUserId
      });
      if (res.success) {
        setWalletNotice({ type: 'success', message: res.message });
        setWithdrawForm({ amount: '500', method: 'bKash', payoutNumber: currentUser?.phone || '' });
        await refreshWallet();
      } else {
        setWalletNotice({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'উইথড্রয়াল রিকোয়েস্ট ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  // Role detection
  const role = (currentUser?.role || '').toLowerCase();
  const uid = String(currentUser?.memberUID || currentUser?.sellerCode || currentUser?.uniqueId || '');
  const isSeller = role === 'seller' || role === 'product_seller' || uid.startsWith('JH-S-');
  const isService = role === 'service_provider' || role === 'provider' || role === 'professional' || uid.startsWith('JH-P-');
  const isPermanent = role === 'permanent_member' || role === 'permanent' || uid.startsWith('JH-M-');

  // Metrics (Zero Base: derived strictly from user profile with zero defaults)
  const totalEarnings = currentUser?.totalEarnings || (currentUser as any)?.walletBalance || 0;
  const currentBalance = (currentUser as any)?.currentBalance || 0;
  const pendingEscrow = currentUser?.pendingEscrow || 0;
  const completedJobsCount = currentUser?.completedJobs || (currentUser as any)?.completedOrders || 0;
  const activeTasksCount = (currentUser as any)?.activeJobs || 0;
  const rating = currentUser?.rating || 0;
  const reviewsCount = currentUser?.reviewsCount || 0;

  // Real user tasks data (Zero Base: empty if no tasks recorded)
  const recentTasks: Array<{
    id: string;
    title: string;
    client: string;
    amount: number;
    status: 'completed' | 'in_progress';
    date: string;
    rating?: number | null;
  }> = useMemo(() => {
    return (currentUser as any)?.tasks || (currentUser as any)?.recentOrders || [];
  }, [currentUser]);

  // Real user reviews data (Zero Base: empty if no reviews submitted)
  const clientReviews: Array<{
    name: string;
    rating: number;
    date: string;
    comment: string;
  }> = useMemo(() => {
    return (currentUser as any)?.reviews || [];
  }, [currentUser]);

  // Activity logs (Zero Base: empty if no activity logs)
  const activityLogs: Array<{
    title: string;
    time: string;
    amount?: string | null;
    type: string;
  }> = useMemo(() => {
    return (currentUser as any)?.activityLogs || [];
  }, [currentUser]);

  if (!isOpen) return null;

  const handleExecuteDelete = () => {
    if (!deleteCheckboxAccepted) return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      if (onDeleteProfile) {
        onDeleteProfile();
      }
      onClose();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      id="user-account-dashboard-modal"
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name || 'User'} 
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{(currentUser?.name || currentUser?.fullName || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white truncate">
                  {currentUser?.name || currentUser?.fullName || (isBn ? 'ব্যবহারকারী' : 'User')}
                </h3>
                <span className="text-[10px] font-mono bg-white/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  {uid || 'JH-MEMBER'}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 truncate">
                {isSeller 
                  ? (isBn ? 'পণ্য বিক্রেতা পার্টনার' : 'Product Seller Partner') 
                  : isService 
                  ? (currentUser?.profession || (isBn ? 'সেবা প্রদানকারী প্রফেশনাল' : 'Service Provider'))
                  : isPermanent 
                  ? (isBn ? 'স্থায়ী ভেরিফাইড সদস্য' : 'Permanent Verified Member')
                  : (isBn ? 'গ্রাহক অ্যাকাউন্ট' : 'Customer Account')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            id="btn-close-dashboard-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1.5 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setShowDeleteConfirm(false);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            id="tab-modal-dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentUser && onEditProfile) {
                onEditProfile(currentUser);
                onClose();
              }
            }}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
            id="tab-modal-profile-edit"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{isBn ? 'প্রোফাইল এডিট' : 'Profile Edit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account_control')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'account_control'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-gray-600 hover:text-rose-600'
            }`}
            id="tab-modal-account-control"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>{isBn ? 'অ্যাকাউন্ট কন্ট্রোল' : 'Account Control'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/50">
          {activeTab === 'dashboard' && (
            <div className="space-y-4" id="view-dashboard-metrics">
              
              {/* 1. J-Pay Live Wallet & Ledger Card (Migration 025) */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900">
                          {isBn ? 'J-Pay ডিজিটাল ওয়ালেট' : 'J-Pay Digital Wallet'}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">
                          Migration 025 Live
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {isBn ? 'অ্যাটমিক লেজার ও সার্বক্ষণিক ব্যালেন্স' : 'Atomic double-entry balance'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={refreshWallet}
                    disabled={isWalletLoading}
                    title="রিফ্রেশ করুন"
                    className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isWalletLoading ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>

                {/* Live Balance Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-emerald-800 block">
                      {isBn ? 'ওয়ালেট ব্যালেন্স' : 'Available Balance'}
                    </span>
                    <span className="text-base font-black text-emerald-950">
                      ৳ {(liveWallet ? liveWallet.balance : currentBalance).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-gray-600 block">
                      {isBn ? 'মোট ডিপোজিট' : 'Total Deposited'}
                    </span>
                    <span className="text-base font-black text-gray-900">
                      ৳ {(liveWallet ? liveWallet.totalDeposited : totalEarnings).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-amber-800 block">
                      {isBn ? 'এসক্রো পেন্ডিং' : 'Pending Escrow'}
                    </span>
                    <span className="text-base font-black text-amber-900">
                      ৳ {(liveWallet ? liveWallet.pendingEscrow : pendingEscrow).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Wallet Action Tabs */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setWalletAction(walletAction === 'add' ? 'none' : 'add')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      walletAction === 'add'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>{isBn ? 'টাকা যোগ' : 'Add Money'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAction(walletAction === 'send' ? 'none' : 'send')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      walletAction === 'send'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isBn ? 'টাকা পাঠান' : 'Send'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAction(walletAction === 'withdraw' ? 'none' : 'withdraw')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      walletAction === 'withdraw'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAction(walletAction === 'history' ? 'none' : 'history')}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      walletAction === 'history'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{isBn ? 'হিস্ট্রি' : 'History'}</span>
                  </button>
                </div>

                {/* Notifications & Feedback */}
                {walletNotice && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                      walletNotice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {walletNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="flex-1 leading-snug">{walletNotice.message}</span>
                    <button
                      type="button"
                      onClick={() => setWalletNotice(null)}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Add Money Sub-Panel */}
                {walletAction === 'add' && (
                  <form onSubmit={handleAddMoneySubmit} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">
                        {isBn ? 'ওয়ালেটে টাকা রিচার্জ (Add Money)' : 'Add Money to Wallet'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">bKash/Nagad: 01886121415 (Personal)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {['bKash', 'Nagad', 'Rocket'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAddMoneyForm({ ...addMoneyForm, method: m })}
                          className={`py-1 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                            addMoneyForm.method === m
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">টাকার পরিমাণ (৳)</label>
                        <input
                          type="number"
                          min="50"
                          value={addMoneyForm.amount}
                          onChange={(e) => setAddMoneyForm({ ...addMoneyForm, amount: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          placeholder="500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">প্রেরক নম্বর</label>
                        <input
                          type="text"
                          value={addMoneyForm.senderNumber}
                          onChange={(e) => setAddMoneyForm({ ...addMoneyForm, senderNumber: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-700 block mb-0.5">TrxID (ট্রানজেকশন আইডি)</label>
                      <input
                        type="text"
                        value={addMoneyForm.trxId}
                        onChange={(e) => setAddMoneyForm({ ...addMoneyForm, trxId: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg uppercase font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        placeholder="e.g. 9J283KD76"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWallet}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingWallet ? 'অনুরোধ পাঠানো হচ্ছে...' : 'রিচার্জ অনুরোধ পাঠান'}
                    </button>
                  </form>
                )}

                {/* 2. Send Money Sub-Panel */}
                {walletAction === 'send' && (
                  <form onSubmit={handleSendMoneySubmit} className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2.5">
                    <span className="text-xs font-bold text-blue-900 block">
                      {isBn ? 'অন্য গ্রাহক বা সেবাদাতাকে টাকা পাঠান (P2P)' : 'Transfer Money (P2P)'}
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">প্রাপক ফোন / আইডি</label>
                        <input
                          type="text"
                          value={sendMoneyForm.receiver}
                          onChange={(e) => setSendMoneyForm({ ...sendMoneyForm, receiver: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="01XXXXXXXXX বা JH-P-01"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">টাকার পরিমাণ (৳)</label>
                        <input
                          type="number"
                          min="10"
                          value={sendMoneyForm.amount}
                          onChange={(e) => setSendMoneyForm({ ...sendMoneyForm, amount: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-700 block mb-0.5">নোট (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        value={sendMoneyForm.note}
                        onChange={(e) => setSendMoneyForm({ ...sendMoneyForm, note: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="কাজের বিল বা পণ্য ক্রয়ের বিবরণ"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWallet}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingWallet ? 'পাঠানো হচ্ছে...' : 'তাত্ক্ষণিক টাকা পাঠান'}
                    </button>
                  </form>
                )}

                {/* 3. Withdraw Sub-Panel */}
                {walletAction === 'withdraw' && (
                  <form onSubmit={handleWithdrawSubmit} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">
                        {isBn ? 'টাকা উত্তোলন (ক্যাশআউট)' : 'Cashout / Withdrawal'}
                      </span>
                      <span className="text-[10px] text-purple-700 font-semibold">মিনিমাম ওয়ালেট ব্যালেন্স: ৳৬০০</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {['bKash', 'Nagad'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setWithdrawForm({ ...withdrawForm, method: m })}
                          className={`py-1 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                            withdrawForm.method === m
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">উত্তোলনের পরিমাণ (৳)</label>
                        <input
                          type="number"
                          min="100"
                          value={withdrawForm.amount}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                          placeholder="500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 block mb-0.5">পেমেন্ট গ্রহণ নম্বর</label>
                        <input
                          type="text"
                          value={withdrawForm.payoutNumber}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, payoutNumber: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500">
                      * আবেদনের পর ২৪ ঘণ্টার মধ্যে অ্যাডমিন রিভিউ সাপেক্ষে টাকা পাঠিয়ে দেওয়া হবে।
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmittingWallet}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingWallet ? 'আবেদন পাঠানো হচ্ছে...' : 'উত্তোলন আবেদন জমা দিন'}
                    </button>
                  </form>
                )}

                {/* 4. Ledger History Sub-Panel */}
                {walletAction === 'history' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {isBn ? 'ওয়ালেট ট্রানজেকশন লেজার' : 'Wallet Transaction Ledger'}
                      </span>
                      <span className="text-[10px] text-slate-500">{transactions.length} টি রেকর্ড</span>
                    </div>

                    {transactions.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-400">এখনো কোনো ট্রানজেকশন হয়নি</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                        {transactions.map((t) => (
                          <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-gray-900 block capitalize">
                                {t.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {new Date(t.createdAt).toLocaleDateString('bn-BD', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}{' '}
                                {t.note ? `• ${t.note}` : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`font-black ${
                                  t.type === 'add_money' || t.type === 'transfer_in' || t.type === 'earning'
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {t.type === 'add_money' || t.type === 'transfer_in' || t.type === 'earning' ? '+' : '-'}
                                ৳{t.amount}
                              </span>
                              <span className="block text-[9px] text-gray-400 capitalize">{t.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Tasks & Performance Overview */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {isBn ? 'কাজ ও অর্ডারের পরিসংখ্যান' : 'Tasks & Order Performance'}
                      </h4>
                      <span className="text-[10px] text-gray-500">
                        {isBn ? 'গ্রাহক অনুরোধ ও ডেলিভারি অগ্রগতি' : 'Order and task records'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                    {completedJobsCount} {isBn ? 'টি সম্পন্ন' : 'Completed'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block">{isBn ? 'চলমান কাজ/অর্ডার' : 'Active Tasks'}</span>
                      <span className="text-sm font-bold text-gray-900">{activeTasksCount} টি</span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block">{isBn ? 'সম্পন্ন হয়েছে' : 'Completed Total'}</span>
                      <span className="text-sm font-bold text-emerald-800">{completedJobsCount} টি</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                {/* List of Tasks */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    {isBn ? 'সাম্প্রতিক কাজের তালিকা:' : 'Recent Tasks:'}
                  </span>
                  {recentTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      {isBn ? 'এখনও কোনো কাজের রেকর্ড নেই (০টি কাজ)' : 'No task records found (0 tasks)'}
                    </div>
                  ) : (
                    recentTasks.map((t) => (
                      <div key={t.id} className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-200 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 truncate">{t.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status === 'completed' ? (isBn ? 'সম্পন্ন' : 'Done') : (isBn ? 'চলমান' : 'In Progress')}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{t.client} • {t.date}</p>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-xs shrink-0">
                          ৳ {t.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Ratings & Client Feedback */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {isBn ? 'স্টার রেটিং ও গ্রাহক রিভিউ' : 'Ratings & Customer Reviews'}
                      </h4>
                      <span className="text-[10px] text-gray-500">
                        {isBn ? 'কাজের মান ও সেবার মূল্যায়ন' : 'Service quality feedback'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-900">{rating > 0 ? rating : '০.০'}</span>
                    <span className="text-[10px] text-gray-400">({reviewsCount})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {clientReviews.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      {isBn ? 'এখনও কোনো গ্রাহক রিভিউ জমা পড়েনি।' : 'No reviews submitted yet.'}
                    </div>
                  ) : (
                    clientReviews.map((r, i) => (
                      <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{r.name}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-600 italic">"{r.comment}"</p>
                        <span className="text-[9px] text-gray-400 block">{r.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Activity Log */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {isBn ? 'সাম্প্রতিক অ্যাক্টিভিটি হিস্ট্রি' : 'Recent Activity Log'}
                    </h4>
                    <span className="text-[10px] text-gray-500">
                      {isBn ? 'সদস্য অ্যাকাউন্টের গুরুত্বপূর্ণ ইভেন্টসমূহ' : 'Latest account interactions'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {activityLogs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      {isBn ? 'এখনও কোনো সাম্প্রতিক অ্যাক্টিভিটি রেকর্ড নেই।' : 'No recent activity recorded yet.'}
                    </div>
                  ) : (
                    activityLogs.map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <div>
                            <p className="font-semibold text-gray-800 text-[11px]">{log.title}</p>
                            <span className="text-[9px] text-gray-400">{log.time}</span>
                          </div>
                        </div>
                        {log.amount && (
                          <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {log.amount}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Account Control Tab (Sign Out & Safe Profile Deletion) */}
          {activeTab === 'account_control' && (
            <div className="space-y-4" id="view-account-control">
              {/* Account Details Box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{isBn ? 'নিরাপত্তা ও অ্যাকাউন্ট ব্যবস্থাপনা' : 'Security & Account Management'}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">{isBn ? 'নিবন্ধন আইডি:' : 'Member UID:'}</span>
                    <span className="font-mono font-bold text-gray-900">{uid || 'JH-MEMBER'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</span>
                    <span className="font-mono font-bold text-gray-900">
                      {isService 
                        ? (isBn ? '••••••••••• (সুরক্ষিত)' : '••••••••••• (Protected)')
                        : (currentUser?.phone || '-')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">{isBn ? 'এলাকা / জেলা:' : 'Location:'}</span>
                    <span className="font-bold text-gray-900">{currentUser?.upazila || 'সদর'}, {currentUser?.district || 'খাগড়াছড়ি'}</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Option */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>{isBn ? 'রেজিস্ট্রেশন তথ্য পরিবর্তন' : 'Update Registration Details'}</span>
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isBn 
                    ? 'আপনার দোকান, পেশা, পণ্যের তালিকা বা কভারেজ এলাকার তথ্য যে কোনো সময় আপডেট করতে পারেন।' 
                    : 'Update your shop, profession, product catalogue or location tags at any time.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser && onEditProfile) {
                      onEditProfile(currentUser);
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  id="btn-trigger-edit-from-control"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isBn ? 'প্রোফাইল এডিট ফর্ম খুলুন' : 'Open Profile Edit Form'}</span>
                </button>
              </div>

              {/* Sign Out Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-gray-600" />
                  <span>{isBn ? 'সাইন আউট (লগআউট)' : 'Sign Out'}</span>
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isBn 
                    ? 'বর্তমান ডিভাইস থেকে নিরাপদে আপনার সেশন বন্ধ করুন।' 
                    : 'Safely terminate your current session on this device.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onSignOut) onSignOut();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  id="btn-modal-signout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isBn ? 'সাইন আউট করুন' : 'Sign Out'}</span>
                </button>
              </div>

              {/* Delete Profile Card */}
              <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-4 shadow-xs space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">
                      {isBn ? 'প্রোফাইল স্থায়ীভাবে মুছে ফেলুন (Delete Profile)' : 'Permanent Profile Deletion'}
                    </h4>
                    <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                      {isBn 
                        ? 'এটি আপনার সদস্য আইডি, তালিকাভুক্ত পণ্য বা সার্ভিস, রিভিউ এবং ওয়ালেট ডেটা স্থায়ীভাবে মুছে ফেলবে। এই প্রক্রিয়া অপরিবর্তনীয়।' 
                        : 'Permanently deletes your member UID, listings, reviews, and wallet records. Irreversible action.'}
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id="btn-modal-delete-profile-open"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isBn ? 'প্রোফাইল মুছতে ক্লিক করুন' : 'Request Profile Deletion'}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-3 animate-in fade-in">
                    <label className="flex items-start gap-2 text-xs text-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={deleteCheckboxAccepted}
                        onChange={(e) => setDeleteCheckboxAccepted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        id="checkbox-confirm-profile-delete"
                      />
                      <span className="font-semibold text-[11px] leading-snug">
                        {isBn 
                          ? 'আমি বুঝে শুনে আমার অ্যাকাউন্ট ও সকল তথ্য চিরতরে মুছে ফেলার অনুমোদন দিচ্ছি।' 
                          : 'I confirm that I understand this deletion is permanent and cannot be undone.'}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>

                      <button
                        type="button"
                        disabled={!deleteCheckboxAccepted || isDeleting}
                        onClick={handleExecuteDelete}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
                        id="btn-modal-confirm-final-delete"
                      >
                        {isDeleting ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span>{isBn ? 'নিশ্চিত মুছে ফেলুন' : 'Delete Now'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Profile Link */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>jhadimadi.com verified account</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
