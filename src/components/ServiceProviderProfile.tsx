import React from 'react';
import {
  ServiceProviderPublicProfile,
  ProfileData,
  ServiceProviderPublicProfileProps
} from './ServiceProviderPublicProfile';
import { Language } from '../types';

export type { ProfileData, ServiceProviderPublicProfileProps };

export interface ServiceProviderProfileProps extends ServiceProviderPublicProfileProps {
  currentUser?: any;
  isOwner?: boolean;
  onNavigateDashboard?: () => void;
  onEditProfile?: (profileData?: any) => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onBack?: () => void;
  lang?: Language | 'bn' | 'en' | string;
}

export const ServiceProviderProfile: React.FC<ServiceProviderProfileProps> = (props) => {
  return <ServiceProviderPublicProfile {...props} />;
};

export { ServiceProviderProfile as ServiceProviderPublicProfileComponent };
export default ServiceProviderProfile;
