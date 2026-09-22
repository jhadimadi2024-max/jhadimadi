import React, { useEffect } from 'react';
import { StoreProduct } from '../data/productsData';
import { Language } from '../utils/translations';
import { ProductDetailsScreen, ProductDetailItem } from './ProductDetailsScreen';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, qty: number) => void;
  onDirectCheckout?: (product: StoreProduct, qty: number) => void;
  onVisitStore?: (sellerIdOrUniqueId: string) => void;
  lang?: Language;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectCheckout,
  lang = 'bn'
}) => {
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const detailItem: ProductDetailItem = {
    id: product.id,
    code: product.code || product.sku || `JDM-${product.id.slice(0, 6).toUpperCase()}`,
    sku: product.sku || product.code || `JDM-${product.id.slice(0, 6).toUpperCase()}`,
    name: lang === 'bn' ? (product.title_bn || product.nameBn) : (product.title_en || product.nameEn || product.nameBn),
    nameBn: product.title_bn || product.nameBn,
    nameEn: product.title_en || product.nameEn,
    title_bn: product.title_bn || product.nameBn,
    title_en: product.title_en || product.nameEn,
    category: product.category,
    categoryLabelBn: product.categoryLabelBn,
    pricePerUnit: product.price,
    discount_price: product.discount_price,
    discountPrice: product.discount_price,
    originalPrice: product.original_price || product.originalPrice,
    unit: product.unit_pack || product.unit || '১ একক',
    unit_pack: product.unit_pack || product.unit || '১ একক',
    stockQuantity: product.stock_quantity ?? product.stock ?? 0,
    stock_quantity: product.stock_quantity ?? product.stock ?? 0,
    minOrderQuantity: 1,
    originLocation: product.origin || '',
    origin: product.origin || '',
    qualityGrade: product.quality_standard || product.qualityStandards || undefined,
    quality_standard: product.quality_standard || product.qualityStandards || undefined,
    seller_info: product.seller_info,
    badges: Array.isArray(product.badges) && product.badges.length > 0 ? product.badges : (product.badge ? [product.badge] : []),
    badge: product.badge,
    key_highlights: Array.isArray(product.key_highlights) && product.key_highlights.length > 0 ? product.key_highlights : product.features,
    how_it_is_produced: product.how_it_is_produced,
    productionMethod: product.how_it_is_produced,
    materials_and_ingredients: product.materials_and_ingredients,
    materials: product.materials_and_ingredients,
    usage_and_storage: product.usage_and_storage,
    usageInstructions: product.usage_and_storage,
    youtubeUrl: product.videoUrl,
    image: getProductPublicUrl(product.image),
    images: (() => {
      const list: string[] = [];
      if (product.image && typeof product.image === 'string' && product.image.trim()) {
        list.push(getProductPublicUrl(product.image.trim()));
      }
      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (typeof img === 'string' && img.trim()) {
            const resolved = getProductPublicUrl(img.trim());
            if (!list.includes(resolved)) {
              list.push(resolved);
            }
          }
        }
      }
      const filtered = list.filter((img: string) => {
        const lower = img.toLowerCase();
        return (
          !lower.includes('demo-image') &&
          !lower.includes('demo_image')
        );
      });
      return filtered.length > 0 ? filtered : (list.length > 0 ? list : (product.image ? [product.image] : []));
    })(),
    description: lang === 'bn' ? (product.descriptionBn || product.description) : (product.descriptionEn || product.description),
    benefits: Array.isArray(product.key_highlights) && product.key_highlights.length > 0 ? product.key_highlights : product.features,
    features: Array.isArray(product.key_highlights) && product.key_highlights.length > 0 ? product.key_highlights : product.features
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={product.nameBn || product.nameEn || 'Product Details'}
    >
      <div className="w-full max-w-5xl bg-white min-h-screen sm:min-h-0 sm:my-6 sm:rounded-3xl relative shadow-2xl overflow-hidden">
        <ProductDetailsScreen
          product={detailItem}
          onBack={onClose}
          onAddToCart={(p, qty) => onAddToCart(product, qty)}
          onBuyNow={(p, qty) => {
            if (onDirectCheckout) {
              onDirectCheckout(product, qty);
            } else {
              onAddToCart(product, qty);
            }
          }}
          lang={lang}
        />
      </div>
    </div>
  );
};

export default ProductDetailModal;
