import React from 'react';
import { ArrowLeft, Home, Search, Briefcase, User, Store } from 'lucide-react';
import { ServiceProviderRegistrationForm } from './ServiceProviderRegistrationForm';
import { Language } from '../types';

export interface ServiceProviderMobileLayoutProps {
  currentUser?: any;
  onSubmitSuccess?: (data: any) => void;
  onSuccess?: (data: any) => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateServices?: () => void;
  onNavigateSearch?: () => void;
  onNavigateProfile?: () => void;
  onNavigateRoleSelect?: () => void;
  lang?: Language | 'bn' | 'en' | string;
}

export const ServiceProviderMobileLayout: React.FC<ServiceProviderMobileLayoutProps> = ({
  currentUser,
  onSubmitSuccess,
  onSuccess,
  onBack,
  onNavigateHome,
  onNavigateServices,
  onNavigateSearch,
  onNavigateProfile,
  onNavigateRoleSelect,
  lang = 'bn',
}) => {
  const isBn = lang !== 'en';

  const handleSuccess = (data: any) => {
    if (onSubmitSuccess) {
      onSubmitSuccess(data);
    } else if (onSuccess) {
      onSuccess(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-start w-full relative">
      {/* Top Mobile Navigation Bar (Natural Scrolling) */}
      <header className="relative z-30 w-full max-w-xl bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack || onNavigateRoleSelect}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              {isBn ? 'সার্ভিস প্রোভাইডার রেজিস্ট্রেশন' : 'Service Provider Registration'}
            </h1>
            <p className="text-[11px] text-emerald-700 font-medium leading-none mt-0.5">
              {isBn ? '১,০০০+ প্রফেশনাল ক্যাটাগরি ও স্কিল' : '1,000+ Categories & Skills'}
            </p>
          </div>
        </div>

        {onNavigateRoleSelect && (
          <button
            type="button"
            onClick={onNavigateRoleSelect}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
          >
            {isBn ? 'রোল পরিবর্তন' : 'Change Role'}
          </button>
        )}
      </header>

      {/* Main Form Content Container */}
      <main className="w-full max-w-xl flex-1 px-3 sm:px-4 py-4 pb-20 overflow-y-auto">
        <ServiceProviderRegistrationForm
          currentUser={currentUser}
          onSubmitSuccess={handleSuccess}
          onSuccess={handleSuccess}
          onBack={onBack}
          lang={lang}
        />
      </main>

      {/* Bottom Compact Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2 px-4 flex items-center justify-around max-w-xl mx-auto shadow-lg">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-700 text-[10px] font-medium transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>{isBn ? 'হোম' : 'Home'}</span>
        </button>

        <button
          type="button"
          onClick={onNavigateServices || onNavigateHome}
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-700 text-[10px] font-medium transition cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>{isBn ? 'সার্ভিস' : 'Services'}</span>
        </button>

        <button
          type="button"
          onClick={onNavigateSearch || onNavigateHome}
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-700 text-[10px] font-medium transition cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>{isBn ? 'অনুসন্ধান' : 'Search'}</span>
        </button>

        <button
          type="button"
          onClick={onNavigateProfile || onNavigateHome}
          className="flex flex-col items-center gap-1 text-emerald-700 text-[10px] font-bold transition cursor-pointer"
        >
          <User className="w-4 h-4 text-emerald-700" />
          <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
        </button>
      </nav>
    </div>
  );
};

export default ServiceProviderMobileLayout;
