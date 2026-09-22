import React, { useState } from 'react';
import { Globe, PlusCircle, Trash2, ExternalLink, Link2, FolderGit2, Image as ImageIcon } from 'lucide-react';
import { RegistrationFormData, PortfolioProjectItem } from '../../../types/registration';

interface StepPortfolioProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

export const StepPortfolio: React.FC<StepPortfolioProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [projectImg, setProjectImg] = useState('');
  const [projectErr, setProjectErr] = useState('');

  const handleAddProject = () => {
    if (!projectTitle.trim() || !projectDesc.trim()) {
      setProjectErr('প্রজেক্টের নাম ও সংক্ষিপ্ত বিবরণ প্রদান করুন।');
      return;
    }

    const newProj: PortfolioProjectItem = {
      id: 'proj_' + Date.now(),
      title: projectTitle.trim(),
      description: projectDesc.trim(),
      link: projectLink.trim() || undefined,
      imageUrl: projectImg.trim() || undefined,
    };

    updateFormData({
      projectsList: [...formData.projectsList, newProj],
    });

    setProjectTitle('');
    setProjectDesc('');
    setProjectLink('');
    setProjectImg('');
    setProjectErr('');
    setShowAddProject(false);
  };

  const handleRemoveProject = (id: string) => {
    updateFormData({
      projectsList: formData.projectsList.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <span>পোর্টফোলিও ও প্রজেক্ট (Portfolio & Showcase)</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            আপনার আগের সফল কাজ, ওয়েবসাইট লিংক এবং সম্পন্ন প্রজেক্টের নমুনা দিন (ঐচ্ছিক কিন্তু সুপারিশকৃত)।
          </p>
        </div>
        {!showAddProject && (
          <button
            type="button"
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>প্রজেক্ট যোগ করুন</span>
          </button>
        )}
      </div>

      {/* Social / Portfolio Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Personal Website */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-stone-400" />
            <span>ওয়েবসাইট (Website)</span>
          </label>
          <input
            type="url"
            value={formData.portfolioWebsite || ''}
            onChange={(e) => updateFormData({ portfolioWebsite: e.target.value })}
            placeholder="https://myportfolio.com"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* GitHub / Repo */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-stone-400" />
            <span>GitHub / Behance লিংক</span>
          </label>
          <input
            type="url"
            value={formData.githubUrl || ''}
            onChange={(e) => updateFormData({ githubUrl: e.target.value })}
            placeholder="https://github.com/..."
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-stone-400" />
            <span>LinkedIn প্রোফাইল</span>
          </label>
          <input
            type="url"
            value={formData.linkedinUrl || ''}
            onChange={(e) => updateFormData({ linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Projects Showcase Cards */}
      {formData.projectsList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formData.projectsList.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                {proj.imageUrl && (
                  <img
                    src={proj.imageUrl}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-28 object-cover rounded-xl mb-2.5 bg-stone-100"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-stone-900 text-sm">{proj.title}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(proj.id)}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-stone-600 mt-1 line-clamp-3">{proj.description}</p>
              </div>

              {proj.link && (
                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <span>লাইভ প্রজেক্ট দেখুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddProject && (
          <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <Globe className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-stone-700">কোনো প্রজেক্ট বা কাজের স্যাম্পল এখনও যোগ করেননি</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              প্রজেক্ট যুক্ত করলে ক্লায়েন্টরা আপনার কাজ দেখে সরাসরি হায়ার করতে পারবে।
            </p>
            <button
              type="button"
              onClick={() => setShowAddProject(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>প্রজেক্ট যোগ করুন</span>
            </button>
          </div>
        )
      )}

      {/* Add Project Form */}
      {showAddProject && (
        <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <span className="text-xs font-bold text-emerald-950">নতুন প্রজেক্ট বা কাজের নমুনা</span>
            <button
              type="button"
              onClick={() => {
                setShowAddProject(false);
                setProjectErr('');
              }}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              বাতিল করুন
            </button>
          </div>

          {projectErr && <p className="text-xs text-red-600">{projectErr}</p>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                প্রজেক্টের নাম (Project Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="উদা: পাহাড়ি ই-কমার্স ওয়েবসাইট বা বনরুপা শপ ওয়্যারিং"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                সংক্ষিপ্ত বিবরণ (Key Features / Description) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="এই কাজে আপনি কি কি দায়িত্ব পালন করেছেন বা কী প্রযুক্তি ব্যবহার করেছেন লিখুন..."
                className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  লাইভ প্রিভিউ লিঙ্ক (Website / Demo URL)
                </label>
                <input
                  type="url"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ছবি বা স্ক্রিনশট ইমেজ লিঙ্ক (Image URL)
                </label>
                <input
                  type="url"
                  value={projectImg}
                  onChange={(e) => setProjectImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddProject}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
            >
              প্রজেক্ট সেভ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
