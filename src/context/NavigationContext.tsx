import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type NavRoute = 'customer' | 'admin';
export type OnboardingStep = 
  | 'app' 
  | 'auth-signin' 
  | 'auth-signup' 
  | 'role-select' 
  | 'sp-form' 
  | 'sp-profile' 
  | 'merchant-dashboard';

export interface AppNavLocation {
  id: string;
  route: NavRoute;
  onboardingStep: OnboardingStep;
  tab: string; // 'home', 'jobs', 'services', 'search', 'profile', 'product_details', etc.
  pathname: string; // '/', '/search', '/jobs', '/services', '/profile', '/admin', etc.
  product?: any | null; // StoreProduct
  worker?: any | null; // ServiceProvider
  vendor?: any | null; // VendorStore
  modal?: string | null; // 'cart', 'chat', 'gemini', 'worker_profile', 'vendor_store', 'notifications', 'privacy_policy', 'account_deletion', 'blood_auth', 'source', etc.
  modalData?: any;
  providerProfileData?: any;
  depth: number;
}

export const computePathname = (loc: Partial<AppNavLocation>): string => {
  if (loc.route === 'admin') return '/admin';
  if (loc.onboardingStep && loc.onboardingStep !== 'app') return `/${loc.onboardingStep}`;
  if (loc.tab && loc.tab !== 'home') {
    if (loc.tab === 'search') return '/search';
    if (loc.tab === 'jobs') return '/jobs';
    if (loc.tab === 'services') return '/services';
    if (loc.tab === 'profile') return '/profile';
    return `/${loc.tab}`;
  }
  if (loc.product) return '/product';
  return '/';
};

export interface NavigationContextType {
  location: AppNavLocation;
  isAtRootHome: boolean;
  canGoBack: boolean;
  historyStack: AppNavLocation[];
  navigateToTab: (tab: string, extra?: { product?: any; clearModal?: boolean }) => void;
  navigateToProduct: (product: any) => void;
  navigateToOnboarding: (step: OnboardingStep, data?: any) => void;
  navigateToAdmin: () => void;
  navigateToHome: () => void;
  openModal: (modalId: string, modalData?: any) => void;
  closeModal: (modalId?: string) => void;
  goBack: () => void;
  setProviderProfileData: (data: any) => void;
  providerProfileData: any;
}

const ROOT_HOME_LOCATION: AppNavLocation = {
  id: 'root-home',
  route: 'customer',
  onboardingStep: 'app',
  tab: 'home',
  pathname: '/',
  product: null,
  worker: null,
  vendor: null,
  modal: null,
  modalData: null,
  depth: 0,
};

export const checkIsRootHome = (loc: AppNavLocation): boolean => {
  return (
    loc.route === 'customer' &&
    loc.onboardingStep === 'app' &&
    (loc.tab === 'home' || !loc.tab) &&
    !loc.product &&
    !loc.modal &&
    !loc.worker &&
    !loc.vendor
  );
};

const getUrlForLocation = (loc: AppNavLocation): string => {
  if (loc.route === 'admin') {
    return '/admin';
  }
  if (loc.modal) {
    if (loc.modal === 'cart') return '#cart';
    if (loc.modal === 'chat') return '#ai-chat';
    if (loc.modal === 'gemini') return '#gemini-assistant';
    if (loc.modal === 'notifications') return '#notifications';
    if (loc.modal === 'privacy_policy') return '#privacy-policy';
    if (loc.modal === 'account_deletion') return '#account-deletion';
    if (loc.modal === 'blood_auth') return '#blood-auth';
    if (loc.modal === 'source') return '#source-directory';
    if (loc.modal === 'worker_profile' && loc.worker?.id) return `#worker-${loc.worker.id}`;
    if (loc.modal === 'vendor_store' && loc.vendor?.id) return `#vendor-${loc.vendor.id}`;
    return `#modal-${loc.modal}`;
  }
  if (loc.onboardingStep && loc.onboardingStep !== 'app') {
    if (loc.onboardingStep === 'auth-signin') return '#signin';
    if (loc.onboardingStep === 'auth-signup') return '#signup';
    if (loc.onboardingStep === 'role-select') return '#role-select';
    if (loc.onboardingStep === 'sp-form') return '#sp-form';
    if (loc.onboardingStep === 'sp-profile') return '#sp-profile';
    if (loc.onboardingStep === 'merchant-dashboard') return '#merchant-dashboard';
    return `#${loc.onboardingStep}`;
  }
  if (loc.tab === 'product_details' && loc.product?.id) {
    return `#product-${loc.product.id}`;
  }
  if (loc.tab && loc.tab !== 'home') {
    if (loc.tab === 'search') return '/search';
    if (loc.tab === 'jobs') return '/jobs';
    if (loc.tab === 'services') return '/services';
    if (loc.tab === 'profile') return '/profile';
    if (loc.tab === 'puja_gift') return '#puja-gift';
    if (loc.tab === 'auto_directory') return '#auto-directory';
    return `#${loc.tab}`;
  }
  return '/';
};

