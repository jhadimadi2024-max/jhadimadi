import React from 'react';
import { SellerProfile, SellerProfileProps } from '../pages/SellerProfile';
import { Language } from '../types';

export interface ProductSellerProfileProps {
  profileData: any;
  currentUser?: any;
  lang?: Language;
  isOwner?: boolean;
  onEditProfile?: (data?: any) => void;
  onNavigateDashboard?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onBack?: () => void;
  onAddNewProduct?: () => void;
  onAddToCart?: (product: any, quantity?: number) => void;
  onBuyNow?: (product: any, quantity?: number) => void;
  onOpenChat?: (sellerName: string) => void;
}

export const ProductSellerProfile: React.FC<ProductSellerProfileProps> = ({
  profileData,
  currentUser,
  lang = 'bn',
  isOwner: passedIsOwner,
  onEditProfile,
  onNavigateDashboard,
  onSignOut,
  onDeleteAccount,
  onBack,
  onAddNewProduct,
  onAddToCart,
  onBuyNow,
  onOpenChat,
}) => {
  // Determine if viewer is truly the owner
  const isOwner = React.useMemo(() => {
    if (typeof passedIsOwner === 'boolean') return passedIsOwner;
    if (!currentUser || !profileData) return false;
    const profileId = profileData.id || profileData.uniqueId || profileData.memberUID;
    const currentUserId = currentUser.id || currentUser.uniqueId || currentUser.memberUID;
    if (profileId && currentUserId && profileId === currentUserId) return true;
    if (currentUser.phone && profileData.phone && currentUser.phone === profileData.phone) return true;
    return false;
  }, [passedIsOwner, currentUser, profileData]);

  return (
    <SellerProfile
      profileData={profileData}
      currentUser={currentUser}
      isOwner={isOwner}
      lang={lang}
      onBack={onBack}
      onSignOut={onSignOut}
      onDeleteAccount={onDeleteAccount}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onOpenChat={onOpenChat}
    />
  );
};

export default ProductSellerProfile;
