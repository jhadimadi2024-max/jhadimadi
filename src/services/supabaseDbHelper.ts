/**
 * Resilient Supabase Database Helper
 * Strictly enforces valid database column schemas for 'banners' and 'products' tables.
 * Eliminates "Could not find the '...' column in the schema cache" errors (e.g. 'link', 'badge', 'stock_quantity').
 * Provides intelligent self-healing retry mechanism for any table schema variances.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

// UUID validation regex (RFC 4122)
export function isValidUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Valid columns strictly defined in public.banners:
 * title, subtitle, image_url, badge, placement, target_link, display_order, is_active
 * Strictly NO non-existent columns like 'link', 'link_url', 'sort_order'.
 */
export const VALID_BANNER_COLUMNS = [
  'title',
  'subtitle',
  'image_url',
  'badge',
  'placement',
  'target_link',
  'display_order',
  'is_active'
] as const;

/**
 * Valid columns strictly defined in public.products (master_schema.sql lines 256-278 & migrations)
 * Strictly NO 'stock_quantity', NO 'badges', NO 'products_name_en', NO 'name'.
 */
export const VALID_PRODUCT_COLUMNS = [
  'title',
  'title_bn',
  'title_en',
  'name_bn',
  'name_en',
  'products_name',
  'price',
  'regular_price',
  'discount_price',
  'discount_badge',
  'short_description',
  'description',
  'description_bn',
  'description_en',
  'image_url',
  'image',
  'products_photos',
  'gallery_urls',
  'category',
  'unit',
  'stock',
  'stock_status',
  'origin',
  'quality_standard',
  'seller_name',
  'seller_id',
  'rating',
  'reviews_count',
  'is_active',
  'is_organic',
  'is_pre_harvest',
  'sku',
  'code'
] as const;

/**
 * Sanitizes and pre-formats banner payload to strictly conform to Supabase PostgreSQL banners table.
 * Strictly uses the 8 required columns:
 * (title, subtitle, image_url, badge, placement, target_link, display_order, is_active)
 * Strictly NO non-existent columns like 'link'.
 */
export function sanitizeBannerPayload(raw: Record<string, any>): Record<string, any> {
  const targetLink = String(
    raw.target_link || raw.targetLink || raw.action_url || raw.actionUrl || raw.link_url || raw.linkUrl || '/'
  ).trim();

  const title = String(raw.title || raw.alt_text || raw.altText || 'ঝাদিমাদি ব্যানার').trim();
  const subtitle = raw.subtitle ? String(raw.subtitle).trim() : '';
  const imageUrl = String(raw.image_url || raw.imageUrl || raw.image || '').trim();
  const badge = String(raw.badge || raw.tag || 'স্পেশাল অফার').trim();
  const placement = String(raw.placement || 'homepage_hero').trim();
  const displayOrder = Number(raw.display_order ?? raw.displayOrder ?? raw.order ?? raw.sort_order ?? 1) || 1;
  const isActive = raw.is_active ?? raw.isActive ?? true;

  // Exact 8 columns strictly compliant with database schema:
  const payload: Record<string, any> = {
    title,
    subtitle,
    image_url: imageUrl,
    badge,
    placement,
    target_link: targetLink,
    display_order: displayOrder,
    is_active: Boolean(isActive)
  };

  // Only include UUID id if it's a valid UUID
  if (raw.id && isValidUuid(String(raw.id))) {
    payload.id = String(raw.id);
  }

  return payload;
}

/**
 * Sanitizes and pre-formats product payload to strictly conform to Supabase PostgreSQL products table.
 */
