import React, { useState } from 'react';
import { supabase } from '../supabase';
import { User, Phone, MapPin, Briefcase, Droplet, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import { LOCATION_MASTER } from '../data/locationMaster';
import { ALL_PROFESSIONS_FLAT_LIST } from '../data/professionsMasterData';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../utils/directSupabaseStorage';

export interface ProfileFormProps {
  initialData?: any;
  onSuccess?: (profile: any) => void;
  onCancel?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const allDistricts = LOCATION_MASTER.flatMap(d => d.districts);
  const [fullName, setFullName] = useState(initialData?.fullName || initialData?.full_name || '');
  const [phoneNum, setPhoneNum] = useState(initialData?.phone || '');
  const [prof, setProf] = useState(initialData?.profession || 'সার্ভিস প্রোভাইডার');
  const [bloodGrp, setBloodGrp] = useState(initialData?.blood_group || 'A+');
  const [dist, setDist] = useState(initialData?.district || 'খাগড়াছড়ি');
  const [upazilaName, setUpazilaName] = useState(initialData?.upazila || 'খাগড়াছড়ি সদর');
  const [areaName, setAreaName] = useState(initialData?.area || '');
  const [memType, setMemType] = useState(initialData?.member_type || 'regular_member');
  const [fullAddress, setFullAddress] = useState(initialData?.address || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available upazilas based on selected district
  const currentDistrictObj = allDistricts.find(d => d.nameBn === dist) || allDistricts[0];
  const upazilas = currentDistrictObj ? currentDistrictObj.upazilas.map(u => u.nameBn) : ['খাগড়াছড়ি সদর'];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      try {
        const preview = URL.createObjectURL(file);
        setPhotoUrl(preview);
      } catch {
        // Fallback
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !phoneNum.trim()) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে নাম এবং মোবাইল নম্বর প্রদান করুন।' });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          photoFile,
          photoFile.name,
          'user_profiles'
        );
      } else if (photoUrl && isLocalTransientUrl(photoUrl)) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          photoUrl,
          'profile_photo.jpg',
          'user_profiles'
        );
      }

      const uniqueId = initialData?.unique_id || initialData?.uniqueId || generateDistrictUniqueId(dist);

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            unique_id: uniqueId,
            full_name: fullName,
            phone: phoneNum,
            profession: prof,
            blood_group: bloodGrp,
            district: dist,
            upazila: upazilaName,
            area: areaName,
            member_type: memType,
            address: fullAddress,
            photo_url: finalPhotoUrl
          }
        ]);

      if (error) {
        console.error('Error inserting into profiles:', error);
        setMessage({ type: 'error', text: `সংরক্ষণে সমস্যা হয়েছে: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' });
        if (onSuccess) {
          onSuccess({
            unique_id: uniqueId,
            full_name: fullName,
            phone: phoneNum,
            profession: prof,
            blood_group: bloodGrp,
            district: dist,
            upazila: upazilaName,
            area: areaName,
            member_type: memType,
            address: fullAddress,
            photo_url: finalPhotoUrl
          });
        }
      }
    } catch (err: any) {
      console.error('Profile submission exception:', err);
      setMessage({ type: 'error', text: 'সার্ভারে সংযোগে সমস্যা দেখা দিয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">প্রোফাইল রেজিস্ট্রেশন ফর্ম</h2>
        <p className="text-sm text-slate-500">ঝাদিমাদি ডটকম-এ আপনার প্রোফাইল তৈরি বা হালনাগাদ করুন</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম *</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="আপনার পূর্ণ নাম"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">পেশা / পদবী *</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {ALL_PROFESSIONS_FLAT_LIST.slice(0, 30).map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তের গ্রুপ</label>
          <div className="relative">
            <Droplet className="absolute left-3 top-2.5 w-4 h-4 text-rose-500" />
            <select
              value={bloodGrp}
              onChange={(e) => setBloodGrp(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {allDistricts.map((d, idx) => (
                <option key={idx} value={d.nameBn}>{d.nameBn}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={upazilaName}
              onChange={(e) => setUpazilaName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {upazilas.map((u, idx) => (
                <option key={idx} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">এলাকা / পাড়া / গ্রাম</label>
          <input
            type="text"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="যেমন: শান্তিনগর"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">সদস্যের ধরণ</label>
          <select
            value={memType}
            onChange={(e) => setMemType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          >
            <option value="regular_member">সাধারণ সদস্য</option>
            <option value="service_provider">সার্ভিস প্রোভাইডার</option>
            <option value="product_seller">পণ্য বিক্রেতা</option>
            <option value="permanent_member">স্থায়ী প্রতিনিধি</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত ঠিকানা</label>
        <textarea
          rows={2}
          value={fullAddress}
          onChange={(e) => setFullAddress(e.target.value)}
          placeholder="বাসা/হোল্ডিং নম্বর, রোড বা বিস্তারিত ঠিকানা..."
          className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">প্রোফাইল ছবি (মোবাইল/কম্পিউটার থেকে আপলোড)</label>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt="Profile Preview" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm" 
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 flex items-center justify-center text-emerald-600">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>{photoFile ? photoFile.name : 'গ্যালারি বা ডিভাইস থেকে ছবি নির্বাচন করুন'}</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoSelect} 
                className="hidden" 
              />
            </label>
          </div>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন: https://example.com/photo.jpg"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            বাতিল
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            'প্রোফাইল সংরক্ষণ করুন'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
