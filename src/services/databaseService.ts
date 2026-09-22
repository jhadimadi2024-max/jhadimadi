/**
 * JHADIMADI.COM — ENTERPRISE DATABASE SERVICE
 * Direct Supabase PostgreSQL & In-Memory Real-time Engine
 * Architecture: ONE USER -> ONE PROFILE -> MULTIPLE ROLES
 * Completely replaces all legacy Cloud Firestore methods with zero Firebase dependencies.
 */

import { supabase, isSupabaseConfigured, supabaseUrl } from '../supabase';
import {
  UserProfile,
  UserSearchFilterParams,
  OrganicProduct,
  ServiceProvider,
  ProductOrder,
  BloodDonor,
  PujaGiftApplication,
  AdminBanner,
  FeedPost
} from '../types';
import { StoreProduct, isLegacyDemoProduct, sortProductsAscending } from '../data/productsData';
import { offlineStorage, OFFLINE_KEYS } from '../utils/offlineStorage';
import { sanitizeDatabasePayload } from '../utils/imageUtils';
import { sanitizeObject } from '../utils/securitySanitizer';
import { fuzzyStringMatch, getSynonymsForWord, cleanSearchString, matchesSmartProduct } from '../utils/fuzzySearch';
import { generateSearchTags } from '../utils/aiTagGenerator';
import { getProductPublicUrl, parseAllProductPhotos } from '../utils/directSupabaseStorage';
import { smartSupabaseInsert } from '../utils/supabaseDataService';
import { resilientSupabaseUpsert, resilientSupabaseDelete } from './supabaseDbHelper';

export type Unsubscribe = () => void;

/**
 * Universal UUID Utilities for Supabase Postgres UUID compatibility
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(str?: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function toDatabaseUuid(id: string): string {
  if (!id) return generateUuid();
  if (isValidUuid(id)) return id;
  // Deterministic UUID for slug/string IDs (e.g. prod_rice_flour, BAN-1234)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < id.length; i++) {
    const ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = ('00000000' + (h1 >>> 0).toString(16)).slice(-8);
  const hex2 = ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
  const hex3 = ('00000000' + ((h1 ^ h2) >>> 0).toString(16)).slice(-8);
  const hex4 = ('00000000' + ((h1 + h2) >>> 0).toString(16)).slice(-8);
  return `${hex1}-${hex2.slice(0, 4)}-4${hex2.slice(5, 8)}-a${hex3.slice(0, 3)}-${hex4}`;
}

/**
 * Universal rejection-proof timeout wrapper for database calls
 */
async function withDbTimeout<T = any>(promise: Promise<T> | any, timeoutMs = 4000, fallbackVal: any = { data: null, error: null }): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackVal as T), timeoutMs);
  });

  const safePromise = Promise.resolve(promise)
    .then((res) => {
      if (timer) clearTimeout(timer);
      return res;
    })
    .catch((err) => {
      if (timer) clearTimeout(timer);
      return (fallbackVal !== undefined ? fallbackVal : { data: null, error: err }) as T;
    });

  return Promise.race([
    safePromise,
    timeoutPromise
  ]);
}

/**
 * Helper to get admin authentication headers for backend mutation requests
 */
function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    let token = sessionStorage.getItem('jhadimadi_admin_token') || '';
    if (!token) {
      const sessStr = sessionStorage.getItem('jhadimadi_admin_session');
      if (sessStr) {
        try {
          const parsed = JSON.parse(sessStr);
          if (parsed && parsed.token) token = parsed.token;
        } catch {}
      }
    }
    if (token) {
      return {
        'x-admin-token': token,
        'Authorization': `Bearer ${token}`
      };
    }
  } catch {}
  return {};
}

export const HARDCODED_FALLBACK_CATEGORIES = [
  { id: 'cat_organic', nameBn: 'অর্গানিক ও শাকসবজি', nameEn: 'Organic & Vegetables', iconName: 'Leaf', isFeatured: true, commissionRate: 5, totalProfessionals: 12 },
  { id: 'cat_fruits', nameBn: 'পাহাড়ী তাজা ফলমূল', nameEn: 'Fresh Fruits', iconName: 'Apple', isFeatured: true, commissionRate: 5, totalProfessionals: 8 },
  { id: 'cat_shutki', nameBn: 'শুটকি ও সিদল', nameEn: 'Shutki & Dried Fish', iconName: 'Fish', isFeatured: true, commissionRate: 5, totalProfessionals: 15 },
  { id: 'cat_honey', nameBn: 'প্রাকৃতিক মধু ও মসলা', nameEn: 'Pure Honey & Spices', iconName: 'Sparkles', isFeatured: true, commissionRate: 5, totalProfessionals: 6 },
  { id: 'cat_handicrafts', nameBn: 'হস্তশিল্প ও জুম টেক্সটাইল', nameEn: 'Handicrafts & Textile', iconName: 'ShoppingBag', isFeatured: true, commissionRate: 5, totalProfessionals: 10 },
  { id: 'cat_herbal', nameBn: 'ভেষজ ও পাহাড়ি দাওয়াই', nameEn: 'Herbal & Wellness', iconName: 'Heart', isFeatured: true, commissionRate: 5, totalProfessionals: 5 },
  { id: 'cat_groceries', nameBn: 'নিত্যপ্রয়োজনীয় মুদি পণ্য', nameEn: 'Groceries & Essentials', iconName: 'Package', isFeatured: true, commissionRate: 5, totalProfessionals: 20 },
  { id: 'cat_general', nameBn: 'সাধারণ পণ্য', nameEn: 'General Products', iconName: 'Layers', isFeatured: true, commissionRate: 5, totalProfessionals: 14 }
];

class DatabaseService {
  private userCache: UserProfile[] = [];
  private productCache: OrganicProduct[] = [];
  private storeProductsCache: StoreProduct[] = [];
  private bannersCache: AdminBanner[] = [];
  private categoriesCache: any[] = [];
  private postsCache: FeedPost[] = [];
  private ordersCache: ProductOrder[] = [];
  private bloodDonorsCache: any[] = [];
  private fetchProductsInFlight: Promise<StoreProduct[]> | null = null;
  private fetchBannersInFlight: Promise<AdminBanner[]> | null = null;
  private fetchCategoriesInFlight: Promise<any[]> | null = null;
  private fetchPostsInFlight: Promise<FeedPost[]> | null = null;
  private fetchUsersInFlight: Promise<UserProfile[]> | null = null;
  private entityDebounceTimers: Map<string, any> = new Map();
  private isPollerChecking = false;
  private listeners: Array<() => void> = [];
  private entityListeners: { [entity: string]: Array<() => void> } = {};
  private isInitialized = false;
  private realtimeChannel: any = null;
  private syncPollerInterval: any = null;
  private lastKnownVersion = 0;

