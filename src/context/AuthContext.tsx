import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { RegisteredProfessional } from '../components/ProfessionalRegistrationWizard';
import { offlineStorage, OFFLINE_KEYS } from '../utils/offlineStorage';
import { performSignOut } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../supabase';

export type UserRole = 
  | 'seller' 
  | 'professional' 
  | 'buyer' 
  | 'service_provider' 
  | 'product_seller' 
  | 'permanent_member' 
  | 'permanent';
export type AuthMode = 'signin' | 'signup';

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole | null;
  userProfessionalProfile: RegisteredProfessional | null;
  isAuthModalOpen: boolean;
  authNoticeMessage: string;
  authModalInitialMode: AuthMode;
  isRoleModalOpen: boolean;
  activeProfileTab: 'overview' | 'seller' | 'professional';
  setActiveProfileTab: (tab: 'overview' | 'seller' | 'professional') => void;
  openAuthModal: (notice?: string, initialMode?: AuthMode) => void;
  closeAuthModal: () => void;
  openRoleModal: () => void;
  closeRoleModal: () => void;
  login: (user: UserProfile, isNewSignUp?: boolean) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  selectRole: (role: 'seller' | 'professional' | 'buyer') => void;
  saveProfessionalProfile: (pro: RegisteredProfessional) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial user state from offline cache
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return offlineStorage.getItem<UserProfile | null>(OFFLINE_KEYS.USER, null);
  });

  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const saved = offlineStorage.getItem<string | null>('jhadimadi_user_role_v1', null);
    return (saved as UserRole) || null;
  });

  const [userProfessionalProfile, setUserProfessionalProfile] = useState<RegisteredProfessional | null>(() => {
    return offlineStorage.getItem<RegisteredProfessional | null>(OFFLINE_KEYS.PRO_PROFILE, null);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authNoticeMessage, setAuthNoticeMessage] = useState('');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<AuthMode>('signin');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'seller' | 'professional'>('overview');

  // Sync to local storage
  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_user_role_v1', userRole);
  }, [userRole]);

  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.PRO_PROFILE, userProfessionalProfile);
  }, [userProfessionalProfile]);

  // Supabase Session Persistence & Dynamic Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] getSession notice:', error.message);
          return;
        }

        if (session?.user && isMounted) {
          const authUser = session.user;
          const userPhone = authUser.phone || authUser.user_metadata?.phone || '';
          
          let query = supabase.from('profiles').select('*').eq('id', authUser.id);
          const { data: profileById } = await query.maybeSingle();
          let profile = profileById;

          if (!profile && userPhone) {
            const { data: profileByPhone } = await supabase.from('profiles').select('*').eq('phone', userPhone).maybeSingle();
            profile = profileByPhone;
          }

          if (profile && isMounted) {
            const syncedUser: UserProfile = {
              id: profile.id || authUser.id,
              uid: profile.id || authUser.id,
              name: profile.full_name || profile.name || authUser.user_metadata?.full_name || 'নিবন্ধিত সদস্য',
              fullName: profile.full_name || profile.name || authUser.user_metadata?.full_name || 'নিবন্ধিত সদস্য',
              phone: profile.phone || userPhone,
              email: profile.email || authUser.email || '',
              role: (profile.role || profile.member_type || authUser.user_metadata?.role || 'customer') as any,
              memberType: (profile.member_type || profile.role || 'customer') as any,
              memberUID: profile.unique_id || authUser.user_metadata?.unique_id,
              district: profile.district || 'খাগড়াছড়ি',
              upazila: profile.upazila || 'খাগড়াছড়ি সদর',
              mahalla: profile.mahalla || profile.area || `${profile.upazila || 'সদর'} সদর`,
              division: profile.division || 'চট্টগ্রাম',
              avatar: profile.photo_url || authUser.user_metadata?.avatar_url,
              bloodGroup: profile.blood_group,
              isBloodDonor: Boolean(profile.is_blood_donor),
              isNidVerified: Boolean(profile.is_nid_verified),
              isPaidMember: Boolean(profile.is_paid_member),
              createdAt: profile.created_at || new Date().toISOString(),
            };
            setCurrentUser(syncedUser);
            if (syncedUser.role) {
              setUserRole(syncedUser.role as UserRole);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restoration error:', err);
      }
    };

    // Defer session restore asynchronously so initial frame rendering and splash have 100% CPU priority
    const restoreTimer = setTimeout(() => {
      if (isMounted) {
        restoreSession();
      }
    }, 350);

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && isMounted) {
        const authUser = session.user;
        const userPhone = authUser.phone || authUser.user_metadata?.phone || '';
        
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        if (!profile && userPhone) {
          const { data: profileByPhone } = await supabase.from('profiles').select('*').eq('phone', userPhone).maybeSingle();
          profile = profileByPhone;
        }

        if (profile && isMounted) {
          const syncedUser: UserProfile = {
            id: profile.id || authUser.id,
            uid: profile.id || authUser.id,
            name: profile.full_name || profile.name || authUser.user_metadata?.full_name || 'নিবন্ধিত সদস্য',
            fullName: profile.full_name || profile.name || authUser.user_metadata?.full_name || 'নিবন্ধিত সদস্য',
            phone: profile.phone || userPhone,
            email: profile.email || authUser.email || '',
            role: (profile.role || profile.member_type || authUser.user_metadata?.role || 'customer') as any,
            memberType: (profile.member_type || profile.role || 'customer') as any,
            memberUID: profile.unique_id,
            district: profile.district || 'খাগড়াছড়ি',
            upazila: profile.upazila || 'খাগড়াছড়ি সদর',
            mahalla: profile.mahalla || profile.area || `${profile.upazila || 'সদর'} সদর`,
            division: profile.division || 'চট্টগ্রাম',
            avatar: profile.photo_url,
            bloodGroup: profile.blood_group,
            isBloodDonor: Boolean(profile.is_blood_donor),
            isNidVerified: Boolean(profile.is_nid_verified),
            isPaidMember: Boolean(profile.is_paid_member),
            createdAt: profile.created_at || new Date().toISOString(),
          };
          setCurrentUser(syncedUser);
          if (syncedUser.role) {
            setUserRole(syncedUser.role as UserRole);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(restoreTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const openAuthModal = (notice?: string, initialMode: AuthMode = 'signin') => {
    setAuthNoticeMessage(notice || '');
    setAuthModalInitialMode(initialMode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthNoticeMessage('');
    setAuthModalInitialMode('signin');
  };

  const openRoleModal = () => {
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
  };

  const sanitizeUserForSession = (user: UserProfile | null): UserProfile | null => {
    if (!user) return null;
    const copy: any = { ...user };
    if ('password' in copy) delete copy.password;
    return copy as UserProfile;
  };

  const login = (user: UserProfile, isNewSignUp: boolean = false) => {
    const cleanUser = sanitizeUserForSession(user);
    setCurrentUser(cleanUser);
    setIsAuthModalOpen(false);
    if (cleanUser?.role) {
      setUserRole(cleanUser.role as UserRole);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setActiveProfileTab('overview');
    offlineStorage.saveItem(OFFLINE_KEYS.USER, null);
    offlineStorage.saveItem('jhadimadi_user_role_v1', null);
    try {
      if (typeof window !== 'undefined') {
        try {
          if (window.sessionStorage) {
            sessionStorage.removeItem(OFFLINE_KEYS.USER);
            sessionStorage.removeItem(OFFLINE_KEYS.PRO_PROFILE);
            sessionStorage.removeItem('jhadimadi_customer_auth');
          }
        } catch {}
        try {
          if (window.localStorage) {
            localStorage.removeItem('jhadimadi_offline_user_v1');
            localStorage.removeItem('jhadimadi_offline_pro_profile_v1');
            localStorage.removeItem('jhadimadi_customer_auth');
            localStorage.removeItem('jhadimadi_current_user');
            localStorage.removeItem('jm_authenticated_user');
            localStorage.removeItem('jm_current_customer');
          }
        } catch {}
      }
    } catch {}
    performSignOut().catch(() => {});
  };

  const updateUser = (user: UserProfile) => {
    setCurrentUser(sanitizeUserForSession(user));
  };

  const selectRole = (role: 'seller' | 'professional' | 'buyer') => {
    setUserRole(role);
    setIsRoleModalOpen(false);
    if (role === 'seller') {
      setActiveProfileTab('seller');
    } else if (role === 'professional') {
      setActiveProfileTab('professional');
    } else {
      setActiveProfileTab('overview');
    }
    if (currentUser) {
      const updated = { ...currentUser, role: role === 'buyer' ? 'customer' as const : role };
      setCurrentUser(updated);
    }
  };

  const saveProfessionalProfile = (pro: RegisteredProfessional) => {
    setUserProfessionalProfile(pro);
    setUserRole('professional');
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        name: pro.name || currentUser.name,
        phone: pro.phone || currentUser.phone,
        district: pro.district || currentUser.district,
        upazila: pro.upazila || currentUser.upazila,
        mahalla: pro.area || currentUser.mahalla,
        isNidVerified: pro.verified ?? currentUser.isNidVerified,
        isPaidMember: pro.verified ? true : currentUser.isPaidMember
      };
      setCurrentUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        userProfessionalProfile,
        isAuthModalOpen,
        authNoticeMessage,
        authModalInitialMode,
        isRoleModalOpen,
        activeProfileTab,
        setActiveProfileTab,
        openAuthModal,
        closeAuthModal,
        openRoleModal,
        closeRoleModal,
        login,
        logout,
        updateUser,
        selectRole,
        saveProfessionalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
