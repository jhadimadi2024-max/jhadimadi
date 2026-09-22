import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';
import { Language } from '../utils/translations';
import { UserProfile } from '../types';

export type OnboardingRoleType = 'track_a_vendor' | 'track_b_freelancer';

interface EmbeddedTrackSelectionPageProps {
  currentUser?: UserProfile | null;
  userName?: string;
  onBack: () => void;
  onSelectTrack: (track: OnboardingRoleType, extraData?: { title?: string; category?: string }) => void;
  lang: Language;
}

export const EmbeddedTrackSelectionPage: React.FC<EmbeddedTrackSelectionPageProps> = ({
  currentUser,
  userName,
  onBack,
  onSelectTrack,
  lang = 'bn'
}) => {
  const [selectedTrack, setSelectedTrack] = useState<OnboardingRoleType>('track_a_vendor');
  const displayName = userName || currentUser?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectTrack(selectedTrack);
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans p-4 sm:p-6" id="account-type-selection-screen">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#0A6A32]" />
          <span>{lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}</span>
        </button>
      </div>

      {/* Centered, Compact Card Container */}
      <div className="w-full bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 text-left">
        {/* Header Section */}
        <div className="mb-6">
          {displayName && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0A6A32] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 mb-2.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>স্বাগতম, {displayName}!</span>
            </div>
          )}

          {/* Exact required header text with bold professional styling */}
          <h2 className="text-sm sm:text-base font-black text-gray-900 leading-snug tracking-tight">
            {lang === 'bn' 
              ? 'আপনি কি ঝাদিমাদি ডট কমে পণ্য বিক্রি করতে চান নাকি সেবা বিক্রি করতে চান? নিচের ড্রপডাউন বার থেকে সিলেক্ট করে সাবমিট করুন।'
              : 'Do you want to sell products or services on Jhadimadi.com? Select from the dropdown bar below and submit.'}
          </h2>
        </div>

        {/* Form with Dropdown and Submit Button */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selection Bar Section */}
          <div>
            <label
              htmlFor="track-type-select"
              className="block text-xs font-semibold text-gray-600 mb-2"
            >
              {lang === 'bn' ? 'রেজিস্ট্রেশনের ধরন নির্বাচন করুন' : 'Select Registration Type'}
            </label>
            <div className="relative">
              <select
                id="track-type-select"
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value as OnboardingRoleType)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A6A32] focus:border-[#0A6A32] transition cursor-pointer pr-10 shadow-2xs"
              >
                <option value="track_a_vendor">মার্চেন্ট অ্যাকাউন্ট (পণ্য বিক্রেতা)</option>
                <option value="track_b_freelancer">সেবা বিক্রি করুন (পেশাজীবী / সেবাদাতা)</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Solid Green Rounded Submit Button */}
          <button
            type="submit"
            id="btn-submit-track-type"
            className="w-full bg-[#0A6A32] hover:bg-[#085427] active:bg-[#06421e] text-white font-bold py-3.5 px-4 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <span>{lang === 'bn' ? 'সাবমিট করুন' : 'Submit'}</span>
            <span className="text-base font-bold leading-none">➔</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmbeddedTrackSelectionPage;
