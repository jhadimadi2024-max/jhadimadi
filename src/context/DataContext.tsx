import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StoreProduct, isLegacyDemoProduct, sortProductsAscending } from '../data/productsData';
import { RegisteredProfessional } from '../components/ProfessionalRegistrationWizard';
import { offlineStorage, OFFLINE_KEYS } from '../utils/offlineStorage';
import { databaseService, toDatabaseUuid, isValidUuid, HARDCODED_FALLBACK_CATEGORIES } from '../services/databaseService';
import { resilientSupabaseDelete } from '../services/supabaseDbHelper';
import { FeedPost, AdminBanner } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export type { RegisteredProfessional, AdminBanner };

// Multi-tab BroadcastChannel & storage event synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('jhadimadi_state_sync_channel');
  }
} catch {
  // BroadcastChannel unavailable
}

function broadcastSync(type: 'products' | 'banners' | 'categories' | 'orders' | 'posts' | 'blood_donors' | 'draft_preview' | 'all', payload: any) {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  } catch (err) {
    console.warn('[BroadcastChannel] sync error:', err);
  }
}

export interface AdminUserRecord {
  id: string | number;
  name: string;
  role: 'professional' | 'seller' | 'buyer' | 'blood_donor';
  roleLabelBn: string;
  phone: string;
  email?: string;
  district: string;
  upazila: string;
  area?: string;
  bloodGroup?: string; // 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  lastDonationDate?: string;
  totalDonations?: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  createdAt: string;
  avatar?: string;
  nid?: string;
  tradeLicense?: string;
  notes?: string;
  professionalProfile?: RegisteredProfessional;
}

export interface AdminOrderItem {
  productId: string;
  nameBn: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: AdminOrderItem[];
  totalAmount: number;
  paymentMethod: 'COD' | 'Direct_Contact' | 'bKash' | 'Nagad' | 'Upay';
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
  notes?: string;

  // Future-Proofing for Commission & Payment Gateways (Beta Phase)
  commissionRate?: number;
  commissionAmount?: number;
  commissionStatus?: 'exempt' | 'pending' | 'collected' | 'waived';
  paymentStatus?: 'pending' | 'paid' | 'cod_unpaid' | 'failed' | 'refunded';
  gatewayName?: string | null;
  gatewayTransactionId?: string | null;
  gatewayPayload?: any;
  isBetaPhase?: boolean;
  orderChannel?: 'COD' | 'Direct_Contact' | 'WhatsApp' | 'Phone';
  customerOtpVerified?: boolean;
  customerVerificationCode?: string;
  vendorPhone?: string;
  directContactTimestamp?: string;
}

// ================= 📢 হোমপেজ ও ঘোষণা মডেল =================
export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  tag: 'জরুরি বিজ্ঞপ্তি' | 'বিশেষ অফার' | 'নোটিশ' | 'আপডেট';
  isPublished: boolean;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  expiresAt?: string;
}

export interface AdminHomepageContent {
  announcementTicker: {
    enabled: boolean;
    text: string;
    tag: string;
    speed: 'normal' | 'slow' | 'fast';
  };
  heroBanner: {
    title: string;
    subtitle: string;
    badge: string;
    primaryBtnText: string;
  };
  helpline: {
    phone: string;
    whatsapp: string;
    emergencyAmbulance: string;
    supportEmail: string;
  };
  operationalSettings: {
    maintenanceMode: boolean;
    registrationOpen: boolean;
    codEnabled: boolean;
    minOrderAmount: number;
    defaultDeliveryCharge: number;
    platformCommissionPercent: number;
  };
}

export interface AdminMediaItem {
  id: string;
  title: string;
  url: string;
  tag: 'product' | 'banner' | 'category' | 'avatar' | 'other';
  uploadedAt: string;
  sizeKb?: number;
}

// ================= 🩸 রক্তদাতা ডিরেক্টরি মডেল =================
export interface AdminBloodDonor {
  id: string;
  name: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  division?: string;
  district: string;
  upazila: string;
  area: string;
  lastDonationDate: string;
  totalDonations: number;
  isAvailable: boolean;
  available?: boolean;
  verified: boolean;
  emergencyContact?: string;
  age?: number;
  districtUniqueId?: string;
}

// ================= 💬 কমপ্লেন ও রিভিউ মোডারেশন মডেল =================
export interface AdminComplaint {
  id: string;
  complainantName: string;
  complainantPhone: string;
  targetType: 'service' | 'product' | 'seller' | 'rider';
  targetName: string;
  category: 'দেরিতে ডেলিভারি' | 'পণ্যের মান সমস্যা' | 'অতিরিক্ত মূল্য দাবি' | 'খারাপ আচরণ' | 'অন্যান্য';
  subject: string;
  description: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Dismissed';
  rating?: number;
  reportedDate: string;
  resolvedDate?: string;
  resolutionNotes?: string;
}

// ================= 📍 এলাকা ও ক্যাটাগরি মডেল =================
export interface AdminLocation {
  id: string;
  districtBn: string;
  districtEn: string;
  upazilasBn: string[];
  isActive: boolean;
  totalPros?: number;
}

export interface AdminServiceCategory {
  id: string;
  nameBn: string;
  nameEn: string;
  iconName: string;
  totalProfessionals: number;
  isFeatured: boolean;
  commissionRate: number;
}

const INITIAL_PROFESSIONALS_DATA: RegisteredProfessional[] = [];

const INITIAL_ORDERS_DATA: AdminOrder[] = [];

// ================= 👤 ব্যবহারকারী ডাটা (শুধুমাত্র প্রকৃত নিবন্ধিত ব্যবহারকারী) =================
export const INITIAL_USERS_DATA: AdminUserRecord[] = [];

// ================= 📣 টেক্সট ও নোটিশ ডিফল্ট ডাটা =================
export const INITIAL_ANNOUNCEMENTS_DATA: AdminAnnouncement[] = [];

// ================= 📢 হোমপেজ কনটেন্ট ডিফল্ট ডাটা =================
export const INITIAL_HOMEPAGE_CONTENT: AdminHomepageContent = {
  announcementTicker: {
    enabled: true,
    text: '🎉 পার্বত্য জুম ফসল ও অর্গানিক ফ্রুটসের স্পেশাল কালেকশন লাইভ! হোম ডেলিভারিতে ১০০% মানসম্মত ও সতেজ পণ্য।',
    tag: 'জরুরি বিজ্ঞপ্তি',
    speed: 'normal'
  },
  heroBanner: {
    title: 'পাহাড়ের সেরা অর্গানিক পণ্য ও দক্ষ কারিগর এক ছাদের নিচে',
    subtitle: 'রাঙ্গামাটি, খাগড়াছড়ি ও বান্দরবানের শতভাগ খাঁটি জুম ফসল, হস্তশিল্প ও বিশ্বস্ত টেকনিশিয়ানদের ডিজিটাল প্ল্যাটফর্ম।',
    badge: 'পার্বত্য ডিজিটাল হাব ২০২৬',
    primaryBtnText: 'পণ্য এক্সপ্লোর করুন'
  },
  helpline: {
    phone: '01800-000000',
    whatsapp: '01800-000000',
    emergencyAmbulance: '01800-999999',
    supportEmail: 'support@jhadimadi.com'
  },
  operationalSettings: {
    maintenanceMode: false,
    registrationOpen: true,
    codEnabled: true,
    minOrderAmount: 100,
    defaultDeliveryCharge: 60,
    platformCommissionPercent: 5
  }
};

// ================= 🖼️ ইমেজ ও মিডিয়া গ্যালারি ডিফল্ট ডাটা =================
export const INITIAL_MEDIA_DATA: AdminMediaItem[] = [];
export const INITIAL_BANNERS_DATA: AdminBanner[] = [];
export const INITIAL_BLOOD_DONORS_DATA: AdminBloodDonor[] = [];
export const INITIAL_COMPLAINTS_DATA: AdminComplaint[] = [];
export const INITIAL_LOCATIONS_DATA: AdminLocation[] = [];
export const INITIAL_SERVICE_CATEGORIES_DATA: AdminServiceCategory[] = [];

