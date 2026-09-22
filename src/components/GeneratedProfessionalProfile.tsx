import React from 'react';
import { ServiceProviderPublicProfile, ProfileData } from './ServiceProviderPublicProfile';
import { ProductSellerProfile } from './ProductSellerProfile';
import { PermanentMemberProfile } from './PermanentMemberProfile';

export interface GeneratedProfessionalProfileProps {
  profile?: any;
  currentUser?: any;
  lang?: 'bn' | 'en';
  onEdit?: (profileData?: any) => void;
  onSignOut?: () => void;
  onDeleteSuccess?: () => void;
  onUpdateProfile?: (updated: any) => void;
  onBackToHome?: () => void;
  allDistricts?: any[];
  readOnly?: boolean;
}

/**
 * GeneratedProfessionalProfile
 * Dynamic role-based profile router for registered users:
 * - Product Seller -> ProductSellerProfile
 * - Permanent Member -> PermanentMemberProfile
 * - Service Provider -> ServiceProviderPublicProfile
 */
export const GeneratedProfessionalProfile: React.FC<GeneratedProfessionalProfileProps> = ({
  profile,
  currentUser,
  lang = 'bn',
  onEdit,
  onSignOut,
  onDeleteSuccess,
  onBackToHome,
}) => {
  const mergedData: ProfileData = {
    ...(currentUser || {}),
    ...(profile || {}),
  };

  const role = (mergedData.role || '').toLowerCase();
  const memberUID = String(mergedData.memberUID || mergedData.uniqueId || '');

  const isServiceProvider = 
    role === 'service_provider' || 
    role === 'professional' || 
    role === 'service' || 
    role === 'provider' || 
    memberUID.startsWith('JH-P-');

  const isSeller = !isServiceProvider && (
    role === 'product_seller' || 
    role === 'seller' || 
    role === 'vendor' || 
    role === 'merchant' || 
    memberUID.startsWith('JH-S-')
  );

  const isPermanent = !isServiceProvider && !isSeller && (
    role === 'permanent_member' || 
    role === 'permanent' || 
    memberUID.startsWith('JH-M-')
  );

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-white overflow-x-hidden overflow-y-auto box-border">
      {isServiceProvider ? (
        <ServiceProviderPublicProfile
          profileData={mergedData}
          currentUser={currentUser}
          lang={lang}
          onEditProfile={onEdit}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteSuccess}
          onBack={onBackToHome}
        />
      ) : isSeller ? (
        <ProductSellerProfile
          profileData={mergedData}
          currentUser={currentUser}
          lang={lang}
          isOwner={true}
          onBack={onBackToHome}
          onEditProfile={() => onEdit && onEdit(mergedData)}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteSuccess}
        />
      ) : isPermanent ? (
        <PermanentMemberProfile
          profileData={mergedData}
          currentUser={currentUser}
          lang={lang}
          isOwner={true}
          onBack={onBackToHome}
          onEditProfile={() => onEdit && onEdit(mergedData)}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteSuccess}
        />
      ) : (
        <ServiceProviderPublicProfile
          profileData={mergedData}
          currentUser={currentUser}
          lang={lang}
          onEditProfile={onEdit}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteSuccess}
          onBack={onBackToHome}
        />
      )}
    </div>
  );
};

export default GeneratedProfessionalProfile;