const parseInitialLocation = (): AppNavLocation => {
  try {
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();

    if (
      path === '/admin' ||
      path.startsWith('/admin/') ||
      path === '/admin-portal' ||
      path.startsWith('/admin-portal/') ||
      hash === '#admin' ||
      hash === '#admin-portal'
    ) {
      return {
        id: 'admin-init',
        route: 'admin',
        onboardingStep: 'app',
        tab: 'home',
        pathname: '/admin',
        depth: 1,
      };
    }

    if (hash === '#signin' || hash === '#login') {
      return {
        id: 'signin-init',
        route: 'customer',
        onboardingStep: 'auth-signin',
        tab: 'home',
        pathname: '/auth-signin',
        depth: 1,
      };
    }
    if (hash === '#signup' || hash === '#register') {
      return {
        id: 'signup-init',
        route: 'customer',
        onboardingStep: 'auth-signup',
        tab: 'home',
        pathname: '/auth-signup',
        depth: 1,
      };
    }
    if (hash === '#role-select' || hash === '#select-role') {
      return {
        id: 'role-select-init',
        route: 'customer',
        onboardingStep: 'role-select',
        tab: 'home',
        pathname: '/role-select',
        depth: 1,
      };
    }
    if (hash === '#sp-form' || hash === '#provider-form') {
      return {
        id: 'sp-form-init',
        route: 'customer',
        onboardingStep: 'sp-form',
        tab: 'home',
        pathname: '/sp-form',
        depth: 1,
      };
    }
    if (hash === '#sp-profile' || hash === '#resume' || hash === '#provider-profile') {
      return {
        id: 'sp-profile-init',
        route: 'customer',
        onboardingStep: 'sp-profile',
        tab: 'home',
        pathname: '/sp-profile',
        depth: 1,
      };
    }
    if (hash === '#merchant-dashboard' || hash === '#merchant') {
      return {
        id: 'merchant-init',
        route: 'customer',
        onboardingStep: 'merchant-dashboard',
        tab: 'home',
        pathname: '/merchant-dashboard',
        depth: 1,
      };
    }
    if (path.includes('/jobs') || hash === '#jobs' || hash === '#job-portal') {
      return {
        id: 'jobs-init',
        route: 'customer',
        onboardingStep: 'app',
        tab: 'jobs',
        pathname: '/jobs',
        depth: 1,
      };
    }
    if (path.includes('/search') || hash === '#search') {
      return {
        id: 'search-init',
        route: 'customer',
        onboardingStep: 'app',
        tab: 'search',
        pathname: '/search',
        depth: 1,
      };
    }
    if (path.includes('/services') || hash === '#services') {
      return {
        id: 'services-init',
        route: 'customer',
        onboardingStep: 'app',
        tab: 'services',
        pathname: '/services',
        depth: 1,
      };
    }
    if (path.includes('/profile') || hash === '#profile') {
      return {
        id: 'profile-init',
        route: 'customer',
        onboardingStep: 'app',
        tab: 'profile',
        pathname: '/profile',
        depth: 1,
      };
    }
    if (hash === '#puja-gift' || path.includes('/puja-gift')) {
      return {
        id: 'puja-gift-init',
        route: 'customer',
        onboardingStep: 'app',
        tab: 'puja_gift',
        pathname: '/puja_gift',
        depth: 1,
      };
    }
  } catch {}

  return { ...ROOT_HOME_LOCATION };
};

const NavigationContext = createContext<NavigationContextType | null>(null);

