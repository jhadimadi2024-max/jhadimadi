import React, { useState } from 'react';
import { Droplet, MapPin, PhoneCall, Calendar, LogOut, CheckCircle2, Edit2, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

export interface BloodDonorProfileViewProps {
  donor: {
    id?: string;
    name?: string;
    fullName?: string;
    bloodGroup?: string;
    district?: string;
    upazila?: string;
    phone?: string;
    lastDonationDate?: string;
    lastDonation?: string;
    isAvailable?: boolean;
  };
  isOwner?: boolean;
  lang?: Language;
  onSignOut?: () => void;
  onUpdateLastDonation?: (newDate: string) => void;
}

export const BloodDonorProfileView: React.FC<BloodDonorProfileViewProps> = ({
  donor,
  isOwner = false,
  lang = 'bn',
  onSignOut,
  onUpdateLastDonation
}) => {
  const isBn = lang === 'bn';
  const displayName = donor.name || donor.fullName || (isBn ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Blood Donor');
  const bloodGroup = donor.bloodGroup || 'O+';
  const district = donor.district || (isBn ? 'খাগড়াছড়ি' : 'Khagrachhari');

  const [lastDonation, setLastDonation] = useState<string>(
    donor.lastDonationDate || donor.lastDonation || '২০২৪-১১-১৫'
  );
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(lastDonation);

  const handleCall = () => {
    const rawPhone = donor.phone ? donor.phone.replace(/[^0-9+]/g, '') : '01800000000';
    window.location.href = `tel:${rawPhone}`;
  };

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    setLastDonation(tempDate);
    setIsEditingDate(false);
    if (onUpdateLastDonation) {
      onUpdateLastDonation(tempDate);
    }
  };

  return (
    <div
      id="blood-donor-profile-card"
      className="w-full max-w-md mx-auto bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-4 text-stone-900"
    >
      {/* Top Identity Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0 shadow-2xs">
          <Droplet className="w-6 h-6 fill-rose-600" />
          <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
            {bloodGroup}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-black text-stone-900 truncate">
              {displayName}
            </h2>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
              {bloodGroup}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-stone-500 font-medium mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{donor.upazila ? `${donor.upazila}, ` : ''}{district}</span>
          </div>
        </div>
      </div>

      {/* VIEW CONDITIONAL RENDERING */}
      {isOwner ? (
        /* ================= OWNER VIEW ================= */
        /* Requirements: Owner view only has "Edit Last Donation Date" and "Sign Out" */
        <div className="space-y-4">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>{isBn ? 'সর্বশেষ রক্তদানের তারিখ:' : 'Last Donation Date:'}</span>
              </span>
              <span className="text-xs font-black font-mono text-stone-900">
                {lastDonation}
              </span>
            </div>

            {isEditingDate ? (
              <form onSubmit={handleSaveDate} className="pt-2 space-y-2 border-t border-stone-200">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(false)}
                    className="flex-1 py-1.5 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {isBn ? 'সংরক্ষণ' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                className="w-full py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{isBn ? 'রক্তদানের তারিখ পরিবর্তন করুন' : 'Edit Last Donation Date'}</span>
              </button>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-stone-200"
          >
            <LogOut className="w-4 h-4" />
            <span>{isBn ? 'সাইন আউট (Sign Out)' : 'Sign Out'}</span>
          </button>
        </div>
      ) : (
        /* ================= PUBLIC VIEW ================= */
        /* Requirements: Minimal public view showing Name, Blood Group, District, and a direct "Call Donor" button (Phone not exposed as raw text) */
        <div className="space-y-3">
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-center space-y-1">
            <p className="text-xs font-bold text-rose-950">
              {isBn ? 'জরুরি প্রয়োজনে রক্তদাতার সাথে সরাসরি যোগাযোগ করুন' : 'Direct emergency donor contact'}
            </p>
            <p className="text-[11px] text-stone-500 font-medium">
              {isBn ? 'নিরাপদ ডায়ালিং ব্যবস্থার মাধ্যমে কল করা হবে।' : 'Secured direct phone connectivity.'}
            </p>
          </div>

          {/* Direct "Call Donor" button */}
          <button
            type="button"
            onClick={handleCall}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isBn ? 'রক্তদাতাকে কল করুন' : 'Call Donor'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BloodDonorProfileView;
