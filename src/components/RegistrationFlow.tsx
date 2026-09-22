import React, { useState } from 'react';
import { 
  Store, 
  Wrench, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft,
  ShoppingBag,
  Briefcase,
  Layers,
  MapPin,
  Check
} from 'lucide-react';
import { ServiceProviderRegistrationForm } from './ServiceProviderRegistrationForm';
import { GeneratedProfessionalProfile } from './GeneratedProfessionalProfile';
import { ServiceProviderProfile } from './ServiceProviderProfile';
import { RoleSelectionModal } from './RoleSelectionModal';
import { UserProfile, Language } from '../types';

interface RegistrationFlowProps {
  onSuccess?: (newProfessional: any) => void;
  onBack?: () => void;
  onSelectMerchant?: () => void;
  currentUser?: UserProfile | null;
  allDistricts?: Record<string, string[]>;
  lang?: Language;
}

export type RegistrationStep = 'role_selection' | 'service_provider_form' | 'generated_profile';
export type SelectedAccountRole = 'merchant' | 'service_provider';

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onSuccess,
  onBack,
  onSelectMerchant,
  currentUser,
  lang = 'bn'
}) => {
  // Step state: default to 'role_selection' immediately post-sign up/login
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('role_selection');
  // Selected option state: default to 'service_provider' or null
  const [selectedRole, setSelectedRole] = useState<SelectedAccountRole>('service_provider');
  // Stored saved profile once form is submitted
  const [generatedProfile, setGeneratedProfile] = useState<any>(null);

  const handleContinue = () => {
    if (selectedRole === 'merchant') {
      if (onSelectMerchant) {
        onSelectMerchant();
      }
    } else {
      setCurrentStep('service_provider_form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 3: Generated Professional Profile Page & Layout (Resume / Biodata Style)
  if (currentStep === 'generated_profile' && generatedProfile) {
    return (
      <div className="w-full">
        <ServiceProviderProfile
          profileData={generatedProfile}
          currentUser={currentUser}
          lang={lang}
          onNavigateDashboard={() => {
            if (onSelectMerchant) onSelectMerchant();
          }}
          onEditProfile={() => {
            setCurrentStep('service_provider_form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSignOut={() => {
            if (onBack) onBack();
          }}
          onDeleteAccount={() => {
            setGeneratedProfile(null);
            setCurrentStep('role_selection');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={onBack}
        />
      </div>
    );
  }

  // Step 2: Dedicated Service Provider Profile Creation Form
  if (currentStep === 'service_provider_form') {
    return (
      <div className="w-full max-w-md mx-auto py-2">
        <ServiceProviderRegistrationForm
          currentUser={generatedProfile || currentUser}
          onSuccess={(saved) => {
            setGeneratedProfile(saved);
            setCurrentStep('generated_profile');
            if (onSuccess) {
              onSuccess(saved);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            setCurrentStep('role_selection');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          lang={lang}
          isEditMode={false}
        />
      </div>
    );
  }

  // Step 1: Account Selection Screen Post-Sign Up (Clean single-card dropdown form)
  return (
    <div className="w-full max-w-md mx-auto py-6 px-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
        </button>
      )}

      <RoleSelectionModal
        userName={currentUser?.name}
        onSelect={(type) => {
          if (type === 'merchant') {
            if (onSelectMerchant) {
              onSelectMerchant();
            }
          } else {
            setCurrentStep('service_provider_form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
};

export default RegistrationFlow;