interface DataContextType {
  products: StoreProduct[];
  addProduct: (product: Partial<StoreProduct> & { nameBn: string; price: number }) => StoreProduct;
  updateProduct: (id: string, updated: Partial<StoreProduct>) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductPublishStatus: (id: string) => void;
  isProductsLoading?: boolean;
  productsError?: string | null;
  refreshProducts?: () => Promise<void>;
  
  professionals: RegisteredProfessional[];
  addProfessional: (pro: RegisteredProfessional) => void;
  updateProfessional: (id: string | number, updated: Partial<RegisteredProfessional>) => void;
  approveProfessional: (id: string | number) => void;
  rejectProfessional: (id: string | number, reason?: string) => void;
  deleteProfessional: (id: string | number) => Promise<void> | void;
  
  users: AdminUserRecord[];
  approveUser: (id: string | number) => void;
  rejectUser: (id: string | number, reason?: string) => void;
  deleteUser: (id: string | number) => Promise<void> | void;
  addUser: (user: Partial<AdminUserRecord> & { name: string; phone: string; role: AdminUserRecord['role'] }) => AdminUserRecord;
  updateUserRole: (id: string | number, newRole: AdminUserRecord['role'], roleLabelBn?: string) => void;
  updateUserStatus: (id: string | number, newStatus: AdminUserRecord['status']) => void;
  updateUserRecord: (id: string | number, updated: Partial<AdminUserRecord>) => void;
  
  orders: AdminOrder[];
  addOrder: (order: Omit<AdminOrder, 'id' | 'date'> & { id?: string; date?: string }) => AdminOrder;
  updateOrderStatus: (orderId: string, status: AdminOrder['status']) => void;
  deleteOrder: (orderId: string) => void;

  // 📢 ব্যানার ও বিজ্ঞাপন
  banners: AdminBanner[];
  setBanners: React.Dispatch<React.SetStateAction<AdminBanner[]>>;
  addBanner: (banner: Omit<AdminBanner, 'id' | 'createdAt'> & { id?: string }) => AdminBanner;
  updateBanner: (id: string, updated: Partial<AdminBanner>) => Promise<void> | void;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => void;

  // 📢 হোমপেজ কনটেন্ট ও সেটিংস
  homepageContent: AdminHomepageContent;
  updateHomepageContent: (content: Partial<AdminHomepageContent>) => void;

