import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Users, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  FileCheck, 
  ArrowLeft, 
  Share2, 
  Edit3, 
  Sparkles,
  Facebook,
  Linkedin,
  Clock,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { EmployerProfile, EmployerJobVacancy, VerificationTier } from '../../types/employer';
import { EmployerService } from '../../services/employerService';

interface PublicCompanyProfileProps {
  companyId?: string;
  onBack?: () => void;
  onSelectJob?: (job: EmployerJobVacancy) => void;
  onEditProfile?: () => void;
  isOwner?: boolean;
  onShowToast: (msg: string) => void;
}

export const PublicCompanyProfile: React.FC<PublicCompanyProfileProps> = ({
  companyId = 'emp-jhadimadi-core',
  onBack,
  onSelectJob,
  onEditProfile,
  isOwner = true,
  onShowToast
}) => {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [activeJobs, setActiveJobs] = useState<EmployerJobVacancy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const data = await EmployerService.getPublicCompanyProfile(companyId);
        setProfile(data.profile);
        setActiveJobs(data.activeJobs);
      } catch (e) {
        onShowToast('কোম্পানি তথ্য লোড করা যায়নি।');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanyData();
  }, [companyId]);

  if (isLoading || !profile) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <Building2 className="w-8 h-8 text-emerald-600 animate-bounce mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-600">কোম্পানি প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  // Tier Badge helper
  const renderTierBadge = (tier: VerificationTier) => {
    switch (tier) {
      case 'Professionally_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400 text-amber-900 text-xs font-black shadow-2xs">
            <Award className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>প্রফেশনাল ভেরিফাইড এন্টারপ্রাইজ (টপ টায়ার)</span>
          </span>
        );
      case 'Business_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>বিজনেস ভেরিফাইড (ট্রেড লাইসেন্স অনুমোদিত)</span>
          </span>
        );
      case 'Phone_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>ফোন নম্বর ভেরিফাইড</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
            <span>প্রাথমিক একাউন্ট</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="public-company-profile-view">
      {/* Top Navigation */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-emerald-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ড্যাশবোর্ডে ফিরে যান</span>
        </button>
      )}

      {/* Main Branding Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 w-full relative bg-slate-800 overflow-hidden">
          {profile.coverBannerUrl ? (
            <img
              src={profile.coverBannerUrl}
              alt="Company Cover"
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-teal-900 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

          {isOwner && onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>প্রোফাইল সম্পাদনা</span>
            </button>
          )}
        </div>

        {/* Profile Details Bar */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2 border-4 border-white shadow-xl relative z-10 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={profile.logoUrl || '/runner-logo.png'}
                alt={profile.companyName}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Verification Badge */}
            <div className="pt-2 sm:pt-0">
              {renderTierBadge(profile.verificationTier)}
            </div>
          </div>

          {/* Titles & Meta */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {profile.companyNameBn || profile.companyName}
            </h1>
            {profile.companyNameBn && profile.companyName && (
              <p className="text-xs font-bold text-slate-500">
                {profile.companyName}
              </p>
            )}

            <p className="text-xs text-slate-700 font-medium max-w-3xl leading-relaxed pt-1">
              {profile.aboutCompany || 'প্রতিষ্ঠানের সংক্ষিপ্ত বিবরণ যোগ করা হয়নি।'}
            </p>
          </div>

          {/* Quick Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-normal">শিল্প / খাত</span>
                <span className="truncate">{profile.industry || 'বাণিজ্যিক প্রতিষ্ঠান'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-normal">লোকেশন</span>
                <span className="truncate">{profile.district}, {profile.upazila}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-normal">কর্মীবহর</span>
                <span className="truncate">{profile.employeeCount || '১০-৫০ জন'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-normal">প্রতিষ্ঠাকাল</span>
                <span className="truncate">{profile.establishedYear || '২০২৩'} সাল</span>
              </div>
            </div>
          </div>

          {/* Verification & Legal Proofs */}
          {profile.tradeLicenseNumber && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-bold">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>যাচাইকৃত ট্রেড লাইসেন্স নম্বর: {profile.tradeLicenseNumber}</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-md text-emerald-900">
                ভেরিফাইড ও নিশ্চিত
              </span>
            </div>
          )}

          {/* Social Links & Web */}
          <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-bold text-slate-600">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-700 transition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>অফিসিয়াল ওয়েবসাইট</span>
              </a>
            )}
            {profile.contactEmail && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.contactEmail}</span>
              </span>
            )}
            {profile.contactPhone && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.contactPhone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Published Active Job Openings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>এই প্রতিষ্ঠানের বর্তমান সক্রিয় চাকরি সমূহ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              মোট {activeJobs.length}টি শূন্যপদে সার্কুলার প্রকাশিত আছে
            </p>
          </div>
        </div>

        {activeJobs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-bold text-slate-500">বর্তমানে কোনো সক্রিয় চাকরির সার্কুলার নেই।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {job.category}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-xl">
                      {job.salaryDisplay}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {job.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{job.district}, {job.upazila}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{job.jobType} • {job.workplaceType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>পদসংখ্যা: {job.vacanciesCount} জন</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>শেষ তারিখ: {job.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    আবেদন করেছেন: {job.applicantCount} জন
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectJob) onSelectJob(job);
                      else onShowToast('বিস্তারিত দেখার ফিচার লোড হচ্ছে...');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>সার্কুলার দেখুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
