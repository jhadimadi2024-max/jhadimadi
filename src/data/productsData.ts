export type ProductCategoryKey = 
  | 'Cosmetics'
  | 'Clothing'
  | 'Electronics'
  | 'Medicines'
  | 'Furniture'
  | 'Construction'
  | 'Toys'
  | 'Books'
  | 'RealEstate'
  | 'Food'
  | 'ShutkiSidol'
  | 'Herbal'
  | 'Jhum'
  | 'Jewelry'
  | 'Crafts'
  | 'SpicesGrains'
  | 'CraftsHoney'
  | 'Vehicles'
  | 'HouseRent'
  | 'Education'
  | 'Agri'
  | 'Tour'
  | 'Livestock'
  | 'Health'
  | 'Services'
  | 'Organic'
  | string;

export interface StoreProduct {
  id: string;
  code?: string; // Auto-generated unique product code (e.g. 001, 002)
  sku?: string; // SKU Code
  createdAt?: string; // Creation timestamp for chronological tracking
  created_at?: string; // Supabase PostgreSQL snake_case alias
  title_bn?: string; // Product Name (Bengali)
  title_en?: string; // Product Name (English)
  nameBn: string; // Primary name (Bengali)
  nameEn: string; // Primary name (English)
  category: ProductCategoryKey;
  categoryLabelBn: string;
  price: number;
  discount_price?: number; // Discount / Promo price
  discountPrice?: number;
  original_price?: number; // Supabase snake_case alias
  originalPrice: number; // Regular/Original price before discount
  unit_pack?: string; // e.g., ৳500 / 500 গ্রাম
  unit: string;
  stock_quantity?: number; // Stock quantity
  stock: number;
  badges?: string[]; // Array of tags: e.g., ["ঘরে তৈরি (Homemade)", "১০০% খাঁটি ও পরীক্ষিত"]
  badge?: string; // primary badge tag for simple badges
  badgeColor?: string;
  key_highlights?: string[]; // Array of strings for bullet points
  features?: string[]; // backwards-compatible alias
  benefits?: string[]; // backwards-compatible alias
  how_it_is_produced?: string; // উৎপাদন ও সংগ্রহ প্রণালী
  productionMethod?: string; // backwards-compatible alias
  materials_and_ingredients?: string; // উপাদান ও বৈশিষ্ট্য
  materials?: string; // backwards-compatible alias
  usage_and_storage?: string; // ব্যবহার ও সংরক্ষণ বিধি
  usageInstructions?: string; // backwards-compatible alias
  origin: string; // উৎপাদন স্থল (e.g. "ঘরে তৈরি (Homemade)", "পার্বত্য চট্টগ্রাম")
  productionOrigin?: string;
  production_origin?: string;
  quality_standard?: string; // গুণগত মান (e.g. "১০০% বিশুদ্ধ ও পরীক্ষিত")
  qualityStandards?: string; // backwards-compatible alias
  seller_info?: string; // সরবরাহকারী/বিক্রেতা (e.g. "ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক")
  videoUrl?: string; // YouTube or video showcasing link
  youtubeUrl?: string; // alias
  image: string;
  images?: string[]; // Multiple product images uploaded from device
  rating: number;
  reviewsCount: number;
  descriptionBn?: string;
  descriptionEn?: string;
  description?: string; // backwards-compatible alias
  inStock?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  verifiedSeller?: boolean;
  sellerName?: string;
  sellerPhone?: string;
  sellerPhoneMasked?: string;
  sellerUniqueId?: string;
}

/**
 * Strict Ascending Product Sorting Engine (Locked Sort Order)
 * Ensures the oldest product (e.g. 001) always appears at the very top,
 * followed sequentially by subsequently added products (002, 003, ...).
 * This logic is permanently hardcoded and locked against any template or remix overrides.
 */
