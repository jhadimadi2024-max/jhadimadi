import React, { useState } from 'react';
import { GraduationCap, PlusCircle, Trash2, BookOpen, School, Calendar, Award } from 'lucide-react';
import { RegistrationFormData, EducationItem } from '../../../types/registration';

interface StepEducationProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

const COMMON_DEGREES = [
  'মাধ্যমিক (SSC)',
  'উচ্চ মাধ্যমিক (HSC)',
  'ডিপ্লোমা (Diploma in Engineering)',
  'স্নাতক / বিএসসি (Bachelor / BSc)',
  'স্নাতকোত্তর (Masters / MSc)',
  'বিটিইবি কারিগরি সনদ (Technical Certificate)',
  'অন্যান্য (Other)',
];

export const StepEducation: React.FC<StepEducationProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [showAddForm, setShowAddForm] = useState(formData.educationList.length === 0);
  const [newDegree, setNewDegree] = useState(COMMON_DEGREES[0]);
  const [newInstitution, setNewInstitution] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPassingYear, setNewPassingYear] = useState('');
  const [newResultGpa, setNewResultGpa] = useState('');
  const [formErr, setFormErr] = useState('');

  const handleAddEducation = () => {
    if (!newDegree || !newInstitution.trim() || !newSubject.trim() || !newPassingYear.trim()) {
      setFormErr('অনুগ্রহ করে ডিগ্রি, শিক্ষা প্রতিষ্ঠান, বিষয় ও পাসের সন পূরণ করুন।');
      return;
    }

    const newItem: EducationItem = {
      id: 'edu_' + Date.now(),
      degree: newDegree,
      institution: newInstitution.trim(),
      subject: newSubject.trim(),
      passingYear: newPassingYear.trim(),
      resultGpa: newResultGpa.trim(),
    };

    updateFormData({
      educationList: [...formData.educationList, newItem],
    });

    // Reset form
    setNewInstitution('');
    setNewSubject('');
    setNewPassingYear('');
    setNewResultGpa('');
    setFormErr('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    updateFormData({
      educationList: formData.educationList.filter((e) => e.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>শিক্ষাগত যোগ্যতা (Education)</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            আপনার একাডেমিক বা কারিগরি শিক্ষার তথ্য যোগ করুন।
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন যোগ করুন</span>
          </button>
        )}
      </div>

      {/* List of Added Educations */}
      {formData.educationList.length > 0 ? (
        <div className="space-y-3">
          {formData.educationList.map((edu, idx) => (
            <div
              key={edu.id || idx}
              className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 shadow-2xs transition-all flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base">{edu.degree}</h4>
                  <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-stone-400" />
                    <span>{edu.institution}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-stone-400" />
                      <span>{edu.subject}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>পাসের সন: {edu.passingYear}</span>
                    </span>
                    {edu.resultGpa && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Award className="w-3 h-3" />
                        <span>GPA/গ্রেড: {edu.resultGpa}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(edu.id)}
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
            <GraduationCap className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">কোনো শিক্ষাগত যোগ্যতা এখনও যোগ করা হয়নি</p>
            <p className="text-xs text-stone-500 mt-1">কমপক্ষে একটি শিক্ষাগত তথ্য যোগ করুন</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>শিক্ষাগত যোগ্যতা যোগ করুন</span>
            </button>
          </div>
        )
      )}

      {errors.educationList && (
        <p className="text-xs text-red-600 mt-1">{errors.educationList}</p>
      )}

      {/* Dynamic Entry Builder Form */}
      {showAddForm && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 bg-emerald-50/40 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>নতুন শিক্ষাগত তথ্য যোগ করুন</span>
            </h4>
            {formData.educationList.length > 0 && (
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
            )}
          </div>

          {formErr && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {formErr}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Degree */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ডিগ্রি / স্তর <span className="text-red-500">*</span>
              </label>
              <select
                value={newDegree}
                onChange={(e) => setNewDegree(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              >
                {COMMON_DEGREES.map((deg) => (
                  <option key={deg} value={deg}>
                    {deg}
                  </option>
                ))}
              </select>
            </div>

            {/* Passing Year */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                পাসের সন (Passing Year) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPassingYear}
                onChange={(e) => setNewPassingYear(e.target.value.replace(/\D/g, ''))}
                placeholder="উদা: 2022"
                maxLength={4}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Institution */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                শিক্ষা প্রতিষ্ঠান / বোর্ড / বিশ্ববিদ্যালয় <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
                placeholder="উদা: ঢাকা বিশ্ববিদ্যালয় বা কারিগরি শিক্ষা বোর্ড"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Subject / Major */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                বিভাগ / বিষয় (Subject / Group) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="উদা: কম্পিউটার সায়েন্স / বিজ্ঞান / মানবিক"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Result / GPA */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ফলাফল / GPA / শ্রেণি (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={newResultGpa}
                onChange={(e) => setNewResultGpa(e.target.value)}
                placeholder="উদা: 4.80 / 1st Class"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleAddEducation}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>তালিকায় যোগ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
