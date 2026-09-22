import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Phone, 
  CheckCircle2, 
  Download, 
  X, 
  ExternalLink,
  Mail,
  Calendar,
  Lock,
  PhoneCall
} from 'lucide-react';
import { JobCandidate, UserProfile } from '../../types';
import { fetchJobCandidates } from '../../services/jobService';

interface JobCandidateDirectoryProps {
  lang: 'bn' | 'en';
  currentUser?: UserProfile | null;
  onNavigateToDropCv: () => void;
  onShowToast: (msg: string) => void;
  allDistricts?: any;
}

export const JobCandidateDirectory: React.FC<JobCandidateDirectoryProps> = ({
  lang,
  onNavigateToDropCv,
  onShowToast,
}) => {
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<JobCandidate | null>(null);
  const [contactCandidateModal, setContactCandidateModal] = useState<JobCandidate | null>(null);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJobCandidates();
      setCandidates(data || []);
    } catch (err) {
      console.error('Failed to load candidate pool:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  return (
    <div className="space-y-3 pt-2" id="job-candidate-directory">
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">
            {lang === 'bn' ? 'প্রার্থী তালিকা লোড হচ্ছে...' : 'Loading candidate directory...'}
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-100 text-center space-y-2 shadow-2xs my-2">
          <p className="text-sm sm:text-base font-bold text-slate-700">
            আপাতত কোনো প্রার্থীর লিস্ট নাই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-sm transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {cand.candidateCode || `ID: ${cand.id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                    {cand.category}
                  </span>
                </div>

                {/* Candidate Name & Desired Title */}
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    {cand.name}
                  </h4>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {cand.desiredJobTitle}
                  </p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{cand.district}{cand.upazila ? `, ${cand.upazila}` : ''}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.highestEducation || 'সাধারণ'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{cand.experienceYears ? `${cand.experienceYears} বছরের অভিজ্ঞতা` : 'নতুন প্রার্থী'}</span>
                  </div>

                  {cand.expectedSalary && (
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <span>প্রত্যাশিত: {cand.expectedSalary}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {cand.skills && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {cand.skills.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md"
                      >
                        #{skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: View Profile / CV & Contact */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForModal(cand)}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{cand.resumeUrl ? 'সিভি / জীবনবৃত্তান্ত দেখুন' : 'প্রোফাইল বিবরণ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContactCandidateModal(cand)}
                  className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3 h-3 text-amber-300" />
                  <span>যোগাযোগ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Details & Resume Modal */}
      {selectedCandidateForModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedCandidateForModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">{selectedCandidateForModal.name}</h3>
                <p className="text-[11px] text-emerald-300 font-medium">{selectedCandidateForModal.desiredJobTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">ট্র্যাকিং কোড</span>
                  <span className="font-bold">{selectedCandidateForModal.candidateCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">ক্যাটাগরি</span>
                  <span className="font-bold">{selectedCandidateForModal.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">জেলা ও উপজেলা</span>
                  <span className="font-bold">{selectedCandidateForModal.district}, {selectedCandidateForModal.upazila}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">অভিজ্ঞতা</span>
                  <span className="font-bold">{selectedCandidateForModal.experienceYears || '০'} বছর</span>
                </div>
              </div>

              {selectedCandidateForModal.bio && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">জীবনবৃত্তান্ত ও আত্মবিবরণী:</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                    {selectedCandidateForModal.bio}
                  </p>
                </div>
              )}

              {selectedCandidateForModal.resumeUrl && (
                <div className="pt-2">
                  <a
                    href={selectedCandidateForModal.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                    download
                  >
                    <Download className="w-4 h-4" />
                    <span>সংযুক্ত সিভি ডাউনলোড / সরাসরি দেখুন</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Contact Modal */}
      {contactCandidateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setContactCandidateModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{contactCandidateModal.name}</h3>
              <p className="text-xs text-emerald-700 font-bold">{contactCandidateModal.desiredJobTitle}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[11px] bg-emerald-50 border border-emerald-200 py-1 px-2 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>ব্যক্তিগত ফোন নম্বর ও তথ্য সুরক্ষিত</span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (contactCandidateModal.phone) {
                    const clean = contactCandidateModal.phone.replace(/[^\d+]/g, '');
                    window.location.href = `tel:${clean}`;
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>যোগাযোগ করুন</span>
              </button>
              {contactCandidateModal.email && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>ইমেইল অনুসন্ধান: </span>
                  <a 
                    href={`mailto:${contactCandidateModal.email}`}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    বার্তা পাঠান
                  </a>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setContactCandidateModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
