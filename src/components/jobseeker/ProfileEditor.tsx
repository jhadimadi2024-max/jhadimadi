import React, { useState, useMemo } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  ShieldCheck, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Upload, 
  Camera, 
  Globe, 
  FileText, 
  Eye, 
  EyeOff, 
  Check, 
  Clock, 
  Languages, 
  FolderGit2
} from 'lucide-react';
import { 
  MasterJobSeekerProfile, 
  EducationEntry, 
  ExperienceEntry, 
  SkillItem, 
  LanguageItem, 
  PortfolioProject, 
  CertificationItem, 
  CandidatePrivacySettings 
} from '../../types/jobseeker';
import { JOB_CATEGORIES, JOB_TYPES } from '../../services/jobService';
import { LOCATION_MASTER, UpazilaItem } from '../../data/locationMaster';
import { saveMasterProfile, calculateJobSeekerCompleteness } from '../../services/jobSeekerService';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../../utils/directSupabaseStorage';

interface ProfileEditorProps {
  lang: 'bn' | 'en';
  profile: MasterJobSeekerProfile;
  onSave: (updatedProfile: MasterJobSeekerProfile) => void;
  onOpenCvUpload?: () => void;
  onOpenCvBuilder?: () => void;
  onShowToast: (msg: string) => void;
}

