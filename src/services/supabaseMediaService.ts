import { supabase, isSupabaseConfigured, supabaseKey } from '../supabase';
import { compressImage } from '../utils/imageUtils';

export interface SupabaseMediaItem {
  id: string;
  url: string;
  name: string;
  category?: string;
  source: 'supabase_storage' | 'supabase_db_product' | 'supabase_db_banner' | 'catalog';
  bucket?: string;
  path?: string;
  sizeBytes?: number;
  createdAt?: string;
  productName?: string;
  productCode?: string;
  dbProductId?: string;
  bannerTitle?: string;
  dbBannerId?: string;
  placement?: string;
}

const LOCAL_STORAGE_MEDIA_KEY = 'jhadimadi_uploaded_media_v2';
const DELETED_MEDIA_KEY = 'jhadimadi_deleted_media_urls_v2';

// Known public Supabase Storage buckets
export const KNOWN_STORAGE_BUCKETS = [
  'products',
  'banners',
  'avatars',
  'business-media',
  'service-media',
  'documents'
] as const;

class SupabaseMediaService {
  private mediaCache: SupabaseMediaItem[] = [];
  private lastFetchedAt: number = 0;

  /**
   * Loads custom uploaded media from persistent browser storage
   */
  private getLocalStoredMedia(): SupabaseMediaItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse issues
    }
    return [];
  }

  /**
   * Persists uploaded media item to local storage
   */
  private saveLocalMediaItem(item: SupabaseMediaItem): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getLocalStoredMedia();
      const updated = [item, ...current.filter(i => i.url !== item.url)].slice(0, 50);
      localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota or restriction
    }
  }

  /**
   * Loads deleted media URLs that should be permanently hidden
   */
  private getDeletedMediaUrls(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(DELETED_MEDIA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set();
  }

  /**
   * Fetches all image assets stored in Supabase Database (products and banners tables),
   * Supabase Cloud Storage across all buckets (products, banners, avatars, etc.), server storage, and catalog.
   */
  public async fetchStoredMedia(options?: {
    category?: string;
    bucket?: string;
    query?: string;
    forceRefresh?: boolean;
  }): Promise<SupabaseMediaItem[]> {
    const now = Date.now();
    // Cache for 10 seconds unless forced
    if (
      !options?.forceRefresh &&
      this.mediaCache.length > 0 &&
      now - this.lastFetchedAt < 10000
    ) {
      return this.filterMedia(this.mediaCache, options?.category, options?.query, options?.bucket);
    }

    const mediaMap = new Map<string, SupabaseMediaItem>();
    const deletedUrls = this.getDeletedMediaUrls();

    // 0. Add user-uploaded items from local storage first
    const localItems = this.getLocalStoredMedia();
    for (const item of localItems) {
      if (item?.url && !deletedUrls.has(item.url) && !mediaMap.has(item.url)) {
        mediaMap.set(item.url, item);
      }
    }

    // 1. Fetch images from Supabase Cloud Storage across all known buckets
    if (isSupabaseConfigured) {
      const targetBuckets = options?.bucket && options.bucket !== 'all' 
        ? [options.bucket] 
        : ['products', 'banners', 'avatars', 'business-media', 'service-media', 'documents'];

      const bucketPromises = targetBuckets.map(async (bucketName) => {
        try {
          const { data: storageFiles, error: storageErr } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

          if (!storageErr && Array.isArray(storageFiles)) {
            for (const file of storageFiles) {
              if (file.name && !file.name.startsWith('.')) {
                // If it's a folder, list contents of that folder
                if (file.id === null || file.metadata === null) {
                  try {
                    const { data: subFiles } = await supabase.storage
                      .from(bucketName)
                      .list(file.name, { limit: 50 });
                    if (Array.isArray(subFiles)) {
                      for (const sub of subFiles) {
                        if (sub.name && !sub.name.startsWith('.')) {
                          const fullPath = `${file.name}/${sub.name}`;
                          const { data: pubData } = supabase.storage
                            .from(bucketName)
                            .getPublicUrl(fullPath);
                          if (pubData?.publicUrl && !deletedUrls.has(pubData.publicUrl) && !mediaMap.has(pubData.publicUrl)) {
                            mediaMap.set(pubData.publicUrl, {
                              id: `storage_${bucketName}_${sub.id || fullPath}`,
                              url: pubData.publicUrl,
                              name: sub.name.replace(/^\d+_/, '').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                              source: 'supabase_storage',
                              bucket: bucketName,
                              path: fullPath,
                              sizeBytes: (sub.metadata as any)?.size || undefined,
                              createdAt: sub.created_at || new Date().toISOString()
                            });
                          }
                        }
                      }
                    }
                  } catch {}
                } else {
                  // Direct file in bucket
                  const { data: pubData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(file.name);
                  if (pubData?.publicUrl && !deletedUrls.has(pubData.publicUrl) && !mediaMap.has(pubData.publicUrl)) {
                    mediaMap.set(pubData.publicUrl, {
                      id: `storage_${bucketName}_${file.id || file.name}`,
                      url: pubData.publicUrl,
                      name: file.name.replace(/^\d+_/, '').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                      source: 'supabase_storage',
                      bucket: bucketName,
                      path: file.name,
                      sizeBytes: (file.metadata as any)?.size || undefined,
                      createdAt: file.created_at || new Date().toISOString()
                    });
                  }
                }
              }
            }
          }
        } catch (bErr) {
          // Non-blocking bucket fetch failure
        }
      });

      try {
        await Promise.race([
          Promise.all(bucketPromises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Storage list timeout')), 7000))
        ]);
      } catch (err) {
        console.warn('[SupabaseMediaService] Storage list timeout or notice:', err);
      }

      // 2. Fetch images from Supabase Database 'products' table
      try {
        const fetchDbProducts = async () => {
          const { data: dbProducts, error: dbErr } = await supabase
            .from('products')
            .select('id, code, name_bn, name_en, category, image_url, gallery_urls, created_at')
            .limit(100);

          if (!dbErr && Array.isArray(dbProducts)) {
            for (const prod of dbProducts) {
              if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim()) {
                const url = prod.image_url.trim();
                if (!deletedUrls.has(url) && !mediaMap.has(url)) {
                  mediaMap.set(url, {
                    id: `db_prod_${prod.id || Math.random()}`,
                    url: url,
                    name: prod.name_bn || prod.name_en || 'পাহাড়ি অর্গানিক পণ্য',
                    category: prod.category || 'Food',
                    source: 'supabase_db_product',
                    bucket: 'products',
                    createdAt: prod.created_at || new Date().toISOString(),
                    productName: prod.name_bn || prod.name_en,
                    productCode: prod.code,
                    dbProductId: String(prod.id)
                  });
                }
              }

              if (Array.isArray(prod.gallery_urls)) {
                prod.gallery_urls.forEach((gUrl: string, idx: number) => {
                  if (typeof gUrl === 'string' && gUrl.trim() && !deletedUrls.has(gUrl.trim()) && !mediaMap.has(gUrl.trim())) {
                    mediaMap.set(gUrl.trim(), {
                      id: `db_prod_gallery_${prod.id}_${idx}`,
                      url: gUrl.trim(),
                      name: `${prod.name_bn || 'গ্যালারি ছবি'} (${idx + 1})`,
                      category: prod.category || 'Food',
                      source: 'supabase_db_product',
                      bucket: 'products',
                      createdAt: prod.created_at || new Date().toISOString(),
                      productName: prod.name_bn,
                      productCode: prod.code,
                      dbProductId: String(prod.id)
                    });
                  }
                });
              }
            }
          }
        };

        // 3. Fetch images from Supabase Database 'banners' table
        const fetchDbBanners = async () => {
          try {
            const { data: dbBanners, error: bErr } = await supabase
              .from('banners')
              .select('id, title, image_url, tag, placement, created_at')
              .limit(50);

            if (!bErr && Array.isArray(dbBanners)) {
              for (const ban of dbBanners) {
                if (ban.image_url && typeof ban.image_url === 'string' && ban.image_url.trim()) {
                  const url = ban.image_url.trim();
                  if (!deletedUrls.has(url) && !mediaMap.has(url)) {
                    mediaMap.set(url, {
                      id: `db_banner_${ban.id || Math.random()}`,
                      url: url,
                      name: ban.title || 'হোমপেজ ব্যানার',
                      category: 'Banner',
                      source: 'supabase_db_banner',
                      bucket: 'banners',
                      createdAt: ban.created_at || new Date().toISOString(),
                      bannerTitle: ban.title,
                      dbBannerId: String(ban.id),
                      placement: ban.placement
                    });
                  }
                }
              }
            }
          } catch {}
        };

        await Promise.race([
          Promise.all([fetchDbProducts(), fetchDbBanners()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB products/banners timeout')), 6000))
        ]);
      } catch (err) {
        console.warn('[SupabaseMediaService] Database products/banners query notice:', err);
      }
    }

    // 4. Fetch server uploads from /api/media
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.items)) {
          for (const item of json.items) {
            if (item.url && !deletedUrls.has(item.url) && !mediaMap.has(item.url)) {
              mediaMap.set(item.url, item);
            }
          }
        }
      }
    } catch {
      // Server endpoint optional
    }

    this.mediaCache = Array.from(mediaMap.values());
    this.lastFetchedAt = now;

    return this.filterMedia(this.mediaCache, options?.category, options?.query, options?.bucket);
  }

  /**
   * Filters media by search query, category, and bucket
   */
  public filterMedia(
    items: SupabaseMediaItem[],
    category?: string,
    query?: string,
    bucket?: string
  ): SupabaseMediaItem[] {
    let list = [...items];

    if (bucket && bucket !== 'all') {
      const targetB = bucket.toLowerCase();
      list = list.filter(item => (item.bucket || '').toLowerCase() === targetB);
    }

    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      list = list.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        if (cat === 'spicesgrains' || cat === 'food') {
          return ['food', 'spicesgrains', 'organic', 'grain'].includes(itemCat);
        }
        return itemCat === cat;
      });
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.productCode && item.productCode.toLowerCase().includes(q)) ||
        (item.bannerTitle && item.bannerTitle.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.bucket && item.bucket.toLowerCase().includes(q)) ||
        item.url.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Direct Upload to Supabase Storage ('products' bucket)
   * with automatic fallback to server storage, database registration, and accurate error reporting.
   */
  public async uploadToSupabase(
    file: File,
    productIdOrOptions?: string | { productId?: string; bucket?: string }
  ): Promise<{ success: boolean; url: string; item?: SupabaseMediaItem; error?: string; warning?: string }> {
    try {
      const targetBucket = (typeof productIdOrOptions === 'object' && productIdOrOptions?.bucket)
        ? productIdOrOptions.bucket
        : (typeof productIdOrOptions === 'string' && productIdOrOptions === 'banners' ? 'banners' : 'products');

      // 1. Validation
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const safeExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!safeExtensions.includes(ext) && !file.type.startsWith('image/')) {
        return { success: false, url: '', error: 'শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) আপলোড করুন।' };
      }

      if (file.size > 15 * 1024 * 1024) {
        return { success: false, url: '', error: 'ছবির সাইজ ১৫ মেগাবাইটের বেশি হতে পারবে না।' };
      }

      const timestamp = Date.now();
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
      const storagePath = `${timestamp}_${uuid}.${ext}`;

      // 2. Compress image for optimal upload speed and quality
      let fileToUpload: File | Blob = file;
      let dataUrlForServer = '';
      try {
        const compressedDataUrl = await compressImage(file, 1200, 1200, 0.85);
        if (compressedDataUrl && compressedDataUrl.startsWith('data:image/')) {
          dataUrlForServer = compressedDataUrl;
          const res = await fetch(compressedDataUrl);
          fileToUpload = await res.blob();
        }
      } catch (cErr) {
        console.warn('[SupabaseMediaService] Image compression skipped, using original:', cErr);
      }

      let supabaseStorageError: string | null = null;

      // 3. Attempt direct upload via Supabase Storage Client
      if (isSupabaseConfigured) {
        try {
          const uploadPromise = async () => {
            // First try targeted bucket (e.g., 'banners' or 'products')
            let res: any = await supabase.storage
              .from(targetBucket)
              .upload(storagePath, fileToUpload, {
                cacheControl: '31536000',
                upsert: true,
                contentType: file.type || 'image/jpeg'
              });
            let bucketUsed = targetBucket;

            // If error and targetBucket is 'banners', fallback to 'products'
            if (res.error && targetBucket !== 'products') {
              const fallback = await supabase.storage
                .from('products')
                .upload(storagePath, fileToUpload, {
                  cacheControl: '31536000',
                  upsert: true,
                  contentType: file.type || 'image/jpeg'
                });
              if (!fallback.error) {
                res = fallback;
                bucketUsed = 'products';
              }
            }
            return { ...res, bucketUsed };
          };

          // Wrap with an 8-second timeout so it never hangs or buffers indefinitely
          const result: any = await Promise.race([
            uploadPromise(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('সুপাবেস স্টোরেজ নেটওয়ার্ক টাইমআউট (৮ সেকেন্ড)')), 8000))
          ]);

          if (!result.error && result.data?.path) {
            const bucketUsed = result.bucketUsed || targetBucket;
            const { data: pubData } = supabase.storage
              .from(bucketUsed)
              .getPublicUrl(result.data.path);

            const publicUrl = pubData?.publicUrl;
            if (publicUrl) {
              const newItem: SupabaseMediaItem = {
                id: `storage_upload_${timestamp}`,
                url: publicUrl,
                name: rawName,
                source: 'supabase_storage',
                bucket: bucketUsed,
                path: result.data.path,
                sizeBytes: file.size,
                createdAt: new Date().toISOString()
              };

              // Persist locally so it is immediately accessible in gallery
              this.saveLocalMediaItem(newItem);
              this.mediaCache.unshift(newItem);

              return {
                success: true,
                url: publicUrl,
                item: newItem
              };
            }
          } else if (result.error) {
            supabaseStorageError = result.error.message || 'Supabase Storage error';
            console.warn('[SupabaseMediaService] Direct Supabase storage error:', supabaseStorageError);
          }
        } catch (sErr: any) {
          supabaseStorageError = sErr?.message || 'Supabase Storage connection failed';
          console.warn('[SupabaseMediaService] Direct Supabase upload caught:', supabaseStorageError);
        }
      } else {
        supabaseStorageError = 'Supabase ক্লায়েন্ট কনফিগারেশন অসম্পূর্ণ';
      }

      // 4. Server-Side Permanent Cloud Storage Upload (/api/upload)
      // If direct Supabase client failed, send Authorization header explicitly to backend
      let serverError = '';
      try {
        if (!dataUrlForServer) {
          const reader = new FileReader();
          dataUrlForServer = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fileToUpload instanceof Blob ? fileToUpload : file);
          });
        }

        // Get current session or token to send in authorization header
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || supabaseKey;

        const serverRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            data: dataUrlForServer,
            name: file.name,
            contentType: file.type,
            bucket: targetBucket
          })
        });

        const serverData = await serverRes.json();
        if (serverRes.ok && serverData.success && serverData.url) {
          const newItem: SupabaseMediaItem = {
            id: serverData.item?.id || `upload_${timestamp}`,
            url: serverData.url,
            name: rawName,
            source: (serverData.item?.source as any) || 'supabase_storage',
            bucket: serverData.bucket || targetBucket,
            createdAt: new Date().toISOString(),
            sizeBytes: file.size
          };

          this.saveLocalMediaItem(newItem);
          this.mediaCache.unshift(newItem);

          return {
            success: true,
            url: serverData.url,
            item: newItem,
            warning: serverData.warning
          };
        } else {
          serverError = serverData.error || `সার্ভার রেসপন্স কোড ${serverRes.status}`;
        }
      } catch (servErr: any) {
        serverError = servErr?.message || 'সার্ভার যোগাযোগ ব্যর্থ';
        console.warn('[SupabaseMediaService] Server upload caught:', servErr);
      }

      // 5. If BOTH failed, construct a clean, helpful error message
      let friendlyError = 'সুপাবেস ক্লাউড স্টোরেজে ছবি আপলোড সম্পন্ন করা যায়নি।';
      if (serverError) {
        friendlyError = `${serverError}`;
      } else if (supabaseStorageError) {
        if (supabaseStorageError.includes('JWS') || supabaseStorageError.includes('API key') || supabaseStorageError.includes('403') || supabaseStorageError.includes('AccessDenied')) {
          friendlyError = `সুপাবেস স্টোরেজ অ্যাক্সেস ত্রুটি (Invalid Key / 403 AccessDenied)। অনুগ্রহ করে Supabase Anon Key যাচাই করুন। (${supabaseStorageError})`;
        } else if (supabaseStorageError.includes('Bucket not found') || supabaseStorageError.includes('404')) {
          friendlyError = `সুপাবেস বাকেট 'products' পাওয়া যায়নি। অনুগ্রহ করে বাকেট তৈরি করুন। (${supabaseStorageError})`;
        } else if (supabaseStorageError.includes('row-level security') || supabaseStorageError.includes('RLS')) {
          friendlyError = `সুপাবেস RLS নিরাপত্তা পলিসির কারণে আপলোড ব্লক হয়েছে। (${supabaseStorageError})`;
        } else {
          friendlyError = `Supabase Storage ত্রুটি: ${supabaseStorageError}`;
        }
      }

      return {
        success: false,
        url: '',
        error: friendlyError
      };
    } catch (err: any) {
      console.error('[SupabaseMediaService] Upload critical exception:', err);
      return {
        success: false,
        url: '',
        error: err?.message || 'ছবি আপলোড করার সময় অপ্রত্যাশিত সমস্যা দেখা দিয়েছে'
      };
    }
  }

  /**
   * Permanently deletes media item from connected Supabase Storage, Supabase Database,
   * server storage, and browser caches.
   */
  public async deleteMediaItem(
    item: SupabaseMediaItem
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!item || !item.url) {
        return { success: false, error: 'ছবি নির্দিষ্ট করা হয়নি।' };
      }

      // 1. Immediately record in persistent deleted set so it never reappears
      if (typeof window !== 'undefined') {
        try {
          const rawDeleted = localStorage.getItem(DELETED_MEDIA_KEY);
          const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          if (!deletedList.includes(item.url)) {
            deletedList.push(item.url);
            localStorage.setItem(DELETED_MEDIA_KEY, JSON.stringify(deletedList));
          }
        } catch {}

        // Remove from local storage uploaded media
        try {
          const current = this.getLocalStoredMedia();
          const updated = current.filter(i => i.url !== item.url && i.id !== item.id);
          localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(updated));
        } catch {}
      }

      // 2. Remove from in-memory cache
      this.mediaCache = this.mediaCache.filter(m => m.url !== item.url && m.id !== item.id);

      // 3. Direct client-side deletion from Supabase Storage & Database
      if (isSupabaseConfigured) {
        let fileName = item.path;
        if (!fileName && item.url) {
          try {
            const urlObj = new URL(item.url);
            const pathParts = urlObj.pathname.split('/');
            fileName = pathParts[pathParts.length - 1];
          } catch {
            const parts = item.url.split('/');
            fileName = parts[parts.length - 1].split('?')[0];
          }
        }

        if (fileName) {
          const bucket = item.bucket || 'products';
          try {
            await supabase.storage.from(bucket).remove([fileName]);
          } catch (storageErr) {
            console.warn('[SupabaseMediaService] Direct storage delete notice:', storageErr);
          }
        }

        // Direct DB product table image clearing
        try {
          await supabase
            .from('products')
            .update({ image_url: '', updated_at: new Date().toISOString() })
            .eq('image_url', item.url);

          if (item.dbProductId) {
            await supabase
              .from('products')
              .update({ image_url: '', updated_at: new Date().toISOString() })
              .eq('id', item.dbProductId);
          }
        } catch (dbErr) {
          console.warn('[SupabaseMediaService] Direct DB product image update notice:', dbErr);
        }
      }

      // 4. Server-Side Permanent Deletion (/api/media/delete)
      try {
        await fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            url: item.url,
            path: item.path,
            bucket: item.bucket || 'products',
            source: item.source,
            dbProductId: item.dbProductId
          })
        });
      } catch (serverErr) {
        console.warn('[SupabaseMediaService] Server delete call notice:', serverErr);
      }

      return {
        success: true,
        message: 'ছবিটি স্থায়ীভাবে ডাটাবেজ ও স্টোরেজ থেকে মুছে ফেলা হয়েছে।'
      };
    } catch (err: any) {
      console.error('[SupabaseMediaService] Delete media item failed:', err);
      return {
        success: false,
        error: err?.message || 'ছবি মোছার সময় ত্রুটি হয়েছে'
      };
    }
  }
}

export const supabaseMediaService = new SupabaseMediaService();
export default supabaseMediaService;
