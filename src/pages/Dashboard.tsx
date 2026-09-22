import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Wallet as WalletIcon,
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  LogOut,
  Trash2,
  Edit3,
  Award,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  RefreshCw,
  CreditCard,
  Check,
  X
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { JPayWalletSection } from '../components/wallet/JPayWalletSection';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { walletService } from '../services/walletService';

export type DashboardRole = 
  | 'seller' 
  | 'merchant' 
  | 'product_seller' 
  | 'service_provider' 
  | 'freelancer' 
  | 'service_seller' 
  | 'permanent_member' 
  | 'permanent';

export interface DashboardProps {
  role?: DashboardRole;
  currentUser?: UserProfile | any | null;
  profileData?: any;
  lang?: Language | 'bn' | 'en' | string;
  onBack?: () => void;
  onNavigateToCatalog?: () => void;
  onNavigateToEditProfile?: () => void;
  onNavigateToDetails?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  className?: string;
}

const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

export const Dashboard: React.FC<DashboardProps> = ({
  role = 'seller',
  currentUser,
  profileData,
  lang = 'bn',
  onBack,
  onNavigateToCatalog,
  onNavigateToEditProfile,
  onNavigateToDetails,
  onSignOut,
  onDeleteAccount,
  className = ''
}) => {
  const isBn = lang === 'bn';
  const [isThreeDotOpen, setIsThreeDotOpen] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'all' | 'wallet' | 'stats'>('all');

  // Normalize role type into 3 core archetypes
  const normalizedRole = useMemo<'seller' | 'service' | 'permanent'>(() => {
    const r = (role || currentUser?.role || profileData?.role || '').toLowerCase();
    if (r === 'service_provider' || r === 'service_seller' || r === 'freelancer' || r === 'service' || r === 'provider') {
      return 'service';
    }
    if (r === 'permanent_member' || r === 'permanent' || r === 'member') {
      return 'permanent';
    }
    return 'seller';
  }, [role, currentUser, profileData]);

  // Unified Profile Display Data
  const displayName = useMemo(() => {
    return (
      profileData?.shopName ||
      profileData?.fullName ||
      profileData?.name ||
      currentUser?.businessName ||
      currentUser?.name ||
      currentUser?.fullName ||
      (normalizedRole === 'seller' 
        ? (isBn ? 'পাহাড়ি খাঁটি বাজার ও হস্তশিল্প' : 'Hill Pure Mart & Crafts')
        : normalizedRole === 'service'
        ? (isBn ? 'প্রফেশনাল সেবা কেন্দ্র' : 'Professional Service Hub')
        : (isBn ? 'সম্মানিত স্থায়ী সদস্য' : 'Honored Permanent Member'))
    );
  }, [profileData, currentUser, normalizedRole, isBn]);

  const displaySubtitle = useMemo(() => {
    if (normalizedRole === 'seller') {
      return profileData?.category || profileData?.categoryBn || (isBn ? 'অনুমোদিত মার্চেন্ট ও পণ্য বিক্রেতা' : 'Authorized Merchant & Product Seller');
    }
    if (normalizedRole === 'service') {
      return profileData?.professionHeadline || profileData?.profession || profileData?.category || (isBn ? 'দক্ষ পেশাজীবী ও কারিগরি সেবাদাতা' : 'Verified Service Provider & Freelancer');
    }
    return isBn ? 'গণপ্রজাতন্ত্রী বাংলাদেশ অধিভুক্ত আঞ্চলিক প্রতিনিধি' : 'Authorized Regional Representative';
  }, [normalizedRole, profileData, isBn]);

  const displayUid = useMemo(() => {
    return (
      currentUser?.memberUID ||
      currentUser?.sellerCode ||
      currentUser?.uniqueId ||
      profileData?.memberUID ||
      profileData?.sellerCode ||
      profileData?.uniqueId ||
      (normalizedRole === 'seller' ? 'JH-S-7821' : normalizedRole === 'service' ? 'JH-P-4409' : 'JH-M-1025')
    );
  }, [currentUser, profileData, normalizedRole]);

  const displayAvatar = useMemo(() => {
    return (
      profileData?.avatar ||
      profileData?.profilePhotoUrl ||
      profileData?.logo ||
      currentUser?.profilePhotoUrl ||
      currentUser?.avatar ||
      (normalizedRole === 'seller'
        ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
        : normalizedRole === 'service'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80')
    );
  }, [profileData, currentUser, normalizedRole]);

  const displayLocation = useMemo(() => {
    const upazila = profileData?.upazila || currentUser?.upazila || (isBn ? 'দীঘিনালা' : 'Dighinala');
    const district = profileData?.district || currentUser?.district || (isBn ? 'খাগড়াছড়ি' : 'Khagrachhari');
    return `${upazila}, ${district}`;
  }, [profileData, currentUser, isBn]);

  // Role Badge Config
  const roleBadge = useMemo(() => {
    switch (normalizedRole) {
      case 'seller':
        return {
          title: isBn ? 'পণ্য বিক্রেতা (মার্চেন্ট)' : 'Product Seller / Merchant',
          tag: isBn ? 'মার্চেন্ট ড্যাশবোর্ড' : 'Merchant Dashboard',
          color: 'bg-emerald-50 text-[#065f46] border-emerald-300'
        };
      case 'service':
        return {
          title: isBn ? 'সেবা বিক্রেতা (ফ্রিল্যান্সার)' : 'Service Provider / Freelancer',
          tag: isBn ? 'সার্ভিস ড্যাশবোর্ড' : 'Service Dashboard',
          color: 'bg-blue-50 text-blue-800 border-blue-300'
        };
      case 'permanent':
        return {
          title: isBn ? 'স্থায়ী সদস্য (প্রতিনিধি)' : 'Permanent Member',
          tag: isBn ? 'প্রতিনিধি ড্যাশবোর্ড' : 'Representative Dashboard',
          color: 'bg-purple-50 text-purple-900 border-purple-300'
        };
    }
  }, [normalizedRole, isBn]);

  // =========================================================================
  // J-PAY LIVE WALLET STATE & SUPABASE HOOKS
  // =========================================================================
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
      'authenticated_user'
    );
  }, [currentUser, profileData]);

  // Live balance state (defaults to 0.00 as requested)
  const [walletBalance, setWalletBalance] = useState<number>(0.00);
  const [pendingEscrow, setPendingEscrow] = useState<number>(0.00);
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(true);
  const [walletNotice, setWalletNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Interactive Form: 'add_money' | 'transfer' | 'withdraw'
  const [activeActionForm, setActiveActionForm] = useState<'add_money' | 'transfer' | 'withdraw' | null>('add_money');

  // Form 1: "Add Money" Inputs
  const [addMoneyTrxId, setAddMoneyTrxId] = useState('');
  const [addMoneyAmount, setAddMoneyAmount] = useState('500');
  const [addMoneyMethod, setAddMoneyMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [addMoneySender, setAddMoneySender] = useState('');

  // Form 2: "P2P Transfer" Inputs
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Form 3: "Withdraw J-Pay" Inputs
  const [withdrawNumber, setWithdrawNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad'>('bKash');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch live balance from Supabase wallets table
  const fetchLiveBalance = useCallback(async () => {
    setIsWalletLoading(true);
    try {
      if (isSupabaseConfigured && effectiveUserId && effectiveUserId !== 'authenticated_user') {
        const { data, error } = await supabase
          .from('wallets')
          .select('balance, pending_escrow')
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (!error && data) {
          setWalletBalance(Number(data.balance) || 0.00);
          setPendingEscrow(Number(data.pending_escrow) || 0.00);
          setIsWalletLoading(false);
          return;
        }
      }

      // Fallback service
      const res = await walletService.getWallet(effectiveUserId);
      if (res.success && res.wallet) {
        setWalletBalance(Number(res.wallet.balance) || 0.00);
        setPendingEscrow(Number(res.wallet.pendingEscrow) || 0.00);
      }
    } catch (err: any) {
      console.warn('[Dashboard] fetchLiveBalance error:', err);
    } finally {
      setIsWalletLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchLiveBalance();

    // Supabase Realtime Subscription for live updates
    if (isSupabaseConfigured && effectiveUserId && effectiveUserId !== 'authenticated_user') {
      const channel = supabase
        .channel(`wallets_live_${effectiveUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${effectiveUserId}` },
          (payload: any) => {
            if (payload.new && typeof payload.new.balance !== 'undefined') {
              setWalletBalance(Number(payload.new.balance) || 0.00);
              setPendingEscrow(Number(payload.new.pending_escrow) || 0.00);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchLiveBalance, effectiveUserId]);

  // Submission Handler 1: Add Money (TrxID & Amount)
  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletNotice(null);
    const amountNum = Number(addMoneyAmount);
    if (!amountNum || amountNum <= 0) {
      setWalletNotice({ type: 'error', message: isBn ? 'সঠিক টাকার পরিমাণ লিখুন।' : 'Please enter a valid amount.' });
      return;
    }
    if (!addMoneyTrxId.trim()) {
      setWalletNotice({ type: 'error', message: isBn ? 'লেনদেনের TrxID প্রদান করুন।' : 'Transaction TrxID is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await walletService.requestAddMoney({
        userId: effectiveUserId,
        amount: amountNum,
        paymentMethod: addMoneyMethod,
        trxId: addMoneyTrxId.trim().toUpperCase(),
        senderNumber: addMoneySender.trim() || '01XXXXXXXXX'
      });

      if (res.success) {
        setWalletNotice({
          type: 'success',
          message: isBn
            ? `🎉 ৳${amountNum.toLocaleString()} রিচার্জ রিকোয়েস্ট গৃহীত হয়েছে! অ্যাডমিন যাচাই করার পর ওয়ালেটে জমা হবে (New Balance = Current + Amount)।`
            : `Add money request for ৳${amountNum.toLocaleString()} submitted! New balance = current balance + amount post-admin approval.`
        });
        setAddMoneyTrxId('');
        setAddMoneySender('');
        await fetchLiveBalance();
      } else {
        setWalletNotice({ type: 'error', message: res.message || 'রিকোয়েস্ট প্রক্রিয়া সম্পন্ন করা যায়নি।' });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'রিকোয়েস্ট ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submission Handler 2: P2P Transfer (Recipient & Amount)
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletNotice(null);
    const amountNum = Number(transferAmount);
    if (!amountNum || amountNum <= 0) {
      setWalletNotice({ type: 'error', message: isBn ? 'সঠিক ট্রান্সফার পরিমাণ দিন।' : 'Please enter a valid transfer amount.' });
      return;
    }
    if (!transferRecipient.trim()) {
      setWalletNotice({ type: 'error', message: isBn ? 'প্রাপকের ফোন বা আইডি দিন।' : 'Recipient ID or Phone required.' });
      return;
    }
    if (walletBalance < amountNum) {
      setWalletNotice({
        type: 'error',
        message: isBn
          ? `❌ অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${walletBalance.toFixed(2)}`
          : `Insufficient balance! Current balance: ৳${walletBalance.toFixed(2)}`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await walletService.transferP2P({
        senderId: effectiveUserId,
        receiverIdentifier: transferRecipient.trim(),
        amount: amountNum,
        note: transferNote.trim() || 'J-Pay P2P Send Money'
      });

      if (res.success) {
        setWalletNotice({
          type: 'success',
          message: isBn
            ? `🎉 ৳${amountNum.toLocaleString()} সফলভাবে ট্রান্সফার করা হয়েছে! প্রেরক থেকে কর্তন এবং প্রাপকের ওয়ালেটে জমা নিশ্চিত হয়েছে।`
            : `P2P Transfer of ৳${amountNum.toLocaleString()} completed! Sender deducted and receiver credited atomically.`
        });
        setTransferRecipient('');
        setTransferAmount('');
        setTransferNote('');
        await fetchLiveBalance();
      } else {
        setWalletNotice({ type: 'error', message: res.message || 'ট্রান্সফার সম্পন্ন হয়নি।' });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'ট্রান্সফার ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submission Handler 3: Withdraw J-Pay (bKash Number & Amount)
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletNotice(null);
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < 100) {
      setWalletNotice({ type: 'error', message: isBn ? 'ন্যূনতম ক্যাশআউট ১০০ টাকা।' : 'Minimum withdrawal is ৳100.' });
      return;
    }
    if (!withdrawNumber.trim()) {
      setWalletNotice({ type: 'error', message: isBn ? 'বিকাশ নম্বর প্রদান করুন।' : 'bKash/Nagad number is required.' });
      return;
    }
    if (walletBalance < amountNum) {
      setWalletNotice({
        type: 'error',
        message: isBn
          ? `❌ অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${walletBalance.toFixed(2)}`
          : `Insufficient balance! Current balance: ৳${walletBalance.toFixed(2)}`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await walletService.requestWithdrawal({
        userId: effectiveUserId,
        amount: amountNum,
        payoutMethod: withdrawMethod,
        payoutNumber: withdrawNumber.trim()
      });

      if (res.success) {
        setWalletNotice({
          type: 'success',
          message: isBn
            ? `🎉 ৳${amountNum.toLocaleString()} ক্যাশআউট অনুরোধ গৃহীত হয়েছে! ক্যাশআউট অনুমোদনের পর ওয়ালেট থেকে কর্তন হবে।`
            : `Cashout request for ৳${amountNum.toLocaleString()} submitted! Amount will be deducted upon cash-out approval.`
        });
        setWithdrawNumber('');
        await fetchLiveBalance();
      } else {
        setWalletNotice({ type: 'error', message: res.message || 'ক্যাশআউট রিকোয়েস্ট ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setWalletNotice({ type: 'error', message: err?.message || 'ক্যাশআউট প্রক্রিয়া ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full min-h-screen bg-[#faf9f6] text-stone-900 pb-16 font-sans antialiased ${className}`}>
      
      {/* =========================================================================
          1. TOP NAVIGATION BAR (High-Contrast, Clean Off-White with Green Accent)
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#faf9f6]/95 backdrop-blur-md border-b border-stone-200/80 px-3 sm:px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 active:scale-95 transition shadow-2xs cursor-pointer shrink-0"
                title={isBn ? 'পেছনে যান' : 'Go Back'}
                aria-label="Back"
                id="btn-dashboard-back"
              >
                <ArrowLeft className="w-4 h-4 text-[#065f46]" />
              </button>
            )}
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-stone-900 truncate">
                  {roleBadge.tag}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-[#065f46] border-emerald-200">
                  {roleBadge.title}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-mono truncate">
                {displayUid} • {displayLocation}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onNavigateToCatalog && normalizedRole === 'seller' && (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="py-1.5 px-2.5 bg-white hover:bg-emerald-50 border border-[#065f46]/40 text-[#065f46] text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title={isBn ? 'ক্যাটালগে ফিরুন' : 'Back to Catalog'}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBn ? 'পণ্য ক্যাটালগ' : 'Product Catalog'}</span>
              </button>
            )}

            {/* Three-Dot (⋮) Menu with EXACT 5 ITEMS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThreeDotOpen(!isThreeDotOpen)}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 active:scale-95 transition shadow-2xs cursor-pointer"
                title={isBn ? 'মেনু' : 'Menu'}
                id="btn-dashboard-three-dot"
                aria-label="Dashboard Menu"
              >
                <MoreVertical className="w-4 h-4 text-stone-800" />
              </button>

              {/* Three-Dot Dropdown Menu (Exact 5 items) */}
              {isThreeDotOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsThreeDotOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                    {/* 1. Dashboard (Current active view) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreeDotOpen(false);
                        setActiveDashboardTab('all');
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-[#065f46] bg-emerald-50/70 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#065f46]" />
                      <span>{isBn ? 'ড্যাশবোর্ড ও ওয়ালেট (সক্রিয়)' : 'Dashboard & Wallet (Active)'}</span>
                    </button>

                    {/* 2. Profile Details */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreeDotOpen(false);
                        if (onNavigateToDetails) onNavigateToDetails();
                        else if (onBack) onBack();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>{isBn ? 'প্রোফাইল বিবরণ (Details)' : 'Profile Details'}</span>
                    </button>

                    {/* 3. Edit Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreeDotOpen(false);
                        if (onNavigateToEditProfile) onNavigateToEditProfile();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      <span>{isBn ? 'প্রোফাইল সম্পাদনা (Edit)' : 'Edit Profile'}</span>
                    </button>

                    <div className="my-1 border-t border-stone-100" />

                    {/* 4. Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreeDotOpen(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-stone-500" />
                      <span>{isBn ? 'সাইন আউট (Sign Out)' : 'Sign Out'}</span>
                    </button>

                    {/* 5. Delete Account */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreeDotOpen(false);
                        if (onDeleteAccount) onDeleteAccount();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>{isBn ? 'অ্যাকাউন্ট ডিলিট (Delete)' : 'Delete Account'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN BODY: INTEGRATED DASHBOARD & IN-PAGE JHAPAY WALLET
          ========================================================================= */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 space-y-5 sm:space-y-6">
        
        {/* Top Profile Summary Card */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-stone-200 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#065f46] text-white p-0.5 rounded-full ring-2 ring-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-stone-900 tracking-tight truncate">
                  {displayName}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${roleBadge.color}`}>
                  {roleBadge.title}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium truncate">
                {displaySubtitle}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 flex-wrap">
                <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-800">
                  {displayUid}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#065f46]" />
                  {displayLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sub-Tab Filter for Easy Viewing */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-stone-100 p-1 rounded-xl border border-stone-200 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveDashboardTab('all')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeDashboardTab === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isBn ? 'সম্পূর্ণ ভিউ' : 'All In-Page'}
            </button>
            <button
              type="button"
              onClick={() => setActiveDashboardTab('stats')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeDashboardTab === 'stats'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isBn ? 'পরিসংখ্যান' : 'Stats Overview'}
            </button>
            <button
              type="button"
              onClick={() => setActiveDashboardTab('wallet')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                activeDashboardTab === 'wallet'
                  ? 'bg-[#065f46] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>{isBn ? 'ওয়ালেট' : 'JhaPay Wallet'}</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            J-PAY WALLET CARD & INTERACTIVE FORMS (TOP OF STATS SECTION)
            ========================================================================= */}
        {(activeDashboardTab === 'all' || activeDashboardTab === 'wallet') && (
          <section className="space-y-4">
            {/* Notice Alert if present */}
            {walletNotice && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-start justify-between gap-2 border ${
                  walletNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {walletNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{walletNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWalletNotice(null)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* J-Pay Wallet Card */}
            <div className="bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-[#065f46]/30 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#065f46] text-white shadow-xs">
                      <WalletIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black tracking-tight">J-Pay Wallet</span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-600/40">
                          {isBn ? 'লাইভ ওয়ালেট' : 'Live Wallet'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300">
                        {isBn ? 'ঝাদিমাদি ডিজিটাল পেমেন্ট ও লেনদেন খাতা' : 'Chadimadi Digital Payment Ledger'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchLiveBalance}
                    disabled={isWalletLoading}
                    className="p-2 text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 rounded-xl transition cursor-pointer border border-stone-700/60"
                    title={isBn ? 'ব্যালেন্স রিফ্রেশ করুন' : 'Refresh Balance'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isWalletLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {/* Balance Display */}
                <div className="pt-1">
                  <span className="text-xs font-bold text-stone-400 block tracking-wide uppercase">
                    {isBn ? 'বর্তমান ব্যবহারযোগ্য ব্যালেন্স' : 'Current Available Balance'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                      ৳{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {pendingEscrow > 0 && (
                      <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-full font-mono">
                        (৳{pendingEscrow.toFixed(2)} {isBn ? 'এসক্রো পেন্ডিং' : 'Escrow'})
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Quick Action Trigger Buttons */}
                <div className="pt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveActionForm(activeActionForm === 'add_money' ? null : 'add_money')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      activeActionForm === 'add_money'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-stone-800/90 text-stone-200 border-stone-700/80 hover:bg-stone-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isBn ? 'অ্যাড মানি' : 'Add Money'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveActionForm(activeActionForm === 'transfer' ? null : 'transfer')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      activeActionForm === 'transfer'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-stone-800/90 text-stone-200 border-stone-700/80 hover:bg-stone-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isBn ? 'P2P ট্রান্সফার' : 'P2P Transfer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveActionForm(activeActionForm === 'withdraw' ? null : 'withdraw')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      activeActionForm === 'withdraw'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-stone-800/90 text-stone-200 border-stone-700/80 hover:bg-stone-700'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isBn ? 'উইথড্র' : 'Withdraw'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Forms Placement (Right Below the Balance Card) */}
            {activeActionForm && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
                {/* Form 1: Add Money */}
                {activeActionForm === 'add_money' && (
                  <form onSubmit={handleAddMoneySubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                          <ArrowDownLeft className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-stone-900">
                            {isBn ? 'অ্যাড মানি রিকোয়েস্ট (Add Money)' : 'Add Money Request'}
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            {isBn ? 'ফর্মুলা: New Balance = Current Balance + Added Amount (অ্যাডমিন অনুমোদনের পর)' : 'Rule: New Balance = Current Balance + Added Amount post-approval'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveActionForm(null)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                        </label>
                        <select
                          value={addMoneyMethod}
                          onChange={(e: any) => setAddMoneyMethod(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#065f46]"
                        >
                          <option value="bKash">bKash (বিকাশ)</option>
                          <option value="Nagad">Nagad (নগদ)</option>
                          <option value="Rocket">Rocket (রকেট)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'টাকার পরিমাণ (৳ Amount)' : 'Amount (৳)'}
                        </label>
                        <input
                          type="number"
                          min="10"
                          step="1"
                          value={addMoneyAmount}
                          onChange={(e) => setAddMoneyAmount(e.target.value)}
                          placeholder="500"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#065f46]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'লেনদেন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                        </label>
                        <input
                          type="text"
                          value={addMoneyTrxId}
                          onChange={(e) => setAddMoneyTrxId(e.target.value)}
                          placeholder="e.g. BL99X4KQ"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-stone-800 focus:outline-hidden focus:border-[#065f46] uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        {isBn ? 'প্রেরক নম্বর (Sender Phone Number)' : 'Sender Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={addMoneySender}
                        onChange={(e) => setAddMoneySender(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#065f46]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveActionForm(null)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#065f46] hover:bg-[#044e3a] text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isBn ? 'অ্যাড মানি সাবমিট করুন' : 'Submit Add Money'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Form 2: P2P Transfer */}
                {activeActionForm === 'transfer' && (
                  <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                          <Send className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-stone-900">
                            {isBn ? 'P2P ফান্ড ট্রান্সফার (J-Pay Send Money)' : 'P2P Wallet Transfer'}
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            {isBn ? 'পারমাণবিক (Atomic) লেনদেন: প্রেরকের থেকে কর্তন ও প্রাপকের ওয়ালেটে তৎক্ষণাৎ যোগ (জিরো ফি)' : 'Atomic transfer: deducts from sender and adds to receiver with zero fee'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveActionForm(null)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'প্রাপকের ফোন বা মেম্বার আইডি' : 'Recipient ID or Phone'}
                        </label>
                        <input
                          type="text"
                          value={transferRecipient}
                          onChange={(e) => setTransferRecipient(e.target.value)}
                          placeholder="e.g. 01700000000 or USER_ID"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'ট্রান্সফার পরিমাণ (৳ Amount)' : 'Transfer Amount (৳)'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          max={walletBalance}
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="Amount in ৳"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-blue-600"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          {isBn ? `সর্বোচ্চ সীমা: ৳${walletBalance.toFixed(2)}` : `Available: ৳${walletBalance.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        {isBn ? 'লেনদেনের বিবরণ (নোট/ঐচ্ছিক)' : 'Transfer Note (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        placeholder={isBn ? 'যেমন: পণ্য ক্রয় বা সেবা বাবদ প্রদান' : 'e.g. Payment for service'}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveActionForm(null)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || walletBalance <= 0}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isBn ? 'প্রেরণ হচ্ছে...' : 'Transferring...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{isBn ? 'টাকা পাঠান' : 'Send Transfer'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Form 3: Withdraw J-Pay */}
                {activeActionForm === 'withdraw' && (
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-stone-900">
                            {isBn ? 'উইথড্রয়াল রিকোয়েস্ট (Withdraw J-Pay)' : 'Withdraw J-Pay Request'}
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            {isBn ? 'ক্যাশআউট অনুমোদনের পর ওয়ালেট থেকে ব্যালেন্স কর্তন হবে (নূন্যতম ১০০ টাকা)' : 'Amount deducted upon cash-out approval (Min ৳100)'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveActionForm(null)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'ক্যাশআউট মেথড' : 'Payout Method'}
                        </label>
                        <select
                          value={withdrawMethod}
                          onChange={(e: any) => setWithdrawMethod(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-amber-600"
                        >
                          <option value="bKash">bKash (বিকাশ পার্সোনাল)</option>
                          <option value="Nagad">Nagad (নগদ পার্সোনাল)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'বিকাশ/নগদ নম্বর' : 'bKash/Nagad Number'}
                        </label>
                        <input
                          type="tel"
                          value={withdrawNumber}
                          onChange={(e) => setWithdrawNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-amber-600"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          {isBn ? 'উইথড্র পরিমাণ (৳ Amount)' : 'Withdraw Amount (৳)'}
                        </label>
                        <input
                          type="number"
                          min="100"
                          step="1"
                          max={walletBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="500"
                          required
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-amber-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-medium text-stone-500">
                        {isBn ? `বর্তমান ওয়ালেট ব্যালেন্স: ৳${walletBalance.toFixed(2)}` : `Available balance: ৳${walletBalance.toFixed(2)}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveActionForm(null)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                        >
                          {isBn ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || walletBalance < 100}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{isBn ? 'প্রক্রিয়াধীন...' : 'Processing...'}</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>{isBn ? 'উইথড্র নিশ্চিত করুন' : 'Confirm Cashout'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            ROLE-SPECIFIC SALES / SERVICE / HONORARIUM STATS
            ========================================================================= */}
        {(activeDashboardTab === 'all' || activeDashboardTab === 'stats') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#065f46]" />
                <span>
                  {normalizedRole === 'seller'
                    ? (isBn ? 'পণ্য বিক্রয় ও ব্যবসায়িক পরিসংখ্যান' : 'Merchant Sales & Business Stats')
                    : normalizedRole === 'service'
                    ? (isBn ? 'সেবা ও উপার্জনের পরিসংখ্যান' : 'Service Earnings & Performance Stats')
                    : (isBn ? 'সম্মাননা ভাতা ও দায়িত্বের বিবরণী' : 'Honorarium & Responsibility Stats')}
                </span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isBn ? 'লাইভ ডেটা' : 'Live Synced'}
              </span>
            </div>

            {/* Seller / Merchant Stats Grid */}
            {normalizedRole === 'seller' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'মোট বিক্রয় (Sales)' : 'Total Sales'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-[#065f46] font-mono mt-1">
                    ৳{toBengaliNumber((48500).toLocaleString())}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? '২৪টি সম্পন্ন ডেলিভারি' : '24 completed orders'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'চলমান অর্ডার' : 'Active Orders'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">
                    {toBengaliNumber(3)} {isBn ? 'টি' : 'orders'}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                    {isBn ? 'প্যাকিং ও ডেলিভারি চলমান' : 'Processing for dispatch'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'তালিকাকৃত পণ্য' : 'Live Products'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">
                    {toBengaliNumber(profileData?.products?.length || 12)} {isBn ? 'টি' : 'items'}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'ইন-স্টক ও সক্রিয়' : 'In stock and active'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'গ্রাহক রেটিং' : 'Customer Rating'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 mt-1 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>৪.৯</span>
                    <span className="text-[10px] text-stone-400 font-normal">(৪৮)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                    {isBn ? '৯৫% পজিটিভ ফিডব্যাক' : '95% positive feedback'}
                  </span>
                </div>
              </div>
            )}

            {/* Service Provider / Freelancer Stats Grid */}
            {normalizedRole === 'service' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'মোট সার্ভিস আয়' : 'Total Service Income'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-blue-700 font-mono mt-1">
                    ৳{toBengaliNumber((36200).toLocaleString())}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'সরাসরি ওয়ালেটে জমা' : 'Credited to JhaPay'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'সম্পন্ন সার্ভিস' : 'Completed Jobs'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">
                    {toBengaliNumber(18)} {isBn ? 'টি' : 'jobs'}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? '১০০% সন্তোষজনক কাজ' : '100% completion rate'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'চলমান বুকিং' : 'Active Bookings'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">
                    {toBengaliNumber(2)} {isBn ? 'টি' : 'active'}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                    {isBn ? 'এসক্রো পেমেন্ট নিশ্চিত' : 'Escrow secured'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'ক্লায়েন্ট রেটিং' : 'Client Rating'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 mt-1 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>৪.৯৫</span>
                    <span className="text-[10px] text-stone-400 font-normal">(৩২)</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                    {isBn ? 'টপ-রেটেড সেবাদাতা' : 'Top-rated provider'}
                  </span>
                </div>
              </div>
            )}

            {/* Permanent Member Stats Grid */}
            {normalizedRole === 'permanent' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'মাসিক সম্মাননা ভাতা' : 'Monthly Honorarium'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-purple-900 font-mono mt-1">
                    ৳{toBengaliNumber((15000).toLocaleString())}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'স্থায়ী সদস্য নিয়মিত বরাদ্দ' : 'Regular monthly grant'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'আঞ্চলিক ইনসেনটিভ' : 'Regional Incentive'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">
                    ৳{toBengaliNumber((3500).toLocaleString())}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'উপজেলা সমন্বয় ও অডিট' : 'Upazila coordination'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'সদস্যপদ স্থিতি' : 'Member Standing'}
                  </span>
                  <div className="text-sm sm:text-base font-black text-emerald-800 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#065f46]" />
                    <span>{isBn ? 'আজীবন সদস্য' : 'Lifetime'}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'এনআইডি ও সনদ ভেরিফাইড' : 'NID & Deed verified'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500 block">
                    {isBn ? 'দায়িত্বপ্রাপ্ত এলাকা' : 'Jurisdiction'}
                  </span>
                  <div className="text-xs sm:text-sm font-black text-stone-900 truncate mt-1">
                    {displayLocation}
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">
                    {isBn ? 'আঞ্চলিক সমন্বয় কেন্দ্র' : 'Regional focal point'}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            3. IN-PAGE JHAPAY WALLET INTEGRATION (NO MODAL/POPUP)
            Directly embedded in the main body as required!
            Features: JhaPay Balance display, Add Money, Withdraw Request, Recent History
            ========================================================================= */}
        {(activeDashboardTab === 'all' || activeDashboardTab === 'wallet') && (
          <section className="space-y-3 pt-2" id="in-page-wallet-section">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#065f46] text-white rounded-lg">
                  <WalletIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900 tracking-tight">
                    {isBn ? 'ঝাপেই ইন্টিগ্রেটেড ওয়ালেট (JhaPay Wallet)' : 'Integrated JhaPay Wallet'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {isBn ? 'ব্যালেন্স রিচার্জ, উত্তোলন অনুরোধ ও লেনদেন ইতিহাস' : 'Balance, Add Money, Withdraw & History'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                100% In-Page
              </span>
            </div>

            {/* Embedded JPayWalletSection - No Modal, pure in-page body */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
              <JPayWalletSection
                currentUser={currentUser || profileData}
                profileData={profileData || currentUser}
                roleName={roleBadge.title}
                roleType={
                  normalizedRole === 'seller'
                    ? 'product_seller'
                    : normalizedRole === 'service'
                    ? 'service_seller'
                    : 'permanent_member'
                }
                lang={lang as any}
                className="border-none shadow-none"
              />
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
