import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplet, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  HeartHandshake, 
  ShieldCheck, 
  Filter, 
  Calendar,
  AlertCircle,
  X,
  ExternalLink,
  Users,
  Activity,
  Loader2
} from 'lucide-react';
import { useData, AdminBloodDonor } from '../../context/DataContext';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { databaseService } from '../../services/databaseService';

export const AdminBloodDonorsTab: React.FC = () => {
  const { addBloodDonor, updateBloodDonor, deleteBloodDonor: syncContextDelete, toggleBloodDonorStatus: syncToggleStatus } = useData();

  // PURGE MOCK DATA STATE PERSISTENCE: Initial component state strictly an empty array []
  const [bloodDonors, setBloodDonors] = useState<AdminBloodDonor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'busy'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<AdminBloodDonor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: 'O+' as AdminBloodDonor['bloodGroup'],
    phone: '',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    area: '',
    lastDonationDate: '',
    totalDonations: 1,
    isAvailable: true,
    verified: true,
    emergencyContact: '',
    age: 25
  });

  const bloodGroups: AdminBloodDonor['bloodGroup'][] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const districts = ['খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান', 'চট্টগ্রাম', 'ঢাকা'];

  // On component mount (useEffect), fetch ONLY live entries from Supabase
  useEffect(() => {
    let isMounted = true;

    const fetchLiveBloodDonors = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from('blood_donors').select('*');
          if (!error && Array.isArray(data)) {
            const mapped: AdminBloodDonor[] = data.map((d: any) => ({
              id: String(d.id),
              name: d.name || d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
              bloodGroup: (d.blood_group || d.bloodGroup || 'A+') as AdminBloodDonor['bloodGroup'],
              phone: d.phone || d.contact_number || '',
              district: d.district || 'খাগড়াছড়ি',
              upazila: d.upazila || 'খাগড়াছড়ি সদর',
              area: d.area || '',
              lastDonationDate: d.last_donation_date || d.lastDonationDate || '',
              totalDonations: Number(d.total_donations || d.totalDonations || 1),
              isAvailable: d.is_available !== false,
              verified: d.verified !== false,
              emergencyContact: d.emergency_contact || d.emergencyContact || '',
              age: Number(d.age || 25),
              districtUniqueId: d.unique_id || d.district_unique_id || ''
            }));

            if (isMounted) {
              setBloodDonors(mapped);
              setIsLoading(false);
            }
            return;
          }
        }

        const fallback = await databaseService.fetchBloodDonorsFromDatabase();
        if (isMounted) {
          setBloodDonors(Array.isArray(fallback) ? fallback : []);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[AdminBloodDonorsTab] Error fetching live donors:', err);
        if (isMounted) {
          setBloodDonors([]);
          setIsLoading(false);
        }
      }
    };

    fetchLiveBloodDonors();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingDonor(null);
    setFormData({
      name: '',
      bloodGroup: 'O+',
      phone: '',
      district: 'খাগড়াছড়ি',
      upazila: 'খাগড়াছড়ি সদর',
      area: '',
      lastDonationDate: new Date().toISOString().split('T')[0],
      totalDonations: 1,
      isAvailable: true,
      verified: true,
      emergencyContact: '',
      age: 25
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (donor: AdminBloodDonor) => {
    setEditingDonor(donor);
    setFormData({
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      phone: donor.phone,
      district: donor.district,
      upazila: donor.upazila,
      area: donor.area,
      lastDonationDate: donor.lastDonationDate,
      totalDonations: donor.totalDonations,
      isAvailable: donor.isAvailable,
      verified: donor.verified,
      emergencyContact: donor.emergencyContact || '',
      age: donor.age || 25
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('অনুগ্রহ করে রক্তদাতার নাম ও ফোন নম্বর প্রদান করুন');
      return;
    }

    try {
      if (editingDonor) {
        const updated: AdminBloodDonor = {
          ...editingDonor,
          ...formData
        };

        if (isSupabaseConfigured) {
          await supabase.from('blood_donors').upsert({
            id: editingDonor.id,
            name: formData.name,
            blood_group: formData.bloodGroup,
            phone: formData.phone,
            district: formData.district,
            upazila: formData.upazila,
            area: formData.area,
            last_donation_date: formData.lastDonationDate,
            total_donations: formData.totalDonations,
            is_available: formData.isAvailable,
            verified: formData.verified,
            emergency_contact: formData.emergencyContact,
            age: formData.age
          });
        }
        await databaseService.saveBloodDonorToDatabase(updated);

        setBloodDonors(prev => prev.map(d => d.id === editingDonor.id ? updated : d));
        updateBloodDonor(editingDonor.id, formData);
        setStatusMessage({ type: 'success', text: `✓ '${formData.name}'-এর তথ্য সফলভাবে আপডেট হয়েছে।` });
      } else {
        const newId = `bld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const created: AdminBloodDonor = {
          ...formData,
          id: newId
        };

        if (isSupabaseConfigured) {
          await supabase.from('blood_donors').insert([{
            id: newId,
            name: formData.name,
            blood_group: formData.bloodGroup,
            phone: formData.phone,
            district: formData.district,
            upazila: formData.upazila,
            area: formData.area,
            last_donation_date: formData.lastDonationDate,
            total_donations: formData.totalDonations,
            is_available: formData.isAvailable,
            verified: formData.verified,
            emergency_contact: formData.emergencyContact,
            age: formData.age
          }]);
        }
        await databaseService.saveBloodDonorToDatabase(created);

        setBloodDonors(prev => [created, ...prev]);
        addBloodDonor(formData);
        setStatusMessage({ type: 'success', text: `✓ নতুন রক্তদাতা '${formData.name}' নিবন্ধিত হয়েছে।` });
      }
    } catch (err: any) {
      console.error('[AdminBloodDonorsTab] Submit error:', err);
      alert('তথ্য সংরক্ষণ করতে ত্রুটি ঘটেছে: ' + (err?.message || 'অজানা সমস্যা'));
    }

    setIsModalOpen(false);
  };

  // 1. DYNAMIC SUPABASE DELETE ACTION:
  // - Execute a real API call to Supabase: await supabase.from('blood_donors').delete().eq('id', targetId);
  // - Only remove the item from UI state AFTER receiving a successful response from Supabase.
  const handleDelete = async (targetId: string, name: string) => {
    if (!window.confirm(`আপনি কি '${name}'-কে রক্তদাতা তালিকা থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }

    setDeletingId(targetId);
    setStatusMessage(null);

    try {
      let isDeleteSuccessful = false;

      // Primary: Real API call to Supabase
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('blood_donors').delete().eq('id', targetId);
        if (!error) {
          isDeleteSuccessful = true;
        } else {
          console.warn('[AdminBloodDonorsTab] Supabase delete error:', error);
        }
      }

      // Secondary: Call backend & databaseService to ensure local file & cache are purged
      const dbResult = await databaseService.deleteBloodDonorFromSupabase(targetId);
      if (dbResult.success) {
        isDeleteSuccessful = true;
      }

      if (isDeleteSuccessful) {
        // Only remove the item from UI state AFTER receiving a successful response from Supabase
        setBloodDonors(prev => prev.filter(donor => donor.id !== targetId));
        syncContextDelete(targetId);
        setStatusMessage({ type: 'success', text: `✓ '${name}'-কে ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।` });
      } else {
        throw new Error('Supabase ডাটাবেস থেকে রেকর্ড মোছা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error('[AdminBloodDonorsTab] Delete failed:', err);
      const errMsg = err?.message || 'ডাটাবেস ত্রুটি';
      setStatusMessage({ type: 'error', text: `মুছতে ব্যর্থ হয়েছে: ${errMsg}` });
      alert(`রক্তদাতা মুছতে ব্যর্থ হয়েছে: ${errMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = bloodDonors.find(d => d.id === id);
    if (!target) return;
    const newStatus = !target.isAvailable;

    try {
      if (isSupabaseConfigured) {
        await supabase.from('blood_donors').update({ is_available: newStatus }).eq('id', id);
      }
      setBloodDonors(prev => prev.map(d => d.id === id ? { ...d, isAvailable: newStatus } : d));
      syncToggleStatus(id);
    } catch (err) {
      console.warn('[AdminBloodDonorsTab] Error updating donor availability:', err);
    }
  };

  const handleToggleVerify = async (id: string, currentVerified: boolean) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('blood_donors').update({ verified: !currentVerified }).eq('id', id);
      }
      setBloodDonors(prev => prev.map(d => d.id === id ? { ...d, verified: !currentVerified } : d));
      updateBloodDonor(id, { verified: !currentVerified });
    } catch (err) {
      console.warn('[AdminBloodDonorsTab] Error updating donor verified badge:', err);
    }
  };

  const filteredDonors = useMemo(() => {
    return bloodDonors.filter(donor => {
      if (selectedBloodGroup !== 'all' && donor.bloodGroup !== selectedBloodGroup) return false;
      if (selectedDistrict !== 'all' && donor.district !== selectedDistrict) return false;
      if (selectedAvailability === 'available' && !donor.isAvailable) return false;
      if (selectedAvailability === 'busy' && donor.isAvailable) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = donor.name.toLowerCase().includes(q);
        const matchPhone = donor.phone.includes(q);
        const matchUpazila = donor.upazila.toLowerCase().includes(q);
        const matchArea = donor.area.toLowerCase().includes(q);
        const matchGroup = donor.bloodGroup.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchUpazila && !matchArea && !matchGroup) return false;
      }

      return true;
    });
  }, [bloodDonors, selectedBloodGroup, selectedDistrict, selectedAvailability, searchQuery]);

  const availableCount = bloodDonors.filter(d => d.isAvailable).length;
  const verifiedCount = bloodDonors.filter(d => d.verified).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-blood-donors-tab">
      
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                রক্তদাতা ডিরেক্টরি সেন্ট্রাল CMS
              </h1>
              <p className="text-xs text-slate-500">
                পার্বত্য অঞ্চল ও পার্শ্ববর্তী জেলার জরুরি রক্তদাতা তালিকা, রক্তের গ্রুপ ও লোকেশন ভেরিফিকেশন
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন রক্তদাতা নিবন্ধন</span>
        </button>
      </div>

      {/* Status feedback message */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards for Blood CMS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">মোট নিবন্ধিত রক্তদাতা</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{bloodDonors.length} জন</span>
            <span className="text-[10px] font-bold text-emerald-600">সার্বক্ষণিক লাইভ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">রক্তদানে প্রস্তুত (Ready)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{availableCount} জন</span>
            <span className="text-[10px] font-bold text-rose-600 animate-pulse">জরুরি প্রস্তুত</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">ভেরিফাইড রক্তদাতা</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{verifiedCount} জন</span>
            <span className="text-[10px] font-bold text-slate-400">KYC সম্পূর্ণ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block">মোট সফল রক্তদান</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">
              {bloodDonors.reduce((sum, d) => sum + (d.totalDonations || 0), 0) > 0
                ? `${bloodDonors.reduce((sum, d) => sum + (d.totalDonations || 0), 0)} বার`
                : '০ বার'}
            </span>
            <span className="text-[10px] font-bold text-purple-600">জীবন বাঁচানো</span>
          </div>
        </div>
      </div>

      {/* Blood Group Filter Quick Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <span className="text-xs font-bold text-slate-700 block">রক্তের গ্রুপ অনুযায়ী দ্রুত ফিল্টার:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedBloodGroup('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedBloodGroup === 'all' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সব গ্রুপ ({bloodDonors.length})
          </button>
          {bloodGroups.map(bg => {
            const count = bloodDonors.filter(d => d.bloodGroup === bg).length;
            return (
              <button
                key={bg}
                onClick={() => setSelectedBloodGroup(bg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  selectedBloodGroup === bg 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <Droplet className="w-3 h-3 fill-current" />
                <span>{bg}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Secondary Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="রক্তদাতার নাম, ফোন বা এলাকা সার্চ করুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* District & Availability Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-rose-500"
          >
            <option value="all">সব জেলা</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={e => setSelectedAvailability(e.target.value as any)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-rose-500"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="available">রক্তদানে প্রস্তুত (Available)</option>
            <option value="busy">অপেক্ষমাণ (Busy)</option>
          </select>
        </div>

      </div>

      {/* Blood Donors Table / Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Supabase লাইভ ডাটাবেস থেকে রক্তদাতাদের তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">কোনো রক্তদাতার রেকর্ড নেই</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              লাইভ ডাটাবেসে এই মুহূর্তে কোনো রক্তদাতার তথ্য নেই। নতুন রক্তদাতা নিবন্ধনের জন্য 'নতুন রক্তদাতা নিবন্ধন' বাটনে ক্লিক করুন।
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map(donor => (
            <div 
              key={donor.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3 relative flex flex-col justify-between"
            >
              <div>
                {/* Header: Blood Group Icon & Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex flex-col items-center justify-center font-black shadow-md shadow-rose-500/20 shrink-0">
                      <Droplet className="w-4 h-4 fill-white" />
                      <span className="text-xs leading-none mt-0.5">{donor.bloodGroup}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-900">{donor.name}</h3>
                        {donor.verified && (
                          <span title="ভেরিফাইড রক্তদাতা">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">আইডি: {donor.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(donor.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      donor.isAvailable 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {donor.isAvailable ? 'প্রস্তুত' : 'অপেক্ষমাণ'}
                  </button>
                </div>

                {/* Info Details */}
                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{donor.district} &gt; {donor.upazila} {donor.area ? `(${donor.area})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>মোট রক্তদান: <strong className="text-slate-900 font-black">{donor.totalDonations} বার</strong></span>
                  </div>
                  {donor.lastDonationDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500">সর্বশেষ দান: {donor.lastDonationDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${donor.phone}`}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{donor.phone}</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleVerify(donor.id, donor.verified)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      donor.verified 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                    title={donor.verified ? 'ভেরিফাইড স্ট্যাটাস বাতিল করুন' : 'ভেরিফাইড ব্যাজ দিন'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(donor)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition"
                    title="এডিট করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(donor.id, donor.name)}
                    disabled={deletingId === donor.id}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition disabled:opacity-50"
                    title="ডাটাবেস থেকে মুছে ফেলুন"
                  >
                    {deletingId === donor.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Donor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                {editingDonor ? 'রক্তদাতার প্রোফাইল সম্পাদনা' : 'নতুন রক্তদাতা নিবন্ধন'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              
              <div>
                <label className="text-slate-700 block mb-1">রক্তদাতার পূর্ণ নাম:</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: মো: নাজমুল হুদা"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">রক্তের গ্রুপ (Blood Group):</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-bold bg-white"
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">যোগাযোগের ফোন নম্বর:</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="018XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">জেলা (District):</label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold bg-white"
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">উপজেলা / থানা:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: খাগড়াছড়ি সদর বা পানছড়ি"
                    value={formData.upazila}
                    onChange={e => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">নির্দিষ্ট এলাকা / গ্রাম:</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: শান্তিনগর, তবলছড়ি"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">মোট রক্তদান সংখ্যা:</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.totalDonations}
                    onChange={e => setFormData({ ...formData, totalDonations: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">সর্বশেষ রক্তদানের তারিখ:</label>
                  <input 
                    type="date" 
                    value={formData.lastDonationDate}
                    onChange={e => setFormData({ ...formData, lastDonationDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">জরুরি বিকল্প যোগাযোগ (ঐচ্ছিক):</label>
                  <input 
                    type="tel" 
                    placeholder="018XXXXXXXX"
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-rose-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="donor-is-available"
                    checked={formData.isAvailable}
                    onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <label htmlFor="donor-is-available" className="text-slate-700 cursor-pointer">
                    রক্তদানে প্রস্তুত (Available)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="donor-is-verified"
                    checked={formData.verified}
                    onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="donor-is-verified" className="text-slate-700 cursor-pointer">
                    ভেরিফাইড ব্যাজ প্রদান
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition cursor-pointer font-black"
                >
                  {editingDonor ? 'আপডেট করুন' : 'নিবন্ধন সম্পন্ন করুন'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
