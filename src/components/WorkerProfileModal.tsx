import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ServiceProvider, Language, UserProfile } from '../types';
import { ServiceProviderPublicProfile } from './ServiceProviderPublicProfile';
import { StaticBloodDonorProfileDocument } from './StaticBloodDonorProfileDocument';
import { BloodDonorProfileView } from './BloodDonorProfileView';
import { ProductSellerProfile } from './ProductSellerProfile';
import { StandardProfessionalProfileCard } from './StandardProfessionalProfileCard';
import { ProductServiceReviewModal } from './ProductServiceReviewModal';

export interface WorkerProfileModalProps {
  isOpen: boolean;
  provider: ServiceProvider | UserProfile | null;
  onClose: () => void;
  onBookService?: (provider: ServiceProvider | any) => void;
  onOpenChat?: (providerName: string) => void;
  lang: Language;
  isAdminMode?: boolean;
  isOwnProfile?: boolean;
  currentUser?: UserProfile | null;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  isOpen,
  provider,
  onClose,
  onBookService,
  onOpenChat,
  lang,
  isAdminMode = false,
  isOwnProfile,
  currentUser = null,
}) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!isOpen || !provider) return null;

  // Check if profile is a blood donor record
  const isBloodDonor = Boolean(
    (provider as any).isBloodDonor ||
    (provider as any).role === 'blood_donor' ||
    ((provider as any).bloodGroup && !(provider as any).skills?.length && !(provider as any).hourlyRate) ||
    (provider as any).categoryBn === 'রক্তদান সেবা' ||
    (provider as any).categoryBn === 'রক্তদাতা'
  );

  if (isBloodDonor) {
    return (
      <div 
        id="blood-donor-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-md my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <BloodDonorProfileView
            donor={provider as any}
            isOwner={Boolean(
              isOwnProfile ||
              isAdminMode ||
              (currentUser && provider && (
                (currentUser.id && (currentUser.id === provider.id || currentUser.id === (provider as any).memberUID)) ||
                (currentUser.phone && (provider as any).phone && currentUser.phone === (provider as any).phone)
              ))
            )}
            lang={lang}
            onSignOut={onClose}
          />
        </div>
      </div>
    );
  }

  // Determine owner status: true if explicitly true, or if current user matches provider
  const isOwner = Boolean(
    isOwnProfile ||
    isAdminMode ||
    (currentUser && provider && (
      (currentUser.id && (currentUser.id === provider.id || currentUser.id === (provider as any).memberUID)) ||
      (currentUser.phone && (provider as any).phone && currentUser.phone === (provider as any).phone) ||
      (currentUser.email && (provider as any).email && currentUser.email === (provider as any).email)
    ))
  );

  // Check if profile is a product seller
  const isProductSeller = Boolean(
    (provider as any).role === 'product_seller' ||
    (provider as any).role === 'seller' ||
    (provider as any).isSeller ||
    (provider as any).categoryBn === 'পণ্য বিক্রেতা' ||
    (provider as any).profession === 'পণ্য বিক্রেতা'
  );

  if (isProductSeller) {
    return (
      <div 
        id="seller-profile-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto overflow-x-hidden animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-full sm:max-w-xl my-auto overflow-x-hidden box-border bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <ProductSellerProfile
            profileData={provider as any}
            currentUser={currentUser}
            isOwner={isOwner}
            lang={lang}
            onBack={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      id="worker-profile-modal-backdrop" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-full sm:max-w-2xl my-auto overflow-x-hidden box-border space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Section 4: Standard Professional User Profile UI (Owner vs Customer/Visitor) */}
        <StandardProfessionalProfileCard
          profile={{
            id: provider.id,
            fullName: provider.name || (provider as any).fullName,
            name: provider.name,
            profession: provider.profession,
            professionBn: (provider as any).professionBn || provider.profession,
            photoUrl: (provider as any).photoUrl || (provider as any).img || (provider as any).avatar,
            phone: (provider as any).phone || (provider as any).realPhone,
            district: (provider as any).district,
            districtBn: (provider as any).districtBn,
            upazila: (provider as any).upazila,
            rating: provider.rating,
            reviewCount: (provider as any).reviewsCount || (provider as any).reviewCount,
            hourlyRate: (provider as any).hourlyRate,
            isVerified: (provider as any).verified || (provider as any).isVerified,
            bio: (provider as any).bioBn || (provider as any).bio
          }}
          isOwner={isOwner}
          onEditProfile={() => {
            setShowFullDetails(true);
          }}
          onOpenSettings={() => {
            alert('প্রোফাইল সেটিংস প্যানেল উন্মুক্ত করা হচ্ছে...');
          }}
          onCall={(ph) => {
            window.location.href = `tel:${ph}`;
          }}
          onChat={() => {
            onClose();
            if (onOpenChat) onOpenChat(provider.name || 'পেশাদার');
          }}
          onConfirmBooking={() => {
            if (onBookService) onBookService(provider);
          }}
          onOpenReviewModal={() => {
            setIsReviewModalOpen(true);
          }}
          lang={lang}
        />

        {/* Option to toggle extensive portfolio and document views */}
        <div className="flex justify-between items-center px-1">
          <button
            type="button"
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="text-xs sm:text-sm font-bold text-white/90 hover:text-white underline cursor-pointer"
          >
            {showFullDetails ? 'সংক্ষিপ্ত ভিউতে ফিরে যান' : 'সার্টিফিকেট, অভিজ্ঞতা ও কাজের সম্পূর্ণ বিবরণ দেখুন →'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full cursor-pointer"
          >
            বন্ধ করুন ✕
          </button>
        </div>

        {/* Extensive Profile when expanded */}
        {showFullDetails && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
            <ServiceProviderPublicProfile
              provider={provider}
              currentUser={currentUser}
              isOwner={isOwner}
              onClose={onClose}
              onBookService={onBookService}
              onOpenChat={onOpenChat}
              lang={lang}
            />
          </div>
        )}

        {/* Section 5: Review Modal */}
        <ProductServiceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          targetName={provider.name || 'পেশাদার কারিগর'}
          targetType="provider"
          lang={lang}
        />
      </div>
    </div>
  );
};