  constructor() {
    // Defer non-critical database initialization asynchronously into the background
    // to prevent main JS thread congestion and ensure the logo animation runs at full 60fps
    if (typeof window !== 'undefined') {
      const scheduleBackgroundInit = () => {
        try {
          this.initSupabaseListener();
          this.startRealtimeSync();
        } catch (err) {
          console.warn('[DatabaseService] Background init warning:', err);
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(scheduleBackgroundInit, { timeout: 2500 });
      } else {
        setTimeout(scheduleBackgroundInit, 1200);
      }
    }
  }

  /**
   * Starts background poller for instant cross-tab & cross-device database synchronization
   */
  public startRealtimeSync(onStateUpdate?: (state: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Initial check deferred by 2.5s to avoid competing with initial app render
    setTimeout(() => {
      this.checkSyncVersion(onStateUpdate).catch(() => {});
    }, 2500);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.checkSyncVersion(onStateUpdate).catch(() => {});
      }
    };

    if (!this.syncPollerInterval) {
      // Poll every 30 seconds (instead of 1.5 seconds) and only when active tab is visible
      this.syncPollerInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
          return;
        }
        this.checkSyncVersion(onStateUpdate).catch(() => {});
      }, 30000);

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }

    return () => {
      if (this.syncPollerInterval) {
        clearInterval(this.syncPollerInterval);
        this.syncPollerInterval = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }

  public async checkSyncVersion(onStateUpdate?: (state: any) => void): Promise<void> {
    if (this.isPollerChecking) return;
    this.isPollerChecking = true;
    try {
      const res = await fetch('/api/sync/version');
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.version === 'number') {
        if (this.lastKnownVersion === 0) {
          this.lastKnownVersion = data.version;
          return;
        }
        if (data.version > this.lastKnownVersion) {
          this.lastKnownVersion = data.version;
          const state = await this.fetchDatabaseSyncState();
          if (state) {
            if (onStateUpdate) onStateUpdate(state);
            this.notifyEntityChange('all');
            window.dispatchEvent(new CustomEvent('jhadimadi_remote_sync', { detail: state }));
          }
        }
      }
    } catch {
      // Ignore network errors in background poll
    } finally {
      this.isPollerChecking = false;
    }
  }

  public async fetchDatabaseSyncState(): Promise<any> {
    try {
      const res = await fetch('/api/sync/state');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    } catch (err) {
      console.warn('[DatabaseService] Failed to fetch sync state:', err);
    }
    return null;
  }

  /**
   * Initializes real-time Postgres changes channel on profiles, products, banners, and orders
   */
  private initSupabaseListener(): void {
    if (!isSupabaseConfigured) {
      this.isInitialized = true;
      return;
    }

    if (this.realtimeChannel) {
      return;
    }

    try {
      try {
        const existing = supabase.getChannels().find(c => c.topic === 'realtime:db-service-global-sync' || c.topic === 'db-service-global-sync');
        if (existing) {
          supabase.removeChannel(existing);
        }
      } catch {}

      this.realtimeChannel = supabase
        .channel('db-service-global-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            this.fetchUsersFromSupabase().catch(() => {});
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            this.notifyEntityChange('products');
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'banners' },
          () => {
            this.notifyEntityChange('banners');
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            this.notifyEntityChange('orders');
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feed_posts' },
          () => {
            this.notifyEntityChange('posts');
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            this.fetchUsersFromSupabase().catch(() => {});
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Gracefully remove channel on error/timeout to prevent continuous socket reconnect loops and listener leaks
            if (this.realtimeChannel) {
              try {
                supabase.removeChannel(this.realtimeChannel);
              } catch (_) {}
              this.realtimeChannel = null;
            }
            // Attempt a safe delayed reconnect only if the app is still active in the browser
            if (typeof window !== 'undefined' && navigator.onLine) {
              setTimeout(() => {
                if (!this.realtimeChannel && isSupabaseConfigured) {
                  this.initSupabaseListener();
                }
              }, 15000);
            }
          }
        });
    } catch (err) {
      console.warn('[Supabase Realtime] Setup note:', err);
    }
  }

  /**
   * Safe cleanup function to unsubscribe active realtime channels when components unmount
   */
  public unsubscribeSupabaseRealtime(): void {
    if (this.realtimeChannel) {
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch (_) {}
      this.realtimeChannel = null;
    }
  }

  public subscribe(callback: () => void): () => void {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeEntity(entity: 'products' | 'banners' | 'orders' | 'posts' | 'categories' | 'users' | 'blood_donors' | 'job_seekers' | 'job_circulars' | 'registered_members' | 'service_providers' | 'all', callback: () => void): () => void {
    if (!this.entityListeners[entity]) {
      this.entityListeners[entity] = [];
    }
    if (!this.entityListeners[entity].includes(callback)) {
      this.entityListeners[entity].push(callback);
    }
    return () => {
      if (this.entityListeners[entity]) {
        this.entityListeners[entity] = this.entityListeners[entity].filter((cb) => cb !== callback);
      }
    };
  }

  public notifyEntityChange(entity: 'products' | 'banners' | 'orders' | 'posts' | 'categories' | 'users' | 'blood_donors' | 'job_seekers' | 'job_circulars' | 'registered_members' | 'service_providers' | 'all'): void {
    const timer = this.entityDebounceTimers.get(entity);
    if (timer) clearTimeout(timer);

    this.entityDebounceTimers.set(entity, setTimeout(() => {
      this.entityDebounceTimers.delete(entity);
      this.notify();
      if (this.entityListeners[entity]) {
        this.entityListeners[entity].forEach((cb) => {
          try {
            cb();
          } catch (err) {
            console.error(`[DatabaseService] Error notifying ${entity} listener:`, err);
          }
        });
      }
    }, 350));
  }

  // ==========================================
  // UNIFIED REAL-TIME DATABASE SYNC METHODS
  // ==========================================

  public async fetchProductsFromDatabase(): Promise<StoreProduct[]> {
    if (this.fetchProductsInFlight) {
      return this.fetchProductsInFlight;
    }

    this.fetchProductsInFlight = (async () => {
      // 1. Direct Supabase Query (Priority) with Cloud Storage & Server Fallback
      if (isSupabaseConfigured) {
        try {
          const supabaseProds = await this.fetchProductsFromSupabase();
          if (supabaseProds && supabaseProds.length > 0) {
            const sorted = sortProductsAscending(supabaseProds.filter(p => !isLegacyDemoProduct(p)));
            if (sorted.length > 0) {
              this.storeProductsCache = sorted;
              return sorted;
            }
          }
        } catch (err) {
          console.warn('[DatabaseService] Supabase query note:', err);
        }
      }

      // 2. Server API Route (synchronized with Supabase & server persistence)
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.products) && data.products.length > 0) {
            const cleaned: StoreProduct[] = data.products
              .map((d: any) => this.mapProductRecord(d))
              .filter((p: any) => !isLegacyDemoProduct(p));
            if (cleaned.length > 0) {
              const sorted: StoreProduct[] = sortProductsAscending<StoreProduct>(cleaned);
              this.storeProductsCache = sorted;
              return sorted;
            }
          }
        }
      } catch (err) {
        console.warn('[DatabaseService] /api/products fetch note:', err);
      }

      // 3. Fallback: Return in-memory cache or offlineStorage if network or rate-limit occurred
      if (this.storeProductsCache && this.storeProductsCache.length > 0) {
        return this.storeProductsCache;
      }
      try {
        const local = offlineStorage.getItem<StoreProduct[]>(OFFLINE_KEYS.PRODUCTS, []);
        if (Array.isArray(local) && local.length > 0) {
          this.storeProductsCache = local;
          return local;
        }
      } catch {}

      return [];
    })().finally(() => {
      this.fetchProductsInFlight = null;
    });

    return this.fetchProductsInFlight;
  }

  public async saveProductToDatabase(product: StoreProduct): Promise<{ success: boolean; data?: StoreProduct; error?: string }> {
    try {
      let savedProduct = product;

      // 1. Save permanently to Supabase cloud (products table and cloud storage catalog)
      if (isSupabaseConfigured) {
        try {
          const supaResult = await this.saveProductToSupabase(product);
          if (supaResult.success && supaResult.data) {
            savedProduct = supaResult.data;
          }
        } catch (supaErr) {
          console.warn('[DatabaseService] saveProductToSupabase note:', supaErr);
        }
      }

      // 2. Mirror to local API if available
      try {
        const authHeaders = getAdminAuthHeaders();
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(savedProduct)
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.product) savedProduct = json.product;
        }
      } catch (err) {
        console.warn('[DatabaseService] /api/products save note:', err);
      }

      this.notifyEntityChange('products');
      return { success: true, data: savedProduct };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save product' };
    }
  }

  public invalidateCache(entity: 'products' | 'banners' | 'all'): void {
    const isAll = entity === 'all';
    if (entity === 'products' || isAll) {
      this.productCache = [];
      this.storeProductsCache = [];
      if (typeof window !== 'undefined' && (window as any).invalidateFetchCache) {
        try {
          (window as any).invalidateFetchCache('/api/products');
        } catch (_) {}
      }
    }
    if (entity === 'banners' || isAll) {
      this.bannersCache = [];
      if (typeof window !== 'undefined' && (window as any).invalidateFetchCache) {
        try {
          (window as any).invalidateFetchCache('/api/banners');
        } catch (_) {}
      }
    }
    this.notifyEntityChange(isAll ? 'products' : entity);
  }

  public async deleteProductFromDatabase(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(productId);

      // 1. Delete permanently from Supabase cloud first and await completion
      if (isSupabaseConfigured) {
        try {
          await this.deleteProductFromSupabase(productId);
        } catch (supaErr) {
          console.warn('[DatabaseService] deleteProductFromSupabase note:', supaErr);
        }
      }

      // 2. Mirror to backend API and await completion
      try {
        const authHeaders = getAdminAuthHeaders();
        await fetch(`/api/products/${encodeURIComponent(productId)}`, { 
          method: 'DELETE',
          headers: authHeaders
        });
      } catch (err) {
        console.warn('[DatabaseService] /api/products delete note:', err);
      }

      // 3. Immediately clear local caches & invalidate fetch cache
      this.productCache = (this.productCache || []).filter(p => p.id !== productId && p.id !== dbId);
      this.storeProductsCache = (this.storeProductsCache || []).filter(p => p.id !== productId && p.id !== dbId);
      this.invalidateCache('products');

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete product' };
    }
  }

  public async fetchBanners(): Promise<AdminBanner[]> {
    return this.fetchBannersFromDatabase();
  }

  public async fetchBannersFromDatabase(): Promise<AdminBanner[]> {
    // 1. Direct Supabase Query from 'platform_banners' first
    if (isSupabaseConfigured) {
      try {
        const live = await this.fetchBannersFromSupabase();
        if (live && Array.isArray(live) && live.length > 0) {
          this.bannersCache = live;
          return live;
        }
      } catch (err) {
        console.warn('[DatabaseService] Supabase fetchBanners error:', err);
      }
    }

    // 2. Server API endpoint fallback
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.banners) && data.banners.length > 0) {
          this.bannersCache = data.banners;
          return data.banners;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] /api/banners fetch error:', err);
    }

    // CRITICAL: Do NOT return [] if this.bannersCache already has items!
    return this.bannersCache || [];
  }

  public async saveBannerToDatabase(banner: AdminBanner): Promise<{ success: boolean; data?: AdminBanner; error?: string }> {
    try {
      const img = banner.imageUrl || banner.image_url || (banner as any).image || '';
      const link = banner.link_url || banner.targetLink || banner.linkUrl || '/';
      const sanitizedBanner: AdminBanner = {
        ...banner,
        imageUrl: img,
        image_url: img,
        image: img,
        link_url: link,
        linkUrl: link,
        targetLink: link
      };

      // Immediately cache locally to avoid race condition state wipeout
      if (!this.bannersCache) this.bannersCache = [];
      const existingIdx = this.bannersCache.findIndex(b => b.id === sanitizedBanner.id);
      if (existingIdx >= 0) {
        this.bannersCache[existingIdx] = sanitizedBanner;
      } else {
        this.bannersCache.unshift(sanitizedBanner);
      }

      // Save to platform_banners with exact requested columns
      if (isSupabaseConfigured) {
        try {
          const platformPayload = {
            title: sanitizedBanner.title || '',
            subtitle: sanitizedBanner.subtitle || '',
            image_url: img,
            link_url: link
          };
          await supabase.from('platform_banners').insert([platformPayload]);
        } catch (pbErr) {
          console.warn('[DatabaseService] platform_banners insert note:', pbErr);
        }
      }

      // Mirror to banners table and backend API
      try {
        const authHeaders = getAdminAuthHeaders();
        fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(sanitizedBanner)
        }).catch(() => {});
      } catch (err) {
        console.warn('[DatabaseService] /api/banners save note:', err);
      }
      this.saveBannerToSupabase(sanitizedBanner).catch(() => {});
      this.notifyEntityChange('banners');
      return { success: true, data: sanitizedBanner };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save banner' };
    }
  }

  public async deleteBannerFromDatabase(bannerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(bannerId);

      // 1. Delete permanently from Supabase cloud tables and await completion
      if (isSupabaseConfigured) {
        try {
          await this.deleteBannerFromSupabase(bannerId);
        } catch (supaErr) {
          console.warn('[DatabaseService] deleteBannerFromSupabase note:', supaErr);
        }
      }

      // 2. Mirror to backend API and await completion
      try {
        const authHeaders = getAdminAuthHeaders();
        await fetch(`/api/banners/${encodeURIComponent(bannerId)}`, { 
          method: 'DELETE',
          headers: authHeaders
        });
      } catch (err) {
        console.warn('[DatabaseService] /api/banners delete note:', err);
      }

      // 3. Immediately update memory caches & invalidate fetch cache
      this.bannersCache = (this.bannersCache || []).filter(b => b.id !== bannerId && b.id !== dbId);
      this.invalidateCache('banners');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete banner' };
    }
  }

  public async fetchCategoriesFromDatabase(): Promise<any[]> {
    // 1. Direct Supabase categories table
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withDbTimeout(
          Promise.resolve(supabase.from('categories').select('*')),
          3500,
          { data: null, error: null } as any
        );
        if (!error && data && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            nameBn: d.name_bn || d.nameBn,
            nameEn: d.name_en || d.nameEn || d.name_bn || d.nameBn,
            iconName: d.icon_name || d.iconName || 'ShoppingBag',
            totalProfessionals: Number(d.total_professionals || d.totalProfessionals || 0),
            isFeatured: d.is_featured ?? d.isFeatured ?? true,
            commissionRate: Number(d.commission_rate ?? d.commissionRate ?? 5)
          }));
          this.categoriesCache = mapped;
          return mapped;
        } else if (error) {
          // Handle 404, missing table, or permission errors gracefully
          console.warn('[DatabaseService] Supabase categories table error (falling back to hardcoded):', error.message || error);
        }
      } catch (tableErr) {
        console.warn('[DatabaseService] Supabase categories table query note:', tableErr);
      }
    }

    // 2. Query /api/categories (server-side handles database, cache, and fallbacks safely)
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          this.categoriesCache = data.categories;
          return data.categories;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] /api/categories fetch error:', err);
    }

    // 3. Always fallback to a static hardcoded array of categories if Supabase returns 404 or missing table
    if (this.categoriesCache && this.categoriesCache.length > 0) {
      return this.categoriesCache;
    }
    this.categoriesCache = HARDCODED_FALLBACK_CATEGORIES;
    return HARDCODED_FALLBACK_CATEGORIES;
  }

  public async saveCategoryToDatabase(cat: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let saved = cat;
      // Direct Supabase table upsert
      if (isSupabaseConfigured) {
        try {
          await supabase.from('categories').upsert([{
            id: cat.id,
            name_bn: cat.nameBn,
            name_en: cat.nameEn || cat.nameBn,
            icon_name: cat.iconName || 'ShoppingBag',
            is_featured: cat.isFeatured ?? true,
            commission_rate: cat.commissionRate ?? 5
          }], { onConflict: 'id' });
        } catch {}
      }

      try {
        const authHeaders = getAdminAuthHeaders();
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(cat)
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.category) saved = json.category;
        }
      } catch (err) {
        console.warn('[DatabaseService] /api/categories save note:', err);
      }
      this.notifyEntityChange('categories');
      return { success: true, data: saved };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save category' };
    }
  }

  public async deleteCategoryFromDatabase(catId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('categories').delete().eq('id', catId);
        } catch {}
      }
      try {
        const authHeaders = getAdminAuthHeaders();
        await fetch(`/api/categories/${encodeURIComponent(catId)}`, { 
          method: 'DELETE',
          headers: authHeaders
        });
      } catch (err) {
        console.warn('[DatabaseService] /api/categories delete note:', err);
      }
      this.notifyEntityChange('categories');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete category' };
    }
  }

  public async fetchPostsFromDatabase(): Promise<FeedPost[]> {
    // 1. Server API endpoint (resilient and avoids browser RLS 42501 errors)
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          return data.posts;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] /api/posts fetch error:', err);
    }

    // 2. Direct Supabase Table Query
    try {
      const posts = await this.fetchPostsFromSupabase();
      if (posts && posts.length > 0) return posts;
    } catch {}

    return [];
  }

  public async savePostToDatabase(post: FeedPost): Promise<{ success: boolean; data?: FeedPost; error?: string }> {
    try {
      let saved = post;
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.post) saved = json.post;
        }
      } catch (err) {
        console.warn('[DatabaseService] /api/posts save note:', err);
      }
      this.savePostToSupabase(saved).catch(() => {});
      this.notifyEntityChange('posts');
      return { success: true, data: saved };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save post' };
    }
  }

  public async deletePostFromDatabase(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      try {
        await fetch(`/api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[DatabaseService] /api/posts delete note:', err);
      }
      this.deletePostFromSupabase(postId).catch(() => {});
      this.notifyEntityChange('posts');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete post' };
    }
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('[DatabaseService] Listener error:', err);
      }
    });
  }

  // ==========================================
  // UNIQUE CONSTRAINTS & DATA VALIDATION
  // ==========================================

  /**
   * Validates unique constraints: 1 Account per Phone Number, 1 per Email, and 1 per Username/NID.
   */
  public async checkUniqueConstraints(params: {
    phone?: string;
    email?: string;
    username?: string;
    nidNumber?: string;
    excludeUserId?: string;
  }): Promise<{ isDuplicate: boolean; conflictField?: 'phone' | 'email' | 'nid' | 'username'; message?: string }> {
    const cleanPhone = params.phone ? params.phone.replace(/[^0-9]/g, '') : '';
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';
    const cleanUsername = params.username ? params.username.trim().toLowerCase() : '';
    const cleanNid = params.nidNumber ? params.nidNumber.replace(/[^0-9a-zA-Z]/g, '') : '';

    const isSyntheticEmail = !cleanEmail || cleanEmail.endsWith('@jhadimadi.com') || cleanEmail.includes('placeholder');
    const DUPLICATE_MSG = 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।';

    // 1. Check in-memory cache
    for (const cached of this.userCache) {
      if (params.excludeUserId && cached.id === params.excludeUserId) continue;

      if (cleanPhone.length >= 10 && cached.phone) {
        const cachedDigits = cached.phone.replace(/[^0-9]/g, '');
        if (cachedDigits === cleanPhone || (cleanPhone.endsWith(cachedDigits) && cachedDigits.length >= 10)) {
          return {
            isDuplicate: true,
            conflictField: 'phone',
            message: DUPLICATE_MSG
          };
        }
      }

      if (cleanEmail && !isSyntheticEmail && cached.email) {
        if (cached.email.trim().toLowerCase() === cleanEmail) {
          return {
            isDuplicate: true,
            conflictField: 'email',
            message: DUPLICATE_MSG
          };
        }
      }

      if (cleanUsername && (cached as any).username) {
        if ((cached as any).username.trim().toLowerCase() === cleanUsername) {
          return {
            isDuplicate: true,
            conflictField: 'username',
            message: 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি ইউজারনেম পছন্দ করুন।'
          };
        }
      }

      if (cleanNid.length >= 8 && cached.nidNumber) {
        const cachedNid = cached.nidNumber.replace(/[^0-9a-zA-Z]/g, '');
        if (cachedNid === cleanNid) {
          return {
            isDuplicate: true,
            conflictField: 'nid',
            message: 'এই এনআইডি নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।'
          };
        }
      }
    }

    // 2. Query Supabase directly if configured
    if (isSupabaseConfigured) {
      try {
        const isValidUuid = params.excludeUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.excludeUserId);

        if (cleanPhone.length >= 10) {
          const phoneVariants = [
            cleanPhone,
            `+88${cleanPhone}`,
            `88${cleanPhone}`,
            cleanPhone.startsWith('88') ? cleanPhone.slice(2) : null,
            cleanPhone.startsWith('+88') ? cleanPhone.slice(3) : null
          ].filter(Boolean) as string[];

          let query = supabase
            .from('profiles')
            .select('id, phone')
            .in('phone', phoneVariants);

          if (isValidUuid) {
            query = query.neq('id', params.excludeUserId!);
          }

          const { data } = await query.limit(1).maybeSingle();

          if (data) {
            return {
              isDuplicate: true,
              conflictField: 'phone',
              message: DUPLICATE_MSG
            };
          }
        }

        if (cleanEmail && !isSyntheticEmail) {
          let query = supabase
            .from('profiles')
            .select('id, email')
            .ilike('email', cleanEmail);

          if (isValidUuid) {
            query = query.neq('id', params.excludeUserId!);
          }

          const { data } = await query.limit(1).maybeSingle();

          if (data) {
            return {
              isDuplicate: true,
              conflictField: 'email',
              message: DUPLICATE_MSG
            };
          }
        }

        if (cleanUsername) {
          let query = supabase
            .from('profiles')
            .select('id, username')
            .eq('username', cleanUsername);

          if (isValidUuid) {
            query = query.neq('id', params.excludeUserId!);
          }

          const { data } = await query.limit(1).maybeSingle();

          if (data) {
            return {
              isDuplicate: true,
              conflictField: 'username',
              message: 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি ইউজারনেম পছন্দ করুন।'
            };
          }
        }
      } catch (err) {
        console.warn('[Supabase] Unique constraint check note:', err);
      }
    }

    return { isDuplicate: false };
  }

  // ==========================================
  // USER PROFILES & ACCOUNTS
  // ==========================================

  /**
   * Save user profile to Supabase 'profiles' table and in-memory cache
   */
  public async saveUserProfile(
    profile: UserProfile,
    options?: { skipUniqueCheck?: boolean }
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    const docId = profile.id || `usr_${profile.phone?.replace(/[^0-9]/g, '') || Date.now()}`;

    if (!options?.skipUniqueCheck) {
      const constraintCheck = await this.checkUniqueConstraints({
        phone: profile.phone,
        email: profile.email,
        username: (profile as any).username,
        nidNumber: profile.nidNumber,
        excludeUserId: docId
      });

      if (constraintCheck.isDuplicate) {
        return {
          success: false,
          error: constraintCheck.message || 'এই এনআইডি/ফোন নম্বর/ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।'
        };
      }
    }

    const payload: UserProfile = {
      ...profile,
      id: docId,
      uniqueId: profile.uniqueId || `JM-${Date.now().toString().slice(-4)}`,
      memberUID: profile.memberUID || `CG-${Date.now()}`,
      memberId: profile.memberId || profile.memberUID || `JM-${Date.now().toString().slice(-4)}`,
      name: profile.name || profile.fullName || 'Anonymous User',
      fullName: profile.fullName || profile.name || 'Anonymous User',
      phone: profile.phone || '',
      email: profile.email || `${profile.phone?.replace(/[^0-9]/g, '') || Date.now()}@jhadimadi.com`,
      role: profile.role || 'customer',
      division: profile.division || 'চট্টগ্রাম',
      district: profile.district || 'খাগড়াছড়ি',
      upazila: profile.upazila || profile.thana || 'খাগড়াছড়ি সদর',
      thana: profile.thana || profile.upazila || 'খাগড়াছড়ি সদর',
      mahalla: profile.mahalla || profile.para || '',
      para: profile.para || profile.mahalla || '',
      paraMahalla: profile.paraMahalla || `${profile.mahalla || ''}, ${profile.upazila || ''}`,
      bloodGroup: profile.bloodGroup || '',
      profession: profile.profession || profile.professionBn || 'সাধারন নাগরিক',
      professionBn: profile.professionBn || profile.profession || 'সাধারন নাগরিক',
      serviceCategory: profile.serviceCategory || profile.categorySkill || '',
      categorySkill: profile.categorySkill || profile.serviceCategory || '',
      nidNumber: profile.nidNumber || '',
      isNidVerified: Boolean(profile.isNidVerified),
      isPaidMember: Boolean(profile.isPaidMember),
      isBloodDonor: Boolean(profile.isBloodDonor ?? (!!profile.bloodGroup)),
      isBloodDonorAvailable: Boolean(profile.isBloodDonorAvailable ?? true),
      isAvailable: Boolean(profile.isAvailable ?? true),
      experienceYears: Number(profile.experienceYears) || 0,
      dailyRate: profile.dailyRate ? String(profile.dailyRate) : '',
      rateType: profile.rateType || 'দৈনিক',
      rating: Number(profile.rating) || 5.0,
      completedJobs: Number(profile.completedJobs) || 0,
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      shopName: profile.shopName || '',
      ownerName: profile.ownerName || '',
      businessCategory: profile.businessCategory || '',
      tradeLicenseOrNid: profile.tradeLicenseOrNid || '',
      detailedAddress: profile.detailedAddress || '',
      presentAddress: profile.presentAddress || profile.detailedAddress || '',
      permanentAddress: profile.permanentAddress || '',
      educationalQualification: profile.educationalQualification || profile.education || '',
      education: profile.educationalQualification || profile.education || '',
      qualification: profile.educationalQualification || profile.education || '',
      cvUrl: profile.cvUrl || '',
      cvFileName: profile.cvFileName || '',
      dateOfBirth: profile.dateOfBirth || '',
      bio: profile.bio || '',
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    // Update in-memory live cache immediately
    const existingIdx = this.userCache.findIndex((u) => u.id === docId);
    if (existingIdx >= 0) {
      this.userCache[existingIdx] = payload;
    } else {
      this.userCache.unshift(payload);
    }
    this.notify();

    // Persist to Server Database API (/api/users)
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docId,
          name: payload.name || payload.fullName,
          fullName: payload.fullName,
          phone: payload.phone,
          email: payload.email,
          role: payload.role,
          division: payload.division,
          district: payload.district,
          upazila: payload.upazila,
          mahalla: payload.mahalla,
          para: payload.para,
          bloodGroup: payload.bloodGroup,
          isBloodDonor: payload.isBloodDonor,
          serviceCategory: payload.serviceCategory,
          profession: payload.profession,
          professionBn: payload.professionBn,
          rating: payload.rating,
          completedJobs: payload.completedJobs,
          experienceYears: payload.experienceYears,
          dailyRate: payload.dailyRate,
          rateType: payload.rateType,
          avatar: payload.avatar,
          isNidVerified: payload.isNidVerified,
          isPaidMember: payload.isPaidMember,
          bio: payload.bio,
          shopName: payload.shopName,
          businessCategory: payload.businessCategory,
          tradeLicenseOrNid: payload.tradeLicenseOrNid,
          detailedAddress: payload.detailedAddress
        })
      }).catch(err => console.warn('[DatabaseService] /api/users background sync:', err));
    } catch (apiErr) {
      console.warn('[DatabaseService] /api/users call note:', apiErr);
    }

    // Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        const entityType = payload.role === 'seller' ? 'product' : (payload.role === 'service_provider' ? 'service_provider' : 'member');
        const tags = generateSearchTags(entityType as any, payload);
        const sanitized = await sanitizeDatabasePayload({
          id: docId,
          full_name: payload.fullName,
          username: (payload as any).username || `user_${docId.slice(-6)}`,
          email: payload.email,
          phone: payload.phone,
          avatar_url: payload.avatar,
          division: payload.division,
          district: payload.district,
          upazila: payload.upazila,
          address: payload.presentAddress || payload.paraMahalla || payload.detailedAddress || '',
          present_address: payload.presentAddress || payload.detailedAddress || '',
          permanent_address: payload.permanentAddress || '',
          educational_qualification: payload.educationalQualification || payload.education || '',
          nid_number: payload.nidNumber || '',
          cv_url: payload.cvUrl || '',
          blood_group: payload.bloodGroup || '',
          tax_vat_info: payload.nidNumber || payload.tradeLicenseOrNid || '',
          search_tags: tags.search_tags,
          hashtags: tags.hashtags,
          account_status: 'active',
          updated_at: new Date().toISOString()
        });

        const { error: upsertErr } = await supabase.from('profiles').upsert([sanitized]);
        if (upsertErr) {
          const isConstraint = 
            upsertErr.code === '23505' || 
            upsertErr.message?.includes('23505') || 
            upsertErr.message?.toLowerCase().includes('duplicate') ||
            upsertErr.message?.toLowerCase().includes('unique');

          if (isConstraint) {
            return {
              success: false,
              error: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।'
            };
          }
          console.warn('[Supabase] Profile save note:', upsertErr);
        }

        // Ensure role exists in user_roles table
        if (payload.role) {
          await supabase.from('user_roles').upsert([
            { user_id: docId, role: payload.role }
          ], { onConflict: 'user_id,role' });
        }
      } catch (err: any) {
        if (err?.code === '23505' || err?.message?.includes('23505') || err?.message?.toLowerCase().includes('duplicate')) {
          return {
            success: false,
            error: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।'
          };
        }
        console.warn('[Supabase] Profile save note:', err);
      }
    }

    return { success: true, data: payload };
  }

  /**
   * Delete user profile from Supabase and cache
   */
  public async deleteUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User ID is required' };

    this.userCache = this.userCache.filter((u) => u.id !== userId);
    this.notify();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('user_roles').delete().eq('user_id', userId);
      } catch (err: any) {
        console.warn('[Supabase] Profile deletion error:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  }

  /**
   * Alias for deleteUserProfile
   */
  public async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteUserProfile(userId);
  }

  /**
   * Backward compatible alias
   */
  public async saveUserToFirestore(profile: UserProfile): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    return this.saveUserProfile(profile);
  }

  /**
   * Save user to database backend / Supabase
   */
  public async saveUserToDatabase(profile: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    return this.saveUserProfile(profile as UserProfile);
  }

  /**
   * Register or update a professional / service provider
   */
  public async registerProvider(
    providerData: Partial<UserProfile> | ServiceProvider,
    options?: { skipUniqueCheck?: boolean }
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    const docId = (providerData as any).id || `pro_${(providerData as any).phone?.replace(/[^0-9]/g, '') || Date.now()}`;

    const providerProfile: UserProfile = {
      id: docId,
      uniqueId: (providerData as any).uniqueId || `PRO-${Date.now().toString().slice(-4)}`,
      memberUID: (providerData as any).memberUID || `CG-PRO-${Date.now()}`,
      memberId: (providerData as any).memberId || docId,
      name: providerData.name || (providerData as any).fullName || 'পেশাজীবী সেবাদাতা',
      fullName: (providerData as any).fullName || providerData.name || 'পেশাজীবী সেবাদাতা',
      phone: (providerData as any).phone || (providerData as any).realPhone || '',
      email: (providerData as any).email || `${(providerData as any).phone || Date.now()}@jhadimadi.com`,
      role: 'service_provider',
      division: (providerData as any).division || 'চট্টগ্রাম',
      district: (providerData as any).district || 'খাগড়াছড়ি',
      upazila: (providerData as any).upazila || (providerData as any).thana || 'খাগড়াছড়ি সদর',
      thana: (providerData as any).thana || (providerData as any).upazila || 'খাগড়াছড়ি সদর',
      mahalla: (providerData as any).mahalla || (providerData as any).para || '',
      para: (providerData as any).para || (providerData as any).mahalla || '',
      paraMahalla: (providerData as any).paraMahalla || `${(providerData as any).mahalla || ''}, ${(providerData as any).upazila || ''}`,
      bloodGroup: (providerData as any).bloodGroup || '',
      profession: (providerData as any).profession || (providerData as any).category || 'দক্ষ টেকনিশিয়ান',
      professionBn: (providerData as any).professionBn || (providerData as any).profession || 'দক্ষ কারিগর ও টেকনিশিয়ান',
      serviceCategory: (providerData as any).serviceCategory || (providerData as any).category || '',
      categorySkill: (providerData as any).categorySkill || (providerData as any).skills?.join?.(', ') || '',
      experienceYears: Number((providerData as any).experienceYears || (providerData as any).experience) || 3,
      dailyRate: String((providerData as any).dailyRate || (providerData as any).rate || '৬০০'),
      rateType: (providerData as any).rateType || 'দৈনিক',
      rating: Number((providerData as any).rating) || 5.0,
      completedJobs: Number((providerData as any).completedJobs) || 12,
      isNidVerified: true,
      isPaidMember: true,
      isAvailable: Boolean((providerData as any).isAvailable ?? true),
      isBloodDonor: Boolean((providerData as any).isBloodDonor ?? (!!(providerData as any).bloodGroup)),
      isBloodDonorAvailable: true,
      avatar: (providerData as any).avatar || (providerData as any).image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      nidNumber: (providerData as any).nidNumber || '',
      createdAt: (providerData as any).createdAt || new Date().toISOString(),
    };

    const saveRes = await this.saveUserProfile(providerProfile, options);

    // Also persist specific service provider profile table in Supabase
    if (isSupabaseConfigured && saveRes.success) {
      try {
        const spTags = generateSearchTags('service_provider', {
          ...providerProfile,
          tradeLicenseOrNid: (providerData as any).tradeLicenseOrNid || providerProfile.nidNumber
        });

        // 1. Direct structured ingestion into public.service_providers
        await supabase.from('service_providers').upsert([
          {
            id: toDatabaseUuid(docId),
            user_id: toDatabaseUuid(docId),
            unique_code: providerProfile.uniqueId,
            display_name: providerProfile.fullName,
            full_name: providerProfile.fullName,
            phone: providerProfile.phone,
            profession_key: providerProfile.serviceCategory || providerProfile.profession,
            category_bn: providerProfile.professionBn || providerProfile.profession,
            category_en: (providerData as any).categoryEn || '',
            sub_category: (providerData as any).subCategory || '',
            skills: (providerData as any).skills || (providerProfile.categorySkill ? [providerProfile.categorySkill] : []),
            skills_details: providerProfile.categorySkill || '',
            rate_type: providerProfile.rateType || 'Daily',
            rate_amount: Number(providerProfile.dailyRate) || 0,
            experience_years: providerProfile.experienceYears || 1,
            division: providerProfile.division || 'চট্টগ্রাম',
            district: providerProfile.district || 'খাগড়াছড়ি',
            upazila: providerProfile.upazila || 'খাগড়াছড়ি সদর',
            area: providerProfile.mahalla || '',
            mahalla: providerProfile.mahalla || '',
            blood_group: providerProfile.bloodGroup || '',
            service_details: {
              category: providerProfile.serviceCategory,
              dailyRate: providerProfile.dailyRate,
              experienceYears: providerProfile.experienceYears,
              bio: providerProfile.bio
            },
            tax_vat_info: (providerData as any).tradeLicenseOrNid || providerProfile.nidNumber || '',
            is_available: providerProfile.isAvailable !== false,
            search_tags: spTags.search_tags,
            hashtags: spTags.hashtags,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });

        await supabase.from('service_provider_profiles').upsert([
          {
            user_id: docId,
            service_category: providerProfile.serviceCategory || providerProfile.profession,
            hourly_rate: Number(providerProfile.dailyRate) || 0,
            experience_years: providerProfile.experienceYears || 1,
            bio: providerProfile.bio || ''
          }
        ], { onConflict: 'user_id' });

        await supabase.from('user_roles').upsert([
          { user_id: docId, role: 'service_provider' }
        ], { onConflict: 'user_id,role' });
      } catch (spErr) {
        console.warn('[Supabase] Service provider specific table sync:', spErr);
      }
    }

    return saveRes;
  }

  public async saveServiceProviderProfile(
    providerData: any,
    options?: { skipUniqueCheck?: boolean }
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    return this.registerProvider(providerData, options);
  }

  /**
   * Fetch all users from Server database store (/api/users) with Supabase fallback
   */
  public async fetchUsersFromDatabase(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          const loaded: UserProfile[] = data.users.map((d: any) => ({
            id: d.id,
            uid: d.id,
            name: d.name || d.fullName || 'User',
            fullName: d.fullName || d.name || 'User',
            username: d.username || '',
            email: d.email || '',
            phone: d.phone || d.phoneMasked || '',
            phoneMasked: d.phoneMasked || '',
            avatar: d.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            role: d.role || 'customer',
            division: d.division || 'চট্টগ্রাম',
            district: d.district || '',
            upazila: d.upazila || '',
            mahalla: d.mahalla || d.para || '',
            para: d.para || d.mahalla || '',
            isNidVerified: !!d.isNidVerified,
            isPaidMember: !!d.isPaidMember,
            rating: d.rating,
            completedJobs: d.completedJobs || 0,
            experienceYears: d.experienceYears,
            serviceCategory: d.serviceCategory || d.profession || '',
            profession: d.profession || d.serviceCategory || '',
            bloodGroup: d.bloodGroup || '',
            isBloodDonor: !!d.isBloodDonor,
            createdAt: d.createdAt || new Date().toISOString()
          }));

          this.userCache = loaded;
          this.isInitialized = true;
          this.notify();
          return loaded;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] fetchUsersFromDatabase note:', err);
    }
    return this.fetchUsersFromSupabase();
  }

  /**
   * Fetch all users from Supabase 'profiles' table
   */
  public async fetchUsersFromSupabase(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) return this.userCache;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error || !data) return this.userCache;

      const loaded: UserProfile[] = data.map((d: any) => ({
        id: d.id,
        uid: d.id,
        name: d.full_name || 'Anonymous',
        fullName: d.full_name || 'Anonymous',
        username: d.username || '',
        email: d.email || '',
        phone: d.phone || '',
        avatar: d.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        role: 'customer',
        division: d.division || 'চট্টগ্রাম',
        district: d.district || 'খাগড়াছড়ি',
        upazila: d.upazila || 'খাগড়াছড়ি সদর',
        mahalla: d.address || d.mahalla || 'পৌর এলাকা',
        isNidVerified: !!d.is_nid_verified,
        isPaidMember: !!d.is_paid_member,
        createdAt: d.created_at || new Date().toISOString()
      }));

      this.userCache = loaded;
      this.isInitialized = true;
      this.notify();
      return loaded;
    } catch (err) {
      console.warn('[Supabase] fetch users note:', err);
      return this.userCache;
    }
  }

  /**
   * Backward compatible alias for fetchUsersFromFirestore
   */
  public async fetchUsersFromFirestore(): Promise<UserProfile[]> {
    return this.fetchUsersFromSupabase();
  }

  /**
   * Multi-Indexed Search Engine
   */
  public async searchUsers(params: UserSearchFilterParams): Promise<UserProfile[]> {
    const live = await this.fetchUsersFromSupabase();
    return this.searchUserProfiles(params, live);
  }

  /**
   * Realtime Snapshot Listener for 'users' / 'profiles'
   */
  public subscribeToUsersFirestore(onUpdate: (users: UserProfile[]) => void, _onError?: (err: Error) => void): Unsubscribe {
    onUpdate(this.userCache);
    return this.subscribe(() => {
      onUpdate(this.userCache);
    });
  }

  public getAllUserProfiles(): UserProfile[] {
    return this.userCache;
  }

  public saveUserProfiles(users: UserProfile[]): void {
    this.userCache = users;
    this.notify();
  }

  public addUserProfile(profile: UserProfile): UserProfile {
    this.saveUserProfile(profile).catch((err) => console.error('[DatabaseService] save error:', err));
    return profile;
  }

  public async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const idx = this.userCache.findIndex((u) => u.id === id);
    if (idx >= 0) {
      const merged = { ...this.userCache[idx], ...updates };
      this.userCache[idx] = merged;
      this.notify();

      if (isSupabaseConfigured) {
        try {
          await supabase.from('profiles').update({
            full_name: updates.fullName || updates.name,
            phone: updates.phone,
            avatar_url: updates.avatar,
            division: updates.division,
            district: updates.district,
            upazila: updates.upazila,
            address: updates.paraMahalla || updates.detailedAddress,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        } catch (e) {
          console.warn('[Supabase] Update user note:', e);
        }
      }
      return merged;
    }
    return null;
  }

  public async getUserByIdOrPhone(identifier: string): Promise<UserProfile | null> {
    if (!identifier || !identifier.trim()) return null;
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();
    const cleanDigits = clean.replace(/[^0-9]/g, '');

    // 1. In-memory cache first
    const cached = this.userCache.find((u) => {
      if (u.id === clean || u.uid === clean) return true;
      if (u.email && u.email.trim().toLowerCase() === cleanLower) return true;
      if ((u as any).username && (u as any).username.trim().toLowerCase() === cleanLower) return true;
      if (u.memberUID && u.memberUID.trim().toLowerCase() === cleanLower) return true;
      if (u.memberId && u.memberId.trim().toLowerCase() === cleanLower) return true;
      if (cleanDigits.length >= 10 && u.phone) {
        const uDigits = u.phone.replace(/[^0-9]/g, '');
        if (uDigits === cleanDigits || (cleanDigits.endsWith(uDigits) && uDigits.length >= 10)) return true;
      }
      return false;
    });

    if (cached) return cached;

    // 2. Supabase lookup
    if (isSupabaseConfigured) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
        const orConditions: string[] = [
          `username.eq.${cleanLower}`,
          `email.eq.${cleanLower}`,
          `phone.eq.${clean}`
        ];
        if (cleanDigits.length >= 10) {
          orConditions.push(`phone.eq.+88${cleanDigits}`, `phone.eq.88${cleanDigits}`);
        }
        if (isUUID) {
          orConditions.push(`id.eq.${clean}`);
        }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(orConditions.join(','))
          .limit(1)
          .maybeSingle();

        if (data) {
          const user: UserProfile = {
            id: data.id,
            uid: data.id,
            name: data.full_name || 'ব্যবহারকারী',
            fullName: data.full_name || 'ব্যবহারকারী',
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            avatar: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            role: 'customer',
            division: data.division || 'চট্টগ্রাম',
            district: data.district || 'খাগড়াছড়ি',
            upazila: data.upazila || 'খাগড়াছড়ি সদর',
            mahalla: data.address || data.mahalla || 'পৌর এলাকা',
            isNidVerified: !!data.is_nid_verified,
            isPaidMember: !!data.is_paid_member,
            createdAt: data.created_at || new Date().toISOString()
          };
          this.userCache.push(user);
          return user;
        }
      } catch (err) {
        console.warn('[Supabase] getUserByIdOrPhone note:', err);
      }
    }

    return null;
  }

  public searchUserProfiles(params: UserSearchFilterParams, sourceUsers?: UserProfile[]): UserProfile[] {
    const users = sourceUsers && sourceUsers.length > 0 ? sourceUsers : this.userCache;
    const { district, thana, bloodGroup, profession, keyword, para } = params;

    return users.filter((user) => {
      if (district && district !== 'বাংলাদেশ' && district !== 'সকল জেলা' && district !== 'All' && district !== '') {
        const dNorm = district.toLowerCase().replace('জেলা', '').trim();
        const userD = (user.district || '').toLowerCase().replace('জেলা', '').trim();
        if (dNorm && userD && !userD.includes(dNorm) && !dNorm.includes(userD)) return false;
      }

      if (thana && thana !== 'সকল থানা/উপজেলা' && thana !== 'সকল উপজেলা' && thana !== 'সকল থানা' && thana !== 'All' && thana !== '') {
        const tNorm = thana.toLowerCase().replace('উপজেলা', '').replace('থানা', '').replace('সদর', '').trim();
        const userU = (user.upazila || user.thana || '').toLowerCase().replace('উপজেলা', '').replace('থানা', '').replace('সদর', '').trim();
        if (tNorm && userU && !userU.includes(tNorm) && !tNorm.includes(userU)) return false;
      }

      if (bloodGroup && bloodGroup !== 'সকল ব্লাড গ্রুপ' && bloodGroup !== 'সকল গ্রুপ' && bloodGroup !== 'All' && bloodGroup !== '') {
        const cleanBg = bloodGroup.replace('পজিটিভ', '+').replace('নেগেটিভ', '-').trim().toUpperCase();
        const userBg = (user.bloodGroup || '').replace('পজিটিভ', '+').replace('নেগেটিভ', '-').trim().toUpperCase();
        if (cleanBg && !userBg.includes(cleanBg)) return false;
      }

      if (profession && profession !== 'সকল পেশা' && profession !== 'সকল ক্যাটাগরি' && profession !== 'All' && profession !== '') {
        const pNorm = profession.toLowerCase().trim();
        const userP = `${user.profession || ''} ${user.professionBn || ''} ${user.serviceCategory || ''} ${user.categorySkill || ''}`.toLowerCase();
        if (!userP.includes(pNorm) && !pNorm.includes(userP)) return false;
      }

      if (para && para.trim().length > 0) {
        const paraNorm = para.toLowerCase().trim();
        const userPara = `${user.mahalla || ''} ${user.para || ''} ${user.paraMahalla || ''}`.toLowerCase();
        if (!userPara.includes(paraNorm)) return false;
      }

      if (keyword && keyword.trim().length > 0) {
        const kNorm = keyword.toLowerCase().trim();
        const searchableText = `${user.fullName || user.name || ''} ${user.phone || ''} ${user.profession || ''} ${user.professionBn || ''} ${user.serviceCategory || ''} ${user.district || ''} ${user.upazila || ''} ${user.mahalla || ''} ${user.para || ''} ${user.bloodGroup || ''} ${user.categorySkill || ''}`.toLowerCase();
        if (!searchableText.includes(kNorm)) {
          const synonyms = getSynonymsForWord(kNorm);
          const matchesSynonym = synonyms.some(syn => searchableText.includes(syn.toLowerCase()));
          if (!matchesSynonym && !fuzzyStringMatch(searchableText, kNorm, 1)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // ==========================================
  // PRODUCTS & STORE CATALOG (SUPABASE BINDING)
  // ==========================================

  public saveProducts(products: OrganicProduct[]): void {
    this.productCache = products;
    this.notify();
  }

  public getProducts(defaultProducts: OrganicProduct[]): OrganicProduct[] {
    const cleanCache = (this.productCache || []).filter(p => !isLegacyDemoProduct(p));
    return cleanCache;
  }

  /**
   * Universal mapper from raw DB rows or JSON storage records to StoreProduct model
   */
  public mapProductRecord(d: any): StoreProduct {
    let categoryLabelBn = d.category_label_bn || d.categoryLabelBn;
    if (!categoryLabelBn) {
      if (d.category === 'Cosmetics') categoryLabelBn = 'কসমেটিক / প্রসাধনী / স্কিনকেয়ার';
      else if (d.category === 'Clothing') categoryLabelBn = 'পোশাক-আশাক / আদিবাসী পোশাক-আশাক / আদিবাসী পোশাক';
      else if (d.category === 'Electronics') categoryLabelBn = 'ইলেকট্রনিক্স';
      else if (d.category === 'Medicines') categoryLabelBn = 'ঔষধ';
      else if (d.category === 'Furniture') categoryLabelBn = 'আসবাবপত্র';
      else if (d.category === 'Construction') categoryLabelBn = 'নির্মাণ সামগ্রী';
      else if (d.category === 'Toys') categoryLabelBn = 'খেলনা';
      else if (d.category === 'Books') categoryLabelBn = 'বইপত্র';
      else if (d.category === 'RealEstate') categoryLabelBn = 'রিয়েল এস্টেট';
      else if (d.category === 'Food') categoryLabelBn = 'ফুড / ভোজ্য পণ্য';
      else if (d.category === 'ShutkiSidol') categoryLabelBn = 'অর্গানিক শুটকি / পাহাড়ি শুটকি';
      else if (d.category === 'Herbal') categoryLabelBn = 'ভেষজ / পাহাড়ি ভেষজ পণ্য';
      else if (d.category === 'Jhum') categoryLabelBn = 'জুমের পণ্য / জুম চাষের পণ্য';
      else if (d.category === 'Jewelry') categoryLabelBn = 'অর্নামেন্টস';
      else if (d.category === 'Crafts' || d.category === 'CraftsHoney') categoryLabelBn = 'হস্ত শিল্প';
      else if (d.category === 'SpicesGrains') categoryLabelBn = 'ফুড / ভোজ্য পণ্য';
      else if (d.category === 'Organic') categoryLabelBn = 'ভেষজ / পাহাড়ি ভেষজ পণ্য';
      else categoryLabelBn = 'ফুড / ভোজ্য পণ্য';
    }

    const rawName = d.products_name || d.name_bn || d.title || d.name || d.nameBn || 'অজ্ঞাত পণ্য';
    const rawDesc = d.short_description || d.description || d.description_bn || d.descriptionBn || '';
    const rawImageCandidate = d.products_photos || d.image_url || d.image || (Array.isArray(d.images) && d.images[0]) || (Array.isArray(d.gallery_urls) && d.gallery_urls[0]) || '';
    const rawImage = getProductPublicUrl(rawImageCandidate);

    const parsedPhotos = parseAllProductPhotos(d.products_photos || d.images || d.gallery_urls);
    const rawImages = parsedPhotos.length > 0 ? parsedPhotos : (rawImage ? [rawImage] : []);

    const rawRegular = Number(d.regular_price ?? d.original_price ?? d.originalPrice ?? d.price ?? 0);
    const rawDiscount = (d.discount_price !== undefined && d.discount_price !== null && Number(d.discount_price) > 0)
      ? Number(d.discount_price)
      : ((d.discountPrice !== undefined && d.discountPrice !== null && Number(d.discountPrice) > 0) ? Number(d.discountPrice) : undefined);

    const hasGenuineDiscount = rawRegular > 0 && rawDiscount !== undefined && rawRegular > rawDiscount;
    const originalPrice = hasGenuineDiscount ? rawRegular : undefined;
    const discountPrice = hasGenuineDiscount ? rawDiscount : undefined;
    const effectivePrice = discountPrice || rawRegular;
    const stock = Number(d.stock_quantity ?? d.stock ?? d.quantity ?? d.inventory ?? (d.stock_status === 'out_of_stock' ? 0 : 50));

    const rawBadges = Array.isArray(d.badges) 
      ? d.badges 
      : (typeof d.badges === 'string' && d.badges ? [d.badges] : (d.badge ? [d.badge] : (d.discount_badge ? ['স্পেশাল অফার'] : [])));

    const rawHighlights = Array.isArray(d.key_highlights) && d.key_highlights.length > 0
      ? d.key_highlights
      : (Array.isArray(d.features) && d.features.length > 0
          ? d.features
          : (Array.isArray(d.benefits) && d.benefits.length > 0 ? d.benefits : []));

    return {
      id: String(d.id),
      code: d.code || d.sku || undefined,
      sku: d.sku || d.code || undefined,
      createdAt: d.created_at || d.createdAt || undefined,
      created_at: d.created_at || d.createdAt || undefined,
      title_bn: d.title_bn || rawName,
      title_en: d.title_en || d.name_en || d.nameEn || rawName,
      nameBn: rawName,
      nameEn: d.name_en || d.nameEn || rawName,
      category: d.category || 'Food',
      categoryLabelBn: categoryLabelBn,
      price: effectivePrice,
      discount_price: discountPrice,
      discountPrice: discountPrice,
      original_price: originalPrice,
      originalPrice: originalPrice,
      unit_pack: d.unit_pack || d.unit || '১ পিস',
      unit: d.unit || d.unit_pack || '১ পিস',
      origin: d.origin || d.production_origin || d.productionOrigin || 'পার্বত্য চট্টগ্রাম',
      productionOrigin: d.production_origin || d.productionOrigin || d.origin || '',
      quality_standard: d.quality_standard || d.quality_standards || d.qualityStandards || '১০০% বিশুদ্ধ ও পরীক্ষিত',
      qualityStandards: d.quality_standard || d.quality_standards || d.qualityStandards || '১০০% বিশুদ্ধ ও পরীক্ষিত',
      seller_info: d.seller_info || d.seller_name || d.sellerName || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
      how_it_is_produced: d.how_it_is_produced || d.production_method || d.productionMethod || '',
      productionMethod: d.how_it_is_produced || d.production_method || d.productionMethod || '',
      materials_and_ingredients: d.materials_and_ingredients || d.materials || '',
      materials: d.materials_and_ingredients || d.materials || '',
      usage_and_storage: d.usage_and_storage || d.usage_instructions || d.usageInstructions || '',
      usageInstructions: d.usage_and_storage || d.usage_instructions || d.usageInstructions || '',
      key_highlights: rawHighlights,
      features: rawHighlights,
      benefits: rawHighlights,
      badges: rawBadges,
      badge: rawBadges[0] || (d.badge ? d.badge : undefined),
      badgeColor: d.badge_color || d.badgeColor || 'bg-emerald-600',
      videoUrl: d.video_url || d.videoUrl || '',
      youtubeUrl: d.youtube_url || d.youtubeUrl || d.video_url || d.videoUrl || '',
      image: rawImage,
      images: rawImages,
      products_photos: rawImage,
      productsPhotos: rawImage,
      productPhotos: rawImage,
      image_url: rawImage,
      rating: d.rating !== undefined && d.rating !== null && !isNaN(Number(d.rating)) ? Number(d.rating) : 0,
      reviewsCount: Number(d.reviews_count ?? d.reviewsCount ?? 0) || 0,
      stock_quantity: stock,
      stock: stock,
      descriptionBn: rawDesc,
      descriptionEn: d.description_en || d.descriptionEn || rawDesc,
      isPublished: d.is_active !== false && d.is_published !== false,
      verifiedSeller: d.verified_seller !== undefined ? d.verified_seller : true,
      sellerName: d.seller_info || d.seller_name || d.sellerName || '',
      sellerPhone: d.seller_phone || d.sellerPhone || '',
      sellerPhoneMasked: d.seller_phone_masked || d.sellerPhoneMasked || ''
    } as unknown as StoreProduct;
  }

  /**
   * Fetches all products dynamically from Supabase database.
   * Multi-level resilient architecture:
   * Level 1: Direct Supabase public.products table query
   * Level 2: Backend server proxy /api/products (queries Supabase server-side with elevated credentials)
   * Level 3: Supabase Cloud Storage catalog.json
   */
  public async fetchProductsFromSupabase(): Promise<StoreProduct[]> {
    if (!isSupabaseConfigured) return [];

    // 1. Direct Supabase Query on public.products table
    try {
      const { data, error } = await withDbTimeout(
        supabase.from('products').select('*'),
        4000,
        { data: null, error: null } as any
      );

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const mapped = data
          .map((d: any) => this.mapProductRecord(d))
          .filter((p: StoreProduct) => !isLegacyDemoProduct(p));
        if (mapped.length > 0) {
          const sorted = sortProductsAscending(mapped);
          this.storeProductsCache = sorted;
          return sorted;
        }
      }
      if (error && error.code !== 'PGRST205' && error.code !== '42501') {
        console.info('[DatabaseService] Supabase .from("products").select note:', error.message);
      }
    } catch (err) {
      console.info('[DatabaseService] Supabase table fetch note:', err);
    }

    // 2. Server API Route fallback (queries Supabase on backend with elevated credentials)
    try {
      const apiRes = await fetch('/api/products');
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && Array.isArray(apiData.products) && apiData.products.length > 0) {
          const mapped: StoreProduct[] = apiData.products
            .map((d: any) => this.mapProductRecord(d))
            .filter((p: StoreProduct) => !isLegacyDemoProduct(p));
          if (mapped.length > 0) {
            const sorted: StoreProduct[] = sortProductsAscending<StoreProduct>(mapped);
            this.storeProductsCache = sorted;
            return sorted;
          }
        }
      }
    } catch (apiErr) {
      console.warn('[DatabaseService] Server API /api/products note:', apiErr);
    }

    // 3. Cloud Storage Catalog Fallback (100% cloud-native persistence on the same Supabase project)
    try {
      const cdnUrl = `${supabaseUrl}/storage/v1/object/public/products/catalog.json?t=${Date.now()}`;
      const res = await fetch(cdnUrl, { cache: 'no-cache' });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const mapped = items
            .map((d: any) => this.mapProductRecord(d))
            .filter((p: StoreProduct) => !isLegacyDemoProduct(p));
          if (mapped.length > 0) {
            const sorted = sortProductsAscending(mapped);
            this.storeProductsCache = sorted;
            return sorted;
          }
        }
      }
    } catch (cdnErr) {
      console.warn('[DatabaseService] Supabase Storage CDN catalog fetch note:', cdnErr);
    }

    return this.storeProductsCache || [];
  }

  /**
   * Persists a product (create or update) directly to Supabase products table, backend server, and cloud storage
   */
  public async saveProductToSupabase(
    product: StoreProduct
  ): Promise<{ success: boolean; data?: StoreProduct; error?: string }> {
    try {
      const sanitized = sanitizeObject(product);
      const dbId = toDatabaseUuid(sanitized.id);

      if (isSupabaseConfigured) {
        let productPhoto = sanitized.image || (Array.isArray(sanitized.images) && sanitized.images[0]) || '';
        if (typeof productPhoto === 'string' && (productPhoto.startsWith('blob:') || productPhoto.startsWith('data:'))) {
          try {
            const blobRes = await fetch(productPhoto);
            const blobData = await blobRes.blob();
            const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(36).substring(2, 10)}`;
            const uniqueFileName = `${Date.now()}_${uniqueId}.jpg`;
            const { error: upErr } = await supabase.storage
              .from('products')
              .upload(uniqueFileName, blobData, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/jpeg'
              });
            if (!upErr) {
              const { data: pubData } = supabase.storage.from('products').getPublicUrl(uniqueFileName);
              productPhoto = pubData?.publicUrl || uniqueFileName;
              sanitized.image = productPhoto;
            }
          } catch (e) {
            console.warn('[DatabaseService] Blob upload fallback error:', e);
          }
        }

        const isNumericId = sanitized.id && !isNaN(Number(sanitized.id)) && Number(sanitized.id) > 0;
        const sAny = sanitized as any;
        const discountPriceVal = Number(sAny.discount_price !== undefined ? sAny.discount_price : (sAny.discountPrice !== undefined ? sAny.discountPrice : 0));
        const regularPriceVal = Number(sAny.originalPrice || sAny.regular_price || sAny.price || 0);
        const effectivePriceVal = discountPriceVal > 0 ? discountPriceVal : regularPriceVal;

        const supaPayload: Record<string, any> = {
          name: sAny.title_bn || sAny.nameBn || sAny.title || sAny.name || 'পণ্য',
          price: effectivePriceVal,
          regular_price: regularPriceVal,
          discount_price: discountPriceVal > 0 ? discountPriceVal : 0,
          description: sAny.descriptionBn || sAny.description || '',
          image_url: getProductPublicUrl(productPhoto),
          category: sAny.category || 'Food',
          stock_quantity: Number(sAny.stock_quantity ?? sAny.stock ?? 1),
          products_name_en: sAny.title_en || sAny.name_en || sAny.nameEn || sAny.products_name_en || null,
          badges: Array.isArray(sAny.badges) ? sAny.badges : (sAny.badge ? [sAny.badge] : []),
          video_url: sAny.videoUrl || sAny.video_url || null,
          key_highlights: Array.isArray(sAny.key_highlights) ? sAny.key_highlights : [],
          production_process: sAny.how_it_is_produced || sAny.production_process || null,
          ingredients: sAny.materials_and_ingredients || sAny.ingredients || null,
          usage_instructions: sAny.usage_and_storage || sAny.usage_instructions || sAny.usageInstructions || null
        };

        // 1. Insert or update directly to Supabase products table with strictly matching schema
        try {
          const isExisting = Boolean(sanitized.id && sanitized.id !== 'preview_draft_prod' && sanitized.id !== 'new');
          if (isExisting) {
            const query = supabase.from('products').update(supaPayload);
            const { error: updErr } = await withDbTimeout(
              Promise.resolve(isNumericId ? query.eq('id', Number(sanitized.id)) : query.eq('id', sanitized.id)),
              4500
            );
            if (updErr) {
              console.warn('[DatabaseService] Supabase product update note:', updErr.message);
              // Fallback insert if not found in table
              const { data: insData, error: insErr } = await withDbTimeout(
                Promise.resolve(supabase.from('products').insert([supaPayload]).select()),
                4500
              );
              if (!insErr && insData && insData[0]) {
                sanitized.id = String(insData[0].id);
              }
            }
          } else {
            const { data: insData, error: insErr } = await withDbTimeout(
              Promise.resolve(supabase.from('products').insert([supaPayload]).select()),
              4500
            );
            if (!insErr && insData && insData[0]) {
              sanitized.id = String(insData[0].id);
            } else if (insErr) {
              console.warn('[DatabaseService] Supabase product insert note, trying essential fields fallback:', insErr.message);
              // SAFE PRODUCT INSERTION (FALLBACK TO ESSENTIAL FIELDS)
              const safeEssentialPayload = {
                title: sAny.name_bn || sAny.title || sAny.nameBn || sAny.title_bn || 'নতুন পণ্য',
                price: Number(effectivePriceVal || sAny.price) || 0,
                category: sAny.category || 'সাধারণ',
                image_url: getProductPublicUrl(productPhoto) || sAny.image_url || sAny.image || '',
                description: sAny.description || sAny.descriptionBn || '',
                stock: Number(sAny.stock ?? sAny.stock_quantity) || 10
              };
              const { data: essData } = await supabase.from('products').insert([safeEssentialPayload]).select();
              if (essData && essData[0]) {
                sanitized.id = String(essData[0].id);
              }
            }
          }
        } catch (dbErr) {
          console.warn('[DatabaseService] Supabase product table save exception:', dbErr);
        }

        // 2. Also keep Supabase Cloud Storage catalog.json permanently synced
        try {
          let currentList = [...(this.storeProductsCache || [])];
          const existingIdx = currentList.findIndex(p => p.id === sanitized.id || p.id === dbId);
          if (existingIdx >= 0) {
            currentList[existingIdx] = sanitized;
          } else {
            currentList.push(sanitized);
          }
          currentList = sortProductsAscending(currentList);
          this.storeProductsCache = currentList;

          await supabase.storage.from('products').upload(
            'catalog.json',
            JSON.stringify(currentList),
            { contentType: 'application/json', upsert: true }
          );
        } catch (storageErr) {
          console.warn('[DatabaseService] Supabase storage catalog sync note:', storageErr);
        }

        // 3. Mirror to backend /api/products route with admin authentication
        try {
          await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAdminAuthHeaders()
            },
            body: JSON.stringify(sanitized)
          });
        } catch (apiErr) {
          console.warn('[DatabaseService] Backend /api/products POST mirror note:', apiErr);
        }
      }

      this.notifyEntityChange('products');
      return { success: true, data: sanitized };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save product:', err);
      return { success: false, error: err?.message || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে' };
    }
  }

  /**
   * Deletes a product from Supabase database and cloud storage
   */
  public async deleteProductFromSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(productId);
      if (isSupabaseConfigured) {
        const isNumProd = !isNaN(Number(productId)) && Number(productId) > 0;
        const isNumDb = !isNaN(Number(dbId)) && Number(dbId) > 0;
        const validProdId = isValidUuid(productId);
        const validDbId = isValidUuid(dbId);

        // 1. Explicitly execute DELETE against Supabase 'products' table
        if (isNumProd) {
          try {
            await withDbTimeout(
              Promise.resolve(supabase.from('products').delete().eq('id', Number(productId))),
              4000
            );
          } catch (err) {
            console.warn('[DatabaseService] Supabase product delete by numeric id note:', err);
          }
        }
        try {
          await withDbTimeout(
            Promise.resolve(supabase.from('products').delete().eq('id', productId)),
            4000
          );
        } catch (err) {
          console.warn('[DatabaseService] Supabase product delete by id note:', err);
        }

        if (isNumDb && Number(dbId) !== Number(productId)) {
          try {
            await withDbTimeout(
              Promise.resolve(supabase.from('products').delete().eq('id', Number(dbId))),
              4000
            );
          } catch (err) {
            console.warn('[DatabaseService] Supabase product delete by numeric dbId note:', err);
          }
        }
        if (dbId && dbId !== productId) {
          try {
            await withDbTimeout(
              Promise.resolve(supabase.from('products').delete().eq('id', dbId)),
              4000
            );
          } catch (err) {
            console.warn('[DatabaseService] Supabase product delete by dbId note:', err);
          }
        }

        // If not matched by id or custom ID, match by product name or code
        const cachedProduct = (this.storeProductsCache || []).find(p => p.id === productId || p.id === dbId);
        if (cachedProduct) {
          const nameToMatch = cachedProduct.nameBn || (cachedProduct as any).title_bn || (cachedProduct as any).title || (cachedProduct as any).name;
          if (nameToMatch) {
            try {
              await withDbTimeout(
                Promise.resolve(supabase.from('products').delete().eq('name', nameToMatch)),
                3500
              );
            } catch (err) {
              console.warn('[DatabaseService] Supabase product delete by name note:', err);
            }
          }
          // Clean up image from Supabase Storage if hosted there
          if (cachedProduct.image && typeof cachedProduct.image === 'string') {
            try {
              const url = cachedProduct.image;
              const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.*)$/i);
              if (m && m[1] && m[2]) {
                const bucket = m[1];
                const filePath = decodeURIComponent(m[2].split('?')[0]);
                await supabase.storage.from(bucket).remove([filePath]);
              }
            } catch {}
          }
        }

        try {
          if (this.storeProductsCache) {
            const filtered = this.storeProductsCache.filter(p => p.id !== productId && p.id !== dbId);
            this.storeProductsCache = filtered;
            await supabase.storage.from('products').upload(
              'catalog.json',
              JSON.stringify(filtered),
              { contentType: 'application/json', upsert: true }
            );
          }
        } catch (storageErr) {
          console.warn('[DatabaseService] Supabase storage catalog delete sync note:', storageErr);
        }

        // Mirror delete to backend /api/products/:id
        try {
          await fetch(`/api/products/${encodeURIComponent(productId)}`, {
            method: 'DELETE',
            headers: getAdminAuthHeaders()
          });
        } catch (apiErr) {
          console.warn('[DatabaseService] Backend /api/products DELETE note:', apiErr);
        }
      }
      this.productCache = (this.productCache || []).filter(p => p.id !== productId && p.id !== dbId);
      this.storeProductsCache = (this.storeProductsCache || []).filter(p => p.id !== productId && p.id !== dbId);
      this.notifyEntityChange('products');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete product' };
    }
  }

  // ==========================================
  // FEED POSTS & COMMUNITY (SUPABASE BINDING)
  // ==========================================

  /**
   * Fetches community/feed posts from Supabase database
   */
  public async fetchPostsFromSupabase(): Promise<FeedPost[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await withDbTimeout(
        supabase
          .from('feed_posts')
          .select('*'),
        4000,
        { data: null, error: null } as any
      );

      if (error || !data || data.length === 0) {
        if (error) {
          if (error.code === '42501') {
            console.info('[DatabaseService] feed_posts table RLS restricted (42501). Falling back to catalog/backend.');
          } else if (error.code !== 'PGRST205') {
            console.info('[DatabaseService] fetchPosts note:', error.message);
          }
        }
        return [];
      }

      const mapped: FeedPost[] = data.map((d: any): FeedPost => ({
        id: d.id,
        authorName: d.author_name || 'ইউজার',
        authorRole: (d.author_role as any) || 'User',
        authorAvatar: d.author_avatar,
        postType: (d.post_type as any) || 'General',
        title: d.title || '',
        titleEn: d.title_en,
        content: d.content || '',
        division: d.division || 'চট্টগ্রাম',
        district: d.district || 'খাগড়াছড়ি',
        upazila: d.upazila || 'সদর',
        mahalla: d.mahalla || '',
        category: d.category || 'সাধারণ',
        price: d.price ? Number(d.price) : undefined,
        contactPhoneHidden: d.contact_phone ? `${d.contact_phone.slice(0, 5)}XX-XXX${d.contact_phone.slice(-3)}` : '+880 17XX-XXXXXX',
        realPhone: d.contact_phone,
        status: (d.status as any) || 'Approved',
        createdAt: d.created_at ? new Date(d.created_at).toLocaleDateString('bn-BD') : 'এখনই',
        likes: Number(d.likes) || 0,
        commentsCount: Number(d.comments_count) || 0,
        image: d.image_url,
        isVerifiedUser: d.author_role === 'Provider'
      }));

      return mapped;
    } catch (err) {
      console.info('[DatabaseService] fetchPostsFromSupabase note:', err);
      return [];
    }
  }

  /**
   * Persists a post directly to Supabase feed_posts table
   */
  public async savePostToSupabase(post: FeedPost): Promise<{ success: boolean; data?: FeedPost; error?: string }> {
    try {
      const sanitized = sanitizeObject(post);
      const dbId = toDatabaseUuid(sanitized.id);

      if (isSupabaseConfigured) {
        const payload: Record<string, any> = {
          id: dbId,
          author_name: sanitized.authorName || 'ইউজার',
          author_role: sanitized.authorRole || 'User',
          author_avatar: sanitized.authorAvatar || null,
          post_type: sanitized.postType || 'General',
          title: sanitized.title || '',
          content: sanitized.content || '',
          division: sanitized.division || 'চট্টগ্রাম',
          district: sanitized.district || 'খাগড়াছড়ি',
          upazila: sanitized.upazila || 'সদর',
          mahalla: sanitized.mahalla || '',
          category: sanitized.category || 'সাধারণ',
          price: sanitized.price ? Number(sanitized.price) : null,
          contact_phone: sanitized.realPhone || sanitized.contactPhoneHidden || '01700000000',
          likes: Number(sanitized.likes) || 0,
          comments_count: Number(sanitized.commentsCount) || 0,
          image_url: sanitized.image || null,
          status: sanitized.status || 'Approved',
          updated_at: new Date().toISOString()
        };

        const { error } = await withDbTimeout(
          Promise.resolve(
            supabase.from('feed_posts').upsert(payload, { onConflict: 'id' })
          ),
          4500,
          { error: null } as any
        );

        if (error) {
          console.warn('[DatabaseService] Supabase savePost error:', error.message);
        }
      }

      this.notifyEntityChange('posts');
      return { success: true, data: sanitized };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save post:', err);
      return { success: false, error: err?.message || 'পোস্ট সংরক্ষণ করতে সমস্যা হয়েছে' };
    }
  }

  /**
   * Deletes a post from Supabase database
   */
  public async deletePostFromSupabase(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(postId);
      if (isSupabaseConfigured) {
        try {
          if (!isNaN(Number(postId)) && Number(postId) > 0) {
            await withDbTimeout(
              Promise.resolve(supabase.from('feed_posts').delete().eq('id', Number(postId))),
              4000
            );
          } else {
            await withDbTimeout(
              Promise.resolve(supabase.from('feed_posts').delete().eq('id', postId)),
              4000
            );
          }
        } catch (err) {
          console.warn('[DatabaseService] Supabase post delete note:', err);
        }
      }
      this.notifyEntityChange('posts');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete post' };
    }
  }

  // ==========================================
  // BANNERS & PROMOTIONS (SUPABASE BINDING)
  // ==========================================

  /**
   * Fetches banners from Supabase database (strictly banners table)
   * 100% permanence across remixes and migrations.
   */
  public async fetchBannersFromSupabase(): Promise<AdminBanner[]> {
    if (!isSupabaseConfigured) return this.bannersCache || [];
    try {
      // 1. Direct query from 'platform_banners' table as explicitly required
      let pResult = await withDbTimeout(
        supabase.from('platform_banners').select('*'),
        3500,
        { data: null, error: null } as any
      );

      if (!pResult.error && pResult.data && Array.isArray(pResult.data) && pResult.data.length > 0) {
        const mapped: AdminBanner[] = pResult.data.map((d: any): AdminBanner => {
          const img = d.image_url || d.image || d.imageUrl || '';
          const link = d.link_url || d.target_link || d.linkUrl || d.action_url || '/';
          return {
            id: String(d.id),
            title: d.title || d.alt_text || '',
            altText: d.alt_text || d.title || '',
            subtitle: d.subtitle || '',
            tag: d.tag || d.badge || 'স্পেশাল অফার',
            imageUrl: img,
            image_url: img,
            image: img,
            link_url: link,
            linkUrl: link,
            targetLink: link,
            actionUrl: link,
            placement: d.placement || 'homepage_hero',
            isActive: d.is_active ?? d.isActive ?? true,
            displayOrder: Number(d.display_order ?? d.sort_order ?? d.order ?? 0),
            order: Number(d.display_order ?? d.sort_order ?? d.order ?? 0),
            createdAt: d.created_at ? String(d.created_at).split('T')[0] : new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => a.displayOrder - b.displayOrder);

        this.bannersCache = mapped;
        return mapped;
      }

      // 2. Query fallback 'banners' table if platform_banners returned empty/not found
      let result = await withDbTimeout(
        supabase.from('banners').select('*'),
        3500,
        { data: null, error: null } as any
      );

      // If banners table query succeeded and returned array
      if (!result.error && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const mapped: AdminBanner[] = result.data.map((d: any): AdminBanner => {
          const img = d.image_url || d.image || d.imageUrl || '';
          const link = d.target_link || d.link_url || d.action_url || '/';
          return {
            id: String(d.id),
            title: d.title || d.alt_text || '',
            altText: d.alt_text || d.title || '',
            subtitle: d.subtitle || '',
            tag: d.badge || d.tag || 'স্পেশাল অফার',
            imageUrl: img,
            image_url: img,
            image: img,
            link_url: link,
            linkUrl: link,
            targetLink: link,
            actionUrl: link,
            placement: d.placement || 'homepage_hero',
            isActive: d.is_active ?? d.isActive ?? true,
            displayOrder: Number(d.display_order ?? d.order ?? d.sort_order ?? 0),
            order: Number(d.display_order ?? d.order ?? d.sort_order ?? 0),
            createdAt: d.created_at ? String(d.created_at).split('T')[0] : new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => a.displayOrder - b.displayOrder);

        this.bannersCache = mapped;
        return mapped;
      }

      return this.bannersCache || [];
    } catch (err) {
      console.warn('[DatabaseService] fetchBannersFromSupabase error:', err);
      return this.bannersCache || [];
    }
  }

  /**
   * Persists a banner (create or update) directly to Supabase banners table
   * Strictly uses valid PostgreSQL schema columns (tag NOT badge, link_url/target_link NOT link)
   */
  public async saveBannerToSupabase(
    banner: AdminBanner
  ): Promise<{ success: boolean; data?: AdminBanner; error?: string }> {
    try {
      const sanitized = sanitizeObject(banner);
      const dbId = toDatabaseUuid(sanitized.id);
      const orderNum = Number(sanitized.displayOrder ?? sanitized.order ?? 1) || 1;

      if (isSupabaseConfigured) {
        const isNumBanner = sanitized.id && !isNaN(Number(sanitized.id)) && Number(sanitized.id) > 0;
        const bAny = sanitized as any;

        // Strictly adheres to database schema: (title, subtitle, image_url, badge, placement, target_link, display_order, is_active)
        // Strictly NO non-existent columns like 'link'
        const cleanBannerPayload: Record<string, any> = {
          title: String(sanitized.title || bAny.altText || 'ঝাদিমাদি ব্যানার').trim(),
          subtitle: sanitized.subtitle ? String(sanitized.subtitle).trim() : '',
          image_url: String(sanitized.imageUrl || bAny.image_url || '').trim(),
          badge: String(bAny.badge || sanitized.tag || 'স্পেশাল অফার').trim(),
          placement: sanitized.placement || 'homepage_hero',
          target_link: String(sanitized.targetLink || sanitized.linkUrl || bAny.link_url || '/').trim(),
          display_order: orderNum,
          is_active: bAny.isActive ?? bAny.is_active ?? true
        };

        try {
          const targetId = isNumBanner ? Number(sanitized.id) : (isValidUuid(sanitized.id) ? sanitized.id : undefined);
          const { data: upsertData } = await resilientSupabaseUpsert('banners', cleanBannerPayload, {
            id: targetId,
            isUpdate: Boolean(targetId)
          });
          if (upsertData && upsertData[0] && !sanitized.id) {
            sanitized.id = String(upsertData[0].id);
          }
        } catch (dbErr) {
          console.warn('[DatabaseService] Banner table resilient save exception:', dbErr);
        }

        // Keep local cache and storage catalog synchronized
        try {
          let currentList = [...(this.bannersCache || [])];
          const existingIdx = currentList.findIndex(b => b.id === sanitized.id || b.id === dbId);
          if (existingIdx >= 0) {
            currentList[existingIdx] = sanitized;
          } else {
            currentList.push(sanitized);
          }
          currentList.sort((a, b) => Number(a.displayOrder ?? a.order ?? 0) - Number(b.displayOrder ?? b.order ?? 0));
          this.bannersCache = currentList;

          // Attempt client upload to banners and products buckets
          try {
            await supabase.storage.from('banners').upload(
              'catalog.json',
              JSON.stringify(currentList, null, 2),
              { contentType: 'application/json', upsert: true }
            );
          } catch {}

          try {
            await supabase.storage.from('products').upload(
              'banners_catalog.json',
              JSON.stringify(currentList, null, 2),
              { contentType: 'application/json', upsert: true }
            );
          } catch {}

          // Also trigger server sync to ensure service key uploads to storage
          try {
            const authHeaders = getAdminAuthHeaders();
            await fetch('/api/banners/sync-storage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({ banners: currentList })
            });
          } catch {}
        } catch (storageErr) {
          console.warn('[DatabaseService] Supabase banner storage catalog sync note:', storageErr);
        }
      }

      this.notifyEntityChange('banners');
      return { success: true, data: sanitized };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save banner:', err);
      return { success: false, error: err?.message || 'ব্যানার সংরক্ষণ করতে সমস্যা হয়েছে' };
    }
  }

  /**
   * Deletes a banner from Supabase database (strictly banners table) and cloud storage
   */
  public async deleteBannerFromSupabase(bannerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(bannerId);
      if (isSupabaseConfigured) {
        const validBannerId = isValidUuid(bannerId);
        const validDbId = isValidUuid(dbId);
        const isNum = !isNaN(Number(bannerId)) && Number(bannerId) > 0;

        // Explicitly execute DELETE strictly against 'banners' table with resilient UUID & schema handling
        const cachedBanner = (this.bannersCache || []).find(b => b.id === bannerId || b.id === dbId);
        await resilientSupabaseDelete('banners', {
          id: isNum ? Number(bannerId) : (validBannerId ? bannerId : undefined),
          title: cachedBanner?.title,
          image_url: cachedBanner?.imageUrl
        });
        if (cachedBanner) {
          if (cachedBanner.imageUrl && typeof cachedBanner.imageUrl === 'string') {
            try {
              const url = cachedBanner.imageUrl;
              const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.*)$/i);
              if (m && m[1] && m[2]) {
                const bucket = m[1];
                const filePath = decodeURIComponent(m[2].split('?')[0]);
                await supabase.storage.from(bucket).remove([filePath]);
              }
            } catch {}
          }
        }

        // Update Cloud Storage catalog
        try {
          let currentList = (this.bannersCache || []).filter(b => b.id && b.id !== bannerId && b.id !== dbId);
          this.bannersCache = currentList;
          try {
            await supabase.storage.from('banners').upload(
              'catalog.json',
              JSON.stringify(currentList, null, 2),
              { contentType: 'application/json', upsert: true }
            );
          } catch {}

          try {
            const authHeaders = getAdminAuthHeaders();
            await fetch('/api/banners/sync-storage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({ banners: currentList })
            });
          } catch {}
        } catch {}
      }
      this.bannersCache = (this.bannersCache || []).filter(b => b.id && b.id !== bannerId && b.id !== dbId);
      this.notifyEntityChange('banners');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete banner' };
    }
  }

  // ==========================================
  // ORDERS & ORDER LIFECYCLE
  // ==========================================

  /**
   * Updates order status in Supabase orders table and associated order_items
   */
  public async updateOrderStatusInDatabase(
    orderId: string,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dbId = toDatabaseUuid(orderId);
      if (isSupabaseConfigured) {
        try {
          const updateData: Record<string, any> = {
            status,
            order_status: status,
            updated_at: new Date().toISOString()
          };
          if (notes) updateData.notes = notes;

          await withDbTimeout(
            Promise.resolve(
              supabase
                .from('orders')
                .update(updateData)
                .or(`order_number.eq.${orderId},id.eq.${dbId}`)
            ),
            4000
          );

          // Also update status in order_items
          await withDbTimeout(
            Promise.resolve(
              supabase
                .from('order_items')
                .update({ status: status.toLowerCase() })
                .or(`order_number.eq.${orderId},order_id.eq.${dbId}`)
            ),
            3000
          );
        } catch (err) {
          console.warn('[DatabaseService] Supabase update order status warning:', err);
        }
      }

      // Sync with server API
      try {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes })
        });
      } catch {}

      this.notifyEntityChange('orders');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update order status' };
    }
  }

  public saveProviders(providers: ServiceProvider[]): void {
    this.notify();
  }

  public getProviders(defaultProviders: ServiceProvider[]): ServiceProvider[] {
    return defaultProviders;
  }

  public async fetchOrdersFromDatabase(): Promise<ProductOrder[]> {
    // 1. Direct Supabase Query on public.orders table
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withDbTimeout(
          Promise.resolve(
            supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false })
          ),
          4500,
          { data: null, error: null } as any
        );

        if (!error && data && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            id: d.order_number || d.id,
            orderNumber: d.order_number || d.id,
            customerName: d.customer_name || 'গ্রাহক',
            customerPhone: d.customer_phone || '',
            deliveryAddress: d.delivery_address || '',
            district: d.district || '',
            upazila: d.upazila || '',
            totalAmount: Number(d.total_amount || 0),
            paymentMethod: d.payment_method || 'Cash on Delivery',
            paymentStatus: d.payment_status || 'pending',
            status: d.status || 'Pending',
            date: d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            items: d.items || [],
            notes: d.notes || ''
          }));
        }
      } catch (err) {
        console.warn('[DatabaseService] Supabase orders table query note:', err);
      }
    }

    // 2. Fallback to /api/orders
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          return data.orders;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] /api/orders fetch error:', err);
    }
    return [];
  }

  public async deleteOrderFromDatabase(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (isSupabaseConfigured) {
        try {
          await withDbTimeout(
            Promise.resolve(
              supabase.from('orders').delete().or(`order_number.eq.${orderId},id.eq.${orderId}`)
            ),
            3500
          );
        } catch (err) {
          console.warn('[DatabaseService] Supabase delete order note:', err);
        }
      }
      try {
        const authHeaders = getAdminAuthHeaders();
        await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'DELETE',
          headers: authHeaders
        });
      } catch {}
      this.notifyEntityChange('orders');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete order' };
    }
  }

  public saveOrders(orders: ProductOrder[]): void {
    this.notify();
  }

  public getOrders(defaultOrders: ProductOrder[]): ProductOrder[] {
    return defaultOrders;
  }

  /**
   * Submits a customer order to Supabase PostgreSQL and cloud notification channels.
   * Enforces Beta Phase standards (COD, Direct Contact, OTP verification)
   * and pre-defines future-proofing fields (commission_amount, payment_status, gateway_transaction_id).
   */
  public async submitOrderToDatabase(
    order: ProductOrder
  ): Promise<{ success: boolean; orderId: string; error?: string }> {
    try {
      const sanitized = sanitizeObject(order);
      const orderId = sanitized.id || `JDM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      const futureProofedOrder: ProductOrder = {
        ...sanitized,
        id: orderId,
        isBetaPhase: true,
        commissionRate: 0,
        commissionAmount: 0,
        commissionStatus: 'exempt',
        paymentStatus: sanitized.paymentStatus || 'pending',
        gatewayName: sanitized.gatewayName || null,
        gatewayTransactionId: sanitized.gatewayTransactionId || null,
        gatewayPayload: sanitized.gatewayPayload || null,
        orderChannel: sanitized.paymentMethod === 'Direct_Contact' ? 'Direct_Contact' : 'COD',
        customerOtpVerified: sanitized.customerOtpVerified ?? true,
        customerVerificationCode: sanitized.customerVerificationCode || undefined,
        date: sanitized.date || new Date().toISOString().split('T')[0],
        status: sanitized.status || 'Pending'
      };

      if (isSupabaseConfigured) {
        try {
          const dbOrderId = toDatabaseUuid(orderId);
          // 1. Insert main record into public.orders table
          const orderInsertPayload: any = {
            id: dbOrderId,
            order_number: orderId,
            customer_name: futureProofedOrder.customerName,
            customer_phone: futureProofedOrder.customerPhone,
            delivery_address: futureProofedOrder.deliveryAddress,
            district: (futureProofedOrder as any).district || 'খাগড়াছড়ি / পার্বত্য চট্টগ্রাম',
            upazila: (futureProofedOrder as any).upazila || '',
            total_amount: futureProofedOrder.totalAmount,
            payment_method: futureProofedOrder.paymentMethod,
            payment_status: futureProofedOrder.paymentStatus,
            status: futureProofedOrder.status || 'Pending',
            order_status: futureProofedOrder.status || 'Pending',
            commission_rate: 0,
            commission_amount: 0,
            commission_status: 'exempt',
            gateway_name: null,
            gateway_transaction_id: null,
            gateway_payload: null,
            is_beta_phase: true,
            order_channel: futureProofedOrder.orderChannel,
            customer_otp_verified: futureProofedOrder.customerOtpVerified,
            customer_verification_code: futureProofedOrder.customerVerificationCode || null,
            items: futureProofedOrder.items,
            notes: futureProofedOrder.notes || 'Beta Phase COD Order'
          };

          const { data: insertedOrder, error: orderInsertErr } = await withDbTimeout(
            Promise.resolve(
              supabase.from('orders').insert(orderInsertPayload).select('id, order_number').single()
            ),
            4000,
            { data: null, error: null } as any
          );

          if (orderInsertErr) {
            console.warn('[DatabaseService] Supabase orders table insert note:', orderInsertErr);
          }

          const linkedOrderId = insertedOrder?.id || dbOrderId;

          // 2. Insert individual purchased items into public.order_items table
          if (Array.isArray(futureProofedOrder.items) && futureProofedOrder.items.length > 0) {
            const lineItems = futureProofedOrder.items.map((item: any) => {
              const qty = Math.max(1, Number(item.quantity || item.qty || 1));
              const price = Math.max(0, Number(item.price || item.unitPrice || 0));
              const rawProdId = item.productId || item.id;
              const rawSellerId = item.sellerId || item.seller_id || (futureProofedOrder as any).sellerId;
              const sellerPhone = item.sellerPhone || item.seller_phone || (futureProofedOrder as any).sellerPhone || (futureProofedOrder as any).vendorPhone || '';

              return {
                order_id: linkedOrderId,
                order_number: orderId,
                product_id: rawProdId ? toDatabaseUuid(String(rawProdId)) : null,
                seller_id: rawSellerId ? toDatabaseUuid(String(rawSellerId)) : null,
                seller_phone: sellerPhone,
                product_name: item.nameBn || item.name || item.title || 'পণ্য',
                quantity: qty,
                unit_price: price,
                subtotal: qty * price,
                image_url: item.image || (item.images && item.images[0]) || '',
                status: (futureProofedOrder.status || 'Pending').toLowerCase()
              };
            });

            try {
              const { error: itemsInsertErr } = await withDbTimeout(
                Promise.resolve(supabase.from('order_items').insert(lineItems)),
                4000
              );
              if (itemsInsertErr) {
                // Fallback for minimal columns if table structure differs
                console.warn('[DatabaseService] order_items insert warning, retrying with core fields:', itemsInsertErr);
                const minimalRows = lineItems.map(r => ({
                  order_id: r.order_id,
                  product_id: r.product_id,
                  product_name: r.product_name,
                  quantity: r.quantity,
                  unit_price: r.unit_price,
                  subtotal: r.subtotal
                }));
                await supabase.from('order_items').insert(minimalRows);
              }
            } catch (itemErr) {
              console.warn('[DatabaseService] order_items insert fallback note:', itemErr);
            }

            // 3. Deduct product stock quantity if stock management is enabled
            for (const item of futureProofedOrder.items) {
              try {
                const rawPId = (item as any).productId || (item as any).id;
                if (rawPId) {
                  const pUuid = toDatabaseUuid(String(rawPId));
                  const { data: prodData } = await withDbTimeout(
                    Promise.resolve(
                      supabase
                        .from('products')
                        .select('id, stock, stock_quantity, track_inventory')
                        .or(`id.eq.${pUuid},id.eq.${rawPId}`)
                        .maybeSingle()
                    ),
                    3000
                  );

                  if (prodData) {
                    const currentStock = Number(prodData.stock_quantity ?? prodData.stock ?? -1);
                    if (currentStock > 0) {
                      const deductQty = Math.max(1, Number((item as any).quantity || (item as any).qty || 1));
                      const remainingStock = Math.max(0, currentStock - deductQty);
                      await withDbTimeout(
                        Promise.resolve(
                          supabase
                            .from('products')
                            .update({
                              stock: remainingStock,
                              stock_quantity: remainingStock,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', prodData.id)
                        ),
                        3000
                      );
                    }
                  }
                }
              } catch (stockErr) {
                console.warn('[DatabaseService] Product stock deduction note:', stockErr);
              }
            }
          }
        } catch (dbErr) {
          console.warn('[DatabaseService] Supabase remote insert error, falling back locally:', dbErr);
        }
      }

      // Also forward to server endpoint to trigger company email dispatch and cloud storage catalog sync
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(futureProofedOrder)
        });
      } catch (postErr) {
        console.warn('[DatabaseService] /api/orders sync note:', postErr);
      }

      this.notifyEntityChange('orders');
      return { success: true, orderId };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to submit order:', err);
      return { success: false, orderId: order.id || '', error: err.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে' };
    }
  }

  public saveBloodDonors(donors: BloodDonor[]): void {
    this.notify();
  }

  public getBloodDonors(defaultDonors: BloodDonor[]): BloodDonor[] {
    return defaultDonors;
  }

  /**
   * Fetches all blood donors from Supabase blood_donors table with fallback to server API & profiles
   */
  public async fetchBloodDonorsFromDatabase(): Promise<any[]> {
    let donors: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('blood_donors').select('*');
        if (!error && Array.isArray(data)) {
          // Return ONLY live records from Supabase; if 0 rows exist, return empty array without injecting mock rows
          return data.map((d: any) => ({
            id: String(d.id),
            name: d.name || d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
            bloodGroup: d.blood_group || d.bloodGroup || 'A+',
            phone: d.phone || d.contact_number || '',
            password: d.password || '',
            profession: d.profession || 'রক্তদাতা',
            division: d.division || 'চট্টগ্রাম',
            district: d.district || 'খাগড়াছড়ি',
            upazila: d.upazila || 'খাগড়াছড়ি সদর',
            area: d.area || d.mahalla || '',
            lastDonationDate: d.last_donation_date || d.lastDonationDate || '',
            totalDonations: Number(d.total_donations || d.totalDonations || 1),
            isAvailable: d.is_available !== false,
            verified: d.verified !== false,
            emergencyContact: d.emergency_contact || d.emergencyContact || '',
            age: Number(d.age || 25),
            districtUniqueId: d.unique_id || d.district_unique_id || '',
            search_tags: d.search_tags || [],
            hashtags: d.hashtags || []
          }));
        }
      } catch (err) {
        console.warn('[DatabaseService] Supabase blood_donors query note:', err);
      }
    }

    // Backend proxy query (only if Supabase was unconfigured or encountered network error)
    try {
      const res = await fetch('/api/blood-donors');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.donors)) {
          donors = json.donors.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            bloodGroup: d.bloodGroup,
            phone: d.phone,
            division: d.division || 'চট্টগ্রাম',
            district: d.district,
            upazila: d.upazila,
            area: d.area || '',
            lastDonationDate: d.lastDonationDate || '',
            totalDonations: Number(d.totalDonations || 1),
            isAvailable: d.available !== false && d.isAvailable !== false,
            verified: Boolean(d.verified),
            emergencyContact: d.emergencyContact || '',
            age: Number(d.age || 25),
            districtUniqueId: d.districtUniqueId || ''
          }));
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] /api/blood-donors fetch note:', err);
    }

    return donors;
  }

  /**
   * Saves or updates a blood donor in Supabase PostgreSQL database
   */
  public async saveBloodDonorToDatabase(
    donor: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const sanitized = sanitizeObject(donor);
      const dbId = toDatabaseUuid(sanitized.id);
      const tags = generateSearchTags('blood_donor', sanitized);

      if (isSupabaseConfigured) {
        // 1. Dedicated blood_donors table (mapped to all columns: full_name, phone_number, whatsapp_number, email, etc.)
        const donorPayload: Record<string, any> = {
          id: dbId,
          name: sanitized.name,
          full_name: sanitized.name || sanitized.fullName,
          blood_group: sanitized.bloodGroup || sanitized.blood_group || 'O+',
          phone: sanitized.phone || sanitized.phoneNumber,
          phone_number: sanitized.phone || sanitized.phoneNumber,
          whatsapp_number: sanitized.whatsappNumber || sanitized.phone,
          email: sanitized.email || null,
          district: sanitized.district || 'খাগড়াছড়ি',
          upazila: sanitized.upazila || 'সদর',
          latitude: sanitized.latitude || 0,
          longitude: sanitized.longitude || 0,
          consent_given: true,
          password: sanitized.password || '123456'
        };

        const insertRes = await smartSupabaseInsert('blood_donors', donorPayload);
        if (!insertRes.success && insertRes.error) {
          console.error('[DatabaseService] blood_donors table insert note:', insertRes.error);
        }

        // 2. Also mirror into profiles table (using ONLY valid profiles columns)
        try {
          const profilePayload: Record<string, any> = {
            id: dbId,
            unique_id: sanitized.districtUniqueId || sanitized.uniqueId || `DONOR-${Date.now().toString().slice(-4)}`,
            full_name: sanitized.name,
            name: sanitized.name,
            phone: sanitized.phone,
            profession: sanitized.profession || 'রক্তদাতা',
            blood_group: sanitized.bloodGroup || sanitized.blood_group || 'O+',
            district: sanitized.district || 'খাগড়াছড়ি',
            upazila: sanitized.upazila || 'সদর',
            area: sanitized.area || '',
            mahalla: sanitized.area || '',
            division: sanitized.division || 'চট্টগ্রাম',
            role: 'blood_donor',
            member_type: 'blood_donor',
            is_blood_donor: true,
            is_blood_donor_available: sanitized.isAvailable !== false,
            last_donation_date: sanitized.lastDonationDate || '',
            is_nid_verified: sanitized.verified !== false
          };

          await withDbTimeout(
            Promise.resolve(supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' })),
            3500
          );
        } catch {}
      }

      // Mirror to local server API for multi-client persistence
      try {
        await fetch('/api/blood-donors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: dbId,
            name: sanitized.name,
            bloodGroup: sanitized.bloodGroup,
            phone: sanitized.phone,
            password: sanitized.password || '',
            profession: sanitized.profession || 'রক্তদাতা',
            division: sanitized.division || 'চট্টগ্রাম',
            district: sanitized.district,
            upazila: sanitized.upazila,
            area: sanitized.area || '',
            lastDonationDate: sanitized.lastDonationDate || '',
            totalDonations: sanitized.totalDonations || 1,
            isAvailable: sanitized.isAvailable !== false,
            verified: sanitized.verified !== false,
            districtUniqueId: sanitized.districtUniqueId
          })
        });
      } catch (apiErr) {
        console.warn('[DatabaseService] /api/blood-donors mirror note:', apiErr);
      }

      this.notifyEntityChange('blood_donors');
      return { success: true, data: { ...sanitized, search_tags: tags.search_tags, hashtags: tags.hashtags } };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save blood donor:', err);
      return { success: false, error: err?.message || 'Failed to save blood donor' };
    }
  }

  /**
   * Saves or updates a Job Seeker / Bio-data profile in Supabase job_seekers table
   */
  public async saveJobSeekerToDatabase(
    seeker: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const sanitized = sanitizeObject(seeker);
      const dbId = toDatabaseUuid(sanitized.id);
      const tags = generateSearchTags('job_seeker', sanitized);

      if (isSupabaseConfigured) {
        const payload: Record<string, any> = {
          id: dbId,
          unique_id: sanitized.unique_id || sanitized.uniqueId || `JS-${Date.now().toString().slice(-4)}`,
          name: sanitized.name || sanitized.full_name || 'চাকরি প্রার্থী',
          full_name: sanitized.full_name || sanitized.name || 'চাকরি প্রার্থী',
          phone: sanitized.phone,
          email: sanitized.email || '',
          skills_or_job_type: sanitized.skills_or_job_type || sanitized.skillsOrJobType || '',
          skills: Array.isArray(sanitized.skills) ? sanitized.skills : (sanitized.skills ? [sanitized.skills] : []),
          education: sanitized.education || '',
          experience: sanitized.experience || '',
          experience_years: Number(sanitized.experienceYears || sanitized.experience) || 0,
          blood_group: sanitized.blood_group || sanitized.bloodGroup || '',
          tax_vat_info: sanitized.tax_vat_info || sanitized.taxVatInfo || sanitized.nidNumber || '',
          division: sanitized.division || 'চট্টগ্রাম',
          district: sanitized.district || 'খাগড়াছড়ি',
          upazila: sanitized.upazila || 'খাগড়াছড়ি সদর',
          area: sanitized.area || '',
          photo_url: sanitized.photo_url || sanitized.photoUrl || '',
          cv_url: sanitized.cv_url || sanitized.cvUrl || '',
          expected_salary: sanitized.expected_salary || sanitized.expectedSalary || '',
          search_tags: tags.search_tags,
          hashtags: tags.hashtags,
          updated_at: new Date().toISOString()
        };

        await smartSupabaseInsert('job_seekers', payload);
      }

      this.notifyEntityChange('job_seekers');
      return { success: true, data: { ...sanitized, search_tags: tags.search_tags, hashtags: tags.hashtags } };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save job seeker:', err);
      return { success: false, error: err?.message || 'Failed to save job seeker' };
    }
  }

  /**
   * Saves or updates a Job Circular in Supabase job_circulars table
   */
  public async saveJobCircularToDatabase(
    circular: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const sanitized = sanitizeObject(circular);
      const dbId = toDatabaseUuid(sanitized.id);
      const tags = generateSearchTags('job_circular', sanitized);

      if (isSupabaseConfigured) {
        const payload: Record<string, any> = {
          id: dbId,
          title: sanitized.job_title || sanitized.jobTitle || sanitized.title,
          company: sanitized.company_or_poster || sanitized.companyOrPoster || sanitized.companyName,
          description: sanitized.description || sanitized.job_description || '',
          circular_id: sanitized.circular_id || sanitized.circularId || `JC-${Date.now().toString().slice(-4)}`,
          job_title: sanitized.job_title || sanitized.jobTitle || sanitized.title,
          company_or_poster: sanitized.company_or_poster || sanitized.companyOrPoster || sanitized.companyName,
          phone: sanitized.phone,
          tax_vat_info: sanitized.tax_vat_info || sanitized.taxVatInfo || '',
          category: sanitized.category || 'General',
          job_type: sanitized.job_type || sanitized.jobType || 'Full-time',
          salary_range: sanitized.salary_range || sanitized.salaryRange || '',
          requirements: sanitized.requirements || '',
          division: sanitized.division || 'চট্টগ্রাম',
          district: sanitized.district || 'খাগড়াছড়ি',
          upazila: sanitized.upazila || 'খাগড়াছড়ি সদর',
          area: sanitized.area || '',
          deadline: sanitized.deadline || '',
          is_active: sanitized.is_active !== false,
          search_tags: tags.search_tags,
          hashtags: tags.hashtags,
          updated_at: new Date().toISOString()
        };

        await smartSupabaseInsert('job_circulars', payload);
      }

      this.notifyEntityChange('job_circulars');
      return { success: true, data: { ...sanitized, search_tags: tags.search_tags, hashtags: tags.hashtags } };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save job circular:', err);
      return { success: false, error: err?.message || 'Failed to save job circular' };
    }
  }

  /**
   * Saves or updates a Registered Member in Supabase registered_members table
   */
  public async saveRegisteredMemberToDatabase(
    member: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const sanitized = sanitizeObject(member);
      const dbId = toDatabaseUuid(sanitized.id);
      const tags = generateSearchTags('member', sanitized);

      if (isSupabaseConfigured) {
        const payload: Record<string, any> = {
          id: dbId,
          membership_id: sanitized.membership_id || sanitized.membershipId || sanitized.uniqueId || `MEM-${Date.now().toString().slice(-4)}`,
          name: sanitized.name || sanitized.full_name || sanitized.fullName,
          full_name: sanitized.full_name || sanitized.fullName || sanitized.name,
          phone: sanitized.phone,
          email: sanitized.email || '',
          role: sanitized.role || 'member',
          membership_tier: sanitized.membership_tier || sanitized.membershipTier || 'general',
          profession: sanitized.profession || sanitized.professionBn || '',
          skills: sanitized.skills || sanitized.categorySkill || '',
          blood_group: sanitized.blood_group || sanitized.bloodGroup || '',
          tax_vat_info: sanitized.tax_vat_info || sanitized.taxVatInfo || sanitized.nidNumber || '',
          nid_number: sanitized.nid_number || sanitized.nidNumber || '',
          division: sanitized.division || 'চট্টগ্রাম',
          district: sanitized.district || 'খাগড়াছড়ি',
          upazila: sanitized.upazila || 'খাগড়াছড়ি সদর',
          area: sanitized.area || sanitized.mahalla || '',
          mahalla: sanitized.mahalla || sanitized.area || '',
          detailed_address: sanitized.detailed_address || sanitized.detailedAddress || sanitized.present_address || sanitized.presentAddress || '',
          present_address: sanitized.present_address || sanitized.presentAddress || sanitized.detailed_address || sanitized.detailedAddress || '',
          permanent_address: sanitized.permanent_address || sanitized.permanentAddress || '',
          educational_qualification: sanitized.educational_qualification || sanitized.educationalQualification || sanitized.education || '',
          cv_url: sanitized.cv_url || sanitized.cvUrl || '',
          cv_file_name: sanitized.cv_file_name || sanitized.cvFileName || '',
          is_blood_donor: sanitized.is_blood_donor ?? sanitized.isBloodDonor ?? (!!sanitized.bloodGroup),
          is_paid_member: sanitized.is_paid_member ?? sanitized.isPaidMember ?? false,
          photo_url: sanitized.photo_url || sanitized.avatar || '',
          search_tags: tags.search_tags,
          hashtags: tags.hashtags,
          updated_at: new Date().toISOString()
        };

        await smartSupabaseInsert('registered_members', payload);
      }

      this.notifyEntityChange('registered_members');
      return { success: true, data: { ...sanitized, search_tags: tags.search_tags, hashtags: tags.hashtags } };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to save registered member:', err);
      return { success: false, error: err?.message || 'Failed to save registered member' };
    }
  }

  /**
   * Deletes a blood donor from Supabase database
   */
  public async deleteBloodDonorFromSupabase(donorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const targetId = String(donorId).trim();
      let deleteSuccessful = false;

      // 1. Delete permanently from Supabase
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('blood_donors').delete().eq('id', targetId);
          if (!error) {
            deleteSuccessful = true;
          } else {
            console.warn('[DatabaseService] Supabase delete blood_donor note:', error);
          }
        } catch (supErr) {
          console.warn('[DatabaseService] Supabase delete blood donor note:', supErr);
        }

        // Also clean up any linked profile records if applicable
        try {
          await supabase.from('profiles').delete().eq('id', targetId);
        } catch {}
      }

      // 2. Mirror to local API endpoint
      try {
        const res = await fetch(`/api/blood-donors/${encodeURIComponent(targetId)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          deleteSuccessful = true;
        }
      } catch (apiErr) {
        console.warn('[DatabaseService] /api/blood-donors delete note:', apiErr);
      }

      this.notifyEntityChange('blood_donors');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete blood donor' };
    }
  }

  // ============================================================
  // PUJA GIFT & FESTIVAL WELFARE APPLICATIONS
  // ============================================================

  public async submitPujaGiftApplication(
    application: PujaGiftApplication
  ): Promise<{ success: boolean; id: string; error?: string }> {
    try {
      const docId = application.id || `PUJA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload: PujaGiftApplication = {
        ...application,
        id: docId,
        appliedAt: application.appliedAt || new Date().toISOString(),
        status: application.status || 'Pending'
      };

      try {
        const stored = localStorage.getItem('jhadimadi_puja_applications');
        const existing: PujaGiftApplication[] = stored ? JSON.parse(stored) : [];
        const filtered = existing.filter((a) => a.id !== docId);
        filtered.unshift(payload);
        localStorage.setItem('jhadimadi_puja_applications', JSON.stringify(filtered));
      } catch {
        // safe ignore
      }

      this.notify();
      return { success: true, id: docId };
    } catch (err: any) {
      return { success: false, id: application.id, error: err?.message || 'Submission failed' };
    }
  }

  public async fetchPujaGiftApplications(): Promise<PujaGiftApplication[]> {
    try {
      const stored = localStorage.getItem('jhadimadi_puja_applications');
      if (stored) return JSON.parse(stored);
    } catch {
      // safe ignore
    }
    return [];
  }

  public async getPujaGiftApplicationById(appId: string): Promise<PujaGiftApplication | null> {
    const list = await this.fetchPujaGiftApplications();
    return list.find((a) => a.id === appId) || null;
  }

  /**
   * High-accuracy live product search querying Supabase database + Cloud Storage + local catalog
   * with fuzzy, phonetic, and bilingual matching (handles zero-width joiners and dialectal variations)
   */
  public async searchProductsLive(query: string, limit = 20): Promise<StoreProduct[]> {
    const cleanQ = cleanSearchString(query);
    if (!cleanQ) {
      return this.fetchProductsFromDatabase();
    }

    const candidates: StoreProduct[] = [];

    // 1. Direct Supabase Query (table)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`products_name.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%,origin.ilike.%${cleanQ}%,short_description.ilike.%${cleanQ}%`)
          .limit(limit);
        if (!error && Array.isArray(data) && data.length > 0) {
          candidates.push(...data.map((d: any) => this.mapProductRecord(d)));
        }
      } catch {}
    }

    // 2. Query Supabase Cloud Storage catalog.json (live Supabase cloud persistence)
    try {
      const cdnUrl = `${supabaseUrl}/storage/v1/object/public/products/catalog.json?t=${Date.now()}`;
      const res = await fetch(cdnUrl, { cache: 'no-cache' });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          candidates.push(...items.map((d: any) => this.mapProductRecord(d)));
        }
      }
    } catch {}

    // 3. Backend /api/search/global
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(cleanQ)}&limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products) && json.products.length > 0) {
          candidates.push(...json.products.map((d: any) => this.mapProductRecord(d)));
        }
      }
    } catch {}

    // 4. In-memory cache
    if (this.storeProductsCache && this.storeProductsCache.length > 0) {
      candidates.push(...this.storeProductsCache);
    }

    // Deduplicate candidates by ID
    const uniqueMap = new Map<string, StoreProduct>();
    for (const p of candidates) {
      if (p && p.id && !uniqueMap.has(String(p.id)) && !isLegacyDemoProduct(p)) {
        uniqueMap.set(String(p.id), p);
      }
    }

    // Filter using smart fuzzy & phonetic matcher (handles ZWJ, synonyms, and dialectal variations)
    const matched = Array.from(uniqueMap.values()).filter(p => matchesSmartProduct(p, query));

    return sortProductsAscending(matched);
  }

  /**
   * UNIFIED GLOBAL SUPABASE QUERY ENGINE
   * Queries products, service_providers, blood_donors, job_circulars, and job_seekers
   * simultaneously using PostgreSQL dynamic .or(title.ilike.%q%, name.ilike.%q%, category.ilike.%q%)
   * With sub-second execution, pg_trgm indices and multi-tier fallbacks.
   */
  public async globalSearch(
    query: string,
    options?: { limit?: number }
  ): Promise<GlobalSearchResponse> {
    const cleanQuery = (query || '').trim();
    const limit = Math.min(options?.limit || 12, 40);

    if (!cleanQuery) {
      return {
        query: '',
        totalCount: 0,
        source: 'supabase',
        products: [],
        providers: [],
        bloodDonors: [],
        jobCirculars: [],
        jobSeekers: [],
        items: []
      };
    }

    let products: any[] = [];
    let providers: any[] = [];
    let bloodDonors: any[] = [];
    let jobCirculars: any[] = [];
    let jobSeekers: any[] = [];
    let profiles: any[] = [];
    let usedSource: 'supabase' | 'hybrid' | 'fallback' = 'fallback';

    // 1. DIRECT SUPABASE QUERIES (Parallel execution with pg_trgm indexing across all 6 core tables)
    if (isSupabaseConfigured) {
      try {
        const [prodResult, provResult, bloodResult, circResult, seekerResult, profResult] = await Promise.allSettled([
          // 1.1 Products table
          supabase
            .from('products')
            .select('*')
            .or(`products_name.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,origin.ilike.%${cleanQuery}%,short_description.ilike.%${cleanQuery}%`)
            .limit(limit),

          // 1.2 Service Providers table (columns: name, profession, category_bn, skills_details, district, upazila)
          supabase
            .from('service_providers')
            .select('*')
            .or(`name.ilike.%${cleanQuery}%,profession.ilike.%${cleanQuery}%,category_bn.ilike.%${cleanQuery}%,skills_details.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%`)
            .limit(limit),

          // 1.3 Blood Donors table (columns: name, blood_group, profession, district, upazila, area)
          supabase
            .from('blood_donors')
            .select('*')
            .or(`name.ilike.%${cleanQuery}%,blood_group.ilike.%${cleanQuery}%,profession.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%,area.ilike.%${cleanQuery}%`)
            .limit(limit),

          // 1.4 Job Circulars table (columns: job_title, company_name, category, job_type, district, upazila)
          supabase
            .from('job_circulars')
            .select('*')
            .or(`job_title.ilike.%${cleanQuery}%,company_name.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,job_type.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%`)
            .limit(limit),

          // 1.5 Job Seekers table (columns: name, desired_job_title, skills_or_job_type, upazila)
          supabase
            .from('job_seekers')
            .select('*')
            .or(`name.ilike.%${cleanQuery}%,desired_job_title.ilike.%${cleanQuery}%,skills_or_job_type.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%`)
            .limit(limit),

          // 1.6 Profiles table (columns: full_name, phone)
          supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
            .limit(limit)
        ]);

        if (profResult.status === 'fulfilled' && !profResult.value.error && Array.isArray(profResult.value.data) && profResult.value.data.length > 0) {
          profiles = profResult.value.data;
        }

        if (prodResult.status === 'fulfilled' && !prodResult.value.error && Array.isArray(prodResult.value.data) && prodResult.value.data.length > 0) {
          products = prodResult.value.data;
        }

        if (provResult.status === 'fulfilled' && !provResult.value.error && Array.isArray(provResult.value.data) && provResult.value.data.length > 0) {
          providers = provResult.value.data;
        } else {
          // Fallback check on 'services' or 'profiles' table
          try {
            const { data: srvData } = await supabase
              .from('services')
              .select('*')
              .or(`profession.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,title.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%`)
              .limit(limit);
            if (Array.isArray(srvData) && srvData.length > 0) {
              providers = srvData;
            }
          } catch {}
        }

        if (bloodResult.status === 'fulfilled' && !bloodResult.value.error && Array.isArray(bloodResult.value.data) && bloodResult.value.data.length > 0) {
          bloodDonors = bloodResult.value.data;
        } else {
          // Fallback check on profiles table for blood donors
          try {
            const { data: bProfiles } = await supabase
              .from('profiles')
              .select('*')
              .or(`role.eq.blood_donor,is_blood_donor.eq.true`)
              .or(`full_name.ilike.%${cleanQuery}%,blood_group.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%,upazila.ilike.%${cleanQuery}%`)
              .limit(limit);
            if (Array.isArray(bProfiles) && bProfiles.length > 0) {
              bloodDonors = bProfiles;
            }
          } catch {}
        }

        if (circResult.status === 'fulfilled' && !circResult.value.error && Array.isArray(circResult.value.data) && circResult.value.data.length > 0) {
          jobCirculars = circResult.value.data;
        } else {
          // Fallback check on job_postings table
          try {
            const { data: jPostings } = await supabase
              .from('job_postings')
              .select('*')
              .or(`title.ilike.%${cleanQuery}%,company_name.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%`)
              .limit(limit);
            if (Array.isArray(jPostings) && jPostings.length > 0) {
              jobCirculars = jPostings;
            }
          } catch {}
        }

        if (seekerResult.status === 'fulfilled' && !seekerResult.value.error && Array.isArray(seekerResult.value.data) && seekerResult.value.data.length > 0) {
          jobSeekers = seekerResult.value.data;
        } else {
          // Fallback check on job_candidates table
          try {
            const { data: jCandidates } = await supabase
              .from('job_candidates')
              .select('*')
              .or(`name.ilike.%${cleanQuery}%,desired_job_title.ilike.%${cleanQuery}%,skills_or_job_type.ilike.%${cleanQuery}%,district.ilike.%${cleanQuery}%`)
              .limit(limit);
            if (Array.isArray(jCandidates) && jCandidates.length > 0) {
              jobSeekers = jCandidates;
            }
          } catch {}
        }

        if (products.length > 0 || providers.length > 0 || bloodDonors.length > 0 || jobCirculars.length > 0 || jobSeekers.length > 0) {
          usedSource = 'supabase';
        }
      } catch (err) {
        console.warn('[DatabaseService] Supabase globalSearch error:', err);
      }
    }

    // 2. LIVE PRODUCT SEARCH FALLBACK (Fuzzy, ZWJ-resistant, live Supabase database & storage catalog)
    if (products.length === 0) {
      try {
        const liveProds = await this.searchProductsLive(cleanQuery, limit);
        if (liveProds.length > 0) {
          products = liveProds;
          usedSource = 'supabase';
        }
      } catch (prodErr) {
        console.warn('[DatabaseService] searchProductsLive fallback error:', prodErr);
      }
    }

    // 3. BACKEND /api/search/global PROXY (Server-side Supabase + cached catalog fallback)
    if (providers.length === 0 && bloodDonors.length === 0 && jobCirculars.length === 0 && jobSeekers.length === 0) {
      try {
        const resp = await fetch(`/api/search/global?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.success) {
            if (products.length === 0 && Array.isArray(json.products) && json.products.length > 0) {
              products = json.products;
            }
            providers = json.serviceProviders || [];
            bloodDonors = json.bloodDonors || [];
            jobCirculars = json.jobCirculars || [];
            jobSeekers = json.jobSeekers || [];
            if (json.source) {
              usedSource = json.source;
            }
          }
        }
      } catch (apiErr) {
        console.warn('[DatabaseService] /api/search/global fetch notice:', apiErr);
      }
    }

    // 4. UNIFIED RESULT ITEM MAPPING
    const unifiedItems: GlobalSearchResultItem[] = [];

    // Products
    products.forEach((p) => {
      const pNameBn = p.name_bn || p.nameBn || p.title_bn || p.title || p.name || 'পণ্য';
      const pNameEn = p.name_en || p.nameEn || p.title_en || '';
      const pDescBn = p.description_bn || p.descriptionBn || p.description || '';
      const pCatLabel = p.category_label_bn || p.categoryLabelBn || p.category || 'পাহাড়ি খাঁটি পণ্য';
      const pImg = p.image_url || p.imageUrl || p.image || '';

      unifiedItems.push({
        type: 'product',
        id: String(p.id),
        title: pNameBn,
        subtitle: pCatLabel,
        category: p.category || 'Agri',
        location: [p.upazila || p.production_origin || p.productionOrigin, p.district || p.origin].filter(Boolean).join(', '),
        price: p.price,
        rating: Number(p.rating || 5),
        imageUrl: pImg,
        tags: Array.isArray(p.search_tags) ? p.search_tags : [],
        raw: {
          ...p,
          nameBn: pNameBn,
          nameEn: pNameEn,
          descriptionBn: pDescBn,
          categoryLabelBn: pCatLabel,
          image: pImg,
          price: p.price
        }
      });
    });

    // Providers
    providers.forEach((sp) => {
      unifiedItems.push({
        type: 'provider',
        id: String(sp.id),
        title: sp.display_name || sp.name || sp.full_name || 'দক্ষ কারিগর',
        subtitle: sp.category_bn || sp.profession_key || sp.profession || sp.job || 'সেবা প্রোভাইডার',
        category: 'সেবা ও কারিগর',
        location: [sp.area || sp.mahalla, sp.upazila, sp.district].filter(Boolean).join(', '),
        phone: sp.phone || '',
        price: sp.rate_amount || sp.daily_rate || sp.rate || 'আলোচনা সাপেক্ষে',
        rating: Number(sp.rating || 5),
        imageUrl: sp.avatar_url || sp.avatar || sp.img || '',
        tags: Array.isArray(sp.skills) ? sp.skills : (sp.search_tags || []),
        raw: sp
      });
    });

    // Blood Donors
    bloodDonors.forEach((bd) => {
      const bg = bd.blood_group || bd.bloodGroup || 'রক্তদাতা';
      unifiedItems.push({
        type: 'blood',
        id: String(bd.id),
        title: bd.name || bd.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
        subtitle: `${bg} রক্তের গ্রুপ`,
        category: 'জরুরি রক্তদান',
        location: [bd.area || bd.mahalla, bd.upazila, bd.district].filter(Boolean).join(', '),
        phone: bd.phone || '',
        price: 'বিনামূল্যে',
        imageUrl: bd.photo_url || bd.photo || bd.avatar || '',
        tags: [bg, 'রক্তদাতা', bd.district || ''].filter(Boolean),
        raw: bd
      });
    });

    // Job Circulars
    jobCirculars.forEach((jc) => {
      unifiedItems.push({
        type: 'job_circular',
        id: String(jc.id),
        title: jc.title || jc.job_title || 'চাকরির বিজ্ঞপ্তি',
        subtitle: jc.company_name || jc.organization || 'নিয়োগকারী প্রতিষ্ঠান',
        category: jc.category || 'চাকরি',
        location: [jc.upazila, jc.district].filter(Boolean).join(', '),
        price: jc.salary || jc.salary_range || 'আলোচনা সাপেক্ষে',
        tags: [jc.job_type, jc.category].filter(Boolean),
        raw: jc
      });
    });

    // Job Seekers
    jobSeekers.forEach((js) => {
      unifiedItems.push({
        type: 'job_seeker',
        id: String(js.id),
        title: js.name || js.full_name || 'চাকরিপ্রার্থী',
        subtitle: js.desired_job_title || js.skills_or_job_type || 'দক্ষ প্রার্থী',
        category: 'চাকরিপ্রার্থী ও সিভি',
        location: [js.upazila, js.district].filter(Boolean).join(', '),
        phone: js.phone || '',
        price: js.expected_salary || 'আলোচনা সাপেক্ষে',
        tags: Array.isArray(js.skills) ? js.skills : [],
        raw: js
      });
    });

    // Profiles / Members
    profiles.forEach((pr) => {
      const pId = String(pr.id || pr.unique_id || '');
      const isAlreadyInProviders = providers.some(p => String(p.id) === pId || (pr.phone && p.phone === pr.phone));
      const isAlreadyInDonors = bloodDonors.some(b => String(b.id) === pId || (pr.phone && b.phone === pr.phone));

      if (pr.is_blood_donor || pr.role === 'blood_donor' || pr.blood_group) {
        if (!isAlreadyInDonors) {
          bloodDonors.push({
            id: pId,
            name: pr.full_name || pr.name,
            phone: pr.phone,
            blood_group: pr.blood_group,
            district: pr.district,
            upazila: pr.upazila,
            area: pr.mahalla || pr.area,
            avatar_url: pr.avatar_url || pr.avatar
          });
        }
      }

      if (pr.role === 'service_provider' || pr.profession) {
        if (!isAlreadyInProviders) {
          providers.push({
            id: pId,
            display_name: pr.full_name || pr.name,
            profession_key: pr.profession,
            category_bn: pr.profession,
            phone: pr.phone,
            district: pr.district,
            upazila: pr.upazila,
            area: pr.mahalla || pr.area,
            avatar_url: pr.avatar_url || pr.avatar
          });
        }
      }

      if (!isAlreadyInProviders && !isAlreadyInDonors) {
        unifiedItems.push({
          type: 'profile',
          id: pId,
          title: pr.full_name || pr.name || 'সদস্য',
          subtitle: pr.profession || pr.member_type || 'নিবন্ধিত সদস্য',
          category: 'প্রোফাইল ও সদস্য',
          location: [pr.upazila, pr.district].filter(Boolean).join(', '),
          phone: pr.phone || '',
          imageUrl: pr.avatar_url || pr.avatar || '',
          tags: [pr.district, pr.upazila, pr.profession].filter(Boolean),
          raw: pr
        });
      }
    });

    return {
      query: cleanQuery,
      totalCount: unifiedItems.length,
      source: usedSource,
      products,
      providers,
      bloodDonors,
      jobCirculars,
      jobSeekers,
      profiles,
      items: unifiedItems
    };
  }

  /**
   * AUTHENTIC DYNAMIC PRODUCT REVIEWS
   * Fetches real reviews submitted by verified buyers from Supabase table product_reviews
   */
  public async getProductReviews(productId: string, productCode?: string): Promise<ProductReviewRecord[]> {
    const cleanId = String(productId || '').trim();
    if (!cleanId) return [];

    // 1. Query Supabase table product_reviews directly
    if (isSupabaseConfigured) {
      try {
        const orFilter = productCode && productCode !== cleanId
          ? `product_id.eq.${cleanId},product_id.eq.${productCode}`
          : `product_id.eq.${cleanId}`;

        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .or(orFilter)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((r: any) => ({
            id: String(r.id),
            product_id: String(r.product_id),
            user_id: r.user_id ? String(r.user_id) : undefined,
            user_name: r.user_name || 'সম্মানিত ক্রেতা',
            user_phone: r.user_phone || '',
            user_location: r.user_location || 'বাংলাদেশ',
            rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
            comment: r.comment || '',
            is_verified_buyer: r.is_verified_buyer !== false,
            created_at: r.created_at || new Date().toISOString()
          }));
        }
      } catch (err) {
        console.warn('[DatabaseService] Supabase product_reviews fetch note:', err);
      }
    }

    // 2. Query backend API /api/products/:id/reviews
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(cleanId)}/reviews`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          return json.reviews.map((r: any) => ({
            id: String(r.id),
            product_id: String(r.product_id),
            user_id: r.user_id ? String(r.user_id) : undefined,
            user_name: r.user_name || 'সম্মানিত ক্রেতা',
            user_phone: r.user_phone || '',
            user_location: r.user_location || 'বাংলাদেশ',
            rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
            comment: r.comment || '',
            is_verified_buyer: r.is_verified_buyer !== false,
            created_at: r.created_at || new Date().toISOString()
          }));
        }
      }
    } catch (apiErr) {
      console.warn('[DatabaseService] /api/products/:id/reviews fetch note:', apiErr);
    }

    return [];
  }

  /**
   * Submits an authentic review directly to Supabase and backend
   */
  public async submitProductReview(
    review: Omit<ProductReviewRecord, 'id' | 'created_at'>
  ): Promise<{ success: boolean; review?: ProductReviewRecord; error?: string }> {
    try {
      const cleanId = String(review.product_id || '').trim();
      const cleanComment = (review.comment || '').trim();
      const cleanName = (review.user_name || '').trim() || 'সম্মানিত ক্রেতা';
      const numRating = Math.max(1, Math.min(5, Number(review.rating) || 5));

      if (!cleanComment) {
        return { success: false, error: 'রিভিউ মন্তব্য আবশ্যক' };
      }

      // 1. Direct Supabase insert
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('product_reviews')
            .insert([{
              product_id: cleanId,
              user_id: review.user_id || null,
              user_name: cleanName,
              user_phone: review.user_phone || '',
              user_location: review.user_location || 'বাংলাদেশ',
              rating: numRating,
              comment: cleanComment,
              is_verified_buyer: review.is_verified_buyer !== false
            }])
            .select()
            .single();

          if (!error && data) {
            return {
              success: true,
              review: {
                id: String(data.id),
                product_id: String(data.product_id),
                user_id: data.user_id ? String(data.user_id) : undefined,
                user_name: data.user_name,
                user_phone: data.user_phone,
                user_location: data.user_location,
                rating: Number(data.rating),
                comment: data.comment,
                is_verified_buyer: data.is_verified_buyer !== false,
                created_at: data.created_at
              }
            };
          }
        } catch (dbErr) {
          console.warn('[DatabaseService] Supabase review insert note:', dbErr);
        }
      }

      // 2. Server API fallback
      const apiRes = await fetch(`/api/products/${encodeURIComponent(cleanId)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: numRating,
          comment: cleanComment,
          user_name: cleanName,
          user_id: review.user_id,
          user_phone: review.user_phone,
          user_location: review.user_location
        })
      });

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.review) {
          return { success: true, review: json.review };
        }
      }

      return { success: false, error: 'রিভিউ জমা দিতে সাময়িক সমস্যা হয়েছে' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'রিভিউ জমা দিতে ব্যর্থ হয়েছে' };
    }
  }
}

export interface ProductReviewRecord {
  id: string;
  product_id: string;
  user_id?: string;
  user_name: string;
  user_phone?: string;
  user_location?: string;
  rating: number;
  comment: string;
  is_verified_buyer?: boolean;
  created_at?: string;
}

export interface GlobalSearchResultItem {
  type: 'product' | 'provider' | 'blood' | 'job_circular' | 'job_seeker' | 'profile';
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  location?: string;
  price?: string | number;
  rating?: number;
  phone?: string;
  imageUrl?: string;
  tags?: string[];
  raw: any;
}

export interface GlobalSearchResponse {
  query: string;
  totalCount: number;
  source: 'supabase' | 'hybrid' | 'fallback';
  products: any[];
  providers: any[];
  bloodDonors: any[];
  jobCirculars: any[];
  jobSeekers: any[];
  profiles?: any[];
  items: GlobalSearchResultItem[];
}

export const databaseService = new DatabaseService();
export default databaseService;
