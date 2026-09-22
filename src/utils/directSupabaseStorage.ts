import { supabase, supabaseUrl } from '../supabase';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

/**
 * Utility to convert base64 data URI to Blob
 */
export function dataUriToBlob(dataUri: string): Blob {
  try {
    const parts = dataUri.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(parts[1]);
    const array: number[] = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
  } catch (err) {
    console.error('[directSupabaseStorage] Failed to convert data URI to Blob:', err);
    return new Blob([], { type: 'image/jpeg' });
  }
}

/**
 * Checks if a string is a temporary local data URI or blob URL
 */
export function isLocalTransientUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:') || url.startsWith('blob:');
}

/**
 * Sanitizes a filename for storage
 */
export function sanitizeStorageFileName(rawName: string): string {
  const clean = rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  return clean || `upload_${Date.now()}.jpg`;
}

export type SupabaseBucketName = 'avatars' | 'products' | 'banners' | 'documents' | 'nid_documents';

/**
 * Core Direct Upload function using Supabase Storage Client.
 * 1. Uploads the file or blob directly to Supabase Cloud Storage.
 * 2. Immediately retrieves the public URL using `supabase.storage.from(bucket).getPublicUrl(...)`.
 * 3. Returns the permanent Supabase public URL.
 */
export async function uploadFileToSupabaseStorage(
  bucket: SupabaseBucketName | string,
  fileOrBlobOrDataUri: File | Blob | string,
  customFileName?: string,
  folderPrefix: string = 'public'
): Promise<string> {
  if (!fileOrBlobOrDataUri) {
    throw new Error('No file provided for upload');
  }

  // If already a permanent remote HTTP/HTTPS URL and not data/blob, return as is
  if (
    typeof fileOrBlobOrDataUri === 'string' &&
    (fileOrBlobOrDataUri.startsWith('http://') || fileOrBlobOrDataUri.startsWith('https://')) &&
    !fileOrBlobOrDataUri.startsWith('blob:')
  ) {
    return fileOrBlobOrDataUri;
  }

  let uploadBlob: Blob;
  let fileName = customFileName;
  let mimeType = 'image/jpeg';

  if (typeof fileOrBlobOrDataUri === 'string') {
    if (fileOrBlobOrDataUri.startsWith('data:')) {
      uploadBlob = dataUriToBlob(fileOrBlobOrDataUri);
      mimeType = uploadBlob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      if (!fileName) {
        fileName = `file_${Date.now()}.${ext}`;
      }
    } else if (fileOrBlobOrDataUri.startsWith('blob:')) {
      try {
        const response = await fetch(fileOrBlobOrDataUri);
        uploadBlob = await response.blob();
        mimeType = uploadBlob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        if (!fileName) {
          fileName = `blob_${Date.now()}.${ext}`;
        }
      } catch (err) {
        console.warn('[directSupabaseStorage] Could not fetch local blob URL:', err);
        throw new Error('Local blob URL could not be read');
      }
    } else {
      // Ordinary string - return
      return fileOrBlobOrDataUri;
    }
  } else if (fileOrBlobOrDataUri instanceof File) {
    uploadBlob = fileOrBlobOrDataUri;
    mimeType = fileOrBlobOrDataUri.type || 'image/jpeg';
    fileName = fileName || fileOrBlobOrDataUri.name;
  } else if (fileOrBlobOrDataUri instanceof Blob) {
    uploadBlob = fileOrBlobOrDataUri;
    mimeType = fileOrBlobOrDataUri.type || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    fileName = fileName || `blob_${Date.now()}.${ext}`;
  } else {
    throw new Error('Unsupported file format provided to storage upload');
  }

  const safeName = sanitizeStorageFileName(fileName || `upload_${Date.now()}.jpg`);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const filePath = folderPrefix ? `${folderPrefix}/${uniquePrefix}_${safeName}` : `${uniquePrefix}_${safeName}`;

  const targetBucket = bucket || 'products';

  try {
    // 1. Direct upload function using Supabase Storage client
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, uploadBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });

    if (error) {
      console.warn(`[directSupabaseStorage] Upload to bucket '${targetBucket}' returned error:`, error.message);
      
      // Fallback to 'products' or 'avatars' bucket if target bucket has permissions or config mismatch
      if (targetBucket !== 'products') {
        console.log(`[directSupabaseStorage] Attempting fallback upload to 'products' bucket...`);
        const fallbackRes = await supabase.storage
          .from('products')
          .upload(filePath, uploadBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType,
          });

        if (!fallbackRes.error && fallbackRes.data) {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(fallbackRes.data.path);
          if (pubData?.publicUrl) {
            console.log('[directSupabaseStorage] Fallback upload succeeded:', pubData.publicUrl);
            return pubData.publicUrl;
          }
        }
      }

      throw error;
    }

    // 2. Immediately retrieve public URL using getPublicUrl
    const { data: publicUrlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      // Construct fallback public URL if getPublicUrl didn't return string
      const manualPublicUrl = `${supabaseUrl}/storage/v1/object/public/${targetBucket}/${data.path}`;
      return manualPublicUrl;
    }

    console.log(`[directSupabaseStorage] File successfully uploaded to Supabase Storage: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(`[directSupabaseStorage] Upload exception for ${targetBucket}/${filePath}:`, err);
    throw err;
  }
}

/**
 * Ensures that an image/file field is a permanent Supabase public URL.
 * If given a File, Blob, or base64 data URI, it will upload to Supabase Storage
 * and resolve to the permanent public URL.
 */
export async function ensurePermanentSupabaseUrl(
  input: File | Blob | string | null | undefined,
  bucket: SupabaseBucketName | string = 'products',
  fallbackUrl: string = ''
): Promise<string> {
  if (!input) return fallbackUrl;

  // Already a permanent remote URL
  if (
    typeof input === 'string' &&
    (input.startsWith('http://') || input.startsWith('https://')) &&
    !input.startsWith('blob:')
  ) {
    return input;
  }

  try {
    const publicUrl = await uploadFileToSupabaseStorage(bucket, input);
    return publicUrl;
  } catch (err) {
    console.error('[directSupabaseStorage] Failed to ensure permanent URL:', err);
    // If it was already a string, return it as a last resort so data isn't lost, or fallbackUrl
    return typeof input === 'string' && input ? input : fallbackUrl;
  }
}

/**
 * Resolves any product image path, array, JSON string, or URL strictly using the Supabase Storage SDK
 * (supabase.storage.from('products').getPublicUrl(cleanPath)).
 *
 * STRICT BUCKET FIX RULES:
 * 1. FORCE 'products' BUCKET:
 *    - All product media exclusively uses 'products'. No references or fallback to 'product-images'.
 * 2. CLEAN RELATIVE PATHS:
 *    - cleanPath is strictly the relative file path (e.g., 'item-123.jpg').
 *    - Strip out any prefixes like 'products/', '/products/', or full URL origins before calling getPublicUrl.
 * 3. PREVENT UNNECESSARY CALLS:
 *    - If path is null, empty, or undefined, directly return '/placeholder-product.svg' without making a request to Supabase.
 */
export function getProductPublicUrl(pathOrUrl: any, bucket: string = 'products'): string {
  const defaultPlaceholder = '/placeholder-product.svg';
  if (!pathOrUrl) return defaultPlaceholder;

  let candidate: any = pathOrUrl;

  // 1. If it's an Array, take the first element
  if (Array.isArray(candidate)) {
    if (candidate.length === 0) return defaultPlaceholder;
    candidate = candidate[0];
  }

  // 2. If it's a string, attempt JSON parse if it looks like JSON array or object
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidate = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          candidate = parsed.url || parsed.path || parsed.src || parsed.photo || parsed.image || '';
        }
      } catch {
        const match = trimmed.match(/^\[\s*["']?([^"',\]]+)["']?\s*\]$/);
        if (match && match[1]) {
          candidate = match[1].trim();
        }
      }
    }
  }

  // 3. If it's an object with url / path / src
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    candidate = candidate.url || candidate.path || candidate.src || candidate.photo || candidate.image || '';
  }

  if (!candidate || typeof candidate !== 'string') return defaultPlaceholder;

  let clean = candidate.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1).trim();
  }

  if (
    !clean ||
    clean === 'undefined' ||
    clean === 'null' ||
    clean === '[object Object]' ||
    clean === '{}' ||
    clean === '[]' ||
    clean === 'none' ||
    clean === 'false' ||
    clean === 'true' ||
    clean === 'default' ||
    clean === 'placeholder' ||
    clean === '/placeholder-product.svg' ||
    clean === 'placeholder-product.svg' ||
    clean === '/upload' ||
    clean === 'upload' ||
    clean === '/uploads' ||
    clean === 'uploads' ||
    clean === '/api/upload' ||
    clean === 'api/upload'
  ) {
    return defaultPlaceholder;
  }

  if (clean.includes(',') && !clean.startsWith('data:')) {
    clean = clean.split(',')[0].trim();
  }

  if (clean.startsWith('blob:')) {
    return defaultPlaceholder;
  }
  if (clean.startsWith('data:image/')) {
    return clean;
  }

  // Local static asset packaged with the app
  if (
    clean.startsWith('/assets/') ||
    clean.startsWith('assets/') ||
    clean.startsWith('/logo') ||
    clean.endsWith('.svg') ||
    clean.startsWith('/runner') ||
    clean.startsWith('/jhadimadi')
  ) {
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  // Filter out known demo/mock placeholder images from external unsplash
  if (
    clean.includes('photo-1546069901') ||
    clean.includes('photo-1542838132') ||
    clean.includes('photo-1586201375761') ||
    clean.includes('photo-1610832958506')
  ) {
    return defaultPlaceholder;
  }

  const validImageExtRegex = /\.(jpe?g|png|webp|gif|svg|avif)($|\?)/i;

  // If full remote URL (Supabase or proxy)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const parsed = new URL(clean);

      // If already a valid permanent public Supabase URL, return directly as-is
      if (parsed.pathname.includes('/storage/v1/object/public/')) {
        return clean;
      }

      // Check if it's signed Supabase storage URL: extract relative file path
      if (parsed.pathname.includes('/storage/v1/object/sign/')) {
        const storageMatch = parsed.pathname.match(/\/storage\/v1\/object\/sign\/(?:products|product-images|product|banners|avatars)\/(.*)$/i);
        if (storageMatch && storageMatch[1]) {
          clean = decodeURIComponent(storageMatch[1].replace(/^\/+/, '').split('?')[0]);
        } else {
          const generalMatch = parsed.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.*)$/i);
          if (generalMatch && generalMatch[1]) {
            clean = decodeURIComponent(generalMatch[1].replace(/^\/+/, '').split('?')[0]);
          } else {
            return defaultPlaceholder;
          }
        }
      } else if (
        parsed.hostname.includes('aistudio.google.com') ||
        parsed.pathname.includes('/_/upload/') ||
        parsed.pathname.includes('/upload/') ||
        parsed.pathname.includes('/uploads/')
      ) {
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        clean = decodeURIComponent(pathSegments[pathSegments.length - 1] || '');
      } else {
        // Full external non-Supabase URL (e.g. CDN or supplier URL)
        return clean;
      }
    } catch {
      return defaultPlaceholder;
    }
  }

  // Candidate is now a relative path. Strip all prefix variants!
  let cleanPath = clean
    .replace(/^https?:\/\/[^/]+/i, '') // strip any residual origin
    .replace(/^\/?storage\/v1\/object\/(?:public|sign)\/(?:products|product-images|product|banners)\//i, '')
    .replace(/^\/?(_\/)?(upload|uploads)\//i, '')
    .replace(/^\/?(product-images|products|product|banners)\//i, '')
    .replace(/^\/?(public)\//i, '')
    .replace(/^\/+/, '')
    .split('?')[0];

  if (!cleanPath || !validImageExtRegex.test(cleanPath)) {
    return defaultPlaceholder;
  }

  cleanPath = decodeURIComponent(cleanPath);

  // Use provided bucket (defaulting to 'products') with clean relative file path
  const targetBucket = bucket || 'products';
  const { data } = supabase.storage.from(targetBucket).getPublicUrl(cleanPath);
  return data?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${targetBucket}/${encodeURIComponent(cleanPath)}`;
}

/**
 * Parse products_photos (JSON array, string array, comma-separated, or single string)
 * into an array of verified Supabase Storage public URLs.
 */
export function parseAllProductPhotos(rawPhotos: any, bucket: string = 'products'): string[] {
  if (!rawPhotos) return [];
  let list: any[] = [];
  if (Array.isArray(rawPhotos)) {
    list = rawPhotos;
  } else if (typeof rawPhotos === 'string') {
    const trimmed = rawPhotos.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [trimmed];
      }
    } else if (trimmed.includes(',') && !trimmed.startsWith('data:')) {
      list = trimmed.split(',').map(s => s.trim());
    } else {
      list = [trimmed];
    }
  } else {
    list = [rawPhotos];
  }

  return list
    .map(p => getProductPublicUrl(p, bucket))
    .filter(url => Boolean(url) && url !== NO_IMAGE_AVAILABLE_ICON);
}

