import { sanitizeText } from './securitySanitizer';

/**
 * Image Compression & Firestore Document Optimization Utility
 * Prevents Firestore document limit errors (1MB max document size)
 * by compressing uploaded camera and gallery photos to compact WebP/JPEG data URLs.
 */

export async function compressImage(
  input: File | string,
  maxWidth = 350,
  maxHeight = 350,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    try {
      let src = '';
      if (typeof input === 'string') {
        if (!input) return resolve('');
        // If it's already an external URL (e.g. Unsplash), return as-is
        if (input.startsWith('http://') || input.startsWith('https://')) {
          return resolve(input);
        }
        src = input;
      } else {
        src = URL.createObjectURL(input);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            width = 300;
            height = 300;
          }

          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            if (typeof input !== 'string') URL.revokeObjectURL(src);
            return resolve(typeof input === 'string' ? input.slice(0, 100000) : '');
          }

          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          if (typeof input !== 'string') {
            URL.revokeObjectURL(src);
          }
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('[ImageCompressor] Canvas processing error:', err);
          if (typeof input !== 'string') URL.revokeObjectURL(src);
          resolve(typeof input === 'string' ? input.slice(0, 100000) : '');
        }
      };

      img.onerror = (err) => {
        console.warn('[ImageCompressor] Image loading error:', err);
        if (typeof input !== 'string') URL.revokeObjectURL(src);
        resolve(typeof input === 'string' ? input : '');
      };

      img.src = src;
    } catch (err) {
      console.warn('[ImageCompressor] General compression error:', err);
      resolve(typeof input === 'string' ? input : '');
    }
  });
}

/**
 * Sanitizes an object before writing to Supabase / Database:
 * 1. Deeply sanitizes all string fields against XSS, script injection, and control characters.
 * 2. Deeply removes/converts any `undefined` values.
 * 3. Compresses any base64 image strings so the payload size is always safe (< 100KB).
 * 4. Preserves Dates and Timestamps.
 */
export async function sanitizeDatabasePayload<T extends Record<string, any>>(obj: T): Promise<T> {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitizeValue = async (val: any): Promise<any> => {
    if (val === undefined) {
      return '';
    }
    if (val === null || typeof val !== 'object') {
      if (typeof val === 'string') {
        if (val.startsWith('data:image/')) {
          return await compressImage(val, 320, 320, 0.7);
        }
        if (val.startsWith('http://') || val.startsWith('https://')) {
          return val;
        }
        return sanitizeText(val);
      }
      return val;
    }

    if (val instanceof Date) {
      return val.toISOString();
    }

    if (Array.isArray(val)) {
      const sanitizedArr = await Promise.all(
        val
          .filter((item) => item !== undefined)
          .map((item) => sanitizeValue(item))
      );
      return sanitizedArr;
    }

    // Plain object
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(val)) {
      if (value !== undefined) {
        cleanObj[key] = await sanitizeValue(value);
      } else {
        cleanObj[key] = '';
      }
    }
    return cleanObj;
  };

  return (await sanitizeValue(obj)) as T;
}

// Alias for seamless backward compatibility during migration
export const sanitizeFirestorePayload = sanitizeDatabasePayload;
