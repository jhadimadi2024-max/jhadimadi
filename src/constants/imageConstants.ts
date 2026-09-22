/**
 * Centralized Static Image Constants & Generic Neutral Product Placeholder
 * Eliminates all random/demo Unsplash image fallbacks and prevents broken 404 image requests.
 */

export const NEUTRAL_PRODUCT_PLACEHOLDER = '/placeholder-product.svg';

export const NO_IMAGE_AVAILABLE_ICON = '/placeholder-product.svg';

/**
 * Validates if a string is a genuine, non-placeholder image URL
 */
export function isValidProductImageUrl(url: unknown): url is string {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (
    !clean ||
    clean === 'undefined' ||
    clean === 'null' ||
    clean === '[object object]' ||
    clean === '{}' ||
    clean === '[]' ||
    clean === 'none' ||
    clean === 'false' ||
    clean === 'true' ||
    clean === 'default' ||
    clean === 'placeholder' ||
    clean === '/upload' ||
    clean === 'upload' ||
    clean === '/_/upload' ||
    clean === '_/upload' ||
    clean === '/uploads' ||
    clean === 'uploads' ||
    clean.includes('aistudio.google.com') ||
    clean.includes('/_/upload') ||
    clean.includes('_/upload') ||
    clean.includes('/upload/undefined') ||
    clean.includes('upload/undefined') ||
    clean.includes('/upload/null') ||
    clean.includes('upload/null') ||
    clean.includes('demo-image') ||
    clean.includes('demo_image') ||
    clean.includes('photo-1546069901') || // legacy unsplash fallback
    clean.includes('photo-1542838132') ||
    clean.includes('photo-1586201375761') ||
    clean.includes('photo-1610832958506')
  ) {
    return false;
  }
  return true;
}
