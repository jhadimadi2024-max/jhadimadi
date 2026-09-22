import React, { useState } from 'react';
import { 
  CheckCircle, Upload, Search, X, PlusCircle, User, MapPin, 
  Briefcase, FileText, Lock, Star, ShieldCheck, Eye, Edit3, PhoneOff,
  Globe, FileCheck, Image as ImageIcon, Loader2
} from 'lucide-react';
import { Language } from '../utils/translations';
import { supabase } from '../utils/supabaseClient';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../utils/directSupabaseStorage';

// জিও-ডাটা (জেলা ও উপজেলা)
const bdGeoData: Record<string, string[]> = {
  "ঢাকা": ["সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার", "মিরপুর", "উত্তরা", "ধানমণ্ডি", "গুলশান"],
  "গাজীপুর": ["গাজীপুর সদর", "কালিয়াকৈর", "কাপাসিয়া", "শ্রীপুর", "কালিগঞ্জ"],
  "চট্টগ্রাম": ["মীরসরাই", "সীতাকুণ্ড", "হাটহাজারী", "পটিয়া", "বোয়ালখালী", "রাউজান"],
  "সিলেট": ["সিলেট সদর", "গোলাপগঞ্জ", "ফেঞ্চুগঞ্জ", "বিয়ানীবাজার"],
  "রাজশাহী": ["পবা", "গোদাগাড়ী", "তানোর", "মোহনপুর"]
};

// পেশার তালিকা
const allHomeServicesProfessions = [
  {
    category: "সাধারণ ও কারিগরি সেবা / Technical & Repair Services",
    items: [
      "ইলেকট্রিশিয়ান (Electrician)", "প্লাম্বার (Plumber)", 
      "কাঠমিস্ত্রি (Carpenter)", "রংমিস্ত্রি (Painter)", "রাজমিস্ত্রি (Mason)", 
      "এসি ও ফ্রিজ টেকনিশিয়ান (AC & Fridge Technician)", "গ্রিল মিস্ত্রি ও ওয়েল্ডার (Welder)"
    ]
  },
  {
    category: "স্বাস্থ্য ও চিকিৎসা সেবা / Healthcare Services",
    items: [
      "ফিজিওথেরাপিস্ট (Physiotherapist)", "হোম নার্স (Home Nurse)", 
      "কেয়ারগিভার (Caregiver)", "ল্যাব টেকনিশিয়ান (Lab Technician)"
    ]
  },
  {
    category: "পেশাদার ও আইটি সেবা / Professional & IT Services",
    items: [
      "সফটওয়্যার ডেভেলপার (Software Developer)", "গ্রাফিক্স ডিজাইনার (Graphics Designer)", 
      "ডাটা এন্ট্রি অপারেটর (Data Entry Operator)", "ডিজিটাল মার্কেটার (Digital Marketer)", 
      "প্রাইভেট টিউটর (Home Tutor)"
    ]
  }
];

export interface EmbeddedServiceProfileBuilderProps {
  lang?: 'bn' | 'en' | Language;
  currentUser?: any;
  onBack?: () => void;
  onComplete?: (savedProfile: any) => void;
}

