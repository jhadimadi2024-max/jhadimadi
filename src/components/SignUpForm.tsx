import React from 'react';
import { EmbeddedSignUpPage } from './EmbeddedSignUpPage';
import { UserProfile } from '../types';
import { Language } from '../utils/translations';

export interface SignUpFormProps {
  onBack?: () => void;
  onSignUpComplete?: (user: UserProfile) => void;
  onAuthSuccess?: (user: UserProfile, isNew?: boolean) => void;
  onSwitchToLogin?: () => void;
  onNavigateToSignIn?: () => void;
  lang?: Language;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onBack = () => {},
  onSignUpComplete,
  onAuthSuccess,
  onSwitchToLogin,
  onNavigateToSignIn,
  lang = 'bn'
}) => {
  return (
    <EmbeddedSignUpPage
      onBack={onBack}
      onSignUpSuccess={onSignUpComplete}
      onAuthSuccess={(user, isNew) => {
        if (onAuthSuccess) {
          onAuthSuccess(user, isNew);
        } else if (onSignUpComplete) {
          onSignUpComplete(user);
        }
      }}
      onSwitchToLogin={onSwitchToLogin}
      onNavigateToSignIn={onNavigateToSignIn}
      lang={lang}
    />
  );
};

export default SignUpForm;
