import React from 'react';
import { SellerProfile } from '../pages/SellerProfile';
import { Language } from '../types';

export interface CleanMerchantPageProps {
  store?: any;
  currentUserRole?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  onBack?: () => void;
  onAddToCart?: (product: any, quantity?: number) => void;
  onViewProductDetail?: (product: any) => void;
  lang?: Language;
}

export const CleanMerchantPage: React.FC<CleanMerchantPageProps> = ({
  store,
  isOwner = true,
  onBack,
  onAddToCart,
  lang = 'bn'
}) => {
  return (
    <SellerProfile
      profileData={store}
      isOwner={isOwner}
      onBack={onBack}
      onAddToCart={onAddToCart}
      lang={lang}
    />
  );
};

export default CleanMerchantPage;
