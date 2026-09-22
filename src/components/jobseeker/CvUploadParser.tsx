import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  X, 
  FileUp, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Award,
  ChevronRight,
  Eye
} from 'lucide-react';
import { CvExtractionResult, MasterJobSeekerProfile } from '../../types/jobseeker';
import { parseCvWithAi, saveMasterProfile } from '../../services/jobSeekerService';

interface CvUploadParserProps {
  lang: 'bn' | 'en';
  currentProfile?: MasterJobSeekerProfile | null;
  onImportComplete: (updatedProfile: MasterJobSeekerProfile) => void;
  onClose?: () => void;
  onShowToast: (msg: string) => void;
}

export const CvUploadParser: React.FC<CvUploadParserProps> = ({
  lang,
  currentProfile,
  onImportComplete,
  onClose,
  onShowToast,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<CvExtractionResult | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [activeReviewTab, setActiveReviewTab] = useState<'overview' | 'skills' | 'history'>('overview');
  const [pasteMode, setPasteMode] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');

  // Editable fields in review card
  const [reviewName, setReviewName] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewJobTitle, setReviewJobTitle] = useState('');
  const [reviewObjective, setReviewObjective] = useState('');
  const [reviewExpYears, setReviewExpYears] = useState('');
  const [reviewDistrict, setReviewDistrict] = useState('');
  const [reviewSkills, setReviewSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    // Check file extension
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      onShowToast(lang === 'bn' ? 'শুধুমাত্র PDF, DOC, বা DOCX ফরম্যাট সমর্থিত।' : 'Only PDF, DOC, or DOCX formats supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onShowToast(lang === 'bn' ? 'ফাইলের আকার ১০ মেগাবাইটের কম হতে হবে।' : 'File size must be under 10MB.');
      return;
    }

    setSelectedFile(file);
    startAiParsing(file);
  };

  const startAiParsing = async (file: File) => {
    setIsParsing(true);
    try {
      const result = await parseCvWithAi(file);
      if (result.success && result.data) {
        const data = result.data;
        setParsedData(data);
        if (result.fileUrl) setUploadedFileUrl(result.fileUrl);

        // Pre-fill editable review fields
        setReviewName(data.fullName || currentProfile?.fullName || '');
        setReviewPhone(data.phone || currentProfile?.phone || '');
        setReviewEmail(data.email || currentProfile?.email || '');
        setReviewJobTitle(data.desiredJobTitle || currentProfile?.desiredJobTitle || '');
        setReviewObjective(data.careerObjective || currentProfile?.careerObjective || '');
        setReviewExpYears(data.experienceYears || currentProfile?.experienceYears || '১-২ বছর');
        setReviewDistrict(data.district || currentProfile?.district || 'খাগড়াছড়ি');
        setReviewSkills(data.skills || (currentProfile?.skills ? currentProfile.skills.map(s => s.name) : []));

        onShowToast(lang === 'bn' ? 'সিভি সফলভাবে বিশ্লেষণ করা হয়েছে! তথ্যগুলো রিভিউ করুন।' : 'CV parsed successfully! Please review extracted info.');
      } else {
        throw new Error(result.error || 'বিশ্লেষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      console.warn('AI Parsing error:', err);
      onShowToast(lang === 'bn' ? 'এআই পার্সিং সম্পন্ন করা যায়নি। আপনি তথ্য ম্যানুয়ালি পূরণ করতে পারেন।' : 'AI parsing failed. You can enter details manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePastedTextSubmit = async () => {
    if (!rawPastedText.trim() || rawPastedText.trim().length < 50) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে আরও বিস্তারিত তথ্য পেস্ট করুন (কমপক্ষে ৫০ অক্ষর)।' : 'Please paste more detailed CV text.');
      return;
    }

    setIsParsing(true);
    try {
      const resp = await fetch('/api/jobseeker/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawPastedText })
      });
      const json = await resp.json();
      if (json.success && json.extracted) {
        const data: CvExtractionResult = json.extracted;
        setParsedData(data);
        setReviewName(data.fullName || currentProfile?.fullName || '');
        setReviewPhone(data.phone || currentProfile?.phone || '');
        setReviewEmail(data.email || currentProfile?.email || '');
        setReviewJobTitle(data.desiredJobTitle || currentProfile?.desiredJobTitle || '');
        setReviewObjective(data.careerObjective || currentProfile?.careerObjective || '');
        setReviewExpYears(data.experienceYears || currentProfile?.experienceYears || '১-২ বছর');
        setReviewDistrict(data.district || currentProfile?.district || 'খাগড়াছড়ি');
        setReviewSkills(data.skills || []);

        onShowToast(lang === 'bn' ? 'টেক্সট থেকে তথ্য নেওয়া হয়েছে! তথ্যগুলো রিভিউ করুন।' : 'Information extracted from text! Please review.');
      } else {
        throw new Error(json.message || 'ব্যর্থ হয়েছে');
      }
    } catch (e) {
      onShowToast(lang === 'bn' ? 'টেক্সট বিশ্লেষণ করা সম্ভব হয়নি।' : 'Could not parse text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!reviewSkills.includes(newSkillInput.trim())) {
      setReviewSkills([...reviewSkills, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setReviewSkills(reviewSkills.filter(s => s !== skillToRemove));
  };

  // Commit to Master Profile
  const handleCommitToMasterProfile = async () => {
    const existing = currentProfile || {
      id: '',
      candidateCode: '',
      fullName: '',
      phone: '',
      email: '',
      gender: 'Male' as const,
      division: 'চট্টগ্রাম',
      district: 'খাগড়াছড়ি',
      upazila: 'খাগড়াছড়ি সদর',
      category: 'আইটি ও সফটওয়্যার',
      preferredJobType: 'Full-time' as const,
      expectedSalaryText: '',
      experienceYears: '১-২ বছর',
      education: [],
      experience: [],
      skills: [],
      languages: [],
      projects: [],
      certifications: [],
      privacySettings: { hidePhone: false, hideEmail: false, hideAddress: false, isPublicProfile: true },
      completenessScore: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      desiredJobTitle: '',
      careerObjective: '',
    };

    // Format skills
    const mappedSkills = reviewSkills.map(s => ({
      id: 'sk_' + Math.random().toString(36).substring(2, 7),
      name: s,
      level: 'Intermediate' as const
    }));

    // Format education from extracted if available
    const mappedEdu = parsedData?.education?.map((ed, idx) => ({
      id: 'edu_' + idx + '_' + Date.now(),
      degree: ed.degree || 'স্নাতক',
      institution: ed.institution || 'শিক্ষা প্রতিষ্ঠান',
      fieldOfStudy: ed.fieldOfStudy || '',
      passingYear: ed.passingYear || '২০২২',
      resultGrade: ed.resultGrade || ''
    })) || existing.education;

    // Format experience from extracted if available
    const mappedExp = parsedData?.experience?.map((ex, idx) => ({
      id: 'exp_' + idx + '_' + Date.now(),
      company: ex.company || 'কোম্পানি নাম',
      designation: ex.designation || 'পদবী',
      startDate: ex.startDate || '২০২১',
      endDate: ex.endDate || 'বর্তমান',
      responsibilities: ex.responsibilities || ''
    })) || existing.experience;

    const updatedProfile: MasterJobSeekerProfile = {
      ...existing,
      fullName: reviewName.trim() || existing.fullName,
      phone: reviewPhone.trim() || existing.phone,
      email: reviewEmail.trim() || existing.email,
      desiredJobTitle: reviewJobTitle.trim() || existing.desiredJobTitle,
      careerObjective: reviewObjective.trim() || existing.careerObjective,
      experienceYears: reviewExpYears.trim() || existing.experienceYears,
      district: reviewDistrict.trim() || existing.district,
      skills: mappedSkills.length > 0 ? mappedSkills : existing.skills,
      education: mappedEdu.length > 0 ? mappedEdu : existing.education,
      experience: mappedExp.length > 0 ? mappedExp : existing.experience,
      resumeUrl: uploadedFileUrl || existing.resumeUrl,
      resumeFileName: selectedFile?.name || existing.resumeFileName,
      resumeFileType: selectedFile?.type || existing.resumeFileType,
      resumeUploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await saveMasterProfile(updatedProfile);
    if (res.success) {
      onShowToast(lang === 'bn' ? 'মাস্টার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : 'Master profile updated successfully!');
      onImportComplete(res.data);
    } else {
      onShowToast(lang === 'bn' ? 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে।' : 'Error saving profile.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5" id="cv-upload-parser-module">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'সিভি আপলোড ও এআই রিভিউ' : 'Direct Upload & AI Review'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn' 
                ? 'আপনার বিদ্যমান সিভি আপলোড করুন, এআই স্বয়ংক্রিয়ভাবে তথ্য সাজিয়ে দেবে' 
                : 'Upload your existing CV; AI extracts information for your master profile'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode switch: Document Upload vs Direct Text Paste */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setPasteMode(false)}
          className={`px-3 py-1.5 rounded-lg transition ${
            !pasteMode ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileUp className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'ফাইল আপলোড (PDF, DOC, DOCX)' : 'File Upload (PDF, DOC, DOCX)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPasteMode(true)}
          className={`px-3 py-1.5 rounded-lg transition ${
            pasteMode ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'টেক্সট পেস্ট করুন' : 'Paste CV Text'}
          </span>
        </button>
      </div>

      {/* 1. Drag & Drop Upload Zone (when !pasteMode) */}
      {!pasteMode && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive 
              ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]' 
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
            id="cv-file-input"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile 
                  ? selectedFile.name 
                  : (lang === 'bn' ? 'সিভি ফাইল এখানে ড্র্যাগ করুন অথবা ক্লিক করে সিলেক্ট করুন' : 'Drag & drop CV here or click to browse')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'সমর্থিত ফরম্যাট: PDF, DOC, DOCX (সর্বোচ্চ ১০MB)' : 'Supported: PDF, DOC, DOCX (Max 10MB)'}
              </p>
            </div>

            {selectedFile && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Direct Text Paste Area (when pasteMode) */}
      {pasteMode && (
        <div className="space-y-2">
          <textarea
            rows={5}
            value={rawPastedText}
            onChange={(e) => setRawPastedText(e.target.value)}
            placeholder={lang === 'bn' ? 'আপনার সিভি বা রেজুমির মূল তথ্যগুলো এখানে কপি-পেস্ট করুন...' : 'Paste your resume content here...'}
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isParsing || !rawPastedText.trim()}
              onClick={handlePastedTextSubmit}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{lang === 'bn' ? 'এআই দিয়ে বিশ্লেষণ করুন' : 'Analyze with AI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Parsing Loading State */}
      {isParsing && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <div>
            <p className="text-sm font-black text-emerald-950">
              {lang === 'bn' ? 'এআই আপনার সিভি বিশ্লেষণ করছে...' : 'AI is extracting structured data from your CV...'}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {lang === 'bn' ? 'শিক্ষা, অভিজ্ঞতা ও দক্ষতার তথ্য স্বয়ংক্রিয়ভাবে আলাদা করা হচ্ছে' : 'Extracting skills, career objective, education & contacts...'}
            </p>
          </div>
        </div>
      )}

      {/* 3. "AI Extracted Information — Please Review" Card Block */}
      {parsedData && !isParsing && (
        <div className="bg-slate-50 border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm" id="ai-extracted-review-card">
          
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {lang === 'bn' ? '✨ এআই কর্তৃক বিশ্লেষিত তথ্য — দয়া করে যাচাই করুন' : '✨ AI Extracted Information — Please Review'}
              </h3>
            </div>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {lang === 'bn' ? `নির্ভুলতার স্কোর: ${parsedData.confidenceScore || 90}%` : `Confidence: ${parsedData.confidenceScore || 90}%`}
            </span>
          </div>

          {/* Sub-tabs for review */}
          <div className="flex items-center gap-2 text-xs font-bold border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveReviewTab('overview')}
              className={`pb-1 px-1 border-b-2 transition ${
                activeReviewTab === 'overview' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500'
              }`}
            >
              {lang === 'bn' ? 'মূল তথ্য ও লক্ষ্য' : 'Overview & Objective'}
            </button>
            <button
              type="button"
              onClick={() => setActiveReviewTab('skills')}
              className={`pb-1 px-1 border-b-2 transition ${
                activeReviewTab === 'skills' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500'
              }`}
            >
              {lang === 'bn' ? `দক্ষতা (${reviewSkills.length})` : `Skills (${reviewSkills.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveReviewTab('history')}
              className={`pb-1 px-1 border-b-2 transition ${
                activeReviewTab === 'history' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500'
              }`}
            >
              {lang === 'bn' ? 'শিক্ষা ও কাজের অভিজ্ঞতা' : 'Education & Experience'}
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeReviewTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                </label>
                <div className="relative flex items-center">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={reviewPhone}
                    onChange={(e) => setReviewPhone(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="email"
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কাঙ্ক্ষিত পদবী / পেশা' : 'Target Job Title'}
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={reviewJobTitle}
                    onChange={(e) => setReviewJobTitle(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ক্যারিয়ার অবজেক্টিভ / প্রফেশনাল সারাংশ' : 'Career Objective'}
                </label>
                <textarea
                  rows={2}
                  value={reviewObjective}
                  onChange={(e) => setReviewObjective(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোট কাজের অভিজ্ঞতা' : 'Experience Years'}
                </label>
                <input
                  type="text"
                  value={reviewExpYears}
                  onChange={(e) => setReviewExpYears(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'জেলা' : 'District'}
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={reviewDistrict}
                    onChange={(e) => setReviewDistrict(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Skills */}
          {activeReviewTab === 'skills' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder={lang === 'bn' ? 'নতুন দক্ষতা লিখুন ও এন্টার চাপুন...' : 'Add a skill and press Enter...'}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
                >
                  {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-16 p-3 bg-white border border-slate-200 rounded-xl">
                {reviewSkills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">কোনো দক্ষতা চিহ্নিত হয়নি। উপরে লিখে যোগ করুন।</p>
                ) : (
                  reviewSkills.map((sk, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Education & Experience */}
          {activeReviewTab === 'history' && (
            <div className="space-y-4 pt-1">
              {/* Education block */}
              <div>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'শনাক্তকৃত শিক্ষাগত যোগ্যতা' : 'Extracted Education'}</span>
                </h4>
                {parsedData.education && parsedData.education.length > 0 ? (
                  <div className="space-y-2">
                    {parsedData.education.map((ed, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">{ed.degree}</div>
                        <div className="text-slate-600">{ed.institution} ({ed.passingYear || 'চলমান'})</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-200">
                    সিভিতে কোনো ডিগ্রি স্পষ্ট মেলেনি। মাস্টার প্রোফাইল এডিটরে সরাসরি যোগ করতে পারবেন।
                  </p>
                )}
              </div>

              {/* Experience block */}
              <div>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'শনাক্তকৃত পূর্ব অভিজ্ঞতা' : 'Extracted Work History'}</span>
                </h4>
                {parsedData.experience && parsedData.experience.length > 0 ? (
                  <div className="space-y-2">
                    {parsedData.experience.map((ex, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">{ex.designation} - {ex.company}</div>
                        <div className="text-slate-500 text-[11px]">{ex.startDate} হতে {ex.endDate || 'বর্তমান'}</div>
                        {ex.responsibilities && <div className="text-slate-600 text-[11px] mt-1">{ex.responsibilities}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-200">
                    অভিজ্ঞতা ফ্রেশার হিসেবে ধরা হয়েছে অথবা প্রোফাইল এডিটরে যুক্ত করুন।
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action commit button */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 font-medium">
              {lang === 'bn' ? 'যাচাই শেষে নিচের বাটনে ক্লিক করে মাস্টার প্রোফাইলে সংরক্ষণ করুন।' : 'Click below to save this verified data to your Master Profile.'}
            </p>

            <button
              type="button"
              onClick={handleCommitToMasterProfile}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
              id="btn-save-to-master-profile"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'bn' ? 'মাস্টার প্রোফাইলে সংরক্ষণ করুন' : 'Save to Master Profile'}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
