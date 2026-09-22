import React, { useState } from 'react';
import { Award, PlusCircle, Trash2, Check, Star, Sparkles, Tag, ExternalLink } from 'lucide-react';
import { 
  RegistrationFormData, 
  SkillItem, 
  CertificationItem, 
  SkillProficiency 
} from '../../../types/registration';

interface StepSkillsCertProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

const PROFICIENCY_LEVELS: SkillProficiency[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  freelancer: [
    'React.js', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'UI/UX Design', 
    'Figma', 'Graphic Design', 'SEO', 'Content Writing', 'WordPress', 'Video Editing'
  ],
  service_provider: [
    'ইলেকট্রিক্যাল ওয়্যারিং', 'এসি মেরামত ও সার্ভিসিং', 'প্লাম্বিং ও পাইপফিটিং', 
    'ফ্রিজ মেরামত', 'রং মিস্ত্রি', 'সিসিটিভি ক্যামেরা সেটআপ', 'টাইলস ও মার্বেল ফিটিং'
  ],
  professional: [
    'হিসাব ও বুককিপিং', 'আইনি পরামর্শ', 'ডিজিটাল মার্কেটিং', 'ব্যবসায় পরামর্শ', 
    'ডাটা অ্যানালিটিক্স', 'ট্যাক্স কনসালটেন্সি', 'প্রজেক্ট ম্যানেজমেন্ট'
  ],
  member: [
    'কমিউনিটি মোবিলাইজেশন', 'রক্তদান সমন্বয়', 'সামাজিক যোগাযোগ', 'ইভেন্ট ভলান্টিয়ার'
  ],
};

