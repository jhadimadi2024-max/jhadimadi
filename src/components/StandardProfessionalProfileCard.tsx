import React, { useState } from 'react';
import {
  MoreVertical,
  Phone,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Star,
  Settings,
  Edit3,
  MapPin,
  Share2,
  QrCode,
  Eye,
  CalendarCheck
} from 'lucide-react';
import { Language } from '../types';
import { VendorBookingAndContactSection } from './VendorBookingAndContactSection';

export interface StandardProfessionalProfileCardProps {
  profile: {
    id?: string;
    fullName?: string;
    name?: string;
    profession?: string;
    professionBn?: string;
    photoUrl?: string;
    avatar?: string;
    phone?: string;
    district?: string;
    districtBn?: string;
    upazila?: string;
    rating?: number;
    reviewCount?: number;
    hourlyRate?: string | number;
    isVerified?: boolean;
    bio?: string;
    skills?: string[];
  };
  isOwner: boolean;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
  onCall?: (phone: string) => void;
  onChat?: () => void;
  onConfirmBooking?: () => void;
  onOpenReviewModal?: () => void;
  lang?: Language;
}

export const StandardProfessionalProfileCard: React.FC<StandardProfessionalProfileCardProps> = ({
  profile,
  isOwner,
  onEditProfile,
  onOpenSettings,
  onCall,
  onChat,
  onConfirmBooking,
  onOpenReviewModal,
  lang = 'bn'
}) => {
  const [is3DotMenuOpen, setIs3DotMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const displayName = profile.fullName || profile.name || 'পাহাড়ি কারিগর';
  const displayProfession = profile.professionBn || profile.profession || 'অভিজ্ঞ পেশাদার সেবা প্রদানকারী';
  const displayPhoto = profile.photoUrl || profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
  const ratingValue = profile.rating || 4.9;
  const reviewCount = profile.reviewCount || 18;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setIs3DotMenuOpen(false);
  };

  return (
    <div
      id={`profile-card-${isOwner ? 'owner' : 'visitor'}`}
      className="w-full bg-[#fbf9f4] border-2 border-[#2d6a4f]/30 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
    >
      {/* ================= TOP CARD SECTION: PHOTO LEFT, NAME/PROFESSION RIGHT ================= */}
      <div className="p-5 sm:p-7 border-b-2 border-[#2d6a4f]/20 bg-gradient-to-b from-[#f4f0e6] to-[#fbf9f4]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          
          {/* Left Side: Clear Round Professional Photo */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 border-[#1b4332] overflow-hidden shadow-md bg-stone-100 flex items-center justify-center">
              <img
                src={displayPhoto}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            {/* Verified Badge */}
            <div
              className="absolute bottom-0 right-0 bg-[#1b4332] text-white p-1.5 rounded-full border-2 border-[#fbf9f4] shadow-xs"
              title="ভেরিফাইড প্রফেশনাল"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* Right Side: Bold Full Name and Profession */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1b4332] tracking-tight leading-tight">
                  {displayName}
                </h2>
                <p className="text-base sm:text-lg font-bold text-[#2d6a4f] mt-0.5">
                  {displayProfession}
                </p>
              </div>

              {/* Owner Indicator Pill or Visitor Quick Badge */}
              <div className="inline-flex items-center gap-1.5 bg-[#e7efe9] border border-[#2d6a4f]/30 px-3 py-1 rounded-full self-center sm:self-start">
                <span className="w-2 h-2 rounded-full bg-[#1b4332] animate-pulse"></span>
                <span className="text-xs font-bold text-[#1b4332]">
                  {isOwner ? 'আপনার নিজের প্রোফাইল' : 'সক্রিয় পেশাদার'}
                </span>
              </div>
            </div>

            {/* Location & Rating row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-sm font-semibold text-[#1c2e24]">
              {(profile.upazila || profile.district) && (
                <div className="flex items-center gap-1 text-[#2d6a4f]">
                  <MapPin className="w-4 h-4 text-[#1b4332]" />
                  <span>
                    {profile.upazila ? `${profile.upazila}, ` : ''}
                    {profile.districtBn || profile.district || 'খাগড়াছড়ি'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="font-extrabold text-[#1b4332]">{ratingValue.toFixed(1)}</span>
                <span className="text-xs text-stone-500 font-medium">({reviewCount} রিভিউ)</span>
              </div>

              {profile.hourlyRate && (
                <div className="text-xs sm:text-sm font-bold text-[#1b4332] bg-[#f4f0e6] px-2.5 py-0.5 rounded-lg border border-[#2d6a4f]/20">
                  মজুরি: ৳{profile.hourlyRate} / ঘণ্টা
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed pt-1 max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION: DISTINCT VIEWS FOR OWNER VS VISITOR ================= */}
      {isOwner ? (
        /* ================= OWNER'S PROFILE VIEW (With 3-dot Navigation) ================= */
        <div className="p-4 sm:p-6 bg-[#f4f0e6]/60 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={onEditProfile}
              className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-sm sm:text-base shadow-sm transition cursor-pointer flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>প্রোফাইল এডিট</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#e7efe9] text-[#1b4332] border-2 border-[#2d6a4f]/30 font-bold text-sm sm:text-base transition cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <Settings className="w-4 h-4 text-[#2d6a4f]" />
              <span>সেটিংস</span>
            </button>
          </div>

          {/* 3-Dot Management Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIs3DotMenuOpen(!is3DotMenuOpen)}
              className="p-2.5 rounded-xl bg-white hover:bg-[#e7efe9] text-[#1b4332] border-2 border-[#2d6a4f]/30 transition cursor-pointer shadow-2xs"
              title="ম্যানেজমেন্ট মেনু"
              aria-label="ম্যানেজমেন্ট মেনু"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 3-Dot Dropdown Menu */}
            {is3DotMenuOpen && (
              <div
                className="absolute right-0 bottom-12 sm:bottom-auto sm:top-12 w-56 bg-white border-2 border-[#2d6a4f]/30 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150 text-sm font-bold text-[#1b4332]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#f4f7f4] flex items-center gap-2.5 transition"
                >
                  <Share2 className="w-4 h-4 text-[#2d6a4f]" />
                  <span>{copiedLink ? '✓ লিঙ্ক কপি হয়েছে' : 'প্রোফাইল লিঙ্ক শেয়ার'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIs3DotMenuOpen(false);
                    alert('আপনার কিউআর কোড প্রস্তুত হচ্ছে...');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#f4f7f4] flex items-center gap-2.5 transition"
                >
                  <QrCode className="w-4 h-4 text-[#2d6a4f]" />
                  <span>ডিজিটাল কিউআর কার্ড</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIs3DotMenuOpen(false);
                    if (onEditProfile) onEditProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#f4f7f4] flex items-center gap-2.5 transition border-t border-stone-100"
                >
                  <Eye className="w-4 h-4 text-[#2d6a4f]" />
                  <span>পাবলিক ভিউ প্রিভিউ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= CUSTOMER / VISITOR'S PROFILE VIEW (No 3-dot Navigation) ================= */
        <div className="p-4 sm:p-6 bg-[#f4f0e6]/60 space-y-4">
          {/* Complete Professional Vendor Profile, Booking & Payment, and Communication Layout */}
          <VendorBookingAndContactSection
            vendor={{
              id: profile.id || 'JH-PRO',
              code: profile.id || 'JH-PRO',
              name: displayName,
              fullName: displayName,
              profession: displayProfession,
              professionBn: displayProfession,
              category: profile.profession || 'সার্ভিস প্রোভাইডার',
              categoryBn: displayProfession,
              phone: profile.phone,
              realPhone: profile.phone,
              whatsapp: profile.phone,
              district: profile.districtBn || profile.district,
              upazila: profile.upazila,
              hourlyRate: profile.hourlyRate,
              isVerified: profile.isVerified !== false
            }}
            lang={lang}
            defaultServiceName={displayProfession}
            onOpenJMessage={() => {
              if (onChat) onChat();
            }}
            onBookingConfirmed={() => {
              if (onConfirmBooking) onConfirmBooking();
            }}
          />

          {/* Professional Rating & Review Section */}
          <div className="p-3.5 bg-white border-2 border-[#2d6a4f]/20 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#1b4332]">
                এই প্রফেশনালের সাথে কাজের অভিজ্ঞতা আছে?
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenReviewModal}
              className="px-4 py-1.5 rounded-lg bg-[#f4f0e6] hover:bg-[#e7efe9] text-[#1b4332] border border-[#2d6a4f]/40 text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
            >
              রিভিউ দিন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
