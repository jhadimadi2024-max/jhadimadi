import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Briefcase, Building2, MapPin, Phone, CheckCircle, AlertCircle, Loader2, Upload, FileText, X } from 'lucide-react';
import { LOCATION_MASTER } from '../data/locationMaster';
import { uploadFileToSupabaseStorage } from '../utils/directSupabaseStorage';
import { submitFormData } from '../services/unifiedRegistrationService';
import { smartSupabaseUpload, smartSupabaseInsert } from '../utils/supabaseDataService';

export interface JobCircularFormProps {
  initialData?: any;
  onSuccess?: (circular: any) => void;
  onCancel?: () => void;
}

/* =========================================================
   BANGLADESH MOBILE NUMBER NORMALIZATION & OPERATOR VALIDATION
========================================================= */
const normalizeBangladeshPhone = (value: string): string => {
  let phone = value.trim().replace(/[\s\-()]/g, '');
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }
  return phone;
};

const isValidBangladeshPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone);
};

export const JobCircularForm: React.FC<JobCircularFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const allDistricts = LOCATION_MASTER.flatMap(d => d.districts);
  const [jobTitle, setJobTitle] = useState(initialData?.job_title || initialData?.title || '');
  const [companyName, setCompanyName] = useState(initialData?.company_or_poster || initialData?.companyName || '');
  const [dist, setDist] = useState(initialData?.district || 'খাগড়াছড়ি');
  const [upazilaName, setUpazilaName] = useState(initialData?.upazila || 'খাগড়াছড়ি সদর');
  const [phoneNum, setPhoneNum] = useState(initialData?.phone || '');
  const [circularFile, setCircularFile] = useState<File | null>(null);
  const [circularFileName, setCircularFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentDistrictObj = allDistricts.find(d => d.nameBn === dist) || allDistricts[0];
  const upazilas = currentDistrictObj ? currentDistrictObj.upazilas.map(u => u.nameBn) : ['খাগড়াছড়ি সদর'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCircularFile(file);
      setCircularFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!jobTitle.trim() || !companyName.trim() || !phoneNum.trim()) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে চাকরির পদবী, প্রতিষ্ঠান এবং মোবাইল নম্বর প্রদান করুন।' });
      return;
    }

    const cleanPhone = normalizeBangladeshPhone(phoneNum);
    if (!isValidBangladeshPhone(cleanPhone)) {
      const errText = 'সঠিক ১১ ডিজিটের সচল বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 017..., 018... ইত্যাদি)।';
      setMessage({ type: 'error', text: errText });
      alert(errText);
      return;
    }

    setIsSubmitting(true);
    try {
      /* ===================================================
         DUPLICATE CHECK IN JOB_CIRCULARS TABLE
      =================================================== */
      const { data: existingJobs, error: duplicateErr } = await supabase
        .from('job_circulars')
        .select('phone, phone_number')
        .or(`phone.eq.${cleanPhone},phone_number.eq.${cleanPhone}`);

      if (!duplicateErr && existingJobs && existingJobs.length > 0) {
        setIsSubmitting(false);
        const dupMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
        setMessage({ type: 'error', text: dupMsg });
        alert(dupMsg);
        return;
      }

      // 1. Upload circular file directly to Supabase storage documents bucket
      let permanentCircularUrl = '';
      if (circularFile) {
        const uploadRes = await smartSupabaseUpload('documents', circularFile, 'job_circulars');
        permanentCircularUrl = uploadRes.url;
      }

      // 2. Submit with exact schema mapping
      const payload: Record<string, any> = {
        title: jobTitle.trim(),
        job_title: jobTitle.trim(),
        company: companyName.trim(),
        company_name: companyName.trim(),
        company_or_poster: companyName.trim(),
        description: `${companyName.trim()}-এ ${jobTitle.trim()} পদে আবশ্যক।`,
        district: dist,
        upazila: upazilaName,
        phone_number: cleanPhone,
        phone: cleanPhone,
      };

      if (permanentCircularUrl) {
        payload.circular_file = permanentCircularUrl;
        payload.photos = permanentCircularUrl;
      }

      const result = await submitFormData('job_circulars', payload);

      if (!result.success) {
        console.error('Error inserting into job_circulars:', result.error);
        if (result.isDuplicate || result.errorCode === '23505' || result.error?.includes('পূর্বেই রেজিস্ট্রেশন করা হয়েছে')) {
          const dupMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
          setMessage({ type: 'error', text: dupMsg });
          alert(dupMsg);
        } else {
          setMessage({ type: 'error', text: `বিজ্ঞপ্তি প্রকাশে সমস্যা: ${result.error}` });
        }
      } else {
        setMessage({ type: 'success', text: 'চাকরির বিজ্ঞপ্তি ও ফাইল সফলভাবে ক্লাউডে প্রকাশিত হয়েছে!' });
        // Clear input fields on success
        setJobTitle('');
        setCompanyName('');
        setPhoneNum('');
        setCircularFile(null);
        setCircularFileName('');
        if (onSuccess) {
          onSuccess({
            ...payload,
            circular_file: permanentCircularUrl
          });
        }
      }
    } catch (err: any) {
      console.error('Job circular submission error:', err);
      setMessage({ type: 'error', text: 'সার্ভারে সংযোগে সমস্যা দেখা দিয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">চাকরির বিজ্ঞপ্তি পোস্ট / নিয়োগ ফর্ম</h2>
        <p className="text-sm text-slate-500">ঝাদিমাদি প্ল্যাটফর্মে নতুন চাকরির সার্কুলার প্রকাশ করুন</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">চাকরির পদবী (Job Title) *</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="যেমন: সেলস এক্সিকিউটিভ / কম্পিউটার অপারেটর"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">প্রতিষ্ঠান বা পোস্টকারীর নাম (Company / Poster) *</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="যেমন: গ্রিনহিল এন্টারপ্রাইজ"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা (District) *</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা (Upazila) *</label>
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">যোগাযোগের ফোন নম্বর (Phone) *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">⚠️ এই নম্বর দিয়ে পূর্বে কোনো সার্কুলার পোস্ট করা থাকলে ডাবল পোস্ট নেওয়া হবে না।</p>
        </div>

        {/* Circular File / Image Attachment */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              বিজ্ঞপ্তি ছবি বা ফাইল সংযুক্তি (Circular Document/Image)
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Supabase Cloud Storage</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,image/*,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="circular-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            id="btn-circular-file-browse"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            {circularFile ? 'ফাইল পরিবর্তন করুন' : 'মোবাইল/পিসি থেকে সার্কুলার ফাইল বা ছবি বাছুন'}
          </button>
          {circularFile && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-700 truncate flex-1">{circularFileName} ({(circularFile.size / 1024).toFixed(1)} KB)</span>
              <button
                type="button"
                onClick={() => {
                  setCircularFile(null);
                  setCircularFileName('');
                }}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            বাতিল
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              বিজ্ঞপ্তি প্রকাশিত হচ্ছে...
            </>
          ) : (
            'বিজ্ঞপ্তি প্রকাশ করুন'
          )}
        </button>
      </div>
    </form>
  );
};

export default JobCircularForm;