export const StepSkillsCert: React.FC<StepSkillsCertProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState<SkillProficiency>('Intermediate');

  // Certification add state
  const [showAddCert, setShowAddCert] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [certErr, setCertErr] = useState('');

  const suggestions = SUGGESTED_SKILLS[formData.accountType] || SUGGESTED_SKILLS.freelancer;

  const handleAddSkill = (name: string, level: SkillProficiency = selectedProficiency) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (formData.skillsList.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return; // already exists
    }

    const newSkill: SkillItem = {
      id: 'sk_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      level,
    };

    updateFormData({
      skillsList: [...formData.skillsList, newSkill],
    });
    setSkillInput('');
  };

  const handleRemoveSkill = (id: string) => {
    updateFormData({
      skillsList: formData.skillsList.filter((s) => s.id !== id),
    });
  };

  const handleChangeSkillLevel = (id: string, newLevel: SkillProficiency) => {
    updateFormData({
      skillsList: formData.skillsList.map((s) => (s.id === id ? { ...s, level: newLevel } : s)),
    });
  };

  const handleAddCert = () => {
    if (!certTitle.trim() || !certIssuer.trim() || !certYear.trim()) {
      setCertErr('সার্টিফিকেটের নাম, প্রদানকারী ও অর্জনের সন উল্লেখ করুন।');
      return;
    }

    const newCert: CertificationItem = {
      id: 'cert_' + Date.now(),
      title: certTitle.trim(),
      issuer: certIssuer.trim(),
      year: certYear.trim(),
      certificateUrl: certUrl.trim() || undefined,
    };

    updateFormData({
      certificationsList: [...formData.certificationsList, newCert],
    });

    setCertTitle('');
    setCertIssuer('');
    setCertYear('');
    setCertUrl('');
    setCertErr('');
    setShowAddCert(false);
  };

  const handleRemoveCert = (id: string) => {
    updateFormData({
      certificationsList: formData.certificationsList.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>দক্ষতা ও সনদপত্র (Skills & Certification)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          আপনার প্রধান কারিগরি বা পেশাগত দক্ষতা এবং অর্জিত সার্টিফিকেশন যোগ করুন।
        </p>
      </div>

      {/* SECTION 1: SKILLS SELECTOR */}
      <div className="space-y-4">
        <label className="block text-xs sm:text-sm font-semibold text-stone-800">
          দক্ষতা যোগ করুন (Add Skills with Proficiency) <span className="text-red-500">*</span>
        </label>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
              placeholder="দক্ষতার নাম লিখুন (উদা: React.js, ইলেকট্রিক্যাল ওয়্যারিং)"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedProficiency}
              onChange={(e) => setSelectedProficiency(e.target.value as SkillProficiency)}
              className="px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-white focus:outline-none focus:border-emerald-500"
            >
              {PROFICIENCY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddSkill(skillInput)}
              className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shrink-0"
            >
              যোগ করুন
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-xs text-stone-500 font-medium">জনপ্রিয় দক্ষতা সাজেশন:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestions.map((sug) => {
              const alreadyAdded = formData.skillsList.some(
                (s) => s.name.toLowerCase() === sug.toLowerCase()
              );
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => handleAddSkill(sug)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    alreadyAdded
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 opacity-60 cursor-not-allowed'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-400 hover:bg-white'
                  }`}
                >
                  <span>{sug}</span>
                  {alreadyAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="text-stone-400">+</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Added Skills List with Proficiency Chips */}
        {formData.skillsList.length > 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 space-y-2">
            <span className="text-xs font-semibold text-stone-700">যুক্ত করা দক্ষতাসমূহ:</span>
            <div className="flex flex-wrap gap-2">
              {formData.skillsList.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs text-xs"
                >
                  <span className="font-bold text-stone-800">{skill.name}</span>
                  <select
                    value={skill.level}
                    onChange={(e) => handleChangeSkillLevel(skill.id, e.target.value as SkillProficiency)}
                    className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] focus:outline-none"
                  >
                    {PROFICIENCY_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-stone-400 hover:text-red-600 ml-1"
                    title="মুছে ফেলুন"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {errors.skillsList && (
          <p className="text-xs text-red-600 mt-1">{errors.skillsList}</p>
        )}
      </div>

      {/* SECTION 2: CERTIFICATIONS */}
      <div className="pt-4 border-t border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>সার্টিফিকেশন ও প্রশিক্ষণ সনদ (Certifications - Optional)</span>
            </h4>
            <p className="text-xs text-stone-500">আইটি, টেকনিক্যাল বা পেশাগত কোর্স সার্টিফিকেট</p>
          </div>
          {!showAddCert && (
            <button
              type="button"
              onClick={() => setShowAddCert(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>সার্টিফিকেট যোগ করুন</span>
            </button>
          )}
        </div>

        {/* Existing Certifications List */}
        {formData.certificationsList.length > 0 && (
          <div className="space-y-2">
            {formData.certificationsList.map((cert) => (
              <div
                key={cert.id}
                className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-stone-900">{cert.title}</p>
                  <p className="text-stone-500 mt-0.5">
                    {cert.issuer} &bull; অর্জনের সন: {cert.year}
                  </p>
                  {cert.certificateUrl && (
                    <a
                      href={cert.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1 mt-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>সার্টিফিকেট যাচাই লিংক</span>
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCert(cert.id)}
                  className="text-stone-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Cert Form */}
        {showAddCert && (
          <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <span className="text-xs font-bold text-amber-950">নতুন সনদপত্র যোগ করুন</span>
              <button
                type="button"
                onClick={() => {
                  setShowAddCert(false);
                  setCertErr('');
                }}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                বাতিল করুন
              </button>
            </div>

            {certErr && <p className="text-xs text-red-600">{certErr}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সার্টিফিকেটের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="উদা: Certified Web Developer"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  প্রদানকারী প্রতিষ্ঠান <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  placeholder="উদা: BITM / Google / BTEB"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অর্জনের সন <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value.replace(/\D/g, ''))}
                  placeholder="2023"
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অনলাইন ভেরিফিকেশন লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  value={certUrl}
                  onChange={(e) => setCertUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddCert}
                className="px-3.5 py-1.5 bg-amber-700 text-white rounded-xl text-xs font-bold hover:bg-amber-800 transition-colors"
              >
                তালিকায় যুক্ত করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
