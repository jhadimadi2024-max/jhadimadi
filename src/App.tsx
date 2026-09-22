import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { CustomerApp } from './components/CustomerApp';
import { JhadimadiSplashScreen } from './components/JhadimadiSplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2, Store, ArrowLeft, Home, Grid, UserPlus, Search, User, MessageSquare } from 'lucide-react';
import RoleSelectionModal from './components/RoleSelectionModal';
import ServiceProviderRegistrationForm from './components/ServiceProviderRegistrationForm';
import ServiceProviderProfile from './components/ServiceProviderProfile';
import CleanMerchantPage from './components/CleanMerchantPage';
import { SignInScreen } from './components/SignInScreen';
import { SignUpScreen } from './components/SignUpScreen';
import RegistrationPage from './components/RegistrationPage';
import { BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { Language } from './types';
import { INITIAL_VENDOR_STORES } from './data/vendorsData';
import { adminSecurityService, AdminSession } from './services/adminSecurityService';
import { DesktopAdminDashboard } from './components/admin/DesktopAdminDashboard';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { analyticsService } from './services/analyticsService';
import { NetworkStatusNotifier } from './components/NetworkStatusNotifier';

const AdminLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#faf9f6] text-slate-800 flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
      <p className="text-xs font-bold text-slate-600 tracking-wide">
        অ্যাডমিন প্যানেল লোড হচ্ছে...
      </p>
    </div>
  </div>
);

export interface AppContentProps {
  onReplaySplash?: () => void;
}