let locationIdCounter = 1;
const generateLocationId = () => `loc-${Date.now()}-${locationIdCounter++}`;

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLoc = parseInitialLocation();
  const [location, setLocation] = useState<AppNavLocation>(initialLoc);
  const [providerProfileData, setProviderProfileData] = useState<any>(null);

  // Stack of locations for step-by-step history popping
  const stackRef = useRef<AppNavLocation[]>(
    checkIsRootHome(initialLoc)
      ? [{ ...ROOT_HOME_LOCATION }]
      : [{ ...ROOT_HOME_LOCATION }, { ...initialLoc }]
  );

  const currentLocationRef = useRef<AppNavLocation>(location);
  currentLocationRef.current = location;

  const isPoppingRef = useRef<boolean>(false);

  const isAtRoot = checkIsRootHome(location);
  const canGoBack = stackRef.current.length > 1 || !isAtRoot;

  // Initialize HTML5 History API state on mount
  useEffect(() => {
    try {
      const isRoot = checkIsRootHome(initialLoc);
      if (isRoot) {
        window.history.replaceState(
          { ...ROOT_HOME_LOCATION, depth: 0, isRoot: true },
          '',
          window.location.pathname || '/'
        );
      } else {
        // User opened app on a deep link:
        // Push root home at depth 0, then the secondary page at depth 1
        // This ensures pressing back from the secondary page returns to Home Page first!
        window.history.replaceState(
          { ...ROOT_HOME_LOCATION, depth: 0, isRoot: true },
          '',
          '/'
        );
        window.history.pushState(
          { ...initialLoc, depth: 1, isRoot: false },
          '',
          getUrlForLocation(initialLoc)
        );
      }
    } catch (_) {}
  }, []);

  // Update document title dynamically based on location
  useEffect(() => {
    try {
      if (location.modal === 'cart') {
        document.title = 'শপিং কার্ট | ঝাদিমাদি ডটকম';
      } else if (location.modal === 'chat') {
        document.title = 'AI সহকারী চ্যাট | ঝাদিমাদি';
      } else if (location.product?.name || location.product?.nameBn) {
        document.title = `${location.product.nameBn || location.product.name} | ঝাদিমাদি`;
      } else if (location.tab === 'jobs') {
        document.title = 'চাকরি পোর্টাল | ঝাদিমাদি ডটকম';
      } else if (location.tab === 'services') {
        document.title = 'সেবাসমূহ ও কারিগর | ঝাদিমাদি';
      } else if (location.tab === 'profile') {
        document.title = 'প্রোফাইল | ঝাদিমাদি ডটকম';
      } else if (location.onboardingStep === 'sp-form') {
        document.title = 'পেশাজীবী নিবন্ধন | ঝাদিমাদি';
      } else if (location.onboardingStep === 'role-select') {
        document.title = 'রোল নির্বাচন | ঝাদিমাদি';
      } else if (location.route === 'admin') {
        document.title = 'অ্যাডমিন পোর্টাল | ঝাদিমাদি';
      } else {
        document.title = 'Jhadimadi.com - ঝাদিমাদি ডটকম';
      }
    } catch (_) {}
  }, [location]);

  // Navigate to a new location and push state to history stack
  const pushLocation = useCallback((nextLocInput: Omit<AppNavLocation, 'pathname'> & { pathname?: string }) => {
    if (isPoppingRef.current) return;

    const nextLoc: AppNavLocation = {
      ...nextLocInput,
      pathname: nextLocInput.pathname || computePathname(nextLocInput),
    };

    // Check if new location is identical to current
    const curr = currentLocationRef.current;
    if (
      curr.route === nextLoc.route &&
      curr.onboardingStep === nextLoc.onboardingStep &&
      curr.tab === nextLoc.tab &&
      curr.product?.id === nextLoc.product?.id &&
      curr.modal === nextLoc.modal &&
      curr.worker?.id === nextLoc.worker?.id &&
      curr.vendor?.id === nextLoc.vendor?.id
    ) {
      return;
    }

    const isNextRoot = checkIsRootHome(nextLoc);

    if (isNextRoot) {
      // Navigating back to root home explicitly (e.g. user taps Home nav button)
      stackRef.current = [{ ...ROOT_HOME_LOCATION, pathname: '/' }];
      const finalLoc = { ...ROOT_HOME_LOCATION, id: generateLocationId(), depth: 0, pathname: '/' };
      currentLocationRef.current = finalLoc;
      try {
        window.history.pushState(
          { ...finalLoc, isRoot: true },
          '',
          getUrlForLocation(finalLoc)
        );
      } catch (_) {}
      setLocation(finalLoc);
      return;
    }

    // Normal forward navigation: append to history stack
    const newDepth = stackRef.current.length;
    const finalLoc: AppNavLocation = {
      ...nextLoc,
      id: generateLocationId(),
      depth: newDepth,
      pathname: computePathname(nextLoc),
    };

    stackRef.current.push(finalLoc);
    currentLocationRef.current = finalLoc;

    try {
      window.history.pushState(
        { ...finalLoc, isRoot: false },
        '',
        getUrlForLocation(finalLoc)
      );
    } catch (_) {}

    setLocation(finalLoc);
  }, []);

  // Pop state when back button is pressed (Hardware, Browser, or In-App)
  const goBack = useCallback(() => {
    const curr = currentLocationRef.current;

    // HOME PAGE EXIT GUARD: If already on ROOT/Home Page, do not intercept!
    if (checkIsRootHome(curr)) {
      return;
    }

    // If browser history has an entry to pop:
    if (window.history.length > 1 && curr.depth > 0) {
      window.history.back();
    } else {
      // Fallback: manually pop local stack
      if (stackRef.current.length > 1) {
        stackRef.current.pop();
        const prev = stackRef.current[stackRef.current.length - 1] || ROOT_HOME_LOCATION;
        const ensuredPrev = { ...prev, pathname: prev.pathname || computePathname(prev) };
        currentLocationRef.current = ensuredPrev;
        setLocation(ensuredPrev);
        try {
          window.history.replaceState(
            { ...ensuredPrev, isRoot: checkIsRootHome(ensuredPrev) },
            '',
            getUrlForLocation(ensuredPrev)
          );
        } catch (_) {}
      } else {
        // Return to root home
        stackRef.current = [{ ...ROOT_HOME_LOCATION, pathname: '/' }];
        currentLocationRef.current = ROOT_HOME_LOCATION;
        setLocation(ROOT_HOME_LOCATION);
        try {
          window.history.replaceState(
            { ...ROOT_HOME_LOCATION, isRoot: true },
            '',
            '/'
          );
        } catch (_) {}
      }
    }
  }, []);

  // Popstate event handler (triggered by browser back/forward or window.history.back())
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isPoppingRef.current = true;
      try {
        const state = e.state as (AppNavLocation & { isRoot?: boolean }) | null;

        if (state && typeof state.depth === 'number') {
          const ensuredState: AppNavLocation = {
            ...state,
            pathname: state.pathname || computePathname(state),
          };

          // If popped state depth is less than current, pop our local stack
          if (stackRef.current.length > 1 && ensuredState.depth < currentLocationRef.current.depth) {
            // Pop until we reach the matching depth or length
            while (stackRef.current.length > ensuredState.depth + 1 && stackRef.current.length > 1) {
              stackRef.current.pop();
            }
          } else if (ensuredState.depth >= stackRef.current.length) {
            // Forward navigation in browser history
            stackRef.current.push(ensuredState);
          }

          currentLocationRef.current = ensuredState;
          setLocation(ensuredState);
        } else {
          // No state object or reached start: restore root home
          if (stackRef.current.length > 1) {
            stackRef.current.pop();
            const prev = stackRef.current[stackRef.current.length - 1] || ROOT_HOME_LOCATION;
            const ensuredPrev = { ...prev, pathname: prev.pathname || computePathname(prev) };
            currentLocationRef.current = ensuredPrev;
            setLocation(ensuredPrev);
          } else {
            stackRef.current = [{ ...ROOT_HOME_LOCATION, pathname: '/' }];
            currentLocationRef.current = ROOT_HOME_LOCATION;
            setLocation(ROOT_HOME_LOCATION);
          }
        }
      } finally {
        setTimeout(() => {
          isPoppingRef.current = false;
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Hardware Back Button listener (Android Cordova / Capacitor / WebView)
  useEffect(() => {
    const handleHardwareBackButton = (e: Event) => {
      const curr = currentLocationRef.current;
      const isRoot = checkIsRootHome(curr);

      if (!isRoot) {
        // Intercept back button on secondary pages/modals! Prevent app exit!
        e.preventDefault();
        e.stopPropagation();
        goBack();
      } else {
        // HOME PAGE EXIT GUARD:
        // On ROOT/Home Page, allow closure/exit exclusively!
        const navApp = (window as any).navigator?.app;
        if (navApp && typeof navApp.exitApp === 'function') {
          navApp.exitApp();
        }
      }
    };

    document.addEventListener('backbutton', handleHardwareBackButton, false);
    return () => {
      document.removeEventListener('backbutton', handleHardwareBackButton, false);
    };
  }, [goBack]);

  // Public Navigation Methods
  const navigateToTab = useCallback((tab: string, extra?: { product?: any; clearModal?: boolean }) => {
    if (tab === 'ai_chat') {
      const curr = currentLocationRef.current;
      if (curr.modal !== 'chat') {
        pushLocation({
          ...curr,
          id: generateLocationId(),
          modal: 'chat',
        });
      }
      return;
    }
    const curr = currentLocationRef.current;
    pushLocation({
      id: generateLocationId(),
      route: 'customer',
      onboardingStep: 'app',
      tab,
      product: extra?.product ?? (tab === 'product_details' ? curr.product : null),
      worker: null,
      vendor: null,
      modal: extra?.clearModal ? null : null,
      depth: 0,
    });
  }, [pushLocation]);

  const navigateToProduct = useCallback((product: any) => {
    pushLocation({
      id: generateLocationId(),
      route: 'customer',
      onboardingStep: 'app',
      tab: 'product_details',
      product,
      worker: null,
      vendor: null,
      modal: null,
      depth: 0,
    });
  }, [pushLocation]);

  const navigateToOnboarding = useCallback((step: OnboardingStep, data?: any) => {
    if (data) {
      setProviderProfileData(data);
    }
    pushLocation({
      id: generateLocationId(),
      route: 'customer',
      onboardingStep: step,
      tab: 'home',
      product: null,
      worker: null,
      vendor: null,
      modal: null,
      providerProfileData: data,
      depth: 0,
    });
  }, [pushLocation]);

  const navigateToAdmin = useCallback(() => {
    try {
      const adminUrl = window.location.origin + '/admin';
      const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
      if (!newTab) {
        // Fallback if browser popup blocked
        pushLocation({
          id: generateLocationId(),
          route: 'admin',
          onboardingStep: 'app',
          tab: 'home',
          pathname: '/admin',
          depth: 1,
        });
      }
    } catch (_) {
      window.open('/admin', '_blank');
    }
  }, [pushLocation]);

  const navigateToHome = useCallback(() => {
    pushLocation({ ...ROOT_HOME_LOCATION });
  }, [pushLocation]);

  const openModal = useCallback((modalId: string, modalData?: any) => {
    const curr = currentLocationRef.current;
    if (curr.modal === modalId) {
      return; // Never stack duplicate instances of the same modal
    }
    pushLocation({
      ...curr,
      id: generateLocationId(),
      modal: modalId,
      modalData,
      worker: modalId === 'worker_profile' ? modalData : curr.worker,
      vendor: modalId === 'vendor_store' ? modalData : curr.vendor,
    });
  }, [pushLocation]);

  const closeModal = useCallback((modalId?: string) => {
    const curr = currentLocationRef.current;
    if (!curr.modal && curr.tab !== 'ai_chat') return;
    if (modalId && curr.modal && curr.modal !== modalId) return;

    const targetModal = modalId || curr.modal;
    const stack = stackRef.current;
    let popCount = 0;
    for (let i = stack.length - 1; i >= 0; i--) {
      const item = stack[i];
      if ((targetModal && item.modal === targetModal) || item.modal === 'chat' || item.tab === 'ai_chat') {
        popCount++;
      } else {
        break;
      }
    }

    if (popCount > 0) {
      for (let i = 0; i < popCount; i++) {
        if (stackRef.current.length > 1) {
          stackRef.current.pop();
        }
      }
      const prev = stackRef.current[stackRef.current.length - 1] || ROOT_HOME_LOCATION;
      const ensuredPrev: AppNavLocation = {
        ...prev,
        modal: null,
        tab: prev.tab === 'ai_chat' ? 'home' : (prev.tab || 'home'),
        pathname: prev.pathname || computePathname(prev),
      };
      stackRef.current[stackRef.current.length - 1] = ensuredPrev;
      currentLocationRef.current = ensuredPrev;
      setLocation(ensuredPrev);

      try {
        if (typeof window.history.go === 'function' && window.history.length > popCount && popCount > 1) {
          window.history.go(-popCount);
        } else if (window.history.length > 1 && curr.depth > 0) {
          window.history.back();
        } else {
          window.history.replaceState(
            { ...ensuredPrev, isRoot: checkIsRootHome(ensuredPrev) },
            '',
            getUrlForLocation(ensuredPrev)
          );
        }
      } catch (_) {}
    } else {
      goBack();
    }
  }, [goBack]);

  const value: NavigationContextType = {
    location,
    isAtRootHome: isAtRoot,
    canGoBack,
    historyStack: stackRef.current,
    navigateToTab,
    navigateToProduct,
    navigateToOnboarding,
    navigateToAdmin,
    navigateToHome,
    openModal,
    closeModal,
    goBack,
    setProviderProfileData,
    providerProfileData,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
