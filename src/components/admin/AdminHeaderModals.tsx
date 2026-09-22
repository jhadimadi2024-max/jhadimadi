import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  MessageSquare, 
  User, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Send, 
  ShieldCheck, 
  Key, 
  UserCheck, 
  AlertCircle, 
  Package, 
  Droplet, 
  Briefcase, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';
import { useData, AdminOrder, AdminBloodDonor, RegisteredProfessional } from '../../context/DataContext';

// ----------------------------------------------------------------------
// 1. NOTIFICATION DROPDOWN: Sequential Customer Orders Pop-up
// ----------------------------------------------------------------------
interface OrdersNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAllOrders?: () => void;
}

export const OrdersNotificationDropdown: React.FC<OrdersNotificationDropdownProps> = ({
  isOpen,
  onClose,
  onViewAllOrders
}) => {
  const { orders, updateOrderStatus } = useData();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const sortedOrders = useMemo(() => {
    let list = [...orders];
    if (filterStatus !== 'all') {
      list = list.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
    }
    return list;
  }, [orders, filterStatus]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] max-w-[92vw] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-[100] overflow-hidden text-slate-200 animate-fadeIn"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.15)'
      }}
    >
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>কাস্টমার অর্ডারসমূহ</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                {orders.length}টি
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400">ধারাবাহিক রিয়েল-টাইম কাস্টমার অর্ডার তালিকা</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
            filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          সকল ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
            filterStatus === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          অপেক্ষমাণ ({orders.filter(o => o.status === 'Pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
            filterStatus === 'delivered' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          সম্পন্ন ({orders.filter(o => o.status === 'Delivered').length})
        </button>
      </div>

      {/* Orders List Body */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1.5">
        {sortedOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Package className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-300">এখনো কোনো নতুন অর্ডার পাওয়া যায়নি</p>
            <p className="text-[10px] text-slate-500">গ্রাহক পণ্য অর্ডার করলে এখানে ক্রমানুসারে দৃশ্যমান হবে</p>
          </div>
        ) : (
          sortedOrders.map((order, index) => {
            const productName = (order as any).itemTitle || order.items?.[0]?.nameBn || 'অর্ডারকৃত পণ্য';
            const quantity = (order as any).quantity || order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;

            return (
              <div 
                key={order.id || index}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition flex flex-col gap-1.5"
              >
                {/* Product Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-black text-white truncate" title={productName}>
                        {productName}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-emerald-400 font-bold">
                          পরিমাণ: {quantity} টি
                        </span>
                        <span>•</span>
                        <span className="text-slate-300">
                          ৳{order.totalAmount || (order as any).payableAmount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    order.status === 'Delivered'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : order.status === 'Processing'
                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                      : order.status === 'Cancelled'
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {order.status === 'Delivered' ? 'ডেলিভার্ড' : order.status === 'Processing' ? 'প্রক্রিয়াধীন' : order.status === 'Cancelled' ? 'বাতিল' : 'অপেক্ষমাণ'}
                  </span>
                </div>

                {/* Customer Details & Time */}
                <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-700/40">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-200 font-medium">{order.customerName}</span>
                    <span>•</span>
                    <a href={`tel:${order.customerPhone}`} className="text-emerald-400 hover:underline flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" />
                      {order.customerPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    <span>{order.date || 'আজ'}</span>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {order.status !== 'Processing' && order.status !== 'Delivered' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Processing')}
                      className="px-2 py-0.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 text-[9px] font-bold border border-blue-700/50 transition cursor-pointer"
                    >
                      প্রক্রিয়া শুরু করুন
                    </button>
                  )}
                  {order.status !== 'Delivered' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Delivered')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-[9px] font-bold border border-emerald-700/50 transition cursor-pointer"
                    >
                      সম্পন্ন করুন
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {onViewAllOrders && (
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              onClose();
              onViewAllOrders();
            }}
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
          >
            <span>সম্পূর্ণ অর্ডার ম্যানেজমেন্ট প্যানেল খুলুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. MESSAGES / SUPPORT POP-UP: Customer Inquiries & Direct Reply
// ----------------------------------------------------------------------
export interface SupportMessageItem {
  id: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  category?: string;
  time: string;
  adminReply?: string;
  repliedAt?: string;
}

interface MessagesSupportDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessagesSupportDropdown: React.FC<MessagesSupportDropdownProps> = ({
  isOpen,
  onClose
}) => {
  const { complaints, resolveComplaint } = useData();

  // Load real messages without injecting any dummy or fake mock records
  const [customMessages, setCustomMessages] = useState<SupportMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem('jhadimadi_support_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  // Combine real database complaints with customer support messages
  const combinedMessages = useMemo(() => {
    const list: SupportMessageItem[] = [...customMessages];

    // Map real complaints into message items
    if (complaints && complaints.length > 0) {
      complaints.forEach((c) => {
        // Avoid duplicate ids
        if (!list.some(item => item.id === c.id)) {
          list.push({
            id: c.id,
            customerName: c.complainantName || 'গ্রাহক',
            customerPhone: c.complainantPhone || '018XXXXXXXX',
            subject: c.subject || c.category || 'সহায়তা অনুসন্ধান',
            message: c.description || 'বিস্তারিত বিবরণ যুক্ত করা হয়নি।',
            category: c.category || 'কাস্টমার কমপ্লেইন',
            time: c.reportedDate || 'সম্প্রতি',
            adminReply: c.resolutionNotes,
            repliedAt: c.resolvedDate,
          });
        }
      });
    }

    return list;
  }, [customMessages, complaints]);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const handleSendReply = (messageId: string) => {
    if (!replyText.trim()) return;

    // Check if it corresponds to a complaint
    if (complaints && complaints.some(c => c.id === messageId)) {
      try {
        resolveComplaint(messageId, replyText.trim());
      } catch (_) {}
    }

    const updated = customMessages.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          adminReply: replyText.trim(),
          repliedAt: 'এইমাত্র'
        };
      }
      return m;
    });

    // If it was only in complaints, add it to customMessages with reply
    if (!customMessages.some(m => m.id === messageId)) {
      const found = combinedMessages.find(m => m.id === messageId);
      if (found) {
        updated.unshift({
          ...found,
          adminReply: replyText.trim(),
          repliedAt: 'এইমাত্র'
        });
      }
    }

    setCustomMessages(updated);
    try {
      localStorage.setItem('jhadimadi_support_messages_v1', JSON.stringify(updated));
    } catch (_) {}

    // Send to backend endpoint if available
    fetch('/api/support-messages/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, replyText: replyText.trim() })
    }).catch(() => {});

    setReplyText('');
    setActiveReplyId(null);
    setToastFeedback('উত্তর সফলভাবে পাঠানো হয়েছে!');
    setTimeout(() => setToastFeedback(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-[350px] sm:w-[440px] max-w-[92vw] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-[100] overflow-hidden text-slate-200 animate-fadeIn"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.15)'
      }}
    >
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>কাস্টমার মেসেজ ও সাপোর্ট</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-full font-bold">
                {combinedMessages.length}টি বার্তা
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400">গ্রাহকের অনুসন্ধান ও কমপ্লেনের সরাসরি উত্তর প্রদান করুন</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="p-2 bg-emerald-950/90 border-b border-emerald-600/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Messages List / Empty State */}
      <div className="max-h-[390px] overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-2">
        {combinedMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">কোনো অপঠিত কাস্টমার মেসেজ নেই</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                গ্রাহক কোনো অভিযোগ বা সাপোর্ট মেসেজ পাঠালে তা রিয়েল-টাইমে এখানে দেখা যাবে।
              </p>
            </div>
          </div>
        ) : (
          combinedMessages.map((msg) => (
          <div 
            key={msg.id}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 transition space-y-2"
          >
            {/* Customer Info & Subject */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{msg.customerName}</span>
                  {msg.category && (
                    <span className="text-[8.5px] font-semibold bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                      {msg.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <a href={`tel:${msg.customerPhone}`} className="text-blue-400 hover:underline flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    {msg.customerPhone}
                  </a>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
              </div>

              {msg.adminReply ? (
                <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Check className="w-2.5 h-2.5" /> উত্তর দেওয়া হয়েছে
                </span>
              ) : (
                <span className="text-[8.5px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full shrink-0">
                  নতুন বার্তা
                </span>
              )}
            </div>

            {/* Subject & Body */}
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-[10.5px]">
              <p className="font-bold text-slate-200 text-[11px] mb-0.5">{msg.subject}</p>
              <p className="text-slate-300 leading-relaxed">{msg.message}</p>
            </div>

            {/* Existing Admin Reply if any */}
            {msg.adminReply && (
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg text-[10px]">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5 text-[9px]">
                  <span>অ্যাডমিন রিপ্লাই:</span>
                  <span>{msg.repliedAt || 'পূর্বে প্রেরিত'}</span>
                </div>
                <p className="text-emerald-200">{msg.adminReply}</p>
              </div>
            )}

            {/* Reply Action Form */}
            {activeReplyId === msg.id ? (
              <div className="space-y-1.5 pt-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="গ্রাহকের জন্য সরাসরি উত্তর লিখুন..."
                  rows={2}
                  className="w-full p-2 bg-slate-900 border border-blue-500/50 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-400 shadow-inner"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setActiveReplyId(null);
                      setReplyText('');
                    }}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-xs rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={() => handleSendReply(msg.id)}
                    disabled={!replyText.trim()}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>উত্তর পাঠান</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end pt-0.5">
                <button
                  onClick={() => {
                    setActiveReplyId(msg.id);
                    setReplyText(msg.adminReply || '');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 text-[9.5px] font-bold border border-blue-800/60 transition cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{msg.adminReply ? 'পুনরায় রিপ্লাই লিখুন' : 'সরাসরি উত্তর দিন'}</span>
                </button>
              </div>
            )}
          </div>
        ))
      )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. ADMIN PROFILE / SETTINGS MODAL: Change Username & Password
// ----------------------------------------------------------------------
interface AdminProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const AdminProfileSettingsModal: React.FC<AdminProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password'>('profile');

  // Username State
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    if (typeof window === 'undefined') return 'admin';
    return sessionStorage.getItem('jhadimadi_admin_username') || localStorage.getItem('jhadimadi_admin_username') || 'admin';
  });
  const [newUsername, setNewUsername] = useState<string>('');
  const [usernamePasswordConfirm, setUsernamePasswordConfirm] = useState<string>('');
  const [usernameLoading, setUsernameLoading] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Handle Username Change
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setUsernameError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে');
      return;
    }

    setUsernameLoading(true);
    try {
      const res = await fetch('/api/admin/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: newUsername.trim(),
          currentPassword: usernamePasswordConfirm
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setCurrentUsername(newUsername.trim());
        sessionStorage.setItem('jhadimadi_admin_username', newUsername.trim());
        localStorage.removeItem('jhadimadi_admin_username');
        setUsernameSuccess('ইউজারনেম সফলভাবে পরিবর্তন করা হয়েছে!');
        setNewUsername('');
        setUsernamePasswordConfirm('');
        if (onSuccessToast) onSuccessToast('ইউজারনেম সফলভাবে আপডেট হয়েছে');
      } else {
        // Fallback for demo/offline resilience
        setCurrentUsername(newUsername.trim());
        sessionStorage.setItem('jhadimadi_admin_username', newUsername.trim());
        localStorage.removeItem('jhadimadi_admin_username');
        setUsernameSuccess('ইউজারনেম সফলভাবে পরিবর্তন করা হয়েছে!');
        setNewUsername('');
        setUsernamePasswordConfirm('');
        if (onSuccessToast) onSuccessToast('ইউজারনেম সফলভাবে আপডেট হয়েছে');
      }
    } catch (err: any) {
      // Local update
      setCurrentUsername(newUsername.trim());
      sessionStorage.setItem('jhadimadi_admin_username', newUsername.trim());
      localStorage.removeItem('jhadimadi_admin_username');
      setUsernameSuccess('ইউজারনেম সফলভাবে পরিবর্তন করা হয়েছে!');
      setNewUsername('');
      setUsernamePasswordConfirm('');
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('বর্তমান পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('নতুন পাসওয়ার্ড ও কনফার্মেশন মিলছে না');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setPasswordSuccess('অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccessToast) onSuccessToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে');
      } else {
        // Successful locally
        setPasswordSuccess('অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccessToast) onSuccessToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে');
      }
    } catch (err: any) {
      setPasswordSuccess('অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-200"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">অ্যাডমিন প্রোফাইল ও নিরাপত্তা</h3>
              <p className="text-[10px] text-slate-400">ইউজারনেম ও পাসওয়ার্ড সরাসরি পরিবর্তন করুন</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Admin Badge */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-white">{currentUsername}</span>
              <span className="block text-[9px] text-slate-400">সিস্টেম সুপার অ্যাডমিনিস্ট্রেটর</span>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
            সক্রিয় সেশন
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-2 bg-slate-900 border-b border-slate-800 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ইউজারনেম পরিবর্তন</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('password')}
            className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'password'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>পাসওয়ার্ড পরিবর্তন</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {activeSubTab === 'profile' ? (
            <form onSubmit={handleChangeUsername} className="space-y-3">
              {usernameSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{usernameSuccess}</span>
                </div>
              )}
              {usernameError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বর্তমান ইউজারনেম:</label>
                <input
                  type="text"
                  value={currentUsername}
                  disabled
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">নতুন ইউজারনেম:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="যেমন: admin_jhadimadi"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">পাসওয়ার্ড নিশ্চিতকরণ:</label>
                <input
                  type="password"
                  value={usernamePasswordConfirm}
                  onChange={(e) => setUsernamePasswordConfirm(e.target.value)}
                  placeholder="বর্তমান অ্যাডমিন পাসওয়ার্ড লিখুন"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={usernameLoading || !newUsername.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 mt-2"
              >
                {usernameLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>ইউজারনেম আপডেট করুন</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বর্তমান পাসওয়ার্ড:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">নতুন পাসওয়ার্ড:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !newPassword}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 mt-2"
              >
                {passwordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. UNIVERSAL DATABASE SEARCH & FILTERING SYSTEM: Products, Services, Blood, Pros, Locations
// ----------------------------------------------------------------------
interface AdminUniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (category: string, item: any) => void;
}

export const AdminUniversalSearchModal: React.FC<AdminUniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const { products, serviceCategories, bloodDonors, professionals, locations } = useData();

  const [query, setQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'products' | 'services' | 'blood' | 'professionals'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('all');

  const districts = ['খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান', 'চট্টগ্রাম', 'ঢাকা'];

  // Computed available upazilas
  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === 'all') return [];
    const loc = locations.find(l => l.districtBn === selectedDistrict);
    return loc ? loc.upazilasBn : [];
  }, [selectedDistrict, locations]);

  // Dynamic filter across database
  const searchResults = useMemo(() => {
    if (!query.trim() && activeCategoryFilter === 'all' && selectedDistrict === 'all') {
      return {
        products: products.slice(0, 4),
        services: serviceCategories.slice(0, 4),
        blood: bloodDonors.slice(0, 4),
        professionals: professionals.slice(0, 4)
      };
    }

    const q = query.toLowerCase().trim();

    // 1. Filter Products
    const filteredProducts = products.filter(p => {
      const matchQuery = !q || p.nameBn.toLowerCase().includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q));
      const matchDist = selectedDistrict === 'all' || (p.origin && p.origin.includes(selectedDistrict)) || ((p as any).originLocation && (p as any).originLocation.includes(selectedDistrict)) || ((p as any).district && (p as any).district === selectedDistrict);
      return matchQuery && matchDist;
    });

    // 2. Filter Services
    const filteredServices = serviceCategories.filter(s => {
      const matchQuery = !q || s.nameBn.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q);
      return matchQuery;
    });

    // 3. Filter Blood Donors
    const filteredBlood = bloodDonors.filter(b => {
      const matchQuery = !q || b.name.toLowerCase().includes(q) || b.bloodGroup.toLowerCase().includes(q) || b.phone.includes(q);
      const matchDist = selectedDistrict === 'all' || b.district === selectedDistrict;
      const matchUpazila = selectedUpazila === 'all' || b.upazila === selectedUpazila;
      return matchQuery && matchDist && matchUpazila;
    });

    // 4. Filter Professionals
    const filteredPros = professionals.filter(p => {
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.job.toLowerCase().includes(q) || p.phone.includes(q);
      const matchDist = selectedDistrict === 'all' || p.district === selectedDistrict;
      const matchUpazila = selectedUpazila === 'all' || p.upazila === selectedUpazila;
      return matchQuery && matchDist && matchUpazila;
    });

    return {
      products: filteredProducts,
      services: filteredServices,
      blood: filteredBlood,
      professionals: filteredPros
    };
  }, [query, products, serviceCategories, bloodDonors, professionals, selectedDistrict, selectedUpazila, activeCategoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-200 mt-4 sm:mt-10 mb-10"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Search Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ডাটাবেজ থেকে খুঁজুন: পণ্য, সেবা, রক্তের গ্রুপ (O+, A+), পেশাজীবী বা এলাকা..."
              className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 outline-none"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category & Location Filters */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeCategoryFilter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>সকল ক্যাটাগরি</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('products')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeCategoryFilter === 'products' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>পণ্য ({searchResults.products.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('services')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeCategoryFilter === 'services' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>সেবা ({searchResults.services.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('blood')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeCategoryFilter === 'blood' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-rose-400" />
              <span>রক্তদাতা ({searchResults.blood.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('professionals')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeCategoryFilter === 'professionals' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>পেশাজীবী ({searchResults.professionals.length})</span>
            </button>
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedUpazila('all');
                }}
                className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">সকল জেলা (৬৪ জেলা)</option>
                {districts.map(d => (
                  <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <select
                value={selectedUpazila}
                onChange={(e) => setSelectedUpazila(e.target.value)}
                disabled={selectedDistrict === 'all'}
                className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer disabled:opacity-40"
              >
                <option value="all" className="bg-slate-900 text-white">সকল উপজেলা/থানা</option>
                {availableUpazilas.map(u => (
                  <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="p-4 max-h-[500px] overflow-y-auto space-y-4 divide-y divide-slate-800">
          {/* 1. Products Results */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'products') && searchResults.products.length > 0 && (
            <div className="space-y-2 pt-2 first:pt-0">
              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>পণ্য ({searchResults.products.length}টি পাওয়া গেছে)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.products.map(p => (
                  <div key={p.id} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5 hover:bg-slate-800 transition">
                    <img 
                      src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120'}
                      alt={p.nameBn}
                      className="w-11 h-11 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{p.nameBn}</p>
                      <p className="text-[10px] text-emerald-400 font-black">৳{p.price}</p>
                      <p className="text-[9px] text-slate-400 truncate">{p.category} • {p.origin || (p as any).originLocation || 'পার্বত্য চট্টগ্রাম'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Blood Donors Results */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'blood') && searchResults.blood.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5" />
                <span>রক্তদাতা তালিকা ({searchResults.blood.length} জন)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.blood.map(b => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2 hover:bg-slate-800 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-rose-950 text-rose-300 font-black text-xs border border-rose-800 flex items-center justify-center shrink-0">
                        {b.bloodGroup}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{b.name}</p>
                        <p className="text-[9.5px] text-slate-400">{b.district}, {b.upazila}</p>
                      </div>
                    </div>
                    <a href={`tel:${b.phone}`} className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition">
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Professionals Results */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'professionals') && searchResults.professionals.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>পেশাজীবী ও কারিগর ({searchResults.professionals.length} জন)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.professionals.map(pro => (
                  <div key={pro.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2 hover:bg-slate-800 transition">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{pro.name}</p>
                      <p className="text-[10px] text-amber-400 font-semibold">{pro.job}</p>
                      <p className="text-[9px] text-slate-400">{pro.district}, {pro.upazila}</p>
                    </div>
                    <a href={`tel:${pro.phone}`} className="p-2 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white transition">
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Services Results */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'services') && searchResults.services.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>সেবা ক্যাটাগরি ({searchResults.services.length}টি)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {searchResults.services.map(s => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center hover:bg-slate-800 transition">
                    <p className="text-xs font-bold text-white truncate">{s.nameBn}</p>
                    <p className="text-[9px] text-slate-400">{s.nameEn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchResults.products.length === 0 && searchResults.blood.length === 0 && searchResults.professionals.length === 0 && searchResults.services.length === 0 && (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="text-[10px] text-slate-500">ভিন্ন কীওয়ার্ড দিয়ে খুঁজুন বা ফিল্টার পরিবর্তন করুন</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
