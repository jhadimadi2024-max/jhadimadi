import React, { useEffect, useState, useRef } from 'react';
import { Home, Search, Sparkles, UserPlus, User } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';

export interface BottomNavProps {
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  lang?: Language | 'bn' | 'en';
  isLoggedIn?: boolean;
  currentUser?: UserProfile | null | any;
  isBottomNavVisible?: boolean;
  isAdminPreview?: boolean;
  isJhadimadiChatOpen?: boolean;
  onHomeClick?: () => void;
  onJobsClick?: () => void;
  onOpenAiChat?: () => void;
  onRegistrationClick?: () => void;
  onProfileClick?: () => void;
  onAuthClick?: () => void;
  onSearchClick?: () => void;
  id?: string;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ 
  activeTab = 'home', 
  setActiveTab,
  lang = 'bn',
  isLoggedIn,
  currentUser: propUser,
  isBottomNavVisible: propIsVisible,
  isAdminPreview = false,
  isJhadimadiChatOpen = false,
  onHomeClick,
  onJobsClick,
  onOpenAiChat,
  onRegistrationClick,
  onProfileClick,
  onAuthClick,
  onSearchClick,
  id = 'site-bottom-navigation'
}) => {
  // Safe AuthContext fallback
  let authContextUser: any = null;
  try {
    const auth = useAuth();
    authContextUser = auth.currentUser;
  } catch (e) {
    // Rendered outside AuthProvider
  }

  const activeUser = propUser !== undefined ? propUser : authContextUser;
  const isEn = lang === 'en';

  // Self-managed scroll hide/show if not explicitly controlled by parent
  const [internalVisible, setInternalVisible] = useState(true);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    if (propIsVisible !== undefined) {
      return; // Controlled by parent
    }

    let ticking = false;
    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let currentScrollTop = 0;
          if (e?.target && e.target !== document && (e.target as HTMLElement).scrollTop !== undefined) {
            currentScrollTop = (e.target as HTMLElement).scrollTop;
          } else {
            currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
          }

          if (currentScrollTop <= 20) {
            setInternalVisible(true);
            lastScrollTopRef.current = currentScrollTop;
            ticking = false;
            return;
          }

          const diff = currentScrollTop - lastScrollTopRef.current;
          if (diff > 8 && currentScrollTop > 45) {
            setInternalVisible(false);
          } else if (diff < -3) {
            setInternalVisible(true);
          }
          lastScrollTopRef.current = currentScrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [propIsVisible]);

  const isVisible = propIsVisible !== undefined ? propIsVisible : internalVisible;

  // Navigation Click Handlers
  const handleHome = () => {
    try { analyticsService.logNavClick('home', 'হোম'); } catch (_) {}
    if (onHomeClick) {
      onHomeClick();
    } else if (setActiveTab) {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    try { analyticsService.logNavClick('manual_search', 'খোঁজ'); } catch (_) {}
    if (onSearchClick) {
      onSearchClick();
    } else if (setActiveTab) {
      setActiveTab('search');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJobs = () => {
    try { analyticsService.logNavClick('manual_search', 'খোঁজ'); } catch (_) {}
    if (onJobsClick) {
      onJobsClick();
    } else if (setActiveTab) {
      setActiveTab('jobs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAi = () => {
    try { analyticsService.logNavClick('ai_search', 'ঝাদিমাদি এআই'); } catch (_) {}
    if (onOpenAiChat) {
      onOpenAiChat();
    }
  };

  const handleRegister = () => {
    try { analyticsService.logNavClick('registration', 'যুক্ত হোন'); } catch (_) {}
    if (onRegistrationClick) {
      onRegistrationClick();
    } else if (onAuthClick) {
      onAuthClick();
    } else if (setActiveTab) {
      setActiveTab('registration');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProfile = () => {
    try { analyticsService.logNavClick('profile', 'প্রোফাইল'); } catch (_) {}
    if (onProfileClick) {
      onProfileClick();
    } else if (onAuthClick && !activeUser) {
      onAuthClick();
    } else if (setActiveTab) {
      setActiveTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Active state determinations
  const isHomeActive = activeTab === 'home';
  const isSearchActive = activeTab === 'search' || activeTab === 'manual_search' || activeTab === 'khoj';
  const isJobsActive = activeTab === 'jobs' || activeTab === 'services' || activeTab === 'service';
  const isAiActive = isJhadimadiChatOpen || activeTab === 'ai_chat' || activeTab === 'message' || activeTab === 'chat';
  const isRegisterActive = 
    activeTab === 'registration' || 
    activeTab === 'register' || 
    activeTab === 'track_selection' || 
    activeTab === 'registration_flow' || 
    activeTab === 'signup' || 
    activeTab === 'role_select' || 
    activeTab === 'role-select' || 
    activeTab === 'auth-signup' || 
    activeTab === 'sp_form' || 
    activeTab === 'sp-form';
  const isProfileActive = activeTab === 'profile' || activeTab === 'my-account' || activeTab === 'auth';

  return (
    <div 
      className={`app-navigation site-bottom-nav app-edge-to-edge-bottom-nav ${
        isAdminPreview ? 'absolute is-preview !flex md:!flex' : 'fixed md:hidden'
      } bottom-0 left-0 right-0 w-full p-1.5 sm:p-2 m-0 select-none z-50 transition-transform duration-300 ease-in-out bg-transparent ${
        (isAdminPreview || isVisible) ? 'translate-y-0 pointer-events-auto nav-visible' : 'translate-y-full pointer-events-none nav-hidden'
      }`}
      style={{
        position: isAdminPreview ? 'absolute' : undefined,
        maxWidth: isAdminPreview ? '100%' : undefined,
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
      id={id}
    >
      <nav 
        className="w-full max-w-md mx-auto border border-emerald-600 rounded-2xl bg-[#faf9f6] px-1 py-0.5 shadow-xs"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          backgroundColor: '#faf9f6',
        }}
      >
        <div className="w-full h-9 sm:h-10 grid grid-cols-5 items-center justify-items-center px-0.5 bg-transparent">
          {/* Slot 1: Home (হোম) */}
          <button 
            type="button"
            onClick={handleHome} 
            className="w-full h-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none group focus:outline-none px-0.5 bg-transparent border-0"
            id="nav-tab-home"
            title={isEn ? 'Home' : 'হোম'}
          >
            <div className="flex flex-col items-center justify-center w-full py-0.5 px-0.5 bg-transparent">
              <div className="flex items-center justify-center">
                <Home className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  isHomeActive 
                    ? 'text-[#16a34a] stroke-[2.5]' 
                    : 'text-slate-900 group-hover:text-[#16a34a] stroke-[2]'
                }`} />
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] tracking-tight text-center leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5 transition-colors ${
                isHomeActive 
                  ? 'text-[#16a34a] font-black' 
                  : 'text-slate-900 group-hover:text-[#16a34a] font-bold'
              }`}>
                {isEn ? 'Home' : 'হোম'}
              </span>
            </div>
          </button>

          {/* Slot 2: Search (খোঁজ) */}
          <button 
            type="button"
            onClick={handleSearch} 
            className="w-full h-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none group focus:outline-none px-0.5 bg-transparent border-0"
            id="nav-tab-search"
            title={isEn ? 'Search' : 'খোঁজ'}
          >
            <div className="flex flex-col items-center justify-center w-full py-0.5 px-0.5 bg-transparent">
              <div className="flex items-center justify-center">
                <Search className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  isSearchActive 
                    ? 'text-[#16a34a] stroke-[2.5]' 
                    : 'text-slate-900 group-hover:text-[#16a34a] stroke-[2]'
                }`} />
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] tracking-tight text-center leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5 transition-colors ${
                isSearchActive 
                  ? 'text-[#16a34a] font-black' 
                  : 'text-slate-900 group-hover:text-[#16a34a] font-bold'
              }`}>
                {isEn ? 'Search' : 'খোঁজ'}
              </span>
            </div>
          </button>

          {/* Slot 3: Jhadimadi AI (ঝাদিমাদি এআই) */}
          <button 
            type="button"
            onClick={handleAi} 
            className="w-full h-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none group focus:outline-none px-0.5 bg-transparent border-0"
            title={isEn ? 'Jhadimadi AI' : 'ঝাদিমাদি এআই'}
            id="nav-tab-jhadimadi"
          >
            <div className="flex flex-col items-center justify-center w-full py-0.5 px-0.5 bg-transparent">
              <div className="flex items-center justify-center">
                <Sparkles className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  isAiActive 
                    ? 'text-[#16a34a] fill-[#16a34a]/20 stroke-[2.5]' 
                    : 'text-slate-900 group-hover:text-[#16a34a] stroke-[2]'
                }`} />
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] tracking-tight text-center leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5 transition-colors ${
                isAiActive 
                  ? 'text-[#16a34a] font-black' 
                  : 'text-slate-900 group-hover:text-[#16a34a] font-bold'
              }`}>
                {isEn ? 'Jhadimadi AI' : 'ঝাদিমাদি এআই'}
              </span>
            </div>
          </button>

          {/* Slot 4: Join (যুক্ত হোন - Registration) */}
          <button 
            type="button"
            onClick={handleRegister}
            className="w-full h-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none group focus:outline-none px-0.5 bg-transparent border-0"
            title={isEn ? 'Join Jhadimadi Network' : 'যুক্ত হোন (পণ্য বিক্রেতা, সেবা দাতা, স্থায়ী সদস্য)'}
            id="nav-tab-register-action"
          >
            <div className="flex flex-col items-center justify-center w-full py-0.5 px-0.5 bg-transparent">
              <div className="flex items-center justify-center">
                <UserPlus className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  isRegisterActive 
                    ? 'text-[#16a34a] stroke-[2.5]' 
                    : 'text-slate-900 group-hover:text-[#16a34a] stroke-[2]'
                }`} />
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] tracking-tight text-center leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5 transition-colors ${
                isRegisterActive 
                  ? 'text-[#16a34a] font-black' 
                  : 'text-slate-900 group-hover:text-[#16a34a] font-bold'
              }`}>
                {isEn ? 'Join' : 'যুক্ত হোন'}
              </span>
            </div>
          </button>

          {/* Slot 5: Profile (প্রোফাইল) */}
          <button 
            type="button"
            onClick={handleProfile} 
            className="w-full h-full flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none group focus:outline-none px-0.5 bg-transparent border-0"
            title={isEn ? 'Profile' : 'আমার প্রোফাইল'}
            id="nav-tab-profile"
          >
            <div className="flex flex-col items-center justify-center w-full py-0.5 px-0.5 bg-transparent">
              <div className="flex items-center justify-center">
                {activeUser?.avatar ? (
                  <img 
                    src={activeUser.avatar} 
                    alt="Profile" 
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full object-cover transition-all ${
                      isProfileActive 
                        ? 'ring-2 ring-emerald-600 shadow-xs' 
                        : 'ring-1.5 ring-slate-800'
                    }`} 
                  />
                ) : (
                  <User className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                    isProfileActive 
                      ? 'text-[#16a34a] stroke-[2.5]' 
                      : 'text-slate-900 group-hover:text-[#16a34a] stroke-[2]'
                  }`} />
                )}
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] tracking-tight text-center leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5 transition-colors ${
                isProfileActive 
                  ? 'text-[#16a34a] font-black' 
                  : 'text-slate-900 group-hover:text-[#16a34a] font-bold'
              }`}>
                {isEn ? 'Profile' : 'প্রোফাইল'}
              </span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};

export const BottomNav = BottomNavigation;
export default BottomNavigation;