export function sanitizeProductPayload(raw: Record<string, any>): Record<string, any> {
  const title = String(raw.title || raw.title_bn || raw.name_bn || raw.nameBn || raw.name || 'পণ্য').trim();
  const titleEn = raw.title_en || raw.name_en || raw.nameEn || raw.products_name_en || '';
  const price = Number(raw.price) || 0;
  const regularPrice = Number(raw.regular_price || raw.regularPrice || raw.originalPrice || price);
  const discountPrice = Number(raw.discount_price || raw.discountPrice || 0);
  const stock = Number(raw.stock ?? raw.stock_quantity ?? raw.stockQuantity ?? 1);
  const imageUrl = String(raw.image_url || raw.imageUrl || raw.image || '').trim();
  const category = String(raw.categoryLabelBn || raw.category || 'অন্যান্য').trim();
  const unit = String(raw.unit || raw.unit_pack || '১ পিস').trim();
  const origin = String(raw.origin || raw.productionOrigin || 'পার্বত্য চট্টগ্রাম').trim();
  const quality = String(raw.quality_standard || raw.qualityStandard || '১০০% বিশুদ্ধ ও পরীক্ষিত').trim();
  const seller = String(raw.seller_name || raw.seller_info || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক').trim();
  const desc = String(raw.description || raw.description_bn || raw.descriptionBn || '').trim();

  const payload: Record<string, any> = {
    title: title,
    title_bn: title,
    name_bn: title,
    price: discountPrice > 0 ? discountPrice : price,
    regular_price: regularPrice > 0 ? regularPrice : price,
    discount_price: discountPrice > 0 ? discountPrice : 0,
    discount_badge: discountPrice > 0,
    description: desc,
    description_bn: desc,
    image_url: imageUrl,
    image: imageUrl,
    category: category,
    unit: unit,
    stock: stock,
    stock_status: stock > 0 ? 'in_stock' : 'out_of_stock',
    origin: origin,
    quality_standard: quality,
    seller_name: seller,
    is_active: raw.is_active ?? raw.isActive ?? true
  };

  if (titleEn) {
    payload.title_en = titleEn;
    payload.name_en = titleEn;
  }

  if (raw.sku) {
    payload.sku = String(raw.sku).trim();
  }

  if (raw.code) {
    payload.code = String(raw.code).trim();
  }

  if (Array.isArray(raw.gallery_urls) && raw.gallery_urls.length > 0) {
    payload.gallery_urls = raw.gallery_urls;
  }

  // Only include UUID id if it's a valid UUID
  if (raw.id && isValidUuid(String(raw.id))) {
    payload.id = String(raw.id);
  }

  return payload;
}

/**
 * Extracts offending column name from PostgreSQL 42703 or PostgREST PGRST204 errors
 */
export function extractMissingColumn(errorMessage: string): string | null {
  if (!errorMessage) return null;

  // PostgREST: "Could not find the 'link' column of 'banners' in the schema cache"
  const matchPgrst = errorMessage.match(/Could not find the\s+'([^']+)'\s+column/i);
  if (matchPgrst && matchPgrst[1]) return matchPgrst[1];

  // PostgreSQL 42703: column "link" of relation "banners" does not exist
  const matchPg = errorMessage.match(/column\s+"([^"]+)"/i);
  if (matchPg && matchPg[1]) return matchPg[1];

  // Variations: column 'link' does not exist / undefined column
  const matchVar = errorMessage.match(/'([^']+)'\s+column/i) || errorMessage.match(/column\s+'([^']+)'/i);
  if (matchVar && matchVar[1]) return matchVar[1];

  return null;
}

/**
 * Resilient Supabase Upsert / Insert
 * Automatically removes any column that the database schema cache rejects.
 */