export const EmbeddedServiceProfileBuilder: React.FC<EmbeddedServiceProfileBuilderProps> = ({
  lang: initialLang = 'bn',
  currentUser,
  onBack,
  onComplete
}) => {
  const [lang, setLang] = useState<'bn' | 'en'>(initialLang === 'en' ? 'en' : 'bn');
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [formStep, setFormStep] = useState<number>(1);

  // এনআইডি ও ব্যক্তিগত তথ্য
  const [fullName, setFullName] = useState<string>(currentUser?.name || "");
  const [fatherName, setFatherName] = useState<string>("");
  const [motherName, setMotherName] = useState<string>("");
  const [phone, setPhone] = useState<string>(currentUser?.phone || "");
  const [nidNumber, setNidNumber] = useState<string>("");

  // ঠিকানা
  const [district, setDistrict] = useState<string>("");
  const [thana, setThana] = useState<string>("");
  const [paraMaholla, setParaMaholla] = useState<string>("");
  const [permanentAddress, setPermanentAddress] = useState<string>("");

  // পেশা ও কাজের তথ্য
  const [mainTitle, setMainTitle] = useState<string>("");
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [customProfession, setCustomProfession] = useState<string>('');
  const [rate, setRate] = useState<string>("");
  const [rateType, setRateType] = useState<string>("দৈনিক");
  const [overview, setOverview] = useState<string>("");

  // নথি ও ফাইল আপলোড স্টেট
  const [documents, setDocuments] = useState<Array<{ name: string; type: string; file?: File; url?: string }>>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      try {
        const previewUrl = URL.createObjectURL(file);
        setDocuments(prev => [...prev, { name: file.name, type: ext, file, url: previewUrl }]);
      } catch {
        setDocuments(prev => [...prev, { name: file.name, type: ext, file }]);
      }
    }
  };

  const removeDoc = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSaveAndPreview = async () => {
    setIsSaving(true);
    try {
      // Direct Supabase storage upload for each document file
      const updatedDocs = await Promise.all(
        documents.map(async (doc) => {
          if (doc.file) {
            const publicUrl = await uploadFileToSupabaseStorage(
              'documents',
              doc.file,
              doc.name,
              'service_provider_documents'
            );
            return { name: doc.name, type: doc.type, url: publicUrl };
          }
          if (doc.url && isLocalTransientUrl(doc.url)) {
            const publicUrl = await uploadFileToSupabaseStorage(
              'documents',
              doc.url,
              doc.name,
              'service_provider_documents'
            );
            return { name: doc.name, type: doc.type, url: publicUrl };
          }
          return doc;
        })
      );
      setDocuments(updatedDocs);

      const profileData = {
        name: fullName,
        father_name: fatherName,
        mother_name: motherName,
        phone,
        district,
        thana,
        para_maholla: paraMaholla,
        permanent_address: permanentAddress,
        main_title: mainTitle,
        skills: selectedProfessions,
        rate: rate ? parseFloat(rate) : null,
        rate_type: rateType,
        bio: overview,
        documents: updatedDocs.map(d => ({ name: d.name, type: d.type, url: d.url || '' })),
      };

      try {
        await supabase.from('service_providers').upsert([profileData]);
      } catch (dbErr) {
        console.warn('Supabase DB save note:', dbErr);
      }

      onComplete?.(profileData);
      setViewMode('preview');
    } catch (err: any) {
      console.error('Error saving profile or uploading docs:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomProfession = () => {
    if (customProfession.trim() && !selectedProfessions.includes(customProfession.trim())) {
      setSelectedProfessions([...selectedProfessions, customProfession.trim()]);
      setCustomProfession('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 font-sans text-gray-900 p-2 sm:p-4 overflow-y-auto overscroll-y-contain touch-pan-y">
      <div className="max-w-md mx-auto w-full space-y-3 pb-20">

        {/* ভাষা ও ভিউ টগল (প্রফেশনাল লেবেল) */}
        <div className="bg-white p-2 rounded-xl shadow-sm border flex justify-between items-center sticky top-0 z-50">
          <div className="flex gap-1 flex-1">
            <button 
              onClick={() => setViewMode('form')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition ${
                viewMode === 'form' ? 'bg-emerald-700 text-white shadow' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Edit3 size={13} /> {lang === 'bn' ? 'তথ্য ফর্ম' : 'Edit Profile'}
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition ${
                viewMode === 'preview' ? 'bg-emerald-700 text-white shadow' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Eye size={13} /> {lang === 'bn' ? 'প্রোফাইল প্রিভিউ' : 'Profile Preview'}
            </button>
          </div>

          {/* ভাষা সুইচার */}
          <button 
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} 
            className="ml-2 bg-gray-100 px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 text-emerald-800"
          >
            <Globe size={13} /> {lang === 'bn' ? 'EN' : 'বাংলা'}
          </button>
        </div>

        {/* ==================================== */}
        {/* মোড ১: ফর্ম ফিলআপ (FORM EDIT MODE)   */}
        {/* ==================================== */}
        {viewMode === 'form' && (
          <div className="space-y-3">
            
            <div className="bg-emerald-800 text-white p-3 rounded-xl shadow-md text-center">
              <h1 className="text-sm font-bold">{lang === 'bn' ? 'পেশাদার প্রোফাইল নিবন্ধন' : 'Professional Profile Registration'}</h1>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                {lang === 'bn' ? 'ব্যক্তিগত তথ্য প্ল্যাটফর্মে সম্পূর্ণ সুরক্ষিত থাকবে।' : 'Personal credentials are fully protected on our platform.'}
              </p>
            </div>

            {/* ফর্ম ধাপ ১ */}
            {formStep === 1 && (
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                  <h2 className="text-xs font-bold text-emerald-800 border-b pb-2 flex items-center gap-1">
                    <User size={14} /> {lang === 'bn' ? '১. ব্যক্তিগত ও পরিচয়পত্র তথ্য' : '1. Personal & Identification Info'}
                  </h2>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'পূর্ণ নাম (NID অনুযায়ী) *' : 'Full Name (As per NID) *'}</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border rounded-lg text-xs font-medium outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'পিতার নাম *' : "Father's Name *"}</label>
                      <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'মাতার নাম *' : "Mother's Name *"}</label>
                      <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'ফোন নম্বর (পাবলিকলি সুরক্ষিত) *' : 'Phone Number (Protected) *'}</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold text-gray-700 outline-none" />
                  </div>
                </div>

                {/* ঠিকানা */}
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                  <h2 className="text-xs font-bold text-emerald-800 border-b pb-2 flex items-center gap-1">
                    <MapPin size={14} /> {lang === 'bn' ? '২. ঠিকানা ও অবস্থান' : '2. Address & Location'}
                  </h2>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'জেলা *' : 'District *'}</label>
                      <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white font-bold outline-none">
                        {Object.keys(bdGeoData).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'উপজেলা/থানা *' : 'Thana/Upazila *'}</label>
                      <select value={thana} onChange={(e) => setThana(e.target.value)} className="w-full p-2 border rounded-lg text-xs bg-white font-bold outline-none">
                        {bdGeoData[district]?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">{lang === 'bn' ? 'পাড়া/মহল্লা (প্রোফাইলে প্রদর্শনযোগ্য) *' : 'Area/Mahalla *'}</label>
                    <input type="text" value={paraMaholla} onChange={(e) => setParaMaholla(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none" />
                  </div>
                </div>

                <button onClick={() => setFormStep(2)} className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-xs shadow">
                  {lang === 'bn' ? 'পরবর্তী ধাপ: পেশা ও সার্টিফিকেট আপলোড ➔' : 'Next Step: Occupation & Documents ➔'}
                </button>
              </div>
            )}

            {/* ফর্ম ধাপ ২: পেশা ও ফাইল আপলোড */}
            {formStep === 2 && (
              <div className="space-y-3">
                
                {/* পেশা নির্বাচন */}
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                  <h2 className="text-xs font-bold text-emerald-800 border-b pb-2 flex items-center gap-1">
                    <Briefcase size={14} /> {lang === 'bn' ? '৩. পেশা ও দক্ষতা যুক্ত করুন' : '3. Select Skills & Occupation'}
                  </h2>

                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={customProfession} 
                      onChange={(e) => setCustomProfession(e.target.value)} 
                      placeholder={lang === 'bn' ? "নতুন পেশার নাম লিখুন" : "Type custom occupation"} 
                      className="w-full p-2 border rounded-lg text-xs outline-none"
                    />
                    <button onClick={addCustomProfession} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0">
                      <PlusCircle size={14} /> {lang === 'bn' ? 'যোগ' : 'Add'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedProfessions.map(prof => (
                      <span key={prof} className="bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1">
                        {prof} <X size={12} className="cursor-pointer" onClick={() => setSelectedProfessions(selectedProfessions.filter(p => p !== prof))} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* সার্টিফিকেট, বায়োডাটা ও কাজের ফাইল আপলোড সেকশন */}
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                  <h2 className="text-xs font-bold text-emerald-800 border-b pb-2 flex items-center gap-1">
                    <FileCheck size={14} /> {lang === 'bn' ? '৪. সার্টিফিকেট, সিভি ও কাজের পোর্টফোলিও আপলোড' : '4. Certificates, CV & Portfolio Documents'}
                  </h2>

                  <p className="text-[10px] text-gray-500">
                    {lang === 'bn' ? 'আপনার শিক্ষাগত যোগ্যতার সনদ, বায়োডাটা (CV) বা কাজের ছবি আপলোড করুন (PDF, Word, JPG, PNG গ্রহণযোগ্য)' : 'Upload Educational Certificates, CV, or Work Photos (PDF, Word, JPG, PNG allowed)'}
                  </p>

                  <label className="border-2 border-dashed border-emerald-300 p-3 rounded-xl text-center bg-emerald-50 cursor-pointer block hover:bg-emerald-100 transition">
                    <Upload size={20} className="mx-auto text-emerald-700 mb-1" />
                    <span className="text-xs font-bold text-emerald-900 block">
                      {lang === 'bn' ? 'ফাইল সিলেক্ট করুন বা ড্রাগ করুন' : 'Select or Drag File Here'}
                    </span>
                    <span className="text-[9px] text-gray-500 block mt-0.5">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</span>
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* আপলোড হওয়া ফাইলগুলোর তালিকা */}
                  {documents.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-gray-700 block">সংযুক্ত নথিপত্র ({documents.length}):</span>
                      {documents.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 border p-2 rounded-lg flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {doc.type === 'pdf' ? <FileText size={16} className="text-red-500 shrink-0" /> : <ImageIcon size={16} className="text-blue-500 shrink-0" />}
                            <span className="truncate text-[11px] font-medium text-gray-800">{doc.name}</span>
                          </div>
                          <X size={14} className="text-gray-400 hover:text-red-600 cursor-pointer shrink-0" onClick={() => removeDoc(idx)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setFormStep(1)} className="w-1/3 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-bold text-xs">
                    ⬅️ {lang === 'bn' ? 'আগের ধাপ' : 'Back'}
                  </button>
                  <button 
                    onClick={handleSaveAndPreview} 
                    disabled={isSaving}
                    className="w-2/3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold text-xs shadow flex justify-center items-center gap-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {lang === 'bn' ? 'আপলোড ও সংরক্ষণ হচ্ছে...' : 'Uploading & Saving...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} /> {lang === 'bn' ? 'প্রোফাইল সংরক্ষণ ও প্রিভিউ' : 'Save & Preview Profile'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================= */}
        {/* মোড ২: প্রফেশনাল প্রিভিউ (PUBLIC PROFILE)   */}
        {/* ========================================= */}
        {viewMode === 'preview' && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden space-y-4 pb-4">
            
            <div className="bg-amber-50 border-b border-amber-200 p-2 text-center text-[10px] text-amber-900 font-medium flex items-center justify-center gap-1">
              <Lock size={12} className="text-amber-700" />
              {lang === 'bn' ? 'ব্যক্তিগত ফোন নাম্বার ও ঠিকানা হাইড করা আছে। যোগাযোগের জন্য বুকিং সম্পন্ন করুন।' : 'Contact details are hidden. Complete payment to initiate contact.'}
            </div>

            {/* প্রোফাইল কার্ড */}
            <div className="p-4 text-center border-b space-y-2">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 bg-emerald-100 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-800 font-bold text-xl">
                  {fullName.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full border-2 border-white">
                  <ShieldCheck size={12} />
                </div>
              </div>

              <div>
                <h1 className="text-base font-bold text-gray-900 flex items-center justify-center gap-1">
                  {fullName.split(' ')[0]} {fullName.split(' ')[1] ? fullName.split(' ')[1].charAt(0) + '.' : ''}
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold border border-emerald-300">
                    {lang === 'bn' ? 'ভেরিফাইড পেশাজীবী' : 'Verified Professional'}
                  </span>
                </h1>
                <p className="text-xs text-gray-600 font-medium">{mainTitle}</p>
              </div>

              <div className="flex justify-center items-center gap-3 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-0.5 text-emerald-800 font-semibold">
                  <MapPin size={13} />
                  <span>{thana}, {district}</span>
                </div>
                <span>•</span>
                <div className="font-bold text-emerald-900">
                  ৳{rate} <span className="text-[10px] font-normal text-gray-500">/{rateType}</span>
                </div>
              </div>

              <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 mt-2">
                <CheckCircle size={15} />
                {lang === 'bn' ? 'পেমেন্ট এর মাধ্যমে বুকিং করুন' : 'Book Service via Jhadimadi'}
              </button>
            </div>

            {/* দক্ষতা */}
            <div className="px-4 space-y-2 border-b pb-3">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{lang === 'bn' ? 'পেশাগত দক্ষতা:' : 'Skills & Services:'}</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedProfessions.map((skill) => (
                  <span key={skill} className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* নথিপত্র ও সার্টিফিকেট প্রদর্শন */}
            <div className="px-4 space-y-2 border-b pb-3">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{lang === 'bn' ? 'যাচাইকৃত সনদ ও ফাইলসমূহ:' : 'Verified Credentials & Certificates:'}</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck size={15} className="text-emerald-700" />
                      <span className="font-medium text-gray-800 text-[11px]">{doc.name}</span>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* বায়োডাটা/বিবরণ */}
            <div className="px-4 space-y-1">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{lang === 'bn' ? 'পেশাগত বিবরণ (Bio):' : 'Professional Overview:'}</h3>
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-2.5 rounded-xl border">
                {overview}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default EmbeddedServiceProfileBuilder;