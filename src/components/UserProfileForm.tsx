import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User, Phone, MapPin, Tag, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export interface ProfileFormData {
  full_name: string;
  phone: string;
  address: string;
  category: string;
}

export const CATEGORY_OPTIONS = [
  { value: 'electronics', label: 'Electronics & Gadgets (ইলেকট্রনিক্স ও গ্যাজেট)' },
  { value: 'organic_food', label: 'Organic Food & Agro (অর্গানিক খাবার ও কৃষিপণ্য)' },
  { value: 'real_estate', label: 'Real Estate & Land (রিয়েল এস্টেট ও জমি)' },
  { value: 'clothing', label: 'Clothing & Fashion (পোশাক ও ফ্যাশন)' },
  { value: 'home_services', label: 'Home & Local Services (গৃহস্থালি ও অন্যান্য সেবা)' },
  { value: 'transport', label: 'Transport & Logistics (পরিবহন ও লজিস্টিক)' },
  { value: 'other', label: 'Other (অন্যান্য)' },
];

interface UserProfileFormProps {
  onSuccess?: (data: ProfileFormData) => void;
  className?: string;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSuccess, className = '' }) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    address: '',
    category: 'organic_food',
  });

  const [customCategory, setCustomCategory] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ১. অথেন্টিকেটেড ইউজার এবং প্রোফাইল ডাটা লোড করা
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setStatusMessage(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) {
            setUserId(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUserId(user.id);
        }

        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, phone, address, category')
          .eq('unique_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching profile:', fetchError);
        }

        if (profile && isMounted) {
          const matchedCategory = CATEGORY_OPTIONS.some(c => c.value === profile.category);
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            category: matchedCategory ? profile.category : 'other',
          });
          if (!matchedCategory && profile.category) {
            setCustomCategory(profile.category);
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!userId) {
      setStatusMessage({
        type: 'error',
        text: 'প্রোফাইল সংরক্ষণ করতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।',
      });
      return;
    }

    if (!formData.full_name.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।',
      });
      return;
    }

    const finalCategory = formData.category === 'other' && customCategory.trim() 
      ? customCategory.trim() 
      : formData.category;

    setSubmitting(true);

    try {
      const uniqueId = userId;
      const fullName = formData.full_name.trim();
      const phoneNum = formData.phone.trim();
      const prof = finalCategory;
      const dist = 'খাগড়াছড়ি';
      const upazilaName = 'খাগড়াছড়ি সদর';
      const areaName = formData.address.trim() || 'সদর';
      const fullAddress = formData.address.trim();

      // ডাটাবেজে সংরক্ষণ বা আপডেট (Upsert)
      const { error } = await supabase
        .from('profiles')
        .upsert(
          [
            {
              unique_id: uniqueId,
              full_name: fullName,
              phone: phoneNum,
              profession: prof,
              district: dist,
              upazila: upazilaName,
              area: areaName,
              member_type: 'user',
              address: fullAddress,
            }
          ],
          { onConflict: 'unique_id' }
        );

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: 'success',
        text: 'আপনার প্রফাইল সফলভাবে সংরক্ষণ করা হয়েছে!',
      });

      if (onSuccess) {
        onSuccess({
          ...formData,
          category: finalCategory,
        });
      }
    } catch (err: any) {
      console.error('Profile submission error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'প্রোফাইল সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-center">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
        <h3 className="font-semibold text-lg mb-1">লগইন প্রয়োজন</h3>
        <p className="text-sm text-amber-700">প্রোফাইল তৈরি বা আপডেট করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে সাইন ইন করুন।</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">রেজিস্ট্রেশন ও প্রফাইল বিবরণী</h2>
          <p className="text-xs text-slate-500 mt-0.5">আপনার সঠিক তথ্য দিয়ে প্রফাইলটি আপডেট করুন</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            পূর্ণ নাম (Full Name) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="যেমন: পূর্ণ চাকমা"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            মোবাইল নম্বর (Phone Number) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="যেমন: 01712345678"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            ব্যবসায়িক ক্যাটাগরি বা পেশা (Category) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Tag className="w-4 h-4" />
            </div>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition appearance-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {formData.category === 'other' && (
            <div className="mt-3">
              <input
                id="customCategory"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="আপনার নিজস্ব ক্যাটাগরি লিখুন..."
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            পূর্ণ ঠিকানা (Address)
          </label>
          <div className="relative">
            <div className="absolute top-3.5 left-4 text-slate-400 pointer-events-none">
              <MapPin className="w-4 h-4" />
            </div>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              placeholder="যেমন: বনরূপা বাজার, রাঙামাটি সদর, রাঙামাটি"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <span>প্রোফাইল সংরক্ষণ করুন</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;