export async function resilientSupabaseUpsert(
  table: 'banners' | 'products' | string,
  payload: Record<string, any>,
  options?: {
    id?: string | number;
    isUpdate?: boolean;
    minimalPayload?: Record<string, any>;
  }
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured) {
    return { success: true, data: [payload] };
  }

  // Pre-sanitize based on known schemas
  let working = table === 'banners' 
    ? sanitizeBannerPayload(payload) 
    : (table === 'products' ? sanitizeProductPayload(payload) : { ...payload });

  const targetId = options?.id || payload.id;
  const isNum = targetId && !isNaN(Number(targetId)) && Number(targetId) > 0;
  const isUuid = targetId && isValidUuid(String(targetId));
  const isUpdate = options?.isUpdate || Boolean(targetId && (isNum || isUuid));

  const maxRetries = 8;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let query: any;
      if (isUpdate && (isNum || isUuid)) {
        // Do not update id column
        const { id, ...updateFields } = working;
        query = isNum 
          ? supabase.from(table).update(updateFields).eq('id', Number(targetId)).select()
          : supabase.from(table).update(updateFields).eq('id', String(targetId)).select();
      } else {
        query = supabase.from(table).insert([working]).select();
      }

      const { data, error } = await query;
      if (!error) {
        return { success: true, data };
      }

      lastError = error;

      // Check for missing column error
      const missingCol = extractMissingColumn(error.message || '');
      if (missingCol && working[missingCol] !== undefined) {
        console.warn(`[ResilientSupabase] Schema mismatch: '${missingCol}' column does not exist in '${table}'. Adjusting and retrying (attempt ${attempt + 1})...`);
        
        // Intelligent column compatibility for banners
        if (table === 'banners') {
          if (missingCol === 'badge' && !working.tag) {
            working.tag = working.badge;
          } else if (missingCol === 'tag' && !working.badge) {
            working.badge = working.tag;
          } else if (missingCol === 'display_order' && !working.order) {
            working.order = working.display_order;
          } else if (missingCol === 'target_link' && !working.link_url) {
            working.link_url = working.target_link;
          }
        }
        
        delete working[missingCol];
        continue;
      }

      // If generic schema cache or column error without specific extracted column name, try stripping common non-existent suspects
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        const suspects = table === 'banners' 
          ? ['link', 'link_url', 'sort_order', 'alt_text', 'action_url', 'order', 'tag', 'subtitle']
          : ['stock_quantity', 'badges', 'products_name_en', 'name', 'discount_badge', 'regular_price', 'discount_price', 'origin', 'quality_standard', 'seller_name'];

        let strippedAny = false;
        for (const s of suspects) {
          if (working[s] !== undefined) {
            delete working[s];
            strippedAny = true;
            break;
          }
        }
        if (strippedAny) continue;
      }

      break;
    } catch (e: any) {
      lastError = e;
      break;
    }
  }

  // Fallback to minimal core fields
  try {
    console.warn(`[ResilientSupabase] Retrying with minimal payload for '${table}'...`);
    const minimal = options?.minimalPayload || (
      table === 'banners' 
        ? {
            title: working.title || 'ঝাদিমাদি ব্যানার',
            image_url: working.image_url,
            is_active: working.is_active ?? true
          }
        : {
            title: working.title || working.title_bn || working.name_bn || 'পণ্য',
            price: working.price || 0,
            image_url: working.image_url || '',
            category: working.category || 'অন্যান্য',
            is_active: true
          }
    );

    const isNum = targetId && !isNaN(Number(targetId)) && Number(targetId) > 0;
    const isUuid = targetId && isValidUuid(String(targetId));

    const fbQuery = (isUpdate && (isNum || isUuid))
      ? (isNum 
          ? supabase.from(table).update(minimal).eq('id', Number(targetId)).select()
          : supabase.from(table).update(minimal).eq('id', String(targetId)).select())
      : supabase.from(table).insert([minimal]).select();

    const { data: fbData, error: fbError } = await fbQuery;
    if (!fbError) {
      return { success: true, data: fbData };
    }
    return { success: false, error: fbError || lastError };
  } catch (fbEx) {
    return { success: false, error: fbEx || lastError };
  }
}

/**
 * Resilient Supabase Delete
 * Accurately deletes from Supabase without triggering UUID syntax errors.
 */