export const sortProductsAscending = <T extends Partial<StoreProduct>>(products: T[]): T[] => {
  if (!Array.isArray(products) || products.length <= 1) {
    return Array.isArray(products) ? [...products] : [];
  }

  return [...products].sort((a, b) => {
    // 1. Primary: Compare product code numerically (e.g. 001 < 002 < 003)
    const codeA = a.code ? String(a.code).trim() : '';
    const codeB = b.code ? String(b.code).trim() : '';

    if (codeA && codeB) {
      const matchA = codeA.match(/\d+/);
      const matchB = codeB.match(/\d+/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[0], 10);
        const numB = parseInt(matchB[0], 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB; // Ascending: 1, 2, 3...
        }
      }
      const codeCmp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      if (codeCmp !== 0) return codeCmp;
    } else if (codeA && !codeB) {
      return -1; // Coded items appear first in chronological order
    } else if (!codeA && codeB) {
      return 1;
    }

    // 2. Secondary: Compare creation timestamp ascending (oldest first)
    const timeA = (a as any).created_at || (a as any).createdAt;
    const timeB = (b as any).created_at || (b as any).createdAt;
    if (timeA && timeB) {
      const dateA = new Date(timeA).getTime();
      const dateB = new Date(timeB).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateA - dateB; // Ascending: oldest timestamp first
      }
    } else if (timeA && !timeB) {
      return -1;
    } else if (!timeA && timeB) {
      return 1;
    }

    // 3. Fallback: Stable ID comparison
    const idA = String(a.id || '');
    const idB = String(b.id || '');
    return idA.localeCompare(idB, undefined, { numeric: true });
  });
};

/**
 * Legacy demo product IDs to prevent old browser localStorage or caches
 * from retaining or showing demo items.
 */
export const LEGACY_DEMO_PRODUCT_IDS: Set<string> = new Set([
  'prod_rice_flour',
  'prod_chili_powder',
  'prod_turmeric_powder',
  'prod_hill_ginger',
  'prod_bini_rice',
  'prod_dried_meat_shutki',
  'prod_organic_shutki',
  'prod_chhuri_shutki',
  'prod_shark_shutki',
  'prod_organic_sidal',
  'prod_smartwatch',
  'prod_earbuds',
  'prod_powerbank',
  'prod_mini_fan',
  'prod_bluetooth_speaker',
  'prod_headlamp',
  'prod_pinon_hadi',
  'prod_ethnic_shawl',
  'prod_cotton_kurti',
  'prod_khadi_panjabi',
  'prod_oversized_tshirt',
  'prod_wild_honey',
  'prod_bamboo_shoot',
  'prod_bamboo_basket',
  'prod_realestate_land',
  'prod_tribal_jewelry',
  'prod_houserent_flat',
  'prod_chander_gari',
  'prod_tutor_education',
  'prod_amrapali_mango',
  'prod_sajek_tour_resort',
  'prod_hill_livestock',
  'prod_herbal_hair_oil',
  'prod_organic_facepack',
  'prod_aloevera_gel',
  'prod_herbal_balm',
  'prod_first_aid_box',
  'prod_wooden_easy_chair',
  'prod_solid_wood_table',
  'prod_construction_rod',
  'prod_holcim_cement',
  'prod_educational_wooden_toy',
  'prod_rc_monster_truck',
  'prod_cht_history_book',
  'prod_academic_english_book',
  'prod_jhadimadi_exclusive_box',
  'prod_realestate_mango_orchard',
  'prod_realestate_lakeview_plot'
]);

/**
 * Helper to check if a product is a legacy hardcoded demo product.
 */
export const isLegacyDemoProduct = (productOrId: { id?: string } | string | undefined | null): boolean => {
  if (!productOrId) return false;
  const id = typeof productOrId === 'string' ? productOrId : productOrId.id;
  if (!id) return false;
  return LEGACY_DEMO_PRODUCT_IDS.has(id) || id.startsWith('prod_demo_');
};

/**
 * STORE_PRODUCTS is empty by default.
 * All product names, prices, descriptions, and images are fetched dynamically
 * and exclusively from the Supabase database / live database storage.
 */
export const STORE_PRODUCTS: StoreProduct[] = [];
