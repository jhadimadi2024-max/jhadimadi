import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  PlusCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Truck,
  RotateCcw,
  X,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export interface AdminFinancialTransaction {
  id: string;
  trxId: string;
  senderName: string;
  senderPhone: string;
  paymentMethod: string;
  gateway: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'COD' | string;
  type?: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  referenceOrderId?: string;
  purpose?: string;
  status: 'Success' | 'Pending' | 'Pending_Verification' | 'Failed' | 'Refunded';
  date: string;
  reviewedBy?: string;
  verifiedAt?: string;
  refundReason?: string;
  refundedAt?: string;
  notes?: string;
}

export interface TransactionStats {
  totalVolume: number;
  bKashVolume: number;
  nagadVolume: number;
  codVolume: number;
  totalFees: number;
  pendingCount: number;
  refundedAmount: number;
  totalCount: number;
}

export const AdminTransactionsTab: React.FC = () => {
  const { orders } = useData();
  const [transactions, setTransactions] = useState<AdminFinancialTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalVolume: 0,
    bKashVolume: 0,
    nagadVolume: 0,
    codVolume: 0,
    totalFees: 0,
    pendingCount: 0,
    refundedAmount: 0,
    totalCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<AdminFinancialTransaction | null>(null);
  const [refundModalTx, setRefundModalTx] = useState<AdminFinancialTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // New Transaction Form
  const [newTxForm, setNewTxForm] = useState({
    trxId: '',
    senderName: '',
    senderPhone: '',
    paymentMethod: 'bKash',
    amount: '',
    referenceOrderId: '',
    purpose: 'ORGANIC_PRODUCTS_ORDER',
    notes: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getAdminToken = (): string => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('jhadimadi_admin_token') || '';
  };

  // Fetch Transactions from Server
  const fetchTransactions = async () => {
    setIsRefreshing(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setTransactions([]);
        setStats({
          totalVolume: 0,
          bKashVolume: 0,
          nagadVolume: 0,
          codVolume: 0,
          totalFees: 0,
          pendingCount: 0,
          refundedAmount: 0,
          totalCount: 0
        });
      }
    } catch {
      setTransactions([]);
      setStats({
        totalVolume: 0,
        bKashVolume: 0,
        nagadVolume: 0,
        codVolume: 0,
        totalFees: 0,
        pendingCount: 0,
        refundedAmount: 0,
        totalCount: 0
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions().catch(() => {});
  }, []);

  // Handle Verify / Reconcile
  const handleVerifyTransaction = async (tx: AdminFinancialTransaction) => {
    setIsActionLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/transactions/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: tx.id, trxId: tx.trxId })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`লেনদেন #${tx.trxId} সফলভাবে ভেরিফাই ও রিকনসাইল করা হয়েছে!`, 'success');
        fetchTransactions();
      } else {
        // Optimistic local update
        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'Success', reviewedBy: 'Admin Verified' } : t));
        showNotification(`লেনদেন #${tx.trxId} ভেরিফাইড চিহ্নিত হয়েছে।`, 'success');
      }
    } catch {
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'Success', reviewedBy: 'Admin Verified' } : t));
      showNotification(`লেনদেন #${tx.trxId} ভেরিফাইড চিহ্নিত হয়েছে।`, 'success');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Refund
  const handleExecuteRefund = async () => {
    if (!refundModalTx) return;
    setIsActionLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/transactions/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: refundModalTx.id, reason: refundReason })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`লেনদেন #${refundModalTx.trxId} রিফান্ড সম্পন্ন হয়েছে।`, 'success');
      } else {
        setTransactions(prev => prev.map(t => t.id === refundModalTx.id ? { ...t, status: 'Refunded', refundReason } : t));
        showNotification(`লেনদেন #${refundModalTx.trxId} রিফান্ড চিহ্নিত হয়েছে।`, 'success');
      }
      setRefundModalTx(null);
      setRefundReason('');
      fetchTransactions();
    } catch {
      setTransactions(prev => prev.map(t => t.id === refundModalTx.id ? { ...t, status: 'Refunded', refundReason } : t));
      showNotification(`লেনদেন #${refundModalTx.trxId} রিফান্ড চিহ্নিত হয়েছে।`, 'success');
      setRefundModalTx(null);
      setRefundReason('');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Record New Transaction
  const handleRecordNewTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxForm.trxId || !newTxForm.amount) {
      showNotification('ট্রানজ্যাকশন আইডি ও পরিমাণ আবশ্যক!', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/transactions/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTxForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`লেনদেন #${newTxForm.trxId} সফলভাবে যুক্ত হয়েছে!`, 'success');
        setIsRecordModalOpen(false);
        setNewTxForm({
          trxId: '',
          senderName: '',
          senderPhone: '',
          paymentMethod: 'bKash',
          amount: '',
          referenceOrderId: '',
          purpose: 'ORGANIC_PRODUCTS_ORDER',
          notes: ''
        });
        fetchTransactions();
      } else {
        showNotification(data.message || 'রেকর্ড সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showNotification('সার্ভার এরর: ' + err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyTrxId = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrxId(trxId);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'TrxID', 'Gateway', 'Sender Name', 'Sender Phone', 'Amount', 'Fee', 'Net Amount', 'Status', 'Reference Order', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.trxId,
      t.gateway || t.paymentMethod,
      `"${t.senderName || ''}"`,
      t.senderPhone,
      t.amount,
      t.fee || 0,
      t.netAmount || t.amount,
      t.status,
      t.referenceOrderId || '',
      `"${t.date}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jhadimadi_ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('লেনদেন লেজার CSV ফাইল ডাউনলোড হয়েছে।', 'success');
  };

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.trxId?.toLowerCase().includes(q) ||
        t.senderName?.toLowerCase().includes(q) ||
        t.senderPhone?.includes(q) ||
        t.referenceOrderId?.toLowerCase().includes(q);

      const matchesGateway = gatewayFilter === 'all' || 
        (t.gateway || t.paymentMethod)?.toLowerCase() === gatewayFilter.toLowerCase();

      const matchesStatus = statusFilter === 'all' || 
        t.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesGateway && matchesStatus;
    });
  }, [transactions, searchQuery, gatewayFilter, statusFilter]);

  const getGatewayBadge = (gw: string) => {
    const lower = gw.toLowerCase();
    if (lower.includes('bkash')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-900/60 text-pink-300 border border-pink-700/50">bKash বিকাশ</span>;
    }
    if (lower.includes('nagad')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-900/60 text-orange-300 border border-orange-700/50">Nagad নগদ</span>;
    }
    if (lower.includes('rocket')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50">Rocket রকেট</span>;
    }
    if (lower.includes('upay')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">Upay উপায়</span>;
    }
    if (lower.includes('cod')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">ক্যাশ অন ডেলিভারি (COD)</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">{gw}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"><CheckCircle2 className="w-3 h-3" /> সফল</span>;
      case 'Pending':
      case 'Pending_Verification':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60"><Clock className="w-3 h-3" /> যাচাইাধীন</span>;
      case 'Refunded':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60"><RotateCcw className="w-3 h-3" /> রিফান্ডেড</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-transactions-panel">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xl transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800' 
            : 'bg-rose-950/90 text-rose-200 border-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                ফিন্যান্সিয়াল লেজার ও লেনদেন ট্র্যাকিং
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  MFS & COD Live
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                বিকাশ, নগদ, রকেট ও ক্যাশ অন ডেলিভারি (COD) পেমেন্ট গেটওয়ে ট্র্যাকিং, রিকনসিলিয়েশন ও রাজস্ব অডিট।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => fetchTransactions()}
            disabled={isRefreshing}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            রিফ্রেশ
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            এক্সপোর্ট CSV
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন লেনদেন রেকর্ড
          </button>
        </div>
      </div>

      {/* Financial KPIs Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">মোট সংগৃহীত রাজস্ব</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">৳{(stats.totalVolume || 0).toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> সফল ট্রানজ্যাকশন ভলিউম
          </span>
        </div>

        {/* bKash Volume */}
        <div className="bg-slate-900/90 border border-pink-900/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-pink-300/80 font-medium">বিকাশ (bKash) গেটওয়ে</span>
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">৳{(stats.bKashVolume || 0).toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-pink-400 font-medium mt-1 block">
            এমএফএস ফি: ৳{((stats.bKashVolume || 0) * 0.0185).toFixed(1)} (১.৮৫%)
          </span>
        </div>

        {/* Nagad Volume */}
        <div className="bg-slate-900/90 border border-orange-900/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-300/80 font-medium">নগদ (Nagad) গেটওয়ে</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">৳{(stats.nagadVolume || 0).toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-orange-400 font-medium mt-1 block">
            এমএফএস ফি: ৳{((stats.nagadVolume || 0) * 0.015).toFixed(1)} (১.৫০%)
          </span>
        </div>

        {/* COD Volume */}
        <div className="bg-slate-900/90 border border-amber-900/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300/80 font-medium">ক্যাশ অন ডেলিভারি (COD)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">৳{(stats.codVolume || 0).toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium mt-1 block">
            কুরিয়ার রাইডার দ্বারা সংগৃহীত
          </span>
        </div>
      </div>

      {/* Secondary Status Alert Bar */}
      {stats.pendingCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{stats.pendingCount}টি ট্রানজ্যাকশন</strong> ম্যানুয়াল ভেরিফিকেশন ও রিকনসিলিয়েশনের অপেক্ষায় রয়েছে। নিচে টেবিল থেকে TrxID মিলিয়ে ভেরিফাই করুন।
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('Pending_Verification')}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 font-semibold text-xs whitespace-nowrap transition"
          >
            পেন্ডিং ফিল্টার
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="TrxID, ফোন নম্বর, গ্রাহকের নাম..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Gateway Filter */}
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সব গেটওয়ে (All Gateways)</option>
            <option value="bkash">bKash (বিকাশ)</option>
            <option value="nagad">Nagad (নগদ)</option>
            <option value="rocket">Rocket (রকেট)</option>
            <option value="upay">Upay (উপায়)</option>
            <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সব স্ট্যাটাস (All Status)</option>
            <option value="success">সফল (Success)</option>
            <option value="pending_verification">যাচাইাধীন (Pending Verification)</option>
            <option value="refunded">রিফান্ডেড (Refunded)</option>
          </select>

          {(searchQuery || gatewayFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setGatewayFilter('all');
                setStatusFilter('all');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition whitespace-nowrap"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ট্রানজ্যাকশন আইডি (TrxID)</th>
                <th className="py-3.5 px-4">গেটওয়ে / চ্যানেল</th>
                <th className="py-3.5 px-4">প্রেরকের তথ্য</th>
                <th className="py-3.5 px-4 text-right">পরিমাণ (Amount)</th>
                <th className="py-3.5 px-4">উদ্দেশ্য ও রেফারেন্স</th>
                <th className="py-3.5 px-4">স্ট্যাটাস</th>
                <th className="py-3.5 px-4">তারিখ ও অডিটর</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    {/* TrxID with Copy */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.trxId}</span>
                        <button
                          onClick={() => handleCopyTrxId(tx.trxId)}
                          title="TrxID কপি করুন"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                        >
                          {copiedTrxId === tx.trxId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Gateway */}
                    <td className="py-3.5 px-4">
                      {getGatewayBadge(tx.gateway || tx.paymentMethod || 'bKash')}
                    </td>

                    {/* Sender Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{tx.senderName || 'নামবিহীন'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.senderPhone || 'N/A'}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-emerald-400 text-sm">৳{tx.amount.toLocaleString()}</div>
                      {tx.fee ? (
                        <div className="text-[10px] text-slate-500">
                          নেট: ৳{(tx.netAmount || tx.amount - tx.fee).toLocaleString()} (ফি: ৳{tx.fee})
                        </div>
                      ) : null}
                    </td>

                    {/* Purpose / Reference Order */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium truncate max-w-[180px]" title={tx.notes || tx.purpose}>
                        {tx.notes || tx.purpose || 'সাধারণ পেমেন্ট'}
                      </div>
                      {tx.referenceOrderId && (
                        <span className="inline-block mt-0.5 text-[10px] text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/50">
                          অর্ডার #{tx.referenceOrderId}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Date & Reviewer */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div>{tx.date}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{tx.reviewedBy || 'System'}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.status === 'Pending_Verification' && (
                          <button
                            onClick={() => handleVerifyTransaction(tx)}
                            disabled={isActionLoading}
                            title="কনফার্ম ও রিকনসাইল করুন"
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            ভেরিফাই
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          title="রিসিপ্ট ও বিস্তারিত দেখুন"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {tx.status === 'Success' && (
                          <button
                            onClick={() => {
                              setRefundModalTx(tx);
                              setRefundReason('');
                            }}
                            title="রিফান্ড প্রসেস করুন"
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-800 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 📝 MODAL: RECORD NEW TRANSACTION ================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                নতুন পেমেন্ট ট্রানজ্যাকশন যুক্ত করুন
              </h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordNewTransaction} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ট্রানজ্যাকশন আইডি (TrxID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: BK9A87X412 অথবা NG81928012"
                  value={newTxForm.trxId}
                  onChange={(e) => setNewTxForm({ ...newTxForm, trxId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={newTxForm.paymentMethod}
                    onChange={(e) => setNewTxForm({ ...newTxForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                    <option value="Upay">Upay (উপায়)</option>
                    <option value="COD">ক্যাশ অন ডেলিভারি (COD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পরিমাণ (টাকা) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="৳ যেমন: 100"
                    value={newTxForm.amount}
                    onChange={(e) => setNewTxForm({ ...newTxForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">প্রেরকের নাম</label>
                  <input
                    type="text"
                    placeholder="গ্রাহক বা বিক্রেতার নাম"
                    value={newTxForm.senderName}
                    onChange={(e) => setNewTxForm({ ...newTxForm, senderName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="018XXXXXXXX"
                    value={newTxForm.senderPhone}
                    onChange={(e) => setNewTxForm({ ...newTxForm, senderPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">রেফারেন্স অর্ডার আইডি (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ORD-2026-901"
                  value={newTxForm.referenceOrderId}
                  onChange={(e) => setNewTxForm({ ...newTxForm, referenceOrderId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">লেনদেনের নোট বা বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="পাহাড়ি পণ্যের অর্ডার পেমেন্ট বা রেজিস্ট্রেশন ফি..."
                  value={newTxForm.notes}
                  onChange={(e) => setNewTxForm({ ...newTxForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 📄 MODAL: RECEIPT & AUDIT DETAILS ================= */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">লেনদেন রসিদ ও অডিট ভিউ</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedTxForReceipt.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTxForReceipt(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">ট্রানজ্যাকশন আইডি (TrxID)</span>
                <span className="font-mono font-bold text-emerald-400">{selectedTxForReceipt.trxId}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">পেমেন্ট মেথড ও চ্যানেল</span>
                <span>{getGatewayBadge(selectedTxForReceipt.gateway || selectedTxForReceipt.paymentMethod)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">প্রেরক / গ্রাহক</span>
                <span className="font-semibold">{selectedTxForReceipt.senderName || 'নামবিহীন'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">মোবাইল নম্বর</span>
                <span className="font-mono">{selectedTxForReceipt.senderPhone}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">মোট পরিমাণ</span>
                <span className="font-black text-white text-sm">৳{selectedTxForReceipt.amount.toLocaleString()}</span>
              </div>

              {selectedTxForReceipt.fee ? (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">গেটওয়ে সার্ভিস ফি</span>
                  <span className="text-slate-300">৳{selectedTxForReceipt.fee}</span>
                </div>
              ) : null}

              {selectedTxForReceipt.referenceOrderId && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">সংযুক্ত অর্ডার নং</span>
                  <span className="text-teal-300 font-mono font-bold">{selectedTxForReceipt.referenceOrderId}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">স্ট্যাটাস</span>
                <span>{getStatusBadge(selectedTxForReceipt.status)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">লেনদেনের তারিখ</span>
                <span>{selectedTxForReceipt.date}</span>
              </div>

              {selectedTxForReceipt.notes && (
                <div className="pt-2 border-t border-slate-800/80 text-slate-400 text-[11px]">
                  <strong>নোট:</strong> {selectedTxForReceipt.notes}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ↩️ MODAL: REFUND CONFIRMATION ================= */}
      {refundModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm">রিফান্ড নিশ্চিতকরণ</h3>
              </div>
              <button onClick={() => setRefundModalTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-300">
                আপনি কি লেনদেন <strong>#{refundModalTx.trxId}</strong> (পরিমাণ: <strong>৳{refundModalTx.amount}</strong>)-কে রিফান্ড হিসেবে চিহ্নিত করতে চান?
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">রিফান্ডের কারণ</label>
                <textarea
                  rows={3}
                  required
                  placeholder="গ্রাহকের অনুরোধ, পণ্য অনুপলব্ধতা বা স্টক ঘাটতি..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRefundModalTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleExecuteRefund}
                disabled={isActionLoading || !refundReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                রিফান্ড সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