type EditorTab = 'personal' | 'career' | 'history' | 'skills' | 'portfolio' | 'privacy';

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  lang,
  profile: initialProfile,
  onSave,
  onOpenCvUpload,
  onOpenCvBuilder,
  onShowToast,
}) => {
  const [profile, setProfile] = useState<MasterJobSeekerProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<EditorTab>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  // Skill addition draft
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');

  // Flat list of districts for location selector
  const allDistricts = useMemo(() => {
    const list: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[] = [];
    LOCATION_MASTER.forEach(div => {
      div.districts.forEach(dist => {
        list.push({
          nameBn: dist.nameBn,
          nameEn: dist.nameEn,
          code: dist.code,
          upazilas: dist.upazilas,
          divisionBn: div.nameBn,
        });
      });
    });
    return list;
  }, []);

  const upazilasForDistrict = useMemo(() => {
    const found = allDistricts.find(d => d.nameBn === profile.district);
    return found ? found.upazilas : [];
  }, [profile.district, allDistricts]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file);
      try {
        const preview = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, photoUrl: preview }));
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setProfile(prev => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
      onShowToast(lang === 'bn' ? 'ছবি নির্বাচন করা হয়েছে। সংরক্ষণের সময় সরাসরি ক্লাউডে আপলোড হবে।' : 'Photo selected. Will upload to Supabase cloud storage on save.');
    }
  };

  // Education Helpers
  const addEducationEntry = () => {
    const newEdu: EducationEntry = {
      id: 'edu_' + Date.now(),
      degree: 'স্নাতক (ডিগ্রি/অনার্স)',
      institution: '',
      fieldOfStudy: '',
      passingYear: '২০২৩',
      resultGrade: 'CGPA 3.50',
      scale: '4.00'
    };
    setProfile(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const removeEducationEntry = (id: string) => {
    setProfile(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  const updateEducationEntry = (id: string, field: keyof EducationEntry, value: any) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  // Experience Helpers
  const addExperienceEntry = () => {
    const newExp: ExperienceEntry = {
      id: 'exp_' + Date.now(),
      company: '',
      designation: '',
      employmentType: 'Full-time',
      location: profile.district,
      startDate: '২০২২',
      endDate: 'বর্তমান',
      isCurrent: true,
      responsibilities: ''
    };
    setProfile(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
  };

  const removeExperienceEntry = (id: string) => {
    setProfile(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
  };

  const updateExperienceEntry = (id: string, field: keyof ExperienceEntry, value: any) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  // Skills Helpers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = profile.skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (exists) {
      onShowToast(lang === 'bn' ? 'এই দক্ষতা ইতিমধ্যে যুক্ত আছে।' : 'Skill already exists.');
      return;
    }
    const newSkill: SkillItem = {
      id: 'sk_' + Date.now(),
      name: newSkillName.trim(),
      level: newSkillLevel
    };
    setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
    setNewSkillName('');
  };

  const removeSkill = (id: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  // Languages Helpers
  const addLanguageEntry = () => {
    const newLang: LanguageItem = {
      id: 'lang_' + Date.now(),
      name: '',
      proficiency: 'Conversational'
    };
    setProfile(prev => ({ ...prev, languages: [...prev.languages, newLang] }));
  };

  const removeLanguageEntry = (id: string) => {
    setProfile(prev => ({ ...prev, languages: prev.languages.filter(l => l.id !== id) }));
  };

  // Projects Helpers
  const addProjectEntry = () => {
    const newProj: PortfolioProject = {
      id: 'proj_' + Date.now(),
      title: '',
      description: '',
      link: ''
    };
    setProfile(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const removeProjectEntry = (id: string) => {
    setProfile(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const updateProjectEntry = (id: string, field: keyof PortfolioProject, value: any) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Save changes
  const handleSaveProfile = async () => {
    if (!profile.fullName.trim()) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে প্রার্থীর পুরো নাম লিখুন।' : 'Please enter full name.');
      setActiveTab('personal');
      return;
    }
    if (!profile.phone.trim() || profile.phone.trim().length < 11) {
      onShowToast(lang === 'bn' ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।' : 'Please enter valid phone number.');
      setActiveTab('personal');
      return;
    }

    setIsSaving(true);
    try {
      let finalPhotoUrl = profile.photoUrl;
      if (selectedPhotoFile) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          selectedPhotoFile,
          selectedPhotoFile.name,
          'jobseeker_profile_photos'
        );
      } else if (profile.photoUrl && isLocalTransientUrl(profile.photoUrl)) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          profile.photoUrl,
          'candidate_avatar.jpg',
          'jobseeker_profile_photos'
        );
      }

      const profileToSave = { ...profile, photoUrl: finalPhotoUrl };
      const res = await saveMasterProfile(profileToSave);
      if (res.success) {
        setProfile(res.data);
        setSelectedPhotoFile(null);
        onSave(res.data);
        onShowToast(lang === 'bn' ? 'মাস্টার প্রফেশনাল প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' : 'Master profile saved successfully!');
      } else {
        throw new Error(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (e: any) {
      onShowToast(e.message || 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const completeness = calculateJobSeekerCompleteness(profile);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0" id="master-profile-editor">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group">
              {profile.photoUrl ? (
                <img 
                  src={profile.photoUrl} 
                  alt={profile.fullName} 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm" 
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-700/80 text-white text-xl font-black flex items-center justify-center border-2 border-emerald-400/50 shadow-sm">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : <User className="w-7 h-7 text-emerald-200" />}
                </div>
              )}
              <label 
                htmlFor="profile-photo-input"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm cursor-pointer transition hover:scale-105"
                title="ছবি পরিবর্তন করুন"
              >
                <Camera className="w-3.5 h-3.5" />
                <input 
                  type="file" 
                  id="profile-photo-input" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight">
                  {profile.fullName || (lang === 'bn' ? 'প্রার্থীর নাম প্রদান করুন' : 'Candidate Name')}
                </h1>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  {profile.candidateCode || 'JM-CANDIDATE'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium">
                {profile.desiredJobTitle || (lang === 'bn' ? 'কাঙ্ক্ষিত পদবী নির্ধারণ করুন' : 'Set target job title')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCvUpload && (
              <button
                type="button"
                onClick={onOpenCvUpload}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'bn' ? 'এআই দিয়ে অটো-ফিল' : 'AI Auto-Fill'}</span>
              </button>
            )}

            {onOpenCvBuilder && (
              <button
                type="button"
                onClick={onOpenCvBuilder}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সিভি প্রিভিউ ও প্রিন্ট' : 'View & Print CV'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveProfile}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              id="btn-save-master-profile-top"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Profile')}</span>
            </button>
          </div>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 space-y-1.5 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-200">
              {lang === 'bn' ? 'প্রোফাইল সম্পূর্ণতা স্কোর' : 'Profile Completeness'}:
            </span>
            <span className="font-black text-amber-300">{completeness}%</span>
          </div>
          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <p className="text-[10px] text-emerald-100/75">
              {lang === 'bn' 
                ? '💡 পরামর্শ: ছবি, ক্যারিয়ার অবজেক্টিভ, শিক্ষা ও অন্তত ২টি কাজের অভিজ্ঞতা যুক্ত করলে প্রোফাইল ১০০% পূর্ণ হবে।' 
                : '💡 Add photo, career summary, education and 2+ experiences to reach 100%.'}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 px-2 sm:px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
        
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('career')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'career'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ক্যারিয়ার তথ্য' : 'Career Info'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'শিক্ষা ও অভিজ্ঞতা' : 'Education & Experience'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-black">
            {profile.education.length + profile.experience.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'skills'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'দক্ষতা ও ভাষা' : 'Skills & Languages'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-black">
            {profile.skills.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পোর্টফোলিও ও প্রজেক্ট' : 'Portfolio & Projects'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'প্রাইভেসি ও নিরাপত্তা' : 'Privacy Controls'}</span>
        </button>

      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-6 space-y-6 min-h-[420px]">
        
        {/* ==================== TAB 1: PERSONAL INFORMATION ==================== */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {lang === 'bn' ? 'ব্যক্তিগত বিবরণ ও যোগাযোগের তথ্য' : 'Personal Details & Contact'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'পুরো নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="যেমন: মোঃ সাকিব হোসেন"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট) *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ইমেইল এড্রেস *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@mail.com"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">মহিলা (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                </label>
                <select
                  value={profile.bloodGroup || 'A+'}
                  onChange={(e) => setProfile(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'জেলা *' : 'District *'}
                </label>
                <select
                  value={profile.district}
                  onChange={(e) => {
                    const newDist = e.target.value;
                    const found = allDistricts.find(d => d.nameBn === newDist);
                    setProfile(prev => ({
                      ...prev,
                      district: newDist,
                      division: found?.divisionBn || prev.division,
                      upazila: found?.upazilas[0]?.nameBn || prev.upazila
                    }));
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  {allDistricts.map(d => (
                    <option key={d.code} value={d.nameBn}>{d.nameBn} ({d.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'উপজেলা *' : 'Upazila *'}
                </label>
                <select
                  value={profile.upazila}
                  onChange={(e) => setProfile(prev => ({ ...prev, upazila: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  {upazilasForDistrict.map(u => (
                    <option key={u.code} value={u.nameBn}>{u.nameBn} ({u.nameEn})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মহল্লা / রাস্তা / বাড়ির ঠিকানা' : 'Address Line'}
                </label>
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="গ্রাম / রোড নং / বাড়ি নং"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'সংক্ষিপ্ত বায়ো (Bio)' : 'Short Bio'}
                </label>
                <textarea
                  rows={2}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="নিজের সম্পর্কে ১-২ বাক্যে সংক্ষেপে বলুন..."
                  className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: CAREER INFORMATION ==================== */}
        {activeTab === 'career' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {lang === 'bn' ? 'ক্যারিয়ার অগ্রাধিকার ও পেশাগত লক্ষ্য' : 'Career Preferences & Objective'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কাঙ্ক্ষিত পেশা / পদবী *' : 'Target Job Title *'}
                </label>
                <input
                  type="text"
                  value={profile.desiredJobTitle}
                  onChange={(e) => setProfile(prev => ({ ...prev, desiredJobTitle: e.target.value }))}
                  placeholder="যেমন: ফ্রন্টএন্ড ডেভেলপার, একাউন্টেন্ট, ড্রাইভার"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'চাকরির ক্যাটাগরি *' : 'Job Category *'}
                </label>
                <select
                  value={profile.category}
                  onChange={(e) => setProfile(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  {JOB_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.nameBn}>{cat.nameBn} ({cat.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কাজের ধরণ' : 'Preferred Job Type'}
                </label>
                <select
                  value={profile.preferredJobType}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferredJobType: e.target.value as any }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  <option value="Full-time">ফুল-টাইম (সার্বক্ষণিক)</option>
                  <option value="Remote">রিমোট (বাসা থেকে)</option>
                  <option value="Hybrid">হাইব্রিড (অফিস ও রিমোট)</option>
                  <option value="Part-time">খণ্ডকালীন (Part-time)</option>
                  <option value="Contract">চুক্তিভিত্তিক (Contractual)</option>
                  <option value="Internship">ইন্টার্নশিপ (শিক্ষানবিস)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোট কাজের অভিজ্ঞতা' : 'Total Work Experience'}
                </label>
                <select
                  value={profile.experienceYears}
                  onChange={(e) => setProfile(prev => ({ ...prev, experienceYears: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                >
                  <option value="নতুন (০ বছর)">নতুন / ফ্রেশার (০ বছর)</option>
                  <option value="১ বছরের কম">১ বছরের কম</option>
                  <option value="১-২ বছর">১-২ বছর</option>
                  <option value="৩-৫ বছর">৩-৫ বছর</option>
                  <option value="৫-৮ বছর">৫-৮ বছর</option>
                  <option value="৮+ বছর">৮+ বছর (সিনিয়র)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'প্রত্যাশিত বেতন (মাসিক)' : 'Expected Salary'}
                </label>
                <input
                  type="text"
                  value={profile.expectedSalaryText}
                  onChange={(e) => setProfile(prev => ({ ...prev, expectedSalaryText: e.target.value }))}
                  placeholder="যেমন: ২৫,০০০ - ৩৫,০০০ টাকা অথবা আলোচনা সাপেক্ষে"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কাজে যোগদানের নোটিশ পিরিয়ড' : 'Notice Period'}
                </label>
                <input
                  type="text"
                  value={profile.noticePeriod || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, noticePeriod: e.target.value }))}
                  placeholder="যেমন: অবিলম্বে / ১৫ দিন / ১ মাস"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ক্যারিয়ার অবজেক্টিভ / প্রফেশনাল সারাংশ *' : 'Career Objective *'}
                </label>
                <textarea
                  rows={3}
                  value={profile.careerObjective}
                  onChange={(e) => setProfile(prev => ({ ...prev, careerObjective: e.target.value }))}
                  placeholder="আপনার পেশাগত লক্ষ্য, শক্তি এবং আপনি কোম্পানিতে কীভাবে অবদান রাখতে চান তা ২-৩ বাক্যে লিখুন..."
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: EDUCATION & EXPERIENCE ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            
            {/* Education Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education History'}</span>
                </h3>
                <button
                  type="button"
                  onClick={addEducationEntry}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ডিগ্রি যোগ করুন' : 'Add Degree'}</span>
                </button>
              </div>

              {profile.education.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  এখনও কোনো শিক্ষা এন্ট্রি যোগ করা হয়নি। উপরের বাটনে ক্লিক করে যোগ করুন।
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.education.map((edu, idx) => (
                    <div key={edu.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">এন্ট্রি #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeEducationEntry(edu.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ডিগ্রির নাম</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducationEntry(edu.id, 'degree', e.target.value)}
                            placeholder="স্নাতক / ডিপ্লোমা / এইচএসসি"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">প্রতিষ্ঠান / বিশ্ববিদ্যালয়</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducationEntry(edu.id, 'institution', e.target.value)}
                            placeholder="শিক্ষা প্রতিষ্ঠানের নাম"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">পাসের সাল</label>
                          <input
                            type="text"
                            value={edu.passingYear}
                            onChange={(e) => updateEducationEntry(edu.id, 'passingYear', e.target.value)}
                            placeholder="২০২৩"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ফলাফল / CGPA</label>
                          <input
                            type="text"
                            value={edu.resultGrade || ''}
                            onChange={(e) => updateEducationEntry(edu.id, 'resultGrade', e.target.value)}
                            placeholder="3.50 বা ১ম বিভাগ"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Section */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'কাজের পূর্ব অভিজ্ঞতা' : 'Work Experience'}</span>
                </h3>
                <button
                  type="button"
                  onClick={addExperienceEntry}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'অভিজ্ঞতা যোগ করুন' : 'Add Experience'}</span>
                </button>
              </div>

              {profile.experience.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  এখনও কোনো কাজের অভিজ্ঞতা যোগ করা হয়নি (নতুন বা ফ্রেশারদের ক্ষেত্রে খালি থাকতে পারে)।
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">প্রতিষ্ঠান #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeExperienceEntry(exp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">কোম্পানি / সংস্থার নাম</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperienceEntry(exp.id, 'company', e.target.value)}
                            placeholder="কোম্পানি নাম"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">পদবী (Designation)</label>
                          <input
                            type="text"
                            value={exp.designation}
                            onChange={(e) => updateExperienceEntry(exp.id, 'designation', e.target.value)}
                            placeholder="পদবীর নাম"
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">সময়কাল (Start - End)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperienceEntry(exp.id, 'startDate', e.target.value)}
                              placeholder="শুরু (২০২১)"
                              className="w-1/2 text-xs font-semibold px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={exp.isCurrent ? 'বর্তমান' : (exp.endDate || '')}
                              disabled={exp.isCurrent}
                              onChange={(e) => updateExperienceEntry(exp.id, 'endDate', e.target.value)}
                              placeholder="শেষ (২০২৩)"
                              className="w-1/2 text-xs font-semibold px-2 py-1.5 bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
                            />
                          </div>
                          <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(exp.isCurrent)}
                              onChange={(e) => updateExperienceEntry(exp.id, 'isCurrent', e.target.checked)}
                              className="rounded text-emerald-600"
                            />
                            <span>বর্তমানে এখানে কর্মরত</span>
                          </label>
                        </div>

                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">দায়িত্ব ও অর্জন</label>
                          <textarea
                            rows={2}
                            value={exp.responsibilities || ''}
                            onChange={(e) => updateExperienceEntry(exp.id, 'responsibilities', e.target.value)}
                            placeholder="এখানে প্রধান দায়িত্বসমূহ ও কৃতিত্বের বিবরণ লিখুন..."
                            className="w-full text-xs font-medium p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: SKILLS & LANGUAGES ==================== */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            
            {/* Skills */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'পেশাগত দক্ষতা ও টুলস' : 'Professional Skills & Tools'}</span>
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="দক্ষতার নাম লিখুন (যেমন: JavaScript, MS Excel, Driving, Sales)..."
                  className="flex-1 min-w-[200px] text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />

                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as any)}
                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Beginner">সাধারণ (Beginner)</option>
                  <option value="Intermediate">মধ্যম (Intermediate)</option>
                  <option value="Expert">দক্ষ (Expert)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition"
                >
                  {lang === 'bn' ? 'যোগ করুন' : 'Add Skill'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl min-h-20">
                {profile.skills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">কোনো দক্ষতা এখনও যুক্ত করা হয়নি। উপরে টাইপ করে যোগ করুন।</p>
                ) : (
                  profile.skills.map(s => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-800"
                    >
                      <span className="text-emerald-700 font-extrabold">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({s.level})</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(s.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'ভাষাগত দক্ষতা' : 'Languages'}</span>
                </h3>
                <button
                  type="button"
                  onClick={addLanguageEntry}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ভাষা যোগ করুন' : 'Add Language'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.languages.map(langItem => (
                  <div key={langItem.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={langItem.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile(prev => ({
                          ...prev,
                          languages: prev.languages.map(l => l.id === langItem.id ? { ...l, name: val } : l)
                        }));
                      }}
                      placeholder="ভাষার নাম (বাংলা, ইংরেজি)"
                      className="w-1/2 text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg"
                    />

                    <select
                      value={langItem.proficiency}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setProfile(prev => ({
                          ...prev,
                          languages: prev.languages.map(l => l.id === langItem.id ? { ...l, proficiency: val } : l)
                        }));
                      }}
                      className="w-1/2 text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="Native">মাতৃভাষা (Native)</option>
                      <option value="Fluent">সাবলীল (Fluent)</option>
                      <option value="Conversational">কথোপকথনযোগ্য (Conversational)</option>
                      <option value="Basic">প্রাথমিক (Basic)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeLanguageEntry(langItem.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: PORTFOLIO & PROJECTS ==================== */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'প্রজেক্ট ও কাজের নমুনা' : 'Project Showcases & Links'}</span>
              </h3>
              <button
                type="button"
                onClick={addProjectEntry}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রজেক্ট যোগ করুন' : 'Add Project'}</span>
              </button>
            </div>

            {profile.projects.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                এখনও কোনো প্রজেক্ট যুক্ত করা হয়নি। আপনার পূর্ববর্তী কাজ বা লিঙ্ক যুক্ত করতে পারেন।
              </div>
            ) : (
              <div className="space-y-3">
                {profile.projects.map((proj, idx) => (
                  <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">প্রজেক্ট #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeProjectEntry(proj.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => updateProjectEntry(proj.id, 'title', e.target.value)}
                        placeholder="প্রজেক্টের শিরোনাম"
                        className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="url"
                        value={proj.link || ''}
                        onChange={(e) => updateProjectEntry(proj.id, 'link', e.target.value)}
                        placeholder="প্রজেক্টের লাইভ লিঙ্ক (ঐচ্ছিক)"
                        className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => updateProjectEntry(proj.id, 'description', e.target.value)}
                      placeholder="প্রজেক্টের সংক্ষিপ্ত বিবরণ ও ব্যবহৃত প্রযুক্তি..."
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 6: PRIVACY CONTROLS ==================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'প্রাইভেসি ও তথ্যের নিরাপত্তা নিয়ন্ত্রণ' : 'Granular Privacy Controls'}</span>
            </h3>

            <p className="text-xs text-slate-600">
              {lang === 'bn' 
                ? 'পাবলিক জব ডিরেক্টরিতে আপনার সংবেদনশীল ব্যক্তিগত তথ্য গোপন রাখার সুযোগ রয়েছে।' 
                : 'Safeguard your personal contacts on public candidate listings.'}
            </p>

            <div className="space-y-3 pt-2">
              
              {/* Hide Phone Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    {profile.privacySettings.hidePhone ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                    <span>{lang === 'bn' ? 'মোবাইল নম্বর গোপন রাখুন' : 'Hide Phone Number'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'পাবলিক প্রফেশনাল ডিরেক্টরিতে আপনার ফোন নম্বর প্রদর্শিত হবে না।' : 'Your phone number will not be displayed on public listings.'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.privacySettings.hidePhone}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      privacySettings: { ...prev.privacySettings, hidePhone: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {/* Hide Email Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    {profile.privacySettings.hideEmail ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                    <span>{lang === 'bn' ? 'ইমেইল এড্রেস গোপন রাখুন' : 'Hide Email Address'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'স্প্যাম ও অযাচিত যোগাযোগ এড়াতে ইমেইল লুকায়িত রাখা যাবে।' : 'Hide email to prevent spam.'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.privacySettings.hideEmail}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      privacySettings: { ...prev.privacySettings, hideEmail: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {/* Hide Address Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>{lang === 'bn' ? 'সুনির্দিষ্ট বাড়ির ঠিকানা গোপন রাখুন' : 'Hide Exact Street Address'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'শুধুমাত্র জেলা ও উপজেলা প্রদর্শিত হবে, বাড়ির রোড নং গোপন থাকবে।' : 'Only District and Upazila will be visible.'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.privacySettings.hideAddress}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      privacySettings: { ...prev.privacySettings, hideAddress: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'মাস্টার প্রোফাইল আপডেট করলে পরবর্তী সকল চাকুরিতে ১-ক্লিকে আবেদন করতে পারবেন।' : 'Master profile enables 1-click apply for all future listings.'}</span>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveProfile}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          id="btn-save-master-profile-bottom"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'মাস্টার প্রোফাইল সংরক্ষণ করুন' : 'Save Master Profile')}</span>
        </button>
      </div>

    </div>
  );
};
