import React from 'react';
import { ServiceProviderPublicProfile, ProfileData } from '../components/ServiceProviderPublicProfile';

export interface ServiceProviderPageProps {
  profileData?: ProfileData;
  currentUser?: any;
  lang?: 'bn' | 'en' | string;
  onEditProfile?: () => void;
  onNavigateDashboard?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onBack?: () => void;
}

/**
 * ServiceProviderPage
 * Standalone single-column paper resume view page.
 */
export const ServiceProviderPage: React.FC<ServiceProviderPageProps> = (props) => {
  return (
    <div className="w-full max-w-full min-h-screen bg-stone-100/50 py-2 sm:py-8 px-1.5 sm:px-4 overflow-x-hidden overflow-y-auto box-border">
      <ServiceProviderPublicProfile {...props} />
    </div>
  );
};

export default ServiceProviderPage;
