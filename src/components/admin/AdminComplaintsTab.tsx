import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Filter, 
  Phone, 
  Star, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  FileText,
  User,
  ShoppingBag,
  Wrench,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useData, AdminComplaint } from '../../context/DataContext';

export const AdminComplaintsTab: React.FC = () => {
  const { complaints, addComplaint, updateComplaint, deleteComplaint, resolveComplaint } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<AdminComplaint['status']>('Resolved');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newComplaintForm, setNewComplaintForm] = useState({
    complainantName: '',
    complainantPhone: '',
    targetType: 'service' as AdminComplaint['targetType'],
    targetName: '',
    category: 'দেরিতে ডেলিভারি' as AdminComplaint['category'],
    subject: '',
    description: '',
    status: 'Pending' as AdminComplaint['status'],
    rating: 3
  });

  const categories: AdminComplaint['category'][] = [
    'দেরিতে ডেলিভারি', 
    'পণ্যের মান সমস্যা', 
    'অতিরিক্ত মূল্য দাবি', 
    'খারাপ আচরণ', 
    'অন্যান্য'
  ];

  const handleOpenResolveModal = (comp: AdminComplaint) => {
    setSelectedComplaint(comp);
    setResolutionInput(comp.resolutionNotes || '');
    setResolutionStatus(comp.status === 'Resolved' ? 'Resolved' : 'Resolved');
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (resolutionStatus === 'Resolved') {
      resolveComplaint(selectedComplaint.id, resolutionInput);
    } else {
      updateComplaint(selectedComplaint.id, {
        status: resolutionStatus,
        resolutionNotes: resolutionInput
      });
    }

    setSelectedComplaint(null);
    setResolutionInput('');
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintForm.complainantName || !newComplaintForm.subject) {
      alert('অনুগ্রহ করে কাস্টমারের নাম ও অভিযোগের বিষয় প্রদান করুন');
      return;
    }

    addComplaint(newComplaintForm);
    setIsAddModalOpen(false);
    setNewComplaintForm({
      complainantName: '',
      complainantPhone: '',
      targetType: 'service',
      targetName: '',
      category: 'দেরিতে ডেলিভারি',
      subject: '',
      description: '',
      status: 'Pending',
      rating: 3
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি এই কমপ্লেন রেকর্ডটি মুছে ফেলতে চান?')) {
      deleteComplaint(id);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(comp => {
      if (statusFilter !== 'all' && comp.status !== statusFilter) return false;
      if (targetTypeFilter !== 'all' && comp.targetType !== targetTypeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = comp.complainantName.toLowerCase().includes(q);
        const matchPhone = comp.complainantPhone.includes(q);
        const matchTarget = comp.targetName.toLowerCase().includes(q);
        const matchSubject = comp.subject.toLowerCase().includes(q);
        const matchId = comp.id.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchTarget && !matchSubject && !matchId) return false;
      }

      return true;
    });
  }, [complaints, statusFilter, targetTypeFilter, searchQuery]);

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const underReviewCount = complaints.filter(c => c.status === 'Under Review').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-complaints-tab">
      
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                কমপ্লেন ও রিভিউ মোডারেশন হাব
              </h1>
              <p className="text-xs text-slate-500">
                গ্রাহক অভিযোগ নিষ্পত্তি, সার্ভিস ডিসপুট তদন্ত ও কাস্টমার রেটিং/রিভিউ মোডারেশন
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>নতুন ডিসপুট টিকেট খুলুন</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">মোট অভিযোগ ও টিকেট</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{complaints.length}টি</span>
            <span className="text-[10px] font-bold text-slate-400">সর্বমোট দাখিল</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">পেন্ডিং অভিযোগ</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{pendingCount}টি</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600 animate-pulse">জরুরি একশন চাই</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">তদন্তাধীন (Under Review)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{underReviewCount}টি</span>
            <span className="text-[10px] font-bold text-amber-600">প্রসেসিং চলছে</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">সফলভাবে মীমাংসিত</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}টি</span>
            <span className="text-[10px] font-bold text-emerald-600">সমাধান সম্পন্ন</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="কাস্টমারের নাম, ফোন বা অভিযোগ খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="Pending">পেন্ডিং (Pending)</option>
            <option value="Under Review">তদন্তাধীন (Under Review)</option>
            <option value="Resolved">মীমাংসিত (Resolved)</option>
            <option value="Dismissed">বাতিলকৃত (Dismissed)</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={e => setTargetTypeFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">সব টার্গেট টাইপ</option>
            <option value="service">সার্ভিস প্রোভাইডার</option>
            <option value="product">পণ্য ও ডেলিভারি</option>
            <option value="seller">মার্চেন্ট সেলার</option>
          </select>
        </div>

      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filteredComplaints.map(comp => (
          <div 
            key={comp.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-3"
          >
            {/* Top Bar: ID, Category, Target, Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {comp.id}
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-indigo-200/60">
                  {comp.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  টার্গেট: <strong className="text-slate-800">{comp.targetName}</strong> ({comp.targetType === 'service' ? 'সেবা' : 'পণ্য'})
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  comp.status === 'Pending' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                  comp.status === 'Under Review' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {comp.status === 'Pending' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                  {comp.status === 'Under Review' && <Clock className="w-3 h-3 text-amber-600" />}
                  {comp.status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {comp.status === 'Dismissed' && <XCircle className="w-3 h-3 text-slate-500" />}
                  <span>{comp.status}</span>
                </span>
              </div>
            </div>

            {/* Subject & Description */}
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">{comp.subject}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{comp.description}"
              </p>
            </div>

            {/* Resolution Notes if resolved */}
            {comp.resolutionNotes && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> অ্যাডমিন রেজোলিউশন নোট ({comp.resolvedDate || 'সমাধানকৃত'}):
                </span>
                <p className="text-[11px] text-emerald-700">{comp.resolutionNotes}</p>
              </div>
            )}

            {/* Footer: Complainant Info & Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {comp.complainantName}
                </span>
                <a 
                  href={`tel:${comp.complainantPhone}`}
                  className="flex items-center gap-1 font-mono text-indigo-600 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {comp.complainantPhone}
                </a>
                <span className="text-[10px] text-slate-400">দাখিল: {comp.reportedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenResolveModal(comp)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>রেজোলিউশন ও অ্যাকশন</span>
                </button>
                <button
                  onClick={() => handleDelete(comp.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Resolve / Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                অভিযোগ নিষ্পত্তি ও ডিসপুট ম্যানেজমেন্ট
              </h2>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>টিকেট আইডি: <strong>{selectedComplaint.id}</strong></span>
                <span>কাস্টমার: <strong>{selectedComplaint.complainantName}</strong></span>
              </div>
              <p className="font-bold text-slate-900">বিষয়: {selectedComplaint.subject}</p>
              <p className="text-slate-600 text-[11px]">"{selectedComplaint.description}"</p>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4 text-xs font-bold">
              
              <div>
                <label className="text-slate-700 block mb-1">স্ট্যাটাস আপডেট করুন:</label>
                <select
                  value={resolutionStatus}
                  onChange={e => setResolutionStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-bold bg-white"
                >
                  <option value="Under Review">তদন্তাধীন (Under Review)</option>
                  <option value="Resolved">সফলভাবে মীমাংসিত (Resolved)</option>
                  <option value="Dismissed">ভিত্তিহীন হিসেবে বাতিল (Dismissed)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">অ্যাডমিন তদন্ত ফলাফল ও গৃহীত পদক্ষেপ (Resolution Notes):</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="যেমন: সার্ভিস প্রোভাইডারের সাথে কথা বলে কাস্টমারকে সন্তোষজনক ১০০ টাকা ডিসকাউন্ট ক্যাশব্যাক দেয়া হয়েছে..."
                  value={resolutionInput}
                  onChange={e => setResolutionInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer font-black"
                >
                  সংরক্ষণ করুন
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Add New Complaint Ticket Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                নতুন অভিযোগ বা ডিসপুট এন্ট্রি
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3.5 text-xs font-bold">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">কাস্টমারের নাম:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: সুমন দেওয়ান"
                    value={newComplaintForm.complainantName}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, complainantName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">কাস্টমার ফোন নম্বর:</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="018XXXXXXXX"
                    value={newComplaintForm.complainantPhone}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, complainantPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">টার্গেট টাইপ:</label>
                  <select
                    value={newComplaintForm.targetType}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, targetType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold bg-white"
                  >
                    <option value="service">সার্ভিস প্রোভাইডার</option>
                    <option value="product">পণ্য ও কোয়ালিটি</option>
                    <option value="seller">মার্চেন্ট সেলার</option>
                    <option value="rider">ডেলিভারি রাইডার</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">অভিযোগের ক্যাটাগরি:</label>
                  <select
                    value={newComplaintForm.category}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">টার্গেট প্রোভাইডার/পণ্যের নাম:</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: পাহাড়ি মধু #JDM-ORD-2049 বা মো: রফিকুল ইসলাম"
                  value={newComplaintForm.targetName}
                  onChange={e => setNewComplaintForm({ ...newComplaintForm, targetName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">অভিযোগের বিষয় (Subject):</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: প্যাকেজিং অক্ষত থাকলেও বোতলের ক্যাপ ঢিলা ছিল"
                  value={newComplaintForm.subject}
                  onChange={e => setNewComplaintForm({ ...newComplaintForm, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">বিস্তারিত বর্ণনা:</label>
                <textarea 
                  rows={2}
                  placeholder="অভিযোগের বিশদ বিবরণ..."
                  value={newComplaintForm.description}
                  onChange={e => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer font-black"
                >
                  টিকেট তৈরি করুন
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
