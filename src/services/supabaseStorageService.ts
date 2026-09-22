/**
 * Enterprise Supabase Storage Security Service
 * Enforces strict client-side validation, safe path generation,
 * MIME type verification, quota limits, and signed URL generation for private buckets.
 */
import { supabase, isSupabaseConfigured } from '../supabase';

export type StorageBucket = 
  | 'avatars' 
  | 'products' 
  | 'banners' 
  | 'business-media'
  | 'service-media'
  | 'portfolio-files'
  | 'documents'
  | 'nid_documents' 
  | 'order_attachments';

export interface StorageBucketConfig {
  isPublic: boolean;
  maxSizeBytes: number;
  maxSizeMB: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const STORAGE_CONFIGS: Record<StorageBucket, StorageBucketConfig> = {
  avatars: {
    isPublic: true,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  products: {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  banners: {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  'business-media': {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  'service-media': {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  'portfolio-files': {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'],
  },
  documents: {
    isPublic: false, // STRICTLY PRIVATE
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    maxSizeMB: 15,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
  nid_documents: {
    isPublic: false, // STRICTLY PRIVATE
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    maxSizeMB: 15,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
  order_attachments: {
    isPublic: false, // STRICTLY PRIVATE
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
};

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  isPrivate?: boolean;
  error?: string;
}

class SupabaseStorageService {
  /**
   * Sanitizes a file name to prevent path traversal, spaces, and invalid characters.
   */
  public sanitizeFileName(fileName: string): string {
    const cleanName = fileName
      .replace(/(\.\.(\/|\\|$))+/g, '') // remove path traversal sequences
      .replace(/[^\w\.\-]/gi, '_') // only alphanumeric, dot, hyphen, underscore
      .toLowerCase();

    return cleanName || `file_${Date.now()}`;
  }

  /**
   * Validates file size and MIME type according to bucket security configuration.
   */
  public validateFile(file: File, bucket: StorageBucket): { valid: boolean; error?: string } {
    const config = STORAGE_CONFIGS[bucket];
    if (!config) {
      return { valid: false, error: `অজানা স্টোরেজ বাকেট: ${bucket}` };
    }

    // 1. File Size Verification
    if (file.size > config.maxSizeBytes) {
      return {
        valid: false,
        error: `ফাইলের সাইজ অনুমোদিত সর্বোচ্চ ${config.maxSizeMB}MB এর বেশি হতে পারবে না (বর্তমান: ${(file.size / (1024 * 1024)).toFixed(2)}MB)।`,
      };
    }

    // 2. MIME Type Verification
    const fileMime = (file.type || '').toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    const isMimeAllowed = config.allowedMimeTypes.includes(fileMime);
    const isExtAllowed = config.allowedExtensions.includes(extension);

    if (!isMimeAllowed && !isExtAllowed) {
      return {
        valid: false,
        error: `অননুমোদিত ফাইল ফরম্যাট। শুধুমাত্র [${config.allowedExtensions.join(', ').toUpperCase()}] ফরম্যাট গ্রহণযোগ্য।`,
      };
    }

    return { valid: true };
  }

  /**
   * Builds a secure isolated path: ${userId}/${safeFileName}
   */
  public buildSecurePath(userId: string, fileName: string, subfolder?: string): string {
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, '') || 'anonymous';
    const cleanFileName = this.sanitizeFileName(fileName);
    const cleanSubfolder = subfolder ? subfolder.replace(/[^a-zA-Z0-9_\-]/g, '') + '/' : '';
    const timestamp = Date.now();

    return `${cleanUserId}/${cleanSubfolder}${timestamp}_${cleanFileName}`;
  }

  /**
   * Uploads an avatar image into the 'avatars' bucket under the user's isolated folder.
   */
  public async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile('avatars', file, userId, 'profile');
  }

  /**
   * Uploads a product image into the 'products' bucket.
   */
  public async uploadProductImage(file: File, userId: string, productId?: string): Promise<UploadResult> {
    return this.uploadFile('products', file, userId, productId ? `prod_${productId}` : 'catalog');
  }

  /**
   * Uploads a homepage / promotional banner into the 'banners' bucket (Admin only).
   */
  public async uploadBanner(file: File, adminId: string): Promise<UploadResult> {
    return this.uploadFile('banners', file, adminId, 'hero_banners');
  }

  /**
   * Uploads a sensitive NID or KYC document into the private 'nid_documents' bucket.
   * Access is strictly restricted to owner and admins via signed URLs.
   */
  public async uploadNidDocument(
    file: File,
    userId: string,
    docType: 'nid_front' | 'nid_back' | 'trade_license' | 'certificate'
  ): Promise<UploadResult> {
    return this.uploadFile('nid_documents', file, userId, docType);
  }

  /**
   * Uploads an order attachment / payment receipt into the private 'order_attachments' bucket.
   */
  public async uploadOrderAttachment(file: File, userId: string, orderId: string): Promise<UploadResult> {
    return this.uploadFile('order_attachments', file, userId, `order_${orderId}`);
  }

  /**
   * Core secure file upload method
   */
  public async uploadFile(
    bucket: StorageBucket,
    file: File,
    userId: string,
    subfolder?: string
  ): Promise<UploadResult> {
    // 1. Client-Side Security Pre-validation
    const validation = this.validateFile(file, bucket);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = STORAGE_CONFIGS[bucket];
    const securePath = this.buildSecurePath(userId, file.name, subfolder);

    // If Supabase is not configured or in local sandbox demo, return safe object URL or data URL
    if (!isSupabaseConfigured) {
      const simulatedUrl = URL.createObjectURL(file);
      return {
        success: true,
        path: securePath,
        url: simulatedUrl,
        isPrivate: !config.isPublic,
      };
    }

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(securePath, file, {
        cacheControl: '3600',
        upsert: false, // Prevents silent overwriting of files
        contentType: file.type,
      });

      if (error) {
        console.error(`[SupabaseStorage] Upload to ${bucket} failed:`, error);
        return { success: false, error: error.message };
      }

      // If the bucket is public, get the public CDN URL
      if (config.isPublic) {
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return {
          success: true,
          path: data.path,
          url: publicUrlData.publicUrl,
          isPrivate: false,
        };
      }

      // If the bucket is private, do NOT return a permanent public URL. Return private path.
      return {
        success: true,
        path: data.path,
        isPrivate: true,
      };
    } catch (err: any) {
      console.error(`[SupabaseStorage] Unexpected error:`, err);
      return { success: false, error: err.message || 'স্টোরেজ আপলোড সম্পন্ন করা যায়নি।' };
    }
  }

  /**
   * Generates a time-limited signed URL for private documents (e.g. NID cards, invoices).
   * Ensures private files are never permanently exposed. Default expiration: 15 minutes (900 seconds).
   */
  public async getPrivateSignedUrl(
    bucket: 'nid_documents' | 'order_attachments',
    path: string,
    expiresInSeconds: number = 900
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.error(`[SupabaseStorage] Failed to generate signed URL for ${path}:`, error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error(`[SupabaseStorage] Signed URL generation error:`, err);
      return null;
    }
  }

  /**
   * Deletes a file from storage if authorized by RLS (owner or admin).
   */
  public async deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        console.error(`[SupabaseStorage] Failed to delete file ${path}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SupabaseStorage] Delete error:`, err);
      return false;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;