export const AppContent: React.FC<AppContentProps> = ({ onReplaySplash }) => {
  const { currentUser, login, logout, selectRole } = useAuth();
  const {
    location,
    isAtRootHome,
    canGoBack,
    navigateToTab,
    navigateToOnboarding,
    navigateToAdmin,
    navigateToHome,
    goBack,
    openModal,
    providerProfileData,
    setProviderProfileData,
  } = useNavigation();

  const currentRoute = location.route;
  const onboardingStep = location.onboardingStep;
  const setOnboardingStep = (step: any) => navigateToOnboarding(step);

  const [lang, setLang] = useState<Language>('bn');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      try {
        const session = await adminSecurityService.getCurrentAdminSession();
        if (isMounted) {
          if (session && session.role) {
            setIsAdminAuthenticated(true);
          } else {
            setIsAdminAuthenticated(false);
          }
          setIsVerifyingAdmin(false);
        }
      } catch {
        if (isMounted) {
          setIsAdminAuthenticated(false);
          setIsVerifyingAdmin(false);
        }
      }
    };

    // Defer admin verification until UI has painted
    const timer = setTimeout(verifyAdmin, 120);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentRoute]);

  useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/' || path === '') {
        if (
          hash === '#admin' ||
          hash === '#admin-portal' ||
          hash === '#signin' ||
          hash === '#signup' ||
          hash === '#login' ||
          hash === '#register'
        ) {
          window.history.replaceState(null, '', '/');
        }
      }
    } catch (_) {}
  }, []);

  // Record visitor activity & telemetry heartbeat in background (after splash finishes)
  useEffect(() => {
    const routeName = currentRoute === 'admin' ? '/admin' : '/';
    const initialPing = setTimeout(() => {
      analyticsService.recordVisitorPing(routeName);
    }, 1600); // Defer initial ping until after splash finishes
    const interval = setInterval(() => {
      analyticsService.recordVisitorPing(routeName);
    }, 60000); // Pulse every 60 seconds
    return () => {
      clearTimeout(initialPing);
      clearInterval(interval);
    };
  }, [currentRoute]);


  const [isSubpageNavVisible, setIsSubpageNavVisible] = useState<boolean>(true);
  const subpageLastScrollTopRef = useRef<number>(0);
  const subpageScrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const container = subpageScrollContainerRef.current;

    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let currentScrollTop = 0;
          let scrollHeight = 0;
          let clientHeight = 0;

          const targetEl = (e?.target && e.target !== document && (e.target as HTMLElement).scrollTop !== undefined)
            ? (e.target as HTMLElement)
            : container;

          if (targetEl && targetEl.scrollTop !== undefined) {
            currentScrollTop = targetEl.scrollTop;
            scrollHeight = targetEl.scrollHeight;
            clientHeight = targetEl.clientHeight;
          } else {
            currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
          }

          if (currentScrollTop <= 20) {
            setIsSubpageNavVisible(true);
            subpageLastScrollTopRef.current = Math.max(0, currentScrollTop);
            ticking = false;
            return;
          }

          if (scrollHeight > clientHeight && currentScrollTop + clientHeight >= scrollHeight - 30) {
            setIsSubpageNavVisible(true);
            subpageLastScrollTopRef.current = currentScrollTop;
            ticking = false;
            return;
          }

          const diff = currentScrollTop - subpageLastScrollTopRef.current;
          if (diff > 8 && currentScrollTop > 45) {
            setIsSubpageNavVisible(false);
          } else if (diff < -6) {
            setIsSubpageNavVisible(true);
          }

          subpageLastScrollTopRef.current = currentScrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [onboardingStep]);

  useEffect(() => {
    setIsSubpageNavVisible(true);
    subpageLastScrollTopRef.current = 0;
  }, [onboardingStep]);

  const isDirectAdminUrl = typeof window !== 'undefined' && (
    window.location.pathname === '/admin' || 
    window.location.pathname.startsWith('/admin/') ||
    window.location.pathname === '/admin-portal' ||
    window.location.pathname.startsWith('/admin-portal/') ||
    window.location.hash === '#admin' ||
    window.location.hash === '#admin-portal'
  );
  const isAdminRoute = currentRoute === 'admin' || isDirectAdminUrl;

  const navigateTo = (route: 'customer' | 'admin') => {
    if (route === 'admin') {
      try {
        const adminUrl = window.location.origin + '/admin';
        const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
        if (!newTab) {
          navigateToAdmin();
        }
      } catch (_) {
        window.open('/admin', '_blank');
      }
    } else {
      navigateToHome();
    }
  };

  const handleAdminLogout = async () => {
    try {
      await adminSecurityService.signOutAdmin();
    } catch {}
    setIsAdminAuthenticated(false);
  };

  const handleRoleSelect = (type: 'merchant' | 'service') => {
    if (type === 'merchant') {
      selectRole('seller');
      navigateToOnboarding('merchant-dashboard');
    } else {
      selectRole('professional');
      navigateToOnboarding('sp-form');
    }
  };

  const handleFormSubmit = (data: any) => {
    setProviderProfileData(data);
    navigateToOnboarding('sp-profile', data);
  };

  const handleResetFlow = () => {
    setProviderProfileData(null);
    navigateToOnboarding('role-select');
  };

  const handleReturnToApp = (tab: string = 'home') => {
    if (tab === 'home') {
      navigateToHome();
    } else {
      navigateToTab(tab);
    }
  };

  return (
    <>
      {isAdminRoute ? (
        <div className="fixed inset-0 w-screen h-screen min-h-screen z-[9999] bg-slate-950 overflow-hidden flex flex-col m-0 p-0">
          <Suspense fallback={<AdminLoadingFallback />}>
            {isVerifyingAdmin ? (
              <AdminLoadingFallback />
            ) : !isAdminAuthenticated ? (
              <AdminLoginScreen
                onSuccess={() => setIsAdminAuthenticated(true)}
                onNavigateToCustomerApp={() => {
                  if (window.opener && !window.opener.closed) {
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                }}
              />
            ) : (
              <DesktopAdminDashboard 
                onBack={handleAdminLogout} 
                onReturnToCustomerApp={() => {
                  if (window.opener && !window.opener.closed) {
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                }}
              />
            )}
          </Suspense>
        </div>
      ) : onboardingStep === 'app' ? (
        <div className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-[#faf9f6] flex flex-col p-0 m-0 overflow-hidden font-sans select-none top-0 left-0 right-0 bottom-0">
          <div className="w-full h-full flex-1 flex flex-col bg-[#faf9f6] overflow-hidden relative pointer-events-auto z-1 p-0 m-0 border-0 rounded-none shadow-none">
            <ErrorBoundary componentName="CustomerAppWrapper">
              <CustomerApp
                initialTab={location.tab as any}
                onReplaySplash={onReplaySplash || (() => {})}
                onNavigateToAdmin={() => {
                  try {
                    const adminUrl = window.location.origin + '/admin';
                    const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
                    if (!newTab) {
                      navigateToAdmin();
                    }
                  } catch (_) {
                    window.open('/admin', '_blank');
                  }
                }}
                onOpenRoleSelect={() => {
                  if (!currentUser) {
                    navigateToOnboarding('auth-signup');
                  } else {
                    navigateToOnboarding('role-select');
                  }
                }}
                onOpenAuth={(mode) => {
                  navigateToOnboarding(mode === 'signin' ? 'auth-signin' : 'auth-signup');
                }}
                onNavigateToMerchant={() => navigateToOnboarding('merchant-dashboard')}
                onNavigateToServiceProvider={() => navigateToOnboarding('sp-form')}
              />
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <div className={`fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] flex flex-col p-0 m-0 overflow-hidden font-sans select-none top-0 left-0 right-0 bottom-0 ${
          onboardingStep === 'auth-signup' || onboardingStep === 'sp-form' ? 'bg-white' : 'bg-[#faf9f6]'
        }`}>
          <div className={`w-full h-full flex-1 flex flex-col overflow-hidden relative pointer-events-auto z-1 p-0 m-0 border-0 rounded-none shadow-none ${
            onboardingStep === 'auth-signup' || onboardingStep === 'sp-form' ? 'bg-white' : 'bg-[#faf9f6]'
          }`}>
            {/* Universal Top Header Across All Subpages */}
            <div className="sticky top-0 z-40 w-full">
              <Navbar
                lang={lang}
                setLang={setLang}
                showBack={true}
                onBack={() => goBack()}
                onLogoClick={() => navigateToHome()}
                activeTab={onboardingStep}
                currentUser={currentUser}
              />
            </div>
            
            <main 
              ref={subpageScrollContainerRef}
              className={`main-content flex-1 overflow-y-auto scroll-smooth min-h-0 pb-14 sm:pb-16 overscroll-contain bg-[#faf9f6] ${
                onboardingStep === 'auth-signup' || onboardingStep === 'sp-form' ? 'p-0' : 'p-2 sm:p-3'
              }`}
            >
              {onboardingStep === 'auth-signin' && (
                <div className="w-full max-w-md mx-auto py-1">
                  <SignInScreen
                    lang="bn"
                    onBack={() => goBack()}
                    onSignInSuccess={(user) => {
                      login(user, false);
                      navigateToOnboarding('role-select');
                    }}
                    onNavigateToSignUp={() => navigateToOnboarding('auth-signup')}
                  />
                </div>
              )}

              {onboardingStep === 'auth-signup' && (
                <div className="w-full max-w-md mx-auto py-1">
                  <RegistrationPage
                    lang="bn"
                    currentUser={currentUser}
                    onBack={() => goBack()}
                    onSuccess={(user) => {
                      login(user, true);
                      navigateToOnboarding('role-select');
                    }}
                    onNavigateToSignIn={() => navigateToOnboarding('auth-signin')}
                  />
                </div>
              )}

              {onboardingStep === 'role-select' && (
                <div className="w-full max-w-md mx-auto py-2 flex flex-col items-center justify-start min-h-0">
                  <div className="w-full mb-3 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      অ্যাকাউন্ট নির্বাচন (Role Choice)
                    </span>
                    <button
                      type="button"
                      onClick={() => goBack()}
                      className="text-xs text-stone-500 hover:text-stone-800 font-medium transition cursor-pointer p-1"
                    >
                      হোমে যান (Cancel)
                    </button>
                  </div>
                  <RoleSelectionModal
                    userName={currentUser?.name}
                    onSelect={handleRoleSelect}
                    onNavigateToServiceProviderForm={() => navigateToOnboarding('sp-form')}
                    onNavigateToMerchantDashboard={() => navigateToOnboarding('merchant-dashboard')}
                  />
                </div>
              )}

              {onboardingStep === 'sp-form' && (
                <div className="w-full max-w-md mx-auto py-1">
                  <ServiceProviderRegistrationForm
                    currentUser={providerProfileData || currentUser}
                    onSubmitSuccess={handleFormSubmit}
                    onSuccess={handleFormSubmit}
                    onBack={() => goBack()}
                    lang="bn"
                  />
                </div>
              )}

              {onboardingStep === 'sp-profile' && (
                <div className="w-full max-w-md mx-auto py-1">
                  <ServiceProviderProfile
                    profileData={providerProfileData || currentUser}
                    currentUser={currentUser}
                    isOwner={true}
                    onEditProfile={() => navigateToOnboarding('sp-form')}
                    onNavigateDashboard={() => navigateToOnboarding('merchant-dashboard')}
                    onSignOut={() => {
                      logout();
                      navigateToHome();
                    }}
                    onDeleteAccount={handleResetFlow}
                    onBack={() => goBack()}
                    lang="bn"
                  />
                </div>
              )}

              {onboardingStep === 'merchant-dashboard' && (
                <div className="w-full max-w-md mx-auto py-1">
                  <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-[#009661] uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4" />
                      <span>মার্চেন্ট প্রোফাইল</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateToOnboarding('role-select')}
                      className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                      ← রোল পরিবর্তন
                    </button>
                  </div>
                  <CleanMerchantPage
                    lang="bn"
                    store={INITIAL_VENDOR_STORES[0]}
                    currentUserRole="merchant"
                    isOwner={true}
                    isAdmin={false}
                    onBack={() => goBack()}
                  />
                </div>
              )}
            </main>

            <BottomNav 
              activeTab={onboardingStep}
              isLoggedIn={!!currentUser}
              currentUser={currentUser}
              isBottomNavVisible={isSubpageNavVisible}
              onHomeClick={() => navigateToHome()}
              onSearchClick={() => navigateToTab('search')}
              onJobsClick={() => navigateToTab('jobs')}
              onOpenAiChat={() => openModal('chat')}
              onRegistrationClick={() => {
                if (!currentUser) {
                  navigateToOnboarding('auth-signup');
                } else {
                  navigateToOnboarding('role-select');
                }
              }}
              onProfileClick={() => navigateToTab('profile')}
              id="subpage-bottom-nav"
            />

          </div>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  // Ensure the home page layout loads immediately without getting stuck on splash screen
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFinishSplash = useCallback(() => {
    try {
      document.documentElement.classList.remove('splash-active');
      document.body.classList.remove('splash-active');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.remove('splash-active');
        rootEl.style.removeProperty('background-color');
        rootEl.style.backgroundColor = '';
      }
      document.documentElement.style.removeProperty('background-color');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('overflow');
      const preHydrate = document.getElementById('pre-hydration-splash');
      if (preHydrate) {
        preHydrate.style.display = 'none';
      }
      const splashRoot = document.getElementById('splash-screen-root');
      if (splashRoot) {
        splashRoot.style.display = 'none';
      }
      if (typeof (window as any).__applyEdgeToEdge === 'function') {
        (window as any).__applyEdgeToEdge();
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  // Guarantee immediate removal of splash classes and unblock home page layout on mount
  useEffect(() => {
    handleFinishSplash();
  }, [handleFinishSplash]);

  // Failsafe timeout: Guarantees splash unmounts within 1 second maximum if replay is triggered
  useEffect(() => {
    if (!isLoading) return;
    const failsafe = setTimeout(() => {
      handleFinishSplash();
    }, 1000);
    return () => clearTimeout(failsafe);
  }, [isLoading, handleFinishSplash]);

  const handleReplaySplash = useCallback(() => {
    try {
      document.documentElement.classList.add('splash-active');
      document.body.classList.add('splash-active');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.add('splash-active');
      }
      if (typeof (window as any).__applyEdgeToEdge === 'function') {
        (window as any).__applyEdgeToEdge();
      }
    } catch (_) {}
    setIsLoading(true);
  }, []);

  // Sync native status bar and theme-color with native dark splash theme vs application theme
  useEffect(() => {
    try {
      const metaThemes = document.querySelectorAll('meta[name="theme-color"], meta[name="msapplication-navbutton-color"], meta[name="navigation-bar-color"]');
      const targetColor = isLoading ? '#000000' : '#16a34a';
      metaThemes.forEach(el => el.setAttribute('content', targetColor));
    } catch (_) {}
  }, [isLoading]);

  return (
    <ErrorBoundary componentName="RootApplication">
      <NetworkStatusNotifier />
      <AuthProvider>
        <DataProvider>
          <NavigationProvider>
            <AppContent onReplaySplash={handleReplaySplash} />
          </NavigationProvider>
        </DataProvider>
      </AuthProvider>
      {isLoading && (
        <div 
          id="splash-screen-root"
          className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-[#000000] text-white flex items-center justify-center m-0 p-0 overflow-hidden z-[999999] select-none border-0 outline-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            minWidth: '100vw',
            height: '100%',
            minHeight: '100dvh',
            backgroundColor: '#000000',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            border: 'none',
            borderBottom: 'none',
            outline: 'none',
            boxShadow: 'none',
            zIndex: 999999,
          }}
        >
          <JhadimadiSplashScreen onFinish={handleFinishSplash} durationMs={950} />
        </div>
      )}
    </ErrorBoundary>
  );
};

export default App;
