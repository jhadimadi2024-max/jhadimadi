import React, { useState } from 'react';
import { Briefcase, PlusCircle, Trash2, Building, Calendar, CheckSquare, Square, FileText } from 'lucide-react';
import { RegistrationFormData, ExperienceItem } from '../../../types/registration';

interface StepExperienceProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

export const StepExperience: React.FC<StepExperienceProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [responsibilities, setResponsibilities] = useState('');
  const [formErr, setFormErr] = useState('');

  const handleAddExperience = () => {
    if (!company.trim() || !designation.trim() || !startDate.trim()) {
      setFormErr('কোম্পানির নাম, পদবী এবং শুরুর তারিখ পূরণ করুন।');
      return;
    }

    const newItem: ExperienceItem = {
      id: 'exp_' + Date.now(),
      company: company.trim(),
      designation: designation.trim(),
      startDate: startDate.trim(),
      endDate: isCurrent ? 'বর্তমান' : endDate.trim(),
      isCurrent,
      responsibilities: responsibilities.trim(),
    };

    updateFormData({
      experienceList: [...formData.experienceList, newItem],
    });

    // Reset form
    setCompany('');
    setDesignation('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setResponsibilities('');
    setFormErr('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    updateFormData({
      experienceList: formData.experienceList.filter((e) => e.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <span>কাজের অভিজ্ঞতা (Work Experience)</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            পূর্বের বা বর্তমান চাকরির অভিজ্ঞতা যোগ করুন (ফ্রেশারদের জন্য ঐচ্ছিক)।
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>অভিজ্ঞতা যোগ করুন</span>
          </button>
        )}
      </div>

      {/* List of Added Experiences */}
      {formData.experienceList.length > 0 ? (
        <div className="space-y-3">
          {formData.experienceList.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 shadow-2xs transition-all flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 text-sm sm:text-base">{exp.designation}</h4>
                    {exp.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        বর্তমান কর্মরত
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-stone-400" />
                    <span>{exp.company}</span>
                  </p>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>
                      {exp.startDate} - {exp.isCurrent ? 'বর্তমান (Present)' : exp.endDate || 'N/A'}
                    </span>
                  </p>
                  {exp.responsibilities && (
                    <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2 rounded-xl border border-stone-100">
                      {exp.responsibilities}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(exp.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">কোনো কাজের অভিজ্ঞতা এখনও যোগ করা হয়নি</p>
            <p className="text-xs text-stone-500 mt-1">
              আপনি ফ্রেশার হলে পরবর্তী ধাপে যেতে পারেন অথবা অভিজ্ঞতা থাকলে যুক্ত করুন।
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>অভিজ্ঞতা যোগ করুন</span>
            </button>
          </div>
        )
      )}

      {/* Dynamic Add Form */}
      {showAddForm && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 bg-emerald-50/40 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>নতুন কাজের অভিজ্ঞতা যোগ করুন</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormErr('');
              }}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              বাতিল করুন
            </button>
          </div>

          {formErr && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {formErr}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                পদবী (Designation) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="উদা: ফুলস্ট্যাক ডেভেলপার / প্রধান ইলেকট্রিশিয়ান"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                কোম্পানি / প্রতিষ্ঠানের নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="উদা: কোড ক্রাফটার্স লিমিটেড বা সেলফ-এমপ্লয়েড"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                শুরুর তারিখ / সন <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="উদা: জানুয়ারি ২০২০ বা 2020"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                শেষের তারিখ / সন
              </label>
              <input
                type="text"
                value={endDate}
                disabled={isCurrent}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder={isCurrent ? 'বর্তমানে কর্মরত' : 'উদা: মার্চ ২০২৪'}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 disabled:bg-stone-100 disabled:text-stone-400"
              />
            </div>
          </div>

          {/* Currently Working Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setIsCurrent(!isCurrent)}
              className="flex items-center gap-2 text-xs font-semibold text-stone-800 hover:text-emerald-700 select-none"
            >
              {isCurrent ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>আমি বর্তমানে এই প্রতিষ্ঠানে কর্মরত আছি (Currently Employed Here)</span>
            </button>
          </div>

          {/* Key Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              প্রধান দায়িত্ব ও ভূমিকা (Key Responsibilities - Optional)
            </label>
            <textarea
              rows={2}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="আপনার কাজের প্রধান অর্জন বা দায়িত্ব সংক্ষেপে লিখুন..."
              className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleAddExperience}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>অভিজ্ঞতা তালিকায় যোগ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