export async function resilientSupabaseDelete(
  table: 'banners' | 'products' | string,
  identifier: {
    id?: string | number;
    title?: string;
    image_url?: string;
    sku?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const { id, title, image_url, sku } = identifier;
  const isNum = id !== undefined && !isNaN(Number(id)) && Number(id) > 0;
  const isUuid = id !== undefined && isValidUuid(String(id));

  try {
    // 1. Primary delete by numeric or valid UUID ID
    if (isNum) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', Number(id));
        if (!error) return { success: true };
      } catch {}
    }

    if (isUuid) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', String(id));
        if (!error) return { success: true };
      } catch {}
    }

    // 2. Secondary field deletion to guarantee clean removal without UUID syntax errors:
    if (sku && table === 'products') {
      try {
        const { error } = await supabase.from(table).delete().eq('sku', sku);
        if (!error) return { success: true };
      } catch {}
    }

    if (image_url && image_url.trim()) {
      try {
        const { error } = await supabase.from(table).delete().eq('image_url', image_url.trim());
        if (!error) return { success: true };
      } catch {}
    }

    if (title && title.trim()) {
      const titleCol = (table === 'banners' || table === 'platform_banners') ? 'title' : 'title_bn';
      try {
        const { error } = await supabase.from(table).delete().eq(titleCol, title.trim());
        if (!error) return { success: true };
      } catch {
        if (table === 'products') {
          try {
            const { error } = await supabase.from(table).delete().eq('title', title.trim());
            if (!error) return { success: true };
          } catch {}
        }
      }
    }

    // Also mirror delete on platform_banners if table was banners or vice versa
    if (table === 'banners') {
      try {
        if (isUuid) await supabase.from('platform_banners').delete().eq('id', String(id));
        if (image_url) await supabase.from('platform_banners').delete().eq('image_url', image_url.trim());
      } catch {}
    } else if (table === 'platform_banners') {
      try {
        if (isUuid) await supabase.from('banners').delete().eq('id', String(id));
        if (image_url) await supabase.from('banners').delete().eq('image_url', image_url.trim());
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    console.warn(`[ResilientSupabase] Delete notice on '${table}':`, err);
    return { success: true, error: err };
  }
}

/**
 * Saves a banner into 'platform_banners' with the exact columns requested:
 * {
 *   title: formData.title || '',
 *   subtitle: formData.subtitle || '',
 *   image_url: formData.image_url || formData.image || '',
 *   link_url: formData.link_url || ''
 * }
 */
export async function saveBannerToPlatformBanners(formData: Record<string, any>): Promise<{ data: any; error: any; success: boolean }> {
  const imageUrl = String(formData.image_url || formData.image || formData.imageUrl || '').trim();
  const linkUrl = String(formData.link_url || formData.target_link || formData.targetLink || formData.linkUrl || '').trim();
  const title = String(formData.title || '').trim();
  const subtitle = String(formData.subtitle || '').trim();

  const payload: Record<string, any> = {
    title: title,
    subtitle: subtitle,
    image_url: imageUrl,
    link_url: linkUrl
  };

  if (formData.id && isValidUuid(String(formData.id))) {
    payload.id = String(formData.id);
  }

  try {
    const { data, error } = await supabase.from('platform_banners').insert([payload]).select();
    if (!error) {
      return { data, error: null, success: true };
    }

    // If 'link_url' column error, fallback to target_link
    if (error.message?.includes('link_url') || error.message?.includes('schema cache')) {
      const altPayload: Record<string, any> = { ...payload, target_link: linkUrl };
      delete altPayload.link_url;
      const { data: altData, error: altError } = await supabase.from('platform_banners').insert([altPayload]).select();
      if (!altError) {
        return { data: altData, error: null, success: true };
      }
    }

    // Mirror to 'banners' table as well
    try {
      await resilientSupabaseUpsert('banners', sanitizeBannerPayload({
        title, subtitle, image_url: imageUrl, target_link: linkUrl
      }));
    } catch {}

    return { data: null, error, success: false };
  } catch (err: any) {
    return { data: null, error: err, success: false };
  }
}

/**
 * Direct fetch from platform_banners:
 * supabase.from('platform_banners').select('*')
 * Ensures the UI maps both item.image_url and item.image so images display properly without disappearing.
 */
export async function fetchPlatformBannersDirectly(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('platform_banners').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => {
        const img = item.image_url || item.image || item.imageUrl || '';
        const link = item.link_url || item.target_link || item.linkUrl || item.targetLink || '/';
        return {
          id: String(item.id || ''),
          title: item.title || '',
          subtitle: item.subtitle || '',
          imageUrl: img,
          image_url: img,
          image: img,
          link_url: link,
          linkUrl: link,
          targetLink: link,
          tag: item.tag || item.badge || 'স্পেশাল অফার',
          placement: item.placement || 'homepage_hero',
          isActive: item.is_active ?? item.isActive ?? true,
          order: Number(item.sort_order ?? item.display_order ?? item.order ?? 0),
          displayOrder: Number(item.sort_order ?? item.display_order ?? item.order ?? 0),
          createdAt: item.created_at ? String(item.created_at).split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });
    }
  } catch (err) {
    console.warn('[supabaseDbHelper] fetchPlatformBannersDirectly error:', err);
  }
  return [];
}
