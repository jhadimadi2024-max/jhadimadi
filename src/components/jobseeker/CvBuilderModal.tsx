import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Check, 
  FileText, 
  Sparkles, 
  Eye, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Award,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { MasterJobSeekerProfile } from '../../types/jobseeker';

interface CvBuilderModalProps {
  lang: 'bn' | 'en';
  profile: MasterJobSeekerProfile;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export type CvTemplateType = 'classic' | 'modern' | 'executive';

export const CvBuilderModal: React.FC<CvBuilderModalProps> = ({
  lang,
  profile,
  onClose,
  onShowToast,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateType>('modern');
  const [copiedLink, setCopiedLink] = useState(false);
  const cvPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/?view=jobseeker_cv&code=${profile.candidateCode || profile.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      onShowToast(lang === 'bn' ? 'সিভি প্রোফাইল লিংক কপি করা হয়েছে!' : 'CV profile link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      onShowToast(lang === 'bn' ? 'লিংক কপি করা সম্ভব হয়নি' : 'Could not copy link');
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4" id="cv-builder-modal">
      
      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cv-printable-area, #cv-printable-area * {
            visibility: visible;
          }
          #cv-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-300">
        
        {/* Top bar (Hidden when printing) */}
        <div className="no-print bg-white px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'ইন্সট্যান্ট সিভি বিল্ডার ও প্রিন্ট হাব' : 'Instant CV Builder & Export Engine'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn' ? 'মাস্টার প্রোফাইল থেকে স্বয়ংক্রিয় প্রফেশনাল রেজুমি' : 'Auto-generated resume from your master profile'}
              </p>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedTemplate('classic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedTemplate === 'classic' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'ক্লাসিক' : 'Classic'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('modern')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedTemplate === 'modern' 
                  ? 'bg-emerald-700 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'মডার্ন (জনপ্রিয়)' : 'Modern (Popular)'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTemplate('executive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedTemplate === 'executive' 
                  ? 'bg-slate-900 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'এক্সিকিউটিভ' : 'Executive'}
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="শেয়ারেবল লিংক কপি করুন"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{lang === 'bn' ? 'লিংক শেয়ার' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              id="btn-print-cv"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF সংরক্ষণ' : 'Print / Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 flex justify-center bg-slate-200/70">
          
          {/* Printable A4 CV Container */}
          <div 
            ref={cvPrintRef}
            id="cv-printable-area"
            className="w-full max-w-3xl bg-white shadow-xl min-h-[950px] p-6 sm:p-10 text-slate-900 text-xs rounded-xl"
            style={{ fontFamily: selectedTemplate === 'classic' ? 'serif' : 'sans-serif' }}
          >
            
            {/* ==================== TEMPLATE 1: MODERN (Emerald sidebar + sleek cards) ==================== */}
            {selectedTemplate === 'modern' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column (35%) */}
                <div className="md:col-span-4 bg-slate-50 -m-6 sm:-m-10 p-6 sm:p-8 border-r border-slate-200 space-y-5">
                  {/* Photo if available */}
                  {profile.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt={profile.fullName} 
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-emerald-700 text-white text-2xl font-black flex items-center justify-center mx-auto shadow-sm">
                      {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1">
                      যোগাযোগ / Contact
                    </h4>
                    
                    {!profile.privacySettings.hidePhone && profile.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    )}

                    {!profile.privacySettings.hideEmail && profile.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 break-all">
                        <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{profile.email}</span>
                      </div>
                    )}

                    {!profile.privacySettings.hideAddress && (
                      <div className="flex items-start gap-2 text-[11px] text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span>
                          {profile.address ? `${profile.address}, ` : ''}
                          {profile.upazila ? `${profile.upazila}, ` : ''}
                          {profile.district}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills badges */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1">
                        দক্ষতা / Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s, i) => (
                          <span key={i} className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {profile.languages && profile.languages.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1">
                        ভাষা / Languages
                      </h4>
                      <div className="space-y-1 text-[11px]">
                        {profile.languages.map((l, i) => (
                          <div key={i} className="flex justify-between text-slate-700">
                            <span className="font-semibold">{l.name}</span>
                            <span className="text-slate-500">{l.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate code stamp */}
                  <div className="pt-4 text-center">
                    <span className="text-[9px] font-mono text-slate-400">
                      ID: {profile.candidateCode || profile.id}
                    </span>
                  </div>
                </div>

                {/* Right Column (65%) */}
                <div className="md:col-span-8 space-y-5 pt-2">
                  {/* Name and title */}
                  <div className="border-b-2 border-emerald-700 pb-3">
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                      {profile.fullName || 'Candidate Name'}
                    </h1>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      {profile.desiredJobTitle || 'Professional Candidate'}
                    </p>
                  </div>

                  {/* Career Objective / Summary */}
                  {profile.careerObjective && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>ক্যারিয়ার অবজেক্টিভ / Professional Summary</span>
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-700">
                        {profile.careerObjective}
                      </p>
                    </div>
                  )}

                  {/* Work Experience */}
                  {profile.experience && profile.experience.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                        <span>কাজের অভিজ্ঞতা / Work Experience</span>
                      </h3>

                      <div className="space-y-3">
                        {profile.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-xs font-bold text-slate-900">{exp.designation}</h4>
                              <span className="text-[10px] text-slate-500 font-medium">{exp.startDate} - {exp.isCurrent ? 'বর্তমান' : exp.endDate || 'N/A'}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-800">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                            {exp.responsibilities && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">{exp.responsibilities}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {profile.education && profile.education.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        <span>শিক্ষাগত যোগ্যতা / Education</span>
                      </h3>

                      <div className="space-y-2.5">
                        {profile.education.map((edu, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                              <span className="text-[10px] text-slate-500">{edu.passingYear}</span>
                            </div>
                            <div className="text-[11px] text-slate-700">{edu.institution}</div>
                            {edu.resultGrade && (
                              <div className="text-[10px] text-slate-500">ফলাফল: {edu.resultGrade}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects / Showcase */}
                  {profile.projects && profile.projects.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span>প্রজেক্ট ও পোর্টফোলিও / Projects</span>
                      </h3>

                      <div className="space-y-2">
                        {profile.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="font-bold text-xs text-slate-900">{proj.title}</div>
                            <p className="text-[11px] text-slate-600">{proj.description}</p>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 hover:underline">
                                {proj.link}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TEMPLATE 2: CLASSIC (Serif, formal, chronological) ==================== */}
            {selectedTemplate === 'classic' && (
              <div className="space-y-5">
                {/* Center aligned header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-950">
                    {profile.fullName || 'Candidate Name'}
                  </h1>
                  <p className="text-xs italic text-slate-700 font-semibold">
                    {profile.desiredJobTitle || 'Professional Title'}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 pt-1">
                    {!profile.privacySettings.hidePhone && profile.phone && <span>মোবাইল: {profile.phone}</span>}
                    {!profile.privacySettings.hideEmail && profile.email && <span>ইমেইল: {profile.email}</span>}
                    {!profile.privacySettings.hideAddress && (
                      <span>ঠিকানা: {profile.upazila ? `${profile.upazila}, ` : ''}{profile.district}</span>
                    )}
                  </div>
                </div>

                {/* Objective */}
                {profile.careerObjective && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5">
                      Career Objective
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-800 italic">
                      {profile.careerObjective}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {profile.experience && profile.experience.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5">
                      Professional Experience
                    </h3>
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="space-y-0.5 pt-1">
                        <div className="flex justify-between font-bold text-xs">
                          <span>{exp.designation}, {exp.company}</span>
                          <span className="font-normal">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                        </div>
                        {exp.responsibilities && <p className="text-[11px] text-slate-700 pl-3">{exp.responsibilities}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {profile.education && profile.education.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5">
                      Educational Credentials
                    </h3>
                    {profile.education.map((edu, i) => (
                      <div key={i} className="flex justify-between text-xs pt-1">
                        <div>
                          <span className="font-bold">{edu.degree}</span> – <span>{edu.institution}</span>
                          {edu.resultGrade && <span className="text-[11px] text-slate-600 block">Grade/Result: {edu.resultGrade}</span>}
                        </div>
                        <span>{edu.passingYear}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5">
                      Key Competencies
                    </h3>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {profile.skills.map(s => s.name).join(' • ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TEMPLATE 3: EXECUTIVE (Navy, modern corporate) ==================== */}
            {selectedTemplate === 'executive' && (
              <div className="space-y-6">
                {/* Executive Top Banner */}
                <div className="bg-slate-900 text-white -m-6 sm:-m-10 p-6 sm:p-8 rounded-t-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">{profile.fullName || 'Candidate Name'}</h1>
                    <p className="text-xs font-semibold text-emerald-400 mt-0.5">{profile.desiredJobTitle || 'Executive Professional'}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-300 space-y-1">
                    {!profile.privacySettings.hidePhone && profile.phone && <div>📞 {profile.phone}</div>}
                    {!profile.privacySettings.hideEmail && profile.email && <div>✉️ {profile.email}</div>}
                    <div>📍 {profile.upazila ? `${profile.upazila}, ` : ''}{profile.district}</div>
                  </div>
                </div>

                {/* Executive Summary */}
                {profile.careerObjective && (
                  <div className="pt-4 space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                      Executive Summary
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {profile.careerObjective}
                    </p>
                  </div>
                )}

                {/* Career Trajectory / Experience */}
                {profile.experience && profile.experience.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                      Professional Leadership & Experience
                    </h3>
                    <div className="space-y-3">
                      {profile.experience.map((exp, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-baseline font-bold text-xs text-slate-900">
                            <span>{exp.designation}</span>
                            <span className="text-[11px] text-slate-500 font-normal">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-700">{exp.company}</div>
                          {exp.responsibilities && (
                            <p className="text-[11px] text-slate-600 leading-relaxed">{exp.responsibilities}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {profile.education && profile.education.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                      Academic Background
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profile.education.map((edu, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="font-bold text-xs text-slate-900">{edu.degree}</div>
                          <div className="text-[11px] text-slate-600">{edu.institution} ({edu.passingYear})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive Competencies */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                      Core Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-900 font-bold rounded text-[11px] border border-slate-200">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
