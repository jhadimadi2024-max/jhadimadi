import { supabase, isSupabaseConfigured } from '../supabase';
import { databaseService } from './databaseService';
import { UserProfile, ServiceProvider } from '../types';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { 
  uploadFileToSupabaseStorage, 
  isLocalTransientUrl, 
  ensurePermanentSupabaseUrl 
} from '../utils/directSupabaseStorage';
import { smartSupabaseInsert } from '../utils/supabaseDataService';
import { validateRegistrationDuplicates, DUPLICATE_MESSAGES } from './duplicateValidationService';

/**
 * Ensures a valid UUID format for PostgreSQL UUID primary keys.
 */
function generateSafeUuid(candidate?: string): string {
  if (candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) {
    return candidate;
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ============================================================================
 * UNIFIED REGISTRATION SERVICE (SUPABASE INTEGRATION)
 * ============================================================================
 * Handles typed data submissions for all registration, profile, product,
 * and job forms directly to Supabase with exact table names and column schemas.
 */

// ============================================================================
// 1. EXACT DATABASE TABLE SCHEMAS & COLUMN DEFINITIONS
// ============================================================================
export const TABLE_COLUMNS_SCHEMA = {
  // 1. service_providers
  service_providers: [
    'id',
    'name',
    'service_type',
    'phone',
    'location',
    'display_name',
    'profession_key',
    'category_bn',
    'category_en',
    'sub_category',
    'rate_type',
    'rate_amount',
    'skills',
    'skills_details',
    'experience_years',
    'division',
    'district',
    'upazila',
    'area',
    'mahalla',
    'blood_group',
    'service_details',
    'tax_vat_info',
    'is_available',
    'user_id',
    'created_at',
    'updated_at',
    'search_tags',
    'hashtags',
    'full_name',
    'unique_code',
    'email',
    'address',
    'nid_number',
    'status',
    'whatsapp',
    'whatsapp_number',
    'phone_number',
    'latitude',
    'longitude',
  ],

  // 2. profiles
  profiles: [
    'id',
    'full_name',
    'phone',
    'address',
    'category',
    'unique_id',
    'name',
    'profession',
    'blood_group',
    'district',
    'upazila',
    'area',
    'member_type',
    'photo_url',
    'email',
    'role',
    'avatar_url',
    'division',
    'mahalla',
    'detailed_address',
    'is_blood_donor',
    'is_blood_donor_available',
    'last_donation_date',
    'is_nid_verified',
    'is_paid_member',
  ],

  // 3. products
  products: [
    'id',
    'name',
    'price',
    'category',
    'image_url',
    'stock_quantity',
    'description',
    'products_name_en',
    'badges',
    'video_url',
    'key_highlights',
    'production_process',
    'ingredients',
    'usage_instructions',
    'products_name',
    'products_photos',
    'regular_price',
    'discount_price',
    'discount_badge',
    'short_description',
    'sku',
    'unit',
    'origin',
    'quality_standard',
    'stock_status',
    'seller_name',
    'product_reviews',
  ],

  // 4. product_sellers
  product_sellers: [
    'id',
    'name',
    'full_name',
    'products_name',
    'phone',
    'phone_number',
    'whatsapp',
    'whatsapp_number',
    'district',
    'upazila',
    'latitude',
    'longitude',
    'pass_word',
    'password',
    'description',
    'products_photos',
    'blood_group',
    'created_at',
  ],

  // 5. permanent_members
  permanent_members: [
    'id',
    'name',
    'full_name',
    'phone',
    'phone_number',
    'whatsapp',
    'whatsapp_number',
    'district',
    'upazila',
    'latitude',
    'longitude',
    'pass_word',
    'password',
    'present_address',
    'permanent_address',
    'education',
    'educational_qualification',
    'nid_number',
    'photos_cv',
    'cv_url',
    'passport_photo_url',
    'nid_photo_url',
    'father_name',
    'mother_name',
    'blood_group',
    'created_at',
  ],

  // 6. job_seekers
  job_seekers: [
    'id',
    'name',
    'phone',
    'skills_or_job_type',
    'gender',
    'present_address',
    'permanent_address',
    'distrct',
    'district',
    'upazila',
    'education',
    'job_experience',
    'exprence_texs',
    'selary',
    'cv_photo',
    'description_texs',
    'full_name',
    'phone_number',
    'desired_post',
    'work_experience',
    'special_skills',
    'expected_salary',
    'photos_cv',
    'personal_note',
  ],

  // 7. job_circulars
  job_circulars: [
    'id',
    'title',
    'company',
    'description',
    'job_title',
    'company_or_poster',
    'time',
    'category',
    'district',
    'upazila',
    'selary',
    'date',
    'phone_number',
    'email',
    'photos',
    'blood_group',
    'company_name',
    'job_type',
    'basic_salary',
    'application_deadline',
    'email_website',
    'circular_file',
  ],

  // 8. blood_donors
  blood_donors: [
    'id',
    'name',
    'blood_group',
    'phone',
    'district',
    'upazila',
    'password',
    'full_name',
    'phone_number',
    'pass_word',
    'division',
    'area',
    'last_donation_date',
    'total_donations',
    'is_available',
    'verified',
    'emergency_contact',
    'age',
    'unique_id',
    'district_unique_id',
    'search_tags',
    'hashtags',
    'whatsapp',
    'whatsapp_number',
    'latitude',
    'longitude',
    'created_at',
  ],

  // 9. sellers (direct vendor registry)
  sellers: [
    'id',
    'created_at',
    'full_name',
    'shop_name',
    'phone',
    'email',
    'address',
    'nid_number',
    'trade_license',
    'product_category',
    'status',
  ],

  // 10. jobs (direct job postings)
  jobs: [
    'id',
    'created_at',
    'title',
    'company_name',
    'job_type',
    'vacancy',
    'location',
    'salary_range',
    'deadline',
    'description',
    'requirements',
    'status',
  ],

  // 11. job_applications
  job_applications: [
    'id',
    'created_at',
    'job_id',
    'applicant_name',
    'phone',
    'email',
    'resume_url',
    'experience_summary',
    'status',
  ],

  // 12. members (permanent & verified members)
  members: [
    'id',
    'created_at',
    'full_name',
    'phone',
    'email',
    'nid_number',
    'blood_group',
    'address',
    'photo_url',
    'membership_type',
    'status',
  ],

  // 13. banners (promotional and homepage banners - schema compliant)
  banners: [
    'id',
    'title',
    'subtitle',
    'image_url',
    'link_url',
    'target_link',
    'action_url',
    'placement',
    'tag',
    'sort_order',
    'display_order',
    'is_active',
    'alt_text',
    'created_at',
    'updated_at',
  ],

  // 14. admin_banners
  admin_banners: [
    'id',
    'title',
    'image_url',
    'link_url',
    'is_active',
    'created_at',
  ],

  // 15. admin_products
  admin_products: [
    'id',
    'title',
    'name',
    'price',
    'regular_price',
    'category',
    'unit',
    'description',
    'image_url',
    'image',
    'stock',
    'in_stock',
    'created_at',
  ],

  // 16. seller_products (seller specific store items)
  seller_products: [
    'id',
    'seller_phone',
    'phone_number',
    'name',
    'title',
    'price',
    'regular_price',
    'category',
    'unit',
    'description',
    'description_bn',
    'image_url',
    'image',
    'images',
    'stock',
    'in_stock',
    'seller_name',
    'seller_id',
    'district',
    'upazila',
    'created_at',
  ],
} as const;

export type UnifiedTableName = keyof typeof TABLE_COLUMNS_SCHEMA;

// ============================================================================
// 2. TYPESCRIPT INTERFACES FOR EACH FORM / TABLE PAYLOAD
// ============================================================================

export interface ServiceProviderData {
  name: string;
  full_name?: string;
  service_type?: string;
  phone: string;
  phone_number?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  email?: string;
  location?: string;
  address?: string;
  display_name?: string;
  profession_key?: string;
  category_bn?: string;
  rate_type?: string;
  rate_amount?: number;
  skills?: string | string[];
  district?: string;
  upazila?: string;
  latitude?: number | null;
  longitude?: number | null;
  experience_years?: string;
  nid_number?: string;
  status?: string;
  is_available?: boolean;
}

export interface ProfileData {
  full_name: string;
  phone: string;
  address?: string;
  category?: string;
  unique_id?: string;
  name?: string;
  profession?: string;
  blood_group?: string;
  district?: string;
  upazila?: string;
  area?: string;
  member_type?: string;
  photo_url?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  division?: string;
  mahalla?: string;
  detailed_address?: string;
  is_blood_donor?: boolean;
  is_blood_donor_available?: boolean;
  last_donation_date?: string;
  is_nid_verified?: boolean;
  is_paid_member?: boolean;
}

export interface ProductData {
  products_name: string;
  products_name_en?: string;
  products_photos?: string | string[];
  regular_price: number;
  discount_price?: number;
  discount_badge?: string;
  short_description?: string;
  description?: string;
  sku?: string;
  category?: string;
  unit?: string;
  origin?: string;
  quality_standard?: string;
  stock_status?: string;
  stock_quantity?: number;
  badges?: string[] | any;
  video_url?: string;
  key_highlights?: string[] | any;
  production_process?: string;
  ingredients?: string;
  usage_instructions?: string;
  seller_name?: string;
  product_reviews?: any;
}

export interface SellerData {
  full_name: string;
  shop_name?: string;
  phone: string;
  email?: string;
  address?: string;
  nid_number?: string;
  trade_license?: string;
  product_category?: string;
  status?: string;
}

export interface JobData {
  title: string;
  company_name: string;
  job_type?: string;
  vacancy?: number;
  location?: string;
  salary_range?: string;
  deadline?: string;
  description?: string;
  requirements?: string;
  status?: string;
}

export interface JobApplicationData {
  job_id?: string;
  applicant_name: string;
  phone: string;
  email?: string;
  resume_url?: string;
  experience_summary?: string;
  status?: string;
}

export interface MemberData {
  full_name: string;
  phone: string;
  email?: string;
  nid_number?: string;
  blood_group?: string;
  address?: string;
  photo_url?: string;
  membership_type?: string;
  status?: string;
}

export interface BannerData {
  id?: string;
  title?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
}

export interface ProductSellerData {
  products_name: string;
  phone_number: string;
  name?: string;
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  district?: string;
  upazila?: string;
  latitude?: number | null;
  longitude?: number | null;
  pass_word?: string;
  password?: string;
  description?: string;
  products_photos?: string | string[];
  blood_group?: string;
  created_at?: string;
}

export interface PermanentMemberData {
  name: string;
  phone_number: string;
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  district?: string;
  upazila?: string;
  latitude?: number | null;
  longitude?: number | null;
  pass_word?: string;
  password?: string;
  present_address?: string;
  permanent_address?: string;
  education?: string;
  educational_qualification?: string;
  nid_number?: string;
  photos_cv?: string;
  cv_url?: string;
  passport_photo_url?: string;
  nid_photo_url?: string;
  father_name?: string;
  mother_name?: string;
  blood_group?: string;
  created_at?: string;
}

export interface JobSeekerData {
  full_name: string;
  phone_number: string;
  desired_post?: string;
  gender?: string;
  present_address?: string;
  permanent_address?: string;
  district?: string;
  upazila?: string;
  education?: string;
  work_experience?: string;
  special_skills?: string | string[];
  expected_salary?: number | string;
  photos_cv?: string;
  personal_note?: string;
}

export interface JobCircularData {
  job_title: string;
  company_name: string;
  job_type?: string;
  category?: string;
  district?: string;
  upazila?: string;
  basic_salary?: number | string;
  application_deadline?: string;
  phone_number: string;
  email_website?: string;
  circular_file?: string;
  description?: string;
}

export interface BloodDonorData {
  name: string;
  blood_group: string;
  phone: string;
  district?: string;
  upazila?: string;
  password?: string;
  full_name?: string;
  phone_number?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  latitude?: number | null;
  longitude?: number | null;
  pass_word?: string;
  created_at?: string;
}

export interface AdminBannerData {
  id?: string;
  title?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AdminProductData {
  id?: string;
  title?: string;
  name?: string;
  price?: number;
  regular_price?: number;
  category?: string;
  unit?: string;
  description?: string;
  image_url?: string;
  image?: string;
  stock?: number;
  in_stock?: boolean;
  created_at?: string;
}

export interface SellerProductData {
  id?: string;
  seller_phone: string;
  phone_number?: string;
  name?: string;
  title?: string;
  price?: number;
  regular_price?: number;
  category?: string;
  unit?: string;
  description?: string;
  description_bn?: string;
  image_url?: string;
  image?: string;
  images?: string[];
  stock?: number;
  in_stock?: boolean;
  seller_name?: string;
  seller_id?: string;
  district?: string;
  upazila?: string;
  created_at?: string;
}

export type TableFormDataMap = {
  service_providers: ServiceProviderData;
  profiles: ProfileData;
  products: ProductData;
  product_sellers: ProductSellerData;
  permanent_members: PermanentMemberData;
  job_seekers: JobSeekerData;
  job_circulars: JobCircularData;
  blood_donors: BloodDonorData;
  sellers: SellerData;
  jobs: JobData;
  job_applications: JobApplicationData;
  members: MemberData;
  banners: BannerData;
  admin_banners: AdminBannerData;
  admin_products: AdminProductData;
  seller_products: SellerProductData;
};

export interface UnifiedSubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  table: UnifiedTableName;
  record?: Record<string, any>;
  isLocalFallback?: boolean;
  isDuplicate?: boolean;
  errorCode?: string;
}

// ============================================================================
// 3. NORMALIZATION & SANITIZATION ENGINE
// ============================================================================
/**
 * Normalizes input form data to ensure field names strictly match
 * the target Supabase table columns and eliminates extraneous keys.
 */
export function normalizeFormDataForTable<T extends UnifiedTableName>(
  tableName: T,
  rawData: Record<string, any>
): Record<string, any> {
  if (!rawData || typeof rawData !== 'object') return {};

  const allowedColumns = TABLE_COLUMNS_SCHEMA[tableName] as readonly string[];
  const normalized: Record<string, any> = {};

  // First copy any values that already match allowed column names directly
  for (const col of allowedColumns) {
    if (rawData[col] !== undefined && rawData[col] !== null) {
      normalized[col] = rawData[col];
    }
  }

  // Smart alias mapping for each specific table to avoid form mismatches
  switch (tableName) {
    // 1. service_providers
    case 'service_providers': {
      if (normalized.name === undefined) {
        normalized.name = rawData.name || rawData.display_name || rawData.fullName || rawData.full_name || '';
      }
      if (normalized.display_name === undefined) {
        normalized.display_name = rawData.display_name || normalized.name || '';
      }
      if (normalized.service_type === undefined) {
        normalized.service_type = rawData.service_type || rawData.profession_key || rawData.profession || rawData.category || '';
      }
      if (normalized.profession_key === undefined) {
        normalized.profession_key = rawData.profession_key || rawData.profession || rawData.service_type || '';
      }
      if (normalized.category_bn === undefined) {
        normalized.category_bn = rawData.category_bn || rawData.professionBn || rawData.category || '';
      }
      if (normalized.phone === undefined) {
        normalized.phone = rawData.phone || rawData.phone_number || rawData.mobile || '';
      }
      if (normalized.location === undefined) {
        normalized.location = rawData.location || rawData.address || `${rawData.upazila || ''}, ${rawData.district || ''}`.trim();
      }
      if (normalized.rate_type === undefined) {
        normalized.rate_type = rawData.rate_type || 'Daily';
      }
      if (normalized.rate_amount === undefined) {
        normalized.rate_amount = Number(rawData.rate_amount ?? rawData.dailyWage ?? rawData.rate ?? 600);
      }
      if (normalized.is_available === undefined) {
        normalized.is_available = rawData.is_available !== undefined ? Boolean(rawData.is_available) : true;
      }
      if (normalized.skills === undefined) {
        const s = rawData.skills || rawData.skills_details || rawData.selectedProfessions;
        if (Array.isArray(s)) {
          normalized.skills = s.map(String).map(item => item.trim()).filter(Boolean);
        } else if (typeof s === 'string' && s.trim()) {
          normalized.skills = s.split(',').map(item => item.trim()).filter(Boolean);
        } else {
          normalized.skills = ['অভিজ্ঞ কারিগর'];
        }
      } else if (!Array.isArray(normalized.skills)) {
        normalized.skills = typeof normalized.skills === 'string'
          ? normalized.skills.split(',').map(item => item.trim()).filter(Boolean)
          : ['অভিজ্ঞ কারিগর'];
      }
      break;
    }

    // 2. profiles
    case 'profiles': {
      if (!normalized.id) {
        normalized.id = generateSafeUuid(rawData.id);
      }
      if (normalized.full_name === undefined) {
        normalized.full_name = rawData.full_name || rawData.fullName || rawData.name || '';
      }
      if (normalized.name === undefined) {
        normalized.name = rawData.name || normalized.full_name || '';
      }
      if (normalized.phone === undefined) {
        normalized.phone = rawData.phone || rawData.phone_number || rawData.mobile || '';
      }
      if (normalized.photo_url === undefined) {
        normalized.photo_url = rawData.photo_url || rawData.avatar_url || rawData.avatar || '';
      }
      if (normalized.avatar_url === undefined) {
        normalized.avatar_url = rawData.avatar_url || rawData.photo_url || rawData.avatar || '';
      }
      if (normalized.detailed_address === undefined) {
        normalized.detailed_address = rawData.detailed_address || rawData.address || '';
      }
      if (normalized.address === undefined) {
        normalized.address = rawData.address || rawData.detailed_address || '';
      }
      if (normalized.is_blood_donor === undefined) {
        normalized.is_blood_donor = rawData.is_blood_donor !== undefined ? Boolean(rawData.is_blood_donor) : (rawData.isBloodDonor !== undefined ? Boolean(rawData.isBloodDonor) : false);
      }
      if (normalized.is_blood_donor_available === undefined) {
        normalized.is_blood_donor_available = rawData.is_blood_donor_available !== undefined ? Boolean(rawData.is_blood_donor_available) : true;
      }
      if (normalized.is_nid_verified === undefined) {
        normalized.is_nid_verified = rawData.is_nid_verified !== undefined ? Boolean(rawData.is_nid_verified) : (rawData.isNidVerified !== undefined ? Boolean(rawData.isNidVerified) : false);
      }
      if (normalized.is_paid_member === undefined) {
        normalized.is_paid_member = rawData.is_paid_member !== undefined ? Boolean(rawData.is_paid_member) : (rawData.isPaidMember !== undefined ? Boolean(rawData.isPaidMember) : false);
      }
      if (normalized.blood_group === undefined) {
        normalized.blood_group = rawData.blood_group || rawData.bloodGroup || '';
      }
      break;
    }

    // 3. products
    case 'products': {
      const prodName = rawData.name || rawData.products_name || rawData.name_bn || rawData.product_name || rawData.title || '';
      const photos = rawData.image_url || rawData.products_photos || rawData.image || rawData.photos || rawData.images || '';
      const photoStr = Array.isArray(photos) ? photos.join(',') : (photos || '');
      const regularPrice = Number(rawData.price ?? rawData.regular_price ?? 0);
      const stock = Number(rawData.stock_quantity ?? rawData.stock ?? 1);

      normalized.name = normalized.name || prodName;
      normalized.products_name = normalized.products_name || prodName;
      normalized.price = normalized.price !== undefined ? Number(normalized.price) : regularPrice;
      normalized.regular_price = normalized.regular_price !== undefined ? Number(normalized.regular_price) : regularPrice;
      normalized.image_url = normalized.image_url || photoStr;
      normalized.products_photos = normalized.products_photos || photoStr;
      normalized.stock_quantity = normalized.stock_quantity !== undefined ? Number(normalized.stock_quantity) : stock;

      if (normalized.discount_price === undefined && (rawData.discount_price !== undefined || rawData.discountPrice !== undefined)) {
        normalized.discount_price = Number(rawData.discount_price ?? rawData.discountPrice);
      } else if (normalized.discount_price !== undefined && normalized.discount_price !== null) {
        normalized.discount_price = Number(normalized.discount_price) || null;
      }
      if (normalized.discount_badge !== undefined) {
        normalized.discount_badge = Boolean(
          normalized.discount_badge &&
          normalized.discount_badge !== 'false' &&
          normalized.discount_badge !== '0'
        );
      } else {
        normalized.discount_badge = Boolean(
          (normalized.discount_price && normalized.discount_price > 0 && normalized.discount_price < normalized.regular_price) ||
          rawData.badge
        );
      }
      if (normalized.description === undefined) {
        normalized.description = rawData.description || rawData.description_bn || rawData.desc || `${prodName} - তাজা ও নির্ভেজাল পাহাড়ি পণ্য`;
      }
      if (normalized.short_description === undefined) {
        normalized.short_description = rawData.short_description || rawData.shortDesc || (normalized.description ? String(normalized.description).slice(0, 150) : '');
      }
      if (normalized.seller_name === undefined) {
        normalized.seller_name = rawData.seller_name || rawData.shop_name || rawData.business_name || '';
      }
      if (normalized.stock_status === undefined) {
        normalized.stock_status = rawData.stock_status || (stock > 0 ? 'in_stock' : 'out_of_stock');
      }
      if (normalized.product_reviews === undefined && rawData.reviews) {
        normalized.product_reviews = rawData.reviews;
      }
      if (normalized.products_name_en === undefined) {
        normalized.products_name_en = rawData.products_name_en || rawData.title_en || rawData.nameEn || rawData.name_en || '';
      }
      if (normalized.video_url === undefined) {
        normalized.video_url = rawData.video_url || rawData.videoUrl || rawData.youtubeUrl || '';
      }
      if (normalized.production_process === undefined) {
        normalized.production_process = rawData.production_process || rawData.how_it_is_produced || rawData.productionMethod || '';
      }
      if (normalized.ingredients === undefined) {
        normalized.ingredients = rawData.ingredients || rawData.materials_and_ingredients || rawData.materials || '';
      }
      if (normalized.usage_instructions === undefined) {
        normalized.usage_instructions = rawData.usage_instructions || rawData.usage_and_storage || rawData.usageInstructions || '';
      }
      if (normalized.badges === undefined) {
        normalized.badges = Array.isArray(rawData.badges) ? rawData.badges : (rawData.badge ? [rawData.badge] : []);
      }
      if (normalized.key_highlights === undefined) {
        normalized.key_highlights = Array.isArray(rawData.key_highlights) ? rawData.key_highlights : (Array.isArray(rawData.features) ? rawData.features : []);
      }
      break;
    }

    // 4. product_sellers
    case 'product_sellers': {
      if (normalized.products_name === undefined) {
        normalized.products_name = rawData.products_name || rawData.product_name || rawData.name_bn || rawData.name || rawData.productNameOrBusiness || '';
      }
      if (normalized.phone_number === undefined) {
        normalized.phone_number = rawData.phone_number || rawData.phone || rawData.mobile || '';
      }
      if (normalized.pass_word === undefined) {
        normalized.pass_word = rawData.pass_word || rawData.password || rawData.pin || '';
      }
      if (normalized.products_photos === undefined) {
        const photos = rawData.products_photos || rawData.image_url || rawData.sellerProductImageUrl || rawData.avatar || '';
        normalized.products_photos = Array.isArray(photos) ? photos.join(',') : photos;
      }
      if (normalized.description === undefined) {
        normalized.description = rawData.description || rawData.productDesc || rawData.description_bn || '';
      }
      if (normalized.blood_group === undefined) {
        normalized.blood_group = rawData.blood_group || rawData.bloodGroup || '';
      }
      break;
    }

    // 5. permanent_members
    case 'permanent_members': {
      if (normalized.name === undefined) {
        normalized.name = rawData.name || rawData.full_name || rawData.fullName || '';
      }
      if (normalized.phone_number === undefined) {
        normalized.phone_number = rawData.phone_number || rawData.phone || rawData.mobile || '';
      }
      if (normalized.pass_word === undefined) {
        normalized.pass_word = rawData.pass_word || rawData.password || rawData.pin || '';
      }
      if (normalized.present_address === undefined) {
        normalized.present_address = rawData.present_address || rawData.presentAddress || rawData.address || '';
      }
      if (normalized.permanent_address === undefined) {
        normalized.permanent_address = rawData.permanent_address || rawData.permanentAddress || '';
      }
      if (normalized.education === undefined) {
        normalized.education = rawData.education || rawData.educational_qualification || rawData.educationalQualification || '';
      }
      if (normalized.nid_number === undefined) {
        normalized.nid_number = rawData.nid_number || rawData.nidNumber || '';
      }
      if (normalized.photos_cv === undefined) {
        normalized.photos_cv = rawData.photos_cv || rawData.cv_url || rawData.cvUrl || rawData.avatar || '';
      }
      if (normalized.blood_group === undefined) {
        normalized.blood_group = rawData.blood_group || rawData.bloodGroup || '';
      }
      break;
    }

    // 6. job_seekers
    case 'job_seekers': {
      const seekerName = rawData.name || rawData.full_name || rawData.fullName || '';
      const seekerPhone = rawData.phone || rawData.phone_number || rawData.mobile || '';
      const seekerPost = rawData.skills_or_job_type || rawData.desired_post || rawData.desired_job_title || rawData.desiredJobTitle || rawData.job_title || '';
      const seekerDist = rawData.district || rawData.distrct || 'খাগড়াছড়ি';
      const seekerUpazila = rawData.upazila || 'খাগড়াছড়ি সদর';
      const seekerEdu = rawData.education || rawData.highest_education || rawData.highestEducation || '';
      const seekerExp = rawData.job_experience || rawData.work_experience || rawData.experience_years || rawData.experience || '';
      const seekerSalary = rawData.selary || rawData.expected_salary || rawData.expectedSalary || '';
      const seekerCv = rawData.cv_photo || rawData.photos_cv || rawData.cv_url || rawData.cvUrl || rawData.resume_url || rawData.photo_url || '';
      const seekerNote = rawData.description_texs || rawData.personal_note || rawData.notes || rawData.bio || '';

      normalized.name = normalized.name || seekerName;
      normalized.full_name = normalized.full_name || seekerName;
      normalized.phone = normalized.phone || seekerPhone;
      normalized.phone_number = normalized.phone_number || seekerPhone;
      normalized.skills_or_job_type = normalized.skills_or_job_type || seekerPost;
      normalized.desired_post = normalized.desired_post || seekerPost;
      normalized.district = normalized.district || seekerDist;
      normalized.distrct = normalized.distrct || seekerDist;
      normalized.upazila = normalized.upazila || seekerUpazila;
      normalized.education = normalized.education || seekerEdu;
      normalized.job_experience = normalized.job_experience || seekerExp;
      normalized.work_experience = normalized.work_experience || seekerExp;
      normalized.selary = normalized.selary || seekerSalary;
      normalized.expected_salary = normalized.expected_salary || seekerSalary;
      normalized.cv_photo = normalized.cv_photo || seekerCv;
      normalized.photos_cv = normalized.photos_cv || seekerCv;
      normalized.description_texs = normalized.description_texs || seekerNote;
      normalized.personal_note = normalized.personal_note || seekerNote;
      break;
    }

    // 7. job_circulars
    case 'job_circulars': {
      const circTitle = rawData.title || rawData.job_title || rawData.jobTitle || '';
      const circCompany = rawData.company || rawData.company_name || rawData.company_or_poster || rawData.companyName || '';
      const circPhone = rawData.phone_number || rawData.phone || rawData.mobile || '';
      const circSalary = rawData.selary || rawData.basic_salary || rawData.salary || rawData.basicSalary || '';
      const circDeadline = rawData.date || rawData.application_deadline || rawData.deadline || '';
      const circFile = rawData.photos || rawData.circular_file || rawData.circularFile || rawData.file_url || '';
      const circEmail = rawData.email || rawData.email_website || '';
      const circDesc = rawData.description || rawData.job_description || `${circCompany}-এ ${circTitle} পদে কর্মী নিয়োগ চলছে।`;

      normalized.title = normalized.title || circTitle;
      normalized.company = normalized.company || circCompany;
      normalized.job_title = normalized.job_title || circTitle;
      normalized.company_or_poster = normalized.company_or_poster || circCompany;
      normalized.company_name = normalized.company_name || circCompany;
      normalized.phone_number = normalized.phone_number || circPhone;
      normalized.phone = normalized.phone || circPhone;
      normalized.selary = normalized.selary || circSalary;
      normalized.basic_salary = normalized.basic_salary || circSalary;
      normalized.date = normalized.date || circDeadline;
      normalized.application_deadline = normalized.application_deadline || circDeadline;
      normalized.photos = normalized.photos || circFile;
      normalized.circular_file = normalized.circular_file || circFile;
      normalized.email = normalized.email || circEmail;
      normalized.email_website = normalized.email_website || circEmail;
      normalized.description = normalized.description || circDesc;
      break;
    }

    // 8. blood_donors
    case 'blood_donors': {
      const donorName = rawData.name || rawData.full_name || rawData.fullName || '';
      const donorPhone = rawData.phone || rawData.phone_number || rawData.mobile || '';
      const donorPass = rawData.password || rawData.pass_word || rawData.pin || '123456';
      const donorBlood = rawData.blood_group || rawData.bloodGroup || 'O+';
      const donorDist = rawData.district || 'খাগড়াছড়ি';
      const donorUpazila = rawData.upazila || 'সদর';

      normalized.name = normalized.name || donorName;
      normalized.full_name = normalized.full_name || donorName;
      normalized.phone = normalized.phone || donorPhone;
      normalized.phone_number = normalized.phone_number || donorPhone;
      normalized.password = normalized.password || donorPass;
      normalized.pass_word = normalized.pass_word || donorPass;
      normalized.blood_group = normalized.blood_group || donorBlood;
      normalized.district = normalized.district || donorDist;
      normalized.upazila = normalized.upazila || donorUpazila;
      break;
    }

    // 9. sellers
    case 'sellers': {
      normalized.full_name = normalized.full_name || rawData.full_name || rawData.name || rawData.seller_name || '';
      normalized.shop_name = normalized.shop_name || rawData.shop_name || rawData.shopName || rawData.business_name || '';
      normalized.phone = normalized.phone || rawData.phone || rawData.phone_number || rawData.mobile || '';
      normalized.email = normalized.email || rawData.email || '';
      normalized.address = normalized.address || rawData.address || rawData.detailed_address || '';
      normalized.nid_number = normalized.nid_number || rawData.nid_number || rawData.nidNumber || '';
      normalized.trade_license = normalized.trade_license || rawData.trade_license || rawData.tradeLicense || '';
      normalized.product_category = normalized.product_category || rawData.product_category || rawData.category || 'Food';
      normalized.status = normalized.status || rawData.status || 'pending';
      break;
    }

    // 10. jobs
    case 'jobs': {
      normalized.title = normalized.title || rawData.title || rawData.job_title || '';
      normalized.company_name = normalized.company_name || rawData.company_name || rawData.company || '';
      normalized.job_type = normalized.job_type || rawData.job_type || rawData.jobType || 'Full-time';
      normalized.vacancy = Number(rawData.vacancy ?? rawData.vacanciesCount ?? 1);
      normalized.location = normalized.location || rawData.location || rawData.address || '';
      normalized.salary_range = normalized.salary_range || rawData.salary_range || rawData.salary || rawData.basic_salary || '';
      if (rawData.deadline) {
        normalized.deadline = rawData.deadline;
      }
      normalized.description = normalized.description || rawData.description || '';
      normalized.requirements = normalized.requirements || (Array.isArray(rawData.requirements) ? rawData.requirements.join('\n') : rawData.requirements) || '';
      normalized.status = normalized.status || rawData.status || 'active';
      break;
    }

    // 11. job_applications
    case 'job_applications': {
      normalized.job_id = normalized.job_id || rawData.job_id || rawData.jobId || null;
      normalized.applicant_name = normalized.applicant_name || rawData.applicant_name || rawData.applicantName || rawData.name || '';
      normalized.phone = normalized.phone || rawData.phone || rawData.phone_number || '';
      normalized.email = normalized.email || rawData.email || '';
      normalized.resume_url = normalized.resume_url || rawData.resume_url || rawData.resumeUrl || rawData.cv_url || '';
      normalized.experience_summary = normalized.experience_summary || rawData.experience_summary || rawData.experience || rawData.bio || '';
      normalized.status = normalized.status || rawData.status || 'applied';
      break;
    }

    // 12. members
    case 'members': {
      normalized.full_name = normalized.full_name || rawData.full_name || rawData.fullName || rawData.name || '';
      normalized.phone = normalized.phone || rawData.phone || rawData.phone_number || '';
      normalized.email = normalized.email || rawData.email || '';
      normalized.nid_number = normalized.nid_number || rawData.nid_number || rawData.nidNumber || '';
      normalized.blood_group = normalized.blood_group || rawData.blood_group || rawData.bloodGroup || '';
      normalized.address = normalized.address || rawData.address || rawData.detailed_address || rawData.present_address || '';
      normalized.photo_url = normalized.photo_url || rawData.photo_url || rawData.avatar || rawData.avatar_url || '';
      normalized.membership_type = normalized.membership_type || rawData.membership_type || 'permanent';
      normalized.status = normalized.status || rawData.status || 'pending';
      break;
    }

    // 13. banners (strictly title, image_url, link_url, is_active)
    case 'banners': {
      normalized.title = normalized.title || rawData.title || rawData.altText || '';
      normalized.image_url = normalized.image_url || rawData.image_url || rawData.imageUrl || '';
      normalized.link_url = normalized.link_url || rawData.link_url || rawData.target_link || rawData.targetLink || rawData.actionUrl || '';
      normalized.is_active = rawData.is_active !== undefined ? Boolean(rawData.is_active) : (rawData.isActive !== undefined ? Boolean(rawData.isActive) : true);
      break;
    }

    // 14. admin_banners
    case 'admin_banners': {
      normalized.title = normalized.title || rawData.title || rawData.altText || '';
      normalized.image_url = normalized.image_url || rawData.image_url || rawData.imageUrl || '';
      normalized.link_url = normalized.link_url || rawData.link_url || rawData.target_link || rawData.targetLink || rawData.actionUrl || '';
      normalized.is_active = rawData.is_active !== undefined ? Boolean(rawData.is_active) : (rawData.isActive !== undefined ? Boolean(rawData.isActive) : true);
      break;
    }

    // 15. admin_products
    case 'admin_products': {
      normalized.title = normalized.title || rawData.title || rawData.name || rawData.products_name || '';
      normalized.name = normalized.name || normalized.title;
      normalized.price = Number(rawData.price ?? rawData.regular_price ?? 0);
      normalized.regular_price = Number(rawData.regular_price ?? rawData.price ?? 0);
      normalized.category = rawData.category || 'পাহাড়ি খাঁটি পণ্য';
      normalized.unit = rawData.unit || '১ কেজি';
      normalized.description = rawData.description || rawData.description_bn || '';
      normalized.image_url = rawData.image_url || rawData.image || rawData.products_photos || '';
      normalized.image = normalized.image_url;
      normalized.stock = Number(rawData.stock ?? 10);
      normalized.in_stock = rawData.in_stock !== undefined ? Boolean(rawData.in_stock) : true;
      break;
    }

    // 16. seller_products
    case 'seller_products': {
      normalized.seller_phone = rawData.seller_phone || rawData.phone_number || rawData.phone || '';
      normalized.phone_number = normalized.seller_phone;
      normalized.name = rawData.name || rawData.title || rawData.products_name || '';
      normalized.title = normalized.name;
      normalized.price = Number(rawData.price ?? rawData.regular_price ?? 0);
      normalized.regular_price = Number(rawData.regular_price ?? rawData.price ?? 0);
      normalized.category = rawData.category || 'পাহাড়ি খাঁটি পণ্য';
      normalized.unit = rawData.unit || '১ কেজি';
      normalized.description = rawData.description || rawData.description_bn || '';
      normalized.description_bn = rawData.description_bn || rawData.description || '';
      const prodImg = rawData.image_url || rawData.image || rawData.products_photos || '';
      normalized.image_url = prodImg;
      normalized.image = prodImg;
      if (Array.isArray(rawData.images)) {
        normalized.images = rawData.images;
      } else if (prodImg) {
        normalized.images = [prodImg];
      }
      normalized.stock = Number(rawData.stock ?? 10);
      normalized.in_stock = rawData.in_stock !== undefined ? Boolean(rawData.in_stock) : true;
      normalized.seller_name = rawData.seller_name || rawData.shop_name || rawData.name || '';
      normalized.seller_id = rawData.seller_id || '';
      normalized.district = rawData.district || '';
      normalized.upazila = rawData.upazila || '';
      break;
    }
  }

  // Strict sanitization: ensure ONLY valid schema columns are in the return payload
  const finalCleanPayload: Record<string, any> = {};
  for (const col of allowedColumns) {
    if (normalized[col] !== undefined && normalized[col] !== null) {
      finalCleanPayload[col] = normalized[col];
    }
  }

  return finalCleanPayload;
}

/**
 * Automatically inspects and resolves any File, Blob, or transient data/blob URL
 * into a permanent Supabase Storage public URL.
 */
export async function resolvePermanentStorageUrls(
  tableName: UnifiedTableName,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const fileColumnsMap: Record<string, { bucket: string; folder: string }> = {
    products_photos: { bucket: 'products', folder: 'products' },
    image_url: { bucket: 'products', folder: 'products' },
    photo_url: { bucket: 'avatars', folder: 'profiles' },
    avatar_url: { bucket: 'avatars', folder: 'profiles' },
    photos_cv: { bucket: 'documents', folder: 'resumes' },
    cv_url: { bucket: 'documents', folder: 'resumes' },
    resume_url: { bucket: 'documents', folder: 'resumes' },
    circular_file: { bucket: 'banners', folder: 'circulars' },
  };

  for (const [col, config] of Object.entries(fileColumnsMap)) {
    const val = payload[col];
    if (val) {
      if (val instanceof File || val instanceof Blob || isLocalTransientUrl(val)) {
        try {
          const permanentUrl = await uploadFileToSupabaseStorage(
            config.bucket,
            val,
            typeof val === 'object' && 'name' in val ? (val as any).name : `${col}.jpg`,
            config.folder
          );
          if (permanentUrl) {
            payload[col] = permanentUrl;
          }
        } catch (storageErr) {
          console.warn(`[unifiedRegistrationService] Could not upload ${col} to ${config.bucket}:`, storageErr);
        }
      }
    }
  }

  return payload;
}

// ============================================================================
// 4. CORE SUBMISSION FUNCTION: submitFormData(tableName, formData)
// ============================================================================
/**
 * Universal Form Submission Handler:
 * Accepts tableName and formData, sanitizes the payload strictly against the
 * database schema, and performs an instant Supabase insert.
 *
 * @param tableName - The exact target Supabase table name:
 *   - 'service_providers'
 *   - 'profiles'
 *   - 'products'
 *   - 'product_sellers'
 *   - 'permanent_members'
 *   - 'job_seekers'
 *   - 'job_circulars'
 * @param formData - The form inputs object
 * @returns Promise<UnifiedSubmissionResult>
 */
export async function submitFormData<T extends UnifiedTableName>(
  tableName: T,
  formData: TableFormDataMap[T] | Record<string, any>
): Promise<UnifiedSubmissionResult> {
  // Validate table name
  if (!TABLE_COLUMNS_SCHEMA[tableName]) {
    const validTables = Object.keys(TABLE_COLUMNS_SCHEMA).join(', ');
    return {
      success: false,
      error: `Invalid table name '${tableName}'. Valid tables: ${validTables}`,
      table: tableName,
    };
  }

  // Validate form data
  if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
    return {
      success: false,
      error: `Form data is empty or invalid for table '${tableName}'`,
      table: tableName,
    };
  }

  // Normalize and strictly filter according to exact schema
  const payload = normalizeFormDataForTable(tableName, formData);

  if (Object.keys(payload).length === 0) {
    return {
      success: false,
      error: `No matching schema columns found for table '${tableName}'`,
      table: tableName,
    };
  }

  // Ensure all file and image URLs are uploaded to permanent Supabase Storage
  await resolvePermanentStorageUrls(tableName, payload);

  try {
    if (!isSupabaseConfigured || !supabase) {
      console.warn(`[UnifiedRegistrationService] Supabase not active. Saving fallback record for table '${tableName}'.`);
      return {
        success: true,
        data: payload,
        table: tableName,
        record: payload,
        isLocalFallback: true,
      };
    }

    // Direct Smart Supabase Insert with auto-schema adaptation and full error logging
    const insertRes = await smartSupabaseInsert(tableName, payload);

    if (!insertRes.success) {
      console.error(`[UnifiedRegistrationService] Error inserting into '${tableName}':`, insertRes.error);

      // Check unique constraint error (PostgreSQL 23505)
      const errCode = insertRes.errorCode || insertRes.error?.code;
      const isUniqueErr =
        insertRes.isDuplicate ||
        errCode === '23505' ||
        errCode === 23505 ||
        insertRes.error?.message?.includes('duplicate key') ||
        insertRes.error?.message?.toLowerCase().includes('unique constraint') ||
        insertRes.error?.details?.includes('already exists');

      if (isUniqueErr) {
        const duplicateMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
        return {
          success: false,
          isDuplicate: true,
          errorCode: '23505',
          error: duplicateMsg,
          table: tableName,
          record: payload,
          isLocalFallback: false,
        };
      }

      // Persist to offline storage as fallback safety
      try {
        const localKey = `jhadimadi_offline_submission_${tableName}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
        existing.unshift({ ...payload, submitted_at: new Date().toISOString() });
        localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 100)));
      } catch {}

      return {
        success: false,
        data: payload,
        table: tableName,
        record: payload,
        isLocalFallback: true,
        error: insertRes.error?.message || 'Database insert failed'
      };
    }

    console.info(`[UnifiedRegistrationService] Successfully inserted into '${tableName}' in Supabase.`);
    return {
      success: true,
      data: insertRes.data || payload,
      table: tableName,
      record: insertRes.data || payload,
    };
  } catch (err: any) {
    console.error(`[UnifiedRegistrationService] Error inserting into '${tableName}':`, err);
    return {
      success: false,
      error: err?.message || `Failed to submit data to ${tableName}`,
      table: tableName,
      record: payload,
    };
  }
}

// Convenient function aliases
export const submitToSupabase = submitFormData;
export const submitUnifiedForm = submitFormData;
export const saveToSupabaseTable = submitFormData;
export const insertFormData = submitFormData;

// ============================================================================
// 5. COMPATIBILITY LAYER FOR MULTI-STEP REGISTRATION & MODALS
// ============================================================================

export type UnifiedRegistrationRole = 
  | 'service_provider'
  | 'seller'
  | 'blood_donor'
  | 'job_seeker'
  | 'permanent_member';

export interface UnifiedRegistrationParams {
  role: UnifiedRegistrationRole;
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  password?: string;
  division?: string;
  district: string;
  upazila: string;
  area?: string;
  avatarUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  rolePayload?: Record<string, any>;
  isWillingBlood?: boolean;
  bloodGroup?: string;
}

export interface UnifiedRegistrationResult {
  success: boolean;
  error?: string;
  tableErrors?: string[];
  user?: UserProfile;
  authUserId?: string;
  uniqueId?: string;
  entityRecord?: any;
}

/**
 * Atomic 2-Step Registration Flow with Auth & Multi-table Routing:
 * Used across existing registration modal components.
 */
export async function registerUnifiedEntity(
  params: UnifiedRegistrationParams
): Promise<UnifiedRegistrationResult> {
  const cleanPhone = params.phone.trim().replace(/[^\d]/g, '');
  const cleanName = params.fullName.trim();
  const cleanPassword = (params.password || '').trim() || '123456';
  const cleanEmail = params.email?.trim().toLowerCase() || `${cleanPhone}@jhadimadi.com`;
  const cleanDistrict = params.district || 'খাগড়াছড়ি';
  const cleanUpazila = params.upazila || 'খাগড়াছড়ি সদর';
  const cleanArea = params.area?.trim() || `${cleanUpazila} সদর`;
  const cleanDivision = params.division || 'চট্টগ্রাম';
  const uniqueId = generateDistrictUniqueId(cleanDistrict);

  let authUserId: string | null = null;
  const tableErrors: string[] = [];

  // Step 0: Master Duplicate Data Validation (Phone, NID, Email)
  try {
    const candidateNid = (params.rolePayload?.nid_number || params.rolePayload?.nidNumber || (params as any).nid || '') as string;
    const candidateEmail = params.email || (cleanEmail && !cleanEmail.endsWith('@jhadimadi.com') ? cleanEmail : undefined);
    
    const dupCheck = await validateRegistrationDuplicates({
      phone: cleanPhone,
      nid: candidateNid,
      email: candidateEmail,
      role: params.role,
    });

    if (dupCheck.isDuplicate) {
      return {
        success: false,
        error: dupCheck.message || DUPLICATE_MESSAGES.phone,
        tableErrors: [`duplicate_${dupCheck.field || 'validation'}`],
      };
    }
  } catch (checkErr) {
    console.warn('[UnifiedAuth] Duplicate check note:', checkErr);
  }

  // Step 1: Authentication
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            phone: cleanPhone,
            full_name: cleanName,
            role: params.role,
            district: cleanDistrict,
            upazila: cleanUpazila,
          },
        },
      });

      if (signUpError) {
        const errLower = signUpError.message?.toLowerCase() || '';
        if (errLower.includes('already registered') || errLower.includes('user already exists')) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });
            if (!signInError && signInData?.user) {
              authUserId = signInData.user.id;
            }
          } catch (signInEx) {
            console.warn('[UnifiedAuth] Auto sign-in notice:', signInEx);
          }
        }
      } else if (authData?.user) {
        authUserId = authData.user.id;
      }
    } catch (authEx: any) {
      console.warn('[UnifiedAuth] Supabase auth exception:', authEx);
    }
  }

  const profileDbId = generateSafeUuid(authUserId || undefined);
  const userId = authUserId || profileDbId;
  const avatar = params.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  // Step 2: Profiles Table Submission (Using exact schema with valid UUID id)
  const profilePayload: Partial<ProfileData> & { id?: string } = {
    id: profileDbId,
    full_name: cleanName,
    name: cleanName,
    phone: cleanPhone,
    unique_id: uniqueId,
    email: cleanEmail,
    role: params.role,
    member_type: params.role,
    district: cleanDistrict,
    upazila: cleanUpazila,
    area: cleanArea,
    division: cleanDivision,
    mahalla: cleanArea,
    detailed_address: `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
    address: `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
    photo_url: avatar,
    avatar_url: avatar,
    blood_group: params.bloodGroup || params.rolePayload?.bloodGroup || '',
    is_blood_donor: Boolean(params.isWillingBlood || params.role === 'blood_donor'),
    is_blood_donor_available: true,
    is_nid_verified: Boolean(params.rolePayload?.nidNumber),
    is_paid_member: false,
  };

  const profRes = await submitFormData('profiles', profilePayload);
  const duplicateAlertMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
  if (profRes.isDuplicate || profRes.errorCode === '23505') {
    return {
      success: false,
      error: duplicateAlertMsg,
      tableErrors: ['duplicate_constraint_23505'],
    };
  }
  if (!profRes.success && profRes.error) {
    tableErrors.push(`profiles: ${profRes.error}`);
  }

  let entityRecord: any = null;
  const cleanWhatsapp = (params.whatsapp || params.rolePayload?.whatsapp || params.rolePayload?.whatsappNumber || cleanPhone).trim().replace(/[^\d]/g, '');
  const userLat = params.latitude !== undefined ? params.latitude : (params.rolePayload?.latitude || null);
  const userLng = params.longitude !== undefined ? params.longitude : (params.rolePayload?.longitude || null);

  // Step 3: Role-Specific Table Submission using the exact database schema
  if (params.role === 'service_provider') {
    const payload = params.rolePayload || {};
    const spPayload: ServiceProviderData = {
      name: cleanName,
      full_name: cleanName,
      display_name: cleanName,
      service_type: payload.profession || payload.professionBn || 'ইলেকট্রিশিয়ান (Electrician)',
      phone: cleanPhone,
      phone_number: cleanPhone,
      whatsapp: cleanWhatsapp,
      whatsapp_number: cleanWhatsapp,
      location: `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
      profession_key: payload.profession || payload.professionBn || 'electrician',
      category_bn: payload.professionBn || payload.profession || 'ইলেকট্রিশিয়ান',
      rate_type: 'Daily',
      rate_amount: Number(payload.dailyWage || payload.dailyRate || payload.rate || 600),
      skills: Array.isArray(payload.selectedProfessions) ? payload.selectedProfessions.join(', ') : (payload.skills || 'অভিজ্ঞ কারিগর'),
      district: cleanDistrict,
      upazila: cleanUpazila,
      latitude: userLat,
      longitude: userLng,
      is_available: true,
    };

    const spRes = await submitFormData('service_providers', spPayload);
    if (spRes.isDuplicate || spRes.errorCode === '23505') {
      return {
        success: false,
        error: duplicateAlertMsg,
        tableErrors: ['duplicate_constraint_23505'],
      };
    }
    if (!spRes.success && spRes.error) {
      tableErrors.push(`service_providers: ${spRes.error}`);
    }
    entityRecord = spPayload;

  } else if (params.role === 'seller') {
    const payload = params.rolePayload || {};
    const productName = payload.productNameOrBusiness || payload.productName || payload.shopName || cleanName;

    // Insert into product_sellers table (exact schema)
    const sellerPayload: ProductSellerData = {
      name: cleanName,
      full_name: cleanName,
      products_name: productName,
      phone: cleanPhone,
      phone_number: cleanPhone,
      whatsapp: cleanWhatsapp,
      whatsapp_number: cleanWhatsapp,
      district: cleanDistrict,
      upazila: cleanUpazila,
      latitude: userLat,
      longitude: userLng,
      pass_word: cleanPassword,
      password: cleanPassword,
      description: payload.productDesc || `${productName} - পাহাড়ি খাঁটি পণ্য বিক্রেতা`,
      products_photos: payload.sellerProductImageUrl || avatar,
      blood_group: params.bloodGroup || payload.bloodGroup || '',
    };

    const sellerRes = await submitFormData('product_sellers', sellerPayload);
    if (sellerRes.isDuplicate || sellerRes.errorCode === '23505') {
      return {
        success: false,
        error: duplicateAlertMsg,
        tableErrors: ['duplicate_constraint_23505'],
      };
    }
    if (!sellerRes.success && sellerRes.error) {
      tableErrors.push(`product_sellers: ${sellerRes.error}`);
    }

    // Also insert initial product into products table (exact schema)
    const productPayload: ProductData = {
      products_name: productName,
      products_photos: payload.sellerProductImageUrl || avatar,
      regular_price: Number(payload.price) || 350,
      discount_price: Number(payload.discountPrice) || 300,
      discount_badge: 'নতুন',
      short_description: `${productName} - পাহাড়ি তাজা ও খাঁটি পণ্য।`,
      description: payload.productDesc || `${productName} পাহাড়ি খাঁটি ঐতিহ্যবাহী পণ্য।`,
      sku: `PROD-${Date.now().toString().slice(-6)}`,
      category: payload.category || 'পাহাড়ি খাঁটি পণ্য',
      unit: payload.unit || 'পিস',
      origin: `${cleanUpazila}, ${cleanDistrict}`,
      quality_standard: 'প্রাকৃতিক ও মানসম্মত',
      stock_status: 'in_stock',
      seller_name: cleanName,
      product_reviews: [],
    };

    const prodRes = await submitFormData('products', productPayload);
    if (!prodRes.success && prodRes.error) {
      tableErrors.push(`products: ${prodRes.error}`);
    }

    // Also insert initial product into seller_products table for seller storefront
    try {
      await submitFormData('seller_products', {
        seller_phone: cleanPhone,
        phone_number: cleanPhone,
        name: productName,
        title: productName,
        price: Number(payload.price) || 350,
        regular_price: Number(payload.price) || 350,
        category: payload.category || 'পাহাড়ি খাঁটি পণ্য',
        unit: payload.unit || '১ কেজি',
        description: payload.productDesc || `${productName} - পাহাড়ি খাঁটি পণ্য।`,
        description_bn: payload.productDesc || `${productName} - পাহাড়ি খাঁটি পণ্য।`,
        image_url: payload.sellerProductImageUrl || avatar,
        image: payload.sellerProductImageUrl || avatar,
        images: [payload.sellerProductImageUrl || avatar],
        stock: 50,
        in_stock: true,
        seller_name: cleanName,
        seller_id: uniqueId,
        district: cleanDistrict,
        upazila: cleanUpazila,
      });
    } catch (spErr) {
      console.warn('seller_products initial item notice:', spErr);
    }

    entityRecord = sellerPayload;

  } else if (params.role === 'permanent_member') {
    const payload = params.rolePayload || {};
    const permPayload: PermanentMemberData = {
      name: cleanName,
      full_name: cleanName,
      phone: cleanPhone,
      phone_number: cleanPhone,
      whatsapp: cleanWhatsapp,
      whatsapp_number: cleanWhatsapp,
      district: cleanDistrict,
      upazila: cleanUpazila,
      latitude: userLat,
      longitude: userLng,
      pass_word: cleanPassword,
      password: cleanPassword,
      present_address: payload.presentAddress || `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
      permanent_address: payload.permanentAddress || `${cleanUpazila}, ${cleanDistrict}`,
      education: payload.educationalQualification || payload.education || '',
      educational_qualification: payload.educationalQualification || payload.education || '',
      nid_number: payload.nidNumber || '',
      photos_cv: payload.cvUrl || avatar,
      cv_url: payload.cvUrl || '',
      passport_photo_url: payload.passportPhotoUrl || avatar,
      nid_photo_url: payload.nidPhotoUrl || '',
      father_name: payload.fatherName || '',
      mother_name: payload.motherName || '',
      blood_group: params.bloodGroup || payload.bloodGroup || '',
    };

    const permRes = await submitFormData('permanent_members', permPayload);
    if (permRes.isDuplicate || permRes.errorCode === '23505') {
      return {
        success: false,
        error: duplicateAlertMsg,
        tableErrors: ['duplicate_constraint_23505'],
      };
    }
    if (!permRes.success && permRes.error) {
      tableErrors.push(`permanent_members: ${permRes.error}`);
    }
    entityRecord = permPayload;

  } else if (params.role === 'job_seeker') {
    const payload = params.rolePayload || {};
    const seekerPayload: JobSeekerData = {
      full_name: cleanName,
      phone_number: cleanPhone,
      desired_post: payload.desiredJobTitle || payload.desired_post || payload.category || 'সাধারণ চাকরিপ্রার্থী',
      gender: payload.gender || 'অন্যান্য',
      present_address: payload.presentAddress || `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
      permanent_address: payload.permanentAddress || `${cleanUpazila}, ${cleanDistrict}`,
      district: cleanDistrict,
      upazila: cleanUpazila,
      education: payload.highestEducation || payload.education || 'মাধ্যমিক / স্নাতক',
      work_experience: payload.experienceYears || payload.experience || '১ বছর',
      special_skills: Array.isArray(payload.skills) ? payload.skills.join(', ') : (payload.skills || 'কম্পিউটার ও যোগাযোগ'),
      expected_salary: payload.expectedSalary || 'আলোচনা সাপেক্ষে',
      photos_cv: payload.cvUrl || avatar,
      personal_note: payload.personalNote || '',
    };

    const seekerRes = await submitFormData('job_seekers', seekerPayload);
    if (seekerRes.isDuplicate || seekerRes.errorCode === '23505') {
      return {
        success: false,
        error: duplicateAlertMsg,
        tableErrors: ['duplicate_constraint_23505'],
      };
    }
    if (!seekerRes.success && seekerRes.error) {
      tableErrors.push(`job_seekers: ${seekerRes.error}`);
    }
    entityRecord = seekerPayload;

  } else if (params.role === 'blood_donor') {
    const payload = params.rolePayload || {};
    const donorPayload: BloodDonorData = {
      name: cleanName,
      full_name: cleanName,
      blood_group: params.bloodGroup || payload.bloodGroup || 'O+',
      phone: cleanPhone,
      phone_number: cleanPhone,
      whatsapp: cleanWhatsapp,
      whatsapp_number: cleanWhatsapp,
      district: cleanDistrict,
      upazila: cleanUpazila,
      latitude: userLat,
      longitude: userLng,
      password: cleanPassword,
    };

    const donorRes = await submitFormData('blood_donors', donorPayload);
    if (donorRes.isDuplicate || donorRes.errorCode === '23505') {
      return {
        success: false,
        error: duplicateAlertMsg,
        tableErrors: ['duplicate_constraint_23505'],
      };
    }
    if (!donorRes.success && donorRes.error) {
      tableErrors.push(`blood_donors: ${donorRes.error}`);
    }
    entityRecord = donorPayload;
  }

  // Construct local UserProfile for instant responsive UI feedback
  const userProfile: UserProfile = {
    id: userId,
    uid: userId,
    name: cleanName,
    fullName: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    password: cleanPassword,
    role: params.role as any,
    memberType: params.role as any,
    memberUID: uniqueId,
    district: cleanDistrict,
    upazila: cleanUpazila,
    division: cleanDivision,
    mahalla: cleanArea,
    detailedAddress: `${cleanArea}, ${cleanUpazila}, ${cleanDistrict}`,
    avatar: avatar,
    isBloodDonor: params.isWillingBlood || params.role === 'blood_donor',
    bloodGroup: params.bloodGroup || (params.role === 'blood_donor' ? params.rolePayload?.bloodGroup || 'O+' : undefined),
    isNidVerified: Boolean(params.rolePayload?.nidNumber),
    isPaidMember: false,
    presentAddress: params.rolePayload?.presentAddress || '',
    permanentAddress: params.rolePayload?.permanentAddress || '',
    educationalQualification: params.rolePayload?.educationalQualification || params.rolePayload?.education || '',
    education: params.rolePayload?.educationalQualification || params.rolePayload?.education || '',
    nidNumber: params.rolePayload?.nidNumber || '',
    cvUrl: params.rolePayload?.cvUrl || '',
    cvFileName: params.rolePayload?.cvFileName || '',
    whatsapp: cleanWhatsapp,
    latitude: userLat,
    longitude: userLng,
    createdAt: new Date().toISOString().split('T')[0],
  };

  // Local fallback synchronization
  try {
    await databaseService.saveUserProfile(userProfile, { skipUniqueCheck: true });
    if (params.role === 'service_provider') {
      const spRecord: Partial<ServiceProvider> & Record<string, any> = {
        id: userId,
        user_id: userId,
        name: cleanName,
        nameBn: cleanName,
        realPhone: cleanPhone,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        latitude: userLat,
        longitude: userLng,
        profession: params.rolePayload?.profession || 'সার্ভিস প্রোভাইডার',
        professionBn: params.rolePayload?.professionBn || params.rolePayload?.profession || 'সার্ভিস প্রোভাইডার',
        district: cleanDistrict as any,
        upazila: cleanUpazila,
        rating: 5.0,
        jobsCompleted: 0,
        isAvailable: true,
        memberUID: uniqueId,
        role: 'service_provider',
      };
      await databaseService.saveServiceProviderProfile(spRecord, { skipUniqueCheck: true });
    }
  } catch (localErr) {
    console.warn('[UnifiedRegistrationService] Local save cache notice:', localErr);
  }

  return {
    success: true,
    user: userProfile,
    authUserId: authUserId || undefined,
    uniqueId,
    entityRecord,
    tableErrors: tableErrors.length > 0 ? tableErrors : undefined,
  };
}

/**
 * Validates geographical uniqueness: exactly one permanent member per district & upazila/thana.
 */
export async function checkPermanentMemberSlot(
  district: string,
  upazila: string,
  excludePhone?: string
): Promise<{ available: boolean; existingMember?: any }> {
  try {
    const cleanDist = (district || '').trim();
    const cleanUpz = (upazila || '').trim();
    if (!cleanDist || !cleanUpz) return { available: true };

    // 1. Check permanent_members table in Supabase
    const { data: permList, error: permErr } = await supabase
      .from('permanent_members')
      .select('*')
      .ilike('district', `%${cleanDist}%`)
      .ilike('upazila', `%${cleanUpz}%`);

    if (!permErr && permList && permList.length > 0) {
      const match = excludePhone 
        ? permList.find((m: any) => m.phone_number !== excludePhone && m.phone !== excludePhone)
        : permList[0];
      if (match) {
        return { available: false, existingMember: match };
      }
    }

    // 2. Check profiles table for permanent_member role
    const { data: profList, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.permanent_member,role.eq.permanent,member_type.eq.permanent_member')
      .ilike('district', `%${cleanDist}%`)
      .ilike('upazila', `%${cleanUpz}%`);

    if (!profErr && profList && profList.length > 0) {
      const match = excludePhone
        ? profList.find((p: any) => p.phone !== excludePhone)
        : profList[0];
      if (match) {
        return { available: false, existingMember: match };
      }
    }
  } catch (err) {
    console.warn('Permanent member slot check warning:', err);
  }

  // 3. Check localStorage cache
  try {
    const saved = localStorage.getItem(`perm_member_${district}_${upazila}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (!excludePhone || parsed.phone !== excludePhone)) {
        return { available: false, existingMember: parsed };
      }
    }
  } catch {
    // non-blocking
  }

  return { available: true };
}

/**
 * Searches / retrieves permanent members by district and upazila.
 */
export async function getPermanentMembersByRegion(
  district?: string,
  upazila?: string
): Promise<any[]> {
  try {
    let query = supabase.from('permanent_members').select('*');
    if (district && district.trim()) {
      query = query.ilike('district', `%${district.trim()}%`);
    }
    if (upazila && upazila.trim()) {
      query = query.ilike('upazila', `%${upazila.trim()}%`);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Get permanent members by region error:', err);
  }
  return [];
}

export const unifiedRegistrationService = {
  submitFormData,
  submitToSupabase,
  submitUnifiedForm,
  saveToSupabaseTable,
  insertFormData,
  normalizeFormDataForTable,
  registerUnifiedEntity,
  checkPermanentMemberSlot,
  getPermanentMembersByRegion,
  TABLE_COLUMNS_SCHEMA,
};

export default unifiedRegistrationService;