  // 📣 টেক্সট ও নোটিশ ঘোষণা
  announcements: AdminAnnouncement[];
  addAnnouncement: (announcement: Omit<AdminAnnouncement, 'id' | 'createdAt'> & { id?: string }) => AdminAnnouncement;
  updateAnnouncement: (id: string, updated: Partial<AdminAnnouncement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementPublish: (id: string) => void;

  // 🖼️ ইমেজ ও মিডিয়া গ্যালারি
  mediaLibrary: AdminMediaItem[];
  addMediaItem: (item: Omit<AdminMediaItem, 'id' | 'uploadedAt'> & { id?: string }) => AdminMediaItem;
  deleteMediaItem: (id: string) => void;

  // 🩸 রক্তদাতা ডিরেক্টরি
  bloodDonors: AdminBloodDonor[];
  addBloodDonor: (donor: Omit<AdminBloodDonor, 'id'> & { id?: string }) => AdminBloodDonor;
  updateBloodDonor: (id: string, updated: Partial<AdminBloodDonor>) => void;
  deleteBloodDonor: (id: string) => Promise<void> | void;
  toggleBloodDonorStatus: (id: string) => void;

  // 💬 কমপ্লেন ও রিভিউ
  complaints: AdminComplaint[];
  addComplaint: (complaint: Omit<AdminComplaint, 'id' | 'reportedDate'> & { id?: string }) => AdminComplaint;
  updateComplaint: (id: string, updated: Partial<AdminComplaint>) => void;
  deleteComplaint: (id: string) => void;
  resolveComplaint: (id: string, resolutionNotes: string) => void;

  // 📍 এলাকা ও জেলা
  locations: AdminLocation[];
  addLocation: (loc: Omit<AdminLocation, 'id'> & { id?: string }) => AdminLocation;
  updateLocation: (id: string, updated: Partial<AdminLocation>) => void;
  deleteLocation: (id: string) => void;
  addUpazilaToLocation: (districtId: string, upazilaName: string) => void;
  deleteUpazilaFromLocation: (districtId: string, upazilaName: string) => void;

  // 🏷️ ক্যাটাগরি সেটিংস
  serviceCategories: AdminServiceCategory[];
  addServiceCategory: (cat: Omit<AdminServiceCategory, 'id'> & { id?: string }) => AdminServiceCategory;
  updateServiceCategory: (id: string, updated: Partial<AdminServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;

  // 📰 পোস্ট ও কমিউনিটি ফিড (100% Real-time Synced with Database & Offline)
  posts: FeedPost[];
  addPost: (post: Omit<FeedPost, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => FeedPost;
  updatePost: (id: string, updated: Partial<FeedPost>) => void;
  deletePost: (id: string) => void;
  approvePost: (id: string) => void;
  rejectPost: (id: string, reason?: string) => void;

  // 🔴 লাইভ ড্রাফট প্রিভিউ স্টেট (Real-time Typing Feedback to Mobile Frame)
  activeDraftPreview: { type: 'product' | 'post' | 'banner' | 'none'; data: any } | null;
  setActiveDraftPreview: (draft: { type: 'product' | 'post' | 'banner' | 'none'; data: any } | null) => void;
  
  resetToDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ১. পণ্য তালিকা (Store Products - Dynamic Supabase Database Only, Locked Ascending Order)
  const [products, setProducts] = useState<StoreProduct[]>(() => {
    const cached = offlineStorage.getItem<StoreProduct[]>(OFFLINE_KEYS.PRODUCTS, []);
    const clean = (cached || []).filter(p => !isLegacyDemoProduct(p));
    return sortProductsAscending(clean);
  });
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // ২. পেশাজীবী তালিকা (Registered Professionals - Real Data Only)
  const [professionals, setProfessionals] = useState<RegisteredProfessional[]>(() => {
    const saved = offlineStorage.getItem<RegisteredProfessional[]>('jhadimadi_offline_professionals_v2', []);
    return (saved || []).filter(p => p && p.name && !String(p.memberId || '').startsWith('JDM-2026-1011') && !String(p.id || '').startsWith('pro_mock'));
  });

  // ৩. ইউজার ও সেলার রেকর্ডস (Admin User Records - Real Data Only)
  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    const saved = offlineStorage.getItem<AdminUserRecord[]>('jhadimadi_admin_users_v2', []);
    return (saved || []).filter(u => u && u.name && !String(u.id || '').startsWith('USR-1'));
  });

  // ৪. অর্ডার তালিকা (Orders)
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    return offlineStorage.getItem<AdminOrder[]>('jhadimadi_admin_orders_v2', []);
  });

  // ৫. ব্যানার ও বিজ্ঞাপন (Banners)
  const [banners, setBanners] = useState<AdminBanner[]>(() => {
    const raw = offlineStorage.getItem<AdminBanner[]>('jhadimadi_admin_banners_v1', []);
    if (!Array.isArray(raw)) return [];
    return raw.map(b => ({
      ...b,
      id: b.id && String(b.id).trim() 
        ? String(b.id).trim() 
        : ((typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') 
            ? crypto.randomUUID() 
            : ('banner_' + Math.random().toString(36).substring(2, 9)))
    }));
  });

  // ৬. রক্তদাতা ডিরেক্টরি (Blood Donors - Strictly empty array initial state, Live Supabase on mount)
  const [bloodDonors, setBloodDonors] = useState<AdminBloodDonor[]>([]);

  // ৭. কমপ্লেন ও রিভিউ মোডারেশন (Complaints)
  const [complaints, setComplaints] = useState<AdminComplaint[]>(() => {
    return offlineStorage.getItem<AdminComplaint[]>('jhadimadi_admin_complaints_v2', []);
  });

  // ৮. এলাকা ও উপজেলা সেটিংস (Locations)
  const [locations, setLocations] = useState<AdminLocation[]>(() => {
    return offlineStorage.getItem<AdminLocation[]>('jhadimadi_admin_locations_v2', []);
  });

  // ৯. সার্ভিস ক্যাটাগরি তালিকা (Service Categories)
  const [serviceCategories, setServiceCategories] = useState<AdminServiceCategory[]>(() => {
    const cached = offlineStorage.getItem<AdminServiceCategory[]>('jhadimadi_admin_categories_v2', []);
    return (cached && cached.length > 0) ? cached : (HARDCODED_FALLBACK_CATEGORIES as any);
  });

  // ১০. হোমপেজ কনটেন্ট ও সেটিংস
  const [homepageContent, setHomepageContent] = useState<AdminHomepageContent>(() => {
    return offlineStorage.getItem<AdminHomepageContent>('jhadimadi_admin_homepage_content_v2', INITIAL_HOMEPAGE_CONTENT);
  });

  // ১১. টেক্সট ও নোটিশ ঘোষণা (Announcements)
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>(() => {
    return offlineStorage.getItem<AdminAnnouncement[]>('jhadimadi_admin_announcements_v2', []);
  });

  // ১২. মিডিয়া ও ইমেজ গ্যালারি (Media Library)
  const [mediaLibrary, setMediaLibrary] = useState<AdminMediaItem[]>(() => {
    return offlineStorage.getItem<AdminMediaItem[]>('jhadimadi_admin_media_v2', []);
  });

  // ১৩. পোস্ট ও কমিউনিটি ফিড (Posts & Community Feed - Clean Real-time Persistent)
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    let saved = offlineStorage.getItem<FeedPost[]>(OFFLINE_KEYS.POSTS, []);
    if (saved && saved.length > 0) {
      // Purge any dummy/mock initial posts
      const filtered = saved.filter(p => p.id && !p.id.startsWith('post_init_'));
      return filtered;
    }
    return [];
  });

  // ১৪. লাইভ ড্রাফট প্রিভিউ স্টেট (Real-time Typing Feedback to Mobile Preview)
  const [activeDraftPreview, setActiveDraftPreviewState] = useState<{ type: 'product' | 'post' | 'banner' | 'none'; data: any } | null>(null);

  const setActiveDraftPreview = useCallback((draft: { type: 'product' | 'post' | 'banner' | 'none'; data: any } | null) => {
    setActiveDraftPreviewState(draft);
    broadcastSync('draft_preview', draft);
  }, []);

  // Fetch backend homepage content if available (deferred to background)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/admin/homepage-content')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.content) {
            setHomepageContent(data.content);
            offlineStorage.saveItem('jhadimadi_admin_homepage_content_v2', data.content);
          }
        })
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_announcements_v2', announcements);
  }, [announcements]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_media_v2', mediaLibrary);
  }, [mediaLibrary]);

  const isPullingProductsRef = useRef(false);

  // Cloud-native dynamic pull for products directly from databaseService
  const pullProductsFromDb = useCallback(async () => {
    if (isPullingProductsRef.current) return;
    isPullingProductsRef.current = true;
    setIsProductsLoading(true);
    setProductsError(null);
    try {
      let cleanProducts: StoreProduct[] = [];
      try {
        const dbProducts = await databaseService.fetchProductsFromDatabase();
        if (dbProducts && Array.isArray(dbProducts) && dbProducts.length > 0) {
          const nonLegacy = dbProducts.filter(p => !isLegacyDemoProduct(p));
          const seenKeys = new Set<string>();
          const deduplicated = nonLegacy.filter(p => {
            const skuKey = (p.sku || p.code || '').trim().toLowerCase();
            const idKey = p.id ? String(p.id).trim().toLowerCase() : '';
            const key = skuKey || idKey;
            if (!key) return true;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });
          cleanProducts = sortProductsAscending(deduplicated);
        }
      } catch (fbErr) {
        console.info('[DataContext] databaseService products pull notice:', fbErr);
      }

      // Update state: persist clean products or preserve existing cache on error/empty
      if (cleanProducts.length > 0) {
        setProducts(cleanProducts);
        offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, cleanProducts);
      } else {
        // Resilient fallback: Preserve existing products or offline cached products
        const localCached = offlineStorage.getItem<StoreProduct[]>(OFFLINE_KEYS.PRODUCTS, []);
        if (localCached && localCached.length > 0) {
          setProducts(localCached);
        }
      }
    } catch (err: any) {
      console.info('[DataContext] Notice fetching products from cloud database:', err);
      const localCached = offlineStorage.getItem<StoreProduct[]>(OFFLINE_KEYS.PRODUCTS, []);
      if (localCached && localCached.length > 0) {
        setProducts(localCached);
      }
      setProductsError(err?.message || 'পণ্য লোড হতে সাময়িক বিলম্ব হচ্ছে');
    } finally {
      setIsProductsLoading(false);
      isPullingProductsRef.current = false;
    }
  }, []);

  // Live Server Database & Supabase synchronization for real registered users & profiles
  useEffect(() => {
    const syncFromProfiles = (dbUsers: any[]) => {
      const sanitizedUsers = (dbUsers || []).filter(u => u && u.name && !String(u.id || '').startsWith('USR-1'));
      setUsers(() => {
        return sanitizedUsers.map(dbU => ({
          id: dbU.id,
          name: dbU.fullName || dbU.name || "ব্যবহারকারী",
          role: (dbU.role as any) || "customer",
          roleLabelBn: dbU.professionBn || dbU.profession || (dbU.role === 'service_provider' || dbU.role === 'professional' ? 'দক্ষ কারিগর' : 'সাধারণ গ্রাহক'),
          phone: dbU.phone || dbU.phoneMasked || "",
          email: dbU.email || "",
          district: dbU.district || "",
          upazila: dbU.upazila || "",
          area: dbU.mahalla || dbU.para || "",
          bloodGroup: dbU.bloodGroup || "",
          status: dbU.isNidVerified ? "Approved" : "Pending",
          createdAt: dbU.createdAt ? String(dbU.createdAt).split("T")[0] : new Date().toISOString().split("T")[0],
          avatar: dbU.avatar || "",
          nid: dbU.nidNumber || "",
          notes: dbU.bio || "",
          professionalProfile: (dbU.role === "professional" || dbU.role === "service_provider" || (dbU.profession && dbU.profession !== "সাধারন নাগরিক")) ? {
            id: dbU.id,
            name: dbU.fullName || dbU.name || "",
            phone: dbU.phone || dbU.phoneMasked || "",
            job: dbU.professionBn || dbU.profession || "",
            district: dbU.district || "",
            upazila: dbU.upazila || "",
            area: dbU.mahalla || dbU.para || "",
            verified: Boolean(dbU.isNidVerified),
            available: Boolean(dbU.isAvailable ?? true),
            experience: dbU.experienceYears ? `${dbU.experienceYears} বছর` : "০ বছর",
            dailyRate: dbU.dailyRate ? `${dbU.dailyRate} টাকা` : "০ টাকা",
            memberId: dbU.memberId || dbU.id,
            skills: dbU.skills || [],
            rating: dbU.rating || 0,
            completedJobs: dbU.completedJobs || 0,
            bloodGroup: dbU.bloodGroup || "",
            isBloodDonor: Boolean(dbU.isBloodDonor),
            bio: dbU.bio || ""
          } : undefined
        }));
      });

      setProfessionals(() => {
        const proUsers = sanitizedUsers.filter(u => u.role === "professional" || u.role === "service_provider" || (u.profession && u.profession !== "সাধারন নাগরিক"));
        return proUsers.map(pu => ({
          id: pu.id,
          name: pu.fullName || pu.name || "",
          phone: pu.phone || pu.phoneMasked || "",
          job: pu.professionBn || pu.profession || "",
          district: pu.district || "",
          upazila: pu.upazila || "",
          area: pu.mahalla || pu.para || "",
          verified: Boolean(pu.isNidVerified),
          available: Boolean(pu.isAvailable ?? true),
          experience: pu.experienceYears ? `${pu.experienceYears} বছর` : "০ বছর",
          dailyRate: pu.dailyRate ? `${pu.dailyRate} টাকা` : "০ টাকা",
          memberId: pu.memberId || pu.id,
          skills: pu.skills || [],
          rating: pu.rating || 0,
          completedJobs: pu.completedJobs || 0,
          bloodGroup: pu.bloodGroup || "",
          isBloodDonor: Boolean(pu.isBloodDonor),
          bio: pu.bio || ""
        }));
      });
    };

    const pullUsersFromDb = async () => {
      try {
        const dbUsers = await databaseService.fetchUsersFromDatabase();
        if (dbUsers) {
          syncFromProfiles(dbUsers);
        }
      } catch (err) {
        console.warn("Error syncing users from databaseService:", err);
      }
    };

    const unsubscribe = databaseService.subscribe(() => {
      const cached = databaseService.getAllUserProfiles();
      if (cached && cached.length > 0) {
        syncFromProfiles(cached);
      }
    });

    // Initial dynamic pull for platform banners
    const pullBannersFromDb = async () => {
      try {
        const dbBanners = await databaseService.fetchBannersFromDatabase();
        if (dbBanners && Array.isArray(dbBanners) && dbBanners.length > 0) {
          const sanitized: AdminBanner[] = dbBanners.map(b => {
            const img = b.image_url || (b as any).image || b.imageUrl || '';
            const link = b.link_url || b.targetLink || b.linkUrl || '/';
            return {
              ...b,
              imageUrl: img,
              image_url: img,
              image: img,
              link_url: link,
              linkUrl: link,
              targetLink: link,
              id: b.id && String(b.id).trim() 
                ? String(b.id).trim() 
                : ((typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') 
                    ? crypto.randomUUID() 
                    : ('banner_' + Math.random().toString(36).substring(2, 9)))
            };
          });

          setBanners(prev => {
            if (!prev || prev.length === 0) {
              offlineStorage.saveItem('jhadimadi_admin_banners_v1', sanitized);
              return sanitized;
            }
            // Merge gracefully without wiping out freshly added local banners:
            const bannerMap = new Map<string, AdminBanner>();
            sanitized.forEach(b => bannerMap.set(b.id, b));
            prev.forEach(b => {
              if (!bannerMap.has(b.id)) {
                bannerMap.set(b.id, b); // keep existing created banners
              }
            });
            const merged = Array.from(bannerMap.values()).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            offlineStorage.saveItem('jhadimadi_admin_banners_v1', merged);
            return merged;
          });
        }
        // CRITICAL: Do NOT clear or reset the global banner state to an empty array upon submission error or re-fetch.
      } catch (err) {
        console.warn('[DataContext] Error fetching banners from database:', err);
      }
    };

    // Initial dynamic pull for community posts
    const pullPostsFromDb = async () => {
      try {
        const dbPosts = await databaseService.fetchPostsFromDatabase();
        if (dbPosts && Array.isArray(dbPosts)) {
          const clean = dbPosts.filter(p => p.id && !p.id.startsWith('post_init_'));
          setPosts(clean);
          offlineStorage.saveItem(OFFLINE_KEYS.POSTS, clean);
        }
      } catch (err) {
        console.warn('[DataContext] Error fetching posts from database:', err);
      }
    };

    // Initial dynamic pull for service categories
    const pullCategoriesFromDb = async () => {
      try {
        const dbCategories = await databaseService.fetchCategoriesFromDatabase();
        if (dbCategories && Array.isArray(dbCategories) && dbCategories.length > 0) {
          setServiceCategories(dbCategories);
          offlineStorage.saveItem('jhadimadi_admin_categories_v2', dbCategories);
        } else {
          setServiceCategories(HARDCODED_FALLBACK_CATEGORIES as any);
        }
      } catch (err) {
        console.warn('[DataContext] Error fetching categories from database:', err);
        setServiceCategories(HARDCODED_FALLBACK_CATEGORIES as any);
      }
    };

    // Initial dynamic pull for orders from Supabase
    const pullOrdersFromDb = async () => {
      try {
        const dbOrders = await databaseService.fetchOrdersFromDatabase();
        if (dbOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
          setOrders(dbOrders);
          offlineStorage.saveItem('jhadimadi_admin_orders_v2', dbOrders);
        }
      } catch (err) {
        console.warn('[DataContext] Error fetching orders from database:', err);
      }
    };

    // Initial dynamic pull for blood donors from Supabase & backend
    const pullBloodDonorsFromDb = async () => {
      try {
        const dbDonors = await databaseService.fetchBloodDonorsFromDatabase();
        if (dbDonors && Array.isArray(dbDonors)) {
          setBloodDonors(dbDonors);
          offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', dbDonors);
          offlineStorage.saveItem('jhadimadi_admin_blood_donors_v2', dbDonors);
        }
      } catch (err) {
        console.warn('[DataContext] Error fetching blood donors from database:', err);
      }
    };

    // Stagger database pulls asynchronously across timed stages to prevent burst spikes and 429 errors
    const scheduleInitPulls = () => {
      // Stage 1: High priority store products first
      pullProductsFromDb().catch(() => {});

      // Stage 2: Store banners & categories after short delay
      setTimeout(() => {
        pullCategoriesFromDb().catch(() => {});
        pullBannersFromDb().catch(() => {});
      }, 150);

      // Stage 3: User profiles, community posts, orders, and donors
      setTimeout(() => {
        pullUsersFromDb().catch(() => {});
        pullPostsFromDb().catch(() => {});
        pullOrdersFromDb().catch(() => {});
        pullBloodDonorsFromDb().catch(() => {});
      }, 400);
    };

    let deferredPullTimer: any = null;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      deferredPullTimer = (window as any).requestIdleCallback(scheduleInitPulls, { timeout: 1600 });
    } else {
      deferredPullTimer = setTimeout(scheduleInitPulls, 450);
    }

    // Listen for realtime database changes across all entities
    const unsubProducts = databaseService.subscribeEntity('products', () => {
      pullProductsFromDb().catch(() => {});
    });

    const unsubBanners = databaseService.subscribeEntity('banners', () => {
      pullBannersFromDb().catch(() => {});
    });

    const unsubPosts = databaseService.subscribeEntity('posts', () => {
      pullPostsFromDb().catch(() => {});
    });

    const unsubCategories = databaseService.subscribeEntity('categories', () => {
      pullCategoriesFromDb().catch(() => {});
    });

    const unsubOrders = databaseService.subscribeEntity('orders', () => {
      pullOrdersFromDb().catch(() => {});
    });

    const unsubBloodDonors = databaseService.subscribeEntity('blood_donors', () => {
      pullBloodDonorsFromDb().catch(() => {});
    });

    const unsubUsers = databaseService.subscribeEntity('users', () => {
      pullUsersFromDb().catch(() => {});
    });

    let unsubAllTimer: any = null;
    const unsubAll = databaseService.subscribeEntity('all', () => {
      if (unsubAllTimer) clearTimeout(unsubAllTimer);
      unsubAllTimer = setTimeout(() => {
        scheduleInitPulls();
      }, 600);
    });

    // Multi-tab sync message handler (updates preview and other open tabs instantly)
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;
      const { type, payload } = event.data;
      if (type === 'products' && Array.isArray(payload)) {
        const clean = sortProductsAscending(payload.filter((p: any) => !isLegacyDemoProduct(p)));
        setProducts(clean);
      } else if (type === 'banners' && Array.isArray(payload)) {
        setBanners(payload);
      } else if (type === 'categories' && Array.isArray(payload)) {
        setServiceCategories(payload);
      } else if (type === 'orders' && Array.isArray(payload)) {
        setOrders(payload);
      } else if (type === 'posts' && Array.isArray(payload)) {
        setPosts(payload);
      } else if (type === 'blood_donors' && Array.isArray(payload)) {
        setBloodDonors(payload);
      } else if (type === 'draft_preview') {
        setActiveDraftPreviewState(payload);
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcastMessage);
    }

    // Remote server sync event handler (fires on background sync update)
    const handleRemoteSync = (event: any) => {
      const data = event.detail;
      if (!data) return;
      if (Array.isArray(data.products)) {
        const clean: StoreProduct[] = sortProductsAscending<StoreProduct>(data.products.filter((p: any) => !isLegacyDemoProduct(p)));
        setProducts(clean);
        offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, clean);
      }
      if (Array.isArray(data.banners)) {
        setBanners(data.banners);
        offlineStorage.saveItem('jhadimadi_admin_banners_v1', data.banners);
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setServiceCategories(data.categories);
        offlineStorage.saveItem('jhadimadi_admin_categories_v2', data.categories);
      }
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        setPosts(data.posts);
        offlineStorage.saveItem(OFFLINE_KEYS.POSTS, data.posts);
      }
    };
    window.addEventListener('jhadimadi_remote_sync', handleRemoteSync);

    // Cross-tab storage change fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === OFFLINE_KEYS.PRODUCTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const clean = sortProductsAscending(parsed.filter((p: any) => !isLegacyDemoProduct(p)));
            setProducts(clean);
          }
        } catch {}
      } else if (e.key === 'jhadimadi_admin_banners_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setBanners(parsed);
        } catch {}
      } else if (e.key === 'jhadimadi_admin_categories_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setServiceCategories(parsed);
        } catch {}
      } else if (e.key === OFFLINE_KEYS.POSTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPosts(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (deferredPullTimer) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(deferredPullTimer);
        } else {
          clearTimeout(deferredPullTimer);
        }
      }
      unsubscribe();
      unsubUsers();
      unsubProducts();
      unsubBanners();
      unsubPosts();
      unsubCategories();
      unsubOrders();
      unsubBloodDonors();
      unsubAll();
      window.removeEventListener('jhadimadi_remote_sync', handleRemoteSync);
      window.removeEventListener('storage', handleStorageChange);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcastMessage);
      }
    };
  }, []);

  // Sync state changes to offline storage
  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.POSTS, posts);
  }, [posts]);

  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.PROFESSIONALS, professionals);
  }, [professionals]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_users_v2', users);
  }, [users]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_orders_v2', orders);
  }, [orders]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_banners_v1', banners);
  }, [banners]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', bloodDonors);
  }, [bloodDonors]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_complaints_v2', complaints);
  }, [complaints]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_locations_v2', locations);
  }, [locations]);

  useEffect(() => {
    offlineStorage.saveItem('jhadimadi_admin_categories_v2', serviceCategories);
  }, [serviceCategories]);

  // Product Operations (Direct Unified Database Engine Binding)
  const addProduct = (prodData: Omit<StoreProduct, 'id'> & { id?: string }): StoreProduct => {
    const newProduct: StoreProduct = {
      ...prodData,
      id: prodData.id || `prod_${Date.now()}`,
      rating: prodData.rating || 5.0,
      reviewsCount: prodData.reviewsCount || 1,
      features: prodData.features || [],
      originalPrice: prodData.originalPrice || prodData.price,
      unit: prodData.unit || '১ পিস',
      origin: prodData.origin || prodData.productionOrigin || 'পার্বত্য চট্টগ্রাম',
      isPublished: prodData.isPublished !== false
    };

    setProducts(prev => {
      const targetSku = (newProduct.sku || newProduct.code || '').trim().toLowerCase();
      const existingIdx = prev.findIndex(p => 
        p.id === newProduct.id || 
        (targetSku && (String(p.sku || '').trim().toLowerCase() === targetSku || String(p.code || '').trim().toLowerCase() === targetSku))
      );
      let updatedList: StoreProduct[];
      if (existingIdx >= 0) {
        updatedList = [...prev];
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...newProduct };
      } else {
        updatedList = [...prev, newProduct];
      }
      const next = sortProductsAscending(updatedList);
      offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, next);
      broadcastSync('products', next);
      return next;
    });

    // Save directly to Unified Database (server file + Supabase) in real-time
    databaseService.saveProductToDatabase(newProduct).catch(err => {
      console.warn('[DataContext] Background error saving product to database:', err);
    });

    return newProduct;
  };

  const updateProduct = async (id: string, updated: Partial<StoreProduct>) => {
    let targetProduct: StoreProduct | null = null;
    setProducts(prev => {
      const next = sortProductsAscending(prev.map(p => {
        if (p.id === id) {
          targetProduct = { ...p, ...updated };
          return targetProduct;
        }
        return p;
      }));
      offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, next);
      broadcastSync('products', next);
      return next;
    });

    if (targetProduct) {
      databaseService.invalidateCache('products');
      // Save directly to Unified Database in real-time
      try {
        await databaseService.saveProductToDatabase(targetProduct);
      } catch (err) {
        console.warn('[DataContext] Background error updating product in database:', err);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    const dbId = toDatabaseUuid(id);
    const targetProduct = products.find(p => p.id === id || p.id === dbId);

    // 0. Instantly update the local UI state so deletions reflect immediately
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id && p.id !== dbId);
      offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, next);
      broadcastSync('products', next);
      return next;
    });

    // 1. Explicitly execute DELETE query against Supabase for targeted table and await completion
    if (isSupabaseConfigured) {
      try {
        await resilientSupabaseDelete('products', {
          id: id,
          title: targetProduct?.nameBn || (targetProduct as any)?.title_bn || (targetProduct as any)?.title || (targetProduct as any)?.name,
          image_url: targetProduct?.image,
          sku: targetProduct?.sku
        });
      } catch (err) {
        console.warn('[DataContext] Direct Supabase delete product note:', err);
      }

      // If product has matching name or storage image, clean them up
      if (targetProduct) {
        const nameToMatch = targetProduct.nameBn || (targetProduct as any).title_bn || (targetProduct as any).title || (targetProduct as any).name;
        if (nameToMatch) {
          try {
            await supabase.from('products').delete().eq('name', nameToMatch);
          } catch (_) {}
        }
        if (targetProduct.image && typeof targetProduct.image === 'string') {
          try {
            const url = targetProduct.image;
            const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.*)$/i);
            if (m && m[1] && m[2]) {
              const bucket = m[1];
              const filePath = decodeURIComponent(m[2].split('?')[0]);
              await supabase.storage.from(bucket).remove([filePath]);
            }
          } catch (_) {}
        }
      }
    }

    // 2. Mirror deletion through backend and cloud storage and await completion
    try {
      await databaseService.deleteProductFromDatabase(id);
    } catch (err) {
      console.warn('[DataContext] Background error deleting product from database:', err);
    }

    databaseService.invalidateCache('products');
  };

  const toggleProductPublishStatus = (id: string) => {
    let targetProduct: StoreProduct | null = null;
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          targetProduct = { ...p, isPublished: p.isPublished === false ? true : false };
          return targetProduct;
        }
        return p;
      });
      offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, next);
      broadcastSync('products', next);
      return next;
    });

    if (targetProduct) {
      // Save updated publish status directly to Unified Database
      databaseService.saveProductToDatabase(targetProduct).catch(err => {
        console.warn('[DataContext] Background error toggling product publish in database:', err);
      });
    }
  };

  // ====================================================
  // FEED POSTS & COMMUNITY (100% Real-time & Synced)
  // ====================================================

  const addPost = (postData: Omit<FeedPost, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): FeedPost => {
    const newPost: FeedPost = {
      ...postData,
      id: postData.id || `post_${Date.now()}`,
      status: postData.status || 'Approved',
      createdAt: postData.createdAt || 'এখনই',
      likes: postData.likes || 0,
      commentsCount: postData.commentsCount || 0,
      contactPhoneHidden: postData.contactPhoneHidden || (postData.realPhone ? `${postData.realPhone.slice(0, 5)}XX-XXX` : '+880 17XX-XXXXXX')
    };

    setPosts(prev => {
      const next = [newPost, ...prev];
      offlineStorage.saveItem(OFFLINE_KEYS.POSTS, next);
      broadcastSync('posts', next);
      return next;
    });

    // Also persist to local posts cache
    try {
      const local = offlineStorage.getItem<any[]>('jhadimadi_local_posts', []);
      offlineStorage.saveItem('jhadimadi_local_posts', [newPost, ...local]);
    } catch {}

    // Save directly to Unified Database in real-time
    databaseService.savePostToDatabase(newPost).catch(err => {
      console.warn('[DataContext] Background error saving post to database:', err);
    });

    return newPost;
  };

  const updatePost = (id: string, updated: Partial<FeedPost>) => {
    let targetPost: FeedPost | null = null;
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          targetPost = { ...p, ...updated };
          return targetPost;
        }
        return p;
      });
      offlineStorage.saveItem(OFFLINE_KEYS.POSTS, next);
      broadcastSync('posts', next);
      return next;
    });

    if (targetPost) {
      // Save directly to Unified Database in real-time
      databaseService.savePostToDatabase(targetPost).catch(err => {
        console.warn('[DataContext] Background error updating post in database:', err);
      });
    }
  };

  const deletePost = (id: string) => {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      offlineStorage.saveItem(OFFLINE_KEYS.POSTS, next);
      broadcastSync('posts', next);
      return next;
    });

    // Also remove from local posts cache
    try {
      const local = offlineStorage.getItem<any[]>('jhadimadi_local_posts', []);
      offlineStorage.saveItem('jhadimadi_local_posts', local.filter((p: any) => p.id !== id));
    } catch {}

    // Delete directly from Unified Database
    databaseService.deletePostFromDatabase(id).catch(err => {
      console.warn('[DataContext] Background error deleting post from database:', err);
    });
  };

  const approvePost = (id: string) => {
    updatePost(id, { status: 'Approved' });
  };

  const rejectPost = (id: string, _reason?: string) => {
    updatePost(id, { status: 'Rejected' });
  };

  // Professional Operations
  const addProfessional = (pro: RegisteredProfessional) => {
    setProfessionals(prev => {
      const idx = prev.findIndex(p => p.id === pro.id || (p.phone && p.phone === pro.phone));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = pro;
        return copy;
      }
      return [pro, ...prev];
    });

    // Also add/update in users table
    setUsers(prev => {
      const existing = prev.find(u => u.phone === pro.phone || String(u.id) === String(pro.id));
      if (existing) {
        return prev.map(u => (u.phone === pro.phone || String(u.id) === String(pro.id)) ? {
          ...u,
          name: pro.name,
          roleLabelBn: pro.job,
          district: pro.district,
          upazila: pro.upazila,
          status: pro.verified ? 'Approved' : 'Pending',
          avatar: pro.img,
          nid: pro.nid,
          professionalProfile: pro
        } : u);
      }
      const newUser: AdminUserRecord = {
        id: pro.id || `usr_pro_${Date.now()}`,
        name: pro.name,
        role: 'professional',
        roleLabelBn: pro.job,
        phone: pro.phone,
        email: pro.email,
        district: pro.district,
        upazila: pro.upazila,
        status: pro.verified ? 'Approved' : 'Pending',
        createdAt: new Date().toISOString().split('T')[0],
        avatar: pro.img,
        nid: pro.nid,
        notes: pro.bio,
        professionalProfile: pro
      };
      return [newUser, ...prev];
    });

    // Also persist directly to database backend
    databaseService.registerProvider({
      id: String(pro.id),
      fullName: pro.name,
      phone: pro.phone,
      email: pro.email,
      district: pro.district,
      upazila: pro.upazila,
      mahalla: pro.area,
      profession: pro.job,
      professionBn: pro.job,
      serviceCategory: pro.job,
      skills: pro.skills,
      experienceYears: parseInt(String(pro.experience || '').replace(/[^0-9]/g, '')) || 1,
      dailyRate: String(pro.dailyRate || '').replace(/[^0-9]/g, ''),
      rating: pro.rating,
      completedJobs: pro.completedJobs,
      bloodGroup: pro.bloodGroup,
      isBloodDonor: pro.isBloodDonor,
      avatar: pro.img,
      nidNumber: pro.nid,
      bio: pro.bio
    }).catch(err => console.warn('[DataContext] addProfessional db sync note:', err));
  };

  const updateProfessional = (id: string | number, updated: Partial<RegisteredProfessional>) => {
    setProfessionals(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...updated } : p));
  };

  const approveProfessional = (id: string | number) => {
    setProfessionals(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        return { ...p, verified: true };
      }
      return p;
    }));

    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(id) || (u.professionalProfile && String(u.professionalProfile.id) === String(id))) {
        return { 
          ...u, 
          status: 'Approved',
          professionalProfile: u.professionalProfile ? { ...u.professionalProfile, verified: true } : undefined
        };
      }
      return u;
    }));
  };

  const rejectProfessional = (id: string | number, reason?: string) => {
    setProfessionals(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        return { ...p, verified: false };
      }
      return p;
    }));

    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(id) || (u.professionalProfile && String(u.professionalProfile.id) === String(id))) {
        return { 
          ...u, 
          status: 'Rejected',
          notes: reason ? `বাতিলের কারণ: ${reason}` : u.notes,
          professionalProfile: u.professionalProfile ? { ...u.professionalProfile, verified: false } : undefined
        };
      }
      return u;
    }));
  };

  const deleteProfessional = async (id: string | number) => {
    const targetId = String(id);
    try {
      if (isSupabaseConfigured) {
        await supabase.from('service_providers').delete().eq('id', targetId);
        await supabase.from('profiles').delete().eq('id', targetId);
        await supabase.from('user_roles').delete().eq('user_id', targetId);
      }
    } catch (err) {
      console.warn('[DataContext] Supabase delete professional note:', err);
    }
    await databaseService.deleteUser(targetId);

    setProfessionals(prev => prev.filter(p => String(p.id) !== targetId));
    setUsers(prev => prev.filter(u => String(u.id) !== targetId));
  };

  // User Operations
  const approveUser = (id: string | number) => {
    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(id)) {
        return { ...u, status: 'Approved' };
      }
      return u;
    }));

    // If it is also a professional, verify them
    setProfessionals(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        return { ...p, verified: true };
      }
      return p;
    }));
  };

  const rejectUser = (id: string | number, reason?: string) => {
    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(id)) {
        return { ...u, status: 'Rejected', notes: reason ? `বাতিলের কারণ: ${reason}` : u.notes };
      }
      return u;
    }));

    setProfessionals(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        return { ...p, verified: false };
      }
      return p;
    }));
  };

  const deleteUser = async (id: string | number) => {
    const targetId = String(id);
    try {
      if (isSupabaseConfigured) {
        await supabase.from('profiles').delete().eq('id', targetId);
        await supabase.from('user_roles').delete().eq('user_id', targetId);
      }
    } catch (err) {
      console.warn('[DataContext] Supabase delete user note:', err);
    }
    await databaseService.deleteUser(targetId);
    setUsers(prev => prev.filter(u => String(u.id) !== targetId));
    setProfessionals(prev => prev.filter(p => String(p.id) !== targetId));
  };

  const addUser = (userData: Partial<AdminUserRecord> & { name: string; phone: string; role: AdminUserRecord['role'] }): AdminUserRecord => {
    const newUser: AdminUserRecord = {
      ...userData,
      id: userData.id || `USR-${Math.floor(200 + Math.random() * 800)}`,
      district: userData.district || 'খাগড়াছড়ি',
      upazila: userData.upazila || 'খাগড়াছড়ি সদর',
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
      status: userData.status || 'Approved',
      roleLabelBn: userData.roleLabelBn || (userData.role === 'seller' ? 'বিক্রেতা' : userData.role === 'professional' ? 'পেশাজীবী' : userData.role === 'blood_donor' ? 'রক্তদাতা' : 'সাধারণ গ্রাহক')
    };
    setUsers(prev => [newUser, ...prev]);

    // Persist to backend database API
    databaseService.saveUserToDatabase({
      id: String(newUser.id),
      name: newUser.name,
      fullName: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      district: newUser.district,
      upazila: newUser.upazila,
      mahalla: newUser.area,
      para: newUser.area,
      bloodGroup: newUser.bloodGroup,
      avatar: newUser.avatar,
      bio: newUser.notes,
      isNidVerified: newUser.status === 'Approved'
    }).catch(err => console.warn('[DataContext] addUser db sync note:', err));

    return newUser;
  };

  const updateUserRole = (id: string | number, newRole: AdminUserRecord['role'], roleLabelBn?: string) => {
    setUsers(prev => prev.map(u => String(u.id) === String(id) ? {
      ...u,
      role: newRole,
      roleLabelBn: roleLabelBn || (newRole === 'seller' ? 'বিক্রেতা' : newRole === 'professional' ? 'পেশাজীবী' : newRole === 'blood_donor' ? 'রক্তদাতা' : 'সাধারণ গ্রাহক')
    } : u));
  };

  const updateUserStatus = (id: string | number, newStatus: AdminUserRecord['status']) => {
    setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, status: newStatus } : u));
  };

  const updateUserRecord = (id: string | number, updated: Partial<AdminUserRecord>) => {
    setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, ...updated } : u));
  };

  // 📢 হোমপেজ কনটেন্ট মেথডস
  const updateHomepageContent = (content: Partial<AdminHomepageContent>) => {
    setHomepageContent(prev => {
      const merged = { ...prev, ...content };
      offlineStorage.saveItem('jhadimadi_admin_homepage_content_v2', merged);
      
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('jhadimadi_admin_token') : null;
      if (token) {
        fetch('/api/admin/homepage-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token
          },
          body: JSON.stringify(merged)
        }).catch(err => console.warn('Failed to sync homepage content with backend:', err));
      }
      return merged;
    });
  };

  // 📣 ঘোষণা মেথডস
  const addAnnouncement = (annData: Omit<AdminAnnouncement, 'id' | 'createdAt'> & { id?: string }): AdminAnnouncement => {
    const newAnn: AdminAnnouncement = {
      ...annData,
      id: annData.id || `ANN-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    return newAnn;
  };

  const updateAnnouncement = (id: string, updated: Partial<AdminAnnouncement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleAnnouncementPublish = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPublished: !a.isPublished } : a));
  };

  // 🖼️ মিডিয়া লাইব্রেরি মেথডস
  const addMediaItem = (itemData: Omit<AdminMediaItem, 'id' | 'uploadedAt'> & { id?: string }): AdminMediaItem => {
    const newItem: AdminMediaItem = {
      ...itemData,
      id: itemData.id || `MED-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setMediaLibrary(prev => [newItem, ...prev]);
    return newItem;
  };

  const deleteMediaItem = (id: string) => {
    setMediaLibrary(prev => prev.filter(m => m.id !== id));
  };

  // Order Operations
  const addOrder = (orderData: Omit<AdminOrder, 'id' | 'date'> & { id?: string; date?: string }): AdminOrder => {
    const newOrder: AdminOrder = {
      isBetaPhase: true,
      commissionRate: 0,
      commissionAmount: 0,
      commissionStatus: 'exempt',
      paymentStatus: 'pending',
      orderChannel: orderData.paymentMethod === 'Direct_Contact' ? 'Direct_Contact' : 'COD',
      gatewayName: null,
      gatewayTransactionId: null,
      customerOtpVerified: orderData.customerOtpVerified ?? true,
      ...orderData,
      id: orderData.id || `JDM-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: orderData.date || new Date().toISOString().split('T')[0],
      status: orderData.status || 'Pending'
    };
    setOrders(prev => {
      const next = [newOrder, ...prev];
      offlineStorage.saveItem('jhadimadi_admin_orders_v2', next);
      broadcastSync('orders', next);
      return next;
    });

    // Deduct stock in local products state for real-time immediate UI feedback
    if (Array.isArray(newOrder.items) && newOrder.items.length > 0) {
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const matchedItem = newOrder.items.find(
            (it: any) => it.productId === prod.id || it.id === prod.id || (prod.code && it.code === prod.code)
          );
          if (matchedItem) {
            const deductQty = Math.max(1, Number((matchedItem as any).quantity || (matchedItem as any).qty || 1));
            const currentStock = Number(prod.stock ?? prod.stock_quantity ?? 0);
            const newStock = Math.max(0, currentStock - deductQty);
            return {
              ...prod,
              stock: newStock,
              stock_quantity: newStock
            };
          }
          return prod;
        });
      });
    }

    // Save directly to Supabase database & storage
    databaseService.submitOrderToDatabase(newOrder as any).catch(err => {
      console.warn('[DataContext] Error submitting order to database:', err);
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: AdminOrder['status']) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, status } : o);
      offlineStorage.saveItem('jhadimadi_admin_orders_v2', next);
      broadcastSync('orders', next);
      return next;
    });

    // Update order status directly in Supabase
    databaseService.updateOrderStatusInDatabase(orderId, status).catch(err => {
      console.warn('[DataContext] Error updating order status in Supabase:', err);
    });
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      offlineStorage.saveItem('jhadimadi_admin_orders_v2', next);
      broadcastSync('orders', next);
      return next;
    });

    // Delete directly from Supabase
    databaseService.deleteOrderFromDatabase(orderId).catch(err => {
      console.warn('[DataContext] Error deleting order from Supabase:', err);
    });
  };

  // 📢 ব্যানার ও বিজ্ঞাপন অপারেশন্স (Direct Unified Database Binding)
  const addBanner = (bannerData: Omit<AdminBanner, 'id' | 'createdAt'> & { id?: string }): AdminBanner => {
    const generateUniqueId = (): string => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const img = bannerData.imageUrl || bannerData.image_url || (bannerData as any).image || '';
    const link = bannerData.link_url || bannerData.targetLink || bannerData.linkUrl || '/';
    const newBanner: AdminBanner = {
      ...bannerData,
      imageUrl: img,
      image_url: img,
      image: img,
      link_url: link,
      linkUrl: link,
      targetLink: link,
      id: bannerData.id && String(bannerData.id).trim() ? String(bannerData.id).trim() : generateUniqueId(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setBanners(prev => {
      const filtered = prev.filter(b => b.id !== newBanner.id);
      const next = [newBanner, ...filtered];
      offlineStorage.saveItem('jhadimadi_admin_banners_v1', next);
      broadcastSync('banners', next);
      return next;
    });

    // Save directly to Unified Database in real-time
    databaseService.saveBannerToDatabase(newBanner).catch(err => {
      console.warn('[DataContext] Error saving banner to database:', err);
    });

    return newBanner;
  };

  const updateBanner = async (id: string, updated: Partial<AdminBanner>) => {
    let targetBanner: AdminBanner | null = null;
    setBanners(prev => {
      const next = prev.map(b => {
        if (b.id === id) {
          targetBanner = { ...b, ...updated };
          return targetBanner;
        }
        return b;
      });
      offlineStorage.saveItem('jhadimadi_admin_banners_v1', next);
      broadcastSync('banners', next);
      return next;
    });

    if (targetBanner) {
      databaseService.invalidateCache('banners');
      // Save directly to Unified Database in real-time
      try {
        await databaseService.saveBannerToDatabase(targetBanner);
      } catch (err) {
        console.warn('[DataContext] Error updating banner in database:', err);
      }
    }
  };

  const deleteBanner = async (id: string) => {
    if (!id) {
      console.warn('[DataContext] deleteBanner called with empty ID');
      return;
    }
    const dbId = toDatabaseUuid(id);
    const targetBanner = banners.find(b => b.id === id || b.id === dbId);

    // 0. Optimistically update React State immediately targeting ONLY this specific ID
    setBanners((prev) => {
      const next = prev.filter((item) => item.id && item.id !== id && item.id !== dbId);
      offlineStorage.saveItem('jhadimadi_admin_banners_v1', next);
      broadcastSync('banners', next);
      return next;
    });

    // 1. Delete permanently from Supabase Table ONLY for this specific ID
    if (isSupabaseConfigured) {
      try {
        await resilientSupabaseDelete('banners', {
          id: id,
          title: targetBanner?.title,
          image_url: targetBanner?.imageUrl
        });
      } catch (err) {
        console.error("Failed to delete banner from DB:", err);
      }

      // Delete storage file image ONLY if url matches
      if (targetBanner?.imageUrl && typeof targetBanner.imageUrl === 'string') {
        try {
          const url = targetBanner.imageUrl;
          const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.*)$/i);
          if (m && m[1] && m[2]) {
            const bucket = m[1];
            const filePath = decodeURIComponent(m[2].split('?')[0]);
            await supabase.storage.from(bucket).remove([filePath]);
          }
        } catch (_) {}
      }
    }

    // 2. Execute deletion via databaseService for this specific ID ONLY
    try {
      await databaseService.deleteBannerFromDatabase(id);
    } catch (err) {
      console.warn('[DataContext] Error deleting banner from database:', err);
    }

    databaseService.invalidateCache('banners');
  };

  const toggleBannerStatus = (id: string) => {
    let targetBanner: AdminBanner | null = null;
    setBanners(prev => {
      const next = prev.map(b => {
        if (b.id === id) {
          targetBanner = { ...b, isActive: !b.isActive };
          return targetBanner;
        }
        return b;
      });
      offlineStorage.saveItem('jhadimadi_admin_banners_v1', next);
      broadcastSync('banners', next);
      return next;
    });

    if (targetBanner) {
      // Save status change directly to Unified Database in real-time
      databaseService.saveBannerToDatabase(targetBanner).catch(err => {
        console.warn('[DataContext] Error toggling banner in database:', err);
      });
    }
  };

  // 🩸 রক্তদাতা অপারেশন্স (Direct Supabase Database Sync)
  const addBloodDonor = (donorData: Omit<AdminBloodDonor, 'id'> & { id?: string }): AdminBloodDonor => {
    const newDonor: AdminBloodDonor = {
      ...donorData,
      id: donorData.id || `BLD-${Date.now()}`
    };
    setBloodDonors(prev => {
      const next = [newDonor, ...prev];
      offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', next);
      broadcastSync('blood_donors', next);
      return next;
    });

    databaseService.saveBloodDonorToDatabase(newDonor).catch(err => {
      console.warn('[DataContext] Error saving blood donor to database:', err);
    });

    return newDonor;
  };

  const updateBloodDonor = (id: string, updated: Partial<AdminBloodDonor>) => {
    let targetDonor: AdminBloodDonor | null = null;
    setBloodDonors(prev => {
      const next = prev.map(d => {
        if (d.id === id) {
          targetDonor = { ...d, ...updated };
          return targetDonor;
        }
        return d;
      });
      offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', next);
      broadcastSync('blood_donors', next);
      return next;
    });

    if (targetDonor) {
      databaseService.saveBloodDonorToDatabase(targetDonor).catch(err => {
        console.warn('[DataContext] Error updating blood donor in database:', err);
      });
    }
  };

  const deleteBloodDonor = async (id: string) => {
    const targetId = String(id).trim();
    try {
      if (isSupabaseConfigured) {
        await supabase.from('blood_donors').delete().eq('id', targetId);
        await supabase.from('profiles').delete().eq('id', targetId);
      }
    } catch (err) {
      console.warn('[DataContext] Error deleting blood donor from Supabase:', err);
    }
    await databaseService.deleteBloodDonorFromSupabase(targetId);

    setBloodDonors(prev => {
      const next = prev.filter(d => d.id !== targetId);
      offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', next);
      offlineStorage.saveItem('jhadimadi_admin_blood_donors_v2', next);
      broadcastSync('blood_donors', next);
      return next;
    });
  };

  const toggleBloodDonorStatus = (id: string) => {
    let targetDonor: AdminBloodDonor | null = null;
    setBloodDonors(prev => {
      const next = prev.map(d => {
        if (d.id === id) {
          targetDonor = { ...d, isAvailable: !d.isAvailable };
          return targetDonor;
        }
        return d;
      });
      offlineStorage.saveItem('jhadimadi_admin_blood_donors_v1', next);
      broadcastSync('blood_donors', next);
      return next;
    });

    if (targetDonor) {
      databaseService.saveBloodDonorToDatabase(targetDonor).catch(err => {
        console.warn('[DataContext] Error toggling blood donor status:', err);
      });
    }
  };

  // 💬 কমপ্লেন ও রিভিউ অপারেশন্স
  const addComplaint = (compData: Omit<AdminComplaint, 'id' | 'reportedDate'> & { id?: string }): AdminComplaint => {
    const newComplaint: AdminComplaint = {
      ...compData,
      id: compData.id || `CMP-${Date.now()}`,
      reportedDate: new Date().toISOString().split('T')[0]
    };
    setComplaints(prev => [newComplaint, ...prev]);
    return newComplaint;
  };

  const updateComplaint = (id: string, updated: Partial<AdminComplaint>) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteComplaint = (id: string) => {
    setComplaints(prev => prev.filter(c => c.id !== id));
  };

  const resolveComplaint = (id: string, resolutionNotes: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? {
      ...c,
      status: 'Resolved',
      resolvedDate: new Date().toISOString().split('T')[0],
      resolutionNotes
    } : c));
  };

  // 📍 এলাকা ও জেলা অপারেশন্স
  const addLocation = (locData: Omit<AdminLocation, 'id'> & { id?: string }): AdminLocation => {
    const newLoc: AdminLocation = {
      ...locData,
      id: locData.id || `LOC-${Date.now()}`
    };
    setLocations(prev => [...prev, newLoc]);
    return newLoc;
  };

  const updateLocation = (id: string, updated: Partial<AdminLocation>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const addUpazilaToLocation = (districtId: string, upazilaName: string) => {
    if (!upazilaName.trim()) return;
    setLocations(prev => prev.map(l => {
      if (l.id === districtId && !l.upazilasBn.includes(upazilaName.trim())) {
        return { ...l, upazilasBn: [...l.upazilasBn, upazilaName.trim()] };
      }
      return l;
    }));
  };

  const deleteUpazilaFromLocation = (districtId: string, upazilaName: string) => {
    setLocations(prev => prev.map(l => {
      if (l.id === districtId) {
        return { ...l, upazilasBn: l.upazilasBn.filter(u => u !== upazilaName) };
      }
      return l;
    }));
  };

  // 🏷️ ক্যাটাগরি অপারেশন্স
  const addServiceCategory = (catData: Omit<AdminServiceCategory, 'id'> & { id?: string }): AdminServiceCategory => {
    const newCat: AdminServiceCategory = {
      ...catData,
      id: catData.id || `CAT-${Date.now()}`
    };
    setServiceCategories(prev => {
      const next = [...prev, newCat];
      offlineStorage.saveItem('jhadimadi_admin_categories_v2', next);
      broadcastSync('categories', next);
      return next;
    });

    databaseService.saveCategoryToDatabase(newCat).catch(err => {
      console.warn('[DataContext] Error saving category to database:', err);
    });

    return newCat;
  };

  const updateServiceCategory = (id: string, updated: Partial<AdminServiceCategory>) => {
    let targetCat: AdminServiceCategory | null = null;
    setServiceCategories(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          targetCat = { ...c, ...updated };
          return targetCat;
        }
        return c;
      });
      offlineStorage.saveItem('jhadimadi_admin_categories_v2', next);
      broadcastSync('categories', next);
      return next;
    });

    if (targetCat) {
      databaseService.saveCategoryToDatabase(targetCat).catch(err => {
        console.warn('[DataContext] Error updating category in database:', err);
      });
    }
  };

  const deleteServiceCategory = (id: string) => {
    setServiceCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      offlineStorage.saveItem('jhadimadi_admin_categories_v2', next);
      broadcastSync('categories', next);
      return next;
    });

    databaseService.deleteCategoryFromDatabase(id).catch(err => {
      console.warn('[DataContext] Error deleting category from database:', err);
    });
  };

  const resetToDefaults = () => {
    // STRICT PERSISTENCE: Database seeding and destructive reset are strictly disabled.
    // Live products, banners, and database items are NEVER overwritten or deleted with demo items.
    console.info('[DataContext] Strict persistence enabled: Preserving all live products and custom data.');
    // Re-sync directly with persistent database store instead of wiping
    databaseService.fetchProductsFromDatabase().then(prods => {
      if (prods && prods.length > 0) {
        const sorted = sortProductsAscending(prods);
        setProducts(sorted);
        offlineStorage.saveItem(OFFLINE_KEYS.PRODUCTS, sorted);
      }
    }).catch(() => {});
  };

  return (
    <DataContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductPublishStatus,
        isProductsLoading,
        productsError,
        refreshProducts: pullProductsFromDb,
        professionals,
        addProfessional,
        updateProfessional,
        approveProfessional,
        rejectProfessional,
        deleteProfessional,
        users,
        approveUser,
        rejectUser,
        deleteUser,
        addUser,
        updateUserRole,
        updateUserStatus,
        updateUserRecord,
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        banners,
        setBanners,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerStatus,
        homepageContent,
        updateHomepageContent,
        announcements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleAnnouncementPublish,
        mediaLibrary,
        addMediaItem,
        deleteMediaItem,
        bloodDonors,
        addBloodDonor,
        updateBloodDonor,
        deleteBloodDonor,
        toggleBloodDonorStatus,
        complaints,
        addComplaint,
        updateComplaint,
        deleteComplaint,
        resolveComplaint,
        locations,
        addLocation,
        updateLocation,
        deleteLocation,
        addUpazilaToLocation,
        deleteUpazilaFromLocation,
        serviceCategories,
        addServiceCategory,
        updateServiceCategory,
        deleteServiceCategory,
        posts,
        addPost,
        updatePost,
        deletePost,
        approvePost,
        rejectPost,
        activeDraftPreview,
        setActiveDraftPreview,
        resetToDefaults
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
